import dynamic from "next/dynamic"
import { supabaseAdmin } from "@/lib/supabase/admin"

const DemandMapClient = dynamic(() => import("./demand-map-client"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-900 animate-pulse rounded flex items-center justify-center">
      <span className="text-gray-500 text-sm">Loading map...</span>
    </div>
  ),
})

interface ZipSeatRow {
  zip_code: string
  total_cap: number
  phantom_count: number
  claimed_count: number | null
}

interface ApplicationRow {
  primary_zip: string
}

export interface MapDataPoint {
  zip_code: string
  application_count: number
  fill_rate: number
}

export default async function DemandMapPage() {
  // Fetch all zip_seats rows
  const { data: seatRows, error: seatError } = await supabaseAdmin
    .from("zip_seats")
    .select("zip_code, total_cap, phantom_count")

  if (seatError) {
    console.error("Failed to fetch seat data:", seatError)
  }

  // Count non-draft non-rejected applications per ZIP
  const { data: appRows, error: appError } = await supabaseAdmin
    .from("applications")
    .select("primary_zip")
    .not("status", "in", '("draft","rejected")')

  if (appError) {
    console.error("Failed to fetch application data:", appError)
  }

  // Aggregate application counts per ZIP
  const appCountByZip: Record<string, number> = {}
  for (const app of (appRows as ApplicationRow[]) ?? []) {
    if (app.primary_zip) {
      appCountByZip[app.primary_zip] = (appCountByZip[app.primary_zip] ?? 0) + 1
    }
  }

  // Aggregate fill rates per ZIP (across all roles)
  // fill_rate = (total claimed + total phantom) / total cap across all roles for this ZIP
  const zipAgg: Record<string, { totalCap: number; totalFilled: number }> = {}
  for (const row of (seatRows as ZipSeatRow[]) ?? []) {
    if (!zipAgg[row.zip_code]) {
      zipAgg[row.zip_code] = { totalCap: 0, totalFilled: 0 }
    }
    zipAgg[row.zip_code].totalCap += row.total_cap
    zipAgg[row.zip_code].totalFilled += row.phantom_count
  }

  // Build mapData array
  const mapData: MapDataPoint[] = Object.entries(zipAgg).map(
    ([zip_code, agg]) => ({
      zip_code,
      application_count: appCountByZip[zip_code] ?? 0,
      fill_rate:
        agg.totalCap > 0
          ? Math.round((agg.totalFilled / agg.totalCap) * 100)
          : 0,
    })
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">ZIP Demand Map</h2>
        <p className="text-gray-400 text-sm mt-1">
          Houston metro area — {mapData.length} ZIP codes tracked
        </p>
      </div>
      <DemandMapClient mapData={mapData} />
    </div>
  )
}
