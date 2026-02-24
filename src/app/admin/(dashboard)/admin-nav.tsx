"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { label: "Applications", href: "/admin/applications" },
  { label: "Seats", href: "/admin/seats" },
  { label: "Demand Map", href: "/admin/demand-map" },
  { label: "Analytics", href: "/admin/analytics" },
] as const

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              isActive
                ? "text-white border-b-2 border-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
