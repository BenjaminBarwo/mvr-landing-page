# Phase 6: Scarcity Controls and Analytics - Research

**Researched:** 2026-02-23
**Domain:** Admin data editing, Supabase Realtime, charting, geographic heat map
**Confidence:** HIGH (stack fully verified against existing codebase and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Seat & Phantom Controls:**
- Editable data table with inline cell editing (click-to-edit)
- Role filter dropdown — admin selects a role (e.g. Agent), table shows all ZIPs for that role only
- Each row shows: ZIP code, tier, seat cap, phantom fill count, real fills, total displayed
- Auto-save on blur — edit a cell, click away, saves immediately with success indicator
- Bulk actions toolbar — e.g. "Set phantom fill for all visible ZIPs", "Reset caps to default by tier"
- No batch save button — all edits are immediate

**ZIP Demand Map:**
- Houston heat map with two toggle views: application density and seat fill rate
- Hover a ZIP for tooltip: ZIP code, role counts, fill percentage
- Click a ZIP to navigate to that ZIP in the seat controls table
- Always shows aggregate across all roles (no per-role filtering on the map)
- Map library and placement: Claude's discretion (based on admin layout patterns from Phase 5)

**Analytics Dashboard:**
- Revenue summary as KPI cards: Total Revenue, Refund Count, Applications by Status (submitted/approved/rejected/waitlisted)
- Funnel metrics visualization: Claude's discretion on chart type (funnel chart, step cards, or table)
- Date range picker for filtering analytics data (last 7 days, 30 days, custom range)
- Analytics page placement and navigation: Claude's discretion

**Real-time Updates:**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-06 | Admin can configure seat caps per role per ZIP | TanStack Table inline editing + server action upsert on zip_seats; onBlur auto-save pattern verified |
| ADMIN-07 | Admin can set phantom fill count per ZIP (inflate perceived demand) | Same table/action as ADMIN-06; phantom_count column already exists in zip_seats schema |
| ADMIN-08 | Admin can view ZIP demand heat map of Houston | React-Leaflet choropleth with GeoJSON, dynamic import SSR:false; map data comes from zip_seats + applications queries |
| ADMIN-09 | Admin can view revenue tracking (total collected, refunds, count by status) | SQL aggregates on applications table; KPI card pattern from shadcn/ui; Recharts 3.7 for supplemental visualization |
| ANLY-01 | Funnel metrics tracked: visit → Step 1 submit → Step 2 submit → Payment initiated → Payment complete | Needs new page_visits tracking table (migration); existing step_completed timestamps cover steps 2-5; visit count is the only missing signal |
| ANLY-02 | Drop-off rate visible per funnel step | Derived from funnel step counts; percentage math applied server-side in analytics page.tsx |
</phase_requirements>

---

## Summary

Phase 6 is a pure admin tooling phase. It extends the existing admin dashboard (built in Phase 5) with three new surfaces: a seat controls table for editing `zip_seats` data inline, a ZIP demand heat map, and an analytics/revenue dashboard. No new public-facing routes are added except for Realtime updates to the existing seat checker API endpoint behavior and a new Realtime subscription in the seat checker client component.

The entire tech stack for this phase is already in the project. TanStack Table `@tanstack/react-table@8.21.3` is already installed and used in the applications dashboard — the same pattern (client component, `useReactTable`, shadcn Table primitives) directly transfers to the seat controls table. Recharts needs to be installed (not currently in `package.json`) but is straightforward. The most complex element is the ZIP demand heat map: Leaflet with `react-leaflet` requires a dynamic import with `ssr: false` because Leaflet directly accesses `window` and `document`, which are unavailable during Next.js SSR.

The funnel analytics requirement (ANLY-01) has a critical gap: visit-level tracking does not exist yet. The existing schema tracks `step1_completed_at` through `step3_completed_at` on the `applications` table, and `stripe_payment_intent_id` presence signals payment initiated. But there is no page visit counter. A new migration adding a `page_visits` table (or a `funnel_events` table) is required in Wave 0 before the analytics page can be fully built. This is the only new migration needed for Phase 6.

**Primary recommendation:** Build Phase 6 as three plan waves: (1) seat controls table + server actions + Realtime subscription, (2) analytics dashboard + revenue KPIs + funnel metrics, (3) ZIP demand heat map. Keep map on a separate `/admin/demand-map` route to avoid coupling the complex Leaflet SSR setup to the seat controls page.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-table` | `^8.21.3` | Inline-edit seat controls table | Already installed; Phase 5 data-table.tsx is the direct template |
| `recharts` | `^3.7.0` | Funnel chart + bar charts for analytics | React 19 compatible as of 3.0; FunnelChart component built-in; Tailwind-friendly |
| `react-leaflet` | `^4.x` | ZIP choropleth heat map | Works with Next.js 15 via dynamic import; widely documented pattern |
| `leaflet` | `^1.9.x` | Peer dep for react-leaflet | Required alongside react-leaflet |
| Supabase Realtime | (via `@supabase/supabase-js@^2.97.0`) | Live zip_seats updates to seat checker | Already installed; `createBrowserClient` already in `src/lib/supabase/client.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/leaflet` | `^1.9.x` | TypeScript types for Leaflet | Required with leaflet in strict TS projects |
| Houston ZIP GeoJSON | (static file, no npm) | ZIP boundary data for choropleth | Fetch from public domain source (TIGER/Census) or hand-curate from seeded ZIPs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet choropleth | Mapbox GL JS | Mapbox requires API key + billing; adds external dependency; overkill for 209 ZIPs |
| react-leaflet choropleth | D3 + SVG custom map | D3 is powerful but requires building SVG ZIP polygons from scratch; no existing Houston-specific SVG ZIP map package exists |
| recharts FunnelChart | Step cards (no lib) | Simpler, no new dependency, fully matches dark admin aesthetic; viable alternative |
| recharts FunnelChart | Tremor | Tremor adds CSS framework conflict risk with Tailwind 4; not worth adding for 2 chart types |

**Installation:**
```bash
npm install recharts react-leaflet leaflet @types/leaflet
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/admin/(dashboard)/
├── applications/           # Phase 5 (existing)
├── seats/
│   ├── page.tsx            # Server component — fetches zip_seats rows for initial render
│   ├── seats-table.tsx     # "use client" — TanStack Table with inline editing
│   ├── seats-columns.tsx   # Column defs with EditableNumberCell
│   └── actions.ts          # "use server" — updateZipSeat, bulkSetPhantomFill, resetCapsByTier
├── demand-map/
│   ├── page.tsx            # Server component — fetches aggregate data, passes as props
│   └── demand-map-client.tsx  # "use client" — dynamic-imported Leaflet map
├── analytics/
│   ├── page.tsx            # Server component — runs SQL aggregates, date range from searchParams
│   ├── kpi-cards.tsx       # "use client" or pure display — revenue KPI card grid
│   └── funnel-chart.tsx    # "use client" — Recharts FunnelChart or step cards
└── layout.tsx              # Existing layout — add nav links for new routes
```

### Pattern 1: Inline-Editable TanStack Table Cell

**What:** A custom cell renderer that renders an input on click, saves on blur via table meta's `updateData`.
**When to use:** ADMIN-06 (seat cap) and ADMIN-07 (phantom fill) — both are numeric fields on `zip_seats`.

```typescript
// Source: https://tanstack.com/table/v8/docs/framework/react/examples/editable-data
// seats-columns.tsx

function EditableNumberCell({ getValue, row, column, table }: CellContext<ZipSeatRow, number>) {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Reset local state if server data changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  async function handleBlur() {
    if (value === initialValue) return // No-op if unchanged
    setSaving(true)
    await table.options.meta?.updateData(row.original.id, column.id, value)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleBlur}
        className={`w-16 bg-transparent text-white border-0 border-b focus:outline-none
          ${saved ? 'border-green-500 text-green-400' : 'border-gray-600'}`}
      />
      {saving && <span className="text-xs text-gray-500 ml-1">saving…</span>}
    </div>
  )
}
```

The `table.options.meta.updateData` function calls the server action directly from within the table meta closure — no React state lifting needed for the async call.

### Pattern 2: Server Action for Seat Update

**What:** A `"use server"` action that validates approver role and upserts `zip_seats`.
**When to use:** Called from the table meta `updateData` function on each cell blur.

```typescript
// Source: existing actions.ts pattern in Phase 5 + Supabase admin client
// seats/actions.ts

