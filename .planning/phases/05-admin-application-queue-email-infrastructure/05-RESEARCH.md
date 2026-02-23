# Phase 5: Admin Application Queue + Email Infrastructure - Research

**Researched:** 2026-02-23
**Domain:** Next.js 15 admin UI (data table + slide-out panel + confirmation dialogs), Resend transactional email, React Email templates, SPF/DKIM/DMARC domain auth, Supabase Server Actions with role-gated mutations, status history audit log schema
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Queue layout & filtering:**
- Data table layout (sortable columns, dense rows) — not cards or kanban
- Full detail columns: name, email, phone, role, ZIP, status, payment status, step reached, submitted date (9 columns)
- Default sort: newest first (most recently submitted at top)
- Search bar above table — searches across name and email fields
- Status count badges on each filter (e.g., "Submitted (12)", "Approved (5)")
- 25 applications per page with pagination
- Clicking a row opens a slide-out panel from the right (table stays visible behind it)

**Application detail & actions:**
- Action buttons: Approve, Reject, Waitlist — all require confirmation dialog before executing
- Rejection requires a mandatory reason from admin (creates audit trail) — reason stays internal, not sent in rejection email
- Full status flexibility — admin can move applications between any status at any time (e.g., rejected → waitlisted, waitlisted → approved)
- Full audit trail in the slide-out panel — chronological timeline showing all status changes with which admin made them and when
- ZIP code shown with live seat availability context (e.g., "ZIP 77007 — 2 of 5 Agent seats remaining")
- Partial applications appear in a separate tab/filter — not mixed with submitted applications

**Email content & branding:**
- Tone: Professional and warm — polished but human
- Design: Branded HTML template with MVR brand colors, styled sections, visual hierarchy (React Email)
- Sending domain: TBD (placeholder — will be configured during setup, likely team@[mvr-domain])
- Reply-to: Monitored email address — each email includes "Questions? Just reply to this email."
- No unsubscribe link — all emails are one-time transactional
- Confirmation email (after payment): name, role, ZIP, amount paid, plus clear next steps. Does NOT include business profile answers.
- Approval email: "You've secured your founding seat!" with onboarding next steps
- Rejection email: Generic reason, confirms $100 refund with 5-10 business day timeline
- Waitlist email: Personal, founder-driven tone — make applicant feel founders are actively reviewing. $100 held as deposit.
- Waitlist → Approved email: Special "seat opened" template distinct from regular approval
- Re-notification policy: Claude's discretion on whether status changes after initial decision trigger new emails

**Partial application handling:**
- Separate tab/filter in admin queue — not mixed with submitted applications
- Admin can add internal outreach notes (e.g., "Called on 2/23, said they'd complete this week")
- Show timestamps (started date, last activity date) — not relative "time ago" format

### Claude's Discretion

- Filtering UI pattern (tab bar for status vs all dropdowns vs hybrid)
- Action button placement (panel only vs panel + row)
- Slide-out panel information organization (sections vs flat list)
- Email re-notification policy on status changes after initial decision
- Exact email template design within branded constraint

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-02 | Admin can view application queue with status filters | TanStack Table v8 with manual server-side pagination + Supabase query with status filter; count badges via separate aggregation query |
| ADMIN-03 | Admin can view individual application detail (all fields + payment status) | shadcn/ui Sheet component for slide-out panel; all fields exist in live `applications` table confirmed via DB introspection |
| ADMIN-04 | Admin can approve, reject, or waitlist an application (triggers email) | Next.js Server Action with `supabaseAdmin` update + Resend `resend.emails.send()` with idempotency key; revalidatePath clears table cache; new `application_status_history` migration needed |
| ADMIN-05 | Admin can see partial applications with contact info + step reached | `step_completed < 3 AND status = 'draft'` filter on `applications` table; needs new `outreach_notes` column migration for admin notes |
| EMAIL-01 | Automated "application received" email on payment success | Resend SDK called from Stripe webhook handler (`/api/webhooks/stripe`) on `payment_intent.succeeded`; idempotency key = `confirmation/{applicationId}` |
| EMAIL-02 | Automated "approved" email when admin approves | Resend SDK called from Server Action; idempotency key = `approved/{applicationId}` |
| EMAIL-03 | Automated "rejected" email when admin rejects | Resend SDK called from Server Action; idempotency key = `rejected/{applicationId}` |
| EMAIL-04 | Automated "waitlisted" email when admin waitlists | Resend SDK called from Server Action; idempotency key = `waitlisted/{applicationId}` |
| EMAIL-05 | SPF/DKIM/DMARC configured for sending domain | Resend Dashboard → Domains → Add domain → Add SPF TXT + DKIM TXT + MX records; DMARC is optional but recommended; covered in Resend setup wizard |
</phase_requirements>

---

## Summary

