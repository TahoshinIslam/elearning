# Leo Learning — Production Migration Plan

**Status:** Phase 0 output — analysis only, no code was modified to produce this document.
**Source:** Full repository audit (architecture, database, security, checkout/enrollment/video/progress trace), 2026-09-02.
**Scope of this file:** architecture map, database schema map, API route list, authentication flow, current production blockers, and deployment requirements — the six inputs Phase 1 onward needs before any code changes begin.

---

## 1. Architecture map

### 1.1 Current architecture

```
Browser (all pages are 'use client')
  │
  │  RTK Query hooks in context/AppContext.jsx fetch whole-screen datasets
  ▼
Next.js API routes — app/api/**/route.js (~45 files)
  │  Each route is its own auth boundary. There is NO middleware.js in the repo:
  │  nothing enforces a default-deny, so a route that forgets a guard is simply open.
  ▼
Repository layer
  │  lib/repo.js (502 lines) — courses, modules, lessons, enrollments, payments,
  │  submissions, attendance, certificates, jobs, applications, live_classes,
  │  students, batches, teachers, tenants.
  │  + 16 sibling lib/*Repo.js files, one per feature added after the MVP:
  │  authRepo, quizRepo, couponRepo, reviewRepo, wishlistRepo, blogRepo, pathRepo,
  │  qaRepo, referralRepo, affiliateRepo, demoClassRepo, homepageRepo, settingsRepo,
  │  categoryRepo, contactRepo, notifRepo, reportRepo.
  │  All of the above use parameterized mysql2 queries — no SQL injection surface found.
  ▼
lib/mysql.js — a singleton connection pool on globalThis
  │  Defaults: socketPath '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  │  user 'root', password '', database 'e-learning'. No retry, no health check,
  │  no reconnection logic. This process died mid-audit and took every DB-backed
  │  page down with a raw 500 and a stack trace — no user-facing degradation path.
  ▼
MySQL 8, database "e-learning", 45 tables, 21 hand-written migrations
  applied by pasting SQL into phpMyAdmin — no migration runner, no ORM.
```

`lib/db.js` is a separate, complete in-memory prototype database (the original hackathon-style seed). It is confirmed imported by **zero** files in the current codebase — dead code, safe to delete, not on the request path.

### 1.2 Structural risk this creates

1. **No default-deny.** Because every route re-implements its own auth check, eight GET routes currently have none at all (see §5.4 / §5, "Security").
2. **The client is trusted wherever a route forgot to re-derive a value server-side.** Checkout price and enrollment identity are the two cases that matter most (§5.1, §5.2).
3. **The DB connection has no resilience story**, which is a deployment blocker on its own (§6).

### 1.3 Recommended target architecture (incremental — extend, don't rewrite)

```
Browser
  ▼
middleware.js (NEW) ── role/route gate, default-deny for anything not explicitly public
  ▼
API routes (existing ~45, each still does its own ownership checks)
  ▼
Repository layer (existing lib/repo.js + 16 siblings — KEPT AS-IS, this layer is sound)
  ▼
lib/mysql.js (existing, hardened: env-driven config, connection retry, health check)
  ▼
Managed MySQL (production) ── replaces the local XAMPP dependency
  +
  NEW tables: orders, order_items, payment_events, video_assets, lesson_progress
```

The persistence layer does not need to be replaced. The gaps are additive: an orders/payment state machine, a video asset model, a progress table, a middleware auth default, and a fix to the `users` ↔ `students` identity split (§5.5). None of these require re-platforming the existing 45-table schema or the repository pattern already in place.

---

## 2. Database schema map

45 tables across `database/migrations/001_init_schema.sql` through `021_staff_sections.sql`. Grouped by domain; only non-obvious relationships and problems are called out (full constraint-level detail is in the prior audit).

### 2.1 Identity & access

| Table | Role | Notes |
|---|---|---|
| `users` | Real auth identity (migration 003) | `role` ENUM: student, teacher, owner, superadmin (mentor/parent were added in migration 010, then **removed** in migration 021 — see §5.6) |
| `students` | Legacy per-batch identity (migration 001) | Every business table below FKs to `students.id`, **not** `users.id` |
| `tenants` | Coaching-center record | Only `users` and `coupons` actually reference `tenant_id` — no other business table is tenant-scoped |
| `mentor_students` | Mentor↔student link (migration 010) | **Orphaned**: the `'mentor'` role it depends on no longer exists (migration 021) |

