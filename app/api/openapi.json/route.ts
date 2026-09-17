import { buildOpenApiDocument } from "@/features/booking/openapi";
import { ok } from "@/lib/api/response";

export async function GET() {
  return ok(buildOpenApiDocument());
}
