# Leo Learning — Feature Gap Checklist

Comparing the pasted **Ostad-style LMS spec** against the actual `leo-learning` codebase (a multi-tenant coaching-center SaaS prototype).

**Legend:** ✅ done · ⚠️ partial / placeholder · ❌ missing

> Context: the project is a **prototype**. Auth, payments, live-class join, uploads are demo/placeholder per the README. Data layer = in-memory `lib/db.js` + a MySQL schema (`database/migrations/001_init_schema.sql`, 22 tables) that mirrors it.

---

## 1. Public Website (Guest) 

| Item | Status | Notes |
|---|---|---|
| Home / hero banner | ✅ | `/landing` hero (brand color) with owner-editable badge/headline/highlight/subtitle via Homepage CMS. |
| Featured / popular / free courses | ✅ | `featured` flag + **Featured** strip on `/courses`, owner ★ toggle, popularity/latest/price sort. `018_featured_categories.sql`. |
| Upcoming live bootcamps | ✅ | Real `demo_classes` (upcoming + recorded) on landing; each card opens `/demo/[slug]` with schedule + free registration (recorded ones stream a real video). `017_demo_classes.sql`. |
| Success stories / testimonials | ✅ | Landing testimonials, editable in the Homepage CMS (add/remove name/batch/quote). |
| Partner companies | ✅ | Editable via Homepage CMS (partners section) → rendered as trust chips on the landing hero. |
| Student reviews | ✅ | Enrolled students submit reviews (star rating + text) on the course page → pending → admin-moderated |
| FAQs | ✅ | Per-course FAQs on course pages **plus** owner-editable homepage FAQ accordion via the Homepage CMS. |
| Blog / articles / resources | ✅ | Public `/blog` list + `/blog/[slug]` detail (published only), nav link. `009_blog.sql` with seed posts. |
| Footer | ✅ | on landing |
| Course marketplace (browse/search) | ✅ | `/courses` — search + category + level + instructor + price filters and popularity/latest/price sort. |
| Course details page | ✅ | `/course/[slug]` — thumb, desc, outcomes, requirements, curriculum, reviews, FAQ, price |
| Promo video / demo playlist | ⚠️ | Recorded free demo classes now play in a real `<video>` player on their detail page (sign-in gated); course-level promo video + per-course gated playlist still pending real video hosting |
| Instructor profile page | ✅ | `/instructor/[id]` |
| About / Contact | ✅ | `/about` + `/contact` (working form → `contact_messages`, owner Messages inbox with read state). Footer links wired. |
| Privacy Policy / Terms | ✅ | `/privacy` + `/terms` bilingual content pages, linked from footer. |

## 2. Authentication

| Item | Status | Notes |
|---|---|---|
| Login | ✅ | Real email+password against `users` table; scrypt-hashed, HMAC-signed httpOnly session cookie. Demo quick-login buttons remain. |
| Register | ✅ | `/register` self-signup (student/parent), auto login |
| Forgot / Reset password | ✅ | `/forgot` issues a token (returned inline — no SMTP yet), `/reset` consumes it |
| Email verification | ❌ | needs SMTP (see README production stack) |
| OTP verification | ❌ | (README suggests Clerk phone-OTP later) |
| Social login | ❌ | |
| **Session / role guards** | ✅ | `RoleGuard` on every dashboard + server-side `requireRole`/`requireUser` on mutation routes |

## 3. Student Dashboard (`/student`)

| Item | Status | Notes |
|---|---|---|
| Dashboard / continue learning | ⚠️ | progress rail exists (`lib/progress.js`); no "continue" resume |
| Upcoming classes | ✅ | ClassesTab |
| Notifications | ✅ | In-app notification bell (unread badge, mark read/all), auto-notify on assignment grading. Table `005_notifications.sql`. |
| Learning progress | ✅ | progress tracking per course |
| My Courses (active/completed) | ✅ | CoursesTab (modules/assignments/exams) |
| Wishlist | ✅ | Save/remove courses (heart on course page), student Wishlist tab, synced via shared context state. `008_wishlist.sql`. |
| Recorded courses / mark complete / resume | ⚠️ | RecordingsTab is a placeholder (toast); no player, no completion, no resume-timestamp |
| Live courses / countdown / join button | ⚠️ | join button + `/api/live-classes/[id]/join` (enrollment check) exist; Zoom redirect is placeholder |
| Attendance history | ✅ | via `attendance` table (parent view) |
| Assignments (view/submit/resubmit/feedback) | ⚠️ | `submissions` model + grading; submit UI is basic, no file upload |
| Quizzes (take / scores) | ✅ | Full MCQ engine — student Quizzes tab, take modal, server-graded score, pass/fail. Tables in `004_quizzes.sql`. |
| Certificates (download/share) | ✅ | Print/save-as-PDF, **Share** copies a public verify link, and `/verify/[certNo]` publicly confirms validity. Student self-issue fixed (threshold-gated). |
| Payments history / invoices | ⚠️ | `payments` table w/ `invoice_no`; bKash PayModal (fake TrxID) |
| Profile (info/password/picture) | ⚠️ | Info + **change-password** (verifies current, re-hashes) done; avatar upload still needs file storage. |

