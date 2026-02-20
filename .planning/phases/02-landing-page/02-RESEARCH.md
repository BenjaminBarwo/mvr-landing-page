# Phase 2: Landing Page - Research

**Researched:** 2026-02-20
**Domain:** Next.js 15 App Router landing page — animation, typography, live seat checker, sticky CTA, Framer integration
**Confidence:** HIGH (core stack verified against live project + official docs); MEDIUM (Framer/Nanobanana pipeline)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Section order:** Hero → How It Works → Competitor Contrast → Seat Checker → Pricing → Credibility → CTA
- **No footer** — page ends on final CTA section; Terms link lives inline
- **No pill badge in hero** — keep it clean
- **Hero layout:** Centered MVR logo (large) + large serif headline + smaller subheadline + two CTA buttons side by side ("Apply for Founding Seat" → `/apply`, "See How It Works" → scrolls to section)
- **Atmospheric visual at hero bottom:** TBD, not locked
- **Dark background:** `#0a0a0a`
- **Gold accent:** Used sparingly — CTAs and key highlights only (buttons, price anchor, seat availability numbers)
- **Typography:** Premium serif for headlines (Playfair Display, Cormorant, or similar); clean sans-serif for body (Geist already in project)
- **Spacing:** Spacious, generous padding, Apple-style landing page feel; lots of scrolling is fine
- **Framer Motion scroll animations:** Fade in + slide up as sections enter viewport; parallax depth layers for decorative elements; GPU-accelerated transforms only (no `background-attachment: fixed`)
- **Sticky floating "Apply" CTA:** Appears after scrolling past hero on desktop; full-width sticky bottom bar on mobile
- **Seat Checker:** Lives after Competitor Contrast, before Pricing; desktop layout at researcher/planner discretion; mobile: compact list under ZIP input, results expand as scrollable role list with seat counts

### Claude's Discretion

- Exact spacing values and typography scale
- Seat checker card design on desktop
- Loading skeleton design
- Error state handling
- Which specific sections to collapse into accordions on mobile (likely How It Works and/or Competitor Contrast)
- Background decorative elements (subtle gradients, shapes) — must fit dark + gold theme

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | Dark, minimal landing page with "Secure Exclusive ZIP Access Before Public Launch" headline | Dark theme with `#0a0a0a` via Tailwind v4 `@theme` CSS variable; page.tsx replaced wholesale |
| LAND-02 | Subheadline explaining prioritized routing within protected territory | Static copy in Hero section component |
| LAND-03 | "How It Works" section explaining founding seat mechanism | Static section component; mobile accordion at Claude's discretion |
| LAND-04 | Competitor contrast section naming Zillow/HAR — cost absurdity + shared-lead model | Static section component; mobile accordion at Claude's discretion |
| LAND-05 | Price anchor: "$100 activation credit. Applied to your first live month. Limited by ZIP and role." | Pricing section; no "non-refundable" language per REQUIREMENTS |
| LAND-06 | Founder credibility section (industry insider angle) | Static section component |
| LAND-07 | ZIP code entry with live seat availability per role from database | Route Handler `/api/seats?zip=XXXXX` + debounced client-side fetch; `zip_seats_public_read` RLS policy already exists (anon SELECT) |
| LAND-08 | "Apply for Founding Seat" CTA button linking to `/apply` | Hero CTA + sticky floating button; `/apply` route built in Phase 3 |
| LAND-09 | Fully responsive on mobile (375px+) | Tailwind responsive prefixes; sticky bottom bar on mobile; seat checker compact list; potential accordion sections |
</phase_requirements>

---

## Summary

Phase 2 builds a public-facing marketing page inside the existing Next.js 15 / React 19 / Tailwind v4 project. The codebase is already deployed and wired — `src/app/page.tsx` is a bare Next.js starter placeholder and is the direct replacement target. No new infrastructure is required: the `zip_seats` table has 1,254 seeded rows and a live `zip_seats_public_read` RLS policy (`FOR SELECT TO anon, authenticated USING (true)`) already allows unauthenticated reads.

The most important technical decision is the **animation library**. Framer Motion has been rebranded to the `motion` package (`motion/react` import path). As of late 2025 the `motion` package at v12.27.5+ has full React 19 support. The old `framer-motion` package still exists on npm but should not be installed in a React 19 project — the `motion` package is the correct forward-compatible choice.