Phase 5 has two distinct work streams that share one database: (1) the admin UI — a data table with slide-out panel, confirmation dialogs, and Server Actions for status mutations — and (2) the email infrastructure — Resend SDK integration, React Email templates, and sending domain DNS setup. Both streams are straightforward to implement with the existing stack.

The live database schema (confirmed via DB introspection) has all required columns on `applications` for the admin queue display. Two new pieces of schema are needed: an `application_status_history` table for the audit trail (the CONTEXT requires a chronological timeline per application), and an `outreach_notes` column on `applications` for admin notes on partial applications. These are the only DDL changes required.

For the UI, TanStack Table v8 (`@tanstack/react-table`) is the correct headless table primitive. Combined with shadcn/ui `Sheet` for the slide-out panel and shadcn/ui `AlertDialog` for confirmation dialogs, the full admin queue UI can be built without additional component libraries. shadcn/ui components are copied into the project as source files (not an npm dependency) — installation is via `npx shadcn@latest init` + `npx shadcn@latest add sheet alert-dialog`.

For email, Resend + React Email is the project's specified stack. The `resend` npm package is not yet installed in this project (confirmed via `package.json`). React Email 4.0 (released March 2025) is the current version. The idempotency key support (released May 2025) is critical for preventing duplicate emails in webhook retry scenarios. The sending domain setup is a one-time Resend dashboard task that requires adding SPF TXT + DKIM TXT + MX records to the DNS provider — Resend's wizard guides this.

**Primary recommendation:** Add two DB migrations → install Resend + shadcn init → build admin queue page with TanStack Table → build slide-out Sheet with Server Actions → build 5 React Email templates → wire email sends in webhook + Server Actions → configure sending domain.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.21.3 (latest) | Headless data table: sorting, pagination state, column definitions | Headless — no imposed styles; works with any UI; used in official shadcn/ui table example; React 19 compatible |
| resend | ^4.x (latest) | Sending transactional emails via Resend API | Project's specified provider; cleanest DX; idempotency keys supported since May 2025 |
| @react-email/components | ^0.0.x (latest, pin with -E) | Email template primitive components (Html, Head, Body, Container, Section, Text, Button, etc.) | Official React Email component set; React 19 compatible |
| react-email | ^4.x (latest) | Local email preview dev server | `email preview` CLI; live reload; spam score; compatibility checker |
| shadcn/ui (Sheet) | Copy-pasted via CLI | Slide-out panel (Sheet) from the right — table stays visible | Radix UI `Dialog` underneath; focus trap, keyboard nav, accessible; Tailwind-styled in project colors |
| shadcn/ui (AlertDialog) | Copy-pasted via CLI | Confirmation dialog before approve/reject/waitlist | Radix UI `AlertDialog`; non-dismissible — must choose confirm/cancel; correct semantic for destructive actions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (Badge) | Copy-pasted via CLI | Status badges (Submitted, Approved, etc.) | Status column in table + count badges on filter tabs |
| shadcn/ui (Button) | Copy-pasted via CLI | Approve/Reject/Waitlist action buttons | Panel action area |
| shadcn/ui (Tabs) | Copy-pasted via CLI | Submitted / Partial / All tabs above table | Filter tab bar with count badges |
| shadcn/ui (Input) | Copy-pasted via CLI | Search bar above table | Searches name + email |
| shadcn/ui (Select) | Copy-pasted via CLI | Role filter dropdown | Role-based filtering |
| shadcn/ui (Textarea) | Copy-pasted via CLI | Rejection reason input in confirmation dialog + outreach notes on partials | Required for CONTEXT locked decisions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-table (headless) | shadcn/ui DataTable (uses TanStack internally) | shadcn DataTable IS TanStack table — same library, just pre-scaffolded. Either works; starting with bare TanStack gives more control |
| Resend | SendGrid, Postmark, AWS SES | Resend is specified in CLAUDE.md; best DX + React Email native integration |
| React Email components | MJML, raw HTML with inline styles | React Email is the modern approach; TypeScript, JSX, component model, preview server |
| Separate `application_status_history` table | JSONB array on `applications.status_history` | Separate table is correct for structured, queryable data with foreign key to `auth.users` for `changed_by` admin |
| shadcn/ui Sheet | Custom div with CSS transition | shadcn Sheet handles focus trap, portal, scroll lock, keyboard dismiss — do not hand-roll |
| shadcn/ui AlertDialog | browser `confirm()` or custom modal | AlertDialog is accessible; can embed form fields (rejection reason textarea) |

**Installation:**
```bash
# Email
npm install resend @react-email/components -E
npm install react-email --save-dev -E

# shadcn/ui (init + components)
npx shadcn@latest init
npx shadcn@latest add sheet alert-dialog badge button tabs input select textarea

# Table
npm install @tanstack/react-table
```

