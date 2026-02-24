"use client"

/**
 * SeatCheckerRealtime — side-effect-only component for live seat updates.
 *
 * Subscribes to Supabase Realtime postgres_changes on zip_seats for a given
 * ZIP code. When admin changes phantom_count or total_cap, this fires
 * onSeatUpdate with fresh data fetched from /api/reservation/seats.
 *
 * Usage:
 *   Place <SeatCheckerRealtime zipCode={selectedZip} role={selectedRole} onSeatUpdate={handleUpdate} />
 *   alongside the WaitlistModal or in a parent component. When admin updates zip_seats,
 *   this fires onSeatUpdate({ seatsRemaining, totalCap }) with fresh data.
 *
 * Wiring example:
 *   function handleSeatUpdate({ seatsRemaining, totalCap }) {
 *     dispatch({ type: "SEATS_LOADED", data: { inArea: true, seatsRemaining, totalCap } })
 *   }
 *
 * Note: Requires Supabase Realtime publication on zip_seats.
 * Applied by migration 004 (Plan 01 Task 1):
 *   ALTER PUBLICATION supabase_realtime ADD TABLE zip_seats;
 * Without that migration, this subscription silently receives no events.
 */

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface SeatCheckerRealtimeProps {
  /** ZIP code to subscribe to. Pass null when no ZIP is selected. */
  zipCode: string | null
  /** Role to filter seat data for. Pass null when no role is selected. */
  role: string | null
  /** Callback fired with fresh seat data when admin updates zip_seats for this ZIP. */
  onSeatUpdate: (data: { seatsRemaining: number; totalCap: number }) => void
}

export function SeatCheckerRealtime({
  zipCode,
  role,
  onSeatUpdate,
}: SeatCheckerRealtimeProps) {
  const refetchSeats = useCallback(async () => {
    if (!zipCode || !role) return
    try {
      const res = await fetch(
        `/api/reservation/seats?zip=${encodeURIComponent(zipCode)}&role=${encodeURIComponent(role)}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (data.inArea && typeof data.seatsRemaining === "number") {
        onSeatUpdate({
          seatsRemaining: data.seatsRemaining,
          totalCap: data.totalCap,
        })
      }
    } catch {
      // Non-critical: seat display will be stale until next manual check.
      // Never block UX over a Realtime refresh failure.
    }
  }, [zipCode, role, onSeatUpdate])

  useEffect(() => {
    if (!zipCode) return

    const supabase = createClient()

    const channel = supabase
      .channel(`seat-checker-${zipCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "zip_seats",
          filter: `zip_code=eq.${zipCode}`,
        },
        () => {
          // Refetch fresh seat data whenever zip_seats is updated for this ZIP.
          // We refetch from the API rather than using the raw event payload to
          // ensure the full computed seatsRemaining (which includes claimed_count)
          // is accurate, not just the raw DB column change.
          refetchSeats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [zipCode, refetchSeats])

  // Renders nothing — purely a side-effect component.
  return null
}
