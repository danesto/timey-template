/**
 * Instants and wall-clock time are not interchangeable: 09:00 in Belgrade is
 * 08:00 UTC in January and 07:00 UTC in July. Everything here crosses that
 * line. Built on Intl, so there is no timezone database to keep current.
 */

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  /** 0 is Sunday, matching Date.prototype.getDay(). */
  weekday: number;
  /** Minutes from local midnight. */
  minutes: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Reads an instant as it would appear on a clock in the given zone. */
export function toZonedParts(unixSeconds: number, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(new Date(unixSeconds * 1000))
      .map((part) => [part.type, part.value]),
  );

  // Some engines render midnight as hour 24 rather than 00.
  const hour = Number(parts.hour) % 24;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAYS.indexOf(parts.weekday as string),
    minutes: hour * 60 + Number(parts.minute),
  };
}

/** How far ahead of UTC the zone is at that instant, in seconds. */
export function offsetSeconds(unixSeconds: number, timeZone: string): number {
  const p = toZonedParts(unixSeconds, timeZone);
  const asIfUtc =
    Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0) / 1000 + p.minutes * 60;
  // Seconds survive the round trip untouched, so only add them back here.
  const seconds = Math.floor(unixSeconds) % 60;
  return asIfUtc + seconds - unixSeconds;
}

/**
 * Turns a wall-clock time in the given zone into an instant. The offset
 * depends on the instant being resolved, so the first pass guesses and the
 * second corrects it across a DST boundary.
 */
export function fromZoned(
  date: { year: number; month: number; day: number },
  minutes: number,
  timeZone: string,
): number {
  const naive =
    Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0) / 1000 + minutes * 60;

  const firstGuess = naive - offsetSeconds(naive, timeZone);
  const corrected = naive - offsetSeconds(firstGuess, timeZone);

  return corrected;
}

/** Parses "2026-10-12" without letting the host timezone interfere. */
export function parseDate(iso: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) throw new Error(`Expected YYYY-MM-DD, received "${iso}"`);

  return { year: +match[1], month: +match[2], day: +match[3] };
}

/** "2026-10-12" as seen in the given zone. */
export function toDateString(unixSeconds: number, timeZone: string): string {
  const p = toZonedParts(unixSeconds, timeZone);

  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Local midnight for a calendar date, as an instant. */
export function startOfDay(iso: string, timeZone: string): number {
  return fromZoned(parseDate(iso), 0, timeZone);
}

/** Midnight that opens the next day; not always 24 hours later. */
export function endOfDay(iso: string, timeZone: string): number {
  const date = parseDate(iso);

  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));

  return fromZoned(
    {
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
      day: next.getUTCDate(),
    },
    0,
    timeZone,
  );
}

/** "09:30" as shown on a clock in that zone. */
export function toClock(unixSeconds: number, timeZone: string): string {
  const { minutes } = toZonedParts(unixSeconds, timeZone);

  const h = Math.floor(minutes / 60);

  const m = minutes % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Every calendar date from `from` to `to`, both ends included. */
export function eachDate(from: string, to: string): string[] {
  const start = parseDate(from);
  const end = parseDate(to);
  const last = Date.UTC(end.year, end.month - 1, end.day);

  const dates: string[] = [];
  for (let i = 0; ; i += 1) {
    const cursor = Date.UTC(start.year, start.month - 1, start.day + i);
    if (cursor > last) break;
    dates.push(new Date(cursor).toISOString().slice(0, 10));
  }
  return dates;
}

