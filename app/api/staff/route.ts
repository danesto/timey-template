import { db, schema } from "@/lib/db";
import { ok } from "@/lib/api/response";

export async function GET() {
  const [rows, pairings] = await Promise.all([
    db.select().from(schema.staff),
    db.select().from(schema.serviceStaff),
  ]);

  return ok(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      serviceIds: pairings
        .filter((pair) => pair.staffId === row.id)
        .map((pair) => pair.serviceId),
    })),
  );
}
