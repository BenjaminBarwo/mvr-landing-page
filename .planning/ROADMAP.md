# Roadmap: MVR Founding Seat Landing Page

## Overview

Six phases build the complete demand validation pipeline. The sequence is dictated by hard dependencies: schema correctness cannot be patched after payment data exists; the seat checker must read from the database before the form is wired; progressive form save must be proven before Stripe is introduced; payment and transactional email ship together because the confirmation email triggers from the webhook; admin tooling follows the public flow because it requires real applicants to be useful; scarcity controls and funnel analytics close out the build because they tune a working pipeline, not create one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Database schema, infrastructure wiring, and admin auth — everything downstream depends on this being correct (completed 2026-02-20)
- [x] **Phase 2: Landing Page** - Public-facing conversion surface with all persuasion copy and 4-step reservation modal (completed 2026-02-23)
- [x] **Phase 3: Application Form (Steps 1-2)** - Mostly covered by Phase 2 WaitlistModal. Gap: per-step timestamps not yet tracked (completed 2026-02-23)
- [x] **Phase 4: Payment, Legal, and Email** - Payment + terms UI covered by Phase 2 modal. Gaps: terms fields not populated, confirmation email not built, SPF/DKIM/DMARC not configured (completed 2026-02-23)
- [x] **Phase 5: Admin Application Queue** - Minimum viable review workflow for real applicants entering the pipeline (completed 2026-02-23)
- [x] **Phase 6: Scarcity Controls and Analytics** - Phantom fill management, seat cap editor, funnel metrics, and ZIP demand intelligence (completed 2026-02-24)

## Phase Details

### Phase 1: Foundation
**Goal**: The database schema, auth layer, and deployment pipeline are in place so all subsequent phases build on a correct, immutable foundation
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, ADMIN-01
**Success Criteria** (what must be TRUE):
  1. The database schema exists with `applications`, `zip_seats`, and `email_log` tables, including the partial unique index preventing ZIP/role race conditions
  2. Houston ZIP codes are seeded with initial seat cap values and admin can view them via Supabase Studio
  3. The Stripe webhook endpoint exists and correctly verifies Stripe signatures (test mode)
  4. Admin can log in at `/admin` via Supabase Auth — unauthenticated users are redirected
  5. The project deploys to Vercel with all required environment variables validated at build time
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, dependencies, env validation, client singletons, database schema migration (migration apply + Vercel deploy pending credentials)
- [ ] 01-02-PLAN.md — Admin auth (middleware, login, seed) and Stripe webhook skeleton
- [ ] 01-03-PLAN.md — Houston ZIP seed data with tier assignments

### Phase 2: Landing Page
**Goal**: A professional sees the full conversion surface — dark minimal design, aggressive competitor contrast, live seat availability by ZIP, and a clear path to apply
**Depends on**: Phase 1
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07, LAND-08, LAND-09
**Success Criteria** (what must be TRUE):
  1. User lands on a dark, minimal page with "Secure Exclusive ZIP Access Before Public Launch" as the primary headline and the MVR operator-to-operator tone throughout
  2. User sees competitor contrast copy naming Zillow and HAR — specifically attacking both cost absurdity and the shared-lead model
  3. User enters a Houston ZIP code into the seat checker and sees "X of Y seats remaining" per role, sourced from the database
  4. User sees the $100 price anchor with "Applied to your first live month" framing — no "non-refundable" language
  5. Page renders correctly and is fully usable on a 375px mobile viewport
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Dark theme, serif typography, all static sections (Hero, How It Works, Competitor Contrast, Pricing, Credibility, CTA), sticky Apply CTA, scroll animations
- [ ] 02-02-PLAN.md — Live ZIP seat checker (API route + client component) and visual verification checkpoint

### Phase 3: Application Form (Steps 1-2) — COVERED BY PHASE 2
**Goal**: A user can progress through the first two form steps with their data persisted to the database at each step, and can recover their progress if they close and return
**Depends on**: Phase 2
**Requirements**: FORM-01, FORM-02, FORM-04, FORM-06, FORM-07
**Fulfilled by**: WaitlistModal 4-step reservation flow (built in Phase 2)
- Modal Step 1 collects: firstName, email, phone, zipCode, role → POST /api/reservation/start creates application record
- Modal Step 3 collects: monthlyLeadSpend, leadsPerMonth, transactionsClosed, buysOnlineLeads → PUT /api/reservation/business
- Session recovery via localStorage `mvr_session_id` + GET /api/reservation/recover
- Step progress shown as dot indicator across all 4 modal steps
**Deferred**: Top 3 ZIP selection (single primary ZIP is sufficient for demand validation)
**Not yet built**: Per-step completion timestamps (`step_1_completed_at`, `step_2_completed_at`, `step_3_completed_at`) for abandonment recovery analytics
**Plans**: N/A (covered by 02-01)

