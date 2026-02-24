---
phase: 06-scarcity-controls-and-analytics
verified: 2026-02-24T06:30:00Z
status: gaps_found
score: 10/12 must-haves verified
re_verification: false
gaps:
  - truth: "Public seat checker updates in real time when admin changes phantom fill or seat cap via Supabase Realtime"
    status: failed
    reason: "SeatCheckerRealtime component exists and has a working Realtime subscription, but is not imported or rendered anywhere in the public surface. WaitlistModal and page.tsx have no reference to this component. The Realtime infrastructure is built but the wire from component to consumer is absent."
    artifacts:
      - path: "src/components/landing/SeatCheckerRealtime.tsx"
        issue: "Component exists and is substantive (95 lines, correct postgres_changes subscription) but is ORPHANED — no consumer imports or renders it"
      - path: "src/app/page.tsx"
        issue: "Does not import or render SeatCheckerRealtime"
      - path: "src/components/landing/WaitlistModal.tsx"
        issue: "Has SEATS_LOADED dispatch and seatsRemaining state but no SeatCheckerRealtime wiring"
    missing:
      - "Import SeatCheckerRealtime in WaitlistModal.tsx or src/app/page.tsx"
      - "Pass zipCode and role props matching the currently-viewed seat check"
      - "Wire onSeatUpdate to dispatch({ type: 'SEATS_LOADED', data }) or equivalent state setter"
  - truth: "Admin sees a Houston heat map colored by application density or seat fill rate, toggleable between the two views"
    status: partial
    reason: "The map renders correctly using circle markers on ZIP centroids (not polygon choropleth). The toggle between Application Density and Seat Fill Rate works. However, the plan required a GeoJSON choropleth. The implementation pivoted to circle markers (documented deviation: Census TIGER API returned 404). The functional goal of visualizing demand by ZIP is met; the specific choropleth polygon approach was not delivered. Marking partial because the observable truth (colored view toggleable by ZIP) is met but the plan artifact key link (houston-zips.geojson fetched client-side) is not — the geojson file exists but is never fetched."
    artifacts:
      - path: "src/app/admin/(dashboard)/demand-map/demand-map-client.tsx"
        issue: "Fetches /data/houston-zip-centroids.json, not /data/houston-zips.geojson as plan specified. GeoJSON file exists (7319 lines) but is orphaned — not loaded by the map."
    missing:
      - "Either wire houston-zips.geojson into the map (polygon choropleth) or accept the circle-marker approach and update the plan key_link"
      - "No functional gap — the map works — but the plan artifact expectation (GeoJSON polygon choropleth) is unmet"
human_verification:
  - test: "Navigate to /admin/seats, select a role, click a seat cap cell, change the value, click away"
    expected: "Value saves immediately with a green flash on the cell"
    why_human: "Cannot verify visual flash animation or real DB persistence programmatically"
  - test: "Use Set Phantom Fill for All bulk action at /admin/seats"
    expected: "All visible rows in the table update their phantom fill column to the entered value"
    why_human: "Requires live DB and browser interaction to confirm all rows update"
  - test: "Open landing page seat checker in one browser tab. In another tab, change phantom fill in /admin/seats. Check first tab."
    expected: "If SeatCheckerRealtime is wired (it is not currently), the count would update. As-is, verify this does NOT update since wiring is absent."
    why_human: "Realtime subscription behavior requires live browser tabs and DB connection to validate"
  - test: "Navigate to /admin/demand-map, hover over a ZIP circle"
    expected: "Tooltip appears with ZIP code, application count, and fill rate percentage"
    why_human: "Tooltip interaction requires browser"
  - test: "Click a ZIP circle on the demand map"
    expected: "Browser navigates to /admin/seats?zip={code}"
    why_human: "Navigation behavior requires browser"
  - test: "Verify admin navigation header shows Applications, Seats, Demand Map, Analytics with active link highlighted"
    expected: "Active page link has white text and bottom border; inactive links are gray"
    why_human: "Visual active state requires browser"
