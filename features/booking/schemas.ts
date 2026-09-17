import { z } from "zod";

export const dateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD form.");

export const availabilityQuery = z.object({
  serviceId: z.coerce.number().int().positive(),
  date: dateParam,
  staffId: z.coerce.number().int().positive().optional(),
});

export const availableDaysQuery = z.object({
  serviceId: z.coerce.number().int().positive(),
  from: dateParam,
  to: dateParam,
  staffId: z.coerce.number().int().positive().optional(),
});

export const createBooking = z.object({
  serviceId: z.number().int().positive(),
  staffId: z.number().int().positive(),
  /** ISO instant, as handed out by the availability endpoint. */
  startsAt: z.string().min(1),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(160),
  customerNote: z.string().trim().max(1000).optional(),
});

export const rescheduleBooking = z.object({
  startsAt: z.string().min(1),
  staffId: z.number().int().positive().optional(),
});

export type CreateBookingInput = z.infer<typeof createBooking>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBooking>;

/* Response shapes. These are what the documentation is generated from, so a
   change here shows up in /docs without anyone remembering to update it. */

export const businessResponse = z.object({
  name: z.string(),
  timezone: z.string(),
  slotStepMinutes: z.int(),
  cancellationWindowMinutes: z.int(),
});

export const serviceResponse = z.object({
  id: z.int(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.int(),
  bufferMinutes: z.int(),
  priceCents: z.int(),
});

export const staffResponse = z.object({
  id: z.int(),
  name: z.string(),
  role: z.string().nullable(),
  serviceIds: z.array(z.int()),
});

export const slotResponse = z.object({
  startsAt: z.string(),
  endsAt: z.string(),
  staffIds: z.array(z.int()),
});

export const availabilityResponse = z.object({
  date: z.string(),
  slots: z.array(slotResponse),
});

export const availableDaysResponse = z.object({
  from: z.string(),
  to: z.string(),
  days: z.array(z.string()),
});

export const bookingResponse = z.object({
  token: z.string(),
  staffId: z.int(),
  serviceId: z.int(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerNote: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.enum(["confirmed", "cancelled"]),
});

export const errorResponse = z.object({
  error: z.string(),
  message: z.string(),
});

export const healthResponse = z.object({
  status: z.literal("ok"),
  database: z.literal("connected"),
  seeded: z.boolean(),
  hint: z.string().optional(),
  counts: z.object({
    services: z.int(),
    staff: z.int(),
    bookings: z.int(),
  }),
  serverTime: z.string(),
});