"use server"

export async function updateZipSeat(input: {
  id: string
  field: "total_cap" | "phantom_count"
  value: number
}): Promise<{ success?: boolean; error?: string }> {
  const { user, error: authError } = await requireApprover()
  if (authError || !user) return { error: authError ?? "Unauthorized" }

  const { error } = await supabaseAdmin
    .from("zip_seats")
    .update({ [input.field]: input.value, updated_at: new Date().toISOString() })
    .eq("id", input.id)

  if (error) {
    console.error("[admin] Failed to update zip_seat:", error)
    return { error: "Failed to save" }
  }

  // No revalidatePath needed — Realtime subscription handles live updates
  // But revalidate the seats page for SSR cache consistency
  revalidatePath("/admin/seats")
  return { success: true }
}
```

### Pattern 3: Supabase Realtime Subscription in Seat Checker

**What:** A `useEffect` in the seat checker client component subscribes to `zip_seats` UPDATE events.
**When to use:** ADMIN-06/07 mandate that seat checker reflects changes without reload.

```typescript
// Source: https://supabase.com/docs/reference/javascript/subscribe
// Component that shows live seat counts

"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

function useLiveSeatCount(zipCode: string, role: string) {
  const [seatsRemaining, setSeatsRemaining] = useState<number | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchSeatCount(zipCode, role).then(setSeatsRemaining)

    // Realtime subscription on zip_seats table
    const supabase = createClient()
    const channel = supabase
      .channel(`zip-seats-${zipCode}-${role}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "zip_seats",
          filter: `zip_code=eq.${zipCode}`,
        },
        (payload) => {
          // Recalculate remaining from updated row
          const updated = payload.new as ZipSeatRow
          // Also need current real fill count — refetch from API
          fetchSeatCount(zipCode, role).then(setSeatsRemaining)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [zipCode, role])

  return seatsRemaining
}
```

**Critical prerequisite:** The `zip_seats` table must be added to the `supabase_realtime` publication before subscriptions will fire:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE zip_seats;
```
This is a migration step required in Wave 0.

### Pattern 4: Leaflet Choropleth with Dynamic Import

**What:** React-Leaflet map loaded only client-side; Leaflet makes DOM calls that break SSR.
**When to use:** ADMIN-08 demand heat map.

```typescript
// Source: https://xxlsteve.net/blog/react-leaflet-on-next-15/
// demand-map/page.tsx (server component)

import dynamic from "next/dynamic"

const DemandMapClient = dynamic(
  () => import("./demand-map-client"),
  { ssr: false, loading: () => <div className="h-96 bg-gray-900 animate-pulse rounded" /> }
)

export default async function DemandMapPage() {
  const mapData = await fetchMapAggregates() // server-side query
  return <DemandMapClient data={mapData} />
}
```

```typescript
// demand-map-client.tsx
"use client"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"

// GeoJSON colors based on fill rate (0-25%: low, 25-50%: medium, 50-75%: high, 75-100%: full)
function getColor(fillRate: number) {
  return fillRate > 0.75 ? "#dc2626" :
         fillRate > 0.50 ? "#ea580c" :
         fillRate > 0.25 ? "#ca8a04" : "#16a34a"
}
```

**Houston bounding box for initial map view:** `[29.7604, -95.3698]` (center), zoom ~11.

**GeoJSON data source:** Houston ZIP code boundaries are not available as a maintained npm package. Options:
1. Use US Census TIGER shapefiles converted to GeoJSON (public domain, free)
2. Manually filter a national US ZIP GeoJSON dataset to the 209 seeded ZIPs
3. Fetch from a free API like `nominatim` (rate-limited, not appropriate for admin dashboard)

**Recommendation:** Download the Texas ZIP code GeoJSON from the Census TIGER API, filter to the 209 seeded ZIPs, and commit as `public/data/houston-zips.geojson`. This is a one-time setup task in Wave 0.

### Pattern 5: Analytics Page with Date Range Filter

**What:** Server component that reads `searchParams` for date range, runs SQL aggregates via Supabase admin client.
**When to use:** ADMIN-09 revenue tracking, ANLY-01/02 funnel metrics.

```typescript
// analytics/page.tsx

export default async function AnalyticsPage({ searchParams }: Props) {
  const { range } = await searchParams
  const days = range === "7" ? 7 : range === "custom" ? parseCustomRange(range) : 30
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [revenue, funnel] = await Promise.all([
    fetchRevenueAggregates(since),
    fetchFunnelMetrics(since),
  ])

  return (
    <div>
      <KpiCards data={revenue} />
      <FunnelVisualization data={funnel} />
    </div>
  )
}
```

### SQL Patterns for Analytics

```sql
-- Revenue: total collected (payment_amount_cents, status != rejected)
SELECT
  COUNT(*) FILTER (WHERE status != 'rejected' AND stripe_payment_status = 'succeeded') AS paid_count,
  SUM(payment_amount_cents) FILTER (WHERE status != 'rejected' AND stripe_payment_status = 'succeeded') AS total_cents,
  COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_count,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE status = 'waitlisted') AS waitlisted_count
FROM applications
WHERE created_at >= $since;

-- Funnel: derive each step count from existing data
-- Visit: page_visits table (NEW — migration required)
-- Step 1: applications with step_completed >= 1 AND step1_completed_at IS NOT NULL
-- Step 2: applications with step_completed >= 2 AND step2_completed_at IS NOT NULL
-- Payment initiated: applications with stripe_payment_intent_id IS NOT NULL
-- Payment complete: applications with stripe_payment_status = 'succeeded'
```

### Anti-Patterns to Avoid

- **Using `request.json()` in any new webhook or API route** — established project rule; always use `request.text()` for Stripe, always use `request.json()` for non-Stripe routes.
- **Using Realtime subscription in a server component** — Realtime requires WebSocket which is browser-only; always put subscriptions in `"use client"` components.
- **Subscribing to Realtime without cleaning up** — `useEffect` cleanup must call `supabase.removeChannel(channel)` to prevent WebSocket accumulation.
- **Importing Leaflet at the module level in a page** — causes SSR crash; must be wrapped in `dynamic()` with `ssr: false`.
- **Fetching zip_seats via anon Supabase client in server actions** — always use `supabaseAdmin` (service-role) for admin mutations to bypass RLS.
- **Auto-saving with `onChange`** — creates excessive DB calls on every keystroke; `onBlur` is the correct trigger for cell save.
- **Storing Houston GeoJSON as JavaScript module** — large JSON in a JS module bloats the bundle; serve from `/public/data/` and fetch client-side.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inline table editing | Custom click-to-edit divs | TanStack Table `meta.updateData` + cell renderer | Already installed; onBlur pattern is well-documented; handles focus, ref management |
| Choropleth map | Custom SVG ZIP polygons | React-Leaflet + GeoJSON | SVG polygon paths for 209 ZIPs are ~100KB of manual coordinate data; GeoJSON from Census is free and authoritative |
| Funnel drop-off chart | Custom canvas drawing | Recharts FunnelChart OR step cards with CSS | Recharts 3.7 is React 19 compatible; or step cards require zero new deps |
| Realtime WebSocket | Custom SSE or polling | Supabase Realtime channel | Already provisioned in Supabase project; `createBrowserClient` already in `src/lib/supabase/client.ts` |
| Date range picker | Custom calendar UI | shadcn/ui native or HTML `<input type="date">` | Admin-only UI — precision UX is not required; simplest working date filter is sufficient |

**Key insight:** The entire Phase 5 admin pattern (Server Component for data fetch → Client Component for interactivity → Server Action for mutations → `revalidatePath` for cache busting) is the correct pattern for all three new admin surfaces in Phase 6. No new architectural decisions are needed.

---

## Common Pitfalls

### Pitfall 1: Realtime Publication Not Configured
**What goes wrong:** Supabase Realtime subscriptions silently receive no events. The `channel.subscribe()` call succeeds (no error thrown), but no `postgres_changes` events fire when `zip_seats` rows are updated. The seat checker appears to work but never updates.
**Why it happens:** Tables must be explicitly added to the `supabase_realtime` Postgres publication. New tables are NOT automatically included.
**How to avoid:** Include `ALTER PUBLICATION supabase_realtime ADD TABLE zip_seats;` as a migration step (Wave 0 task).
**Warning signs:** Subscription status is `"SUBSCRIBED"` but no events arrive after a database update.

### Pitfall 2: Leaflet CSS Not Imported
**What goes wrong:** Map tiles load but all marker/control icons are broken (missing images, misaligned tiles).
**Why it happens:** Leaflet requires its own CSS: `import "leaflet/dist/leaflet.css"`. In Next.js App Router, this must be done inside the `"use client"` component file, not in the server component.
**How to avoid:** Always place `import "leaflet/dist/leaflet.css"` at the top of the `demand-map-client.tsx` file.
**Warning signs:** Console warning about stylesheet loading; map controls appear as broken icon boxes.

### Pitfall 3: Recharts Must Be Client-Only
**What goes wrong:** Build fails or runtime error: "window is not defined" when Recharts components are imported in a Server Component.
**Why it happens:** Recharts uses browser APIs (canvas, DOM measurement) internally.
**How to avoid:** Any component that imports from `recharts` must have `"use client"` directive. Pass pre-fetched data as props from the server component parent.
**Warning signs:** Build error `ReferenceError: window is not defined` during `next build`.

### Pitfall 4: TanStack Table Re-render Focus Loss
**What goes wrong:** User is typing in an editable cell; `onBlur` fires → server action runs → `revalidatePath` triggers → component re-renders → input loses focus. This makes editing a second cell immediately after the first impossible.
**Why it happens:** `revalidatePath` causes a full re-render of the server component, which re-renders the table, which resets the DOM input.
**How to avoid:** Keep editable cell state entirely local (no optimistic update that touches parent state). Let the cell manage its own saved/saved state. Only call `revalidatePath` after a delay or use `router.refresh()` instead of `revalidatePath` for less aggressive cache busting. Alternatively, skip `revalidatePath` entirely in the seat update action and rely on Realtime + local state — the server data is the same either way after save.
**Warning signs:** Users report "clicking a cell loses focus immediately" when other users are also editing.

### Pitfall 5: Funnel Visit Count Is Zero
**What goes wrong:** The analytics funnel shows "0 visits" because no page visit tracking was implemented before Phase 6.
**Why it happens:** ANLY-01 requires visit tracking, but the current schema has no page_visits table. The existing `applications` table only tracks users who started Step 1 — it cannot count visits that did not convert.
**How to avoid:** Wave 0 of Phase 6 must include a migration creating a `page_visits` table (or `funnel_events` table) AND an API route or script that fires on page load. Note: For the demo/MVP, "visits" could be approximated by `waitlist_interest` count (users who entered their info on the landing page modal) rather than raw page loads — this is a valid scoped alternative.
**Warning signs:** Analytics page shows 100% conversion from visit to Step 1.

### Pitfall 6: Seat Cap Enforcement Race Condition
**What goes wrong:** Two applicants simultaneously submit the final payment step for the last seat in a ZIP/role. Both see "1 remaining" and both complete payment. Both submissions succeed at the server, creating over-capacity.
**Why it happens:** The seat cap check at submission time is two separate queries (read cap, count existing seats) that are not atomic.
**How to avoid:** Implement the cap enforcement check as a Postgres function that uses `FOR UPDATE SKIP LOCKED` or a single-query count comparison. Alternatively, accept over-cap as a known edge case at MVP scale (209 ZIPs × 6 roles = 1254 seat combinations; the probability of a simultaneous race at MVP scale is extremely low). The decision is at Claude's discretion — recommend accepting the edge case for MVP.
**Warning signs:** `zip_seats.total_cap` is exceeded in the `applications` count query.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Supabase Realtime Channel Setup

```typescript
// Source: https://supabase.com/docs/reference/javascript/subscribe
// Must be inside "use client" component

import { createClient } from "@/lib/supabase/client"

useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel("zip-seats-changes")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "zip_seats",
      },
      (payload) => {
        // payload.new contains the full updated row
        console.log("zip_seats updated:", payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### TanStack Table Meta for Async Server Action

```typescript
// Source: https://tanstack.com/table/v8/docs/framework/react/examples/editable-data
// Adapted for async server actions

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  meta: {
    updateData: async (rowId: string, field: string, value: number) => {
      const result = await updateZipSeat({ id: rowId, field, value })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${field} updated`)
      }
    },
  },
})
```

### Recharts FunnelChart for Funnel Metrics

```typescript
// Source: https://recharts.github.io/en-US/api/FunnelChart/
// "use client" required