The seat checker is the only dynamic component. The clean pattern is a Next.js Route Handler (`/api/seats/route.ts`, GET) that accepts a `?zip=` query param and queries `zip_seats` with a JOIN to count active claims. The client component debounces the ZIP input (300ms via `use-debounce`) and hits the route handler. The `zip_seats_public_read` RLS policy already allows anonymous reads, so the server client can use the anon key without any special auth.

**Primary recommendation:** Install `motion` (not `framer-motion`), build 7 static section components + 1 dynamic SeatChecker component, wire a single `/api/seats` route handler, replace `page.tsx` with the composed page, and configure Tailwind v4 custom colors + Playfair Display font.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.x (latest) | Scroll animations, whileInView, parallax, sticky CTA visibility | Official successor to framer-motion; full React 19 support as of Dec 2025; import from `motion/react` |
| next/font/google | Built-in (Next.js 16.1.6) | Self-hosted Google Fonts (Playfair Display) with zero layout shift | Zero external requests; automatic preload; CSS variable output for Tailwind |
| use-debounce | ^10.x | Debounce ZIP input before triggering seat check API call | Lightweight, React 19 compatible; widely used in Next.js App Router examples |
| Tailwind CSS 4 | Already installed (^4) | CSS-first theming via `@theme` in globals.css | Already in project; no config file needed; CSS variable system fits gold accent pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | Already installed (^2.97) | Anon client in Route Handler for zip_seats query | Seat checker only — no auth needed, anon key is sufficient |
| unframer | npx CLI (no install) | Import Framer-designed components into Next.js | Only if user finalizes visual assets in Framer; deferred until user brings Framer frames |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion` package | `framer-motion` (old name) | framer-motion has React 19 peer dependency warnings; motion is the canonical name going forward |
| Route Handler for seat check | Server Component with direct DB query | Route Handler is correct here: the client needs to fire it interactively on ZIP input; Server Components can't do that |
| `use-debounce` | Manual setTimeout in useEffect | use-debounce handles cleanup, cancellation, leading/trailing edge correctly; hand-rolling adds bugs |
| `next/font` Playfair Display | Self-hosted font files in `public/` | `next/font` handles preloading, fallbacks, and prevents layout shift automatically |

**Installation:**
```bash
npm install motion use-debounce
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing page — composes all section components
│   ├── globals.css                     # Tailwind @theme: dark bg, gold accent, serif font var
│   ├── layout.tsx                      # Add Playfair Display font variable here
│   └── api/
│       └── seats/
│           └── route.ts               # GET /api/seats?zip=77002 — public seat checker
├── components/
│   └── landing/
│       ├── HeroSection.tsx             # "use client" — Motion animation, CTA buttons
│       ├── HowItWorksSection.tsx       # Static or "use client" for animation
│       ├── CompetitorSection.tsx       # Static or "use client" for animation
│       ├── SeatCheckerSection.tsx      # "use client" — ZIP input, debounce, fetch
│       ├── PricingSection.tsx          # Static or "use client" for animation
│       ├── CredibilitySection.tsx      # Static or "use client" for animation
│       ├── CtaSection.tsx              # Static CTA / page end
│       └── StickyApplyCta.tsx          # "use client" — scroll-driven visibility
└── lib/
    └── supabase/
        ├── client.ts                   # Already exists (browser client)
        └── server.ts                   # Already exists (server client — used in route handler)
```

### Pattern 1: Tailwind v4 Custom Colors + Dark Theme

**What:** In Tailwind v4, all configuration lives in `globals.css` via the `@theme` directive. No `tailwind.config.ts` needed.
**When to use:** Defining the `#0a0a0a` dark background, gold accent, and serif font variable.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Existing project variables — keep these */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Phase 2 additions */
  --font-serif: var(--font-playfair);          /* Playfair Display from layout.tsx */
  --color-background: #0a0a0a;                 /* Dark background — locked decision */
  --color-foreground: #ededed;
  --color-gold: #c9a84c;                       /* Gold accent — used on CTAs, numbers, highlights */
  --color-gold-muted: #a8893c;                 /* Hover state for gold */
  --color-surface: #111111;                    /* Slightly lighter dark for section cards */
  --color-muted: #6b7280;                      /* Gray text for secondary copy */
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

