# Roadmap: MVR Founding Seat Landing Page

## Overview

Six phases build the complete demand validation pipeline. The sequence is dictated by hard dependencies: schema correctness cannot be patched after payment data exists; the seat checker must read from the database before the form is wired; progressive form save must be proven before Stripe is introduced; payment and transactional email ship together because the confirmation email triggers from the webhook; admin tooling follows the public flow because it requires real applicants to be useful; scarcity controls and funnel analytics close out the build because they tune a working pipeline, not create one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Database schema, infrastructure wiring, and admin auth — everything downstream depends on this being correct
- [ ] **Phase 2: Landing Page** - Public-facing conversion surface with live ZIP seat checker and all persuasion copy
- [ ] **Phase 3: Application Form (Steps 1-2)** - Progressive multi-step form with per-step DB persistence, before payment is involved
- [ ] **Phase 4: Payment, Legal, and Email** - Stripe integration, terms acceptance, webhook-authoritative confirmation, and all transactional emails
- [ ] **Phase 5: Admin Application Queue** - Minimum viable review workflow for real applicants entering the pipeline
- [ ] **Phase 6: Scarcity Controls and Analytics** - Phantom fill management, seat cap editor, funnel metrics, and ZIP demand intelligence

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
**Plans**: TBD

### Phase 3: Application Form (Steps 1-2)
**Goal**: A user can progress through the first two form steps with their data persisted to the database at each step, and can recover their progress if they close and return
**Depends on**: Phase 2
**Requirements**: FORM-01, FORM-02, FORM-04, FORM-06, FORM-07
**Success Criteria** (what must be TRUE):
  1. User completes Step 1 (name, email, phone, role) and their application record is immediately created in the database — visible in Supabase Studio
  2. User completes Step 2 (primary ZIP, top 3 ZIPs, monthly lead spend range, leads/month range, transactions/month range, currently buying online leads Y/N) and all fields are saved to the existing record
  3. A visible step progress indicator shows which step the user is on across all 3 steps
  4. User who closes the browser after Step 1 and returns sees their Step 1 data pre-filled (via localStorage session key + DB lookup)
  5. The application record stores `step_completed`, `session_id`, and per-step timestamps to support abandonment recovery in v1.1
**Plans**: TBD

### Phase 4: Payment, Legal, and Email
**Goal**: A user can complete the $100 payment, accept terms, receive a confirmation, and the application pipeline is fully operational — payment status is set by webhook, not client callback
**Depends on**: Phase 3
**Requirements**: FORM-03, FORM-05, PAY-01, PAY-02, PAY-03, PAY-04, LEGAL-01, LEGAL-02, LEGAL-03, EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05
**Success Criteria** (what must be TRUE):
  1. User at Step 3 sees the Stripe Payment Element, must accept Terms of Service before the submit button is active, and the submit button disables immediately on click
  2. After successful payment, user lands on a confirmation page reading "Application received. We review within 48 hours." — and the application status in the database is set by the Stripe webhook, not the client redirect
  3. User receives an "application received" email within 2 minutes of payment completing
  4. Terms acceptance timestamp (`terms_accepted_at`) and terms version are stored on the application record
  5. Sending domain has SPF, DKIM, and DMARC records configured and email passes deliverability checks
**Plans**: TBD

### Phase 5: Admin Application Queue
**Goal**: Admin can review, filter, and act on real applications — approving, rejecting, or waitlisting each one — with each action triggering the correct automated email
**Depends on**: Phase 4
**Requirements**: ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Success Criteria** (what must be TRUE):
  1. Admin sees a paginated, sortable application list at `/admin/applications` filterable by status (submitted, approved, rejected, waitlisted) and by role and ZIP
  2. Admin opens an individual application and sees all fields from Steps 1 and 2, payment status, and full timestamp history
  3. Admin clicks "Approve," "Reject," or "Waitlist" on an application — status updates in the database and the correct automated email is dispatched within 2 minutes
  4. Admin sees partial applications (users who completed Step 1 or Step 2 but did not pay) with their contact info and the step they reached
**Plans**: TBD

### Phase 6: Scarcity Controls and Analytics
**Goal**: Admin can tune perceived demand via phantom fill, enforce seat caps per role per ZIP, and read the funnel metrics needed to interpret demand validation results
**Depends on**: Phase 5
**Requirements**: ADMIN-06, ADMIN-07, ADMIN-08, ADMIN-09, ANLY-01, ANLY-02
**Success Criteria** (what must be TRUE):
  1. Admin sets a phantom fill count for a specific ZIP and role — the public landing page seat checker immediately reflects the updated (real + phantom) count without a page reload
  2. Admin configures seat caps per role per ZIP — when a territory reaches cap, the seat checker shows "0 remaining" and the form blocks new submissions for that ZIP/role combination
  3. Admin views a revenue summary showing total collected, refund count, and application counts by status
  4. Admin views funnel metrics showing conversion rates and drop-off counts at each step: visit, Step 1 submit, Step 2 submit, payment initiated, payment complete
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/3 | In progress — Plan 01 done (migration apply + Vercel pending user credentials) | 2026-02-20 (partial) |
| 2. Landing Page | 0/TBD | Not started | - |
| 3. Application Form (Steps 1-2) | 0/TBD | Not started | - |
| 4. Payment, Legal, and Email | 0/TBD | Not started | - |
| 5. Admin Application Queue | 0/TBD | Not started | - |
| 6. Scarcity Controls and Analytics | 0/TBD | Not started | - |
