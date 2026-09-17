import { getBusiness } from "@/features/booking/server/availability";
import { ok } from "@/lib/api/response";

export async function GET() {
  const business = await getBusiness();

  return ok({
    name: business.name,
    timezone: business.timezone,
    slotStepMinutes: business.slotStepMinutes,
    cancellationWindowMinutes: business.cancellationWindowMinutes,
  });
}