**Note on React 19 + npm peer deps:** shadcn/ui has full React 19 support as of the `latest` release. If npm shows ERESOLVE errors during `shadcn add`, use `--legacy-peer-deps`. The project already uses React 19.2.3 and Tailwind v4.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── admin/
│       └── (dashboard)/
│           ├── applications/
│           │   ├── page.tsx              # Server Component: fetches initial page, passes to client table
│           │   ├── columns.tsx           # "use client": ColumnDef[] for TanStack Table
│           │   ├── data-table.tsx        # "use client": TanStack table + Sheet panel + filters
│           │   ├── application-panel.tsx # "use client": slide-out Sheet content
│           │   └── actions.ts            # "use server": updateStatus(), addOutreachNote()
│           └── page.tsx                  # Existing dashboard stub
├── components/
│   └── emails/
│       ├── ConfirmationEmail.tsx         # After payment
│       ├── ApprovalEmail.tsx             # Admin approves
│       ├── RejectionEmail.tsx            # Admin rejects
│       ├── WaitlistEmail.tsx             # Admin waitlists
│       └── WaitlistApprovedEmail.tsx     # Waitlisted → Approved (seat opened)
├── lib/
│   ├── resend.ts                         # Resend singleton (server-only)
│   └── email.ts                          # sendEmail() helper wrapping Resend with email_log insert
└── emails/                               # React Email preview entry (for `email dev`)
    └── index.tsx                         # Exports all templates for preview
```

### Pattern 1: Server Component → Client Table (Next.js 15 App Router)

**What:** Page Server Component fetches initial data + counts, passes as props to a Client Component table. Subsequent interactions (filter changes, pagination, search) use URL search params and router.push — triggering RSC re-render which re-fetches data.

**Why not client-side fetch:** Admin data contains PII. Keeping the data fetch in the Server Component means no client-side API route needed for the table data — the authenticated Server Component query is the fetch.

**When to use:** Any admin list view with pagination.

```typescript
// src/app/admin/(dashboard)/applications/page.tsx
// Source: Next.js official docs — Server Component data fetching pattern
import { createClient } from '@/lib/supabase/server'
import { ApplicationsDataTable } from './data-table'

interface Props {
  searchParams: Promise<{
    status?: string
    page?: string
    search?: string
    role?: string
  }>
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams  // Next.js 15: searchParams is a Promise
  const supabase = await createClient()

  const page = Number(params.page ?? 1)
  const pageSize = 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Status filter: "partial" = step_completed < 3 AND status = 'draft'
  if (params.status === 'partial') {
    query = query.lt('step_completed', 3).eq('status', 'draft')
  } else if (params.status) {
    query = query.eq('status', params.status).gte('step_completed', 3)
  } else {
    // Default: exclude drafts/partials from main view
    query = query.neq('status', 'draft')
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  if (params.role) {
    query = query.eq('role', params.role)
  }

  const { data: applications, count } = await query

  // Separate count query for status badges
  const { data: counts } = await supabase
    .rpc('get_application_status_counts')  // or inline SQL via .from().select()

  return (
    <ApplicationsDataTable
      data={applications ?? []}
      totalCount={count ?? 0}
      page={page}
      pageSize={pageSize}
      statusCounts={counts}
    />
  )
}
```

**CRITICAL for Next.js 15:** `searchParams` in page components is a **Promise** and must be awaited. This changed in Next.js 15.

### Pattern 2: TanStack Table v8 with Manual Pagination

**What:** Table renders data passed from the Server Component. Pagination triggers URL param changes → RSC re-renders with new data.

```typescript
// src/app/admin/(dashboard)/applications/data-table.tsx
// Source: TanStack Table v8 docs — manual pagination (manualPagination: true)
'use client'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  totalCount: number
  page: number
  pageSize: number
}

export function DataTable<TData>({
  columns, data, totalCount, page, pageSize
}: DataTableProps<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,   // CRITICAL: tells table not to paginate client-side
    rowCount: totalCount,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function'
        ? updater({ pageIndex: page - 1, pageSize })
        : updater
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(newState.pageIndex + 1))
      router.push(`${pathname}?${params.toString()}`)
    },
  })

  // ... render table rows + pagination controls
}
```

### Pattern 3: shadcn/ui Sheet (Slide-Out Panel)

**What:** Clicking a table row opens a Sheet from the right. Table remains visible behind it (Sheet uses a semi-transparent overlay, not full-screen modal).

```typescript
// src/app/admin/(dashboard)/applications/data-table.tsx (extended)
'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApplicationPanel } from './application-panel'

// In DataTable component:
const [selectedApp, setSelectedApp] = useState<Application | null>(null)

// Table row onClick:
<TableRow
  key={row.id}
  onClick={() => setSelectedApp(row.original)}
  className="cursor-pointer hover:bg-gray-800/50"
>

<Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
  <SheetContent side="right" className="w-[600px] sm:w-[700px] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{selectedApp?.name}</SheetTitle>
    </SheetHeader>
    {selectedApp && <ApplicationPanel application={selectedApp} />}
  </SheetContent>
