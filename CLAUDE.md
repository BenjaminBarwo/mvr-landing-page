# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MVR Founding Seat Landing Page — a demand validation system for ZIP-level controlled routing. Collects $100 activation credits from Houston-area real estate professionals applying for founding seats. Three surfaces: public landing page, multi-step application form with Stripe payment, and admin dashboard.

## Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript strict)
- **Database**: Supabase (Postgres + Auth + RLS + Realtime)
- **ORM**: Prisma 5 (type generation + queries; schema managed via raw SQL migrations in `supabase/migrations/`)
- **Payments**: Stripe (Payment Element, webhooks)
- **Forms**: React Hook Form + Zod + @hookform/resolvers
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Email**: Resend + React Email
- **Hosting**: Vercel
- **Env validation**: @t3-oss/env-nextjs (build-time Zod validation via jiti in next.config.ts)

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (validates env vars via @t3-oss/env-nextjs)
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npx prisma generate  # Regenerate Prisma client after schema changes
npm run seed:admin   # Provision 3 admin accounts (approver + 2 viewers)
npm run seed:zips    # Seed Houston ZIP codes into zip_seats table

# Stripe local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Architecture

### Three Surfaces, One Database

```
Public (unauthenticated):  /  /apply  /apply/confirmation
Admin (Supabase Auth):     /admin/*
Webhooks (signature-verified): /api/webhooks/stripe
```

All surfaces share one Supabase Postgres database. Applicants are NOT auth users — only admins authenticate.

### Key Files

- `src/env.ts` — centralized env var validation (imported by next.config.ts for build-time enforcement)
- `src/middleware.ts` — protects `/admin/*` routes via `supabase.auth.getUser()`
- `src/lib/supabase/client.ts` — browser Supabase client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server Supabase client (`createServerClient` with cookies)
- `src/lib/supabase/admin.ts` — service-role client (bypasses RLS, server-only)
- `src/lib/stripe.ts` — Stripe server singleton
- `src/lib/db.ts` — Prisma client singleton (serverless-safe)

### Database Schema

Five tables with RLS enabled on all:
- `applications` — multi-step application records (draft→submitted→approved/rejected/waitlisted)
- `application_zips` — junction table for selected ZIP territories
- `zip_seats` — one row per ZIP per role, with seat caps and phantom fill counts
- `email_log` — transactional email audit trail
- `out_of_area_interest` — demand signals from non-Houston ZIPs

Critical index: partial unique on `applications(email, role) WHERE status != 'rejected'` prevents duplicate applications while allowing re-application after rejection.

### Admin Roles

Two permission levels stored in `app_metadata.role` (immutable by users, embedded in JWT):
- **approver** — full read/write (approve, reject, waitlist, manage seats/phantom fill)
- **viewer** — read-only access

Admin accounts use `@mvr.internal` email addresses (not real emails).

## Critical Patterns

### Supabase Auth
- **Always `getUser()`, never `getSession()`** in server code — `getSession()` can be spoofed
- Admin roles via `app_metadata.role`, NOT `user_metadata` — `app_metadata` is immutable by users
- Use `(select auth.jwt())` (with wrapping select) in RLS policies for caching — 99.99% faster than bare `auth.jwt()`

### Stripe Webhooks
- Read body with `await request.text()` — NEVER `request.json()` (destroys signature verification)
- Webhook is authoritative for payment status — never trust client redirect alone
- Webhook handler uses service-role Supabase client to bypass RLS

### Forms
- Progressive DB save: each form step upserts immediately (Step 1 creates record, Step 2/3 updates)
- Session recovery via `session_id` in localStorage + DB lookup

### Environment Variables
Server: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
Client: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Code Style

- TypeScript strict mode — no `any`, use `unknown`
- Prefer `interface` over `type` (except unions/intersections)
- Use early returns, avoid nested conditionals
- Prefer composition over inheritance
- Conventional Commits: `feat:`, `fix:`, `docs:`, etc.

## Six Professional Roles

agent, lender, inspector, title_company, appraiser, contractor — these are Postgres enums and appear throughout the schema, seed data, forms, and seat checker.

## ZIP Tier System

Three tiers with seat cap multipliers applied to base caps (Agent:5, Lender:3, Inspector:2, Title:2, Appraiser:2, Contractor:3):
- **Premium** (1x) — Inner Loop Houston (highest demand, lowest caps)
- **Standard** (1.5x) — Inside Beltway 8 / established suburbs
- **Suburban** (2x) — Outer suburbs (Katy, Sugar Land, Pearland, etc.)

## Planning

GSD planning artifacts live in `.planning/` — roadmap, requirements, phase plans, research docs. The project builds in 6 phases: Foundation → Landing Page → Application Form → Payment/Email → Admin Queue → Scarcity Controls/Analytics.