---

# Phase 6: Scarcity Controls and Analytics Verification Report

**Phase Goal:** Admin can tune perceived demand via phantom fill, enforce seat caps per role per ZIP, and read the funnel metrics needed to interpret demand validation results
**Verified:** 2026-02-24T06:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Admin selects a role from dropdown and sees all ZIP rows with ZIP code, tier, seat cap, phantom fill, real fills, and total displayed | VERIFIED | `seats/page.tsx` fetches via `fetchSeatsForRole`, `SeatsTable` renders 8 columns including all required fields; 6-role dropdown confirmed in `seats-table.tsx` L31-38 |
| 2 | Admin clicks a seat cap or phantom fill cell, types a new value, clicks away, and the value is saved immediately with a green flash indicator | VERIFIED | `EditableNumberCell` in `seats-columns.tsx` L43-101 implements blur handler calling `table.options.meta.updateData`, green flash class applied L84; `updateZipSeat` server action confirmed wired via `seats-table.tsx` L74 |
| 3 | Admin uses bulk action toolbar to set phantom fill for all visible ZIPs or reset caps to default by tier | VERIFIED | `seats-table.tsx` L196-251 renders bulk actions toolbar; `handleApplyPhantomFill` calls `bulkSetPhantomFill` L116; `handleResetCaps` calls `resetCapsByTier` L152 with `window.confirm` gate |
| 4 | Public seat checker updates in real time when admin changes phantom fill or seat cap via Supabase Realtime | FAILED | `SeatCheckerRealtime.tsx` exists with correct `postgres_changes` subscription (L68-87) but is ORPHANED — no import in `WaitlistModal.tsx` or `page.tsx`. The Realtime publication is applied (migration 004 line 13) and the component is ready, but the wiring from component to consumer is absent. |
| 5 | Admin views a revenue summary with KPI cards showing Total Revenue, Refund Count, and Application counts by status | VERIFIED | `analytics/page.tsx` runs parallel Supabase queries for all 7 metrics (L27-65), passes to `KpiCards` component which renders 7 cards (L47-57 of kpi-cards.tsx) |
| 6 | Admin views funnel metrics showing conversion rates and drop-off at each step: visits, Step 1 submit, Step 2 submit, payment initiated, payment complete | VERIFIED | `analytics/page.tsx` L68-122 constructs 5 funnel steps from `page_visits` and `applications` table queries; `FunnelSteps` component renders count, `% of visits`, `% from prev`, drop-off count, and progress bar per step |
| 7 | Admin can filter analytics data by date range (last 7 days, 30 days, all time) | VERIFIED | `analytics/page.tsx` L10-15 parses `searchParams.range`, L27-101 applies `.gte(created_at/visited_at, since)` filter to all queries; 3 link tabs rendered L143-158 |
| 8 | Landing page records a page visit event on each load for funnel tracking | VERIFIED | `PageViewTracker.tsx` fires `POST /api/track/visit` on mount with sessionStorage dedup; imported and rendered at `page.tsx` L12,19; `route.ts` inserts into `page_visits` via `supabaseAdmin` |
| 9 | Admin sees a Houston heat map colored by application density or seat fill rate, toggleable between the two views | PARTIAL | Map renders using circle markers on ZIP centroids (not polygon choropleth as planned). Toggle between Application Density and Seat Fill Rate views works (L155-171 of demand-map-client.tsx). Functional goal met but implementation diverged: `houston-zip-centroids.json` is fetched (L86), not `houston-zips.geojson` (which exists at 7319 lines but is never loaded). |
| 10 | Admin hovers over a ZIP on the map and sees a tooltip with ZIP code, role counts, and fill percentage | VERIFIED | `demand-map-client.tsx` L108-116 binds Leaflet tooltip with ZIP, application count, and fill rate |
| 11 | Admin clicks a ZIP on the map and is navigated to the seat controls table | VERIFIED | `demand-map-client.tsx` L117-119: `marker.on("click", () => router.push(`/admin/seats?zip=${zip}`))` |
| 12 | Admin sees navigation links in the header for Applications, Seats, Demand Map, and Analytics | VERIFIED | `admin-nav.tsx` defines all 4 nav items L6-11; `layout.tsx` imports and renders `<AdminNav />` L4, L36; `usePathname` active state logic at L19 |