import { FunnelChart, Funnel, Tooltip, LabelList } from "recharts"

const funnelData = [
  { name: "Visits", value: 1240 },
  { name: "Step 1 Submit", value: 320 },
  { name: "Step 2 Submit", value: 180 },
  { name: "Payment Initiated", value: 120 },
  { name: "Payment Complete", value: 98 },
]

export function FunnelVisualization({ data }: { data: typeof funnelData }) {
  return (
    <FunnelChart width={500} height={300}>
      <Tooltip />
      <Funnel dataKey="value" data={data} isAnimationActive>
        <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
      </Funnel>
    </FunnelChart>
  )
}
```

### Seat Cap Enforcement at Form Submission

```typescript
// Source: existing seat route pattern in src/app/api/reservation/seats/route.ts
// Add to business route or a dedicated cap-check action

async function checkSeatCapacity(zipCode: string, role: string): Promise<{
  hasCapacity: boolean
  seatsRemaining: number
}> {
  const { data: seatData } = await supabaseAdmin
    .from("zip_seats")
    .select("total_cap, phantom_count")
    .eq("zip_code", zipCode)
    .eq("role", role)
    .single()

  if (!seatData) return { hasCapacity: false, seatsRemaining: 0 }

  const { count } = await supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("primary_zip", zipCode)
    .eq("role", role)
    .not("status", "in", '("draft","rejected")')

  const taken = (count ?? 0) + seatData.phantom_count
  const seatsRemaining = Math.max(0, seatData.total_cap - taken)
  return { hasCapacity: seatsRemaining > 0, seatsRemaining }
}
```

### Page Visits Migration (ANLY-01 gap)

```sql
-- Wave 0 migration: 004_page_visits
CREATE TABLE page_visits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at timestamptz DEFAULT now(),
  path       text NOT NULL DEFAULT '/',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  session_id text,
  ip_hash    text  -- hashed IP for deduplication, not raw PII
);

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Anon can insert (landing page fires on load)
CREATE POLICY "page_visits_anon_insert"
  ON page_visits FOR INSERT TO anon WITH CHECK (true);

