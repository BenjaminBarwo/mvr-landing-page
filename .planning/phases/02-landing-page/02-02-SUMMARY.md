---
phase: 02-landing-page
plan: 02
subsystem: frontend
tags: [seat-checker, deferred]

# Dependency graph
requires:
  - phase: 02-01
    provides: Landing page with all sections
provides: []
affects: []

requirements-completed: []

# Metrics
duration: 0
completed: 2026-02-23
status: deferred
---

# Phase 2 Plan 02: Seat Checker Section — DEFERRED

**Standalone ZIP seat checker section deferred — seat availability is shown inside the reservation modal (Step 2) instead**

## Reason for Deferral

The seat availability lookup was implemented as Step 2 of the reservation modal flow (Plan 01). Users see "X of Y seats remaining" for their ZIP+role after submitting their basic info. A separate public seat checker section on the landing page is not needed for launch — it can be added later if conversion data suggests users want to check availability before entering the funnel.

## What Exists Instead

- `/api/reservation/seats?zip=&role=` — GET endpoint returning seat availability for a specific ZIP+role
- Step 2 of WaitlistModal — displays seat count, tier, and neighborhood with urgency messaging
- Phantom seat fills seeded across all ZIP/role combinations

## If Revisited

The original plan called for a `SeatCheckerSection` component with debounced ZIP input showing all 6 roles at once, plus out-of-area interest recording. The `/api/seats` route and `SeatCheckerSection.tsx` would need to be built per the original plan spec.

---
*Phase: 02-landing-page*
*Deferred: 2026-02-23*
