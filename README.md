# Timey

A booking system for a small service business — a barbershop with a few staff,
a few services, and opening hours that differ from day to day.

A customer picks a service, sees the free slots and books one. There is no
account: after booking they get a link containing a token, which is how they
later reschedule or cancel.

## Start here

**[docs/boundaries.md](./docs/boundaries.md)** — what you build, and what is
already here and stays untouched. Read it before anything else; it is the
shortest page in the repository and it decides what the next eight weeks look
like.

## Running it

```bash
bun install
cp .env.example .env
bun run db:migrate    # creates local.db from the migrations
bun run db:seed       # fills it with a barbershop, services and a few bookings
bun run dev
```

The app runs on `http://localhost:3000`.

If a screen comes up empty later, check `http://localhost:3000/api/health`
first — it answers `seeded: false` until the seed has been run, which is the
usual cause.

## The designs

```bash
bun run wireframes
```

You can find the wireframes for every screen in `design/index.html` — the
command above opens it, or open the file yourself. Desktop and phone: choosing
a service, choosing a barber, the calendar and the slots, the form, the
confirmation, and the page for rescheduling or cancelling by token.

Three things worth noticing:

- **They are grey on purpose.** The layout, the hierarchy and which data
  appears where are settled. Colour, type and the visual language are not —
  those are yours to decide, and to explain.
- **The empty, loading and conflict states have their own frames.** Those three
  are the ones usually left until last, and the ones a customer runs into on an
  ordinary day.
- **Each screen says which call feeds it**, so the set doubles as a map to the
  API.

## The API

You build against it; you do not change it. Browse it while the app is running:

- **`http://localhost:3000/docs`** — every endpoint, with request examples
- **[docs/api.md](./docs/api.md)** — the same list, plus the business rules a
  schema cannot express: buffers, the slot grid, the cancellation deadline

Worth knowing up front: a slot is longer than the appointment, because every
service reserves time after it. `endsAt` is what you show the customer; the
extra time never appears on screen.

## Where code goes

Organised **by domain, not by file type**. Everything about booking sits
together instead of being scattered across `components/`, `hooks/` and
`utils/`.

```
app/                    routing, nothing else
  api/                  the API the app consumes      ← off limits
  layout.tsx            root layout
  page.tsx

components/             shared components with no domain knowledge
  ui/                   shadcn primitives: button, input, calendar, …
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
design/                 wireframes
```

When you cannot place something: if it only serves booking, it belongs in
`features/booking/`. If it would work in a different app too, it belongs in
`components/ui/` or `lib/`.

**Every file and folder is kebab-case** — `booking-form.tsx`, not
`BookingForm.tsx`. `bun run lint` fails on anything else. See
[conventions](./docs/conventions.md) for why that is a rule and not a habit.

## Tech stack

|                    |                        | Docs                                                            |
| ------------------ | ---------------------- | --------------------------------------------------------------- |
| Framework          | Next.js 16, App Router | [nextjs.org/docs](https://nextjs.org/docs)                      |
| Language           | TypeScript             | [typescriptlang.org/docs](https://www.typescriptlang.org/docs/) |
| Styling            | Tailwind CSS 4         | [tailwindcss.com/docs](https://tailwindcss.com/docs)            |
| Components         | shadcn/ui              | [ui.shadcn.com/docs](https://ui.shadcn.com/docs)                |
| Database           | SQLite over libSQL     | [docs.turso.tech](https://docs.turso.tech/sdk/ts/quickstart)    |
| ORM and migrations | Drizzle                | [orm.drizzle.team](https://orm.drizzle.team/docs/overview)      |
| Validation         | Zod                    | [zod.dev](https://zod.dev)                                      |
| Package manager    | Bun                    | [bun.com/docs](https://bun.com/docs)                            |

Next.js and Tailwind are the two you will live in. If you have not used the App
Router before, start with [routing](https://nextjs.org/docs/app/building-your-application/routing)
and [data fetching](https://nextjs.org/docs/app/building-your-application/data-fetching).

shadcn/ui is already set up so the time goes into booking, not into styling a
button. The components live in `components/ui/` as ordinary files you own and
can change. `Calendar` wraps [react-day-picker](https://daypicker.dev), and the dates from
`/api/availability/days` drop straight into its `disabled` and `modifiers`
props.

Libraries for state, forms and data fetching are your call, and so is dropping
shadcn for something else — just be ready to say why. That is one of the
decisions you will be asked to justify.

## Documentation

- [What you build and what you get](./docs/boundaries.md)
- [Conventions](./docs/conventions.md), including the naming rule
- [API overview](./docs/api.md), with the live reference at `/docs`

---

## Reference: the database

You will not need this often — the API is what you talk to — but it is here
when you want to know where a value comes from.

### Commands

| Command               | What it does                                 |
| --------------------- | -------------------------------------------- |
| `bun run db:reset`    | drops the database, recreates and refills it |
| `bun run db:seed`     | wipes the data and writes the seed           |
| `bun run db:migrate`  | applies migrations                           |
| `bun run db:studio`   | opens Drizzle Studio to browse the tables    |
| `bun run db:generate` | creates a migration from a changed schema    |

When the data gets tangled, `bun run db:reset` puts you back on clean ground.

### Schema

`lib/db/schema.ts`. Seven tables: the business, staff, services, the link
between services and staff, working hours, time off and bookings. Migrations
live in `lib/db/migrations/` and are committed.

Two conventions explain most of it:

- **Instants** are stored as UTC seconds
- **Times of day**, such as working hours, are stored as minutes from local
  midnight in the shop's timezone — "we open at nine" does not move when the
  clocks do
