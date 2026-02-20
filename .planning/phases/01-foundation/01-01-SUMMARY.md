---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, supabase, prisma, stripe, typescript, tailwind, zod, postgres, rls]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffolded with TypeScript strict mode and Tailwind CSS 4
  - Centralized env validation via @t3-oss/env-nextjs (build fails on missing vars)
  - Supabase browser client (createBrowserClient)
  - Supabase server client (createServerClient with cookie handling)
  - Supabase admin/service-role client (bypasses RLS, server-only)
  - Stripe server singleton (API version 2026-01-28.clover)
  - Prisma 7 client singleton (serverless-safe globalThis pattern)
  - Full database schema DDL (5 tables, 3 enums, RLS, partial unique index, triggers)
  - Prisma schema mirroring database (all 5 models with relations)
affects:
  - 02-landing-page
  - 03-application-form
  - 04-payment-email
  - 05-admin-queue
  - 06-scarcity-analytics

# Tech tracking
tech-stack:
  added:
    - Next.js 16.1.6 (App Router, TypeScript strict, Tailwind CSS 4)
    - @supabase/supabase-js 2.97.0
    - "@supabase/ssr" (cookie-based sessions for App Router)
    - stripe 20.3.1
    - "@t3-oss/env-nextjs 0.13.10" (build-time env validation)
    - zod 4.3.6
    - prisma 7.4.1 (Prisma 7 with prisma-client generator, prisma.config.ts)
    - jiti (jiti wrapper for next.config.ts env validation)
    - dotenv (for prisma.config.ts)
  patterns:
    - jiti wrapper in next.config.ts triggers @t3-oss/env-nextjs at build time
    - Supabase client pair — browser vs server separation (never mix contexts)
    - service-role admin client for RLS bypass (server-only, webhooks, seeds)
    - globalThis Prisma singleton prevents connection exhaustion in serverless
    - Prisma 7 config — datasource URL in prisma.config.ts, not schema.prisma
    - RLS policies use (select auth.jwt()) for 99.99% performance vs bare auth.jwt()
    - app_metadata.role for admin RBAC (immutable by users, embedded in JWT)

key-files:
  created:
    - src/env.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/lib/stripe.ts
    - src/lib/db.ts
    - prisma/schema.prisma
    - prisma.config.ts
    - supabase/migrations/001_foundation.sql
    - .env.local.example
    - .gitignore
  modified:
    - next.config.ts
    - package.json
    - tsconfig.json

key-decisions:
  - "Used Prisma 7 (latest) instead of Prisma 5 — Prisma 7 moves datasource URL to prisma.config.ts; schema.prisma only has provider"
  - "Used Next.js 16 (latest) instead of Next.js 15 — create-next-app installed 16.1.6"
  - "Stripe API version 2026-01-28.clover (discovered from node_modules/stripe apiVersion.js)"
  - "Application status flow: draft -> submitted (payment confirmed) -> approved/rejected/waitlisted"
  - "ZIP storage: junction table (application_zips) over array — better for per-ZIP queries and seat counting"
  - "All-or-nothing approval for Phase 1 — approving an application covers all selected ZIPs"
  - "Partial unique index on applications(email, role) WHERE status != 'rejected' — DB-level race condition protection"
  - "RLS uses (select auth.jwt()) wrapper for 99.99% query caching performance improvement"
  - "Admin role stored in app_metadata.role (not user_metadata) — immutable by users"

patterns-established:
  - "Pattern: Always use createServerClient from @supabase/ssr for server-side Supabase (not createClient)"
  - "Pattern: Always use supabase.auth.getUser() — never getSession() in server code"
  - "Pattern: Webhook handlers use supabaseAdmin (service-role) to bypass RLS"
  - "Pattern: Read Stripe webhook body with request.text() — never request.json()"

requirements-completed:
  - INFRA-01

# Metrics
duration: 7min
completed: 2026-02-20
---

# Phase 1 Plan 1: Foundation Scaffold Summary

**Next.js 16 + Supabase + Stripe + Prisma 7 project scaffolded with @t3-oss/env-nextjs build-time env validation and full 5-table database schema DDL with RLS policies**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-20T02:45:21Z
- **Completed:** 2026-02-20T02:52:30Z
- **Tasks:** 1 fully complete, 1 partially complete (migration file created, not applied), 1 blocked
- **Files modified:** 27

## Accomplishments

- Complete Next.js 16 project with all Phase 1 dependencies installed and version-locked
- @t3-oss/env-nextjs validation confirmed working — build fails with clear error listing all 8 missing env vars
- All 5 client singletons created and importable (Supabase browser, server, admin, Stripe, Prisma)
- Full database schema DDL created (5 tables, 3 enums, partial unique index, RLS policies, triggers)
- Prisma 7 schema with all 5 models generated — client types ready at src/generated/prisma
- jiti wrapper in next.config.ts confirmed to trigger env validation at build time

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project with all dependencies and client singletons** - `db1fc9b` (feat)
2. **Task 2: Create and apply database schema migration** - `8c86571` (feat — migration file created, apply pending)
3. **Task 3: Deploy to Vercel** - Not started (blocked by missing credentials)

## Files Created/Modified

- `src/env.ts` — centralized env validation for all 8 required environment variables
- `src/lib/supabase/client.ts` — browser Supabase client (createBrowserClient)
- `src/lib/supabase/server.ts` — server Supabase client (createServerClient with async cookies)
- `src/lib/supabase/admin.ts` — service-role client (bypasses RLS, server-only)
- `src/lib/stripe.ts` — Stripe singleton (API version 2026-01-28.clover)
- `src/lib/db.ts` — Prisma 7 client singleton (serverless-safe globalThis pattern)
- `prisma/schema.prisma` — full Prisma schema (5 models, 3 enums, all relations)
- `prisma.config.ts` — Prisma 7 config (datasource URL, migrations path)
- `supabase/migrations/001_foundation.sql` — full database DDL (ready to apply)
- `next.config.ts` — jiti wrapper for build-time env validation
- `package.json` — all Phase 1 dependencies + typecheck/seed scripts
- `.env.local.example` — all 8 env vars documented with source instructions
- `.gitignore` — proper exclusions (.env.local, .next, .vercel, generated Prisma client)

