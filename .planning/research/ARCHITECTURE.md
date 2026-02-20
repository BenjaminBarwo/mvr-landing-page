# Architecture Patterns

**Domain:** Territory-based demand validation — landing page, multi-step application pipeline, payment collection, admin operations
**Project:** MVR Founding Seat Landing Page
**Researched:** 2026-02-19
**Stack Assumed:** Next.js (App Router), TypeScript, Supabase (Postgres + Auth + Edge Functions + Realtime), Stripe, Vercel

---

## Recommended Architecture

### System Overview

This is a three-surface system sharing one Postgres database and one auth layer:

```
[ Public Web ]  →  Next.js App (public routes)
[ Admin Web ]   →  Next.js App (protected routes, /admin/*)
[ Background ]  →  Supabase Edge Functions (email triggers, webhooks)

All surfaces talk to:
  Supabase Postgres    — source of truth for all state
  Supabase Auth        — admin identity only (applicants are not users)
  Stripe               — payment collection and webhook events
  Email provider       — transactional send (Resend recommended)
```

### Surfaces and Their Routes

```
Public surface (unauthenticated):
  /                      Landing page with live seat counters
  /apply                 Multi-step application form (Step 1–3)
  /apply/confirmation    Post-payment thank-you page

Admin surface (Supabase Auth, role-checked):
  /admin                 Dashboard overview (key metrics)
  /admin/applications    Application review queue (approve/reject/waitlist)
  /admin/applications/[id]  Individual application detail + action panel
  /admin/zips            ZIP seat management (caps, phantom fill, heat map)
  /admin/analytics       Funnel metrics, revenue, demand density
  /admin/emails          Email template preview and resend controls

Background surface (no HTTP endpoints — event-driven):
  Edge Function: stripe-webhook     — Processes payment events
  Edge Function: send-email         — Transactional email dispatcher
  Edge Function: abandonment-cron   — Scheduled scan for incomplete applications
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Landing Page** | Display copy, live seat counters by ZIP/role, CTA | Supabase (seat counts via realtime or SSR), nothing writes here |
| **ZIP Seat Checker** | Accept ZIP input, query available seats per role, return live count | Supabase `zip_seats` table (read-only from public) |
| **Application Form** | 3-step wizard with progressive save, Stripe Payment Element on Step 3 | Supabase `applications` table (upsert per step), Stripe (payment intent creation) |
| **Stripe Payment Element** | Collect card, complete payment intent, redirect on success | Stripe API (client-side), Next.js API route for intent creation |
| **Confirmation Page** | Display post-payment state ("review within 48 hours"), no actions | Supabase application record (read by session token or URL param) |
| **Admin Auth Gate** | Protect all /admin/* routes | Supabase Auth (session check in middleware) |
| **Application Queue** | List applications with status filters, bulk and individual actions | Supabase `applications` table, Supabase Edge Function (email on status change) |
| **Application Detail** | Full applicant profile, business data, payment status, action buttons | Supabase (read application + payment record), Edge Function (trigger email) |
| **ZIP Manager** | Per-ZIP seat caps by role, phantom fill sliders, current fill rates | Supabase `zip_seats` table (read-write admin only) |
| **Heat Map** | Geographic density visualization of application demand by ZIP | Supabase aggregated query over `applications` |
| **Analytics Dashboard** | Funnel step counts, conversion rates, revenue totals, refunds | Supabase aggregated queries (server-side) |
| **Email Dispatcher** | Send transactional emails on triggered events | Resend API (or similar), called by Edge Functions only — never from client |
| **Abandonment Cron** | Find applications with no payment after N hours, send follow-up | Supabase scheduled Edge Function → email dispatcher |
| **Stripe Webhook Handler** | Receive Stripe events, update payment status in DB, trigger email | Stripe → Next.js API route → Supabase write → Edge Function (email) |

---

## Database Schema (Core Tables)

```
applications
  id                  uuid PK
  created_at          timestamptz
  updated_at          timestamptz
  step_completed      int (1, 2, or 3 — highest step saved)
  status              enum: draft | submitted | approved | rejected | waitlisted

  -- Step 1
  name                text
  email               text
  phone               text
  role                enum: agent | lender | inspector | contractor

  -- Step 2
  primary_zip         text
  top_zips            text[] (array of 3 ZIP codes)
  monthly_lead_spend  text (range label)
  leads_per_month     text (range label)
  transactions_closed text (range label)
  buys_online_leads   boolean

  -- Step 3 / Payment
  stripe_payment_intent_id  text
  stripe_payment_status     text (requires_payment | succeeded | failed)
  paid_at               timestamptz
  payment_amount_cents  int (always 10000)

  -- Admin
  reviewed_by         uuid FK → admin_users.id (nullable)
  reviewed_at         timestamptz
  admin_notes         text

  -- Tracking
  utm_source          text
  utm_medium          text
  utm_campaign        text
  referrer            text
  ip_country          text (Vercel geo header)
  session_id          text (anonymous, set client-side for abandonment tracking)

