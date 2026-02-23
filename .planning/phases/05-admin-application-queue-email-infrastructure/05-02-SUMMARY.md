---
phase: 05-admin-application-queue-email-infrastructure
plan: 02
subsystem: admin-queue
tags: [tanstack-table, shadcn, supabase, server-actions, admin-ui, email, audit-trail]

# Dependency graph
requires:
  - phase: 05-01
    provides: sendEmail helper, 5 email templates, application_status_history table, shadcn/ui components, TanStack Table v8
  - phase: 01-foundation
    provides: Supabase schema (applications, application_zips, zip_seats, email_log, application_status_history tables)
provides:
  - Admin application queue at /admin/applications with TanStack Table, status tabs, search, role filter, pagination
  - Slide-out Sheet panel with full application detail (contact, business, payment, seat context, status history)
  - Server Actions: updateApplicationStatus (auth-gated, Zod-validated, email+audit) and addOutreachNote
  - getApplicationDetail Server Action: full detail + seat context + status history + admin email lookup
  - Separate tab view for partial/draft applications with outreach notes capability
  - Viewer-safe read-only mode (no action buttons when role=viewer)
affects:
  - 05-03 (scarcity controls) — seat context query pattern established
  - All future admin features reuse ApplicationPanel and action patterns

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component page reads URL params + fetches Supabase; passes to Client DataTable (RSC/Client split)
    - Manual TanStack Table pagination (manualPagination: true) with URL-driven page state
    - useTransition wraps Server Action calls for async button loading state
    - AlertDialog-per-action pattern (Approve/Reject/Waitlist each have own dialog)
    - getApplicationDetail caches admin email lookups in-function to avoid N+1 auth.admin.getUserById calls
    - Status tab navigation via router.push() with URL param merging (buildUrl helper)
    - Debounced search (300ms setTimeout) without useDebounce dependency

key-files:
  created:
    - src/app/admin/(dashboard)/applications/page.tsx
    - src/app/admin/(dashboard)/applications/columns.tsx
    - src/app/admin/(dashboard)/applications/data-table.tsx
    - src/app/admin/(dashboard)/applications/application-panel.tsx
    - src/app/admin/(dashboard)/applications/actions.ts
  modified:
    - src/app/admin/(dashboard)/page.tsx (redirect to /admin/applications)

key-decisions:
  - "Admin dashboard page now redirects to /admin/applications — single-destination admin entry point"
  - "applications table uses 'name' field (single string), not first_name/last_name — matches actual schema from 001_foundation.sql"
  - "getApplicationDetail is a Server Action (not a route handler) — called from useEffect in panel for SSR-compatible auth"
  - "Rejection dialog managed with local open state to prevent premature closure on validation failure"
  - "Seat availability = total_cap - phantom_count - claimed_count (application_zips JOIN applications WHERE status IN submitted/approved/waitlisted)"
  - "Status history shown in absolute timestamps per CONTEXT decision (no relative 'time ago')"
  - "sendEmail non-throwing pattern carried forward — email failure never prevents DB status update"