## 4. Instructor Dashboard (`/teacher`)

| Item | Status | Notes |
|---|---|---|
| Dashboard (assigned courses, today/upcoming, student count) | ✅ | TeacherOverview + TeacherRoutine |
| Live classes (schedule/Zoom/start/end/upload recording) | ⚠️ | TeacherClasses + `live_classes` PATCH (status); Zoom/recording are placeholders |
| Recorded lessons / upload videos/PDFs/resources | ❌ | no upload; placeholders only |
| Assignments (create/review/grade/feedback) | ✅ | Teacher **create-assignment** (course→module→title, RBAC-guarded) + review/grade/feedback in TeacherSubmissions. |
| Quizzes (create MCQ / results) | ✅ | Teacher Quizzes tab — MCQ builder (add/delete questions & options, mark correct), results view with attempts + average |
| Students (list/attendance/progress) | ✅ | TeacherAttendance |
| Announcements / notify students | ✅ | Announcement composer (teacher + owner tab) fans out to all students in the tenant as in-app notifications |

## 5. Super Admin Dashboard

> **Important mismatch:** the project's `/superadmin` is the **SaaS platform owner** (manages tenants/MRR/churn), NOT the per-center course-admin your spec describes. The per-center admin work lives in `/owner`.

| Item | Status | Notes |
|---|---|---|
| Platform dashboard (revenue/students/active/sales/reports) | ⚠️ | `/superadmin` shows centers, MRR, trials, churn (SaaS-level) |
| User management (students/instructors/mentors/admins) | ✅ | Owner **Users** tab — unified list of all accounts, change role (dropdown), enable/disable (self-protected), RBAC-guarded. |
| Roles & permissions (RBAC) | ✅ | Enforced server + client (`lib/rbac.js`, 6 roles) **plus** a read-only permission matrix in the owner Users tab. |
| **Course builder** (create course, all fields) | ✅ | Full owner edit form — title, price, old price, category, instructor, level, language, duration, tagline, description, mode; publish + ★ featured toggles. |
| **Curriculum builder** (modules/lessons, drag-drop, reorder, lock, demo, upload) | ⚠️ | Full builder: add/rename/delete modules & lessons, **HTML5 drag-drop reorder** + ↑/↓, **demo/lock toggle**. Only file upload still pending (needs storage). |
| Batch management | ✅ | `/owner` BatchesTab + `batches`/`teacher_batches` |
| Live class management | ⚠️ | data + status transitions; placeholders for Zoom/recording |
| Recorded course management (organize/free/locked) | ⚠️ | free/locked toggle + lesson ordering done in the curriculum builder; video upload/organize needs storage. |
| Enrollment management (paid/free/manual/cancel) | ✅ | Owner Enrollments tab — manual enroll (student × batch), cancel, dup-guarded. |
| Payment management (SSLCommerz/bKash/Nagad/bank/verify/refund) | ⚠️ | Owner **Transactions** tab lists all payments with **refund** action (server-updates status); real gateways (SSLCommerz/bKash/Nagad) still need merchant APIs. |
| Coupon management | ✅ | Percentage + fixed coupons, expiry, usage limits, tenant/global scope. Owner CRUD tab, checkout apply, server-authoritative validate+redeem. Table `006_coupons.sql`. |
| Category management | ✅ | Owner Categories tab (create/delete, icon), `categories` table, public API for builder/marketplace. |
| Instructor management (create/assign/earnings) | ✅ | Owner Teachers tab — add, assign/remove batches, and **earnings** (sum of successful payments for their courses). |
| Student management (profiles/certs/attendance/progress) | ✅ | Owner Students tab — click any student → detail modal (enrolled courses, attendance rate, certificates, graded work, payment history). |
| Review moderation (approve/hide/feature) | ✅ | Owner Reviews tab — filter by status, approve/hide/feature. Public pages show approved only, featured first. `007_reviews_moderation.sql`. |
| Blog management | ✅ | Owner Blog tab — create/edit/delete articles, publish/draft toggle, category/author. Drafts hidden from public. |
| Homepage CMS (hero/testimonials/FAQ/partners/footer) | ✅ | Owner Homepage tab edits hero (badge/headline/highlight/subtitle), testimonials, partners, stats → landing overlays with fallback to defaults; per-section reset. `012_homepage.sql`. |
| Notifications (email/SMS/push/in-app) | ⚠️ | **in-app done** (bell + announcements + auto grade-notify); email/SMS/push still need gateways |
| Reports + export (Excel/CSV/PDF) | ✅ | Owner Reports tab — sales/revenue, students, attendance-rate reports with summary cards + **CSV export** (UTF-8 BOM for Bangla). `lib/reportRepo.js`. Excel/PDF not wired. |
| Settings (site/SMTP/gateways/logo/theme/SEO/maintenance) | ⚠️ | Owner **Settings** tab — site title, support phone/email, SEO description, **maintenance mode** (site-wide banner, admins bypass). `019_settings.sql`. SMTP/gateway creds still need infra. |

