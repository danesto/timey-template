# Conventions

## Files and folders are kebab-case

Every file and folder is lowercase with hyphens: `booking-form.tsx`,
`use-available-days.ts`, `features/booking/server/`. Components too — the file
is `slot-picker.tsx` even though the component inside it is `SlotPicker`.

`bun run lint` fails on anything else, so this is not a matter of taste or of
someone noticing in review.

Two exceptions, both enforced by the rule itself:

- **Next.js route grammar** — `[token]`, `(group)`, `@slot` are how the
  framework reads the folder tree, so `app/` allows them.
- **Generated folders** — migrations and the design files are ignored.

Why it is worth a rule rather than a habit: macOS treats `Button.tsx` and
`button.tsx` as the same file and Linux does not. A rename that changes only
capitalisation looks fine on your machine, gets committed as no change at all,
and then fails the build on CI with a module that cannot be found. One
convention, mechanically enforced, removes the whole category.

## Where code goes

Organised by domain, not by file type. Everything about booking lives together
instead of being scattered across `components/`, `hooks/` and `utils/`.

| | |
|---|---|
| `app/` | routing only: layouts, pages, route handlers |
| `components/ui/` | primitives with no domain knowledge |
| `components/layout/` | navigation, footer, shell |
| `features/<domain>/` | everything belonging to one domain |
| `lib/` | shared foundations used by more than one domain |

When you cannot place something: if it only serves booking, it belongs in
`features/booking/`. If it would work unchanged in a different app, it belongs
in `components/ui/` or `lib/`.

Inside a feature:

| | |
|---|---|
| `components/` | components specific to this domain |
| `hooks/` | client state for this domain |
| `lib/` | pure helpers, formatting, small calculations |
| `services/` | calls to the API and shaping for the screen |
| `schemas.ts` | Zod schemas |

## Language

Code, comments, commit messages and API responses are in English. Only what a
customer reads on screen is in Serbian.
