import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { eachDate, endOfDay, fromZoned, parseDate, startOfDay, toZonedParts } from "@/lib/time";

export type Slot = {
  /** UTC seconds. */
  startsAt: number;
  endsAt: number;
  /** Everyone free for this slot; the caller picks one when booking. */
  staffIds: number[];
};

type Interval = { start: number; end: number };

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export async function getBusiness() {
  const [row] = await db.select().from(schema.business).limit(1);
  if (!row) throw new Error("Business row is missing; run the seed.");
  return row;
}

type Context = Awaited<ReturnType<typeof loadContext>>;

/**
 * Everything needed to compute slots across a date range, fetched once.
 * Walking a month day by day would otherwise mean three queries per day.
 */
async function loadContext(options: {
  serviceId: number;
  from: string;
  to: string;
  staffId?: number;
}) {
  const business = await getBusiness();
  const tz = business.timezone;

  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, options.serviceId))
    .limit(1);
  if (!service) return null;

  const eligible = await db
    .select({ staffId: schema.serviceStaff.staffId })
    .from(schema.serviceStaff)
    .where(eq(schema.serviceStaff.serviceId, service.id));

  const staffIds = eligible
    .map((row) => row.staffId)
    .filter((id) => options.staffId === undefined || id === options.staffId);
  if (staffIds.length === 0) return null;

  const rangeStart = startOfDay(options.from, tz);
  const rangeEnd = endOfDay(options.to, tz);

  const [hours, off, taken] = await Promise.all([
    db
      .select()
      .from(schema.workingHours)
      .where(inArray(schema.workingHours.staffId, staffIds)),
    db
      .select()
      .from(schema.timeOff)
      .where(
        and(
          inArray(schema.timeOff.staffId, staffIds),
          lt(schema.timeOff.startsAt, rangeEnd),
          gt(schema.timeOff.endsAt, rangeStart),
        ),
      ),
    db
      .select()
      .from(schema.bookings)
      .where(
        and(
          inArray(schema.bookings.staffId, staffIds),
          ne(schema.bookings.status, "cancelled"),
          lt(schema.bookings.startsAt, rangeEnd),
          gt(schema.bookings.blockedUntil, rangeStart),
        ),
      ),
  ]);

  const busy = new Map<number, Interval[]>(staffIds.map((id) => [id, []]));
  for (const row of off) {
    busy.get(row.staffId)?.push({ start: row.startsAt, end: row.endsAt });
  }
  for (const row of taken) {
    busy.get(row.staffId)?.push({ start: row.startsAt, end: row.blockedUntil });
  }

  return { business, tz, service, hours, busy };
}

function slotsForDate(context: Context, date: string, now: number): Slot[] {
  if (!context) return [];
  const { business, tz, service, hours, busy } = context;

  const blockSeconds = (service.durationMinutes + service.bufferMinutes) * 60;
  const step = business.slotStepMinutes * 60;
  const weekday = toZonedParts(startOfDay(date, tz), tz).weekday;
  const parsed = parseDate(date);

  // Collected per instant so one time can offer several people.
  const byStart = new Map<number, Set<number>>();

  for (const window of hours) {
    if (window.weekday !== weekday) continue;

    const windowStart = fromZoned(parsed, window.startMinute, tz);
    const windowEnd = fromZoned(parsed, window.endMinute, tz);
    const taken = busy.get(window.staffId) ?? [];

    for (let start = windowStart; start + blockSeconds <= windowEnd; start += step) {
      if (start < now) continue;

      const candidate = { start, end: start + blockSeconds };
      if (taken.some((interval) => overlaps(candidate, interval))) continue;

      const entry = byStart.get(start) ?? new Set<number>();
      entry.add(window.staffId);
      byStart.set(start, entry);
    }
  }

  return [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, ids]) => ({
      startsAt: start,
      endsAt: start + service.durationMinutes * 60,
      staffIds: [...ids].sort((a, b) => a - b),
    }));
}

/** Free slots for one service on one calendar date. */
export async function findSlots(options: {
  serviceId: number;
  /** YYYY-MM-DD, read in the business timezone. */
  date: string;
  staffId?: number;
  now?: number;
}): Promise<Slot[]> {
  const context = await loadContext({ ...options, from: options.date, to: options.date });
  return slotsForDate(context, options.date, options.now ?? Math.floor(Date.now() / 1000));
}

/** Dates in the range that have at least one free slot. */
export async function findAvailableDays(options: {
  serviceId: number;
  from: string;
  to: string;
  staffId?: number;
  now?: number;
}): Promise<string[]> {
  const context = await loadContext(options);
  if (!context) return [];

  const now = options.now ?? Math.floor(Date.now() / 1000);
  return eachDate(options.from, options.to).filter(
    (date) => slotsForDate(context, date, now).length > 0,
  );
}
