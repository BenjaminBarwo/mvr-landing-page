# Project Research Summary

**Project:** MVR Founding Seat Landing Page — Territory-Based Demand Validation
**Domain:** B2B founding-seat / pay-to-join application pipeline with territory scarcity mechanics
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH

## Executive Summary

MVR is a demand validation product — not a finished marketplace — built around a pay-to-apply mechanism for real estate professionals claiming territory seats in Houston. The core loop is: land a professional on the page, show them real (and augmented) seat scarcity by ZIP/role, collect a $100 commitment via a 3-step progressive form, and feed applications into a manual admin review queue. The right way to build this is a three-surface Next.js App Router application backed by Supabase Postgres, with Stripe handling payment and Resend handling transactional email. Every meaningful pattern in this build — multi-step form progressive save, webhook-first payment confirmation, Supabase RLS for admin gating, Edge Functions for async email dispatch — is well-documented and proven. The stack is not experimental.

The recommended approach is to ship the public-facing conversion flow first (landing page, seat checker, 3-step form, Stripe, confirmation) and treat admin tooling as secondary. The MVP admin is a sortable application table with approve/reject/waitlist actions — no charts, no heatmaps, no revenue dashboards until there are 50+ paying applicants to justify them. The phantom fill / scarcity mechanic is a genuine differentiator, but it must be database-driven from day one: hard-coded or client-side counters will be caught by early adopters and will destroy trust precisely in the cohort that validates demand.

The primary risks are legal (the $100 "activation credit" framing needs a lawyer before any payment code ships), technical (Stripe webhook-first architecture must not be bypassed; race conditions must be prevented at the database level via unique constraints and optional reservation records), and product (fake scarcity signals are more damaging than no scarcity signal). All three risks have clear, known mitigations. None are blockers to starting work — they are sequencing constraints that dictate what must be decided or built before payment code is written.

---

## Key Findings

### Recommended Stack

The full stack is Next.js 15 (App Router) + TypeScript 5 + Supabase (Postgres, Auth, Realtime, Edge Functions) + Prisma 5 (ORM/migrations) + Stripe + Resend + Tailwind CSS 4 + shadcn/ui. This is one framework for all three surfaces (public, admin, background), which eliminates infrastructure complexity at MVP scale. Vercel hosts it with zero-config Next.js deployment; Supabase handles database ops, auth, and async email dispatch via Edge Functions.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework — public routes, admin routes, and API/webhook handlers in one codebase. Server Actions replace tRPC/GraphQL. React Server Components for fast initial paint.
- **Supabase:** Managed Postgres + Auth + Realtime + Edge Functions. Row Level Security enforces admin-only data access at the database level. Realtime subscriptions power live seat counters without polling.
- **Prisma 5:** Type-safe ORM with migrations. Singleton client pattern required for serverless. Schema-as-code prevents ad-hoc column sprawl.
- **Stripe (stripe@16 server, @stripe/react-stripe-js 3 client):** Payment Intents + Payment Element (not legacy CardElement). Webhook handler must be a Route Handler, not a Server Action — Stripe requires raw unparsed request body for signature verification.
- **React Hook Form 7 + Zod 3:** Uncontrolled form inputs with zero unnecessary re-renders. One Zod schema validates both client-side and server-side (via `@hookform/resolvers`).
- **Resend + React Email:** Transactional email with React component templates. Best DX for Next.js; called from Edge Functions only, never from the client.
- **Tailwind CSS 4 + shadcn/ui:** Utility-first dark/minimal UI. shadcn components are copied into the repo (code ownership, no version lock-in).

**What to explicitly avoid:** Redux/Zustand (React Hook Form + context cover all state needs), Pages Router, tRPC/GraphQL, raw Stripe CardElement, NextAuth (Supabase Auth replaces it entirely), multiple CSS solutions.

### Expected Features

**Must have (table stakes):** Every item below is a trust or conversion prerequisite. Missing any causes form drop-off or payment abandonment.
- Clear above-the-fold value proposition
- Role selector (agent / lender / inspector / contractor) early in flow
- ZIP-level seat availability display — surfaced before the form starts, not inside it
- 3-step progressive form with visible step progress indicator
- Per-step data persistence to DB (Step 1 creates record; Steps 2-3 update it)
- Stripe payment at Step 3 with Payment Element
- Post-payment confirmation page
- Mobile-responsive layout (>50% of B2B form traffic is mobile)
- Explicit refund/terms framing on payment step
- Application received email (immediate, post-payment)
- Admin application queue (list view) with approve/reject/waitlist actions
- Automated status emails for each admin action