### Phase 4: Payment, Legal, and Email — COVERED BY PHASE 2
**Goal**: A user can complete the $100 payment, accept terms, receive a confirmation, and the application pipeline is fully operational — payment status is set by webhook, not client callback
**Depends on**: Phase 3
**Requirements**: FORM-03, FORM-05, PAY-01, PAY-02, PAY-03, PAY-04, LEGAL-01, LEGAL-02, LEGAL-03, EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05
**Fulfilled by**: WaitlistModal Step 4 (payment) + Step 5 (confirmation)
- Stripe Payment Element with terms acceptance checkbox
- POST /api/reservation/create-payment-intent → confirmPayment → POST /api/reservation/confirm
- Confirmation screen: "You're in, {firstName}!"
**Not yet built**: Confirmation email (EMAIL-01 through EMAIL-05), SPF/DKIM/DMARC setup, webhook-authoritative payment status
**Note**: Email infrastructure can be added as a Phase 5 or 6 task if needed before launch
**Plans**: N/A (covered by 02-01)

### Phase 5: Admin Application Queue + Email Infrastructure
**Goal**: Admin can review, filter, and act on real applications — approving, rejecting, or waitlisting each one — with each action triggering the correct automated email. Also ships the email infrastructure deferred from Phase 4 (confirmation email, SPF/DKIM/DMARC, terms field population, per-step timestamps).
**Depends on**: Phase 4
**Requirements**: ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05
**Success Criteria** (what must be TRUE):
  1. Admin sees a paginated, sortable application list at `/admin/applications` filterable by status (submitted, approved, rejected, waitlisted) and by role and ZIP
  2. Admin opens an individual application and sees all fields from Steps 1 and 2, payment status, and full timestamp history
  3. Admin clicks "Approve," "Reject," or "Waitlist" on an application — status updates in the database and the correct automated email is dispatched within 2 minutes
  4. Admin sees partial applications (users who completed Step 1 or Step 2 but did not pay) with their contact info and the step they reached
  5. User receives an "application received" confirmation email within 2 minutes of payment completing (Resend + React Email)
  6. Sending domain has SPF, DKIM, and DMARC records configured and email passes deliverability checks
  7. `terms_accepted_at` and `terms_version` are populated when user accepts terms in the reservation modal
  8. Per-step completion timestamps are tracked for abandonment recovery analytics
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Email infrastructure: dependencies, DB migration (status history + step timestamps), Resend setup, 5 branded email templates, confirmation email wired into Stripe webhook
- [ ] 05-02-PLAN.md — Admin application queue: TanStack Table with status tabs/search/filters/pagination, slide-out detail panel with seat context and audit trail, approve/reject/waitlist actions with confirmation dialogs and automated emails, partial applications tab with outreach notes

### Phase 6: Scarcity Controls and Analytics
**Goal**: Admin can tune perceived demand via phantom fill, enforce seat caps per role per ZIP, and read the funnel metrics needed to interpret demand validation results
**Depends on**: Phase 5
**Requirements**: ADMIN-06, ADMIN-07, ADMIN-08, ADMIN-09, ANLY-01, ANLY-02
**Success Criteria** (what must be TRUE):
  1. Admin sets a phantom fill count for a specific ZIP and role — the public landing page seat checker immediately reflects the updated (real + phantom) count without a page reload
  2. Admin configures seat caps per role per ZIP — when a territory reaches cap, the seat checker shows "0 remaining" and the form blocks new submissions for that ZIP/role combination
  3. Admin views a revenue summary showing total collected, refund count, and application counts by status
  4. Admin views funnel metrics showing conversion rates and drop-off counts at each step: visit, Step 1 submit, Step 2 submit, payment initiated, payment complete
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Seat controls table with inline editing, bulk actions, server actions, and DB migration (Realtime publication + page_visits table)
- [ ] 06-02-PLAN.md — Analytics dashboard with revenue KPI cards, funnel step metrics, page visit tracking endpoint and client component
- [ ] 06-03-PLAN.md — ZIP demand heat map (Leaflet choropleth), admin navigation, Supabase Realtime for public seat checker

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-20 |
| 2. Landing Page | 2/2 | Complete | 2026-02-23 |
| 3. Application Form (Steps 1-2) | N/A | Complete (covered by Phase 2 modal) | 2026-02-23 |
| 4. Payment, Legal, and Email | N/A | Complete (covered by Phase 2 modal) | 2026-02-23 |
| 5. Admin Application Queue | 2/2 | Complete   | 2026-02-23 |
| 6. Scarcity Controls and Analytics | 3/3 | Complete    | 2026-02-24 |
