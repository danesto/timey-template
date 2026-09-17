import { randomBytes } from "node:crypto";
import { and, eq, gt, lt, ne } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getBusiness } from "./availability";

export type BookingResult =
  | { ok: true; booking: schema.Booking }
  | { ok: false; reason: "slot_taken" | "not_bookable" | "too_late" };

const token = () => randomBytes(16).toString("base64url");

/** Confirmed bookings and time off that collide with the window. */
async function isFree(staffId: number, start: number, end: number, ignoreId?: number) {
  const clashes = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.staffId, staffId),
        ne(schema.bookings.status, "cancelled"),
        lt(schema.bookings.startsAt, end),
        gt(schema.bookings.blockedUntil, start),
      ),
    );

  if (clashes.some((row) => row.id !== ignoreId)) return false;

  const off = await db
    .select({ id: schema.timeOff.id })
    .from(schema.timeOff)
    .where(
      and(
        eq(schema.timeOff.staffId, staffId),
        lt(schema.timeOff.startsAt, end),
        gt(schema.timeOff.endsAt, start),
      ),
    );

  return off.length === 0;
}

export async function createBooking(input: {
  serviceId: number;
  staffId: number;
  startsAt: number;
  customerName: string;
  customerEmail: string;
  customerNote?: string;
}): Promise<BookingResult> {
  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, input.serviceId))
    .limit(1);
  if (!service) return { ok: false, reason: "not_bookable" };

  const [pairing] = await db
    .select()
    .from(schema.serviceStaff)
    .where(
      and(
        eq(schema.serviceStaff.serviceId, input.serviceId),
        eq(schema.serviceStaff.staffId, input.staffId),
      ),
    )
    .limit(1);
  if (!pairing) return { ok: false, reason: "not_bookable" };

  if (input.startsAt < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "too_late" };
  }

  const endsAt = input.startsAt + service.durationMinutes * 60;
  const blockEnd = endsAt + service.bufferMinutes * 60;

  if (!(await isFree(input.staffId, input.startsAt, blockEnd))) {
    return { ok: false, reason: "slot_taken" };
  }

  try {
    const [row] = await db
      .insert(schema.bookings)
      .values({
        token: token(),
        serviceId: input.serviceId,
        staffId: input.staffId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerNote: input.customerNote,
        startsAt: input.startsAt,
        endsAt,
        blockedUntil: blockEnd,
      })
      .returning();
    return { ok: true, booking: row };
  } catch {
    // The unique index is the last line of defence when two requests race.
    return { ok: false, reason: "slot_taken" };
  }
}

export async function findByToken(value: string) {
  const [row] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.token, value))
    .limit(1);
  return row;
}

export async function cancelBooking(value: string) {
  const row = await findByToken(value);
  if (!row) return { ok: false as const, reason: "not_found" as const };
  if (row.status === "cancelled") return { ok: true as const, booking: row };

  const business = await getBusiness();
  const deadline = row.startsAt - business.cancellationWindowMinutes * 60;
  if (Math.floor(Date.now() / 1000) > deadline) {
    return { ok: false as const, reason: "too_late" as const };
  }

  const [updated] = await db
    .update(schema.bookings)
    .set({ status: "cancelled", updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.bookings.id, row.id))
    .returning();
  return { ok: true as const, booking: updated };
}

export async function rescheduleBooking(
  value: string,
  input: { startsAt: number; staffId?: number },
) {
  const row = await findByToken(value);
  if (!row) return { ok: false as const, reason: "not_found" as const };
  if (row.status === "cancelled") {
    return { ok: false as const, reason: "not_bookable" as const };
  }

  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, row.serviceId))
    .limit(1);
  if (!service) return { ok: false as const, reason: "not_bookable" as const };

  const staffId = input.staffId ?? row.staffId;
  const endsAt = input.startsAt + service.durationMinutes * 60;
  const blockEnd = endsAt + service.bufferMinutes * 60;

  if (input.startsAt < Math.floor(Date.now() / 1000)) {
    return { ok: false as const, reason: "too_late" as const };
  }
  if (!(await isFree(staffId, input.startsAt, blockEnd, row.id))) {
    return { ok: false as const, reason: "slot_taken" as const };
  }

  const [updated] = await db
    .update(schema.bookings)
    .set({
      staffId,
      startsAt: input.startsAt,
      endsAt,
      blockedUntil: blockEnd,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(schema.bookings.id, row.id))
    .returning();
  return { ok: true as const, booking: updated };
}
