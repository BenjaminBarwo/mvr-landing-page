import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { KpiCards } from "./kpi-cards"
import { FunnelSteps } from "./funnel-steps"

interface Props {
  searchParams: Promise<{ range?: string }>
}

function getSince(range: string | undefined): string | null {
  if (range === "all") return null
  const days = range === "7" ? 7 : 30 // default to 30
  const since = new Date(Date.now() - days * 86_400_000)
  return since.toISOString()
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams
  const range = params.range ?? "30"
  const since = getSince(range)

  // ── Revenue aggregates ────────────────────────────────────────────────────
  // Fetch counts and revenue using individual queries (Supabase JS client
  // does not support FILTER(WHERE...) aggregate — use separate count queries
  // and sum payment_amount_cents client-side; MVP scale is under 1000 rows).

  let revenueQuery = supabaseAdmin
    .from("applications")
    .select("payment_amount_cents")
    .eq("stripe_payment_status", "succeeded")

  if (since) revenueQuery = revenueQuery.gte("created_at", since)
  const { data: paidRows } = await revenueQuery

  const totalRevenueCents =
    paidRows?.reduce((sum, row) => sum + (row.payment_amount_cents ?? 0), 0) ?? 0
  const paidCount = paidRows?.length ?? 0

  // Refund estimate: rejected applications that were previously paid
  let refundQuery = supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "rejected")
    .eq("stripe_payment_status", "succeeded")

  if (since) refundQuery = refundQuery.gte("created_at", since)
  const { count: refundCount } = await refundQuery

  // Status counts
  const buildStatusQuery = (status: string) => {
    let q = supabaseAdmin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", status)
    if (since) q = q.gte("created_at", since)
    return q
  }

  const [submittedResult, approvedResult, rejectedResult, waitlistedResult] =
    await Promise.all([
      buildStatusQuery("submitted"),
      buildStatusQuery("approved"),
      buildStatusQuery("rejected"),
      buildStatusQuery("waitlisted"),
    ])

  // ── Funnel metrics ────────────────────────────────────────────────────────
  // Step 1: Visits from page_visits table
  let visitsQuery = supabaseAdmin
    .from("page_visits")
    .select("id", { count: "exact", head: true })
  if (since) visitsQuery = visitsQuery.gte("visited_at", since)

  // Step 2: Step 1 submitted
  let step1Query = supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .not("step1_completed_at", "is", null)
  if (since) step1Query = step1Query.gte("step1_completed_at", since)

  // Step 3: Step 2 submitted
  let step2Query = supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .not("step2_completed_at", "is", null)
  if (since) step2Query = step2Query.gte("step2_completed_at", since)

  // Step 4: Payment initiated (has a payment intent)
  let payInitQuery = supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .not("stripe_payment_intent_id", "is", null)
  if (since) payInitQuery = payInitQuery.gte("created_at", since)

  // Step 5: Payment complete
  let payCompleteQuery = supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("stripe_payment_status", "succeeded")
  if (since) payCompleteQuery = payCompleteQuery.gte("paid_at", since)

  const [
    visitsResult,
    step1Result,
    step2Result,
    payInitResult,
    payCompleteResult,
  ] = await Promise.all([
    visitsQuery,
    step1Query,
    step2Query,
    payInitQuery,
    payCompleteQuery,
  ])

  const funnelSteps = [
    { name: "Visits", count: visitsResult.count ?? 0 },
    { name: "Step 1 Submit", count: step1Result.count ?? 0 },
    { name: "Step 2 Submit", count: step2Result.count ?? 0 },
    { name: "Payment Initiated", count: payInitResult.count ?? 0 },
    { name: "Payment Complete", count: payCompleteResult.count ?? 0 },
  ]

  // ── Date range tab config ─────────────────────────────────────────────────
  const ranges = [
    { label: "7 Days", value: "7" },
    { label: "30 Days", value: "30" },
    { label: "All Time", value: "all" },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-gray-400 text-sm mt-1">
            Revenue summary and application funnel metrics
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {ranges.map((r) => (
            <Link
              key={r.value}
              href={`/admin/analytics?range=${r.value}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                range === r.value
                  ? "bg-white text-black font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Revenue KPI cards */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue &amp; Applications</h3>
        <KpiCards
          totalRevenueCents={totalRevenueCents}
          paidCount={paidCount}
          refundCount={refundCount ?? 0}
          submittedCount={submittedResult.count ?? 0}
          approvedCount={approvedResult.count ?? 0}
          rejectedCount={rejectedResult.count ?? 0}
          waitlistedCount={waitlistedResult.count ?? 0}
        />
      </section>

      {/* Funnel steps */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Application Funnel</h3>
        <FunnelSteps steps={funnelSteps} />
      </section>
    </div>
  )
}
