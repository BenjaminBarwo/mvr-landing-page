# MVR Founding Seat Landing Page

## What This Is

A demand validation system for MVR — a ZIP-level controlled routing layer that provides prioritized access to in-market consumer demand for local professionals. This is the founding seat launch page, application pipeline, admin dashboard, and operational flow for Houston's founding round. We're selling territory positioning, not features. The page validates economic seriousness through a $100 activation credit and structured application.

## Core Value

Prove ZIP-level demand density and pricing elasticity through real activation willingness at $100 — clean economic signal, not vanity volume.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Dark, minimal landing page with operator-to-operator tone
- [ ] Competitive attack copy — name Zillow, HAR directly. Hit cost absurdity AND shared-lead model
- [ ] Headline: "Secure Exclusive ZIP Access Before Public Launch"
- [ ] Subheadline explaining the mechanism: prioritized routing within protected territory
- [ ] Moderate page sections: headline, explainer, how it works, competitor contrast, price anchor, form
- [ ] Founder credibility section (industry insider angle)
- [ ] Live ZIP seat checker — enter ZIP, see "X of Y seats remaining" per role
- [ ] Per-ZIP phantom fill control in admin (inflate perceived demand)
- [ ] Multi-step application form with progressive DB save per step
- [ ] Step 1 (low friction): Name, email, phone, role
- [ ] Step 2 (business context): Primary ZIP, top 3 ZIPs, monthly lead spend (range), leads purchased/month (range), transactions closed/month (range), currently buying online leads (Y/N)
- [ ] Step 3 (commitment): $100 Stripe payment
- [ ] Price anchor on page: "Founding Seats require a $100 activation credit. Applied to your first live month. Limited by ZIP and role."
- [ ] Do NOT emphasize "non-refundable" — no unnecessary trust drag
- [ ] Roles: Real Estate Agent, Mortgage Lender, Home Inspector, Contractor/Service Provider
- [ ] Post-payment confirmation page ("Application received. We review within 48 hours.")
- [ ] Admin dashboard: application queue (approve/reject/waitlist)
- [ ] Admin dashboard: ZIP heat map showing demand density
- [ ] Admin dashboard: revenue tracking (total collected, refunds, avg time to pay)
- [ ] Admin dashboard: seat management (configurable caps per role per ZIP, fill rates)
- [ ] Admin analytics: funnel metrics (visits → Step 1 → Step 2 → Payment → Complete)
- [ ] Admin analytics: ZIP demand density, lead quality signals from application data
- [ ] Automated emails: application received, approved, rejected, waitlisted
- [ ] Automated abandonment follow-up emails for incomplete applications
- [ ] Partial application visibility in admin (contact people who dropped off)
- [ ] CTA button: "Apply for Founding Seat"

### Out of Scope

- MVR product itself (routing engine, consumer-facing features) — this is demand validation only
- Mobile app — web-first
- Multi-city expansion — Houston only for founding round
- Auto-approval — all applications manually reviewed, willing to reject
- Aggressive "non-refundable" messaging — refund handling is case-by-case pre-launch
- Single-agent-per-ZIP exclusivity — using role-based seat caps per ZIP cluster instead

## Context

**Strategic positioning:** MVR at maturity becomes a ZIP-level controlled routing layer. This landing page validates demand before building the routing engine. We're testing whether professionals will pay $100 to secure territory positioning.

**Competitive landscape:** Zillow, HAR, and similar platforms sell shared leads — the same lead goes to multiple agents. MVR's positioning is protected territory with prioritized routing. The page should make this contrast sharp and aggressive.

**Market:** Houston is the contained test market. The first 5-10 conversations with applicants will refine copy more than internal theory.

**Traffic strategy:** Direct outreach now, optimizing for both paid ads and direct outreach simultaneously.

**Failure interpretation:**
- Low applications → positioning weak
- Strong applications but low activations → investigate pricing resistance, mechanism misunderstanding, weak urgency, or low pain intensity
- Categorize objections rather than speculate

**Behavioral signals to track post-application:**
- Speed of follow-up
- Questions about seat availability
- Push to activate
- Price objections
- Requests to secure territory quickly

**Call-level framing:** If agents compare to Zillow, reframe around control and efficiency — cost per closed deal, predictability, inflation resistance, territory control.

## Constraints

- **Tech Stack**: React, TypeScript, Next.js — per project CLAUDE.md
- **Backend**: Supabase (database, auth, edge functions)
- **Payments**: Stripe for $100 activation credit collection
- **Hosting**: Vercel
- **Design**: Dark + minimal aesthetic, existing logo available
- **Copy tone**: Operator-to-operator. Economically serious, scarcity-driven, clear, minimal fluff. Not hype-heavy, not social-network tone.
- **Geography**: Houston ZIPs only for founding round
- **Application fields**: All structured and comparable — no essays, no long narratives

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| $100 collected at application (not after approval) | Filters for economic seriousness before review. Only committed applicants enter the pipeline. | — Pending |
| Progressive DB save per form step | Capture partial applications for abandonment recovery. Every step = signal. | — Pending |
| Per-ZIP phantom fill control | "Nobody goes to a party they don't think anyone will show up to." Inflate perceived demand individually per ZIP. | — Pending |
| Name competitors directly (Zillow, HAR) | Anthropic-style competitive energy. Both barrels — cost absurdity AND shared-lead model. | — Pending |
| Manual application review with willingness to reject | Preserves positioning and exclusivity. Evaluating economic seriousness, not curiosity. | — Pending |
| Configurable seat caps per role per ZIP | Scarcity must be real and enforceable. Role-based clusters, not single-agent exclusivity. | — Pending |
| Multi-step form (3 steps) | Low friction first (contact info), business context second, payment last. Each step saved independently. | — Pending |

---
*Last updated: 2026-02-19 after initialization*