**Critical gap:** `lib/authRepo.js:29-52` (`createUser`, called by self-registration) inserts only into `users`. It never creates or links a `students` row. Confirmed live against the project's own database: 3 self-registered accounts (`role='student'`) have `student_id = NULL` and therefore cannot enroll, submit assignments, appear in attendance, or be certified. **This is the #1 fix in Phase 2.**

### 2.2 Courses & curriculum

| Table | Role | Notes |
|---|---|---|
| `courses` | Catalog | No `tenant_id`; `category` is free text, disconnected from the later `categories` table (migration 018) |
| `modules` → `lessons` | Curriculum tree | `lessons` columns: id, module_id, title, type ENUM(video,pdf,quiz,assignment), duration VARCHAR, is_free, position. **No video/asset column exists at all.** |
| `course_learning_points`, `course_requirements`, `course_faqs`, `course_reviews` | Course detail content | `course_reviews.student_id` (migration 007) has **no foreign key** — no enrollment check gates who may review |
| `categories` (migration 018) | Category management | Not referenced by any FK from `courses` — fully disconnected from the data it's meant to manage |

### 2.3 Commerce (the core gap)

| Table | Role | Notes |
|---|---|---|
| `payments` | Transaction record | `status` ENUM is **only** `('success','refunded')` — no pending/failed state is representable. `trx_id` is app-generated (`TRX${rand(8)}`), not gateway-issued. |
| `enrollments` | Access grant | Unique key is `(student_id, batch_id)`, **not** `(student_id, course_id)` — a student can hold two enrollments for one course via two batches |
| `coupons` | Discount codes | `used_count` is a bare counter with no per-user redemption ledger and no bounded/transactional increment — race condition allows over-redemption |
| **`orders`** | — | **Does not exist.** No table anywhere represents "checkout started, awaiting payment." |
| **`order_items`** | — | **Does not exist.** |
| **`payment_events`** | — | **Does not exist.** No webhook idempotency is possible without this. |

### 2.4 Learning & progress

| Table | Role | Notes |
|---|---|---|
| `attendance`, `submissions` | Live-class attendance, assignment grading | These are what `lib/progress.js` derives "course completion %" from — a batch/live-class model, not a video-watch model |
| `quiz_questions/options/attempts/answers` (migration 004) | MCQ engine | `quiz_attempts` has `UNIQUE(lesson_id, student_id)` — correctly prevents duplicate score rows. No enrollment check gates who may attempt. |
| `certificates` | Completion record | `cert_no` is sequential (`LEO-2026-0001…`) and enumerable via a public, unrate-limited verify endpoint |
| **`video_assets`** | — | **Does not exist.** Nothing in the schema can reference an actual video file. |
| **`lesson_progress` / `course_progress`** | — | **Does not exist.** No watch position, resume timestamp, or per-lesson completion anywhere in any of the 21 migrations (confirmed by direct grep). |

### 2.5 Everything else (real, working, lower priority)

`blog_posts`, `wishlist` (correctly unique-constrained), `learning_paths`/`path_courses`, `lesson_questions`/`lesson_answers` (Q&A), `referrals`, `affiliates`/`affiliate_sales` (the latter has a dangling `course_id` with no FK), `demo_classes`/`demo_class_registrations`, `homepage_content`, `site_settings`, `notifications`, `contact_messages`, `jobs`/`job_skills`/`applications`, `live_classes`, `batches`, `teachers`/`teacher_batches`/`teacher_expertise`.

**Schema-wide gaps:** no soft-delete pattern anywhere (`deleted_at` grep returns zero hits — every delete is a hard `DELETE` with cascading FKs); `updated_at` exists on only 2 of ~40 tables.

---

## 3. API route list

~45 route files under `app/api/**/route.js`. Grouped by guard status (full route-by-route table with exploit scenarios is in the security audit; this is the summary Phase 1+ needs to sequence fixes).

### 3.1 No auth guard at all — fix before any public deployment