Usage in components:
```tsx
// Background: bg-[#0a0a0a] or bg-background
// Gold: text-gold, bg-gold, border-gold
// Serif: font-serif
```

### Pattern 2: Motion Scroll Animations (whileInView)

**What:** Section components fade in + slide up when entering the viewport. Uses `"use client"` directive.
**When to use:** Every content section that needs entrance animation. Use `viewport={{ once: true }}` — plays once only.

```tsx
// Source: motion.dev official docs + verified via WebSearch
"use client";
import { motion } from "motion/react";

export function HowItWorksSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-32 px-6"
    >
      {/* content */}
    </motion.section>
  );
}
```

### Pattern 3: Parallax Background Layer

**What:** Decorative background elements move at a different scroll speed than content — depth effect.
**When to use:** Hero section atmospheric visual / section dividers. GPU-accelerated via `useTransform`.

```tsx
// Source: framer.com/motion/scroll-animations (redirects to motion.dev)
"use client";
import { useScroll, useTransform, motion } from "motion/react";
import { useRef } from "react";

export function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);  // parallax speed

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Atmospheric background layer — moves slower than content */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        {/* Gradient glow or decorative element */}
        <div className="absolute inset-0 bg-gradient-radial from-gold/10 via-transparent to-transparent" />
      </motion.div>

      {/* Content — stays fixed relative to viewport */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
        {/* Logo, headline, CTAs */}
      </div>
    </section>
  );
}
```

### Pattern 4: Sticky Floating CTA (scroll-driven visibility)

**What:** Floating "Apply" button appears after scrolling past the hero. On mobile: full-width sticky bottom bar.
**When to use:** Desktop shows a fixed position floating button; mobile shows bottom bar with `fixed bottom-0`.

```tsx
"use client";
import { useState, useEffect, useRef } from "react";

export function StickyApplyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Use IntersectionObserver on the hero section for performance
    // (better than window scroll listener which fires constantly)
    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Desktop: floating pill */}
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <a href="/apply" className="btn-gold rounded-full px-6 py-3 shadow-lg">
          Apply for Founding Seat
        </a>
      </div>
      {/* Mobile: full-width bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-gold/20">
        <a href="/apply" className="btn-gold w-full text-center py-3 block rounded-lg">
          Apply for Founding Seat
        </a>
      </div>
    </>
  );
}
```

### Pattern 5: Seat Checker Route Handler + Client Component

**What:** GET Route Handler queries `zip_seats` + counts active applications per role for a given ZIP. Client debounces input.
**When to use:** The seat checker is the only dynamic data surface on the landing page.

**Route Handler (`src/app/api/seats/route.ts`):**
```typescript
// Source: nextjs.org/docs/app/getting-started/route-handlers + supabase.com/docs/guides/getting-started/quickstarts/nextjs
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// NOTE: This route handler uses anon client — zip_seats_public_read policy allows SELECT to anon
// No auth required; this is a public surface
export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip");

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("zip_seats")
    .select(`
      zip_code,
      role,
      total_cap,
      phantom_count,
      tier,
      neighborhood
    `)
    .eq("zip_code", zip);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // ZIP not in Houston — record out_of_area_interest signal
    await supabase.from("out_of_area_interest").insert({ zip_code: zip });
    return NextResponse.json({ inArea: false });
  }

  // NOTE: claimed_count must be computed via a separate query or DB view
  // Simple approach for Phase 2: return total_cap - phantom_count as "remaining"
  // Actual claimed seats are added in Phase 3 when applications exist
  const seats = data.map((row) => ({
    role: row.role,
    tier: row.tier,
    neighborhood: row.neighborhood,
    total_cap: row.total_cap,
    phantom_count: row.phantom_count,
    seats_remaining: Math.max(0, row.total_cap - row.phantom_count),
  }));

  return NextResponse.json({ inArea: true, zip, seats });
}
```

