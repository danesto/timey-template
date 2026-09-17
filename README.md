# Timey

A booking system for a small service business — a salon with a few staff, a
few services, and opening hours that differ from day to day.

A customer picks a service, sees the free slots and books one. There is no
account: after booking they get a link containing a token, which is how they
later reschedule or cancel.

**Read [docs/boundaries.md](./docs/boundaries.md) first** — it says what you
build and what is already here.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16, App Router |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite over libSQL |
| ORM and migrations | Drizzle |
| Validation | Zod |
| Package manager | Bun |

Libraries for state, forms and dates are your call. That is one of the
decisions you will be asked to justify.

## Running it

```bash
bun install
cp .env.example .env
bun run db:migrate    # creates local.db from the migrations
bun run db:seed       # fills it with a salon, services and a few bookings
bun run dev
```

The app runs on `http://localhost:3000`.

### Database commands

| Command | What it does |
|---|---|
| `bun run db:migrate` | applies migrations |
| `bun run db:seed` | wipes the data and writes the seed |
| `bun run db:reset` | drops the database, recreates and refills it |
| `bun run db:studio` | opens Drizzle Studio to browse the tables |
| `bun run db:generate` | creates a migration from a changed schema |

When the data gets tangled, `bun run db:reset` puts you back on clean ground.

## Folder layout

The tree is organised **by domain, not by file type**. Everything about
booking sits together instead of being scattered across `components/`,
`hooks/` and `utils/`.

```
app/                    routing, nothing else
  api/                  the API the app consumes      ← off limits
  layout.tsx            root layout
  page.tsx

components/             shared components with no domain knowledge
  ui/                   button, input, modal
  layout/               navigation, footer

features/               domain modules
  booking/
    components/         components specific to booking
    hooks/              client state
    lib/                display helpers
    services/           API calls and data shaping
    schemas.ts          Zod schemas
    server/             API logic                     ← off limits

lib/                    shared foundations
  api/                  response helpers
  db/                   schema, migrations, seed      ← off limits
  time.ts               server-side timezone maths    ← off limits

docs/                   project documentation
```

When you cannot place something: if it only serves booking, it belongs in
`features/booking/`. If it would work in a different app too, it belongs in
`components/ui/` or `lib/`.

## Where the schema lives

`lib/db/schema.ts`. Seven tables: the business, staff,
services, the link between services and staff, working hours, time off and
bookings.

Two conventions are worth knowing:

- **Instants** are stored as UTC seconds
- **Times of day**, such as working hours, are stored as minutes from local
  midnight in the salon's timezone — "we open at nine" does not move when the
  clocks do

Migrations live in `lib/db/migrations/` and are committed to the repository.

## Documentation

- [What you build and what you get](./docs/boundaries.md)
- [API overview](./docs/api.md), with the live reference at `/docs`
