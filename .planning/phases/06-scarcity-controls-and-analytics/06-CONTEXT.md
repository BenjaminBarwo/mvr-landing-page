# Phase 6: Scarcity Controls and Analytics - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin tools for tuning perceived demand via phantom fill, enforcing seat caps per role per ZIP, and reading funnel/revenue metrics to interpret demand validation results. Covers ADMIN-06, ADMIN-07, ADMIN-08, ADMIN-09, ANLY-01, ANLY-02. No new public-facing features beyond real-time seat checker updates and cap enforcement at form submission.

</domain>

<decisions>
## Implementation Decisions

### Seat & Phantom Controls
- Editable data table with inline cell editing (click-to-edit)
- Role filter dropdown — admin selects a role (e.g. Agent), table shows all ZIPs for that role only
- Each row shows: ZIP code, tier, seat cap, phantom fill count, real fills, total displayed
- Auto-save on blur — edit a cell, click away, saves immediately with success indicator
- Bulk actions toolbar — e.g. "Set phantom fill for all visible ZIPs", "Reset caps to default by tier"
- No batch save button — all edits are immediate

### ZIP Demand Map
- Houston heat map with two toggle views: application density and seat fill rate
- Hover a ZIP for tooltip: ZIP code, role counts, fill percentage
- Click a ZIP to navigate to that ZIP in the seat controls table
- Always shows aggregate across all roles (no per-role filtering on the map)
- Map library and placement: Claude's discretion (based on admin layout patterns from Phase 5)

### Analytics Dashboard
- Revenue summary as KPI cards: Total Revenue, Refund Count, Applications by Status (submitted/approved/rejected/waitlisted)
- Funnel metrics visualization: Claude's discretion on chart type (funnel chart, step cards, or table)
- Date range picker for filtering analytics data (last 7 days, 30 days, custom range)
- Analytics page placement and navigation: Claude's discretion

### Real-time Updates
- Supabase Realtime subscription on zip_seats table for the public seat checker
- When admin changes phantom fill or seat cap, seat checker on landing page reflects immediately without reload
- Admin feedback: inline green flash on edited cell + toast notification with detail (e.g. "Phantom fill updated for 77002 Agent")
- Seat cap enforcement: server-side check at form submission time (not real-time blocking in the form)
- Seat checker shows "0 remaining" via Realtime when cap reached, but hard block is at submission
- Whether admin seat controls page shows live counters from other sources: Claude's discretion

### Claude's Discretion
- Map library choice (Mapbox, Leaflet, or simpler SVG-based approach)
- Map placement (same page as seat controls or separate /admin/demand-map page)
- Funnel visualization format (horizontal funnel chart, vertical step cards, or clean table)
- Analytics navigation placement (dedicated /admin/analytics page vs. admin home dashboard)
- Whether admin seat controls show real-time updates from new applications
- Phantom fill transparency (combined total vs. real + phantom breakdown) — admin should at minimum see both values in the table
- Capped ZIP user-facing messaging copy and whether to suggest alternative ZIPs

</decisions>

<specifics>
## Specific Ideas

No specific references or "I want it like X" moments — open to standard approaches that match the existing admin aesthetic from Phase 5 (TanStack Table, slide-out panels, shadcn/ui components).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-scarcity-controls-and-analytics*
*Context gathered: 2026-02-23*
