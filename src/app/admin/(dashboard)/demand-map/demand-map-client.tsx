"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { MapDataPoint } from "./page"

type ViewMode = "density" | "fill_rate"

interface DemandMapClientProps {
  mapData: MapDataPoint[]
}

interface GeoJsonFeature {
  type: "Feature"
  properties: {
    ZCTA5CE20: string
    neighborhood?: string
    tier?: string
  }
  geometry: {
    type: string
    coordinates: unknown
  }
}

interface GeoJsonCollection {
  type: "FeatureCollection"
  features: GeoJsonFeature[]
}

function getDensityColor(count: number): string {
  if (count === 0) return "#374151" // gray-700
  if (count <= 3) return "#16a34a" // green-600
  if (count <= 6) return "#ca8a04" // yellow-600
  return "#dc2626" // red-600
}

function getFillRateColor(rate: number): string {
  if (rate <= 25) return "#16a34a" // green-600
  if (rate <= 50) return "#ca8a04" // yellow-600
  if (rate <= 75) return "#ea580c" // orange-600
  return "#dc2626" // red-600
}

export default function DemandMapClient({ mapData }: DemandMapClientProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("density")
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import("leaflet").Map | null>(null)
  const geoLayerRef = useRef<import("leaflet").GeoJSON | null>(null)

  // Index mapData by zip_code for fast lookup
  const dataByZip = useRef<Record<string, MapDataPoint>>({})
  useEffect(() => {
    dataByZip.current = {}
    for (const d of mapData) {
      dataByZip.current[d.zip_code] = d
    }
  }, [mapData])

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    // Dynamically import leaflet to avoid SSR issues (this component is client-only)
    let L: typeof import("leaflet")
    import("leaflet").then((leaflet) => {
      L = leaflet.default

      // Fix Leaflet's default icon URLs (broken in webpack/Next.js)
      // We don't use markers, so this is purely defensive
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      })

      if (!mapRef.current) return

      // Initialize map centered on Houston
      const map = L.map(mapRef.current, {
        center: [29.7604, -95.3698],
        zoom: 10,
        zoomControl: true,
      })

      leafletMapRef.current = map

      // Dark CartoDB tile layer to match admin theme
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map)

      // Fetch and render GeoJSON
      fetch("/data/houston-zips.geojson")
        .then((r) => r.json())
        .then((geojson: GeoJsonCollection) => {
          const geoLayer = L.geoJSON(geojson, {
            style: (feature) => {
              if (!feature) return { fillColor: "#374151", weight: 1, color: "#fff", fillOpacity: 0.7 }
              const zip = feature.properties?.ZCTA5CE20 as string
              const d = dataByZip.current[zip]
              const count = d?.application_count ?? 0
              return {
                fillColor: getDensityColor(count),
                weight: 1,
                color: "#ffffff",
                fillOpacity: 0.7,
              }
            },
            onEachFeature: (feature, featureLayer) => {
              const zip = feature.properties?.ZCTA5CE20 as string
              const d = dataByZip.current[zip]
              const count = d?.application_count ?? 0
              const fillRate = d?.fill_rate ?? 0

              featureLayer.bindTooltip(
                `<div style="font-family:monospace;font-size:13px;line-height:1.5">
                  <strong>ZIP ${zip}</strong><br/>
                  ${count} application${count !== 1 ? "s" : ""}<br/>
                  ${fillRate}% filled
                </div>`,
                { sticky: true, className: "mvr-map-tooltip" }
              )

              featureLayer.on("click", () => {
                router.push(`/admin/seats?zip=${zip}`)
              })

              featureLayer.on("mouseover", function (e) {
                const l = e.target as import("leaflet").Path
                l.setStyle({ weight: 2, color: "#f9fafb", fillOpacity: 0.9 })
              })
              featureLayer.on("mouseout", function (e) {
                const l = e.target as import("leaflet").Path
                // Use the GeoJSON layer to reset individual feature style
                if (l && (l as unknown as { feature: unknown }).feature) {
                  const pathEl = l as import("leaflet").Path
                  const feat = (pathEl as unknown as { feature: GeoJsonFeature }).feature
                  const fZip = feat?.properties?.ZCTA5CE20
                  const fd = dataByZip.current[fZip]
                  const fCount = fd?.application_count ?? 0
                  pathEl.setStyle({
                    fillColor: getDensityColor(fCount),
                    weight: 1,
                    color: "#ffffff",
                    fillOpacity: 0.7,
                  })
                }
              })
            },
          })

          geoLayer.addTo(map)
          geoLayerRef.current = geoLayer
        })
        .catch((err) => {
          console.error("Failed to load GeoJSON:", err)
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

  // Update layer colors when viewMode or mapData changes
  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer) return

    layer.setStyle((feature) => {
      if (!feature) return { fillColor: "#374151" }
      const zip = feature.properties?.ZCTA5CE20 as string
      const d = dataByZip.current[zip]
      if (viewMode === "density") {
        const count = d?.application_count ?? 0
        return {
          fillColor: getDensityColor(count),
          weight: 1,
          color: "#ffffff",
          fillOpacity: 0.7,
        }
      } else {
        const rate = d?.fill_rate ?? 0
        return {
          fillColor: getFillRateColor(rate),
          weight: 1,
          color: "#ffffff",
          fillOpacity: 0.7,
        }
      }
    })
  }, [viewMode, mapData])

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("density")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === "density"
              ? "bg-white text-gray-900"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Application Density
        </button>
        <button
          onClick={() => setViewMode("fill_rate")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            viewMode === "fill_rate"
              ? "bg-white text-gray-900"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Seat Fill Rate
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400">
        {viewMode === "density" ? (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#374151" }} />
              0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#16a34a" }} />
              1–3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#ca8a04" }} />
              4–6
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#dc2626" }} />
              7+
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#16a34a" }} />
              0–25%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#ca8a04" }} />
              25–50%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#ea580c" }} />
              50–75%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#dc2626" }} />
              75–100%
            </span>
          </>
        )}
        <span className="ml-2 text-gray-500">Click a ZIP to view seat controls</span>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height: "600px", borderRadius: "0.375rem", overflow: "hidden" }}
        className="border border-gray-800"
      />

      <style>{`
        .mvr-map-tooltip {
          background: #1f2937;
          border: 1px solid #374151;
          color: #f9fafb;
          border-radius: 4px;
          padding: 6px 10px;
        }
        .mvr-map-tooltip::before {
          display: none;
        }
      `}</style>
    </div>
  )
}