</Sheet>
```

### Pattern 4: Server Action for Status Update + Email + Audit Log

**What:** Server Action validates admin role from `app_metadata`, updates `applications.status`, inserts into `application_status_history`, sends email via Resend with idempotency key, logs to `email_log`, calls `revalidatePath`.

**Security:** Server Action verifies admin role from `app_metadata.role` using `supabase.auth.getUser()` — same pattern as middleware. Only `approver` role can mutate status. `viewer` role can read but not act.

```typescript
// src/app/admin/(dashboard)/applications/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const updateStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'waitlisted', 'submitted']),
  reason: z.string().optional(),  // mandatory for rejection
})

export async function updateApplicationStatus(
  input: z.infer<typeof updateStatusSchema>
) {
  // 1. Verify caller is an approver
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role as string
  if (role !== 'approver') {
    return { error: 'Unauthorized' }
  }

  const parsed = updateStatusSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { applicationId, status, reason } = parsed.data

  // 2. Fetch application for email data
  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('name, email, role, primary_zip, status')
    .eq('id', applicationId)
    .single()

  if (!app) return { error: 'Application not found' }

  // 3. Update application status
  const { error: updateError } = await supabaseAdmin
    .from('applications')
    .update({
      status,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
      ...(reason && { admin_notes: reason }),  // internal only
    })
    .eq('id', applicationId)

  if (updateError) return { error: 'Update failed' }

  // 4. Insert status history record
  await supabaseAdmin
    .from('application_status_history')
    .insert({
      application_id: applicationId,
      from_status: app.status,
      to_status: status,
      changed_by: user!.id,
      reason: reason ?? null,
    })

  // 5. Send email
  await sendEmail({
    applicationId,
    emailType: status,  // maps to template selector
    application: app,
  })

  // 6. Revalidate admin queue
  revalidatePath('/admin/applications')

  return { success: true }
}
```

### Pattern 5: Resend Email Sending with Idempotency + email_log

**What:** A `sendEmail()` helper wraps the Resend SDK call and logs the result to `email_log`. Idempotency key prevents duplicate sends on retries.

```typescript
// src/lib/email.ts
import { resend } from './resend'
import { supabaseAdmin } from './supabase/admin'
import { render } from '@react-email/components'
import { ConfirmationEmail } from '@/components/emails/ConfirmationEmail'
import { ApprovalEmail } from '@/components/emails/ApprovalEmail'
// ... other templates

type EmailType = 'confirmation' | 'approved' | 'rejected' | 'waitlisted' | 'waitlist_approved'

export async function sendEmail({
  applicationId,
  emailType,
  application,
}: {
  applicationId: string
  emailType: EmailType
  application: { name: string; email: string; role: string; primary_zip: string }
}) {
  const { template, subject } = resolveTemplate(emailType, application)

  const { data, error } = await resend.emails.send(
    {
      from: 'MVR Team <team@[mvr-domain]>',
      to: [application.email],
      replyTo: 'support@[mvr-domain]',
      subject,
      react: template,
    },
    {
      idempotencyKey: `${emailType}/${applicationId}`,  // prevents duplicate send on retry
    }
  )

  // Log to email_log regardless of error (for audit)
  await supabaseAdmin
    .from('email_log')
    .insert({
      application_id: applicationId,
      email_type: emailType,
      provider_message_id: data?.id ?? null,
      status: error ? 'failed' : 'sent',
    })

  if (error) {
    console.error(`Email send failed [${emailType}/${applicationId}]:`, error)
  }

  return { data, error }
}
```

### Pattern 6: React Email Template Structure

**What:** Branded HTML email using React Email components. All styles must be inline (email client limitation). Use `@react-email/components` — do not use Tailwind in email templates (not all clients support it; inline styles are the standard).

```typescript
// src/components/emails/ConfirmationEmail.tsx
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr
} from '@react-email/components'

interface Props {
  name: string
  role: string
  zip: string
  amountPaid: string
}