-- Admins can read for analytics
CREATE POLICY "page_visits_admin_read"
  ON page_visits FOR SELECT TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts v2 (React 16-18 era) | Recharts 3.x (Oct 2025) | Oct 2025 | New state management, better React 19 compatibility, FunnelChart label fixes, Customized component no longer needed |
| React-Leaflet v3 | React-Leaflet v4.x | 2023 | Hook-based API; `MapContainer` is stable; requires `"use client"` + dynamic import in Next.js App Router |
| Supabase `channel.on().subscribe()` manual cleanup | `supabase.removeChannel(channel)` | 2023+ | Explicit removal avoids WebSocket accumulation; 30s auto-cleanup on disconnect is not reliable for rapid navigation |

**Deprecated/outdated:**
- `getSession()` in server code: replaced by `getUser()` — already enforced in this codebase
- Recharts `<Customized>` component: deprecated in 3.0, use standard composition instead
- `leaflet.icon({})` default markers: broken in webpack/Next.js — either use `L.divIcon()` or delete the default icon prototype

---

## Claude's Discretion: Recommendations

### Map Library
**Recommendation: React-Leaflet with GeoJSON choropleth.**
- Free tile layer (OpenStreetMap) — no API key required
- 209 ZIP polygons are well within Leaflet's performance envelope
- Dynamic import with SSR disabled is a well-documented Next.js pattern
- Leaflet CSS import is the only known gotcha

