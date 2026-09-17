import { service } from "@/features/booking/serialize";
import { db, schema } from "@/lib/db";
import { ok } from "@/lib/api/response";

export async function GET() {
  const rows = await db.select().from(schema.services);
  return ok(rows.map(service));
}
