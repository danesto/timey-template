/**
 * Instants are stored as UTC seconds. Times of day, such as working hours, are
 * stored as minutes from local midnight in the business timezone: opening
 * hours do not shift when the clocks do.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** The business itself. This table always holds exactly one row. */
export const business = sqliteTable("business", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** IANA name, e.g. "Europe/Belgrade". */
  timezone: text("timezone").notNull(),
  /** Slots are offered on this grid, in minutes. 15 means 09:00, 09:15, … */
  slotStepMinutes: integer("slot_step_minutes").notNull().default(15),
  /** A booking can no longer be cancelled once it is this close. */
  cancellationWindowMinutes: integer("cancellation_window_minutes")
    .notNull()
    .default(120),
});

/** Someone who can be booked. */
export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** Shown under the name, e.g. "barber". */
  role: text("role"),
});

/** Something a customer books, with its own length. */
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  /** Cleanup or turnaround time reserved after the appointment ends. */
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  /** Minor units, so 250000 is 2.500,00 RSD. Never a float. */
  priceCents: integer("price_cents").notNull().default(0),
});

/** Not everyone performs every service. */
export const serviceStaff = sqliteTable(
  "service_staff",
  {
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("service_staff_pair").on(table.serviceId, table.staffId),
  ],
);

/** Weekly availability. `weekday` follows getDay(): 0 is Sunday. */
export const workingHours = sqliteTable(
  "working_hours",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    /** Minutes from local midnight. 540 is 09:00. */
    startMinute: integer("start_minute").notNull(),
    /** Exclusive. 1020 is 17:00. */
    endMinute: integer("end_minute").notNull(),
  },
  (table) => [index("working_hours_staff").on(table.staffId, table.weekday)],
);

/** One-off exceptions that beat the weekly rule: holidays, sick days, leave. */
export const timeOff = sqliteTable(
  "time_off",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    reason: text("reason"),
  },
  (table) => [index("time_off_staff").on(table.staffId, table.startsAt)],
);

export const bookingStatuses = ["confirmed", "cancelled"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

/** Customers never sign in; a booking is reached through its `token`. */
export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    token: text("token").notNull(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerNote: text("customer_note"),
    /** Inclusive start, exclusive end. What the customer is told. */
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    /** End of the window the barber is actually held for, buffer included. */
    blockedUntil: integer("blocked_until").notNull(),
    status: text("status", { enum: bookingStatuses })
      .notNull()
      .default("confirmed"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("bookings_token").on(table.token),
    index("bookings_staff_window").on(table.staffId, table.startsAt),
    /**
     * Guards the exact-duplicate race. Partial overlaps are caught in the
     * availability layer; SQLite has no exclusion constraint.
     */
    uniqueIndex("bookings_no_double_booking")
      .on(table.staffId, table.startsAt)
      .where(sql`status = 'confirmed'`),
  ],
);

export type Business = typeof business.$inferSelect;
export type StaffMember = typeof staff.$inferSelect;
export type Service = typeof services.$inferSelect;
export type WorkingHour = typeof workingHours.$inferSelect;
export type TimeOff = typeof timeOff.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
