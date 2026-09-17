/**
 * Fills an empty database with a small barbershop: three barbers, four
 * services, weekly hours, a day off, and a few bookings already in the diary.
 *
 *   bun run db:seed
 */
import { fromZoned, toDateString, parseDate } from "../time";
import { db, schema } from "./index";

const TIMEZONE = "Europe/Belgrade";
const DAY = 86400;

/** Wall-clock time in the shop's own zone, `dayOffset` days from today. */
function at(dayOffset: number, hour: number, minute = 0) {
  const iso = toDateString(Math.floor(Date.now() / 1000) + dayOffset * DAY, TIMEZONE);
  return fromZoned(parseDate(iso), hour * 60 + minute, TIMEZONE);
}

async function seed() {
  // Order matters: children first, so foreign keys never dangle.
  await db.delete(schema.bookings);
  await db.delete(schema.timeOff);
  await db.delete(schema.workingHours);
  await db.delete(schema.serviceStaff);
  await db.delete(schema.services);
  await db.delete(schema.staff);
  await db.delete(schema.business);

  await db.insert(schema.business).values({
    name: "Brica Barbershop",
    timezone: TIMEZONE,
    slotStepMinutes: 15,
    cancellationWindowMinutes: 120,
  });

  const barbers = await db
    .insert(schema.staff)
    .values([
      { name: "Miloš Rakić", role: "barber" },
      { name: "Stefan Ilić", role: "barber" },
      { name: "Vuk Đorđević", role: "senior barber" },
    ])
    .returning();

  const [milos, stefan, vuk] = barbers;

  const catalogue = await db
    .insert(schema.services)
    .values([
      {
        name: "Šišanje",
        description: "Klasično šišanje sa pranjem i styling-om.",
        durationMinutes: 45,
        bufferMinutes: 15,
        priceCents: 150000,
      },
      {
        name: "Brijanje",
        description: "Brijanje britvom, uz toplu oblogu.",
        durationMinutes: 30,
        bufferMinutes: 10,
        priceCents: 120000,
      },
      {
        name: "Oblikovanje brade",
        description: "Skraćivanje i oblikovanje, sa negom.",
        durationMinutes: 30,
        bufferMinutes: 10,
        priceCents: 90000,
      },
      {
        name: "Šišanje i brada",
        description: "Celo sređivanje, kosa i brada zajedno.",
        durationMinutes: 75,
        bufferMinutes: 15,
        priceCents: 220000,
      },
    ])
    .returning();

  const [cut, shave, beard, full] = catalogue;

  // Not everyone does everything; Vuk only takes the razor work.
  await db.insert(schema.serviceStaff).values([
    { serviceId: cut.id, staffId: milos.id },
    { serviceId: cut.id, staffId: stefan.id },
    { serviceId: beard.id, staffId: milos.id },
    { serviceId: beard.id, staffId: stefan.id },
    { serviceId: beard.id, staffId: vuk.id },
    { serviceId: shave.id, staffId: vuk.id },
    { serviceId: full.id, staffId: milos.id },
  ]);

  // Weekdays plus Saturday morning. Sunday closed.
  const weekdays = [1, 2, 3, 4, 5].flatMap((weekday) => [
    { staffId: milos.id, weekday, startMinute: 9 * 60, endMinute: 17 * 60 },
    { staffId: stefan.id, weekday, startMinute: 11 * 60, endMinute: 19 * 60 },
    { staffId: vuk.id, weekday, startMinute: 10 * 60, endMinute: 15 * 60 },
  ]);

  await db.insert(schema.workingHours).values([
    ...weekdays,
    { staffId: milos.id, weekday: 6, startMinute: 9 * 60, endMinute: 14 * 60 },
    { staffId: stefan.id, weekday: 6, startMinute: 9 * 60, endMinute: 14 * 60 },
  ]);

  await db.insert(schema.timeOff).values([
    { staffId: milos.id, startsAt: at(3, 0), endsAt: at(4, 0), reason: "Slobodan dan" },
    { staffId: stefan.id, startsAt: at(2, 13), endsAt: at(2, 15), reason: "Lekar" },
  ]);

  await db.insert(schema.bookings).values([
    {
      token: "seed-tok-0001",
      staffId: milos.id,
      serviceId: cut.id,
      customerName: "Ana Ilić",
      customerEmail: "ana@example.com",
      startsAt: at(1, 9),
      endsAt: at(1, 9, 45),
      blockedUntil: at(1, 10),
    },
    {
      token: "seed-tok-0002",
      staffId: milos.id,
      serviceId: full.id,
      customerName: "Jovana Marić",
      customerEmail: "jovana@example.com",
      startsAt: at(2, 9),
      endsAt: at(2, 10, 15),
      blockedUntil: at(2, 10, 30),
    },
    {
      token: "seed-tok-0003",
      staffId: vuk.id,
      serviceId: shave.id,
      customerName: "Marko Savić",
      customerEmail: "marko@example.com",
      startsAt: at(1, 12),
      endsAt: at(1, 12, 30),
      blockedUntil: at(1, 12, 40),
    },
    {
      token: "seed-tok-0004",
      staffId: stefan.id,
      serviceId: cut.id,
      customerName: "Petar Kostić",
      customerEmail: "petar@example.com",
      startsAt: at(1, 14),
      endsAt: at(1, 14, 45),
      blockedUntil: at(1, 15),
      status: "cancelled",
    },
  ]);

  console.log("Seeded: 1 shop, 3 barbers, 4 services, 4 bookings.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