export function ConfirmationEmail({ name, role, zip, amountPaid }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f2f3f5', fontFamily: 'Inter, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px' }}>
            <Heading style={{ color: '#222222', fontSize: '24px' }}>
              Application Received
            </Heading>
            <Text style={{ color: '#444444' }}>
              Hi {name}, we've received your founding seat application for the {role} role in ZIP {zip}.
            </Text>
            <Text style={{ color: '#444444' }}>
              Your $100 activation credit of {amountPaid} has been received and will be applied to your first live month.
            </Text>
            {/* next steps section */}
            <Hr />
            <Text style={{ color: '#888888', fontSize: '14px' }}>
              Questions? Just reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

### Pattern 7: AlertDialog for Confirmation + Rejection Reason

**What:** Approval and waitlisting use a simple confirm/cancel dialog. Rejection additionally requires a textarea for the mandatory reason.

```typescript
// Inside ApplicationPanel
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

// Rejection dialog with reason field:
const [rejectionReason, setRejectionReason] = useState('')
const [pending, startTransition] = useTransition()

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Reject</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Reject this application?</AlertDialogTitle>
      <AlertDialogDescription>
        This will send a rejection email. Provide an internal reason (not shown to applicant).
      </AlertDialogDescription>
    </AlertDialogHeader>
    <Textarea
      placeholder="Internal reason (required)"
      value={rejectionReason}
      onChange={(e) => setRejectionReason(e.target.value)}
    />
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={!rejectionReason.trim() || pending}
        onClick={() => startTransition(async () => {
          await updateApplicationStatus({
            applicationId: application.id,
            status: 'rejected',
            reason: rejectionReason,
          })
        })}
      >
        {pending ? 'Rejecting...' : 'Confirm Rejection'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Anti-Patterns to Avoid

- **Using `getSession()` in Server Actions:** Always `getUser()`. The pattern is already established in middleware — carry it into actions.ts.
- **Calling Resend from a Client Component:** Resend uses a secret API key. All email sends must be server-side (Server Action, Route Handler, or webhook handler).
- **Using Tailwind classes in React Email templates:** Email clients strip CSS. Use inline styles in email components only. The landing page components use Tailwind; email components do NOT.
- **Storing rejection reason in the rejection email:** The locked decision is that the admin reason is internal only — never expose it in the email sent to the applicant.
- **Not using idempotency keys on email sends:** Stripe webhooks retry on failure. Without idempotency keys, a confirmation email could be sent 3+ times if the webhook handler is slow. The key format `{emailType}/{applicationId}` is the correct pattern.
- **Using `revalidatePath` inside the email.ts helper:** `revalidatePath` should only be called from the Server Action layer, not from utility functions.
- **Querying `applications` without role check in Server Actions:** Even though RLS enforces this at the DB level, always verify the admin role explicitly in Server Actions before any mutation — defense in depth.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-out panel | Custom div with CSS transition + z-index | shadcn/ui `Sheet` (Radix Dialog) | Focus trap, portal rendering, keyboard dismiss, scroll lock — 6+ edge cases in custom implementations |
| Confirmation dialog | `window.confirm()` or custom modal | shadcn/ui `AlertDialog` | Non-dismissible semantic (unlike Dialog), correct ARIA role, can embed form fields for rejection reason |
| Data table | Custom `<table>` with useState sorting | `@tanstack/react-table` | Sorting, pagination state, column visibility, row selection — headless, no styles imposed |
| Email HTML | Raw HTML strings with inline styles | React Email components (`@react-email/components`) | Cross-client compatibility handled; components tested against Gmail, Outlook, Apple Mail |
| Email delivery | Direct SMTP | Resend SDK | SPF/DKIM handled, bounce processing, delivery tracking, local preview server |
| Duplicate email prevention | Custom `email_log` lookup before send | Resend idempotency keys + `email_log` insert | Idempotency key is the source of truth for deduplication; `email_log` is for audit only |
| Status history | JSONB array on `applications` | Separate `application_status_history` table | Foreign key to `auth.users` for `changed_by`; indexed for timeline queries; clean schema |

---

## Database Schema Changes Required

Two schema additions are needed for Phase 5. These are the ONLY DDL changes.

### Migration 1: `application_status_history` table

Required for the CONTEXT-locked "full audit trail — chronological timeline showing all status changes with which admin made them and when."

```sql
-- 003_status_history_outreach_notes.sql
CREATE TABLE application_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status     application_status,   -- NULL for first status record (created)
  to_status       application_status NOT NULL,
  changed_by      uuid,                 -- auth.users.id — NULL for system changes (webhook)
  reason          text,                 -- admin's internal reason (rejection note, etc.)
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_status_history_application_id
  ON application_status_history(application_id);

ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_history_admin_read"
  ON application_status_history
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));

CREATE POLICY "status_history_admin_insert"
  ON application_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt())->'app_metadata'->>'role' = 'approver');
```

### Migration 2: `outreach_notes` column + step timestamps on `applications`

Required for: admin notes on partial applications (CONTEXT locked), and per-step timestamps for FORM-07 (abandonment analytics).

```sql
-- Also in 003_status_history_outreach_notes.sql
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS outreach_notes text,           -- admin-only notes on partials
  ADD COLUMN IF NOT EXISTS step1_completed_at timestamptz, -- when Step 1 was submitted
  ADD COLUMN IF NOT EXISTS step2_completed_at timestamptz, -- when Step 2 was submitted
  ADD COLUMN IF NOT EXISTS step3_completed_at timestamptz; -- when payment completed (= paid_at)
