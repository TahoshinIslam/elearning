# Deployment guide

Phase 1 production-environment setup for Leo Learning. This covers what exists
today (database connectivity, environment variables, health checks, logging);
it does not cover payment or video integration (Phase 3/4) or hosting/CDN/
monitoring provisioning (Phase 10) — those need their own setup once the
Phase 1 code lands.

**Chosen stack (recorded for later phases):**
- Payment gateway: **bKash**
- File/video storage: **S3-compatible (AWS S3 or Cloudflare R2)**
- Managed MySQL: cloud-hosted (provider not yet chosen — PlanetScale, AWS RDS,
  and DigitalOcean Managed MySQL are all compatible with the app's existing
  `mysql2`-based repository layer with no code changes beyond connection config)
- Hosting: not yet chosen

## 1. Environment variables

Copy [`.env.example`](.env.example) to `.env.local` for local development, or
set the same keys in your hosting platform's environment variable settings
for production. Every variable is documented inline in that file. Nothing in
this app reads a `.env` file other than `.env.local` (see `.gitignore`) —
production must set real environment variables through the platform, not a
committed file.

**Required in every environment:**
- `AUTH_SECRET` — session-signing key. Generate with `openssl rand -hex 32`.
  The app falls back to a hardcoded dev value (`lib/auth.js:13`) if unset —
  production must never run on that fallback.

**Required for the database — pick one:**
- `MYSQL_HOST` (+ `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`) for
  a TCP connection to managed/cloud MySQL. This is the production path.
- `MYSQL_SOCKET` for a local Unix-socket connection during development only.

If neither is set, `lib/mysql.js` now throws a clear configuration error on
first database use instead of silently trying a path that only ever existed
on one developer's machine.

**Not yet consumed by any code** (documented in `.env.example` ahead of
Phase 3/4/6 so the shape is agreed early): `BKASH_*`, `STORAGE_*`.

## 2. Database

1. Provision a managed MySQL 8 instance (PlanetScale / AWS RDS / DigitalOcean
   Managed MySQL, or equivalent).
2. Apply the 21 migrations in `database/migrations/` **in order**, `001` through
   `021`. There is no migration runner in this project yet — until one exists,
   apply them by hand in numeric order against the target database:
   ```bash
   for f in database/migrations/*.sql; do
     mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" < "$f"
   done
   ```
   (Run this from a trusted machine/CI step — never with credentials in shell
   history on a shared box.)
3. Seed demo accounts if needed: `node database/seed_users.mjs` and
   `node database/seed_quizzes.mjs`, pointed at the same environment variables.
4. Set `MYSQL_SSL=true` (the default) unless the provider explicitly says TLS
   isn't required — most managed providers require it.

Schema changes needed for Phase 3 (`orders`, `order_items`, `payment_events`)
and Phase 4 (`video_assets`, `lesson_progress`) should be added as new
numbered migrations (`022_orders.sql`, etc.), never as edits to the existing
files — the existing 21 migrations are the historical record of what's
already been applied to any running database.

## 3. Health check

`GET /api/health` (`app/api/health/route.js`) returns:
```json
{ "ok": true, "service": "leo-learning", "time": "...", "db": "up" }
```
with HTTP 200 when the database is reachable, or `"db": "down"` with HTTP 503
when it isn't. No internal error detail is returned in the response (it's
logged server-side instead — see below) so this is safe to point an uptime
monitor or a platform's own health-check probe at directly.

## 4. Connection resilience

`lib/mysql.js`'s `q()` helper now retries a query up to 3 times with a short
backoff on transient connection errors (`ECONNREFUSED`, `ENOENT`,
`PROTOCOL_CONNECTION_LOST`, `ETIMEDOUT`, `ECONNRESET`) before surfacing the
error — this covers a cold connection pool or a brief network blip to a
managed database, which is common right after a deploy or scale-up event.
It does not retry query errors that aren't connection-related (a bad query
still fails immediately, as it should).

## 5. Logging

`lib/logger.js` is a minimal structured logger with no external dependency:
single-line JSON in production (`NODE_ENV=production`), human-readable in
development. `lib/repo.js`'s `errResponse()` (the catch-all for every API
route's unhandled errors) and `lib/mysql.js`'s query/health-check failure
paths now go through it instead of a bare `console.error`. This is a starting
point — swapping in a hosted log sink or an APM tool (Phase 10) means
changing `lib/logger.js` in one place, not every call site.

## 6. What Phase 1 deliberately does not include

- No payment gateway integration (bKash) — that's Phase 3, once `orders` and
  `payment_events` exist.
- No S3/R2 upload wiring for thumbnails, lesson resources, or video — that's
  Phase 4/6, once the storage provider's exact bucket/region is provisioned.
- No hosting provider is chosen yet — this document is written to be
  host-agnostic (anything that runs `next build && next start` and lets you
  set environment variables works) until that decision is made.
- No CDN, error-monitoring (Sentry), analytics, or backup policy — Phase 10.