**Score:** 10/12 truths verified (1 failed, 1 partial)

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|-------------|--------|---------|
| `supabase/migrations/004_realtime_and_page_visits.sql` | — | 54 | VERIFIED | Contains `ALTER PUBLICATION supabase_realtime ADD TABLE zip_seats` (L13), `page_visits` table with RLS (L22-51) |
| `src/app/admin/(dashboard)/seats/page.tsx` | 20 | 26 | VERIFIED | Server component reads `searchParams.role`, calls `fetchSeatsForRole`, passes to `SeatsTable` |
| `src/app/admin/(dashboard)/seats/seats-table.tsx` | 80 | 301 | VERIFIED | Client component with TanStack Table, role dropdown, bulk actions toolbar, optimistic state updates |
| `src/app/admin/(dashboard)/seats/seats-columns.tsx` | 50 | 190 | VERIFIED | Column definitions with `EditableNumberCell`, `TierBadge`, computed remaining |
| `src/app/admin/(dashboard)/seats/actions.ts` | — | 271 | VERIFIED | Exports `updateZipSeat`, `bulkSetPhantomFill`, `resetCapsByTier`, `fetchSeatsForRole` with `requireApprover()` guard |

### Plan 02 Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|-------------|--------|---------|
| `src/app/admin/(dashboard)/analytics/page.tsx` | 40 | 181 | VERIFIED | Server component, parallel queries via supabaseAdmin for revenue + funnel, date range filtering |
| `src/app/admin/(dashboard)/analytics/kpi-cards.tsx` | 25 | 60 | VERIFIED | 7 KPI cards, 4-col grid, USD formatting for revenue |
| `src/app/admin/(dashboard)/analytics/funnel-steps.tsx` | 40 | 89 | VERIFIED | 5 step cards with count, % of visits, % from prev, drop count, progress bar |
| `src/app/api/track/visit/route.ts` | — | 53 | VERIFIED | POST handler, IP hash, inserts into `page_visits` via `supabaseAdmin`, returns `{ received: true }` |
| `src/components/landing/PageViewTracker.tsx` | 10 | 30 | VERIFIED | "use client", sessionStorage dedup, fire-and-forget fetch, `return null` |

### Plan 03 Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|-------------|--------|---------|
| `src/app/admin/(dashboard)/demand-map/page.tsx` | 20 | 83 | VERIFIED | Server component fetching zip_seats + applications aggregates, renders `DemandMapLoader` via dynamic import |
| `src/app/admin/(dashboard)/demand-map/demand-map-client.tsx` | 80 | 266 | VERIFIED | Leaflet circle-marker map, toggle views, tooltips, click navigation |
| `src/app/admin/(dashboard)/layout.tsx` | — | 51 | VERIFIED | Contains "Seats" via `AdminNav` import and render |
| `public/data/houston-zips.geojson` | 10 | 7319 | VERIFIED (EXISTS, ORPHANED) | File exists with valid GeoJSON FeatureCollection, but demand-map-client.tsx does NOT fetch this file — it fetches `houston-zip-centroids.json` instead |
| `src/components/landing/SeatCheckerRealtime.tsx` | 20 | 95 | ORPHANED | Substantive component (postgres_changes subscription, refetchSeats callback) but no consumer imports or renders it |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `seats-columns.tsx` | `seats/actions.ts` | `table.options.meta.updateData` calls `updateZipSeat` on blur | WIRED | `seats-columns.tsx` L69: `await table.options.meta?.updateData(...)`, `seats-table.tsx` L74: `updateZipSeat` called in `updateData` callback |
| `seats-table.tsx` | `seats/actions.ts` | bulk action buttons call `bulkSetPhantomFill` and `resetCapsByTier` | WIRED | `seats-table.tsx` L116: `bulkSetPhantomFill({...})`, L152: `resetCapsByTier({...})` |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `analytics/page.tsx` | `supabaseAdmin.from('applications')` | SQL aggregate queries for revenue and funnel counts | WIRED | L27-65 revenue queries, L75-101 funnel queries, all use `supabaseAdmin` |
| `analytics/page.tsx` | `supabaseAdmin.from('page_visits')` | Count query for visit funnel step | WIRED | L69-72: `supabaseAdmin.from("page_visits").select("id", { count: "exact", head: true })` |
| `PageViewTracker.tsx` | `src/app/api/track/visit/route.ts` | fetch POST on mount | WIRED | `PageViewTracker.tsx` L14: `fetch("/api/track/visit", { method: "POST", ... })` |

