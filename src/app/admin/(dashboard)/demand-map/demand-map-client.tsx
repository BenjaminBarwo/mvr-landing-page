"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { MapDataPoint } from "./page"

type ViewMode = "density" | "fill_rate"

interface DemandMapClientProps {
  mapData: MapDataPoint[]
}

type Centroids = Record<string, [number, number]>

function getDensityColor(count: number): string {
  if (count === 0) return "#4b5563" // gray-600
  if (count <= 3) return "#22c55e" // green-500
  if (count <= 6) return "#eab308" // yellow-500
  return "#ef4444" // red-500
}

function getFillRateColor(rate: number): string {
  if (rate <= 25) return "#22c55e" // green-500
  if (rate <= 50) return "#eab308" // yellow-500
  if (rate <= 75) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

function getRadius(count: number, mode: ViewMode, rate: number): number {
  if (mode === "density") {
    if (count === 0) return 6
    if (count <= 3) return 8
    if (count <= 6) return 11
    return 14
  }
  if (rate <= 25) return 6
  if (rate <= 50) return 8
  if (rate <= 75) return 11
  return 14
}

export default function DemandMapClient({ mapData }: DemandMapClientProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("density")
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import("leaflet").Map | null>(null)
  const markersRef = useRef<import("leaflet").CircleMarker[]>([])
  const centroidsRef = useRef<Centroids>({})

  const dataByZip = useRef<Record<string, MapDataPoint>>({})
  useEffect(() => {
    dataByZip.current = {}
    for (const d of mapData) {
      dataByZip.current[d.zip_code] = d
    }
  }, [mapData])

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    import("leaflet").then((leaflet) => {
      const L = leaflet.default

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [29.7604, -95.3698],
        zoom: 10,
        zoomControl: true,
      })

      leafletMapRef.current = map

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map)

      // Load centroids and render circle markers
      fetch("/data/houston-zip-centroids.json")
        .then((r) => r.json())
        .then((centroids: Centroids) => {
          centroidsRef.current = centroids
          const markers: import("leaflet").CircleMarker[] = []

          for (const [zip, [lat, lng]] of Object.entries(centroids)) {
            const d = dataByZip.current[zip]
            const count = d?.application_count ?? 0
            const rate = d?.fill_rate ?? 0
            const color = getDensityColor(count)
            const radius = getRadius(count, "density", rate)

            const marker = L.circleMarker([lat, lng], {
              radius,
              fillColor: color,
              fillOpacity: 0.75,
              color: "#fff",
              weight: 1.5,
              opacity: 0.9,
            })

            marker.bindTooltip(
              `<div style="font-family:system-ui;font-size:13px;line-height:1.6">
                <strong style="font-size:14px">ZIP ${zip}</strong><br/>
                <span style="color:#9ca3af">Applications:</span> ${count}<br/>
                <span style="color:#9ca3af">Fill rate:</span> ${rate}%
              </div>`,
              { className: "mvr-map-tooltip", direction: "top", offset: [0, -8] }
            )

            marker.on("click", () => {
              router.push(`/admin/seats?zip=${zip}`)
            })

            marker.on("mouseover", () => {
              marker.setStyle({ weight: 3, fillOpacity: 1, opacity: 1 })
              marker.setRadius(radius + 3)
            })

            marker.on("mouseout", () => {
              marker.setStyle({ weight: 1.5, fillOpacity: 0.75, opacity: 0.9 })
              marker.setRadius(radius)
            })

            // Store zip on marker for view mode updates
            ;(marker as unknown as { _zip: string })._zip = zip

            marker.addTo(map)
            markers.push(marker)
          }

          markersRef.current = markers
        })
        .catch((err) => {
          console.error("Failed to load centroids:", err)
        })
    })

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker colors/sizes when viewMode changes
  useEffect(() => {
    for (const marker of markersRef.current) {
      const zip = (marker as unknown as { _zip: string })._zip
      const d = dataByZip.current[zip]
      const count = d?.application_count ?? 0
      const rate = d?.fill_rate ?? 0

      const color =
        viewMode === "density"
          ? getDensityColor(count)
          : getFillRateColor(rate)
      const radius = getRadius(count, viewMode, rate)

      marker.setStyle({ fillColor: color })
      marker.setRadius(radius)
    }
  }, [viewMode, mapData])

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setViewMode("density")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "density"
              ? "bg-white text-gray-900"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Application Density
        </button>
        <button
          onClick={() => setViewMode("fill_rate")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "fill_rate"
              ? "bg-white text-gray-900"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Seat Fill Rate
        </button>

        {/* Legend inline */}
        <div className="flex gap-3 ml-4 text-xs text-gray-400">
          {viewMode === "density" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#4b5563" }} />
                0
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#22c55e" }} />
                1-3
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#eab308" }} />
                4-6
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#ef4444" }} />
                7+
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#22c55e" }} />
                0-25%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#eab308" }} />
                25-50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#f97316" }} />
                50-75%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#ef4444" }} />
                75-100%
              </span>
            </>
          )}
        </div>

        <span className="ml-auto text-xs text-gray-500">Click a ZIP to view seat controls</span>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height: "600px", borderRadius: "0.5rem", overflow: "hidden" }}
        className="border border-gray-800"
      />

      <style>{`
        .mvr-map-tooltip {
          background: #111827 !important;
          border: 1px solid #374151 !important;
          color: #f9fafb !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .mvr-map-tooltip::before {
          border-top-color: #111827 !important;
        }
      `}</style>
    </div>
  )
}