**Should have (competitive differentiators):**
- Per-ZIP phantom fill control (admin-set offset added to real count for display) — scarcity mechanic that drives real demand
- Live ZIP seat checker on landing page before form entry — users who check ZIP are significantly more likely to apply
- Competitor contrast section (Zillow/HAR attack copy) — pre-sells professionals before they hit the form
- Role-based seat caps per ZIP — enforceable scarcity, not fake countdown timers
- Step-level funnel analytics (drop-off visibility)
- Partial application visibility in admin (abandonment recovery surface)
- Behavioral signals capture at Step 2 (business context qualifies applicants and validates demand quality)

**Defer to v2+:**
- Abandonment recovery email sequence — manual outreach beats automation at fewer than 50 applicants
- ZIP demand density heatmap — sortable admin table delivers 80% of intelligence at 20% build cost
- Detailed revenue tracking dashboard — Stripe dashboard covers low-volume needs
- Multi-city expansion, consumer features, chat widget, SMS notifications

### Architecture Approach

This is a three-surface system sharing one Postgres database and one auth layer: public web (unauthenticated), admin web (Supabase Auth gated at /admin/*), and background processing (Supabase Edge Functions for email triggers, webhook handling, and abandonment cron). All surfaces write to and read from Supabase Postgres. The Stripe webhook is the authoritative signal for payment confirmation — the client-side redirect is display-only. Supabase Realtime propagates seat count changes from admin ZIP management to the public landing page without polling.

**Major components:**
1. **Landing Page + ZIP Seat Checker** — SSR initial render, Supabase Realtime for live counter updates; read-only from public surface
2. **Multi-Step Application Form (Steps 1-3)** — Server Actions for progressive upsert; localStorage session key for recovery; Stripe Payment Element on Step 3
3. **Stripe Webhook Handler** — Route Handler at `/api/webhooks/stripe`; webhook is authoritative for `status=submitted`, `paid_at`; triggers email Edge Function
4. **Admin Auth Gate + Application Queue** — Supabase Auth session checked in Next.js middleware; sortable/filterable table; approve/reject/waitlist Server Actions that also trigger email dispatch
5. **ZIP Manager (admin)** — Seat cap + phantom fill editor; writes to `zip_seats` table; Realtime propagates changes to public counters
6. **Email Dispatcher (Edge Function)** — Called by webhook handler and admin actions; never called from client; logs to `email_log`
7. **Abandonment Cron (Edge Function)** — Scheduled; finds incomplete applications older than 2h; checks `email_log` for deduplication before sending

**Core database tables:** `applications` (full application state + payment + UTM tracking + session_id), `zip_seats` (cap + phantom_count per ZIP/role), `email_log` (send audit trail per application).

### Critical Pitfalls

1. **Stripe webhook-first bypassed** — NEVER set payment-confirmed state from the client-side redirect alone. The webhook (`payment_intent.succeeded`) is the single source of truth. Client shows "processing"; confirmed state set only after webhook fires and updates DB. Must be established in the payment phase — non-negotiable.

2. **ZIP territory oversell via race conditions** — No unique constraint or reservation system allows two simultaneous submissions for the same ZIP/role to both succeed. Prevention: partial unique index or `SELECT FOR UPDATE` in initial schema migration. Reservation record created before payment, expires after 15 minutes if payment fails. Must be in the first schema migration.

3. **$100 activation credit legal structure unclear** — "Activation credit" framing creates refundable deposit vs. conditional pre-sale ambiguity with chargeback risk. Get legal review before writing any payment code. Store `terms_accepted_at` and `terms_version` on every application record.

4. **Scarcity counter is visibly fake** — Seat counter must reflect real DB state (`real_count + phantom_count`). Computed server-side only. Phantom fill stored per-ZIP in DB, not in code. If a territory is at 0 remaining, the block must be enforced at server level, not just UI. Database-driven from day one.

5. **No idempotency on Stripe calls** — Network retries or double-clicks without idempotency keys create duplicate charges. Generate a stable idempotency key per application attempt; disable the submit button immediately on first click.

---

## Implications for Roadmap

Based on the dependency chain in ARCHITECTURE.md and the priority order in FEATURES.md, a 6-phase structure is recommended. Phases 1-4 constitute the minimum viable conversion flow. Phases 5-6 are the admin intelligence layer.

### Phase 1: Foundation — Schema, Auth, Infrastructure
**Rationale:** Everything else depends on the database schema and auth layer. The territory race condition fix (Pitfall 5) and state machine (Pitfall 9) must be correct from the first migration. Changing schema after payment data exists is painful.
**Delivers:** Supabase Postgres schema with RLS policies; ZIP seat data seeded for Houston; admin auth via Supabase Auth with Next.js middleware; `@t3-oss/env-nextjs` env validation; Sentry instrumentation; Vercel project configured.
**Addresses:** Applications table, zip_seats table, email_log table; role enum; status enum + single transition function.
**Avoids:** Pitfalls 5 (race condition — partial unique index in first migration), 9 (implicit state machine — enum + transition function from day one), 15 (terms version — column in schema).

### Phase 2: Public Landing Page + ZIP Seat Checker
**Rationale:** The seat checker is the highest pre-form conversion lever. Users who check ZIP are significantly more likely to apply. This surface must be live and database-driven before the form is wired. It also validates that Supabase Realtime is working.
**Delivers:** Full landing page with all copy sections (value prop, competitor contrast, founder credibility, role selector framing, $100 price transparency); live ZIP seat checker widget; CTA to apply.
**Addresses:** Above-the-fold value prop, ZIP availability display, role selector, price transparency, mobile-responsive layout, competitor contrast section.
**Avoids:** Pitfall 4 (static counter — seat checker reads from DB on day one, Realtime wired even before many applicants exist).

### Phase 3: Multi-Step Application Form (Steps 1-2, No Payment)
**Rationale:** Progressive save architecture must be established before payment is wired. Step 1 creates the application record; Step 2 captures business context. This validates the form UX, DB write path, and Server Action pattern before money is involved.
**Delivers:** 3-step wizard UI with progress indicator; Step 1 (name/email/phone/role) with Server Action upsert; Step 2 (ZIP selection, business context fields) with Server Action update; localStorage session key for recovery; "Your progress was saved" indicator.
**Addresses:** Multi-step form with step indicator, per-step persistence, behavioral signals capture, session_id tracking, UTM capture.
**Avoids:** Pitfall 6 (no progressive save — persistence is the architecture, not an afterthought), Pitfall 10 (payment as gotcha — $100 already visible on landing page; Step 1 is frictionless).

### Phase 4: Stripe Payment + Transactional Email
**Rationale:** Payment is the riskiest phase — legal, technical, and UX. Legal must be resolved before this phase starts. Webhook-first architecture is non-negotiable. Email is tightly coupled to payment completion (confirmation email triggers from webhook), so it belongs in the same phase.
**Delivers:** Step 3 Payment Element integration; PaymentIntent creation API route with idempotency keys; Stripe webhook handler at `/api/webhooks/stripe` with signature verification; post-payment confirmation page; Resend/React Email templates for all 4 transaction states (received, approved, rejected, waitlisted); SPF/DKIM/DMARC configured; email_log writes; `terms_accepted_at` stored at Step 3.
**Addresses:** Stripe payment collection, post-payment confirmation, application received email, automated status emails.
**Avoids:** Pitfall 1 (webhook bypassed — webhook is authoritative from day one), Pitfall 2 (no idempotency — keys generated per attempt), Pitfall 3 (legal structure — resolved before this phase starts), Pitfall 7 (email deliverability — DNS configured before first send), Pitfall 12 (test/live mode confusion — env validation + live-mode checklist).

### Phase 5: Admin Application Queue
**Rationale:** After Phase 4 ships, paying applicants exist. Admin needs minimum viable review workflow. Per Pitfall 8, keep this deliberately lean — sortable table, status filters, approve/reject/waitlist actions, individual application detail view. No charts yet.
**Delivers:** `/admin/applications` list with TanStack Table (sortable, filterable by status/role/ZIP); `/admin/applications/[id]` detail view; approve/reject/waitlist Server Actions that update status and trigger email Edge Function; partial application visibility (draft/abandoned rows visible to admin).
**Addresses:** Admin application queue, approve/reject/waitlist actions, partial application visibility.
**Avoids:** Pitfall 8 (over-engineered admin — deliberately minimal; Supabase Studio can be used internally until this ships).

### Phase 6: Scarcity Management, Funnel Analytics, ZIP Intelligence
**Rationale:** Once the pipeline is working, the phantom fill mechanic, funnel analytics, and ZIP management surface become the tools that tune demand. These are post-validation features — they require real applicant data to be meaningful.
**Delivers:** `/admin/zips` — per-ZIP seat cap editor and phantom fill sliders; step-level funnel analytics dashboard (conversion rates, drop-off by step); Supabase Realtime propagation from zip_seats to public landing page seat counters; rate limiting (max 3 submissions/IP/hour); Stripe Radar rules.
**Addresses:** Per-ZIP phantom fill control, role-based seat caps, funnel analytics, ZIP seat management.
**Avoids:** Pitfall 4 (phantom fill in code — moved to DB and admin UI), Pitfall 13 (manual refunds — automated refund trigger if territory threshold not met), Pitfall 14 (no rate limiting — added in this phase).

---

### Phase Ordering Rationale

- **Schema before UI:** Race condition prevention and state machine correctness must be in the initial migration. Schema changes after payment data exists are painful.
- **Landing page before form:** Validates copy, scarcity display, and Realtime integration before any form complexity is added.
- **Form before payment:** Progressive save architecture must be correct before Stripe is wired. A broken persistence layer discovered during payment testing is expensive.
- **Payment + Email together:** Confirmation email is triggered by the webhook. Separating them creates a phase where payments succeed but no emails send.
- **Admin after public flow:** No admin tooling is needed until applicants exist. Supabase Studio is sufficient for internal access while Phases 1-4 ship.
- **Analytics and scarcity controls last:** These require real data to be meaningful and are the tuning layer, not the conversion layer.

---

### Research Flags

Phases needing deeper research during planning:
- **Phase 4 (Stripe + Email):** Stripe webhook idempotency edge cases, PaymentIntent creation with retry logic, and Resend deliverability setup all benefit from reviewing current Stripe and Resend docs at implementation time. Patterns are known but version-specific details matter.
- **Phase 1 (Schema):** Supabase RLS policies for the `zip_seats` public-read / admin-write split need to be written carefully. RLS policy authoring for complex access patterns is worth a quick docs review before writing migrations.

Phases with standard patterns (skip additional research):
- **Phase 2 (Landing Page):** Pure Next.js RSC + Tailwind + shadcn. Well-documented, no novel integration points.
- **Phase 3 (Multi-step Form):** React Hook Form + Zod + Server Actions pattern is canonical. No research needed.
- **Phase 5 (Admin Queue):** TanStack Table + Server Actions for status mutations. Standard pattern.
- **Phase 6 (Analytics):** Recharts + Supabase aggregated queries. Well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are actively maintained, well-documented, and widely adopted together. No experimental dependencies. Official docs verified. |
| Features | HIGH | Feature set derived from established B2B founding-seat patterns (Superhuman, Substack) and Baymard Institute form conversion research. Well-grounded. |
| Architecture | HIGH | Three-surface Next.js/Supabase/Stripe architecture is a known pattern. Supabase Edge Functions for async email and webhooks is canonical. No novel architectural choices. |
| Pitfalls | MEDIUM-HIGH | Webhook-first, idempotency, and race condition pitfalls are well-documented Stripe/Postgres patterns. Legal structure risk (Pitfall 3) is domain-specific and cannot be fully resolved by research alone — needs external validation. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Legal: $100 activation credit structure** — Research identifies the risk and mitigation (lawyer review, terms_accepted_at, explicit refund policy) but cannot resolve the legal question. This must be addressed before Phase 4 begins. Do not write payment code until this is resolved.
- **Houston ZIP data completeness** — Research recommends a maintained ZIP code database but does not specify a source. Identify and validate the ZIP code dataset during Phase 1. USPS ZIPCode API or a commercially maintained ZIP5 database are starting points.
- **Seat cap values for Houston launch** — The schema supports configurable per-ZIP/role caps, but actual cap values are a product decision, not a technical one. These need to be decided before Phase 2 ships so the seed data is accurate.
- **Abandonment recovery timing** — Research defers the automated abandonment email sequence to v2+ (fewer than 50 applicants = manual outreach is better), but the 2-hour trigger threshold for the Phase 6 cron is a product assumption. Validate against actual application behavior.

---

## Sources

### Primary (HIGH confidence)
- Next.js App Router official docs — Server Actions, Route Handlers, middleware, RSC patterns
- Supabase docs — RLS, Realtime, Edge Functions, Auth SSR with Next.js App Router
- Stripe docs — Payment Intents, Payment Element, webhook best practices, idempotency keys, Radar
- Resend docs — React Email, Next.js integration, DNS configuration
- shadcn/ui docs — Component system, Radix UI foundation

### Secondary (MEDIUM confidence)
- React Hook Form docs — multi-step wizard with `useFormContext`, `@hookform/resolvers` Zod adapter
- TanStack Table docs — headless table patterns, server-side filtering
- Baymard Institute — B2B multi-step form conversion research, progressive disclosure patterns
- CXL Institute — conversion optimization, payment step friction

### Tertiary (MEDIUM confidence)
- Founding-seat patterns: Superhuman, Substack founding membership, YC application pipeline — behavioral benchmarks for pay-to-join flows
- Scarcity mechanics: real vs. fake urgency research — validates phantom fill approach and explicitly disqualifies countdown timers
- Abandonment recovery benchmarks: 10-20% conversion rate for automated B2B follow-up sequences (needs validation against actual MVR funnel data)

---

*Research completed: 2026-02-19*
*Ready for roadmap: yes*
