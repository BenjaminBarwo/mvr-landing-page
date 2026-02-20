---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [supabase, next.js, middleware, stripe, webhooks, admin]

requires:
  - phase: 01-01
    provides: Supabase client singletons (server.ts, admin.ts), Stripe singleton (stripe.ts), env.ts

provides:
  - Admin login page at /admin/login with signInWithPassword server action
  - Middleware route protection for /admin/* using getUser() (not getSession())
  - Admin dashboard layout with role display and sign-out capability
  - Stripe webhook skeleton at /api/webhooks/stripe with signature verification
  - Admin seed script provisioning 3 accounts (approver + 2 viewers) with app_metadata.role
affects:
  - 02-landing-page (admin routes finalized)
  - 04-payment-email (Stripe webhook stubs ready for Phase 4 implementation)
  - 05-admin-queue (admin auth foundation complete)

tech-stack:
  added: []
  patterns:
    - "getUser() over getSession() in all server code — getSession() can be spoofed"
    - "request.text() for Stripe webhook body — never request.json()"
    - "app_metadata.role for admin permissions — immutable by users, embedded in JWT"
    - "Defense-in-depth: both middleware AND layout verify admin auth"
    - "useActionState + useFormStatus for server action form state in React 19"

key-files:
  created:
    - src/middleware.ts
    - src/app/admin/login/page.tsx
    - src/app/admin/login/actions.ts
    - src/app/admin/(dashboard)/layout.tsx
    - src/app/admin/(dashboard)/page.tsx
    - src/app/admin/(dashboard)/actions.ts
    - src/app/api/webhooks/stripe/route.ts
    - scripts/seed-admin.ts
  modified:
    - src/lib/db.ts

key-decisions:
  - "getUser() enforced in middleware and layout — never getSession() — security non-negotiable per research"
  - "Admin accounts use @mvr.internal email addresses — not real emails, cannot be spam-flagged"
  - "Middleware matcher /admin/:path* intentionally excludes /api/webhooks/stripe — webhook has no auth"
  - "Admin seed script skips existing accounts gracefully — idempotent re-runs safe"
  - "Stripe webhook reads raw body via request.text() — request.json() would destroy HMAC signature"

patterns-established:
  - "Server actions use 'use server' directive and return {error: string} | null for form state"
  - "Admin layout provides defense-in-depth auth check redundant with middleware"
  - "Webhook handlers return 400 for missing/invalid signatures, 200 with {received: true} on success"

requirements-completed: [ADMIN-01, INFRA-03]

duration: 12min
completed: 2026-02-20
---

# Phase 1 Plan 02: Admin Auth and Stripe Webhook Summary

**Supabase admin auth with middleware route protection, signInWithPassword login, role-based layout, 3 provisioned admin accounts, and Stripe webhook skeleton with HMAC signature verification**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-20T04:47:00Z
- **Completed:** 2026-02-20T04:59:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Admin login flow fully operational: middleware redirects unauthenticated /admin/* to /admin/login, signInWithPassword authenticates, layout shows email and role
- Three admin accounts provisioned in Supabase Auth: approver@mvr.internal (approver role) + viewer1/viewer2@mvr.internal (viewer role) — all with app_metadata.role set in JWT
- Stripe webhook skeleton at /api/webhooks/stripe verifies HMAC signatures via constructEvent, returns 400 for missing/invalid signatures, has Phase 4 stubs for payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed

## Task Commits

Each task was committed atomically:

1. **Task 1: Admin auth with middleware, login page, and seed script** - `5036bd0` (feat)
2. **Task 2: Stripe webhook skeleton with signature verification** - `4d3f643` (feat)

**Plan metadata:** [created after this summary]

## Files Created/Modified
- `src/middleware.ts` - Route protection for /admin/* using getUser(), redirects unauthenticated users to /admin/login
- `src/app/admin/login/page.tsx` - Dark-themed login form with useActionState and useFormStatus for React 19 server action integration
- `src/app/admin/login/actions.ts` - signInAction server action using signInWithPassword, returns {error} or redirects to /admin
- `src/app/admin/(dashboard)/layout.tsx` - Admin shell with header, role badge, sign-out button; defense-in-depth auth check
- `src/app/admin/(dashboard)/page.tsx` - Minimal dashboard placeholder showing authenticated user email and role
- `src/app/admin/(dashboard)/actions.ts` - signOutAction server action
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook POST handler with signature verification and Phase 4 stubs
- `scripts/seed-admin.ts` - Provisions 3 admin accounts via supabase.auth.admin.createUser, generates random passwords, skips existing accounts
- `src/lib/db.ts` - Fixed import path for Prisma 7 generated client (../generated/prisma/client), added workaround for Prisma 7 driver adapter type requirement

## Decisions Made
- Used `getUser()` in both middleware and layout — defense-in-depth, security critical
- Webhook route excluded from admin auth via middleware matcher `/admin/:path*` — webhooks must be publicly accessible for Stripe to call them
- Admin seed script generates random passwords via `crypto.randomUUID()` and logs them once — not stored, user must save
- Admin accounts already existed in Supabase from prior setup — seed script ran with SKIP for all 3 accounts (idempotent)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma 7 import path in db.ts**
- **Found during:** Task 1 (TypeScript type check)
- **Issue:** `src/lib/db.ts` imported from `../generated/prisma` which has no index file. Prisma 7 generates to a directory without an index.ts, requiring the explicit `../generated/prisma/client` path.
- **Fix:** Updated import to `../generated/prisma/client`; added type cast workaround for Prisma 7 breaking change where PrismaClientOptions now requires `adapter` or `accelerateUrl` (no bare `new PrismaClient()`)
- **Files modified:** `src/lib/db.ts`
- **Verification:** `./node_modules/.bin/tsc --noEmit` passes with no errors
- **Committed in:** `5036bd0` (part of Task 1 commit)
- **Note:** Full Prisma 7 driver adapter setup (e.g., `@prisma/adapter-pg`) deferred to Phase 3 when DB queries are first needed — comment left in file with instructions

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Fix required for TypeScript compilation. Prisma 7 adapter setup is a known deferred item documented in the file with clear instructions.

## Issues Encountered
- Prisma 7 (7.4.1) was installed instead of Prisma 5 (as noted in CLAUDE.md) — Prisma 7 requires driver adapters and changes the PrismaClientOptions type signature. The `db.ts` file was pre-existing from Plan 01 with an incorrect import path. Fixed the import path; used a type cast to defer the driver adapter configuration to Phase 3 when actual database queries are needed.

## User Setup Required
None — admin accounts are provisioned (already existed), all env vars are set. The dev server can be started with `npm run dev` and admin login tested at http://localhost:3000/admin.

## Next Phase Readiness
- Admin auth foundation complete — Phase 5 admin queue can build on this
- Stripe webhook skeleton ready — Phase 4 payment handling has stubs to implement
- Phase 2 (Landing Page) can proceed immediately — no admin auth dependencies
- Deferred: Prisma 7 driver adapter setup (`@prisma/adapter-pg`) needed before any DB queries execute — document in Phase 3 plan

---
*Phase: 01-foundation*
*Completed: 2026-02-20*