requirements-completed: [ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 5 Plan 02: Admin Application Queue Summary

**TanStack Table v8 admin queue at /admin/applications with slide-out panel, Server Actions for approve/reject/waitlist, audit trail, and email dispatch**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-23T17:25:47Z
- **Completed:** 2026-02-23T17:31:14Z
- **Tasks:** 2 of 2 completed (Task 3 is human verification checkpoint)
- **Files created:** 5 new, 1 modified

## Accomplishments

- Built Server Component page at `/admin/applications` with Supabase queries, URL search params, pagination (25 rows), and 5 separate count queries for status tab badges
- Created 9-column TanStack Table with manual pagination, status filter tabs, 300ms debounced search, role dropdown filter
- Implemented slide-out Sheet panel with full detail: contact info, business profile, payment status with all timestamps (absolute format), ZIP seat availability context, status history timeline
- Built Server Actions `updateApplicationStatus` and `addOutreachNote` with approver auth guard, Zod validation, status history insert, email dispatch (non-throwing), and revalidatePath
- Built `getApplicationDetail` Server Action with UUID-to-email resolution for status history audit trail, and seat context query via application_zips join
- Approver role gets Approve/Reject/Waitlist AlertDialog actions; Reject requires mandatory internal reason; viewer role sees read-only panel
- Admin dashboard root page now redirects to `/admin/applications`

## Task Commits

Each task was committed atomically:

1. **Task 1: Admin applications page with TanStack Table, status tabs, search, role filter, pagination** — `5558fea`
2. **Task 2: Slide-out panel with application detail, status actions, audit trail, outreach notes** — `0ff3f2d`

## Files Created/Modified

- `src/app/admin/(dashboard)/applications/page.tsx` — Server Component, Supabase queries, status counts, URL params
- `src/app/admin/(dashboard)/applications/columns.tsx` — TanStack ColumnDef array for 9 columns with Badge rendering
- `src/app/admin/(dashboard)/applications/data-table.tsx` — Client table with tabs, search, role filter, pagination, Sheet wrapper
- `src/app/admin/(dashboard)/applications/application-panel.tsx` — Slide-out panel with all sections, action dialogs, outreach notes
- `src/app/admin/(dashboard)/applications/actions.ts` — Server Actions: updateApplicationStatus, addOutreachNote, getApplicationDetail
- `src/app/admin/(dashboard)/page.tsx` — Simplified to redirect → /admin/applications

## Decisions Made

- `applications` table uses `name` (single field, not `first_name`/`last_name`) — matched actual schema from 001_foundation.sql
- `getApplicationDetail` is a Server Action called via `useEffect` in the panel — keeps auth in the server, avoids exposing supabaseAdmin to client
- Rejection dialog uses local `open` state (not AlertDialogAction onClick) to allow validation before close
- Seat availability formula: `total_cap - phantom_count - claimed_count` where claimed = submitted+approved+waitlisted count via application_zips join
- Admin email cache in `getApplicationDetail` prevents duplicate `auth.admin.getUserById` calls for same admin

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Schema uses `name` not `first_name`/`last_name`**
- **Found during:** Task 1 (implementing columns.tsx Application interface)
- **Issue:** Plan specified `first_name` field on Application interface and in email dispatch. The actual `applications` table (001_foundation.sql) uses a single `name` column, not separate first/last name fields.
- **Fix:** Updated Application interface to use `name: string`. Updated columns.tsx, data-table.tsx, and actions.ts to reference `app.name` instead of `app.first_name`. Email dispatch uses `firstName: app.name`.
- **Files modified:** columns.tsx, data-table.tsx, actions.ts
- **Committed in:** 0ff3f2d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** No scope creep. Correct field name used throughout.

## Awaiting Verification

Task 3 is a `checkpoint:human-verify`. The admin queue is complete and ready for manual testing:

1. Navigate to `http://localhost:3000/admin/login`
2. Log in as `approver@mvr.internal`
3. Should redirect to `/admin/applications`
4. Verify table renders, tabs filter, search works, role filter works
5. Click a row to open the slide-out panel
6. Test Approve/Reject/Waitlist flows with confirmation dialogs
7. Log in as viewer — verify read-only panel (no action buttons)

## Self-Check

Files created:
- `src/app/admin/(dashboard)/applications/page.tsx` — FOUND
- `src/app/admin/(dashboard)/applications/columns.tsx` — FOUND
- `src/app/admin/(dashboard)/applications/data-table.tsx` — FOUND
- `src/app/admin/(dashboard)/applications/application-panel.tsx` — FOUND
- `src/app/admin/(dashboard)/applications/actions.ts` — FOUND

Commits:
- `5558fea` — Task 1: admin applications page
- `0ff3f2d` — Task 2: slide-out panel and server actions

Build: PASSED (npm run build clean — /admin/applications is dynamic route)
TypeCheck: PASSED (npm run typecheck clean)

## Self-Check: PASSED
