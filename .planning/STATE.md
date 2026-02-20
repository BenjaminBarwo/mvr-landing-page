# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Prove ZIP-level demand density and pricing elasticity through real activation willingness at $100 — clean economic signal, not vanity volume
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 1 of 3 in current phase
Status: In progress — Plan 01 execution complete (Tasks 2 & 3 need credentials)
Last activity: 2026-02-20 — Phase 1 Plan 1 executed: project scaffolded, migration file created

Progress: [█░░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1 (partial — migration apply + Vercel deploy pending)
- Average duration: 7 min
- Total execution time: 7 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1/3 | 7 min | 7 min |

**Recent Trend:**
- Last 5 plans: 7 min
- Trend: Baseline established

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-build]: $100 collected at application time — filters for economic seriousness before review
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

### Pending Todos

- Apply migration: supabase/migrations/001_foundation.sql to Supabase project (requires project link or SQL editor paste)
- Configure .env.local with all 8 required environment variables
- Deploy to Vercel with env vars configured (Task 3 of Plan 01)

### Blockers/Concerns

- **[Phase 4 blocker]**: Legal review of the $100 "activation credit" framing must be completed before any payment code is written. This is a sequencing constraint, not a blocker to starting Phase 1-3.
- **[Phase 1 input needed]**: Actual seat cap values for Houston launch are a product decision. Decide before Phase 2 ships so seed data is accurate.
- **[Phase 1 active]**: Migration not yet applied — needs Supabase project ref and credentials. User has 2 existing projects (Orion_MK-1, Leads) — neither clearly MVR. May need new project.
- **[Phase 1 active]**: .env.local not created — all 8 env vars needed before npm run build passes or dev server starts.

## Session Continuity

Last session: 2026-02-20
Stopped at: Plan 01 executed — scaffold and migration file done. Blocked on Supabase credentials to apply migration and Vercel credentials for deployment. See 01-01-SUMMARY.md for full user setup instructions.
Resume file: None
