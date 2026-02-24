---
phase: 06-scarcity-controls-and-analytics
plan: 02
subsystem: admin-analytics
tags: [analytics, tracking, funnel, revenue, admin-dashboard]
dependency_graph:
  requires:
    - 06-01 (page_visits table migration must exist in DB)
  provides:
    - POST /api/track/visit endpoint
    - PageViewTracker client component
    - /admin/analytics page with KPI cards and funnel visualization
  affects:
    - src/app/page.tsx (PageViewTracker added)
    - Admin dashboard (new /admin/analytics route)
tech_stack:
  added: []
  patterns:
    - supabaseAdmin for server-side DB queries bypassing RLS
    - Server component with searchParams for date range filtering
    - Fire-and-forget fetch for analytics tracking (non-blocking)
    - sessionStorage flag for single-fire dedup in PageViewTracker
    - Client-side revenue sum from fetched payment_amount_cents rows
key_files:
  created:
    - src/app/api/track/visit/route.ts
    - src/components/landing/PageViewTracker.tsx
    - src/app/admin/(dashboard)/analytics/page.tsx
    - src/app/admin/(dashboard)/analytics/kpi-cards.tsx
    - src/app/admin/(dashboard)/analytics/funnel-steps.tsx
  modified:
    - src/app/page.tsx (added PageViewTracker import and component)
decisions:
  - "Vertical step cards for funnel (zero chart library dependencies, dark admin aesthetic match)"
  - "Client-side revenue sum over small row set vs SQL aggregate — simpler, adequate for MVP scale"
  - "sessionStorage flag mvr_visit_tracked prevents double-tracking on React re-renders"
  - "Fire-and-forget fetch in PageViewTracker with .catch() swallowing errors — tracking never blocks UX"
  - "Refund proxy: COUNT WHERE status=rejected AND stripe_payment_status=succeeded — no refunded_at column needed for MVP"
metrics:
  duration: 2 min
  completed: 2026-02-24T05:25:54Z
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 6 Plan 02: Analytics Dashboard and Page Visit Tracking Summary

**One-liner:** Revenue KPI cards and funnel step visualization at /admin/analytics with fire-and-forget page visit tracking via POST /api/track/visit.

## What Was Built

### Task 1: Page Visit Tracking (commit 54ef209)

**`src/app/api/track/visit/route.ts`**
POST endpoint that accepts JSON body with `path`, `session_id`, `utm_source`, `utm_medium`, `utm_campaign`. Extracts IP from `x-forwarded-for`/`x-real-ip` headers, hashes it with a simple non-cryptographic function for deduplication, and inserts a row into `page_visits` via `supabaseAdmin` (bypasses RLS). Returns 200 `{ received: true }` on success, 500 on error. Non-critical path — errors logged but not re-thrown.

**`src/components/landing/PageViewTracker.tsx`**
"use client" component that renders null but fires a tracking POST on mount via `useEffect`. Checks `sessionStorage` for `mvr_visit_tracked` flag to prevent double-tracking across React re-renders. Extracts UTM params from `URLSearchParams` and `mvr_session_id` from localStorage. Uses fire-and-forget fetch (no await, .catch() swallows errors).

**`src/app/page.tsx`** (modified)
Added `<PageViewTracker />` at the top of the JSX return. Renders null — no visual change to the landing page. Added import for the component.

### Task 2: Analytics Dashboard (commit a41f2c7)

**`src/app/admin/(dashboard)/analytics/page.tsx`**
Server component. Reads `searchParams.range` ("7", "30", or "all"; defaults to "30"). Calculates `since` date. Runs parallel queries via `supabaseAdmin`:
- Revenue: fetches `payment_amount_cents` for succeeded payments and sums client-side; separate count queries per status
- Funnel: counts from `page_visits.visited_at`, `step1_completed_at`, `step2_completed_at`, `stripe_payment_intent_id IS NOT NULL`, `stripe_payment_status = 'succeeded'`
Renders date range tab selector (3 links: 7 Days / 30 Days / All Time), `KpiCards` section, and `FunnelSteps` section.

**`src/app/admin/(dashboard)/analytics/kpi-cards.tsx`**
Stateless server-compatible component. Accepts 7 props (totalRevenueCents, paidCount, refundCount, submittedCount, approvedCount, rejectedCount, waitlistedCount). Renders a 4-column (desktop) / 2-column (mobile) grid of dark-themed KPI cards (bg-gray-900, border-gray-800). Revenue formatted as USD currency via `toLocaleString`. Refund card includes subtitle "Based on rejected paid applications".

**`src/app/admin/(dashboard)/analytics/funnel-steps.tsx`**
Stateless component accepting `steps: Array<{ name: string, count: number }>`. Renders 5 vertical step cards. Each card shows: step name, absolute count in step-specific color (blue/indigo/purple/orange/green), "Top of funnel" badge for step 1, and for subsequent steps: % of visits badge, "% from prev · -N drop" annotation. Progress bar scaled proportionally to top-of-funnel count.

## Decisions Made

1. **No chart library** — vertical step cards with CSS progress bars instead of Recharts FunnelChart. Zero additional dependencies, matches dark admin aesthetic perfectly, shows all required data (count, drop-off rate, progress bar).

2. **Client-side revenue sum** — fetch `payment_amount_cents` rows and reduce in JS rather than using SQL SUM aggregate. Supabase JS client does not support FILTER(WHERE...) for aggregates cleanly; at MVP scale (<1000 applications) this is fast and simple.

3. **sessionStorage dedup** — `mvr_visit_tracked` flag in sessionStorage ensures exactly one tracking event per browser session regardless of React re-renders or strict mode double-effects.

4. **Refund proxy** — `status = 'rejected' AND stripe_payment_status = 'succeeded'` as refund count estimate. No `refunded_at` column needed for MVP; this set represents paid applications that triggered admin rejection (and therefore a refund).

5. **Date range as URL searchParams** — date filter implemented as links to `?range=7/30/all`, not client state. Enables bookmarkable URLs and server-side filtering with no client JS needed.

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None encountered.

## Self-Check

Files verified to exist:
- FOUND: src/app/api/track/visit/route.ts
- FOUND: src/components/landing/PageViewTracker.tsx
- FOUND: src/app/admin/(dashboard)/analytics/page.tsx
- FOUND: src/app/admin/(dashboard)/analytics/kpi-cards.tsx
- FOUND: src/app/admin/(dashboard)/analytics/funnel-steps.tsx

TypeScript: `./node_modules/.bin/tsc --noEmit` exits 0 — no errors.

Commits verified:
- 54ef209: feat(06-02): add page visit tracking endpoint and PageViewTracker component
- a41f2c7: feat(06-02): analytics dashboard with revenue KPI cards and funnel step visualization

## Self-Check: PASSED