### Map Placement
**Recommendation: Separate `/admin/demand-map` route.**
- Avoids coupling Leaflet's dynamic import complexity with the seat controls editing table
- Cleaner navigation: "Seats" and "Demand Map" are conceptually distinct admin tasks
- Seat controls page loads faster without the map bundle

### Funnel Visualization Format
**Recommendation: Vertical step cards with percentage badges (no chart library).**
- Matches the dark admin aesthetic (bg-gray-900, shadcn Card)
- Zero additional dependencies beyond what's installed
- Shows: step name, absolute count, drop-off %, and a thin progress bar
- Recharts FunnelChart is a valid alternative if a visual funnel is preferred

### Analytics Navigation
**Recommendation: Dedicated `/admin/analytics` route, linked from the header nav.**
- Extend the existing `layout.tsx` header to include nav links: "Applications" | "Seats" | "Demand Map" | "Analytics"
- Admin dashboard (`/admin/page.tsx`) currently redirects to `/admin/applications` — keep that default

### Admin Seat Controls Real-time Updates
**Recommendation: Yes, show live counters.**
- Subscribe to `applications` table INSERT events filtered to the current role (via Realtime)
- Update the "Real Fills" column in the table live as new applications come in
- This makes the seat controls table a live demand dashboard, not just a configuration panel
- Implementation: same `useEffect` + `supabase.channel` pattern as the seat checker

