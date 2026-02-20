# Domain Pitfalls

**Domain:** Territory-based demand validation landing page with multi-step application flow, Stripe payment, admin dashboard, scarcity mechanics, and automated email
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH

---

## Critical Pitfalls

### Pitfall 1: Stripe Webhook-First Architecture Bypassed

**What goes wrong:** The application treats the Stripe client-side success callback as authoritative for payment confirmation, bypassing webhooks.

**Consequences:**
- Payments that fail post-authorization are recorded as successful
- Duplicate charge records from user retries
- Territory slots marked as "claimed" for users who were never charged

**Prevention:**
- NEVER write payment-confirmed state based on client-side callback alone
- Implement webhooks (`payment_intent.succeeded`, `payment_intent.payment_failed`) as single source of truth
- Use webhook signature verification on every incoming webhook
- Client-side shows "processing" only; confirmed state set only after webhook

**Phase:** Must be established in payment infrastructure phase. Non-negotiable.

---

### Pitfall 2: No Idempotency on Stripe Calls

**What goes wrong:** PaymentIntents created without idempotency keys. Network retries or double-clicks create duplicate charges.

**Prevention:**
- Generate stable idempotency key per application attempt
- Pass key in every Stripe API call that creates/confirms a PaymentIntent
- Disable submit button immediately on first click

**Phase:** Payment infrastructure phase.

---

### Pitfall 3: $100 Activation Credit Legal Structure Unclear

**What goes wrong:** "Activation credit" framing obscures whether $100 is refundable deposit, conditional pre-sale, or promotional credit — creating regulatory and chargeback risk.

**Prevention:**
- Obtain legal review before launch
- Write explicit refund policy displayed on payment step and in confirmation email
- Store terms_accepted_at timestamp and terms_version for every applicant
- Do NOT describe as "credit" if it behaves as a refundable deposit

**Phase:** Must be resolved before any payment code is written.

---

### Pitfall 4: Scarcity Mechanics Are Visibly Fake

**What goes wrong:** Seat counter is static, hard-coded, or resets on refresh. Power users notice and share screenshots.

**Consequences:** Credibility destroyed in early adopter communities — the exact cohort that validates demand.

**Prevention:**
- Counter MUST reflect real database state (real_count + phantom_count from DB)
- Computed server-side, never hard-coded on client
- If territory is at 0 remaining, block application at server level (not just UI)
- Phantom fill is stored per-ZIP in database, not in code

**Phase:** Scarcity mechanics phase. Database-driven from day one.

---

### Pitfall 5: ZIP Territory Oversell via Race Conditions

**What goes wrong:** No unique constraint or reservation system allows two simultaneous submissions for the same ZIP/role to both succeed.

**Prevention:**
- Database-level constraint: partial unique index or SELECT FOR UPDATE
- Reservation record created before payment; expires after 15 min if payment fails
- Concurrent submission testing before launch

**Phase:** Initial data model. Must be in first schema migration.

---

## Moderate Pitfalls

### Pitfall 6: Multi-Step Form Loses State on Tab Close

**What goes wrong:** Form stores state only in React component state. Tab close = all data lost.

**Prevention:**
- Progressive save to server on each step transition
- localStorage backup with session key
- Show "Your progress was saved" indicator
- Track step-level analytics events

**Phase:** Multi-step form phase. Build persistence into architecture from start.

---

### Pitfall 7: Email Deliverability Fails

**What goes wrong:** Transactional emails land in spam without SPF/DKIM/DMARC records.

**Prevention:**
- Use dedicated transactional email provider (Resend)
- Configure SPF, DKIM, DMARC records before first email
- Use subdomain for transactional email (e.g., mail.yourdomain.com)
- Test through mail-tester.com before launch

**Phase:** Infrastructure setup + email phase.

---

### Pitfall 8: Admin Dashboard Over-Engineered Before Validation

**What goes wrong:** Weeks spent building feature-rich admin before any demand is validated.

**Prevention:**
- MVP admin: sortable table of applications with status + actions
- Feature-rich dashboard only after first 50 paying applicants
- Can use Supabase Studio for internal views initially

**Phase:** Admin is lower priority than public-facing conversion flow.

---

### Pitfall 9: Application Status State Machine Is Implicit

**What goes wrong:** Status managed with ad-hoc boolean columns. Race conditions cause impossible states.

**Prevention:**
- Single `status` enum column (not multiple booleans)
- All status transitions through a single function
- Log every transition with timestamp and trigger

**Phase:** Initial data model.

---

### Pitfall 10: Payment Step Feels Like a "Gotcha"

**What goes wrong:** Users reach payment step without prior awareness of $100 cost. Drop-off and distrust.

**Prevention:**
- Show $100 requirement on landing page before any form interaction
- Collect low-friction info first (name, email, phone, role)
- Payment step re-states value: what they get, what the credit is
- Step-level funnel analytics from day one

**Phase:** Form design phase.

---

### Pitfall 11: ZIP Code Data Is Stale

**What goes wrong:** Hard-coded ZIP list missing new codes. Legitimate applicants rejected.

**Prevention:**
- Use maintained ZIP code database
- Store data source version and update date
- Territory boundaries at ZIP5 level, not lat/long

**Phase:** Initial data model.

---

## Minor Pitfalls

### Pitfall 12: Stripe Test/Live Mode Confusion at Launch

**Prevention:** Separate env files, explicit live-mode checklist, smoke test 48h before launch.

### Pitfall 13: Refund Logic Is Manual

**Prevention:** Automated refund trigger for territories that don't reach threshold. Log every refund. Confirmation email via `charge.refunded` webhook.

### Pitfall 14: No Rate Limiting on Submission

**Prevention:** Max 3 submissions per IP per hour. CAPTCHA on first step. Stripe Radar rules.

### Pitfall 15: Legal Terms Accepted Without Timestamped Record

**Prevention:** Store `terms_accepted_at` and `terms_version` on every application record. Serve terms from versioned URL.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Payment integration | Webhook-first bypassed (1) | Implement webhooks before client-side handling |
| Payment integration | No idempotency (2) | Generate keys before calling Stripe |
| Data model | No unique constraint on territory (5) | Partial unique index in initial migration |
| Data model | Implicit state machine (9) | Enum + transition function |
| Legal/compliance | $100 credit structure unclear (3) | Lawyer review before payment code |
| Multi-step form | No progressive save (6) | Build persistence from start |
| Scarcity mechanics | Counter is static (4) | Database-driven from day one |
| Email | Deliverability not configured (7) | SPF/DKIM/DMARC before first email |
| Admin | Over-engineered (8) | Minimal table first, expand post-validation |

---

## Sources

- Stripe docs: Webhooks best practices, Idempotency keys, Radar
- PostgreSQL: Partial unique indexes
- Email deliverability: SPF/DKIM/DMARC best practices
- Conversion optimization: Baymard Institute multi-step form research
