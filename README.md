# Leo Learning 🦁

**Multi-tenant SaaS platform for Bangladeshi coaching centers** — batch management, live class joining, bKash fee collection, parent monitoring, course landing pages, and a super-admin panel. Bilingual (বাংলা / English).

Built with **Next.js (App Router) + React — plain JavaScript, no TypeScript**. Fullstack: the UI talks to real API routes backed by a server-side data layer.

---

## 🚀 Getting started

```bash
# 1. install dependencies (needs internet)
npm install

# 2. run the dev server
npm run dev

# 3. open in your browser
http://localhost:3000
```

That's it. The app redirects to the onboarding wizard.

> **Note:** the first `npm run dev` also downloads the Google fonts (Hind Siliguri + Archivo) via `next/font`, so keep internet on for the first run.

---

## 🗺️ The 6 screens

| Route | Screen | What it shows |
|---|---|---|
| `/onboarding` | Onboarding wizard | 4-step center setup: name + subdomain + brand color → first batch → payment model (own bKash vs Leo checkout) → done |
| `/owner` | Owner admin | Dashboard (stats + dues alerts + SMS reminders), Batches, Teachers (assign/remove batches), Students (add + CSV import), Payments (mark paid, Model A/B commission view) |
| `/student` | Student portal | Live/support class joining, fee-due banner with full **bKash pay modal flow**, My Courses (modules/assignments/exams + progress rail), Recordings, Resources, Profile |
| `/parent` | Parent monitor | Attendance rate, test scores + ranks, attendance log, fee history, SMS note |
| `/landing` | Center landing page | Public marketing page each tenant gets — hero (uses the brand color picked in onboarding!), upcoming batches with category filters, free demo classes, features, stats, testimonials, footer |
| `/superadmin` | Super admin | Platform overview for you (the SaaS owner) — active centers, MRR, trials, churn, and suspend/activate per tenant |

The dark bar on top is a **prototype navigator** — it lets you jump between roles. In production each role would see only their own screen after login. The **EN/বাং** button switches language everywhere, live.

---

## 🏗️ Project structure

```
leo-learning/
├── app/
│   ├── layout.js              # Root layout: fonts, AppProvider, nav bar, toast
│   ├── page.js                # Redirects / → /onboarding
│   ├── globals.css            # Design tokens + shared component classes
│   ├── onboarding/page.js
│   ├── owner/page.js          # Shell with sidebar; tabs are components
│   ├── student/page.js        # Shell with sidebar; tabs are components
│   ├── parent/page.js
│   ├── landing/page.js
│   ├── superadmin/page.js
│   └── api/                   # ← the backend
│       ├── students/route.js  # GET, POST (add / bulk import), PATCH (mark paid)
│       ├── batches/route.js   # GET, POST
│       ├── teachers/route.js  # GET, POST, PATCH (assign/remove batch)
│       └── tenants/route.js   # GET, PATCH (suspend/activate)
├── components/
│   ├── PrototypeBar.js        # Top nav (route-aware) + language toggle
│   ├── Toast.js
│   ├── owner/                 # DashboardTab, BatchesTab, TeachersTab,
│   │                          # StudentsTab, FeesTab
│   └── student/               # ClassesTab, CoursesTab (+detail), RecordingsTab,
│                              # ResourcesTab, ProfileTab, PayModal (bKash flow)
├── context/
│   └── AppContext.js          # Global state: language, center identity, data
│                              # fetched from /api/*, mutations, toast
└── lib/
    ├── i18n.js                # Full bn/en dictionary
    └── db.js                  # Server-side in-memory DB with seed data
```

## 🔄 How the fullstack part works

1. On load, `AppContext` fetches students, batches, teachers and tenants from the API routes.
2. Every action (add student, mark paid, assign teacher, suspend tenant…) calls the API first, then updates React state from the server's response.
3. The API routes read/write `lib/db.js` — an in-memory store that **resets when you restart the dev server** (intentional for demoing).

### Upgrading to a real database later

`lib/db.js` is designed to be swapped for **Prisma + PostgreSQL** with zero changes to the UI:

```js
// today (db.js):            // later (Prisma):
db.students                  await prisma.student.findMany()
db.students.unshift(s)       await prisma.student.create({ data: s })
student.paid = true          await prisma.student.update({ where: { id }, data: { paid: true } })
```

Recommended production stack: **Supabase/Neon Postgres + Prisma**, **Clerk** for phone-OTP auth, **Agora/100ms** for live classes, **Bunny.net** for recorded video, real **bKash/Nagad merchant API**, and a local SMS gateway (Alpha SMS / BulkSMSBD).

## 🎨 Design system

Design tokens live in `app/globals.css` as CSS variables (`--brand`, `--paper`, `--coal`, …) plus reusable classes (`.card`, `.btn-primary`, `.chip`, `.side-tab`, `.progress-track`…). Typography: **Hind Siliguri** for body (great Bangla rendering) and **Archivo** heavy weights for numbers/display. The tenant's brand color chosen in onboarding flows through to their landing page.

## 🔐 Authentication & RBAC

Real credential auth backed by a `users` table (migration `003_users.sql`).
Passwords are scrypt-hashed; the session is an HMAC-signed httpOnly cookie
(`lib/auth.js`, no external dependency). Permissions live in `lib/rbac.js` as
`resource:action` grants (with `*` wildcards) and are enforced **both** on the
client (`RoleGuard` around each dashboard) and the server (`requireRole` /
`requireUser` on the mutation API routes).

```bash
# one-time: create the accounts table + seed demo users
mysql -u root e-learning < database/migrations/003_users.sql
node database/seed_users.mjs        # all demo accounts use password: demo1234
```

Set `AUTH_SECRET` in `.env.local` for a stable session-signing key (a dev
default is provided). Demo accounts (password `demo1234`): `student@`,
`teacher@`, `parent@`, `owner@`, `superadmin@` `leolearning.app`. The login page
also has one-click quick-login buttons for each. Self-signup (`/register`) is
open to student/parent; `/forgot` + `/reset` cover password recovery (the token
is returned inline since SMTP isn't wired yet).

## ✅ What's demo-only (by design)

- bKash payment (full UI flow, fake TrxID; wire the merchant API later)
- Live class join, recordings, resources (toast placeholders; wire Agora/Bunny later)
- CSV import (adds 2 sample rows; wire a real file parser later)
- Email verification / OTP / social login (auth foundation is real; these are not wired)