---

## Open Questions

1. **Houston ZIP GeoJSON Source**
   - What we know: No maintained npm package for Houston ZIP code boundaries exists. Census TIGER data is the authoritative source.
   - What's unclear: Whether the Census TIGER API can be queried at build time or whether a static GeoJSON file should be committed to the repo.
   - Recommendation: Commit a static `public/data/houston-zips.geojson` filtered to the 209 seeded ZIPs. Generate it once using the TIGER API (`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/ZCTA_2020/MapServer/0/query`) during Wave 0 setup, not at runtime.

2. **Visit Tracking: page_visits table vs. approximation**
   - What we know: No current visit tracking exists. ANLY-01 requires visit count.
   - What's unclear: Whether the user wants raw page visit counts (requires JS snippet on landing page) or a proxy signal like `waitlist_interest` count (users who engaged with the modal).
   - Recommendation: Implement a lightweight `page_visits` insert via a `POST /api/track/visit` API route called from the landing page's first `useEffect`. This gives real visit data. Include the migration in Wave 0.

3. **Stripe Refund Count for ADMIN-09**
   - What we know: The `applications` table has no explicit refund status. Rejected applications trigger a Stripe refund (confirmed in Phase 5 admin actions), but refund completion is not stored back to the DB.
   - What's unclear: Whether a `refunded_at` column should be added, or if "rejected count" is a sufficient proxy for "refund count" for MVP analytics.
   - Recommendation: For MVP, use `COUNT(*) WHERE status = 'rejected' AND stripe_payment_status = 'succeeded'` as the refund count proxy — these are applications that were paid and then rejected (triggering a refund). A separate `refunded_at` field can be added in v2.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set to `true` in `.planning/config.json` — this section is skipped.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `src/app/admin/(dashboard)/applications/data-table.tsx`, `columns.tsx`, `actions.ts` — Phase 5 patterns are the direct template for Phase 6