```

**Note on `outreach_notes` RLS:** No new RLS policy needed — `applications_admin_read` already covers SELECT by approver/viewer, and `applications_approver_update` covers UPDATE by approver. The existing policies handle both columns.

**Note on `buys_online_leads` schema drift:** The live DB has `buys_online_leads` as `text` but Prisma schema declares it as `Boolean?`. This is pre-existing schema drift from Phase 3 implementation. Do NOT fix in Phase 5 — out of scope.

---

## Common Pitfalls

### Pitfall 1: Next.js 15 `searchParams` is a Promise

**What goes wrong:** TypeScript error `searchParams.status` — Property 'status' does not exist on type `Promise<...>`.
**Why it happens:** Next.js 15 changed `searchParams` (and `params`) in page components to be Promises, not plain objects.
**How to avoid:** Always `const params = await searchParams` before accessing any property.
**Warning signs:** TypeScript error on destructuring page props directly.

### Pitfall 2: Resend idempotency keys expire after 24 hours

**What goes wrong:** A webhook retry more than 24 hours after the original succeeds sends a duplicate email.
**Why it happens:** Resend idempotency keys only deduplicate within a 24-hour window.
**How to avoid:** For Phase 5, this is acceptable — Stripe webhooks retry within hours, not days. Additionally, check `email_log` before calling Resend if belt-and-suspenders protection is needed.
**Warning signs:** Applicant reports receiving the same email twice days apart.

### Pitfall 3: shadcn/ui Sheet z-index conflicts with existing admin layout

**What goes wrong:** The Sheet panel renders behind the header or other fixed elements.
**Why it happens:** Sheet uses a Radix portal at the document body level — z-index of the Sheet overlay may conflict with existing `z-*` classes in the admin layout.
**How to avoid:** Check the admin layout `header`'s z-index class (currently not set). If conflicts appear, add explicit z-index coordination.
**Warning signs:** Header renders on top of the Sheet overlay.

### Pitfall 4: React Email template bundling with `"use server"` Server Actions

**What goes wrong:** Build error: "You're importing a component that needs `useState`" or similar — React Email components use JSX but are not React components in the traditional sense.
**Why it happens:** Some `@react-email/components` primitives include client-side preview code that conflicts with server-only bundling.
**How to avoid:** Keep email template files in `src/components/emails/` as plain TSX files with no `"use client"` or `"use server"` directive. Import them only into server-side code (Server Actions, Route Handlers). Use `render()` from `@react-email/components` to produce HTML strings if needed.
**Warning signs:** Build errors referencing specific React Email component files.

### Pitfall 5: TanStack Table Row Click vs Sheet — double-click on action buttons

**What goes wrong:** Clicking an action button (Approve) inside the Sheet triggers the row onClick handler AND the button action.
**Why it happens:** The Sheet is rendered outside the table in the DOM (Radix portal), so event bubbling doesn't go through table rows. This is not actually a problem — but inline action buttons added to table rows (if Claude's discretion allows) would bubble.
**How to avoid:** Put action buttons only in the Sheet panel, not in table rows. Use `e.stopPropagation()` on any inline row-level controls if added.
**Warning signs:** Clicking "Approve" in the panel closes the panel and selects a different row.

### Pitfall 6: Email sending in the Stripe webhook blocking response

**What goes wrong:** Stripe times out the webhook (30s limit) if email sending takes too long or fails.
**Why it happens:** Resend API calls are synchronous in the webhook handler — a slow email send delays the webhook 200 response.
**How to avoid:** Fire email sends with `await` but do not let email failures propagate to throw — wrap in try/catch, log the error, and return 200 to Stripe regardless. The `email_log` table captures failures for retry investigation.
**Warning signs:** Stripe dashboard shows webhook timeout errors; applications confirmed in DB but no confirmation email received.

### Pitfall 7: `supabaseAdmin` INSERT to `application_status_history` bypasses RLS

**What goes wrong:** Server Actions that use `supabaseAdmin` (service role) bypass RLS entirely — including the INSERT policy just created for status history. This is correct behavior for the webhook but should be explicit in Server Actions.
**Why it happens:** `supabaseAdmin` uses the service role key which bypasses all RLS.
**How to avoid:** Server Actions should use `supabaseAdmin` only after verifying the admin role explicitly in code (already done in Pattern 4 above). This is by design — the service role bypass is intentional for admin mutations.
**Warning signs:** None — this is expected behavior. Just ensure the role check is always present in Server Actions.

---

## Code Examples

Verified patterns from live DB inspection and official sources:

### Status Count Query (for status badge counts on tab filters)

```sql
-- Source: live DB confirmed — application_status enum: draft, submitted, approved, rejected, waitlisted
-- Run as a separate Supabase query for the count badges
SELECT status, COUNT(*) as count
FROM applications
WHERE status != 'draft'   -- exclude drafts that haven't paid
GROUP BY status;