| Route | Leaks |
|---|---|
| `GET /api/payments` | Every transaction: amount, method, trx_id, invoice, student name |
| `GET /api/students` | Every student's name, phone, fee, paid status |
| `GET /api/submissions` | Every student's assignment content, marks, feedback |
| `GET /api/attendance` | Every student's attendance record |
| `GET /api/enrollments` | Every enrollment, any student |
| `GET /api/certificates` | Every certificate record |
| `GET /api/applications` | Job applicants' PII |
| `GET /api/tenants` | Every coaching center's MRR, plan, student count |
| `GET /api/live-classes` | Every class's live Zoom URL — bypasses the join route's enrollment check entirely |

### 3.2 Guarded, but trusts a client-supplied identity/amount (IDOR)

| Route | Problem |
|---|---|
| `POST /api/payments` | `requireUser()` only; `body.amount` and `body.studentId` trusted outright unless a coupon is applied |
| `POST /api/enrollments` | `requireUser()` only; `body.studentId`/`body.batchId` trusted; zero payment check |
| `DELETE /api/enrollments` | Any signed-in user can delete any enrollment by id |
| `POST /api/submissions` | `body.studentId` trusted — student A can submit as student B |
| `POST /api/applications` | Same pattern for job applications |
| `PATCH /api/users` | Any `owner` can set `role` to `superadmin` for themselves, or disable another account — no self-protection, no ceiling |

### 3.3 Correctly guarded (use these as the pattern to copy)

`POST /api/certificates` and `POST /api/quizzes/attempt` both correctly force `studentId = session.studentId` server-side rather than trusting the client. `GET /api/live-classes/[id]/join` correctly checks enrollment using the session's own studentId. These three are the reference implementation for fixing everything in §3.2.

### 3.4 Everything else