zip_seats
  id                  uuid PK
  zip_code            text
  role                enum (same as above)
  total_cap           int (configurable)
  phantom_count       int (admin-set phantom fill offset — added to real count for display)
  created_at          timestamptz
  updated_at          timestamptz

  UNIQUE(zip_code, role)

-- Derived / computed:
  real_count = count of applications WHERE primary_zip = zip AND role = role AND status != 'rejected'
  displayed_count = real_count + phantom_count
  displayed_remaining = total_cap - displayed_count

email_log
  id                  uuid PK
  application_id      uuid FK
  email_type          enum: confirmation | approved | rejected | waitlisted | abandonment_1 | abandonment_2
  sent_at             timestamptz
  provider_message_id text
  status              text (sent | bounced | failed)
```

---

## Data Flow

### Public Landing Page — Seat Counter

```
Browser → Next.js SSR (server component)
  → Supabase query: SELECT zip_seats + COUNT(applications)
  → Rendered HTML with current seat data

OR

Browser → Supabase Realtime subscription (client-side)
  → Supabase postgres_changes on applications table
  → Live counter update without page reload
```

**Decision:** Use SSR for initial render + Supabase Realtime for live updates. At Houston MVP scale, realtime subscriptions are low volume and fine.

---

### Multi-Step Application Form

```
Step 1 Submit:
  Browser → Server Action
    → Supabase upsert (applications, step_completed=1)
    → Returns application_id + session token (stored in localStorage)
    → Browser advances to Step 2

Step 2 Submit:
  Browser → Server Action
    → Supabase update (step_completed=2, business fields)
    → Browser advances to Step 3

Step 3 — Payment Intent Creation:
  Browser → POST /api/stripe/create-intent
    → Stripe API: create PaymentIntent (amount=10000, metadata: {application_id})
    → Returns client_secret to browser

Step 3 — Payment Confirmation:
  Browser → Stripe.js confirmPayment (client-side)
    → Stripe processes card
    → Stripe redirects to /apply/confirmation?payment_intent=[id]

Stripe Webhook (async, parallel):
  Stripe → POST /api/webhooks/stripe
    → Verify webhook signature
    → payment_intent.succeeded → Supabase update (status=submitted, paid_at, step_completed=3)
    → Invoke email Edge Function: send confirmation email
```

**Critical pattern:** Never trust the redirect URL alone to set payment status. The webhook is authoritative.

---

### Admin Application Review

```
Admin → /admin/applications (GET)
  → Supabase query: applications WHERE status IN [submitted|approved|...]
  → Rendered list with filters

Admin → Approve action:
  → Server Action { status: 'approved' }
    → Supabase Auth session check
    → Supabase update application.status
    → Edge Function: send approval email

Admin → ZIP seat cap edit:
  → Server Action { total_cap: N, phantom_count: M }
    → Supabase update zip_seats
    → Realtime event propagates to public landing page counters
```

---

### Email Flows

```
Trigger: payment_intent.succeeded webhook
  → Edge Function: send "confirmation" email via Resend → Log in email_log

Trigger: Admin sets status = 'approved'
  → Edge Function: send "approved" email → Log in email_log

Trigger: Admin sets status = 'rejected'
  → Edge Function: send "rejected" email → Log in email_log

Trigger: Admin sets status = 'waitlisted'
  → Edge Function: send "waitlisted" email → Log in email_log

Trigger: Scheduled cron (every 4h)
  → Edge Function: SELECT incomplete applications older than 2h
  → Check email_log for deduplication → Send abandonment emails
```

---

## Suggested Build Order (Dependency Chain)

```
1. DATABASE SCHEMA + RLS
   applications, zip_seats, email_log tables + RLS policies
   Seed Houston ZIP codes with initial seat caps

2. SUPABASE AUTH (Admin Only)
   Admin user, custom claim role='admin', Next.js middleware

3. PUBLIC LANDING PAGE (Static, No Form Yet)
   Dark/minimal design, full copy, seat checker widget, CTA

4. MULTI-STEP APPLICATION FORM (Steps 1 + 2, No Payment)
   Progressive save, localStorage session token

5. STRIPE INTEGRATION (Step 3 + Webhook)
   PaymentIntent creation, Payment Element, webhook handler

6. TRANSACTIONAL EMAIL
   Edge Function dispatcher, all email templates

7. ADMIN DASHBOARD — APPLICATION QUEUE
   List, detail, approve/reject/waitlist actions

8. ADMIN DASHBOARD — ZIP MANAGEMENT + HEAT MAP
   Seat cap editor, phantom fill, heat map visualization

9. ABANDONMENT FLOWS
   Scheduled cron, abandonment email templates

10. ADMIN ANALYTICS
    Funnel metrics, revenue, demand density
```

---

## Sources

**Confidence: HIGH** — well-established patterns in the Next.js/Supabase/Stripe ecosystem
- Next.js App Router: server actions, middleware, route handlers
- Supabase: RLS, Realtime, Edge Functions, Auth custom claims
- Stripe: PaymentIntent server-side creation, client-side confirmation, webhook verification
