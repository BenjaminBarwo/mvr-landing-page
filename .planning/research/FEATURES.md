# Feature Landscape

**Domain:** Territory-based demand validation landing page with application pipeline
**Project:** MVR Founding Seat Landing Page — Houston founding round
**Researched:** 2026-02-19
**Confidence:** HIGH

---

## Table Stakes

Features users expect. Missing any = trust breaks, form drops, or payment abandonment.

| Feature | Why Expected | Complexity |
|---------|--------------|------------|
| Clear value proposition above the fold | Professionals evaluate in seconds. No scroll = no application. | Low |
| Role selector (early in flow) | Applicants must self-identify before committing time | Low |
| ZIP-level seat availability display | Scarcity must be surfaced before the form, not buried inside it | Medium |
| 3-step progressive form with visible step indicator | Multi-step without progress indication feels like a trap | Low-Med |
| Per-step data persistence to DB | Partial application capture is the abandonment recovery strategy | Medium |
| Stripe payment collection at Step 3 | Industry standard for $100+ B2B commitment | Medium |
| Post-payment confirmation page | Every payment interaction requires immediate "it worked" signal | Low |
| Mobile-responsive layout | >50% of form traffic arrives on mobile even in B2B | Low-Med |
| SSL / security indicators | Professionals are paranoid about financial data | Low |
| Clear refund/terms framing | $100 pre-approval triggers "what if rejected?" objection | Low |
| Application received email (immediate) | Silence after payment = panic | Low-Med |
| Admin application queue (list view) | Reviewing without a queue means spreadsheets | Medium |
| Admin approve/reject/waitlist actions | Minimum viable review workflow | Medium |
| Automated status emails (approved/rejected/waitlisted) | Professional applicants expect explicit status communication | Low-Med |

---

## Differentiators

Features that make this meaningfully better than generic Typeform + Stripe.

| Feature | Value Proposition | Complexity |
|---------|-------------------|------------|
| Per-ZIP phantom fill control (admin) | "Nobody goes to a party they don't think will show up." Perceived demand drives real demand. | High |
| Live ZIP seat checker on landing page | Interactivity creates investment before form starts. Users who check ZIP are significantly more likely to apply. | Medium-High |
| Competitor contrast section (Zillow/HAR attack) | Professionals nodding "yes, that IS broken" before they hit the form are pre-sold. | Low |
| Role-based seat caps per ZIP | Real scarcity that is enforceable. Not fake countdown timers. | Medium |
| Funnel analytics (step-level drop-off) | Demand validation only useful if you understand WHERE demand faltered. | Medium-High |
| ZIP demand density heatmap (admin) | Identifies which territories to prioritize in outreach and seat cap management. | High |
| Partial application visibility in admin | Abandonment recovery cheaper than new traffic acquisition. | Medium |
| Abandonment recovery email sequence | Automated follow-up converts 10-20% of abandoned B2B flows. | Medium-High |
| Admin revenue tracking dashboard | Validates economic thesis in real-time. | Medium |
| Behavioral signals capture at Step 2 | Business context fields qualify AND surface demand quality intelligence. | Medium |
| Founder credibility section | "Built by an operator" closes trust gap faster than any logo wall. | Low |

---

## Anti-Features

Features to explicitly NOT build for founding round.

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Auto-approval pipeline | Removes scarcity signal. "Anyone can get in" destroys positioning. |
| "Non-refundable" messaging on page | Creates trust drag before any objection has occurred. |
| Single-agent exclusivity per ZIP | Hard ceiling on addressable applications; complicates messaging. |
| Countdown timers (fake urgency) | Professionals recognize fake timers instantly. Trust destruction. |
| Fabricated social proof numbers | Same trust risk as fake timers. Verifiable and damaging. |
| Essay fields / long-form text | Unquantifiable. Cannot compare applicants or identify patterns. |
| Multi-city expansion features | Houston is the test. Building for expansion before validation is a trap. |
| Consumer-facing product features | This is demand validation only. |
| Chat widget / live support | Operational load before knowing what questions come up. |
| Payment plan for $100 | $100 is the price filter. Payment plan dilutes signal. |
| SMS notifications | TCPA compliance risk. Email covers notification needs at this scale. |

---

## Feature Dependencies

```
ZIP seat checker → Role-based seat caps (admin) → Phantom fill control
Multi-step form → Per-step DB persistence → Partial application visibility (admin)
Step 1 completion → Email captured → Abandonment recovery eligibility
Step 3 completion → Confirmation page + Application received email
Admin approve/reject/waitlist → Corresponding automated email
Step 2 business context → Admin demand analytics
Step 2 ZIP selection → ZIP demand density heatmap
Funnel analytics → Step-level event tracking
```

---

## MVP Priority Order

1. Landing page with all copy sections
2. Live ZIP seat checker (highest pre-form conversion leverage)
3. 3-step progressive form with per-step persistence
4. Stripe payment at Step 3
5. Post-payment confirmation page
6. Admin application queue with approve/reject/waitlist
7. Automated emails: received, approved, rejected, waitlisted
8. Partial application visibility in admin
9. Funnel analytics (step-level)
10. Per-ZIP phantom fill control

**Defer to Phase 2:**
- Abandonment recovery email sequence (manual outreach beats automation at <50 applicants)
- ZIP demand density heatmap (sortable table delivers 80% of intelligence at 20% effort)
- Detailed revenue tracking (Stripe dashboard covers this at low volume)

---

## Complexity Reference

| Complexity | Description |
|------------|-------------|
| Low | 1-4 hours. Standard component, no external API. |
| Low-Med | 4-8 hours. External trigger or backend call, well-established pattern. |
| Medium | 1-2 days. State coordination, API design, schema decisions. |
| Medium-High | 2-3 days. Multiple integration points, edge cases. |
| High | 3-5 days. Novel integration, significant testing surface. |

---

## Sources

- Founding-seat / pay-to-join patterns: Superhuman, Substack founding membership, YC application pipeline
- B2B multi-step form conversion: Baymard Institute, CXL Institute
- Scarcity mechanics: real vs. fake urgency research
- Abandonment recovery: B2B sequence benchmarking
