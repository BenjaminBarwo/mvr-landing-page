# Phase 5: Admin Application Queue + Email Infrastructure - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Minimum viable admin review workflow for real applicants entering the pipeline. Admin can list, filter, inspect, and act on applications (approve/reject/waitlist) with automated emails triggered by each action. Also ships email infrastructure deferred from Phase 4: confirmation email on payment, SPF/DKIM/DMARC domain auth, terms field population, and per-step completion timestamps.

</domain>

<decisions>
## Implementation Decisions

### Queue layout & filtering
- Data table layout (sortable columns, dense rows) — not cards or kanban
- Full detail columns: name, email, phone, role, ZIP, status, payment status, step reached, submitted date (9 columns)
- Default sort: newest first (most recently submitted at top)
- Search bar above table — searches across name and email fields
- Status count badges on each filter (e.g., "Submitted (12)", "Approved (5)")
- 25 applications per page with pagination
- Clicking a row opens a **slide-out panel** from the right (table stays visible behind it)

### Application detail & actions
- Action buttons: Approve, Reject, Waitlist — all require **confirmation dialog** before executing
- Rejection requires a **mandatory reason** from admin (creates audit trail) — reason stays internal, not sent in rejection email
- **Full status flexibility** — admin can move applications between any status at any time (e.g., rejected → waitlisted, waitlisted → approved)
- **Full audit trail** in the slide-out panel — chronological timeline showing all status changes with which admin made them and when
- ZIP code shown with **live seat availability context** (e.g., "ZIP 77007 — 2 of 5 Agent seats remaining")
- Partial applications appear in a **separate tab/filter** — not mixed with submitted applications

### Email content & branding
- **Tone:** Professional and warm — polished but human
- **Design:** Branded HTML template with MVR brand colors, styled sections, visual hierarchy (React Email)
- **Sending domain:** TBD (placeholder — will be configured during setup, likely team@[mvr-domain])
- **Reply-to:** Monitored email address — each email includes "Questions? Just reply to this email."
- **No unsubscribe link** — all emails are one-time transactional
- **Confirmation email** (after payment): name, role, ZIP, amount paid, plus clear next steps (what happens during review, expected timeline, how to reach support). Does NOT include business profile answers.
- **Approval email:** "You've secured your founding seat!" with onboarding next steps (what to expect, platform launch timeline, how to prepare)
- **Rejection email:** Generic reason (no admin's internal reason), confirms $100 refund with 5-10 business day timeline
- **Waitlist email:** Personal, founder-driven tone — make the applicant feel like the founders themselves are actively reviewing and considering them. $100 held as deposit, applied to first month when seat opens.
- **Waitlist → Approved email:** Special "seat opened" template distinct from regular approval — "Great news! A seat has opened in your territory."
- **Re-notification policy:** Claude's discretion on whether status changes after the initial decision trigger new emails

### Partial application handling
- Separate tab/filter in admin queue — not mixed with submitted applications
- View all fields the applicant submitted plus the step they reached
- Admin can add **internal outreach notes** (e.g., "Called on 2/23, said they'd complete this week")
- Show timestamps (started date, last activity date) — not relative "time ago" format

### Claude's Discretion
- Filtering UI pattern (tab bar for status vs all dropdowns vs hybrid)
- Action button placement (panel only vs panel + row)
- Slide-out panel information organization (sections vs flat list)
- Email re-notification policy on status changes after initial decision
- Exact email template design within branded constraint

</decisions>

<specifics>
## Specific Ideas

- Waitlist email should feel like founders are personally looking into each applicant — not a queue system. MVR is hands-on.
- Rejection email frames the refund positively: "Your $100 activation credit will be refunded within 5-10 business days."
- Admin notes on partials are internal-only — for tracking outreach to abandoned applicants
- The slide-out panel keeps the table visible so admin can quickly move between applications

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-admin-application-queue-email-infrastructure*
*Context gathered: 2026-02-23*
