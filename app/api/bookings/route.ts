import { createBooking as schema } from "@/features/booking/schemas";
import { booking, parseInstant } from "@/features/booking/serialize";
import { getBusiness } from "@/features/booking/server/availability";
import { createBooking } from "@/features/booking/server/bookings";
import { compat } from "@/lib/api/compat";
import { badRequest, fail, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body.");
  }

  const business = await getBusiness();
  const startsAt = parseInstant(parsed.data.startsAt, business.timezone);

  if (startsAt === null) return badRequest("Could not read the given date and time.");

  const result = await createBooking({ ...parsed.data, startsAt });

  if (!result.ok) {
    if (result.reason === "slot_taken") {
      if (compat.v1ErrorEnvelope) return ok({ error: "slot_taken" });
      
      return fail(409, "slot_taken", "That slot has just been taken.");
    }
    if (result.reason === "too_late") {
      return fail(409, "too_late", "That slot is in the past.");
    }
    return badRequest("That barber does not perform the chosen service.");
  }

  return ok(booking(result.booking, business.timezone), { status: 201 });
}
