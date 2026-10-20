# Leo Learning

Bangla-first course commerce and video-learning platform: discover a course,
watch its free preview, buy it with bKash, learn in a focused player, and
resume on any device. Staff manage the catalog, curriculum, video, orders and
students from one dashboard.

**Stack:** Next.js 14 (App Router, plain JavaScript) · React 18 · MySQL /
MariaDB via `mysql2` (raw SQL, no ORM) · custom cookie auth (scrypt + HMAC,
`lib/auth.js`, RBAC in `lib/rbac.js`) · bKash Tokenized Checkout · S3/R2 or
local private storage · Vitest integration tests against a real database.

---

## Run it locally

```bash
npm install
# apply migrations you haven't run yet (tracked in schema_migrations)
node database/migrate.mjs 028_commerce_learning.sql 029_progress_session.sql
# development server against the local DB, local storage and the bKash simulator
npm run dev:local            # http://localhost:3100  (PORT=3200 npm run dev:local for another port)
npm test                     # integration tests (needs the local DB from .env.local)
```

`npm run dev:local` sets `MYSQL_HOST=` (so `.env.local`'s `MYSQL_SOCKET` is
used, never a remote host from `.env`), `STORAGE_PROVIDER=local`,
`BKASH_SIMULATOR=true` and its own `.next-local` build folder. Plain
`npm run dev` uses your `.env` / `.env.local` exactly as written.

Demo accounts (development seed, `database/seed_users.mjs`, password
`demo1234`): `student@`, `teacher@`, `owner@`, `superadmin@leolearning.app`.
The login page shows quick-login buttons for them only outside production.

## The purchase-to-learning flow

1. **Discover** — `/` and `/courses` are server-rendered from published
   courses only (`lib/catalogRepo.js`); search, filters, sort and page live in
   the URL. Ratings come only from approved reviews by enrolled students.
2. **Preview** — lessons marked *free preview* of a published course play for
   anyone in an accessible dialog. Eligibility is re-checked on every
   playback request (`lib/access.js`).
3. **Buy** — `/checkout?courses=…` (guests log in / sign up and come back).
   `POST /api/orders` prices everything server-side, snapshots item prices,
   applies coupons, and is idempotent (repeat submits reuse the same order
   and bKash payment).
