import { availableDaysQuery } from "@/features/booking/schemas";
import { findAvailableDays } from "@/features/booking/server/availability";
import { badRequest, ok } from "@/lib/api/response";
import { eachDate } from "@/lib/time";

/** Guards against a client asking for a decade in one request. */
const MAX_DAYS = 62;

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = availableDaysQuery.safeParse(params);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid query parameters.");
  }

  const { from, to } = parsed.data;
  if (from > to) return badRequest("`from` must not be after `to`.");
  if (eachDate(from, to).length > MAX_DAYS) {
    return badRequest(`Range is limited to ${MAX_DAYS} days.`);
  }

  return ok({ from, to, days: await findAvailableDays(parsed.data) });
}