**Verified seat count query (live DB test confirms this structure works):**
```sql
-- Verified against live Supabase project (ZIP 77002 returns 6 roles, all seats available)
SELECT
  zs.role,
  zs.total_cap,
  zs.phantom_count,
  zs.tier,
  zs.neighborhood,
  GREATEST(0, zs.total_cap - zs.phantom_count - COUNT(az.id) FILTER (
    WHERE a.status IN ('submitted','approved','waitlisted')
  )) AS seats_remaining
FROM zip_seats zs
LEFT JOIN application_zips az ON az.zip_code = zs.zip_code
LEFT JOIN applications a ON a.id = az.application_id AND a.role = zs.role
WHERE zs.zip_code = $1
GROUP BY zs.id
ORDER BY zs.role;
```

**Client component (debounced input):**
```tsx
"use client";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface SeatResult {
  role: string;
  tier: string;
  neighborhood: string | null;
  total_cap: number;
  seats_remaining: number;
}

export function SeatCheckerSection() {
  const [zip, setZip] = useState("");
  const [results, setResults] = useState<SeatResult[] | null>(null);
  const [inArea, setInArea] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSeats = useDebouncedCallback(async (value: string) => {
    if (value.length !== 5) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seats?zip=${value}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setInArea(data.inArea);
      setResults(data.seats ?? null);
    } catch (e) {
      setError("Could not load seat availability. Try again.");
    } finally {
      setLoading(false);
    }
  }, 300);

  return (
    <section id="seat-checker" className="py-32 px-6">
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        placeholder="Enter your ZIP code"
        value={zip}
        onChange={(e) => {
          setZip(e.target.value);
          checkSeats(e.target.value);
        }}
        className="..."
      />
      {/* Results, loading skeleton, error state, out-of-area message */}
    </section>
  );
}
```

### Pattern 6: Playfair Display Font Setup

**What:** Add Playfair Display as the serif variable alongside the existing Geist setup.
**When to use:** layout.tsx is the correct place per Next.js font docs.