-- For partial count (separate tab):
SELECT COUNT(*) as count
FROM applications
WHERE step_completed < 3 AND status = 'draft';
```

Can be implemented as a Supabase RPC function or inline with two separate queries in the Server Component.

### Resend SDK Singleton

```typescript
// src/lib/resend.ts
// Source: resend.com/docs/send-with-nextjs (official)
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
```

Add `RESEND_API_KEY` to `src/env.ts`:
```typescript
// In server section:
RESEND_API_KEY: z.string().min(1),
```

### Resend Send with Idempotency Key

```typescript
// Source: resend.com/blog/engineering-idempotency-keys (official, verified)
const { data, error } = await resend.emails.send(
  {
    from: 'MVR Team <team@yourdomain.com>',
    to: [applicantEmail],
    subject: 'Your founding seat application has been received',
    react: ConfirmationEmail({ name, role, zip, amountPaid }),
  },
  {
    idempotencyKey: `confirmation/${applicationId}`,
  }
)
```

### Seat Availability in Slide-Out Panel

For the "live seat availability context" per the CONTEXT:

```typescript
// Query inside ApplicationPanel (Server Component or fetched in action)
// Source: verified against live DB — zip_seats table confirmed, 1254 rows
const { data: seatData } = await supabaseAdmin
  .from('zip_seats')
  .select('total_cap, phantom_count')
  .eq('zip_code', application.primary_zip)
  .eq('role', application.role)
  .single()

// Count active approved/submitted/waitlisted for this zip+role
const { count: claimedCount } = await supabaseAdmin
  .from('application_zips')
  .select('*, applications!inner(status, role)', { count: 'exact', head: true })
  .eq('zip_code', application.primary_zip)
  .in('applications.status', ['submitted', 'approved', 'waitlisted'])
  .eq('applications.role', application.role)

const seatsRemaining = Math.max(
  0,
  (seatData?.total_cap ?? 0) - (seatData?.phantom_count ?? 0) - (claimedCount ?? 0)
)
// Display: "ZIP 77007 — 2 of 5 Agent seats remaining"
```

### Email Re-notification Policy (Claude's Discretion Recommendation)

Based on the CONTEXT's "full status flexibility — admin can move applications between any status at any time" and the re-notification being at Claude's discretion:

**Recommendation:** Send new emails only on status transitions TO terminal states (approved, rejected, waitlisted). Do NOT re-send if admin moves an already-approved application back to submitted then re-approves. Use the `email_log` check to suppress re-notification:

```typescript
// Before sending, check if this email type was already sent and succeeded
const { data: existingLog } = await supabaseAdmin
  .from('email_log')
  .select('id')
  .eq('application_id', applicationId)
  .eq('email_type', emailType)
  .eq('status', 'sent')
  .single()

