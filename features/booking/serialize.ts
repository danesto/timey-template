import { compat } from "@/lib/api/compat";
import { fromZoned, toClock, toDateString } from "@/lib/time";
import type { Booking, Service } from "@/lib/db/schema";

/** Instant as sent over the wire. */
export function instant(unixSeconds: number, timezone: string): string {
  if (compat.v1TimeFormat) {
    return `${toDateString(unixSeconds, timezone)} ${toClock(unixSeconds, timezone)}`;
  }
  return new Date(unixSeconds * 1000).toISOString();
}

export function service(row: Service) {
  if (compat.v1ServiceFields) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      duration_minutes: row.durationMinutes,
      buffer_minutes: row.bufferMinutes,
      price_cents: row.priceCents,
    };
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.durationMinutes,
    bufferMinutes: row.bufferMinutes,
    priceCents: row.priceCents,
  };
}

export function booking(row: Booking, timezone: string) {
  return {
    token: row.token,
    staffId: row.staffId,
    serviceId: row.serviceId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerNote: row.customerNote,
    startsAt: instant(row.startsAt, timezone),
    endsAt: instant(row.endsAt, timezone),
    status: row.status,
  };
}

/** Accepts either shape this API hands out. Returns UTC seconds. */
export function parseInstant(value: string, timezone: string): number | null {
  const wallClock = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(value);
  if (wallClock) {
    const [, year, month, day, hour, minute] = wallClock.map(Number);
    return fromZoned({ year, month, day }, hour * 60 + minute, timezone);
  }

  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}
