import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({
    healthy: true,
    status: 200
  })
}
