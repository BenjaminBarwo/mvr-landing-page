# Technology Stack

**Project:** MVR Founding Seat Landing Page — Territory-Based Demand Validation
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack React framework | App Router provides co-located API routes, React Server Components for fast initial paint, ISR for caching territory/ZIP data. One framework handles landing page, form wizard, admin dashboard, and webhook receiver. |
| React | 19.x | UI library | Ships with Next.js 15. Concurrent features improve perceived responsiveness on multi-step forms. |
| TypeScript | 5.x | Type safety | Strict mode. Eliminates runtime bugs at Stripe webhook boundaries, form state transitions, and API surfaces. |

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | hosted | Managed Postgres + Auth + Realtime + Edge Functions | Row Level Security for admin-only data access, built-in auth, real-time subscriptions for live dashboard metrics. Eliminates database ops overhead. |
| Prisma | 5.x | ORM / migrations | Type-safe queries. Prisma Migrate handles schema evolution. Singleton client pattern for serverless. |

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Auth | built-in | Admin dashboard access control | Magic link or email/password for admin users. RLS policies enforce data access at database level. |
| @supabase/ssr | latest | Server-side session handling | Required for Next.js App Router — cookie-based sessions in Server Components. |

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Stripe | stripe@16.x | Payment processing server-side | Payment Intents API. Webhook events drive post-payment automation. |
| @stripe/stripe-js | 4.x | Client-side Stripe.js loader | Card data never touches your server. |
| @stripe/react-stripe-js | 3.x | React bindings for Stripe Elements | Use Payment Element (not legacy CardElement). |

**Pattern:** Use Stripe Checkout Session (redirect) for PCI simplicity, or embedded Payment Element if brand consistency is required.

**Webhook handling:** Must use Route Handler (`app/api/webhooks/stripe/route.ts`), not Server Action — Stripe requires raw unparsed request body for signature verification.

### Forms

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x | Multi-step form state | Uncontrolled inputs = zero unnecessary re-renders. `useFormContext` shares state across wizard steps. |
| Zod | 3.x | Schema validation | Pairs with RHF via `@hookform/resolvers/zod`. One schema validates client-side and server-side. |
| @hookform/resolvers | 3.x | Zod adapter for React Hook Form | Required bridging package. |

**Progressive save pattern:** On each step's `onSubmit`, call a Server Action that upserts the partial application keyed by session_id. Step 1 creates record. Each subsequent step updates it.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | Fastest path to polished dark minimal UI. |
| shadcn/ui | latest | Accessible component system | Components copied into repo (code ownership). Form inputs, dialogs, tables, charts. Built on Radix UI. |
| Framer Motion | 11.x | Micro-animations | Form step transitions. Keep minimal. |

### Email

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend | 4.x | Transactional email delivery | Best DX for Next.js. REST API + React SDK. Generous free tier. |
| React Email | 3.x | Email template authoring | React components render to cross-client compatible HTML. |

### Admin Dashboard & Analytics

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.x | Analytics charts | Funnel, bar, line charts. Composable React API. |
| react-simple-maps | 3.x | Territory heat map | SVG-based US map. ZIP-level choropleth. |
| TanStack Table | 8.x | Admin data tables | Headless. Sorting, filtering, pagination. |
| date-fns | 3.x | Date utilities | Tree-shakeable. Date range filtering, formatting. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | hosted | Deployment + CDN | Zero-config Next.js deployment. Edge Middleware for ZIP validation. |
| Sentry | @sentry/nextjs 8.x | Error monitoring | Automatic Next.js instrumentation. |

### Supporting Libraries

| Library | Purpose |
|---------|---------|
| nuqs | URL-synchronized form step state (?step=2) |
| clsx + tailwind-merge | Conditional class utilities (cn() pattern) |
| Sonner | Toast notifications |
| next-safe-action | Type-safe Server Actions with middleware and Zod validation |
| @t3-oss/env-nextjs | Environment variable validation at startup |

---

## What NOT to Use

| Technology | Why to Avoid |
|------------|--------------|
| Redux / Zustand | Overkill. React Hook Form + TanStack Query cover all state needs. |
| Next.js Pages Router | App Router is current standard. Don't mix routers. |
| GraphQL / tRPC | No query complexity justifies overhead when Server Actions exist. |
| Raw Stripe CardElement | Deprecated. Use Payment Element. |
| moment.js | Deprecated and bloated. Use date-fns. |
| Multiple CSS solutions | Pick Tailwind + shadcn. Don't mix with Styled Components or CSS Modules. |
| Auth.js (NextAuth) | Duplicates auth when Supabase Auth + RLS already handles it. |

---

## Installation

```bash
npx create-next-app@latest mvr-landing --typescript --tailwind --app --src-dir --import-alias "@/*"

# Database / ORM
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr

# Stripe
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Email
npm install resend @react-email/components

# shadcn/ui
npx shadcn@latest init

# Charts & Maps
npm install recharts react-simple-maps

# Tables
npm install @tanstack/react-table

# Utilities
npm install nuqs date-fns clsx tailwind-merge sonner next-safe-action @t3-oss/env-nextjs framer-motion

# Error monitoring
npm install @sentry/nextjs

# Dev dependencies
npm install -D prisma
```

---

## Sources

- Next.js App Router: https://nextjs.org/docs/app
- Stripe Next.js: https://stripe.com/docs/stripe-js/react
- Supabase + Prisma: https://supabase.com/docs/guides/integrations/prisma
- React Hook Form: https://react-hook-form.com/
- Resend + React Email: https://resend.com/docs/send-with-react-email
- shadcn/ui: https://ui.shadcn.com/docs