### Plan 03 Key Links

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `demand-map-client.tsx` | `public/data/houston-zips.geojson` | fetch client-side | NOT WIRED | Actual code fetches `/data/houston-zip-centroids.json` (L86), not `houston-zips.geojson`. GeoJSON file exists but is never fetched. |
| `demand-map-client.tsx` | `/admin/seats` | router.push on ZIP click | WIRED | L117-119: `marker.on("click", () => router.push(`/admin/seats?zip=${zip}`))` |
| `SeatCheckerRealtime.tsx` | `supabase.channel` | Realtime subscription on zip_seats | WIRED (component-internal) | L68-87: channel subscription with `postgres_changes`, `event: "UPDATE"`, `table: "zip_seats"` — BUT the component is never rendered anywhere, so the subscription never fires at runtime |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ADMIN-06 | Plan 01 | Admin can configure seat caps per role per ZIP | SATISFIED | `/admin/seats` inline-editable table; `updateZipSeat` server action updates `total_cap`; `resetCapsByTier` resets to tier defaults |
| ADMIN-07 | Plan 01 | Admin can set phantom fill count per ZIP | SATISFIED | `phantom_count` column editable via `EditableNumberCell`; `bulkSetPhantomFill` action for mass updates |
| ADMIN-08 | Plan 03 | Admin can view ZIP demand heat map of Houston | SATISFIED (with deviation) | `/admin/demand-map` renders Leaflet circle-marker map of 209 Houston ZIPs with application density and seat fill rate views, tooltips, and click navigation. Polygon choropleth approach was replaced with circle markers due to Census TIGER API unavailability. |
| ADMIN-09 | Plan 02 | Admin can view revenue tracking (total collected, refunds, count by status) | SATISFIED | `/admin/analytics` shows Total Revenue, Paid Applications, Refunds (Est.), Submitted, Approved, Rejected, Waitlisted KPI cards |
| ANLY-01 | Plan 02 | Funnel metrics tracked: visit → Step 1 submit → Step 2 submit → Payment initiated → Payment complete | SATISFIED | `page_visits` table with anon INSERT RLS; `PageViewTracker` fires on landing page load; analytics page queries all 5 funnel steps from `page_visits` + `applications` |
| ANLY-02 | Plan 02 | Drop-off rate visible per funnel step | SATISFIED | `funnel-steps.tsx` computes and renders `% from prev` and `-N drop` for each step after the first |

All 6 Phase 6 requirements have implementation evidence. ADMIN-08 is satisfied with a documented deviation (circle markers vs polygon choropleth; functional goal is met).

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `seats-table.tsx` | 174 | `placeholder="Select role"` on SelectValue | Info | Shadcn component API usage — not a stub, this is correct component usage |
| `seats-table.tsx` | 264 | `header.isPlaceholder` check | Info | TanStack Table API pattern — not a stub, required for grouped headers |
| `SeatCheckerRealtime.tsx` | 94 | `return null` | Warning | Intentional by design (side-effect component) but the component is ORPHANED — the `return null` is correct but the component itself is never instantiated |

