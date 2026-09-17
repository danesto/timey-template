import { availabilityQuery } from "@/features/booking/schemas";
import { instant } from "@/features/booking/serialize";
import { findSlots, getBusiness } from "@/features/booking/server/availability";
import { badRequest, ok } from "@/lib/api/response";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = availabilityQuery.safeParse(params);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid query parameters.");
  }

  const business = await getBusiness();
  const slots = await findSlots(parsed.data);

  return ok({
    date: parsed.data.date,
    slots: slots.map((slot) => ({
      startsAt: instant(slot.startsAt, business.timezone),
      endsAt: instant(slot.endsAt, business.timezone),
      staffIds: slot.staffIds,
    })),
  });
}
