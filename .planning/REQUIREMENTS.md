# Requirements: MVR Founding Seat Landing Page

**Defined:** 2026-02-19
**Core Value:** Prove ZIP-level demand density and pricing elasticity through real activation willingness at $100

## v1 Requirements

### Landing Page

- [ ] **LAND-01**: User sees dark, minimal landing page with "Secure Exclusive ZIP Access Before Public Launch" headline
- [ ] **LAND-02**: User sees subheadline explaining prioritized routing within protected territory
- [ ] **LAND-03**: User sees "How It Works" section explaining founding seat mechanism
- [ ] **LAND-04**: User sees competitor contrast section naming Zillow/HAR — cost absurdity + shared-lead model
- [ ] **LAND-05**: User sees price anchor: "Founding Seats require a $100 activation credit. Applied to your first live month. Limited by ZIP and role."
- [ ] **LAND-06**: User sees founder credibility section (industry insider angle)
- [ ] **LAND-07**: User can enter ZIP code and see live seat availability per role
- [ ] **LAND-08**: User sees "Apply for Founding Seat" CTA button
- [ ] **LAND-09**: Landing page is fully responsive on mobile (375px+)

### Application Form

- [ ] **FORM-01**: User completes Step 1: name, email, phone, role — data saved to DB immediately
- [ ] **FORM-02**: User completes Step 2: primary ZIP, top 3 ZIPs, monthly lead spend (range), leads/month (range), transactions closed/month (range), currently buying online leads (Y/N) — data saved to DB
- [ ] **FORM-03**: User completes Step 3: $100 Stripe payment
- [ ] **FORM-04**: User sees progress indicator across all 3 steps
- [ ] **FORM-05**: User sees confirmation page after payment: "Application received. We review within 48 hours."
- [ ] **FORM-06**: User's partial application data persists if they close and return (localStorage + DB)
- [ ] **FORM-07**: Application data architecture supports v1.1 abandonment recovery (step_completed tracking, timestamps, session_id)

### Payments

- [ ] **PAY-01**: $100 payment processed via Stripe Payment Element or Checkout
- [ ] **PAY-02**: Payment status set by Stripe webhook (not client-side callback)
- [ ] **PAY-03**: Idempotency keys on all Stripe API calls
- [ ] **PAY-04**: Submit button disabled during payment processing

### Legal

- [ ] **LEGAL-01**: Terms of Service / disclaimer page accessible from application form
- [ ] **LEGAL-02**: User must accept TOS before payment step
- [ ] **LEGAL-03**: terms_accepted_at timestamp and terms_version stored per application record

### Emails

- [ ] **EMAIL-01**: Automated "application received" email sent on payment success
- [ ] **EMAIL-02**: Automated "approved" email sent when admin approves
- [ ] **EMAIL-03**: Automated "rejected" email sent when admin rejects
- [ ] **EMAIL-04**: Automated "waitlisted" email sent when admin waitlists
- [ ] **EMAIL-05**: SPF/DKIM/DMARC configured for sending domain

### Admin Dashboard

- [ ] **ADMIN-01**: Admin can log in via Supabase Auth (protected routes)
- [ ] **ADMIN-02**: Admin can view application queue with status filters
- [ ] **ADMIN-03**: Admin can view individual application detail (all fields + payment status)
- [ ] **ADMIN-04**: Admin can approve, reject, or waitlist an application (triggers email)
- [ ] **ADMIN-05**: Admin can see partial applications with contact info + step reached
- [ ] **ADMIN-06**: Admin can configure seat caps per role per ZIP
- [ ] **ADMIN-07**: Admin can set phantom fill count per ZIP (inflate perceived demand)
- [ ] **ADMIN-08**: Admin can view ZIP demand heat map of Houston
- [ ] **ADMIN-09**: Admin can view revenue tracking (total collected, refunds, count by status)

### Analytics

- [ ] **ANLY-01**: Funnel metrics tracked: visit → Step 1 submit → Step 2 submit → Payment initiated → Payment complete
- [ ] **ANLY-02**: Drop-off rate visible per funnel step

### Infrastructure

- [ ] **INFRA-01**: Database schema with RLS (applications, zip_seats, email_log tables)
- [ ] **INFRA-02**: Houston ZIP codes seeded with initial seat caps
- [ ] **INFRA-03**: Stripe webhook endpoint with signature verification
- [ ] **INFRA-04**: Deployed to Vercel with environment variable management

## v2 Requirements

### Abandonment Recovery (v1.1)

- **ABAN-01**: Automated abandonment email at 24h for incomplete applications
- **ABAN-02**: Automated abandonment email at 72h for incomplete applications
- **ABAN-03**: Abandonment email includes ZIP scarcity messaging

### Analytics (v1.1)

- **ANLY-03**: Lead quality signals — aggregate spend ranges, lead volumes across applicant pool

## Out of Scope

| Feature | Reason |
|---------|--------|
| MVR routing product itself | This is demand validation only |
| Auto-approval | Destroys scarcity positioning |
| "Non-refundable" messaging | Creates unnecessary trust drag |
| Countdown timers | Professionals detect fake urgency instantly |
| Multi-city expansion | Houston is the contained test market |
| Mobile app | Web-first |
| SMS notifications | TCPA compliance risk, email covers needs |
| Chat widget | Manual outreach is the feature at this scale |
| Payment plans for $100 | $100 is the seriousness filter |
| Essay fields | Unquantifiable, breaks analytics |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAND-01 | Phase 2 | Pending |
| LAND-02 | Phase 2 | Pending |
| LAND-03 | Phase 2 | Pending |
| LAND-04 | Phase 2 | Pending |
| LAND-05 | Phase 2 | Pending |
| LAND-06 | Phase 2 | Pending |
| LAND-07 | Phase 2 | Pending |
| LAND-08 | Phase 2 | Pending |
| LAND-09 | Phase 2 | Pending |
| FORM-01 | Phase 3 | Pending |
| FORM-02 | Phase 3 | Pending |
| FORM-03 | Phase 4 | Pending |
| FORM-04 | Phase 3 | Pending |
| FORM-05 | Phase 4 | Pending |
| FORM-06 | Phase 3 | Pending |
| FORM-07 | Phase 3 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| PAY-04 | Phase 4 | Pending |
| LEGAL-01 | Phase 4 | Pending |
| LEGAL-02 | Phase 4 | Pending |
| LEGAL-03 | Phase 4 | Pending |
| EMAIL-01 | Phase 4 | Pending |
| EMAIL-02 | Phase 4 | Pending |
| EMAIL-03 | Phase 4 | Pending |
| EMAIL-04 | Phase 4 | Pending |
| EMAIL-05 | Phase 4 | Pending |
| ADMIN-01 | Phase 1 | Pending |
| ADMIN-02 | Phase 5 | Pending |
| ADMIN-03 | Phase 5 | Pending |
| ADMIN-04 | Phase 5 | Pending |
| ADMIN-05 | Phase 5 | Pending |
| ADMIN-06 | Phase 6 | Pending |
| ADMIN-07 | Phase 6 | Pending |
| ADMIN-08 | Phase 6 | Pending |
| ADMIN-09 | Phase 6 | Pending |
| ANLY-01 | Phase 6 | Pending |
| ANLY-02 | Phase 6 | Pending |
| INFRA-01 | Phase 1 | In Progress (DDL written, migration apply pending credentials) |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | In Progress (env validation working, Vercel deploy pending credentials) |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-20 after Plan 01-01 execution — INFRA-01 and INFRA-04 in progress*
