"use client"

import { useEffect } from "react"

export function PageViewTracker() {
  useEffect(() => {
    // Prevent double-tracking on React re-renders within the same browser session
    if (sessionStorage.getItem("mvr_visit_tracked")) return
    sessionStorage.setItem("mvr_visit_tracked", "1")

    const params = new URLSearchParams(window.location.search)

    // Fire-and-forget: analytics tracking should never block page load
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        session_id: localStorage.getItem("mvr_session_id"),
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
      }),
    }).catch(() => {
      // Silently swallow errors — visit tracking must never affect UX
    })
  }, [])

  return null
}
