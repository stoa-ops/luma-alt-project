<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guide

## Sources of Truth

- `README.md` is still the create-next-app scaffold and even refers to `app/` instead of this repo's `src/app/`; trust scripts and source over it.
- `where-we-are.md` is a dated handoff snapshot, not executable truth. In particular, its passing-build and migration-parity claims are currently stale.

## Commands

- Development: `npm run dev`.
- Typecheck: `npx tsc --noEmit` (there is no package script for it).
- Production build: `npm run build`.
- After editing `src/lib/db/schema.ts`: `npm run db:generate`; generated migrations and metadata live in `drizzle/`.
- Apply migrations to real Postgres with an explicit shell environment, for example `DATABASE_URL='postgres://...' npm run db:migrate`. The standalone script does not load Next's `.env` files.
- There are currently no lint, formatter, or test scripts/configs. Do not claim those checks ran.

## Architecture

- This is one Next.js 16 App Router app. UI and route handlers are under `src/app`; shared database and auth code is under `src/lib`.
- `src/app/admin/layout.tsx` gates the entire admin tree. Event mutations are authenticated Server Actions in `src/app/admin/events/actions.ts`.
- Public events render at `/e/[slug]`; free RSVP writes a zero-total `paid` order plus an attendee through `/api/rsvp/[eventId]`.
- Dynamic route `params` and page `searchParams` are promises in this Next version. Read the relevant local guide in `node_modules/next/dist/docs/` and await them.
- Keep `@electric-sql/pglite` in `serverExternalPackages` in `next.config.ts`; removing it breaks PGlite's WASM under Turbopack.

## Database and Auth Traps

- `DATABASE_URL` unset or exactly `pglite` selects a process-local, in-memory PGlite database. `src/lib/db/client.ts` migrates it on first import, and restarting the dev server erases it.
- `npm run db:migrate` with PGlite only migrates a temporary database that is immediately closed. It is for explicit Postgres URLs; it does not initialize the running dev database.
- `scripts/seed.ts` uses a separate file-backed `.data/pglite` database and does not seed the dev server. While the server is running, use `POST /api/_dev/seed`; it is disabled in production.
- Auth requires `AUTH_SECRET`. With `AUTH_EMAIL_FROM` unset, login returns the magic-link URL and logs it to the server. Setting `AUTH_EMAIL_FROM` currently reports delivery without sending mail because delivery is not implemented.

## Current Verification Caveats

- `npx tsc --noEmit` passes.
- A default-PGlite `npm run build` currently fails during prerender because concurrent imports race the eager migration (`relation "attendees" already exists`). Do not report a clean build until this is fixed or a valid external Postgres build path is verified.
- `src/lib/db/schema.ts` makes `attendees.ticketTypeId` nullable, but `drizzle/0000_bored_gladiator.sql` still declares `ticket_type_id NOT NULL`. A fresh migrated database cannot execute the current free-RSVP insert until a follow-up migration is generated.
