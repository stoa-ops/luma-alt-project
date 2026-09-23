# Where We Are

Status snapshot for resuming the Luma-alternative build.

**Last updated:** 2026-09-17

---

## Project context

- Repo: `https://github.com/stoa-ops/luma-alt-project` (local: `/home/alejandro-stoa/Code/luma-alt-project`)
- Plan: `/home/alejandro-stoa/.commandcode/plans/luma-alternative.md` (approved, five phases: foundation → payments → operations → marketing & broadcasts → polish)
- **Local branch is `master`, not `main`** — initial commit was created by `create-next-app`'s built-in `git init`. Rename before pushing (or push as-is and rename on GitHub later). Plan's preference: `main`.
- Nothing has been committed since the scaffold. All Phase 1 work is untracked + uncommitted on `master`.

---

## Phase 1 status — Foundation

### What's done

**Stack & tooling**
- Next.js 16.3.5 (App Router, Turbopack dev), React 19, TypeScript 5.9
- Drizzle ORM 0.45.2 + drizzle-kit 0.31.10
- Postgres drivers installed for both prod (`pg` 8.23 + `pg` adapter) and dev (`@electric-sql/pglite` 0.5.8 + `drizzle-orm/pglite` adapter)
- `tsx` for CLI scripts
- `zod` for validation
- `next.config.ts` has `serverExternalPackages: ["@electric-sql/pglite"]` to keep PGlite's WASM bundle out of Turbopack's processing

**Database**
- `src/lib/db/schema.ts` — full Drizzle schema for users, magic_links, events, ticket_types, orders, order_items, attendees, promo_codes, check_ins, webhook_events. `attendees.ticketTypeId` is nullable (no ticket types required for free RSVPs in Phase 1).
- `drizzle/0000_*.sql` — initial migration generated.
- `src/lib/db/client.ts` — picks PGlite (in-memory) when `DATABASE_URL=pglite`, else `pg` pool. Migrations are applied eagerly on first module import (top-level await).
- `src/lib/db/migrate.ts` — exports `applyMigrationsToPglite(client)` (for in-process use) and `runStandaloneMigrations()` (for CLI scripts).
- `scripts/migrate.ts` — calls `runStandaloneMigrations()`.
- `drizzle.config.ts` — points at the schema with `dialect: "postgresql"`.
- npm scripts: `db:migrate` (`tsx scripts/migrate.ts`), `db:generate` (`drizzle-kit generate`).
- `.env` has `DATABASE_URL=pglite`, `AUTH_SECRET=dev-only-do-not-use-in-prod`, `APP_URL=http://localhost:3000`. `.env.example` documents the prod setup.

**Auth (magic-link, internal-only)**
- `src/lib/auth/session.ts` — token creation, cookie-based session with HMAC signing (`AUTH_SECRET`), `getCurrentUser()` reads cookies server-side. Magic-link delivery is stubbed to `console.log` when `AUTH_EMAIL_FROM` is unset; real delivery (Resend) is Phase 2 work.
- `src/app/api/auth/login/route.ts` — POST `{ email }` → returns `{ ok, url, delivered }`. Validates with `z.email()`.
- `src/app/api/auth/callback/route.ts` — GET consumes the magic link, creates user if needed, sets session cookie, redirects to `/admin`.
- `src/app/api/auth/logout/route.ts` — POST clears the cookie.
- `src/app/login/page.tsx` + `login-form.tsx` — client form; in dev mode, displays the magic link inline so you can click it.

**Admin area (auth-gated)**
- `src/app/admin/layout.tsx` — calls `getCurrentUser()`, redirects to `/login` if absent. Header with nav + sign-out form posting to `/api/auth/logout`.
- `src/app/admin/page.tsx` — dashboard with recent events list.
- `src/app/admin/events/page.tsx` — events list with slug/status/starts.
- `src/app/admin/events/new/page.tsx` — create form (calls `createEvent` server action).
- `src/app/admin/events/[id]/page.tsx` — edit form (calls `updateEvent` server action, bound with `id`).
- `src/app/admin/events/[id]/attendees/page.tsx` — attendee list per event.
- `src/app/admin/events/actions.ts` — `createEvent` and `updateEvent` server actions; zod-validated; slugify + dedupe slug; converts ISO datetime-local strings to `Date`.