## 6. Mentor Dashboard

| Item | Status | Notes |
|---|---|---|
| Mentor role (assigned students, Q&A, review, monitor) | ✅ | `/mentor` dashboard — assigned students with attendance/progress, review + grade their submissions (ownership-enforced). `010_mentors.sql` + `mentor@` demo account. Q&A still absent. |

## 7. Live Class Flow

| Step | Status |
|---|---|
| Admin creates course → batch → assign instructor | ✅ (owner) |
| Instructor creates live class + Zoom link | ⚠️ data model; UI thin |
| "ক্লাস শুরু করুন" → status=LIVE | ⚠️ PATCH status exists |
| Student sees "ক্লাসে জয়েন করুন" + enrollment verify | ✅ `/api/live-classes/[id]/join` verifies enrollment |
| Redirect to Zoom | ⚠️ placeholder |
| Upload recording → student watches | ❌ upload missing |

## 8. Recorded Course Flow

| Step | Status |
|---|---|
| Upload videos / mark demo / publish | ⚠️ `published` + `is_free` flags; no upload/publish UI |
| Guest watches demo → purchase → login → pay → enroll | ⚠️ pieces exist (course page, PayModal, enrollments) but not wired as a gated flow |
| Watch full course | ⚠️ RecordingsTab placeholder |

## 9. User Roles / RBAC

| Item | Status | Notes |
|---|---|---|
| Guest / Student / Instructor / Admin(owner) / Super Admin | ✅ | real login sessions; dashboards guarded by role |
| Mentor | ✅ | full role: login, `/mentor` dashboard, RBAC permissions, assigned-student scoping |
| RBAC (permission-governed, not hard-coded) | ✅ | `lib/rbac.js` permission map (`resource:action` + wildcards), shared by server guards and client. Server enforces on tenants/students/teachers/batches/courses/payments/jobs/etc. |
| **(extra in project) Parent role** | ✅ | `/parent` — not in your spec but built |

## Recommended Extras

| Item | Status |
|---|---|
| Learning path / career track | ✅ | Public `/paths` + `/paths/[slug]` (ordered course steps), owner Learning-paths tab (create, add/remove courses, delete), nav link. `013_learning_paths.sql`. |
| Bookmarks | ⚠️ | covered by Wishlist (save courses); per-lesson bookmarks not separate |
| Notes on videos | ❌ |
| Discussion / Q&A per lesson | ✅ | 💬 on every curriculum lesson opens a thread — ask + threaded answers with staff role badges; public read, post requires login. `014_lesson_qa.sql`. |
| Video progress (% watched) | ⚠️ course-level progress only |
| Continue from last timestamp | ❌ |
| Completion requirements | ✅ | **Per-course** completion threshold (editable in the course builder) gates certificate issuance server-side. `020_completion_threshold.sql`. |
| Referral system | ✅ | Per-user referral code (lazy-generated) + share link, student Refer tab with success count; signups via `?ref=`/code credit the referrer. `015_referrals.sql`. |
| Affiliate program | ✅ | Owner Affiliates tab (create partners w/ code + commission %, toggle, delete, earnings + sales), affiliate link `?aff=`; commission recorded server-side at payment time. `016_affiliates.sql`. |
| **Job portal** | ✅ | `jobs`/`job_skills`/`applications` + Career tabs (student & superadmin) |
| RBAC | ✅ | see RBAC row above — fully enforced across all mutation routes + dashboard guards |

---

## Rough coverage summary

- **✅ Fully done:** ~10 items (batch mgmt, course detail page, instructor profile, teacher attendance/overview, job portal, parent portal, enrollment-verified join, footer)
- **⚠️ Partial / placeholder:** ~35 items (auth, payments, live class, submissions, certificates, course/curriculum data-without-UI)
- **❌ Missing:** ~40 items (register/reset/verify/social, quizzes, mentor, RBAC, coupons, blog, homepage CMS, notifications, reports/export, uploads, review moderation, learning path, bookmarks, notes, Q&A, referral, affiliate)

**Verdict:** the project implements the *coaching-center management* core well as a prototype, but covers well under half of the Ostad-style marketplace LMS spec, and most of what exists is demo/placeholder rather than production.
