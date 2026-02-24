interface KpiCardsProps {
  totalRevenueCents: number
  paidCount: number
  refundCount: number
  submittedCount: number
  approvedCount: number
  rejectedCount: number
  waitlistedCount: number
}

function KpiCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function KpiCards({
  totalRevenueCents,
  paidCount,
  refundCount,
  submittedCount,
  approvedCount,
  rejectedCount,
  waitlistedCount,
}: KpiCardsProps) {
  const revenueFormatted = (totalRevenueCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard title="Total Revenue" value={revenueFormatted} />
      <KpiCard title="Paid Applications" value={paidCount} />
      <KpiCard
        title="Refunds (Est.)"
        value={refundCount}
        subtitle="Based on rejected paid applications"
      />
      <KpiCard title="Submitted" value={submittedCount} />
      <KpiCard title="Approved" value={approvedCount} />
      <KpiCard title="Rejected" value={rejectedCount} />
      <KpiCard title="Waitlisted" value={waitlistedCount} />
    </div>
  )
}
