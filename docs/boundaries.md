# What you build and what you get

This repository is not an empty project. Part of the work is already done, and
that part is **off limits** on purpose — it simulates what you would get from backend or other teams.

## Already here

|                                     | Where                      |
| ----------------------------------- | -------------------------- |
| Database, migrations and seed data  | `lib/db/`                  |
| The API the app consumes            | `app/api/`                 |
| Slot computation                    | `features/booking/server/` |
| Server-side timezone maths          | `lib/time.ts`              |
| API documentation                   | `/docs` in the running app |
| CI, PR template, definition of done | `.github/`                 |

Treat everything in that table as somebody else's service: read it, rely on
it, do not change it. If something in it gets in your way or looks wrong —
**reach out. It is encouraged to reach out and ask questions** That is an important part of the work

## Yours to build

- Every page and component
- The layer that calls the API and shapes data for the screen
- Choosing a service, showing free slots, the booking form
- The confirmation page, and the page for rescheduling and cancelling by token
- **Displaying** times in the viewer's timezone
- Optimistic updates and handling a rejected booking
- Loading, error and empty states
- A responsive layout
- Regression tests when something breaks
- A green CI and a deploy

## Why the line sits there

Timezones are the clearest example. The server already hands you correct
instants in UTC, so you never compute an offset — that problem is solved and
solving it again would teach you nothing.

**Displaying** those instants in the timezone of the person looking at the
screen is yours, and that is where it usually goes wrong. The same logic runs
through the rest: you get what another team would hand you, and you build what
you would be responsible for.
