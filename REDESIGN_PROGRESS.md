# Course-commerce redesign — progress record

Working log so the work can resume accurately. Newest state at the top of each section.

## Done
- **Migrations** 028 (progress ranges, resources, captions, orders idempotency/totals, enrollment provenance) and 029 (progress session ordering). Runner: `node database/migrate.mjs <file>` records applied files in `schema_migrations`. Applied to the local XAMPP DB only.
- **Access**: `lib/access.js` is the single entitlement check (preview = free lesson of a published course; manager = owner/superadmin or the course's instructor; learner = ACTIVE enrollment).
- **Storage**: `lib/storage.js` gains `local` provider (private dir, HMAC-signed expiring URLs, Range streaming via `/api/storage/*`).
- **Progress**: played-ranges model (`lib/watchRanges.js`), elapsed-time cap, sticky completion, stale-save guard, manual completion for reading lessons, quiz/assignment completion hooks.
- **Orders**: idempotency key, pending-payment reuse, row-locked fulfilment, forged-callback safety, status-query fallback, reconciliation, duplicate-purchase flag, scoped refunds, purchase history, quote endpoint.
- **bKash**: adapter fixed to POST `{paymentID}` bodies; dev-only simulator (`BKASH_SIMULATOR=true`, never in production).
- **API lockdown**: students/attendance/submissions/certificates/applications/tenants/teachers/live-classes/Q&A/quizzes; reset token no longer returned; rate limits; `middleware.js` (no-store on API, noindex on private pages, security headers).
- **Catalog read model**: `lib/catalogRepo.js` (published only, verified-review ratings, real enrollment counts).
- **Tests**: 68 passing (`npx vitest run`).

- **Design system** in `app/globals.css` (tokens, components, legacy aliases) + `components/ui/*` (Dialog, Drawer, Accordion, CourseCover, CourseCard, Rating, Price, BrandMark). Fonts: Anek Bangla + Hind Siliguri. Language cookie `leo_lang` so server pages follow the toggle (`lib/lang.js`, `lib/copy.js`).
- **Redesigned (server-rendered)**: `/` (was `/landing`, which now redirects), `/courses`, `/course/[slug]` (+preview dialog, JSON-LD), `/checkout`, `/checkout/result`, `/login` `/register` `/forgot` `/reset` (safe returnTo), `/learn/[slug]/[lessonId]` (persistent player layout), `/student` (My Learning, orders, certificates, wishlist, live classes, account), `/instructor/[id]`, `/verify`, legal pages; sitemap/robots/metadata.
- **Admin course builder**: `components/owner/CoursesTab.jsx` + `components/owner/builder/*`.
- **Browser-verified journeys** (dev server `npm run dev:local`, port 3201 in the preview): visitor preview with captions; forged callback grants nothing; register → returnTo checkout → coupon → simulated bKash → paid → learn; watch → complete; seek ≠ complete; resume after reload.
- Dev test buyer: `journey-buyer-1@example.test` (password per `database/seed_users.mjs` demo convention). Test media: 45 s canvas clip uploaded through the builder to lessons 111/112/121/122 (local storage only).

- Responsive pass at 390 / 768 / 1440 (no horizontal overflow on public, checkout, learning and student pages); keyboard: skip link, dialog/drawer focus trap + restore, tabs with arrow keys, labelled controls.
- Superadmin console moved to the light system; fake "2.1% churn" and "free trial · 12 days" removed; owner sidebar no longer shows the demo center name.
- Removed replaced components (fake PayModal fee flow, hardcoded ResourcesTab, old CheckoutModal, etc.).
- Docs: README rewritten, `.env.example` documents storage/simulator/dev flags.

- **Motion system** (CSS tokens + `usePresence`/`useFlash`/`TabIndicator`/`Reveal`), documented in `docs/MOTION.md`; browser-verified incl. rapid toggles, focus return, video not remounting, and reduced-motion (CSS rules present; JS path simulated by stubbing matchMedia).
- Local `.env.local` sets `MYSQL_SSL=false` (XAMPP MariaDB has no TLS); `lib/mysql.js` rebuilds its pool when settings change.

- **Corrective pass (full width, admin workspace, lesson navigator, Hind Siliguri)**:
  root causes of wasted width were the 1080px StudentShell wrapper, the 1240px container, the 900px lesson pane and fixed maxWidths in admin tabs — all removed; `--app-gutter` 16/24/32px, collapsible 256px sidebar (72px collapsed, remembered) for admin and student.
  Admin rebuilt: grouped nav + breadcrumbs, `DataTable` (search/filters/sort/pagination/states) for courses, students, enrollments, payments, offers, campaigns, blog; course editor tabs Details/Curriculum/Media/Pricing/Publishing/Students in a two-column layout; Subjects and Classes ordered lists; Settings grouped with save feedback and validated badge rules; Dashboard from real queries only (`/api/admin/overview`, the old “56 + n” student number is gone).
  Player: curriculum rows show summary, type, duration, resources and completion; section progress + minutes; active row kept in view; a “কোর্সের পাঠসমূহ” tab under 1100px plus the labelled Lessons drawer; lesson facts panel; collapse remembered.
  Course page: enrolled students' curriculum rows open `/learn/<slug>/<lessonId>` with completion ticks.
  Typography: Hind Siliguri only (400/500/600/700), headings 700, no negative tracking.
- **Catalog stats / reviews / badges / homepage sections / offers / campaigns** (migration 030): see README “Catalog, offers and promotions”. Homepage: carousel → hero → বিষয়ভিত্তিক কোর্স → শ্রেণিভিত্তিক কোর্স (+ অন্যান্য কোর্স = `class=other`) → নির্বাচিত কোর্স → নতুন কোর্স → আসন্ন কোর্স, each with সব দেখুন. Empty sections are hidden rather than padded.
- Checkout now renders the server quote (offers included) instead of raw DB prices.
- Fixes found in browser QA: table `.sr-only` children escaped the scroll container and widened 390px pages (`.table-wrap { position: relative }`); student directory duplicated a student with two accounts.
- **Tests**: 81 passing across 9 files (`npx vitest run`), incl. `catalog-stats-offers` and `admin-taxonomy-settings`.

## Known remaining (not done)
- Reduced-motion behaviour of the carousel/popup was verified by code path and CSS, not by emulating `prefers-reduced-motion` in the browser.
- New Arrivals and Upcoming homepage sections were not seen populated in the browser (no current local course qualifies); their queries are covered by tests.
- Campaign image upload was verified through the same endpoints with a generated image (the browser tool can't pick files).
- Offers have no delete action (disable only), by design to keep order snapshots meaningful.
- Email delivery for password reset (no provider integrated).
- bKash: only exercised against the local simulator; live/sandbox verification needed. Refund money via merchant panel (no refund API call).
- Rate limiting is in-process (single instance).
- Session cookie isn't re-checked against user status per request (a disabled user keeps a valid cookie until it expires, max 7 days).
- Teachers can manage media of courses they instruct; curriculum structure editing is owner/superadmin only.
- Some older owner tabs (batches, fees, attendance, quizzes, messages, reports) keep their inline layouts but render with the new tokens.