No blocker anti-patterns found in implemented code. The orphaned `SeatCheckerRealtime` is the substantive gap.

---

## Human Verification Required

### 1. Seat Cap Inline Edit with Green Flash

**Test:** Navigate to `/admin/seats`, select a role, click a numeric cell in the "Seat Cap" column, change the value, click elsewhere.
**Expected:** The cell shows a green border/glow for ~2 seconds, then fades. The value persists on page refresh.
**Why human:** Visual animation and DB persistence require browser + live Supabase connection.

### 2. Bulk Phantom Fill Action

**Test:** At `/admin/seats`, click "Set Phantom Fill for All", enter a number, click Apply.
**Expected:** All visible ZIP rows in the table update their Phantom Fill column to the entered value. An alert confirms count of updated rows.
**Why human:** Requires live DB connection and browser interaction to verify all rows update.

### 3. Demand Map Tooltip and Click Navigation

**Test:** Navigate to `/admin/demand-map`. Hover over a colored circle on the map.
**Expected:** A tooltip appears showing "ZIP 77XXX", application count, and fill rate percentage. Clicking the circle navigates to `/admin/seats?zip=77XXX`.
**Why human:** Leaflet map interaction and tooltip rendering require browser.

### 4. Demand Map Toggle Views

**Test:** At `/admin/demand-map`, click "Seat Fill Rate" toggle button, then click "Application Density".
**Expected:** Circle colors change between the two modes (density: gray/green/yellow/red by count; fill rate: green/yellow/orange/red by percentage).
**Why human:** Visual color change on marker layer requires browser.

### 5. Admin Navigation Active State

**Test:** Navigate to each of the 4 admin pages (/admin/applications, /admin/seats, /admin/demand-map, /admin/analytics).
**Expected:** The corresponding nav link in the header shows white text and a bottom border underline; all others show gray text.
**Why human:** Active state visual styling requires browser.

### 6. Analytics Date Range Filter

**Test:** At `/admin/analytics`, click "7 Days", "30 Days", "All Time" tabs.
**Expected:** KPI and funnel numbers change (or stay consistent with data) and the active tab is highlighted white.
**Why human:** Requires data in DB and browser to confirm filtering behavior.

---

## Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — SeatCheckerRealtime is orphaned (blocking for Realtime truth):**
The `SeatCheckerRealtime` component at `src/components/landing/SeatCheckerRealtime.tsx` is fully implemented with a working Supabase Realtime subscription, but it is never imported or rendered anywhere. The WaitlistModal has `SEATS_LOADED` dispatch and `seatsRemaining` state ready to receive updates, but the component is not wired in. The fix is small: add `<SeatCheckerRealtime zipCode={...} role={...} onSeatUpdate={...} />` to `WaitlistModal.tsx` or `page.tsx` alongside the modal, passing the currently-checked ZIP/role and dispatching `SEATS_LOADED` in the callback.

**Gap 2 — GeoJSON choropleth not delivered (partial, functionally met):**
The plan called for a polygon choropleth using `houston-zips.geojson`. The implementation uses circle markers from `houston-zip-centroids.json` (Census TIGER API was unavailable). The GeoJSON file exists (7319 lines, valid FeatureCollection) but is never loaded by the map. The functional admin goal (visualize demand by ZIP, toggle views, hover tooltips, click to seats) is met. This gap is a plan deviation that achieves the underlying requirement (ADMIN-08) but not the plan's specified implementation approach.

Both gaps are contained in Plan 03. Plan 01 (seat controls) and Plan 02 (analytics + tracking) are fully implemented and wired.

---

_Verified: 2026-02-24T06:30:00Z_
_Verifier: Claude (gsd-verifier)_