4. **Pay** — the browser goes to bKash; bKash redirects to
   `/api/payments/bkash/callback`. That redirect is never trusted: the server
   calls bKash `execute` (falling back to a `status` query) and only a
   `Completed` payment for the exact stored amount fulfils the order. The
   order and its enrollments commit in one transaction under a row lock.
   Interrupted payments are recovered by `POST /api/orders/:id/reconcile`
   (buyer's "check again" or staff "re-verify pending").
5. **Learn** — `/learn/[course]/[lesson]` (persistent player layout). Video
   URLs are short-lived and signed; captions and resources are access-checked.
6. **Progress** — the player reports the ranges the browser actually *played*
   (seeking doesn't count), capped by elapsed wall time. ≥90% watched
   completes a video; reading lessons use an explicit "mark complete"; quizzes
   and assignments complete on submission. Course completion = unique
   completed lessons ÷ lessons. Resume position follows you across devices.
7. **My Learning** — `/student`: courses with real progress, continue
   targets, orders, certificates, wishlist, account.

Refunds (staff) revoke the access an order granted; the money itself is
returned from the bKash merchant panel.

## Architecture notes

| Area | Where |
|---|---|
| Entitlement (preview / manager / active enrollment) | `lib/access.js` |
| Orders, fulfilment, reconciliation, refunds | `lib/orderRepo.js`, `app/api/orders/*` |
| bKash adapter · dev simulator | `lib/bkash.js` · `lib/bkashSimulator.js`, `app/dev/bkash/pay` |
| Playback, progress, uploads, captions | `lib/videoRepo.js`, `lib/watchRanges.js` |
| Lesson resources | `lib/resourceRepo.js` |
| Storage (s3 / r2 / local signed URLs) | `lib/storage.js`, `lib/signedUrl.js`, `app/api/storage/*` |
| Public catalog read model | `lib/catalogRepo.js` |
| Learner read models (player outline, My Learning) | `lib/learningRepo.js` |
| Rate limiting (in-process) | `lib/rateLimit.js` |
| Cache / robots / security headers | `middleware.js`, `app/robots.js`, `app/sitemap.js` |
| Design system | `app/globals.css`, `components/ui/*`, copy in `lib/copy.js` |
| Motion system (tokens, specs, reduced motion) | `docs/MOTION.md`, `components/ui/motion.js` |
| Course builder (admin) | `components/owner/CoursesTab.jsx`, `components/owner/builder/*` |
| Admin workspace shell, grouped nav, data tables | `app/owner/page.jsx`, `components/owner/adminNav.js`, `components/ui/DataTable.jsx` |
| Offer pricing (one rule for catalog, course page, checkout, order) | `lib/pricing.js`, `lib/offerMath.js`, `lib/offerRepo.js` |
| Badges, purchase counts, ratings | `lib/badges.js`, `lib/catalogRepo.js` (`CARD_SELECT`, `mapCard`) |
| Reviews (one per verified purchaser, edit → re-moderation) | `lib/reviewRepo.js`, `components/ReviewForm.jsx` |
| Subjects / classes | `lib/categoryRepo.js`, `lib/taxonomyRepo.js` |
| Campaigns (carousel slides, popups, `/campaign/[slug]`) | `lib/campaignRepo.js`, `components/home/*` |
| Admin dashboard metrics | `lib/adminOverview.js` |

Language: Bangla by default; the header toggle sets the `leo_lang` cookie so
server-rendered pages follow it.

## Catalog, offers and promotions

- **Purchase count** = distinct students with a paid order line above ৳0 and
  an active enrollment (pending, failed, refunded and free enrollments don't
  count). Free courses show their enrolled count instead.
- **Ratings** use approved reviews only; with none, pages say “No reviews
  yet”. A student can review once per course (paid purchase, or enrollment in
  a free course); editing sends the review back to moderation.
- **Badges**: Top rated (avg ≥ 4.5 from ≥ 10 approved verified-purchase
  reviews), New (first publication within 30 days — republishing doesn't
  reset it), Featured (admin-ordered), Upcoming (announced, not released).
  Thresholds are editable in Admin → Settings.
- **Offers** are automatic discounts (percent ≤ 90 or fixed ৳) scoped to a
  course, subject, class or every paid course. The best live offer prices the
  catalog card, the course page, the checkout quote and the order itself,
  and the order line stores `list_price` + `offer_id`. Struck-through prices
  appear only while an offer is live; the old “regular price” field is no
  longer shown or edited (existing values are kept in the database).
- **Campaigns** (Admin → Campaigns) are carousel slides or popups pointing at
  a real destination (course, subject or class catalog, collection, upcoming
  announcement or their own `/campaign/<slug>` page). One linked to an offer
  is hidden automatically whenever that offer isn't live. Popups show at most
  once per campaign per frequency window (default 24 h) per browser, and
  never on learning, checkout, auth or dashboard pages.

## Migrations

SQL files live in `database/migrations/`. `node database/migrate.mjs <file…>`
applies files once and records them in `schema_migrations`
(`--status` lists them). It reads `.env.local` only when no `MYSQL_*`
variable is set, so it never silently targets a remote database from `.env`.
Migrations 028–030 are additive and idempotent (030 adds class levels,
offers, campaigns, the course waitlist, review uniqueness and the course
fields for featured order / first publication / upcoming release).

## Configuration still required for production

- **bKash** merchant credentials (`BKASH_*`). The adapter follows the
  published Tokenized Checkout v1.2.0-beta contract but has only been
  exercised against the local simulator — verify against your merchant docs
  and sandbox before going live.
- **Object storage** (`STORAGE_*`): an S3/R2 bucket with `videos/`,
  `resources/`, `captions/` private and only `thumbnails/` public.
- **Email** provider for password-reset links (not integrated yet).
- `AUTH_SECRET` (and `STORAGE_SIGNING_SECRET` with local storage).
- A shared store for rate limits if running more than one instance.
