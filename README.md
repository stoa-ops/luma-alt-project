# Luma Alt

An internal event-management application built with Next.js, Drizzle, and
Postgres. The current foundation supports allowlisted magic-link sign-in,
event management, public event pages, free RSVP, and attendee lists.

## Local Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
3. Use `DATABASE_URL=pglite` for an ephemeral database that resets when the
   development server restarts.
4. Run `npm run dev` and open `http://localhost:3000`.
5. Sign in as an address in `ADMIN_EMAIL_ALLOWLIST`. In development, the
   one-time link is displayed on the login page and printed by the server.

When `ADMIN_EMAIL_ALLOWLIST` is omitted in development, only
`admin@example.com` is allowed.

## Database

The development PGlite database applies checked-in migrations when the app
starts. Production uses persistent Postgres and never runs migrations from the
application process.

Generate a migration after changing `src/lib/db/schema.ts`:

```bash
npm run db:generate
```

Apply migrations to persistent Postgres with an explicit shell environment:

```bash
DATABASE_URL='postgres://...' npm run db:migrate
```

The migration command intentionally rejects an unset URL or `pglite` because
that would migrate a disposable database.

## Verification

```bash
npm run typecheck
npm run build
```

There is not yet an automated test suite or lint configuration.

## Production Configuration

Production currently requires:

- `DATABASE_URL`: persistent Postgres connection string
- `AUTH_SECRET`: random session-signing secret
- `ADMIN_EMAIL_ALLOWLIST`: comma-separated administrator addresses
- `APP_URL`: public HTTPS origin
- `RESEND_API_KEY`: Resend API key
- `AUTH_EMAIL_FROM`: verified sender address

The planned production target is Vercel with Supabase Postgres and Storage.