```typescript
// src/app/layout.tsx — additions only
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Add playfair.variable to the html/body className chain
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}>
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

### Anti-Patterns to Avoid

- **Using `framer-motion` package:** It has React 19 peer dependency conflicts. Use `motion` package with `import { motion } from "motion/react"`.
- **`background-attachment: fixed` for parallax:** Causes GPU layer creation issues on mobile Safari and triggers 1-2px jitter. Use `useTransform` on `style={{ y }}` instead. This is a locked user decision.
- **Scroll event listeners for sticky CTA:** Use `IntersectionObserver` on the hero element instead — much lower CPU cost.
- **Fetching seats from a Server Component:** The seat checker requires interactive client-side input; Server Components can't handle this. Route Handler is correct.
- **Blocking seat API on auth:** The `zip_seats_public_read` RLS policy already permits `anon` reads. Do not use the service-role client in this route — the anon client (via `createClient()` from `server.ts`) is correct and sufficient.
- **Querying `zip_seats` directly from the browser client:** Go through the Route Handler so the ZIP validation, error handling, and `out_of_area_interest` signal recording are server-side.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-triggered animations | Custom IntersectionObserver + state + CSS classes | `motion` whileInView + viewport | motion handles threshold, once, amount, edge cases; custom code accumulates bugs across browsers |
| Debounce on ZIP input | `setTimeout` + `clearTimeout` in `onChange` | `use-debounce` `useDebouncedCallback` | Handles cleanup on unmount, leading/trailing edge, React StrictMode double-invoke |
| Font loading + preload | Manual `<link rel="preload">` in `<head>` | `next/font/google` | Automatic preload injection, zero layout shift, self-hosted, no Google request |
| Parallax depth layers | Custom `requestAnimationFrame` scroll math | `useScroll` + `useTransform` from `motion` | GPU-scheduled, respects `prefers-reduced-motion`, composited correctly |
| Sticky CTA scroll detection | `window.addEventListener('scroll', ...)` with `setVisible` | `IntersectionObserver` on hero ref | Scroll listeners fire every frame; IntersectionObserver fires only on state change — 60x less CPU |

---

## Common Pitfalls

### Pitfall 1: Installing `framer-motion` instead of `motion`

**What goes wrong:** `npm install framer-motion` in a React 19 project causes peer dependency warnings and may produce runtime errors for certain animation APIs.
**Why it happens:** `framer-motion` was the old package name; the library migrated to `motion`. Both still exist on npm; older tutorials reference `framer-motion`.
**How to avoid:** Always `npm install motion`. Import from `"motion/react"` (not `"framer-motion"`).
**Warning signs:** `WARN ... framer-motion@X.X has unmet peer dependency react@^18`

### Pitfall 2: `motion.div` in Server Components

**What goes wrong:** Next.js throws a "You're importing a component that needs ... which is only available in a Client Component" build error.
**Why it happens:** `motion` uses browser APIs not available at SSR time.
**How to avoid:** Add `"use client"` at the top of every file that imports from `motion/react`. The common pattern is to wrap animated sections in a thin client component and keep Server Components for static sections that need no animation.
**Warning signs:** Build errors mentioning `useState`, `useEffect`, or refs in server context.

### Pitfall 3: Route Handler Cookie Handling in Next.js 15

**What goes wrong:** `createClient()` from `src/lib/supabase/server.ts` requires async cookie access (`await cookies()`). If the server client is constructed synchronously, it throws.
**Why it happens:** Next.js 15 changed the `cookies()` API to be async (returns a Promise). The existing `server.ts` in this project must already handle this since it was built post-Next.js 15.
**How to avoid:** Always `await createClient()` in Route Handlers. Verify `server.ts` uses `await cookies()`.
**Warning signs:** TypeScript error on `cookies()` return type, or runtime "cookies() was called outside a request scope" errors.

### Pitfall 4: `out_of_area_interest` INSERT race condition

**What goes wrong:** Rapid ZIP changes while typing could fire multiple out-of-area inserts for the same ZIP before the debounce kicks in.
**Why it happens:** User types a non-Houston ZIP one character at a time — each 5-digit sequence that happens to not be in Houston triggers an insert.
**How to avoid:** The 300ms debounce should prevent most cases. Additionally, only trigger the `out_of_area_interest` insert when `zip.length === 5` and `data.length === 0` (no rows in `zip_seats`). Do not insert partial ZIPs.
**Warning signs:** Duplicate rows in `out_of_area_interest` for the same ZIP within the same session.

### Pitfall 5: iOS Safari and scroll-linked animations

**What goes wrong:** iOS Safari applies momentum scroll inertia after the user lifts their finger, causing scroll-linked animations (parallax, frame sequences) to jitter or lag behind.
**Why it happens:** iOS Safari uses a deferred scroll model — the DOM doesn't update synchronously with finger position.
**How to avoid:** Keep parallax offsets small (max 20-30% of section height). Avoid frame sequences in Phase 2 (deferred per CONTEXT.md). Test on actual iOS Safari, not Chrome mobile simulator.
**Warning signs:** Smooth on desktop; jerky or offset on iPhone. Parallax layers "snapping" after finger release.

### Pitfall 6: Seat count accuracy in Phase 2

**What goes wrong:** The seat count shown is `total_cap - phantom_count` without subtracting actual claimed applications (because none exist yet in Phase 2). This is correct for now but will be wrong once Phase 3 applications are submitted.
**Why it happens:** Phase 2 builds the landing page; Phase 3 builds the form that creates applications. The JOIN query is verified and ready but Phase 2 doesn't need it yet.
**How to avoid:** When Phase 3 ships, update `/api/seats/route.ts` to use the full JOIN query that accounts for active application counts. Add a TODO comment in the Phase 2 implementation.
**Warning signs:** Seat counts not decreasing after real applications are submitted.

---

## Code Examples

Verified patterns from official sources and live project inspection:

### Existing RLS Policy (confirmed live — no migration needed)

```sql
-- Already applied in 001_foundation.sql — verified via pg_policies query
CREATE POLICY "zip_seats_public_read"
  ON zip_seats
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

The seat checker Route Handler can use the anon Supabase client without any RLS bypass. No new migration is needed for Phase 2.

### Seat Checker Query (live DB verified)

The following query was tested against the live Supabase project (77002 = Downtown Houston, Premium tier):
- 6 roles returned: agent(5), lender(3), inspector(2), title_company(2), appraiser(2), contractor(3)
- All seats available (phantom_count = 0, claimed = 0)

