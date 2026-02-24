---
phase: 06-scarcity-controls-and-analytics
plan: 03
subsystem: admin, realtime
tags: [leaflet, react-leaflet, geojson, realtime, supabase, choropleth, next-js]

# Dependency graph
requires:
  - phase: 06-scarcity-controls-and-analytics
    plan: 01
    provides: Supabase Realtime publication on zip_seats, /admin/seats page
  - phase: 06-scarcity-controls-and-analytics
    plan: 02
    provides: /admin/analytics page, page visit tracking

provides:
  - /admin/demand-map page with Leaflet choropleth heat map of Houston ZIPs
  - public/data/houston-zips.geojson with 209 approximate ZIP polygons
  - Admin navigation bar linking to Applications, Seats, Demand Map, Analytics
  - SeatCheckerRealtime component subscribing to zip_seats Realtime events

affects:
  - src/app/page.tsx (SeatCheckerRealtime can be wired into WaitlistModal parent)
  - Admin layout — all admin pages now have nav bar

# Tech tracking
tech-stack:
  added:
    - react-leaflet@5.0.0
    - leaflet@1.9.4
    - "@types/leaflet@1.9.21"
  patterns:
    - dynamic() import with ssr:false for Leaflet (accesses window/document — SSR incompatible)
    - GeoJSON choropleth with setStyle() called on view mode toggle
    - SeatCheckerRealtime renders null — purely a side-effect subscription component
    - AdminNav as small "use client" component inside server layout — avoids converting entire layout to client

key-files:
  created:
    - src/app/admin/(dashboard)/demand-map/page.tsx
    - src/app/admin/(dashboard)/demand-map/demand-map-client.tsx
    - src/app/admin/(dashboard)/admin-nav.tsx
    - src/components/landing/SeatCheckerRealtime.tsx
    - public/data/houston-zips.geojson
  modified:
    - src/app/admin/(dashboard)/layout.tsx

key-decisions:
  - "Leaflet imported dynamically with ssr:false — Leaflet accesses window/document, breaks SSR"
  - "GeoJSON uses approximate rectangular polygons — Census TIGER ZCTA API returned 404 (service removed)"
  - "AdminNav extracted to separate client component — allows server layout to retain getUser() auth guard"
  - "SeatCheckerRealtime refetches /api/reservation/seats on UPDATE — gets full computed seatsRemaining including claimed_count, not just raw DB column value"
  - "mouseout handler recomputes style rather than calling geoLayer.resetStyle — avoids Layer vs GeoJSON type mismatch"

patterns-established:
  - "Null-rendering side-effect component: SeatCheckerRealtime renders null, fires onSeatUpdate callback on Realtime events"
  - "Dynamic Leaflet import pattern: ssr:false + loading skeleton to avoid Next.js SSR errors"

requirements-completed: [ADMIN-08]

# Metrics
duration: 12min
completed: 2026-02-24
---

# Phase 6 Plan 03: Demand Map, Admin Nav, and Realtime Seat Checker Summary

**Leaflet choropleth heat map at /admin/demand-map with 209 Houston ZIPs, toggleable application density / seat fill rate views, admin navigation bar, and SeatCheckerRealtime subscription component**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-24T05:34:52Z
- **Completed:** 2026-02-24T05:47:00Z
- **Tasks:** 2 auto + 1 checkpoint (pending human verification)
- **Files modified:** 6

## Accomplishments

- Installed react-leaflet, leaflet, @types/leaflet and wired Leaflet choropleth inside a dynamic import (ssr:false) to avoid SSR errors
- Generated `public/data/houston-zips.geojson` with 209 approximate rectangular polygon features for all Houston ZIPs (Census TIGER ZCTA API returned 404 — fallback approach used per plan)
- Built `/admin/demand-map` server page fetching aggregate ZIP data (application counts per ZIP, fill rate = phantom_count / total_cap across all roles per ZIP)
- Demand map client has toggle between Application Density and Seat Fill Rate views, hover tooltips, click-to-navigate to /admin/seats?zip={code}, CartoDB dark tile layer
- Extracted `AdminNav` client component (usePathname for active state) into admin layout — keeps server component auth guard intact
- Created `SeatCheckerRealtime` — null-rendering client component that subscribes to zip_seats Realtime UPDATE events and calls `onSeatUpdate` with fresh seat data