The remaining ~30 routes (courses, batches, teachers, blog, coupons, categories, homepage, settings, paths, Q&A, referrals, reports, reviews, wishlist, notifications, demo-classes, auth/*) use `requireRole`/`requireStaffSection`/`requireUser` correctly for their intended access level. `GET /api/courses` is a partial exception — it has no auth check by design (marketplace browsing), but also has no `published=1` filter, so it leaks draft courses to anonymous requests.

---

## 4. Authentication flow

**This layer is genuinely solid and does not need rework — only extension (identity link, middleware, rate limiting).**

```
POST /api/auth/login (or /register)
  │
  ▼
lib/authRepo.js — findUserByEmail() / createUser()
  │  Password check: lib/auth.js verifyPassword() — scrypt, timing-safe compare
  ▼
lib/auth.js sessionFromUser(user)
  │  Builds {id, role, name, email, tenantId, studentId, teacherId, sections, permissions}
  │  permissions come from lib/rbac.js permissionsFor(role) — resource:action strings,
  │  '*' wildcards, e.g. superadmin = ['*:*']
  ▼
signToken(session) — HMAC-SHA256 signed, base64url, 7-day expiry embedded in the payload
  ▼
setSessionCookie() — httpOnly, sameSite=lax, secure in production, cookie name "leo_session"
  ▼
Every subsequent request: currentSession() reads + verifies the cookie (constant-time
  signature compare), and route handlers call requireUser() / requireRole(...) /
  requirePermission() / requireStaffSection() to gate access.
```

**What's real:** scrypt password hashing, HMAC session signing with timing-safe verification, httpOnly/secure cookie flags, a proper resource:action permission model in `lib/rbac.js`, self-service register/forgot/reset all working against the real `users` table.

**What's missing:**
- **No middleware.js** — auth is enforced per-route, not by a shared gate (§1.2, §3.1).
- **No rate limiting on `POST /api/auth/login`** — unlimited brute-force is possible today.
- **The session's `studentId` can be null** for self-registered accounts (§2.1) — the session model itself is fine, but the identity it's supposed to carry is sometimes missing downstream.
- **`AUTH_SECRET`** has a hardcoded dev fallback in `lib/auth.js:13` (`'leo-dev-secret-change-in-production'`); production must set a real secret via environment variable — currently only present in an untracked local `.env.local`.

---

## 5. Current production blockers

Ranked by how directly they block "a real student pays for a real course and watches it."

1. **No payment gateway.** `components/CheckoutModal.jsx` — the entire "Pay with bKash" flow is local `useState` transitions ending in a hardcoded fake transaction ID (`9GK4A2LX07`) shown for every purchase. No gateway SDK, redirect, or webhook exists anywhere in the repo.
2. **Checkout price is client-controlled; enrollment has no payment check.** `POST /api/payments` (`app/api/payments/route.js:15-22`) inserts `body.amount` as-is unless a coupon is present. `POST /api/enrollments` (`app/api/enrollments/route.js:10-12`) grants access from a bare `requireUser()` check with no reference to any payment.
3. **No video model, no player, no streaming, anywhere.** `lessons` has no video/asset column (§2.2); no `<video>`, HLS, or player library is wired to a lesson anywhere in the codebase (repo-wide grep, zero hits). "My Courses" and course-detail lesson clicks are toast-only.
4. **No progress/resume model.** No `lesson_progress`/`course_progress`/watch-position table exists in any of the 21 migrations. What the UI calls "progress" is derived from live-class attendance + assignment submission, not from anything video-related.
5. **The `users` ↔ `students` identity split breaks self-registration** (§2.1) — confirmed live against the project's own database.
6. **Eight unauthenticated GET routes leak private data**, and one route allows self-privilege-escalation to superadmin (§3.1, §3.2).
7. **The database has no production reliability story.** `lib/mysql.js` hardcodes a local XAMPP socket path with root/no-password defaults, no retry, no health check. It went down mid-audit and took every DB-backed page down with a raw stack-trace 500.
8. **No tests, no lint script, no CI.** `package.json` defines no `lint` or `test` script; no test files exist anywhere in the repository.
9. **No thumbnail/video/resource file upload anywhere.** No object-storage integration, no multipart/FormData endpoint exists for any media type.
10. **Course publish has no validation.** `courseOp('publish')` is an unconditional toggle — a course with zero lessons and no price can go live with one click.

---

## 6. Deployment requirements

What has to exist before this can run anywhere other than a developer's laptop with XAMPP open.

### 6.1 Database
- Move off the hardcoded XAMPP socket path (`lib/mysql.js:9`) to environment-driven config (host/port/user/password/database, TLS where the provider requires it) with connection retry and a `/api/health` endpoint that checks DB reachability.
- Apply all 21 migrations in order against the target managed MySQL instance (no migration runner exists today — this is a manual, ordered `mysql < file.sql` process per the README, which itself should be automated before production use).
- Provision the schema additions from Phase 3/4 (`orders`, `order_items`, `payment_events`, `video_assets`, `lesson_progress`) as new migrations, not edits to the existing ones.

### 6.2 Environment variables
Currently only `AUTH_SECRET` is set in `.env.local`. Production needs, at minimum:
- `AUTH_SECRET` — a real, non-default signing key.
- `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DB` (or a single connection string) — currently these env vars are read by `lib/mysql.js` but all default to the local XAMPP values, so production must set them explicitly or the app will silently try to reach a local socket that doesn't exist on a server.
- Payment gateway credentials (merchant id/secret, webhook signing secret) — none exist today.
- Object storage credentials (for thumbnails, lesson resources, video) — none exist today.
- Video provider API key, if a managed video platform is chosen (§ open decisions below).

An `.env.example` documenting all of the above (with no real values) does not currently exist and should be created in Phase 1.

### 6.3 Hosting, storage, video — decisions still open
The prior audit's Q1/Q2 apply directly here and block concrete Phase 1/3/4 work:
- **Payment gateway**: bKash, Nagad, SSLCommerz, or a card processor — different merchant-onboarding timelines.
- **File/video storage**: self-hosted object storage (S3/R2) + a lightweight player is cheaper long-term; a managed video platform (Bunny Stream / Mux / Cloudflare Stream) is faster to a working slice because it handles transcoding, HLS, and signed URLs for you.
- **Hosting**: Vercel is a natural fit for the existing Next.js App Router structure with zero rearchitecting.
- **Managed MySQL**: PlanetScale, AWS RDS, or DigitalOcean Managed MySQL are all compatible with the existing `mysql2`-based repository layer without code changes beyond connection config.

### 6.4 Operational basics not yet present
Domain + SSL, a CDN, error monitoring (e.g. Sentry), product analytics, and a daily database backup policy — none of these exist in the repository or its documentation today and all need to be stood up before real traffic.

---

## Next step

Phase 1 (production environment setup) and everything after it depends on the four decisions above (payment gateway, storage/video provider, hosting, managed MySQL provider) being made explicitly — this document intentionally stops short of picking them. Once those are chosen, Phase 1's `.env.example` + connection-retry + health-check work can begin without touching business logic, exactly as scoped.