```sql
SELECT
  zs.role,
  zs.total_cap,
  zs.phantom_count,
  zs.tier,
  zs.neighborhood,
  GREATEST(0, zs.total_cap - zs.phantom_count - COUNT(az.id) FILTER (
    WHERE a.status IN ('submitted','approved','waitlisted')
  )) AS seats_remaining
FROM zip_seats zs
LEFT JOIN application_zips az ON az.zip_code = zs.zip_code
LEFT JOIN applications a ON a.id = az.application_id AND a.role = zs.role
WHERE zs.zip_code = $1
GROUP BY zs.id
ORDER BY zs.role;
```

### Supabase anon client in Route Handler (server.ts already exists)

```typescript
// Pattern: await createClient() — uses server.ts which handles async cookies()
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient(); // async because cookies() is async in Next.js 15
  const { data } = await supabase.from("zip_seats").select("*").eq("zip_code", zip);
  // ...
}
```

### Role display labels (for SeatCheckerSection UI)

```typescript
// Map DB enum values to human-readable display names
const ROLE_LABELS: Record<string, string> = {
  agent:        "Real Estate Agent",
  lender:       "Mortgage Lender",
  inspector:    "Home Inspector",
  title_company: "Title Company",
  appraiser:    "Appraiser",
  contractor:   "Contractor",
};
```

---

## Framer / Nanobanana Pipeline (Exploratory)

This section addresses the user's stated intent to design visual elements in Framer and potentially use Nanobanana to generate frame sequences.

### Framer → Next.js (unframer)

**Workflow:**
1. Design component in Framer web editor (hero atmospheric visual, section dividers, etc.)
2. Install React Export plugin in Framer
3. Select components to export
4. Run `npx unframer {framerProjectId} --outDir ./src/framer`
5. Import generated `.tsx` components into Next.js; import `./framer/styles.css`

**Confidence:** MEDIUM — unframer is a real, actively maintained tool with a working Next.js demo (`unframer-nextjs-app.vercel.app`). SSR support and TypeScript `.d.ts` files are included. However, Framer's component output quality varies significantly by design complexity. Complex animations may need post-processing.

**Key limitation:** Framer-exported components bring their own CSS and may conflict with Tailwind v4 `@theme` variables. Isolate Framer components in `src/framer/` and treat them as black-box embeds.

### Scroll-Driven Frame Sequence (Exploratory, not locked)

**Canvas approach (reference: Apple AirPods Pro pages):**
- Pre-render N JPG frames (e.g., 100 frames at the hero scroll height)
- On scroll, compute `frame = Math.floor(scrollProgress * totalFrames)`
- Draw current frame to `<canvas>` using `ctx.drawImage()`
- Pre-decode all frames with `new Image()` on mount before scroll begins

**Performance considerations:**
- Most expensive operation: JPEG decoding (compressed → bitmap in memory)
- Pre-decode all frames upfront; store decoded `ImageBitmap` objects
- WebP at ~60-80% quality reduces file size 40-70% vs JPG
- iOS Safari: scroll-linked canvas updates work but may lag — test on device
- Recommended frame count: 60-120 frames for a typical hero sequence
- Lazy load: show first frame immediately; decode remaining frames in idle callback

**Recommendation for Phase 2:** Skip the frame sequence for the initial build. The user explicitly flagged this as exploratory and "may design this in Framer and bring it over." Build the hero with a static gradient atmospheric visual first. Add frame sequence in a follow-on task after the user finalizes Nanobanana assets.

**Confidence:** LOW for Nanobanana specifically (no documentation found; proprietary tool). Canvas frame sequence technique itself is HIGH confidence — well-documented pattern.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package (`motion/react` import) | Dec 2025 (v12.27.5) | All new projects use `motion`; `framer-motion` still works on React 18 but shouldn't be used for new React 19 installs |
| `tailwind.config.js` for theme | `@theme` directive in `globals.css` | Tailwind v4 (stable 2025) | No JS config file; all theme tokens are CSS variables; this project already uses Tailwind v4 |
| `cookies()` synchronous in Next.js 14 | `await cookies()` async in Next.js 15 | Next.js 15.0 | Route Handlers and Server Components must `await cookies()` before creating Supabase server client |
| `background-attachment: fixed` for parallax | `useTransform` on `style={{ y }}` via motion | Industry best practice, esp. post-iOS 13 | `fixed` background breaks on iOS Safari; GPU transform is the only cross-browser parallax approach |

---

## Open Questions