if (existingLog) {
  // Already sent this email type — skip (or use idempotency key which handles this)
  return { skipped: true }
}
```

The idempotency key provides 24-hour deduplication automatically. For longer-term deduplication, the `email_log` check above is the belt-and-suspenders approach.

**Exception:** `waitlist_approved` email is a distinct type from `approved` — send it even if a regular `approved` email was previously sent, since it's a different template with different content ("a seat has opened in your territory").

---

## Sending Domain Setup (EMAIL-05)

**One-time operational task — not a code task. Document as a setup task in the plan.**

Steps:
1. Log in to Resend dashboard → Domains → Add Domain
2. Enter the MVR sending domain (e.g., `mvr.com` or subdomain like `team.mvr.com`)
3. Resend generates:
   - SPF TXT record: `v=spf1 include:_spf.resend.com ~all` (add to DNS)
   - DKIM TXT record: Resend-generated public key (add to DNS)
   - MX record: for bounce processing (add to DNS)
4. Click "Verify DNS Records" in Resend dashboard after adding records
5. DMARC (optional but recommended): add TXT record `v=DMARC1; p=none; rua=mailto:dmarc@[yourdomain]` to start in monitoring mode
6. After verification passes (up to 72h for DNS propagation): update `from` field in all email templates
7. Run deliverability check via [mail-tester.com](https://www.mail-tester.com) after first live send

**DNS provider:** Whatever registrar controls the MVR domain. The sending domain (`team@[mvr-domain]`) is TBD per CONTEXT.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer-motion in admin UI | No animation library needed for admin UI | N/A | Admin dashboard is functional, not animated |
| Custom HTML email templates | React Email components (`@react-email/components`) | 2022+ (stable 2024, v4 Mar 2025) | Type-safe, component-based, local preview server |
| Email send without idempotency | Resend idempotency keys | May 2025 | Webhook retry safety; prevents duplicate emails |
| `searchParams` as sync object in Next.js 14 | `searchParams` as Promise in Next.js 15 | Next.js 15.0 | Must `await searchParams` before accessing properties |
| framer-motion package | motion package | Dec 2025 | Not relevant to admin UI; already documented in Phase 2 research |

**Deprecated/outdated:**
- `framer-motion` in React 19: Use `motion` instead — not applicable to this phase
- `request.json()` in webhooks: Already correctly using `request.text()` in existing webhook handler — maintain this

---

## Open Questions

1. **Sending domain identity**
   - What we know: CONTEXT says "TBD — likely team@[mvr-domain]." The domain is not known at research time.
   - What's unclear: What is the actual MVR domain? Is there already a DNS provider managing it?
   - Recommendation: Plan the email domain setup as a prerequisite task that the user completes before Phase 5 email tasks are executed. Templates should use a placeholder `from` that gets swapped.

2. **`buys_online_leads` type drift (text vs boolean)**
   - What we know: The live DB column is `text` type; Prisma schema declares `Boolean?`. This was introduced before Phase 5.
   - What's unclear: When was this introduced and does it affect the admin queue display?
   - Recommendation: Display as-is in Phase 5. The value stored is "true"/"false" string. Cast in the UI: `app.buys_online_leads === 'true' ? 'Yes' : 'No'`. A proper fix (ALTER COLUMN) should be deferred to a separate cleanup migration.

3. **Supabase `application_status_history` INSERT via service role in webhook**
   - What we know: The Stripe webhook uses `supabaseAdmin` (service role) which bypasses RLS. This is correct and intentional.
   - What's unclear: Should the webhook also insert a status history record when moving `draft → submitted`?
   - Recommendation: Yes — insert a status history record in the webhook for `draft → submitted` transitions. Set `changed_by = null` (system/webhook-triggered change, not an admin action). This gives complete history including when payment was received.

---

## Sources

### Primary (HIGH confidence)

- Live Supabase DB introspection — `applications` table columns confirmed (28 columns, no `outreach_notes`, no status history table, no step timestamps); all RLS policies confirmed; `zip_seats` 1254 rows confirmed
- `supabase/migrations/001_foundation.sql` — Full schema, RLS policies, trigger functions confirmed
- `src/app/api/webhooks/stripe/route.ts` — Existing webhook handler pattern confirmed; correct `request.text()` usage confirmed
- `src/app/admin/(dashboard)/layout.tsx` — Admin layout uses `getUser()`, dark theme confirmed
- `prisma/schema.prisma` — Full Prisma schema confirmed; `buys_online_leads` declared as `Boolean?` (schema drift with live DB)
- `package.json` — `resend` and `@react-email/components` NOT installed (confirmed); `@tanstack/react-table` NOT installed (confirmed); `motion ^12.34.3` already installed
- [Resend official docs — send with Next.js](https://resend.com/docs/send-with-nextjs) — SDK pattern confirmed
- [Resend idempotency keys official docs](https://resend.com/docs/dashboard/emails/idempotency-keys) — `idempotencyKey` option in Node SDK confirmed
- [Resend engineering blog — idempotency keys](https://resend.com/blog/engineering-idempotency-keys) — TypeScript code example with second options arg `{ idempotencyKey: '...' }` confirmed

### Secondary (MEDIUM confidence)

- [shadcn/ui React 19 docs](https://ui.shadcn.com/docs/react-19) — Full React 19 support confirmed; `--legacy-peer-deps` may be needed for npm users
- [shadcn/ui Sheet component](https://www.shadcn.io/ui/sheet) — Radix Dialog-based; `side="right"` option confirmed for slide-out from right
- [React Email 4.0 announcement](https://resend.com/blog/react-email-4) — v4 released March 2025; `@react-email/components` package with new linter/spam score tools
- [TanStack Table v8 pagination guide](https://tanstack.com/table/v8/docs/guide/pagination) — `manualPagination: true`, `rowCount`, pagination state pattern confirmed
- [Resend domain setup docs](https://resend.com/docs/dashboard/domains/introduction) — SPF TXT + DKIM TXT + MX records required; DMARC optional; up to 72h propagation
- [Next.js Server Actions docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — `revalidatePath` after mutation pattern confirmed

### Tertiary (LOW confidence)

- Email re-notification policy (Claude's discretion) — recommended approach based on `email_log` + idempotency key combination; no official source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All library choices verified against official docs and live project `package.json`; Resend idempotency key SDK usage verified with TypeScript code example from official source
- Architecture: HIGH — Server Component → Client Table → Server Action pattern is the standard Next.js 15 App Router admin pattern; confirmed via official Next.js docs
- DB schema changes: HIGH — Live DB introspected; confirmed missing tables/columns; RLS policy patterns match existing foundation patterns
- Pitfalls: HIGH for Next.js 15 async searchParams and React Email bundling; MEDIUM for Resend idempotency window and Sheet z-index
- Email domain setup: MEDIUM — Resend docs confirmed the process; actual domain/DNS provider not known until user confirms

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (Resend SDK is stable; Next.js 15 + React 19 patterns stable; shadcn/ui React 19 support stable)
