import { z } from "zod";

import * as s from "./schemas";

/** OpenAPI 3.0 keeps `nullable`, which is what Zod emits for that target. */
const schema = (value: z.ZodType) =>
  z.toJSONSchema(value, { target: "openapi-3.0", io: "output" });

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const json = (name: string) => ({
  content: { "application/json": { schema: ref(name) } },
});

const errors = (...codes: [number, string][]) =>
  Object.fromEntries(
    codes.map(([code, description]) => [
      String(code),
      { description, ...json("Error") },
    ]),
  );

const query = (name: string, description: string, required = true) => ({
  name,
  in: "query" as const,
  required,
  description,
  schema: { type: "string" as const },
});

export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Timey API",
      version: "1.0.0",
      description:
        "Booking for a single business. Customers are not authenticated; a " +
        "booking is reached through the token returned when it is created.",
    },
    servers: [{ url: "/api" }],
    tags: [
      { name: "Catalogue", description: "What can be booked, and by whom." },
      { name: "Availability", description: "Free slots and free days." },
      { name: "Bookings", description: "Creating and changing a booking." },
    ],
    paths: {
      "/business": {
        get: {
          tags: ["Catalogue"],
          summary: "Business settings",
          description:
            "Timezone, the grid slots start on, and how long before an " +
            "appointment cancellation is still allowed.",
          responses: { "200": { description: "OK", ...json("Business") } },
        },
      },
      "/services": {
        get: {
          tags: ["Catalogue"],
          summary: "List services",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "array", items: ref("Service") },
                },
              },
            },
          },
        },
      },
      "/staff": {
        get: {
          tags: ["Catalogue"],
          summary: "List staff",
          description:
            "`serviceIds` says which services each barber takes, so a chooser " +
            "can be built before a date is picked.",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "array", items: ref("StaffMember") },
                },
              },
            },
          },
        },
      },
      "/availability": {
        get: {
          tags: ["Availability"],
          summary: "Free slots on one date",
          description:
            "Every slot carries the barbers free at that moment. Leave " +
            "`staffId` out to see all of them at once.",
          parameters: [
            query("serviceId", "Service being booked."),
            query("date", "Calendar date, YYYY-MM-DD, read in the business timezone."),
            query("staffId", "Narrow the result to one barber.", false),
          ],
          responses: {
            "200": { description: "OK", ...json("Availability") },
            ...errors([400, "Missing or malformed query parameters."]),
          },
        },
      },
      "/availability/days": {
        get: {
          tags: ["Availability"],
          summary: "Dates with at least one free slot",
          description:
            "For greying out full and closed days in a date picker without " +
            "asking about every day separately. Limited to 62 days per call.",
          parameters: [
            query("serviceId", "Service being booked."),
            query("from", "First date in the range, YYYY-MM-DD."),
            query("to", "Last date in the range, YYYY-MM-DD."),
            query("staffId", "Narrow the result to one barber.", false),
          ],
          responses: {
            "200": { description: "OK", ...json("AvailableDays") },
            ...errors([400, "Bad range, or one longer than 62 days."]),
          },
        },
      },
      "/bookings": {
        post: {
          tags: ["Bookings"],
          summary: "Create a booking",
          description:
            "Returns the booking including its token. Keep the token: it is " +
            "the only way back to this booking.",
          requestBody: { required: true, ...json("CreateBooking") },
          responses: {
            "201": { description: "Created", ...json("Booking") },
            ...errors(
              [400, "Invalid body, or a service that barber does not perform."],
              [409, "The slot was taken, or it lies in the past."],
            ),
          },
        },
      },
      "/bookings/{token}": {
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            description: "Token handed out when the booking was created.",
            schema: { type: "string" },
          },
        ],
        get: {
          tags: ["Bookings"],
          summary: "Read a booking",
          responses: {
            "200": { description: "OK", ...json("Booking") },
            ...errors([404, "No booking with that token."]),
          },
        },
        patch: {
          tags: ["Bookings"],
          summary: "Move a booking",
          description:
            "A different barber may be given as well, as long as they " +
            "perform the service.",
          requestBody: { required: true, ...json("RescheduleBooking") },
          responses: {
            "200": { description: "OK", ...json("Booking") },
            ...errors(
              [400, "Invalid body, or the booking is cancelled."],
              [404, "No booking with that token."],
              [409, "The slot was taken, or it lies in the past."],
            ),
          },
        },
        delete: {
          tags: ["Bookings"],
          summary: "Cancel a booking",
          description:
            "Refused once the appointment is closer than the cancellation " +
            "window returned by /business. Cancelling twice is not an error.",
          responses: {
            "200": { description: "Cancelled", ...json("Booking") },
            ...errors(
              [404, "No booking with that token."],
              [409, "Too late to cancel."],
            ),
          },
        },
      },
    },
    components: {
      schemas: {
        Business: schema(s.businessResponse),
        Service: schema(s.serviceResponse),
        StaffMember: schema(s.staffResponse),
        Slot: schema(s.slotResponse),
        Availability: schema(s.availabilityResponse),
        AvailableDays: schema(s.availableDaysResponse),
        Booking: schema(s.bookingResponse),
        CreateBooking: schema(s.createBooking),
        RescheduleBooking: schema(s.rescheduleBooking),
        Error: schema(s.errorResponse),
      },
    },
  };
}
