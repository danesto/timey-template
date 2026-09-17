import { sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

import { db, schema } from "@/lib/db";
import { fail, ok } from "@/lib/api/response";

async function count(table: SQLiteTable) {
  const [row] = await db.select({ value: sql<number>`count(*)` }).from(table);
  return Number(row?.value ?? 0);
}

export async function GET() {
  try {
    const [services, staff, bookings, business] = await Promise.all([
      count(schema.services),
      count(schema.staff),
      count(schema.bookings),
      count(schema.business),
    ]);

    const seeded = business > 0 && services > 0 && staff > 0;

    return ok({
      status: "ok",
      database: "connected",
      seeded,
      hint: seeded ? undefined : "Database is empty. Run `bun run db:seed`.",
      counts: { services, staff, bookings },
      serverTime: new Date().toISOString(),
    });
  } catch (cause) {
    console.error("Health check could not reach the database", cause);
    return fail(503, "database_unreachable", "Could not reach the database.");
  }
}
