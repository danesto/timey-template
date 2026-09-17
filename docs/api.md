# API

The reference is generated from the code and served by the running app:

- **[`/docs`](http://localhost:3000/docs)** — browsable, with request examples
- **`/api/openapi`** — the OpenAPI 3.0 document itself

Both come from the same Zod schemas the endpoints validate against, so they
cannot drift from the implementation.

## Endpoints at a glance

| | |
|---|---|
| `GET /api/health` | is the API up, and has the seed been run |
| `GET /api/business` | timezone, slot grid, cancellation window |
| `GET /api/services` | what can be booked, with duration and price |
| `GET /api/staff` | the barbers, and which services each one takes |
| `GET /api/availability` | free slots on one date |
| `GET /api/availability/days` | dates in a range that have any free slot |
| `POST /api/bookings` | create a booking, returns its token |
| `GET /api/bookings/{token}` | read one booking |
| `PATCH /api/bookings/{token}` | move it |
| `DELETE /api/bookings/{token}` | cancel it |

Start with `GET /api/health` on a fresh clone: it answers `seeded: false`
until `bun run db:seed` has been run, which is the usual reason an otherwise
correct screen comes up empty.

## Rules the schema cannot express

An OpenAPI document describes shapes, not behaviour. These are the rules
behind them.

**A slot is longer than the appointment.** Every service has a buffer after
it. A 45 minute cut with a 15 minute buffer holds the hour, but the customer
is told 10:00–10:45. `endsAt` is what you show; the extra time never appears.

**Slots start on a grid.** `slotStepMinutes` from `/business` says how often a
booking may begin — every 15 minutes by default — regardless of how long the
service runs.

**A slot can belong to several barbers.** `staffIds` lists everyone free at
that moment. Send exactly one of them when booking.

**Availability is per barber.** Working hours, time off and existing bookings
all differ by person, so two barbers rarely offer the same day.

**Cancelling has a deadline.** `cancellationWindowMinutes` from `/business` is
how close to the appointment a cancellation is still accepted. Past it the
endpoint refuses. Cancelling an already cancelled booking is not an error.

**Rescheduling keeps the token.** The link a customer already has keeps
working after the appointment moves.

**Nothing may be booked in the past**, however the request arrives.
