---
phase: 02-landing-page
plan: 01
subsystem: frontend
tags: [landing-page, hero, animations, waitlist, video, components]

# Dependency graph
requires:
  - phase: 01-01
    provides: Supabase schema with waitlist_interest table
  - phase: 01-03
    provides: zip_seats seeded for seat availability context
provides:
  - Complete landing page at / with 8 content sections
  - WaitlistModal → 4-step reservation flow with Stripe payment
  - /api/waitlist endpoint for lead capture
  - /api/reservation/* endpoints (start, seats, business, create-payment-intent, confirm, recover)
  - /terms page for payment compliance
  - Session recovery via localStorage
affects:
  - 03-application-form (reservation flow already captures form steps 1-3)
  - 04-payment (Stripe PaymentElement integrated, webhook handlers implemented)
  - 05-admin (applications table populated with submitted records)

# Tech tracking
tech-stack:
  added:
    - "@stripe/stripe-js (browser Stripe loader)"
    - "@stripe/react-stripe-js (PaymentElement, Elements provider)"
  patterns:
    - "IntersectionObserver + useState + inline transition for scroll animations"
    - "useReducer for multi-step wizard state management"
    - "Inline transitionDelay baked into transition shorthand (avoids React warning)"
    - "Client-side /api/reservation/confirm as webhook backup for payment verification"

key-files:
  created:
    - src/components/landing/HeroSection.tsx
    - src/components/landing/AppShowcase.tsx
    - src/components/landing/FeaturesStrip.tsx
    - src/components/landing/CompetitorContrast.tsx
    - src/components/landing/RoleCards.tsx
    - src/components/landing/CoFounderCard.tsx
    - src/components/landing/BottomCTA.tsx
    - src/components/landing/Footer.tsx
    - src/components/landing/WaitlistModal.tsx
    - src/app/api/waitlist/route.ts
    - src/app/api/reservation/start/route.ts
    - src/app/api/reservation/seats/route.ts
    - src/app/api/reservation/business/route.ts
    - src/app/api/reservation/create-payment-intent/route.ts
    - src/app/api/reservation/confirm/route.ts
    - src/app/api/reservation/recover/route.ts
    - src/app/terms/page.tsx
    - src/lib/stripe-client.ts
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/api/webhooks/stripe/route.ts
    - package.json

key-decisions:
  - "Light theme (#f2f3f5 bg, #222 text) with Inter font — not dark theme"
  - "Inline CSS styles (React.CSSProperties) — not Tailwind utility classes in components"
  - "IntersectionObserver + useState for animations — no framer-motion dependency"
  - "Hero typewriter clip-reveal cycling 6 roles — no globe/react-globe.gl"
  - "WaitlistModal refactored into 4-step reservation wizard with useReducer"
  - "Client-side /confirm endpoint verifies payment with Stripe API as webhook backup"
  - "Phantom seat fills (40-70% of cap) seeded to create scarcity before real applicants"
  - "CoFounderCard uses centered stacked layout — parallax removed for mobile compatibility"
  - "WTP question replaces boolean buys_online_leads — captures pricing intent for investors"

patterns-established:
  - "Scroll animation: IntersectionObserver → useState → inline transition with baked-in delay"
  - "Multi-step modal: useReducer with typed actions, session recovery via localStorage"
  - "Dual payment verification: client /confirm endpoint + Stripe webhook (first wins)"

requirements-completed: [LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-08, LAND-09]

# Metrics
duration: multi-session
completed: 2026-02-23
---

# Phase 2 Plan 01: Landing Page + Reservation Flow Summary

**Complete light-themed landing page with 8 content sections, scroll animations, and a 4-step founding seat reservation flow (basic info → seat availability → business questions → Stripe payment) with session recovery**

## Performance

- **Duration:** Multiple sessions (iterative development)
- **Completed:** 2026-02-23
- **Files created:** 19
- **Files modified:** 4

## Accomplishments

- Light-themed landing page at `/` with Inter font and all 8 sections: Hero (typewriter role rotation), AppShowcase (auto-play video), FeaturesStrip (with/without comparison), CompetitorContrast (staggered indictment cards), RoleCards (6 roles with SVG icons), CoFounderCard (Matthew Bramow bio), BottomCTA, Footer
- WaitlistModal evolved from simple form into 4-step reservation wizard: basic info capture → seat availability display with urgency → business qualification questions → Stripe PaymentElement with $100 activation credit
- 6 API routes for reservation flow: `/api/reservation/start` (draft creation), `/seats` (availability lookup), `/business` (qualification save), `/create-payment-intent` (idempotent PI creation), `/confirm` (client-side payment verification), `/recover` (session restoration)
- Stripe webhook handler implemented for `payment_intent.succeeded` and `payment_intent.payment_failed` events
- `/terms` page with full legal language covering non-refundable activation credit, limitation of liability, indemnification, binding arbitration
- Session recovery: localStorage `mvr_session_id` → `/api/reservation/recover` → resume at last completed step
- Phantom seat fills seeded (40-70% of total_cap) across all 1,254 zip_seats rows for scarcity display
- Full flow tested end-to-end: draft creation → seat check → business questions → Stripe test card payment → DB confirmation

## Key Commits

- `52946df` — feat(hero): clip-reveal word rotation, logo flip, button hover/pulse
- `34b3cb9` — feat(video): add 3D motion to 4 scenes, prep demo section for video import
- `f058363` — feat(reservation): add 4-step founding seat reservation flow with Stripe payment
- `2b07822` — fix(cofounder): remove parallax and side-by-side layout for mobile compatibility
- `9155fc5` — chore: gitignore video/ and supabase/.temp/

## Decisions Made

- **Light theme, not dark:** #f2f3f5 background with #222 text, Inter font weights 300-600
- **Inline styles, not Tailwind:** All components use React.CSSProperties for consistent pattern
- **No animation library:** IntersectionObserver + useState + inline transitions — zero bundle cost
- **WaitlistModal → Reservation wizard:** Evolved from simple 5-field form to 4-step flow with Stripe payment during this session
- **Dual payment verification:** Client calls `/confirm` after Stripe succeeds (verifies PI status directly with Stripe API), webhook is backup — ensures DB updates even without `stripe listen` running locally
- **WTP replaces buys_online_leads:** "What would you pay monthly for exclusive ZIP-locked leads?" captures pricing intent for investor deck instead of redundant boolean
- **Parallax removed from CoFounderCard:** Side-by-side layout with parallax scroll broke on mobile — replaced with centered stacked layout

## Deviations from Original Plan

- Plan originally scoped WaitlistModal as a simple form submitting to `/api/waitlist`. It was expanded into a full 4-step reservation flow with Stripe payment, business qualification, seat availability, session recovery, and terms compliance — this work was done interactively outside the original plan scope
- CoFounderCard parallax effect removed post-implementation due to poor mobile rendering
- `buys_online_leads` DB column altered from boolean to text to store WTP pricing tier selection

## Next Phase Readiness

- Landing page is fully functional with payment flow
- Phase 3 (Application Form) scope may be reduced since reservation flow already captures steps 1-3 of the application
- Phase 4 (Payment/Email) partially complete — Stripe integration is live, email sending not yet implemented
- Seat checker (Plan 02) deferred — seat availability is shown inside the reservation modal flow instead

---
*Phase: 02-landing-page*
*Completed: 2026-02-23*
