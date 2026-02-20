# Phase 2: Landing Page - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Public-facing conversion surface for Houston real estate professionals. Dark minimal design with live ZIP seat checker, competitor contrast copy, pricing anchor, and clear path to apply. Requirements LAND-01 through LAND-09.

</domain>

<decisions>
## Implementation Decisions

### Page structure and section flow
- Section order: Hero → How It Works → Competitor Contrast → Seat Checker → Pricing → Credibility → CTA
- Rationale: Build the case first (what it is, why competitors suck), THEN reveal availability — creates more urgency by the time they see seats
- No footer — page ends on the final CTA section. Terms link lives inline.
- No pill badge in hero — keep it clean

### Hero layout
- Reference layout: Centered logo above headline (like Lioro reference — see screenshot in discussion)
- Centered MVR logo (large, prominent)
- Large serif headline ("Secure Exclusive ZIP Access Before Public Launch")
- Smaller subheadline text below
- Two CTA buttons side by side: "Apply for Founding Seat" (primary gold, links to /apply) + "See How It Works" (outlined, scrolls to How It Works section)
- Atmospheric visual at bottom of hero — **TBD, not locked** (could be gradient glow, scroll-frame sequence, or custom visual from Framer/Nanobanana)

### Dark theme and color
- Near-black background: #0a0a0a
- Gold accent color used sparingly — CTAs and key highlights only (buttons, price anchor, seat availability numbers)
- Everything else is white/gray text on dark
- Subtle gold gradient feel overall — premium, not flashy

### Typography
- Premium serif font for headlines (Playfair Display, Cormorant, or similar) — luxury/exclusive positioning
- Clean sans-serif for body text (Inter, Geist, or similar)

### Spacing and density
- Spacious with breathing room — generous padding between sections, Apple-style landing page feel
- Lots of scrolling is fine — the scroll experience IS the experience

### Animations and scroll effects
- Framer Motion for scroll-triggered section animations:
  - Content sections fade in and slide up as they enter viewport
  - Parallax depth layers for background/decorative elements (move at different speeds)
  - Sections should flow seamlessly — each card/section transitions smoothly as part of the scroll experience, not separate blocks
- Scroll-driven JPG frame sequence (Apple product page style) — **exploratory, not locked**:
  - As user scrolls inside a component, current frame updates instantly to match scroll position
  - Frames would be pre-rendered (possibly via Nanobanana)
  - Implementation approach needs research (canvas-based rendering, WebP compression, lazy loading)
  - User may design this in Framer and bring it over
- All animations use GPU-accelerated transforms (translate3d, opacity) — no `background-attachment: fixed`

### Navigation
- No navbar or persistent header
- Sticky floating "Apply" CTA button appears after scrolling past the hero (desktop)
- On mobile: full-width sticky bottom bar with "Apply for Founding Seat" instead of floating button

### Seat checker display
- Lives in its own section (after Competitor Contrast, before Pricing)
- Desktop: researcher/planner discretion on exact card/display style
- Mobile: compact list under the ZIP input — results expand below as scrollable list of roles with seat counts

### Framer/Nanobanana workflow (research needed)
- User may design visual elements in Framer and/or generate frames with Nanobanana
- Researcher should investigate:
  1. Framer-to-Next.js export/integration pipeline (bringing Framer designs into existing Next.js project)
  2. Nanobanana frame generation workflow
  3. Scroll-driven frame sequence implementation (canvas vs img swap, performance on iOS Safari)
  4. Creative suggestions for atmospheric visuals (hero background, section transitions)
- Nothing locked for visuals — layout and coloring are set, creative direction for atmospheric elements is open

### Claude's Discretion
- Exact spacing values and typography scale
- Seat checker card design on desktop
- Loading skeleton design
- Error state handling
- Which specific sections to collapse into accordions on mobile (likely How It Works and/or Competitor Contrast)
- Background decorative elements (subtle gradients, shapes) — as long as they fit the dark + gold theme

</decisions>

<specifics>
## Specific Ideas

- Hero layout modeled after Lioro/Nubien reference: centered logo, large headline, subheadline, two CTA buttons, atmospheric visual below (see discussion screenshot)
- User wants to experiment with Framer and Nanobanana for visual assets — may bring custom frames/animations into the project after initial build
- Scroll experience should feel like "flowing through" sections smoothly, not jumping between blocks
- Gold accent is subtle and strategic — not a gold-heavy page, just gold on interactive/important elements
- Logo file will be placed in `public/` directory (user has logo ready)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-landing-page*
*Context gathered: 2026-02-20*