**Public event page**
- `src/app/e/[slug]/page.tsx` — renders event; if `status === "published"` shows RSVP form.
- `src/app/e/[slug]/rsvp-form.tsx` — client form.
- `src/app/api/rsvp/[eventId]/route.ts` — POST creates an `order` (`status="paid"`, totals 0) and an `attendee` with a random `qrToken`. Enforces capacity, draft-only blocks. QR token is logged to console in dev.

**Misc**
- `src/app/layout.tsx` and `src/app/page.tsx` — minimal landing linking to `/login`.
- `scripts/seed.ts` — standalone seed for a `phase-1-demo-night` event. Only works against the standalone PGlite; not used in the dev server (see "Current dev workflow" below).
- `src/app/api/_dev/seed/route.ts` — **dev-only** HTTP endpoint that seeds the same event into the running dev server's in-memory PGlite. Returns 404 in production.

### Current dev workflow

```bash
cd /home/alejandro-stoa/Code/luma-alt-project
npm run dev   # boots Next, picks PGlite in-memory, applies migrations on first import
curl -X POST http://localhost:3000/api/_dev/seed   # seed sample event into running dev
curl -X POST http://localhost:3000/api/rsvp/<id> \
  -H "content-type: application/json" \
  -d '{"name":"Alex","email":"alex@stoa.test"}'
```

Auth flow in dev:
1. `POST /api/auth/login` with an email → prints the magic-link URL to the dev-server console and returns it in JSON.
2. Open the URL (or hit it via curl with `-c /tmp/cookies.txt -b /tmp/cookies.txt`) → consumes the link, sets the `luma_session` cookie, redirects to `/admin`.
3. Subsequent requests with `-b /tmp/cookies.txt` hit `/admin/*` successfully.

### Typecheck / build status

- `npx tsc --noEmit` → passes (clean).
- `npm run build` → builds 13 routes (the PGlite-on-Turbopack "Received an instance of URL" warnings appear but build completes).
- Auth + magic-link + session verified end-to-end against the running dev server (see "End-to-end status").

---

## End-to-end status

Verified working against the running dev server:
- ✅ `GET /` → 200
- ✅ `GET /login` → 200
- ✅ `GET /admin` → 307 redirect to `/login` (when unauthenticated)
- ✅ `POST /api/auth/login` → 200, returns magic-link URL
- ✅ `GET /api/auth/callback?token=…&email=…` → 307 to `/admin`, sets session cookie
- ✅ `GET /admin` with cookie → 200, renders dashboard

Not yet verified end-to-end (because of the dev-only seed and RSVP test wiring — see "Known issues"):
- ❌ Event creation through the admin form (server actions can't be invoked by raw curl; use the browser, or use `POST /api/_dev/seed` to seed into the dev server's PGlite)
- ❌ RSVP submission against the running dev server (same reason — needs a known event id)

Both paths exist and code-review clean; they just need a proper browser session or programmatic seed to test.

---

## Known issues / decisions made along the way

1. **`LayoutProps<"/">` is a Next 16 typegen-only export.** Don't reference it from source code — replace with `{ children: React.ReactNode }` (and similarly use `{ params: Promise<{ id: string }> }` for page params). Next 16's `params` is a `Promise`.

2. **PGlite-on-Turbopack URL bug, fixed.** PGlite's WASM bundle does fs calls that confuse Turbopack's module loader. Solved by adding `@electric-sql/pglite` to `serverExternalPackages` in `next.config.ts` — confirmed working in dev. Build is fine; dev is fine.

3. **PGlite in-memory vs file-backed.** Tried file-backed (`.data/pglite`) first, but the WASM-backed FS doesn't share state across Node processes, which made the seed script write to a different PGlite instance than the dev server. Switched to in-memory PGlite; the trade-off is that the dev server's DB is per-process (loses state on restart, fine for dev). Prod uses real Postgres via `DATABASE_URL`.

4. **Auto-migrate on dev boot.** `src/lib/db/client.ts` does `await ready` at module top-level; this applies migrations to the in-memory PGlite the first time it's imported. Production would set `DATABASE_URL=postgres://…` and the migrations would still apply (same `applyMigrationsToPglite` path; for Postgres, switch to `applyMigrationsToNodePool`). Currently only the PGlite path auto-migrates — the `pg` path requires running `npm run db:migrate` separately. That's fine because in prod, migrations should be a manual/cron step anyway.