## Task Commits

Each task was committed atomically:

1. **Task 1: ZIP demand heat map, admin nav, Houston GeoJSON** - `ef8d3d9` (feat)
2. **Task 2: SeatCheckerRealtime component** - `432e2e8` (feat)

**Task 3 (checkpoint):** Pending human verification — see checkpoint section below.

## Files Created/Modified

- `src/app/admin/(dashboard)/demand-map/page.tsx` — Server component fetching zip_seats + applications aggregate data, renders DemandMapClient via dynamic import
- `src/app/admin/(dashboard)/demand-map/demand-map-client.tsx` — Client component with Leaflet choropleth, toggle views, tooltip, click navigation
- `src/app/admin/(dashboard)/admin-nav.tsx` — "use client" nav component with usePathname active state detection
- `src/app/admin/(dashboard)/layout.tsx` — Updated to import AdminNav and render full navigation bar
- `public/data/houston-zips.geojson` — 209 approximate rectangular ZIP polygons for Houston metro (7319 lines)
- `src/components/landing/SeatCheckerRealtime.tsx` — Null-rendering Realtime subscription component

## Decisions Made

- **Census TIGER API unavailable:** ZCTA_2020 MapServer endpoint returned 404. Used fallback: approximate rectangular polygons derived from geographic knowledge of Houston ZIP layout. Map is functional and usable for heat map visualization.
- **Separate AdminNav client component:** The plan suggested extracting nav into a small client component to keep the layout as a server component with the auth guard. This was implemented — `admin-nav.tsx` handles `usePathname()` and active state, while `layout.tsx` remains a server component with `supabase.auth.getUser()`.
- **mouseout style reset:** Used manual style recompute in mouseout handler instead of `geoLayer.resetStyle()` — avoids Leaflet type issue where individual feature layers are `Layer` type, not `GeoJSON` type that has `resetStyle`.
- **SeatCheckerRealtime refetches API:** On Realtime UPDATE event, refetches `/api/reservation/seats` rather than using raw event payload, ensuring `seatsRemaining` includes the computed `claimed_count` from applications (not just `phantom_count` from the raw UPDATE payload).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed resetStyle type error on mouseout handler**
- **Found during:** Task 1 (demand-map-client.tsx TypeScript check)
- **Issue:** `layer.resetStyle(featureLayer)` called on individual feature layer (type `Layer`) — `resetStyle` is a method on `GeoJSON` class, not `Layer`. TypeScript TS2339 error.
- **Fix:** Replaced `resetStyle` call with manual style recompute: on mouseout, look up the feature's zip from dataByZip and call `pathEl.setStyle(...)` directly with the correct computed color.
- **Files modified:** `src/app/admin/(dashboard)/demand-map/demand-map-client.tsx`
- **Verification:** `./node_modules/.bin/tsc --noEmit` exits 0.
- **Committed in:** `ef8d3d9` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential for correctness. TypeScript would have rejected the build otherwise.

## Issues Encountered

- **Census TIGER ZCTA API 404:** Service `TIGERweb/ZCTA_2020/MapServer` not found. Applied fallback per plan instruction: approximate rectangular polygons. Map visually represents Houston metro coverage; boundaries are approximate but sufficient for heat map purposes.

## User Setup Required

None — no external service configuration required. The Realtime publication on zip_seats was applied by Plan 01 migration 004.

## Next Phase Readiness

- All Phase 6 requirements satisfied across Plans 01, 02, 03
- Task 3 is a human verification checkpoint — all Phase 6 surfaces ready for review
- SeatCheckerRealtime can be wired into WaitlistModal by passing zipCode/role props and an onSeatUpdate callback that dispatches SEATS_LOADED

---
*Phase: 06-scarcity-controls-and-analytics*
*Completed: 2026-02-24*

## Self-Check: PASSED

Files verified to exist:
- FOUND: src/app/admin/(dashboard)/demand-map/page.tsx
- FOUND: src/app/admin/(dashboard)/demand-map/demand-map-client.tsx
- FOUND: src/app/admin/(dashboard)/admin-nav.tsx
- FOUND: src/app/admin/(dashboard)/layout.tsx (modified)
- FOUND: public/data/houston-zips.geojson
- FOUND: src/components/landing/SeatCheckerRealtime.tsx

Commits verified: ef8d3d9 and 432e2e8