1. **Is `server.ts` already using `await cookies()`?**
   - What we know: The file exists at `src/lib/supabase/server.ts` and was built during Phase 1 (Next.js 15 project). Phase 1 research enforced `getUser()` over `getSession()`.
   - What's unclear: Whether the `createServerClient` call explicitly awaits the cookies API. This needs to be verified before the route handler is written.
   - Recommendation: Read `server.ts` at the start of Phase 2 execution before writing `/api/seats/route.ts`.

2. **Does the project use `next-themes` for dark mode toggle, or is it always-dark?**
   - What we know: The landing page is always dark (`#0a0a0a`) — there is no mode toggle in the design.
   - What's unclear: The root layout currently has no `<ThemeProvider>`. Dark mode variants in Tailwind could interfere if `@media (prefers-color-scheme: dark)` is active (it is in current `globals.css`).
   - Recommendation: Remove the `@media (prefers-color-scheme: dark)` block from `globals.css` and hardcode the dark theme variables in `:root`. This page is always dark — there is no light mode.

3. **Framer project ID and Nanobanana asset delivery timeline?**
   - What we know: User "may design this in Framer and bring it over." Nothing is locked.
   - What's unclear: When/if the user will have Framer assets ready; whether Nanobanana produces WebP sequences or something else.
   - Recommendation: Build Phase 2 with a static CSS gradient in the hero atmospheric area. Stub a `HeroAtmospheric` component that can be swapped for a Framer/canvas component later without touching other sections.

---

## Sources

### Primary (HIGH confidence)
- Live Supabase project — `pg_policies` query confirmed `zip_seats_public_read` policy (`FOR SELECT TO anon, authenticated USING (true)`)
- Live Supabase project — `zip_seats` table confirmed 1,254 rows; test query on ZIP 77002 returns 6 roles with correct caps
- `src/app/globals.css` — Tailwind v4 `@import "tailwindcss"` + `@theme inline` already in project
- `src/app/layout.tsx` — Geist Sans + Geist Mono already configured via `next/font/google`
- `package.json` — Next.js 16.1.6, React 19.2.3, Tailwind ^4, `@supabase/ssr ^0.8.0`, `@supabase/supabase-js ^2.97.0` confirmed
- `supabase/migrations/001_foundation.sql` — Full schema including RLS policies, `out_of_area_interest` table, `zip_seats` structure

### Secondary (MEDIUM confidence)
- [motion npm package](https://www.npmjs.com/package/motion) — Confirmed `npm install motion`, `import { motion } from "motion/react"`, React 19 support
- [motion.dev](https://motion.dev) — Current canonical home for the motion library (framer-motion redirects here)
- [WebSearch: motion React 19 compatibility](https://www.framer.community/c/developers/trying-to-install-framer-motion-in-react-19-next-15) — Multiple community confirmations that `motion` v12.27.5+ has full React 19 support as of Dec 2025
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — `next/font/google` self-hosting pattern verified
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) — `GET` handler pattern with `NextRequest`/`NextResponse`
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — Server client in Route Handlers confirmed
- [use-debounce npm](https://www.npmjs.com/package/use-debounce) — `useDebouncedCallback` API confirmed; React 19 compatible
- [Tailwind CSS v4 theme variables](https://tailwindcss.com/docs/theme) — `@theme` directive and CSS variable namespace confirmed
- [unframer GitHub](https://github.com/remorses/unframer) — `npx unframer {projectId}` CLI workflow confirmed

### Tertiary (LOW confidence)
- Nanobanana — No documentation found; tool is referenced in user discussion only; cannot verify API/workflow
- Canvas frame sequence iOS Safari behavior — Community reports of lag/jitter on iOS Safari; not verified against a specific iOS/Safari version combination

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries verified against live project `package.json` and official docs; `motion` React 19 support verified via multiple community + npm sources
- Architecture: HIGH — Route Handler pattern, RLS policy, font setup, and Tailwind v4 all verified against live project and official docs
- Pitfalls: HIGH for React 19 / framer-motion naming, Server Component restriction, Next.js 15 async cookies; MEDIUM for iOS Safari scroll behavior (community reports, not officially documented)
- Framer/Nanobanana pipeline: MEDIUM (unframer) / LOW (Nanobanana)

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (stable libraries; `motion` package release cadence is fast but API surface is stable)