5. **`pg` vs `postgres` packages.** drizzle-orm 0.45's `node-postgres` adapter still requires the classic `pg` package (not `postgres`). Installed `pg` for prod driver.

6. **Branch is `master`**, not `main`. Plan preference is `main`. Fix on first commit: `git branch -m master main` before pushing, or rename on GitHub.

7. **Phase 1 deliberately avoids ticket tiers** for free RSVPs (`attendees.ticketTypeId` is nullable). Ticket types ship in Phase 2 alongside paid tickets. `order_items` is also unused in Phase 1.

---

## What's next (Phase 1 closeout → Phase 2)

**Close out Phase 1:**
1. Rename branch to `main`.
2. Delete `_dev/seed` route and the `scripts/seed.ts` file (or keep them behind a tighter dev gate; consider moving `_dev/seed` to `/admin/dev/seed` and gating on `NODE_ENV !== "production"`).
3. First commit on `main` covering all the untracked files.
4. Push to GitHub.
5. Manual smoke-test in a browser: log in → create event → publish → RSVP from another browser/incognito → see attendee appear in admin.

**Phase 2 work (Payments):**
- `src/lib/payments/provider.ts` — `PaymentProvider` interface (`createCheckoutSession`, `handleWebhook`, `refund`, `getCharge`).
- `src/lib/payments/stripe.ts` — first impl.
- `src/lib/payments/registry.ts` — pick by env (`PAYMENT_PROVIDER=stripe`).
- `src/app/api/webhooks/stripe/route.ts` — verify signature, upsert `webhook_events` for idempotency, mark order `paid`.
- Ticket-type UI: per-event tier creation form, payment UI on `/e/[slug]`.
- Promo codes UI + validation.
- Refund UI in `/admin/events/[id]/orders`.
- Transactional email (Resend) for confirmation + ticket QR.

**Open decisions still pending** (from the plan's "Open Decisions" section):
- Hosting & real DB (Neon/Supabase/Vercel Postgres vs self-host).
- Resend vs Postmark — recommendation in plan: Resend, with separate sender subdomains for transactional vs marketing.
- Marketing opt-in checkbox copy on the RSVP form (locks before Phase 1 ships).

---

## Key file index

```
drizzle.config.ts                          # drizzle-kit config
drizzle/0000_*.sql                         # initial migration
scripts/migrate.ts                         # CLI migrate
scripts/seed.ts                            # (legacy) standalone seed — superseded by /api/_dev/seed
src/lib/db/client.ts                       # PGlite / pg driver + db export
src/lib/db/migrate.ts                      # applyMigrationsToPglite, runStandaloneMigrations
src/lib/db/schema.ts                       # full schema
src/lib/auth/session.ts                    # magic-link + cookie session
src/app/layout.tsx                         # root layout
src/app/page.tsx                           # landing
src/app/login/page.tsx + login-form.tsx    # sign-in
src/app/api/auth/login/route.ts            # request magic link
src/app/api/auth/callback/route.ts         # consume + create session
src/app/api/auth/logout/route.ts           # destroy session
src/app/api/rsvp/[eventId]/route.ts        # RSVP submission
src/app/api/_dev/seed/route.ts             # DEV-ONLY seed (delete or gate before prod)
src/app/admin/layout.tsx                   # auth guard + nav
src/app/admin/page.tsx                     # dashboard
src/app/admin/events/page.tsx              # event list
src/app/admin/events/new/page.tsx          # create form
src/app/admin/events/[id]/page.tsx         # edit form
src/app/admin/events/[id]/attendees/page.tsx
src/app/admin/events/actions.ts            # createEvent, updateEvent server actions
src/app/e/[slug]/page.tsx                  # public event page
src/app/e/[slug]/rsvp-form.tsx             # client RSVP form
next.config.ts                             # serverExternalPackages for PGlite
.env                                       # dev secrets
.env.example                               # documented env vars
```

---

## Quick-resume command for the next agent

```bash
cd /home/alejandro-stoa/Code/luma-alt-project
# (if dev server isn't running)
npm run dev &
# seed a sample event in the running dev server
curl -X POST http://localhost:3000/api/_dev/seed
# then log in via /login (dev mode prints the magic link)
```

The plan to follow is at `/home/alejandro-stoa/.commandcode/plans/luma-alternative.md`. Phase 1 is functionally complete but needs a real-browser end-to-end smoke test before commit/push.
