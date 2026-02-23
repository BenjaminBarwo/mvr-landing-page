"use client"

import { Application } from "./columns"

interface ApplicationPanelProps {
  application: Application
  onClose: () => void
}

export function ApplicationPanel({ application }: ApplicationPanelProps) {
  return (
    <div className="p-4 text-gray-400 text-sm">
      Loading application {application.id}…
    </div>
  )
}
