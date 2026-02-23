---
phase: 05-admin-application-queue-email-infrastructure
plan: 01
subsystem: email
tags: [resend, react-email, shadcn, tanstack-table, supabase, stripe, email-templates, postgres]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase schema (applications, email_log tables), Stripe webhook handler, env validation chain
  - phase: 03-application-form
    provides: reservation API routes (start, business) that receive step timestamp fields
provides:
  - Resend SDK singleton (src/lib/resend.ts)
  - sendEmail helper with idempotency + audit logging (src/lib/email.ts)
  - 5 branded React Email templates for all application status transitions
  - Stripe webhook sends confirmation email on payment_intent.succeeded
  - application_status_history table for admin audit trail
  - step completion timestamps on applications table
  - shadcn/ui component library (sheet, alert-dialog, badge, button, tabs, input, select, textarea, table)
  - TanStack Table v8 for admin queue data grid
affects:
  - 05-02-admin-queue (uses email templates, shadcn/ui, sendEmail for approval/rejection/waitlist actions)

# Tech tracking
tech-stack:
  added:
    - resend@6.9.2 (transactional email SDK)
    - "@react-email/components@1.0.8" (email template primitives)
    - react-email@latest (dev, email preview server)
    - "@tanstack/react-table@8.21.3" (headless data grid for admin queue)
    - shadcn/ui (Radix-based component library, Tailwind v4 compatible)
  patterns:
    - Email idempotency via Resend idempotency keys keyed as "emailType/applicationId"
    - Email de-duplication via email_log lookup before send
    - Non-throwing email sends — failures logged but never propagate to callers
    - Inline styles only in email templates (email client compatibility)
    - Status history INSERT alongside every application status transition
    - Step completion timestamps set at each form step and webhook completion

key-files:
  created:
    - src/lib/resend.ts
    - src/lib/email.ts
    - src/components/emails/ConfirmationEmail.tsx
    - src/components/emails/ApprovalEmail.tsx
    - src/components/emails/RejectionEmail.tsx
    - src/components/emails/WaitlistEmail.tsx
    - src/components/emails/WaitlistApprovedEmail.tsx
    - supabase/migrations/003_status_history_and_step_timestamps.sql
    - components.json
    - src/lib/utils.ts
    - src/components/ui/sheet.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/button.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/input.tsx
    - src/components/ui/select.tsx
    - src/components/ui/textarea.tsx
    - src/components/ui/table.tsx
  modified:
    - src/env.ts (added RESEND_API_KEY to server schema and runtimeEnv)
    - src/app/api/webhooks/stripe/route.ts (email send, status history, step3 timestamp)
    - src/app/api/reservation/start/route.ts (step1_completed_at)
    - src/app/api/reservation/business/route.ts (step2_completed_at)
    - .env.local.example (RESEND_API_KEY placeholder)
    - src/app/globals.css (shadcn CSS variables added by init)
    - package.json / package-lock.json

key-decisions:
  - "sendEmail never throws — all email errors are caught and logged, preventing email failures from crashing webhooks or server actions"
  - "Idempotency key format: emailType/applicationId — prevents duplicate sends on webhook retries"
  - "waitlist_approved skips de-duplication check — it is a distinct seat-opened event that can legitimately repeat"
  - "Email domain placeholders used (team@yourdomain.com) — user must configure real domain in Resend before going live"
  - "DB migration applied via direct Supabase host (db.PROJECT.supabase.co:5432) — DIRECT_URL in .env.local points to pooler, not the true direct connection"

patterns-established:
  - "Email pattern: sendEmail(params) -> check dedup -> get template config -> resend.emails.send with idempotency key -> insert email_log"
  - "Status transition pattern: update status + insert application_status_history in same webhook/server action"
  - "React Email templates: no directives (no use client/server), inline styles only, PreviewProps for development preview"

requirements-completed: [EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05]

# Metrics
duration: 42min
completed: 2026-02-23
---

# Phase 5 Plan 01: Dependencies, Email Infrastructure & Templates Summary

**Resend email pipeline with 5 branded React Email templates, idempotency+audit helpers, shadcn/ui component library, and Stripe webhook confirmation trigger**

## Performance

- **Duration:** 42 min
- **Started:** 2026-02-23T16:39:28Z
- **Completed:** 2026-02-23T17:22:15Z
- **Tasks:** 2 of 2
- **Files modified:** 20

## Accomplishments
- Installed all Phase 5 dependencies: Resend, React Email, TanStack Table v8, shadcn/ui with 9 components
- Applied DB migration 003: `application_status_history` table (RLS, admin-only policies) + `outreach_notes`/step timestamp columns on `applications`
- Built 5 fully branded React Email templates with inline styles matching MVR light theme
- Created `sendEmail` helper with idempotency keys, email_log audit, de-duplication, and non-throwing error handling
- Wired confirmation email into Stripe webhook (`payment_intent.succeeded`) alongside status history insert
- Added step completion timestamps to all 3 form stages (start, business, webhook)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, init shadcn/ui, apply DB migration, create Resend singleton** - `b31400e` (feat)
2. **Task 2: Build email templates, sendEmail helper, wire confirmation into webhook** - `1a0aaa9` (feat)