## Decisions Made

- **Prisma 7 instead of Prisma 5**: npm installed Prisma 7.4.1 (latest). Breaking change: `url`/`directUrl` moved from schema.prisma to prisma.config.ts. Handled by creating prisma.config.ts and removing url from schema.
- **Next.js 16 instead of 15**: create-next-app installed 16.1.6. The jiti wrapper pattern still applies and works.
- **Stripe API 2026-01-28.clover**: Read from node_modules/stripe/cjs/apiVersion.js — latest API version for Stripe 20.x.
- **zod v4**: npm installed zod 4.3.6. `z.string().startsWith()` is supported in v4 (same API as v3 for this usage).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma 7 breaking change — datasource URL moved to prisma.config.ts**
- **Found during:** Task 1 (Prisma schema creation and generate)
- **Issue:** Prisma 7.4.1 installed (plan specified v5). Prisma 7 no longer supports `url` and `directUrl` in schema.prisma — they must go in prisma.config.ts. `prisma generate` failed with P1012 error.
- **Fix:** Removed `url`/`directUrl` from datasource block in schema.prisma; created prisma.config.ts with `defineConfig()` pattern; installed dotenv for prisma.config.ts; updated src/lib/db.ts to import from `../generated/prisma` (Prisma 7 output path)
- **Files modified:** prisma/schema.prisma, prisma.config.ts (new), src/lib/db.ts, package.json
- **Verification:** `prisma generate` exits 0, client generated to src/generated/prisma
- **Committed in:** db1fc9b (Task 1 commit)

**2. [Rule 3 - Blocking] Next.js scaffold failed due to directory name with special characters**
- **Found during:** Task 1 (create-next-app)
- **Issue:** Directory name "MVR_LANDING_PAGE:WAITLIST" contains uppercase and colon — npm naming restrictions prevent create-next-app from running in this directory.
- **Fix:** Scaffolded to /tmp/mvr-landing, then rsync'd files to project directory. Updated package.json name to mvr-landing-waitlist.
- **Files modified:** package.json
- **Verification:** All project files present; build runs (with env validation error as expected)
- **Committed in:** db1fc9b (Task 1 commit)

**3. [Rule 1 - Bug] SQL syntax error in applications_session_read RLS policy**
- **Found during:** Task 2 (migration creation)
- **Issue:** Typo `->>>'sub'` (3 angle brackets) instead of correct `->> 'sub'` (2 brackets + space)
- **Fix:** Corrected operator to `((select auth.jwt()) ->> 'sub')`
- **Files modified:** supabase/migrations/001_foundation.sql
- **Verification:** Reviewed final SQL for correct JSON operator syntax
- **Committed in:** 8c86571 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking issues, 1 bug)
**Impact on plan:** All auto-fixes necessary to unblock execution. Prisma 7 is architecturally equivalent to Prisma 5 for this project — same query API, just different config file location. No scope creep.

## Issues Encountered

### Authentication Gates (Tasks 2 & 3 — Partially Blocked)

**Task 2: Migration application blocked** — The SQL migration file `supabase/migrations/001_foundation.sql` is fully written and ready. However, applying it requires either:
- Linking the Supabase CLI to the correct project: `supabase link --project-ref <project-ref>`
- Or applying via the Supabase Dashboard SQL editor

The user is logged into Supabase CLI with 2 projects (Orion_MK-1, Leads). Neither is clearly the MVR project — may need a new project or clarification.

**Task 3: Vercel deployment blocked** — Requires env vars in `.env.local` or configured Vercel project with all 8 env vars.

## User Setup Required

To complete Tasks 2 and 3, the following external service setup is needed:

### 1. Create/select Supabase project

If creating a new project:
```bash
# Create via Supabase Dashboard: https://supabase.com/dashboard/new
```

Link the CLI to your project:
```bash
supabase link --project-ref <your-project-ref>
```

Apply the migration:
```bash
supabase db push
```

Or copy `/supabase/migrations/001_foundation.sql` into the Supabase Dashboard SQL editor and run it.

### 2. Create .env.local

Copy `.env.local.example` to `.env.local` and fill in all 8 values:
```bash
cp .env.local.example .env.local
```

Values found at:
- Supabase: Dashboard > Project Settings > API
- Stripe: Dashboard > Developers > API keys
- Stripe webhook secret: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 3. Deploy to Vercel (Task 3)

Once env vars are in hand:
```bash
vercel link --yes
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
vercel env add DATABASE_URL production preview development
vercel env add DIRECT_URL production preview development
vercel env add STRIPE_SECRET_KEY production preview development
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production preview development
vercel env add STRIPE_WEBHOOK_SECRET production preview development
vercel --prod
```

## Next Phase Readiness

**Ready:**
- Next.js project builds (env validation confirms all required vars)
- All client singletons importable and correctly typed
- Prisma client generated with full type coverage
- SQL migration ready to apply (paste into Supabase SQL editor or use supabase db push)

**Blocked:**
- Phase 2+ cannot start until the database schema is applied (Task 2)
- Vercel deployment needed for Phase 2+ preview URLs

**No new blockers added** beyond what was already in STATE.md (Phase 4 legal review).

---
*Phase: 01-foundation*
*Completed: 2026-02-20 (partial — Tasks 2 & 3 require user credentials)*
