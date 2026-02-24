"use client"

import dynamic from "next/dynamic"
import type { MapDataPoint } from "./page"

const DemandMapClient = dynamic(() => import("./demand-map-client"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-900 animate-pulse rounded flex items-center justify-center">
      <span className="text-gray-500 text-sm">Loading map...</span>
    </div>
  ),
})

export function DemandMapLoader({ mapData }: { mapData: MapDataPoint[] }) {
  return <DemandMapClient mapData={mapData} />
}