- Supabase documentation — postgres_changes subscription API verified at https://supabase.com/docs/reference/javascript/subscribe
- Supabase documentation — RLS + Realtime interaction verified at https://supabase.com/docs/guides/realtime/postgres-changes
- Recharts 3.7.0 — FunnelChart API verified at https://recharts.github.io/en-US/api/FunnelChart/
- TanStack Table v8 — editable-data example verified at https://tanstack.com/table/v8/docs/framework/react/examples/editable-data
- Existing schema — `supabase/migrations/001_foundation.sql` — zip_seats table structure, RLS policies, phantom_count and total_cap columns confirmed
- Existing schema — `supabase/migrations/003_status_history_and_step_timestamps.sql` — step timestamp columns for funnel metrics confirmed

### Secondary (MEDIUM confidence)
- React-Leaflet Next.js 15 App Router pattern — https://xxlsteve.net/blog/react-leaflet-on-next-15/ (2025 article, consistent with Leaflet's documented SSR limitation)
- Recharts React 19 compatibility — https://github.com/recharts/recharts/issues/4558 (resolved; 3.7.0 ships with React 19 support)
- Supabase publication setup SQL — https://github.com/orgs/supabase/discussions/13680 (community-verified; consistent with official docs)

### Tertiary (LOW confidence)
- Houston GeoJSON from Census TIGER API — approach is standard GIS practice; exact query format needs validation during Wave 0 execution
- Stripe refund count proxy via rejected+paid count — MVP approximation; not verified against Stripe's refund lifecycle

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project except recharts; all APIs verified against official docs
- Architecture: HIGH — direct extension of Phase 5 patterns; no novel architectural decisions
- Pitfalls: HIGH for Realtime publication and Leaflet SSR (frequently encountered, well-documented); MEDIUM for race condition edge case (low probability at MVP scale)
- GeoJSON data: LOW — source identified but exact filtering process needs Wave 0 execution

**Research date:** 2026-02-23
**Valid until:** 2026-05-23 (stable libraries; Supabase Realtime API unlikely to change in 90 days)
