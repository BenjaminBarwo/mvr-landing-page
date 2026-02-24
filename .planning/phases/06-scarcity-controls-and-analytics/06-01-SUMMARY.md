---
phase: 06-scarcity-controls-and-analytics
plan: 01
subsystem: admin, database
tags: [supabase, realtime, tanstack-table, server-actions, rls, postgres, next-js]

# Dependency graph
requires:
  - phase: 05-admin-queue-email
    provides: Admin dashboard shell, applications data-table pattern, actions.ts pattern
  - phase: 01-foundation
    provides: zip_seats table with RLS, supabaseAdmin client, Supabase Auth setup
provides:
  - Supabase Realtime publication for zip_seats (enables public seat checker live updates)
  - page_visits table with RLS for funnel analytics (Plan 02 ANLY-01)
  - /admin/seats page with TanStack Table for inline seat cap and phantom fill editing
  - Server actions: updateZipSeat, bulkSetPhantomFill, resetCapsByTier, fetchSeatsForRole
affects:
  - 06-02 (page_visits table for analytics dashboard)
  - 02-02 (Realtime publication enables live seat checker updates)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TanStack Table with meta.updateData for inline editing (blur-to-save pattern)
    - EditableNumberCell with optimistic local state + server action on blur + green flash
    - DEFAULT_CAPS lookup table for tier-based seat cap resets
    - Prisma db execute via direct connection for DDL migrations (not pooler)

key-files:
  created:
    - supabase/migrations/004_realtime_and_page_visits.sql
    - src/app/admin/(dashboard)/seats/actions.ts
    - src/app/admin/(dashboard)/seats/seats-columns.tsx
    - src/app/admin/(dashboard)/seats/seats-table.tsx
    - src/app/admin/(dashboard)/seats/page.tsx
  modified: []

key-decisions:
  - "TanStack TableMeta extended with updateData typed interface — avoids any-casting in column cells"
  - "fetchSeatsForRole counts claimed seats via application_zips JOIN applications in single query — efficient per-role bulk count"
  - "resetCapsByTier fetches all rows then upserts in chunks of 50 — avoids payload limits for 200+ ZIP bulk updates"
  - "Prisma db execute with direct Supabase connection (db.PROJECT_REF.supabase.co:5432) used for DDL — pgbouncer pooler rejects DDL"

patterns-established:
  - "EditableNumberCell: input + local state + useEffect sync + blur handler + flash feedback + saving state"
  - "Bulk actions toolbar: inline form reveal pattern with Apply/Cancel for phantom fill, confirm dialog for destructive reset"

requirements-completed: [ADMIN-06, ADMIN-07]

# Metrics
duration: 7min
completed: 2026-02-24
---

# Phase 6 Plan 01: Seat Controls Summary

**Admin /admin/seats page with TanStack Table inline editing for ZIP-level seat caps and phantom fill, Supabase Realtime enabled for zip_seats, and page_visits table for funnel analytics**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-24T05:23:29Z
- **Completed:** 2026-02-24T05:30:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Applied migration 004 enabling Supabase Realtime publication on zip_seats and creating page_visits table with RLS (anon INSERT + admin SELECT policies), verified live against Supabase project
- Built /admin/seats server page fetching all zip_seats rows for a selected role with real claimed_count aggregation from application_zips
- Implemented EditableNumberCell with blur-to-save, optimistic state update, 1.5s green flash visual feedback, and saving disabled state
- Added bulk actions toolbar: "Set Phantom Fill for All" with inline number form and "Reset Caps to Default" with confirm dialog
- Role dropdown navigates via URL params; table shows ZIP code, tier (color-coded badge), neighborhood, seat cap, phantom fill, real fills, total displayed, remaining (red when 0)
- Zero TypeScript errors on strict mode compile

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for Realtime publication and page visits table** - `a368e7b` (chore)
2. **Task 2: Seat controls page with inline-editable table and server actions** - `4c129cf` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified

- `supabase/migrations/004_realtime_and_page_visits.sql` - Realtime publication + page_visits table with RLS
- `src/app/admin/(dashboard)/seats/actions.ts` - Server actions: updateZipSeat, bulkSetPhantomFill, resetCapsByTier, fetchSeatsForRole with requireApprover() auth guard
- `src/app/admin/(dashboard)/seats/seats-columns.tsx` - TanStack Table column defs with EditableNumberCell, TierBadge, computed remaining column
- `src/app/admin/(dashboard)/seats/seats-table.tsx` - Client component with role selector, bulk actions toolbar, TanStack Table render
- `src/app/admin/(dashboard)/seats/page.tsx` - Server component reading searchParams.role, calling fetchSeatsForRole

## Decisions Made

- **TableMeta typed extension:** Extended `@tanstack/react-table` TableMeta interface with `updateData` typed as `(id: string, field: string, value: number) => Promise<void>` — avoids any-casting in column cell definitions
- **Claimed count query:** Used application_zips JOIN applications with IN (submitted, approved, waitlisted) and role filter in single Supabase query rather than per-row N+1 queries
- **Batch upsert for resetCapsByTier:** Fetches all rows, builds update array, upserts in chunks of 50 to avoid Supabase payload limits for 200+ ZIP records
- **Direct DB for migrations:** pgbouncer pooler rejects DDL statements; applied migration via `db.vklusufatocafamhrtoc.supabase.co:5432` (true direct connection per STATE.md note from Phase 05)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- **Migration application method:** Plan referenced MCP `apply_migration` tool which was not available. Resolved by using `node_modules/.bin/prisma db execute` with the true direct Supabase connection string (`db.PROJECT_REF.supabase.co:5432`). The pooler URL (aws-us-east-2.pooler.supabase.com) rejects DDL. Connection pattern documented in STATE.md from Phase 05 decision.

## User Setup Required

None — no external service configuration required. The migration was applied directly to the Supabase project during execution.

## Next Phase Readiness

- /admin/seats page is accessible at `/admin/seats?role={role}` for all 6 professional roles
- page_visits table ready for Plan 02 analytics dashboard queries
- Supabase Realtime publication on zip_seats ready for Plan 02's public seat checker Realtime subscription
- Navigation link to /admin/seats will be added by Plan 03 Task 2 (per plan instruction to avoid layout file conflicts)

---
*Phase: 06-scarcity-controls-and-analytics*
*Completed: 2026-02-24*

## Self-Check: PASSED
