# Phase 1: Foundation - Research

**Researched:** 2026-02-19
**Domain:** Database schema (Postgres/Supabase), RLS policies, Supabase Auth (email+password), Stripe webhook skeleton, Vercel environment validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Roles & seat caps:**
- Six professional roles: Agent, Lender, Inspector, Title Company, Appraiser, Contractor/Handyman
- Default seat caps vary by role: Agent: 5, Lender: 3, Inspector: 2, Title Company: 2, Appraiser: 2, Contractor/Handyman: 3
- No limit on how many ZIPs a professional can apply to — each ZIP is a separate $100 payment
- One application covers multiple ZIPs (primary ZIP + top 3 = up to 4 ZIPs, payment = number of ZIPs x $100)
- Application uniqueness constraint: one application per email + role combination (same person can apply for different roles)
- When a ZIP/role has 0 seats remaining, applicants can still apply but are warned — they go on waitlist

**Admin auth:**
- Email + password authentication (not magic link)
- 3 admin accounts total: 1 Approver, 2 Viewers
- Admin accounts can use username + password (don't need to be real email addresses)
- Manually provisioned — seed script or manual Supabase setup (Claude's discretion)
- Two admin permission levels: Viewer (read-only) and Approver (can approve/reject/waitlist applications, manage seat caps, manage phantom fill)

**Schema constraints:**
- Application statuses: Claude's discretion to design the status flow based on requirements
- ZIP storage model (junction table vs array): Claude's discretion based on query patterns
- Per-ZIP approval decisions on multi-ZIP applications: Claude's discretion
- Email log tracks ALL email types (received confirmation, approval, rejection, waitlist, and any future types)
- Deduplication: one application per email + role combination

**ZIP seeding:**
- All Houston metro area ZIPs (~180+ including suburbs like Katy, Sugar Land, Pearland)
- Three demand tiers: Premium, Standard, Suburban — Claude to research Houston real estate market data to assign ZIPs to tiers
- Tier cap multipliers: Claude's discretion based on scarcity model
- ZIP metadata stored: ZIP code, neighborhood name, and tier label
- Non-Houston ZIPs: accept any US ZIP in the seat checker but show "Coming soon to your area" — captures demand signal from outside Houston

### Claude's Discretion

- Application status flow design
- ZIP storage architecture (junction table vs array)
- Per-ZIP vs all-or-nothing approval on multi-ZIP applications
- Admin provisioning method (seed script vs manual Supabase)
- Tier cap multipliers for Premium/Standard/Suburban ZIPs
- Session duration and lockout policy for admin auth

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Database schema with RLS (applications, zip_seats, email_log tables) | Schema patterns, RLS policy authoring, partial unique index for race-condition prevention |
| INFRA-02 | Houston ZIP codes seeded with initial seat caps | ZIP dataset source identified (City of Houston Open Data + zip-codes.com), tier assignment approach documented |
| INFRA-03 | Stripe webhook endpoint with signature verification | Route Handler pattern confirmed, `request.text()` + `stripe.webhooks.constructEvent()` verified |
| INFRA-04 | Deployed to Vercel with environment variable management | `@t3-oss/env-nextjs` v0.13.x pattern documented, build-time validation approach confirmed |
| ADMIN-01 | Admin can log in via Supabase Auth — unauthenticated users are redirected | `signInWithPassword`, `@supabase/ssr` middleware pattern, `supabase.auth.admin.createUser()` provisioning confirmed |

</phase_requirements>

---

## Summary

Phase 1 is the infrastructure layer that every subsequent phase builds on. There are five concrete deliverables: the database schema with RLS, Houston ZIP seed data, a Stripe webhook skeleton, admin auth with protected routes, and Vercel deployment with env validation. The good news is that all five are well-documented, non-experimental patterns. The stack decision (Next.js 15 + Supabase + Prisma + Stripe + Vercel) is already locked in prior research; this phase just instantiates the foundation.

The schema is the most consequential deliverable in this phase. Three decisions that are hard to change post-data-entry must be made now: the application status enum and transition function, the ZIP storage model (junction table vs flat array in applications), and the partial unique index on applications(email, role) that prevents duplicate-application and race-condition bugs. The pre-existing architecture research recommends a junction approach for ZIP storage and a status enum backed by a single transition function — both are sound recommendations confirmed by Postgres best practices.

For admin auth, Supabase Auth with `signInWithPassword` (email+password) is confirmed as the correct approach for this project. Admin users are provisioned via a seed script using `supabase.auth.admin.createUser()` with the service role key and `app_metadata.role` set to `'admin'` or `'viewer'` — this claim is immutable by end users, safe in RLS policies, and persists in the JWT without additional round-trips. The `@supabase/ssr` package handles cookie-based session management in Next.js middleware, and route protection for `/admin/*` is a standard three-line middleware pattern.

**Primary recommendation:** Write one SQL migration for the entire schema (tables + RLS + indexes + enums + transition function), then write a separate seed file for ZIP data, then wire the Stripe webhook skeleton and admin auth. Don't split schema across multiple migrations unless there's a hard dependency ordering reason — consolidating reduces migration management overhead at this stage.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (hosted) | latest | Postgres + Auth + Edge Functions | Managed DB ops, built-in RLS, Auth SSR support, Realtime; already project decision |
| @supabase/supabase-js | 2.x | Supabase client for JS/TS | Official client library |
| @supabase/ssr | latest | Server-side session handling in Next.js | Required for App Router — cookie-based sessions in Server/Route Components and middleware |
| Next.js | 15.x | Full-stack framework | Already project decision; App Router provides Route Handlers (webhook), middleware (auth gate), Server Actions |
| TypeScript | 5.x | Type safety | Already project decision; strict mode |
| Stripe | stripe@16.x | Webhook skeleton (test mode) | Server-side Stripe SDK; webhook signature verification via `constructEvent` |
| @t3-oss/env-nextjs | 0.13.x | Environment variable validation | Build-time + runtime Zod validation; throws if required vars are absent; officially recommended for T3 stack |

### Supporting (Phase 1 Specific)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Prisma | 5.x | ORM + migrations | Schema-as-code; `prisma migrate deploy` for production; singleton client for serverless; already project decision |
| zod | 3.x | Schema validation for env vars | Used by @t3-oss/env-nextjs; already a project dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma migrations | Raw Supabase SQL migrations (via `supabase migration`) | Supabase CLI migrations are simpler with less toolchain but lose Prisma's TypeScript type generation. For this project, Prisma is the locked choice. |
| @t3-oss/env-nextjs | Manual `process.env` checks | Manual is fragile and doesn't provide types. T3 env is the correct choice for production apps. |
| `supabase.auth.admin.createUser()` | Manual Supabase Studio user creation | Script is repeatable and version-controlled; manual Studio setup is fine but not reproducible |

**Installation (Phase 1 specific additions — full stack install already in STACK.md):**
```bash
npm install @supabase/supabase-js @supabase/ssr stripe @t3-oss/env-nextjs
npm install -D prisma
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 deliverables)

```
src/
├── env.ts                     # @t3-oss/env-nextjs schema — imported by next.config.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # createBrowserClient (client components)
│   │   └── server.ts          # createServerClient (Server Components, Route Handlers)
│   ├── stripe.ts              # Singleton Stripe server client
│   └── db.ts                  # Prisma client singleton
├── middleware.ts              # @supabase/ssr session refresh + /admin/* route guard
app/
├── admin/
│   ├── layout.tsx             # Admin shell (server component, checks session)
│   └── login/
│       └── page.tsx           # Admin login form
├── api/
│   └── webhooks/
│       └── stripe/
│           └── route.ts       # Stripe webhook Route Handler (POST only)
prisma/
├── schema.prisma              # Database schema definition
└── seed.ts                    # Houston ZIP + admin user seed
supabase/
└── migrations/
    └── 001_foundation.sql     # Full schema SQL with RLS policies
```

---

### Pattern 1: Supabase Client Pair (Browser + Server)

**What:** Two separate Supabase client factories — one for browser (client components), one for server (Server Components, Route Handlers, Server Actions). The `@supabase/ssr` package is required for the server client to handle cookie-based session.

**When to use:** Browser client everywhere a client component needs to call Supabase. Server client everywhere code runs on the server side. Never mix them.

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client

// src/lib/supabase/client.ts (browser — client components)
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// src/lib/supabase/server.ts (server — Server Components, Route Handlers, Actions)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

### Pattern 2: Middleware for /admin/* Route Protection

**What:** Next.js middleware at project root that calls `supabase.auth.getUser()` (NOT `getSession()` — see Pitfall 3 below) and redirects unauthenticated requests to `/admin/login`.

**Critical note from official docs:** "Always use `supabase.auth.getClaims()` or `getUser()` to protect pages. Never trust `supabase.auth.getSession()` inside server code." The session can be forged; `getUser()` validates against the Supabase Auth server.

```typescript
// Source: https://supabase.com/docs/guides/auth/quickstarts/nextjs

// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validates JWT server-side — do NOT use getSession() here
  const { data: { user } } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

### Pattern 3: Admin Login Server Action

**What:** A Server Action that calls `signInWithPassword` and redirects on success. This is the correct email+password pattern for the admin login form.

```typescript
// Source: https://supabase.com/docs/guides/auth/quickstarts/nextjs

// app/admin/login/actions.ts
'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signInAction(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }
  redirect('/admin')
}
```

---

### Pattern 4: Admin User Provisioning via Seed Script

**What:** Use `supabase.auth.admin.createUser()` with the service role key to create admin accounts server-side. Set `app_metadata.role` (NOT `user_metadata`) because `app_metadata` cannot be modified by the user and is safe in RLS policies.

**Why `app_metadata` not `user_metadata`:** Official Supabase docs: "raw_app_meta_data cannot be updated by the user, so it's a good place to store authorization data." This claim is embedded in the JWT and accessible in RLS as `(auth.jwt()->'app_metadata'->>'role')`.

```typescript
// Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

// prisma/seed.ts (or scripts/seed-admin.ts)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // bypasses RLS — server only
)

const admins = [
  { email: 'approver@mvr.internal', password: 'REPLACE_ME', role: 'approver' },
  { email: 'viewer1@mvr.internal',  password: 'REPLACE_ME', role: 'viewer' },
  { email: 'viewer2@mvr.internal',  password: 'REPLACE_ME', role: 'viewer' },
]

for (const admin of admins) {
  await supabase.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,           // skip email verification
    app_metadata: { role: admin.role },
  })
}
```

**RLS policy using this claim:**
```sql
-- Only authenticated users whose JWT has app_metadata.role = 'approver' can update
create policy "Approvers can update applications"
  on applications for update
  to authenticated
  using ((auth.jwt()->'app_metadata'->>'role') = 'approver');
```

---

### Pattern 5: Stripe Webhook Route Handler

**What:** A Route Handler (not a Server Action) that reads the raw request body as text, extracts the `stripe-signature` header, and calls `stripe.webhooks.constructEvent()` to verify. Must be a Route Handler because Stripe needs the unmodified raw body.

```typescript
// Source: https://docs.stripe.com/webhooks

// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()  // raw body — DO NOT parse as JSON first
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: `Webhook verification failed: ${err}` }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      // Phase 4: update application status, trigger email
      break
    case 'payment_intent.payment_failed':
      // Phase 4: update payment status
      break
    default:
      // Unhandled event — log and ignore
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
```

**Phase 1 scope:** This is the skeleton. The `switch` cases are stubs. Actual DB writes happen in Phase 4.

---

### Pattern 6: Environment Variable Validation with @t3-oss/env-nextjs

**What:** Centralize all environment variable declarations in one file. Import it in `next.config.ts` to trigger validation at build time. If any required var is missing, the build fails with a helpful error — not a runtime `undefined` surprise.

```typescript
// Source: https://env.t3.gg/docs/nextjs

// src/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
})

// next.config.ts — import triggers build-time validation
import './src/env'  // for Next.js 16+; jiti wrapper needed for Next.js 15
```

**Next.js 15 note:** Next.js 15 is not 16+. Requires jiti wrapper in `next.config.ts`:
```typescript
// next.config.ts (Next.js 15)
import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import createJiti from 'jiti'

const jiti = createJiti(fileURLToPath(import.meta.url))
jiti('./src/env')  // triggers validation at build time

const nextConfig: NextConfig = {}
export default nextConfig
```
Install: `npm install -D jiti`

---

### Pattern 7: Database Schema — Core Tables + RLS

**What:** Single migration establishing all three tables (`applications`, `zip_seats`, `email_log`) with RLS policies appropriate to the access model: public read on `zip_seats` seat counts, anon insert on `applications`, authenticated admin read/write on all tables.

**Key schema decisions documented here (all Claude's discretion from CONTEXT.md):**

**Decision: ZIP storage — junction table, not array**

The CONTEXT.md gives Claude discretion. Based on query patterns, a junction table (`application_zips`) is recommended over `top_zips text[]` because:
- Admin approval can be per-ZIP (more flexible for future)
- Seat counting queries join on `zip_code` column rather than unnesting an array
- Index-friendly for the partial unique index pattern

**Decision: Application status enum**
```
draft       — Step 1+ submitted, payment NOT yet confirmed
submitted   — Payment confirmed by Stripe webhook
approved    — Admin approved
rejected    — Admin rejected
waitlisted  — Admin waitlisted
```
All transitions go through a single `transition_application_status(application_id, new_status, admin_id)` function.

**Decision: Per-ZIP vs all-or-nothing approval**
Recommend all-or-nothing for Phase 1 simplicity: approving an application approves access to all ZIPs in that application. Per-ZIP approval can be added in a future migration without schema changes (just logic changes).

**Partial unique index (race condition prevention) — CRITICAL:**
```sql
-- Prevents two applications from same email+role
-- Only blocks on non-rejected applications
CREATE UNIQUE INDEX applications_email_role_unique
  ON applications (email, role)
  WHERE status != 'rejected';
```
This is a partial unique index, not a full unique constraint. It allows the same email+role to re-apply after rejection. Must be in the first migration.

**Full schema snippet:**
```sql
-- Roles enum
CREATE TYPE professional_role AS ENUM (
  'agent', 'lender', 'inspector', 'title_company', 'appraiser', 'contractor'
);

-- Status enum
CREATE TYPE application_status AS ENUM (
  'draft', 'submitted', 'approved', 'rejected', 'waitlisted'
);

-- ZIP tier enum
CREATE TYPE zip_tier AS ENUM ('premium', 'standard', 'suburban');

-- applications table
CREATE TABLE applications (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  step_completed           int NOT NULL DEFAULT 1,
  status                   application_status NOT NULL DEFAULT 'draft',
  -- Step 1
  name                     text NOT NULL,
  email                    text NOT NULL,
  phone                    text,
  role                     professional_role NOT NULL,
  -- Step 2 (primary zip — top 3 stored in application_zips)
  primary_zip              text,
  monthly_lead_spend       text,
  leads_per_month          text,
  transactions_closed      text,
  buys_online_leads        boolean,
  -- Step 3 / Payment
  stripe_payment_intent_id text,
  stripe_payment_status    text,
  paid_at                  timestamptz,
  payment_amount_cents     int,
  -- Legal
  terms_accepted_at        timestamptz,
  terms_version            text,
  -- Admin
  reviewed_by              uuid,
  reviewed_at              timestamptz,
  admin_notes              text,
  -- Tracking
  utm_source               text,
  utm_medium               text,
  utm_campaign             text,
  referrer                 text,
  session_id               text
);

-- Race condition prevention: unique application per email+role, excluding rejections
CREATE UNIQUE INDEX applications_email_role_active_unique
  ON applications (email, role)
  WHERE status != 'rejected';

-- application_zips junction table (selected ZIPs beyond primary)
CREATE TABLE application_zips (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  zip_code        text NOT NULL,
  is_primary      boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(application_id, zip_code)
);

-- zip_seats: one row per ZIP per role
CREATE TABLE zip_seats (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code       text NOT NULL,
  role           professional_role NOT NULL,
  total_cap      int NOT NULL DEFAULT 3,
  phantom_count  int NOT NULL DEFAULT 0,
  tier           zip_tier NOT NULL DEFAULT 'standard',
  neighborhood   text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(zip_code, role)
);

-- email_log: send audit trail
CREATE TABLE email_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id       uuid NOT NULL REFERENCES applications(id),
  email_type           text NOT NULL,  -- confirmation | approved | rejected | waitlisted | abandonment_1 | abandonment_2
  sent_at              timestamptz DEFAULT now(),
  provider_message_id  text,
  status               text NOT NULL DEFAULT 'sent'  -- sent | bounced | failed
);

-- Enable RLS on all tables
ALTER TABLE applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_zips ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_seats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log     ENABLE ROW LEVEL SECURITY;

-- RLS: zip_seats — public can read seat counts (for landing page)
CREATE POLICY "zip_seats_public_read" ON zip_seats
  FOR SELECT TO anon, authenticated USING (true);

-- RLS: zip_seats — only authenticated admins can write
CREATE POLICY "zip_seats_admin_write" ON zip_seats
  FOR ALL TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('approver', 'viewer'))
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'approver');

-- RLS: applications — anon can insert (applicants are not auth users)
CREATE POLICY "applications_anon_insert" ON applications
  FOR INSERT TO anon WITH CHECK (true);

-- RLS: applications — anon can read their own application by session_id
CREATE POLICY "applications_session_read" ON applications
  FOR SELECT TO anon USING (session_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS: applications — authenticated admins can read all
CREATE POLICY "applications_admin_read" ON applications
  FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('approver', 'viewer'));

-- RLS: applications — only approvers can update status
CREATE POLICY "applications_approver_update" ON applications
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'approver')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'approver');
```

**Performance note from Supabase docs:** Always use `(select auth.jwt())` not `auth.jwt()` in RLS policies. The `select` wrapper causes Postgres to cache the result per statement rather than re-evaluating it on every row. Benchmark: 178,000ms → 12ms on large tables (99.993% improvement).

---

### Pattern 8: Houston ZIP Seed Data

**What:** Seed `zip_seats` with one row per (zip_code, role) combination. For ~180 Houston metro ZIPs × 6 roles = ~1,080 rows.

**ZIP data source (confirmed):** City of Houston Open Data portal (`data.houstontx.gov`) provides a shapefile of ZIP code polygons from USPS. Free download. Also available: `zip-codes.com` free database with USPS-licensed data, updated February 2026.

**Tier assignment approach (Claude's discretion):** Based on Houston real estate market data:
- **Premium** (highest demand, lowest cap): Inner Loop Houston ZIPs (77002–77010, 77019, 77027, 77098, etc.) — Montrose, Midtown, Heights, River Oaks
- **Standard** (moderate demand): Near suburbs and established neighborhoods (Meyerland, Bellaire, West U, Clear Lake, The Woodlands main)
- **Suburban** (broadest coverage, highest cap): Outer suburbs (Katy, Sugar Land, Pearland, Cypress, Spring, Humble, Friendswood, League City)

**Tier cap multipliers (Claude's discretion):** Starting recommendations for scarcity model:
- Premium: use base caps as-is (Agent:5, Lender:3, etc.) — highest demand, genuine scarcity
- Standard: base caps × 1.5 (rounded up) — Agent:8, Lender:5, Inspector:3, Title:3, Appraiser:3, Contractor:5
- Suburban: base caps × 2 — Agent:10, Lender:6, Inspector:4, Title:4, Appraiser:4, Contractor:6

These multipliers are stored in `zip_seats.total_cap` per row. Admin can adjust any individual cap via Supabase Studio or the Phase 6 admin UI.

**Seed implementation note:** Generate the seed SQL or TypeScript once the ZIP list is sourced. The City of Houston dataset includes neighborhood names — use those for the `neighborhood` column. Tier assignment can be done as a lookup table in the seed script.

---

### Anti-Patterns to Avoid

- **Using `getSession()` in middleware instead of `getUser()`:** Official Supabase docs warn that `getSession()` on the server cannot validate that the session is genuine. Use `getUser()` which validates server-side.
- **Parsing the Stripe webhook body with `request.json()`:** This destroys the raw body Stripe needs for signature verification. Always use `request.text()`.
- **Putting admin role in `user_metadata` instead of `app_metadata`:** Users can self-modify `user_metadata` via `supabase.auth.update()`. Admin roles MUST be in `app_metadata`.
- **Not specifying `TO authenticated` or `TO anon` in RLS policies:** Without role specification, the policy runs for both roles, killing performance (170ms → <0.1ms with role specified).
- **Spreading schema across many small migrations:** For Phase 1, one foundational migration is cleaner and easier to reason about.
- **Hard-coding seed cap values in application code:** Caps live in the DB. The schema supports this; the seed script populates it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT session management | Custom token storage/refresh | `@supabase/ssr` createServerClient | Handles cookie sync across SSR, RSC, middleware; 40+ edge cases |
| Webhook signature verification | Custom HMAC comparison | `stripe.webhooks.constructEvent()` | Timing-safe comparison, replay attack protection, event type validation |
| Environment variable validation | Manual `if (!process.env.X) throw` | `@t3-oss/env-nextjs` | Type inference, build-time failure, prevents missing-var runtime crashes |
| Admin RBAC | Custom role table + join | `app_metadata` claim in JWT | Embedded in JWT = zero extra DB lookup in RLS; immutable by users |
| Postgres unique constraint | Application-level deduplication check | Partial unique index in migration | DB-level guarantee; race-condition proof; retries safe |

**Key insight:** Every item in this table has subtleties that cause bugs when built from scratch. The partial unique index is the most critical — application-level deduplication has an inherent race condition window that a DB constraint closes completely.

---

## Common Pitfalls

### Pitfall 1: Stripe Webhook Body Parsed Before Signature Check

**What goes wrong:** Using `await request.json()` or Next.js body parser before passing to `constructEvent`. The signature verification fails because the body has been re-serialized.

**Why it happens:** Next.js developers instinctively use `request.json()`. Route Handlers don't auto-parse bodies (unlike Pages Router API routes with `bodyParser: false` config needed), but developers still reach for `.json()` first.

**How to avoid:** Always `const body = await request.text()` as the first line of the POST handler. Never call `.json()` in a webhook handler.

**Warning signs:** Stripe signature verification errors in logs even when the secret is correct.

---

### Pitfall 2: RLS Blocks Webhook DB Writes

**What goes wrong:** The Stripe webhook Route Handler tries to update `applications.status` using the anon Supabase client. RLS policy blocks the write.

**Why it happens:** Webhook handlers have no user session. They run as the anon role unless a service-role client is used.

**How to avoid:** Webhook and Server Actions that need to bypass RLS (e.g., payment confirmation, email log writes) must use a **service-role Supabase client**, not the anon client. Keep this client server-side only.

```typescript
// lib/supabase/admin.ts — service role client for server-only operations
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Warning signs:** 403 or silent empty results from DB writes in webhook handlers.

---

### Pitfall 3: Using `getSession()` Instead of `getUser()` for Route Protection

**What goes wrong:** Admin routes appear protected but can be accessed by crafting a fake session cookie.

**Why it happens:** `getSession()` reads cookies without server-side validation. `getUser()` makes a network call to Supabase Auth to validate the JWT is genuine.

**How to avoid:** In `middleware.ts`, always use `supabase.auth.getUser()`. Accept the small latency cost. Official Supabase docs explicitly warn against `getSession()` in server code.

**Warning signs:** Security audit failure; admin routes accessible with crafted cookies.

---

### Pitfall 4: Missing Partial Unique Index on First Migration

**What goes wrong:** Two simultaneous submissions from the same email+role both succeed, creating duplicate application records. One person ends up with two payment records.

**Why it happens:** Without a DB-level constraint, any application-level check has a race condition window during concurrent requests.

**How to avoid:** Include the partial unique index in the FIRST migration. It cannot be added after payment data exists without risk of violating existing data.

```sql
CREATE UNIQUE INDEX applications_email_role_active_unique
  ON applications (email, role)
  WHERE status != 'rejected';
```

**Warning signs:** Duplicate (email, role) pairs in the applications table.

---

### Pitfall 5: Houston ZIP List Missing Suburbs

**What goes wrong:** Applicants from Sugar Land (77478, 77479, 77498), Katy (77449, 77450, 77494), or Pearland (77581, 77584) find no seats available — not because seats are full, but because those ZIPs are not seeded.

**Why it happens:** "Houston" naively maps to city-limit ZIPs. The metro area covers Fort Bend County, Harris County, Brazoria County and more.

**How to avoid:** Use the City of Houston Open Data dataset or zip-codes.com — both include metro area ZIPs. The context doc specifies ~180+ ZIPs including suburbs. Verify the seeded list covers all Fort Bend, southern Harris County, and Brazoria County entries.

**Warning signs:** Users entering valid Houston-area ZIPs and seeing "Coming soon to your area."

---

### Pitfall 6: Admin Accounts Using Real Email Addresses

**What goes wrong:** Admin test accounts get reset-password emails sent to real inboxes; Supabase email limits are hit; credentials are in email.

**Why it happens:** Default assumption that email addresses are real.

**How to avoid:** CONTEXT.md explicitly allows `username + password` format (e.g., `approver@mvr.internal`). Use internal-domain addresses that cannot receive external email. Set `email_confirm: true` in `createUser()` to skip email confirmation. No actual email is sent.

---

### Pitfall 7: Supabase API Key Confusion (anon vs publishable vs service_role)

**What goes wrong:** Wrong key used in wrong context. Service role key exposed to client. Anon key used where service role needed.

**Why it happens:** Supabase is transitioning from legacy `anon`/`service_role` JWT keys to new `sb_publishable_xxx` format. Both formats work currently. Naming is confusing.

**How to avoid:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key) — safe to expose to browser, limited by RLS
- `SUPABASE_SERVICE_ROLE_KEY` — NEVER in client code, bypasses RLS entirely, server-only

Use `@t3-oss/env-nextjs` to enforce this: anon key in `client:` block (NEXT_PUBLIC_ prefix), service role in `server:` block (never shipped to browser).

---

## Code Examples

Verified patterns from official sources:

### RLS Performance — Correct Function Call Syntax

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- WRONG — re-evaluates auth.jwt() on every row (catastrophic for large tables)
USING (auth.jwt()->'app_metadata'->>'role' = 'approver');

-- CORRECT — cached once per statement (99.99% faster on large tables)
USING ((select auth.jwt())->'app_metadata'->>'role' = 'approver');
```

### Stripe Test Webhook with Stripe CLI

```bash
# Source: https://docs.stripe.com/webhooks

# During local development — forward Stripe events to local Next.js
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# The CLI outputs a signing secret like: whsec_test_...
# Use this as STRIPE_WEBHOOK_SECRET in .env.local
```

### Admin User Verification (checking role in a Server Component)

```typescript
// Checking admin role server-side before rendering admin content
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role
  if (!role || !['approver', 'viewer'].includes(role)) {
    redirect('/admin/login')
  }

  // Render admin UI
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Mid-2023 | `auth-helpers` is deprecated; `@supabase/ssr` is the correct package for Next.js App Router |
| `supabase.auth.session()` / `getSession()` server-side | `supabase.auth.getUser()` server-side | 2024 | `getSession()` on server is insecure — can be spoofed; `getUser()` validates against Auth server |
| Legacy anon key (`eyJhbG...` JWT) | Publishable key (`sb_publishable_xxx`) | 2024–2025 | New format in transition; both work; new projects should use publishable key |
| `bodyParser: false` in Pages Router API routes | `await request.text()` in Route Handlers | Next.js 13+ App Router | Route Handlers don't auto-parse; `request.text()` is the idiomatic raw body method |
| Magic link only for admin | `signInWithPassword` | Always available | Project decision specifies email+password; works with Supabase Auth out of the box |
| Custom RBAC tables | `app_metadata` claims in JWT | Supabase always | JWT-embedded claims = zero extra DB lookup per request; app_metadata is immutable by users |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not install or use.
- `auth.role()` in RLS policies: Deprecated helper. Use `(select auth.jwt())->'app_metadata'->>'role'` directly.

---

## Open Questions

1. **Exact Houston ZIP list and tier assignments**
   - What we know: ~180+ ZIPs in Houston metro area; City of Houston Open Data has shapefile; zip-codes.com has USPS-licensed data
   - What's unclear: The exact boundary for "metro area" (how far out to include), and which specific ZIPs to classify as Premium vs Standard vs Suburban
   - Recommendation: Download the City of Houston Open Data ZIP polygon dataset during Phase 1 implementation. Use inner loop ZIPs as Premium (inside Loop 610), major established suburbs as Standard (inside Beltway 8 or major corridors), outer suburbs as Suburban. The planner should include a task to produce a definitive list before the seed task runs.

2. **Prisma vs raw SQL migrations — toolchain decision**
   - What we know: The stack research recommends Prisma 5 for type-safe ORM. Supabase also has its own migration tooling (`supabase migration`).
   - What's unclear: Whether to use `prisma migrate` (manages schema.prisma) or `supabase migration` (raw SQL) or both in combination.
   - Recommendation: Use Prisma as the ORM for application queries and type generation. Manage the initial schema as a raw SQL migration in `supabase/migrations/` (the format Supabase expects for `supabase db push`). This approach avoids Prisma's Supabase cross-schema FK limitation noted in the Supabase/RedwoodJS docs while still getting Prisma type safety at the query layer.

3. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` naming**
   - What we know: Supabase is transitioning key formats. Both `anon` JWT keys and new `sb_publishable_xxx` keys work. The new format is recommended for new projects.
   - What's unclear: The env var name convention is inconsistent across Supabase docs examples.
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the env var name (matches most Supabase docs examples and all `@supabase/ssr` examples). The actual key value can be either format — Supabase accepts both. This avoids confusion when following Supabase's own documentation.

4. **Session duration and lockout for admin accounts**
   - What we know: Supabase Auth default session is 1 week (configurable in project Auth settings). No built-in account lockout after N failed attempts.
   - What's unclear: Whether the default session duration is appropriate for admin accounts.
   - Recommendation: Default 1-week session is acceptable for Phase 1 internal admin with 3 known users. Reduce to 8-hour expiry in Supabase Auth settings if the team wants tighter security. Lockout is not built into Supabase Auth — skip for Phase 1.

---

## Sources

### Primary (HIGH confidence)
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy authoring, performance recommendations, `(select auth.jwt())` caching pattern
- [Supabase SSR client creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `createBrowserClient` / `createServerClient` pattern, cookie handling
- [Supabase Auth + Next.js quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — middleware protection, `signInWithPassword`, `getUser()` vs `getSession()` warning
- [Supabase Custom Claims RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) — `app_metadata` vs `user_metadata`, RLS with JWT claims
- [Stripe Webhooks docs](https://docs.stripe.com/webhooks) — `constructEvent()`, raw body requirement, `stripe-signature` header
- [@t3-oss/env-nextjs docs](https://env.t3.gg/docs/nextjs) — `createEnv`, build-time validation, jiti wrapper for Next.js 15
- [City of Houston Open Data](https://data.houstontx.gov/dataset/zip-codes-in-the-region) — ZIP code polygon shapefile from USPS

### Secondary (MEDIUM confidence)
- [zip-codes.com free database](https://www.zip-codes.com/free-zip-code-database.asp) — USPS-licensed data, updated February 2026; secondary Houston ZIP source
- Pre-existing project research in `.planning/research/` (ARCHITECTURE.md, PITFALLS.md, STACK.md, SUMMARY.md) — all MEDIUM-HIGH confidence, researched 2026-02-19

### Tertiary (LOW confidence — flagged for validation)
- Houston ZIP tier assignments (Premium/Standard/Suburban) — derived from general knowledge of Houston real estate geography; should be validated against actual real estate agent market familiarity before seed data is finalized

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are official recommendations, version-verified, patterns from official docs
- Architecture: HIGH — all patterns sourced from official Supabase, Stripe, and T3 docs; cross-verified with WebSearch
- Schema design: HIGH for structure; MEDIUM for RLS policy correctness on edge cases (anon session read policy needs testing)
- ZIP tier assignments: LOW — general Houston geography knowledge, not sourced from official real estate data; must be validated
- Pitfalls: HIGH — each pitfall sourced from official docs or prior verified project research

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (30 days — stable ecosystem, no fast-moving dependencies in this phase)
