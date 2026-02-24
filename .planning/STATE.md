# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Prove ZIP-level demand density and pricing elasticity through real activation willingness at $100 — clean economic signal, not vanity volume
**Current focus:** Phase 6 in progress — 06-01 and 06-02 complete; 06-03 pending

## Current Position

Phase: 6 of 6 in progress (Scarcity Controls and Analytics)
Plan: 2 of 3 complete (06-01 seat controls and 06-02 analytics dashboard done; 06-03 pending)
Status: Phase 6 Plans 01 and 02 complete — seat controls page with inline editing and analytics dashboard operational
Last activity: 2026-02-24 — Phase 6 Plan 01 executed: /admin/seats, migration 004, seat controls with TanStack Table

Progress: [████████░░] 80% (Phase 6 in progress)

## Performance Metrics

**Velocity:**
- Total plans completed: 5 (Phase 1 + Phase 5 complete)
- Average duration: 17 min
- Total execution time: 69 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 22 min | 11 min |
| 05-admin-queue-email | 2/2 | 47 min | 23.5 min |

**Recent Trend:**
- Last 5 plans: 7 min (01-01), N/A (01-02 skipped), 15 min (01-03), 42 min (05-01), 5 min (05-02)
- Trend: Stable

*Updated after each plan completion*

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-foundation P01 | 7 min | 3 tasks | N/A |
| Phase 01-foundation P03 | 15 min | 2 tasks | 3 files |
| Phase 05-admin-application-queue-email-infrastructure P01 | 42 min | 2 tasks | 20 files |
| Phase 05-admin-application-queue-email-infrastructure P02 | 5 min | 2 tasks | 6 files |
| Phase 06-scarcity-controls-and-analytics P02 | 2 | 2 tasks | 6 files |
| Phase 06-scarcity-controls-and-analytics P01 | 7 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-build]: ### Decisions

00 collected at application time — filters for economic seriousness before review
- [Pre-build]: Progressive DB save per step — every step is signal; enables abandonment recovery
- [Pre-build]: Webhook-first payment confirmation — Stripe webhook is authoritative, never client callback
- [Pre-build]: Legal review required before Phase 4 — "activation credit" framing has chargeback risk
- [Pre-build]: Phantom fill stored in database (zip_seats table) — never hard-coded or client-side
- [01-01]: Prisma 7 used (npm installed latest) — datasource URL moved to prisma.config.ts, not schema.prisma
- [01-01]: Application status flow: draft → submitted (payment confirmed) → approved/rejected/waitlisted
- [01-01]: ZIP storage = junction table (application_zips) — better query patterns than array column
- [01-01]: All-or-nothing approval for Phase 1 — per-ZIP approval deferred to future migration
- [01-01]: Partial unique index on applications(email, role) WHERE status != 'rejected' — DB-level race condition prevention
- [01-01]: RLS uses (select auth.jwt()) wrapper — 99.99% performance improvement for large tables
- [01-02]: getUser() enforced in middleware and layout — never getSession() — security non-negotiable per research
- [01-02]: Admin accounts use @mvr.internal emails — not real emails, cannot be spam-flagged
- [01-02]: Webhook route excluded from admin auth — /api/webhooks/stripe must be publicly accessible for Stripe
- [01-02]: Prisma 7 driver adapter deferred to Phase 3 — no DB queries until application form built
- [Phase 01-foundation]: 209 ZIPs seeded (above 180-200 target): full Houston metro coverage warranted for demand signal capture
- [Phase 01-foundation]: npm seed scripts use node --env-file=.env.local node_modules/.bin/tsx to bypass PATH colon issue from project directory name
- [Phase 05-01]: sendEmail is non-throwing — email failures log but never crash callers (critical for webhook reliability)
- [Phase 05-01]: Idempotency key format: emailType/applicationId — prevents Resend duplicate sends on webhook retries
- [Phase 05-01]: DIRECT_URL in .env.local points to pooler, not direct DB — true direct host is db.PROJECT_REF.supabase.co:5432 with postgres user
- [Phase 05-02]: Admin dashboard redirects to /admin/applications — single entry point for admin team
- [Phase 05-02]: applications.name is a single field (not first_name/last_name) — schema confirmed from 001_foundation.sql
- [Phase 05-verify]: Login email input uses type="text" (not type="email") to support .internal TLD
- [Phase 05-verify]: Zod UUID validation relaxed to string().min(1) — DB enforces UUID type, avoids RFC 4122 strictness issues
- [Phase 05-verify]: CSS imports use explicit node_modules paths for Turbopack dev server compatibility
- [Phase 06-scarcity-controls-and-analytics]: Vertical step cards for funnel visualization — zero chart library dependencies, dark admin aesthetic match
- [Phase 06-scarcity-controls-and-analytics]: Refund proxy: COUNT WHERE status=rejected AND stripe_payment_status=succeeded — no refunded_at column for MVP
- [Phase 06-scarcity-controls-and-analytics]: Date range filter as URL searchParams links — bookmarkable, server-side filtering, no client JS
- [Phase 06-01]: TanStack TableMeta extended with updateData typed interface — avoids any-casting in column cells
- [Phase 06-01]: Prisma db execute with direct DB connection (db.PROJECT_REF.supabase.co:5432) required for DDL — pgbouncer pooler rejects DDL statements
- [Phase 06-01]: resetCapsByTier batches upserts in chunks of 50 to avoid payload limits for 200+ ZIP records

### Pending Todos

- Apply migration: supabase/migrations/001_foundation.sql to Supabase project (requires project link or SQL editor paste) — still needed if not already applied
- Deploy to Vercel with env vars configured (Phase 1 Plan 01 Task 3)
- Install Prisma 7 driver adapter (@prisma/adapter-pg) before Phase 3 when DB queries are first needed
- Begin Phase 2: Landing Page (public-facing homepage + seat checker)
- Configure RESEND_API_KEY with real key and update sender domain in src/lib/email.ts

### Blockers/Concerns

- **[Phase 4 blocker]**: Legal review of the $100 "activation credit" framing must be completed before any payment code is written. This is a sequencing constraint, not a blocker to starting Phase 2-3.
- **[Phase 2 input]**: Seat cap values are now seeded — if product wants to adjust caps, update houston-zips.json and re-run seed:zips before Phase 2 ships.
- **[Email setup required]**: RESEND_API_KEY must be configured and sending domain verified before emails will actually deliver.

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 06-01-PLAN.md — seat controls page with inline editing, migration 004, Realtime publication. Next: 06-03 (demand map / nav links).
Resume file: None
