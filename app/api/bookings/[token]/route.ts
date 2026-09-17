import { rescheduleBooking as schema } from "@/features/booking/schemas";
import { booking, parseInstant } from "@/features/booking/serialize";
import { getBusiness } from "@/features/booking/server/availability";
import {
  cancelBooking,
  findByToken,
  rescheduleBooking,
} from "@/features/booking/server/bookings";
import { badRequest, fail, notFound, ok } from "@/lib/api/response";

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  const row = await findByToken(token);
  if (!row) return notFound("No booking with that token.");

  const business = await getBusiness();
  return ok(booking(row, business.timezone));
}

export async function PATCH(request: Request, context: Context) {
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body.");
  }

  const business = await getBusiness();
  const startsAt = parseInstant(parsed.data.startsAt, business.timezone);
  if (startsAt === null) return badRequest("Could not read the given date and time.");

  const result = await rescheduleBooking(token, {
    startsAt,
    staffId: parsed.data.staffId,
  });

  if (!result.ok) {
    if (result.reason === "not_found") return notFound("No booking with that token.");
    if (result.reason === "slot_taken") {
      return fail(409, "slot_taken", "That slot has just been taken.");
    }
    if (result.reason === "too_late") {
      return fail(409, "too_late", "That slot is in the past.");
    }
    return badRequest("A cancelled booking cannot be rescheduled.");
  }

  return ok(booking(result.booking, business.timezone));
}

export async function DELETE(_request: Request, context: Context) {
  const { token } = await context.params;
  const result = await cancelBooking(token);

  if (!result.ok) {
    if (result.reason === "not_found") return notFound("No booking with that token.");
    return fail(409, "too_late", "Too late to cancel.");
  }

  const business = await getBusiness();
  return ok(booking(result.booking, business.timezone));
}