## Files Created/Modified

- `src/lib/resend.ts` - Resend SDK singleton
- `src/lib/email.ts` - sendEmail helper with idempotency + email_log audit
- `src/components/emails/ConfirmationEmail.tsx` - Payment confirmation email template
- `src/components/emails/ApprovalEmail.tsx` - Application approved email template
- `src/components/emails/RejectionEmail.tsx` - Application rejected email template (generic reason, $100 refund timeline)
- `src/components/emails/WaitlistEmail.tsx` - Waitlisted email with personal, founder-driven tone
- `src/components/emails/WaitlistApprovedEmail.tsx` - Distinct seat-opened template for waitlist->approved transitions
- `src/env.ts` - Added RESEND_API_KEY to server validation and runtimeEnv
- `src/app/api/webhooks/stripe/route.ts` - Added sendEmail call, status history insert, step3 timestamp
- `src/app/api/reservation/start/route.ts` - Added step1_completed_at on INSERT
- `src/app/api/reservation/business/route.ts` - Added step2_completed_at on UPDATE
- `supabase/migrations/003_status_history_and_step_timestamps.sql` - DB migration
- `components.json` + 9 shadcn/ui component files in `src/components/ui/`
- `.env.local.example` - Updated with RESEND_API_KEY entry

## Decisions Made

- `sendEmail` is non-throwing by design — email failures log but never crash callers (critical for webhook reliability)
- Idempotency key format: `emailType/applicationId` — prevents Resend duplicate sends on webhook retries
- `waitlist_approved` bypasses de-duplication check — it's a distinct event that can legitimately fire again
- Email domain uses placeholder `team@yourdomain.com` — requires real Resend domain configuration before go-live
- DIRECT_URL in `.env.local` points to pooler (port 5432 on pooler host), not the true Supabase direct host. Migration applied via `db.PROJECT_REF.supabase.co:5432` with postgres user instead

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] DIRECT_URL pointed to pooler, not direct DB connection**
- **Found during:** Task 1 (DB migration step)
- **Issue:** The DIRECT_URL in `.env.local` used `aws-0-us-east-2.pooler.supabase.com:5432` (pooler session mode) instead of the true direct host `db.vklusufatocafamhrtoc.supabase.co:5432`. All direct Postgres connections via the pooler URL returned "Tenant or user not found".
- **Fix:** Created a temporary Node.js migration script that tried multiple connection formats. Discovered the true direct host (`db.PROJECT_REF.supabase.co`) accepts the postgres user directly. Migration applied successfully via that host. Script deleted after use.
- **Files modified:** supabase/migrations/003_status_history_and_step_timestamps.sql (created), scripts/apply-migration-003.mjs (created and deleted)
- **Verification:** REST API confirmed `application_status_history` table exists and `outreach_notes` column accessible
- **Committed in:** b31400e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** No scope creep. Migration was required for the plan and applied correctly — just via a different connection path than specified.

## Issues Encountered

- `npx shadcn@latest` command failed with "command not found" in the non-interactive shell environment. Used `node node_modules/.bin/shadcn` instead — worked identically.
- `npm run typecheck` and `npm run build` required using local binaries (`node node_modules/.bin/tsc` and `node node_modules/.bin/next`) due to PATH restrictions in the execution environment.

## User Setup Required

**Resend requires manual configuration before emails will actually deliver:**

1. **Add API key to `.env.local`:** Replace `re_placeholder_configure_before_use` with a real Resend API key from Resend Dashboard > API Keys > Create API Key
2. **Configure sending domain:** Resend Dashboard > Domains > Add Domain > follow DNS setup wizard (SPF TXT + DKIM TXT + MX records)
3. **Add DMARC record (recommended):** `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` at your DNS provider
4. **Update sender address:** In `src/lib/email.ts`, replace `team@yourdomain.com` and `support@yourdomain.com` with your verified Resend domain addresses
5. **Verify DNS propagation:** Click "Verify DNS Records" in Resend Dashboard after DNS changes (up to 72h)

## Next Phase Readiness

- Plan 02 (admin queue UI) can begin immediately — all email templates, shadcn/ui components, and TanStack Table are installed
- `sendEmail` is ready for approval/rejection/waitlist actions in the admin queue
- `application_status_history` table ready for audit trail writes from admin actions
- Email delivery will NOT work until the user completes Resend setup above

---
*Phase: 05-admin-application-queue-email-infrastructure*
*Completed: 2026-02-23*
