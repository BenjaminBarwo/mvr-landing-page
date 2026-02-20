# Phase 1: Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema, admin auth, Stripe webhook skeleton, and Vercel deployment. This phase creates the infrastructure every subsequent phase builds on. No public-facing UI is built here.

Requirements: INFRA-01, INFRA-02, INFRA-03, INFRA-04, ADMIN-01

</domain>

<decisions>
## Implementation Decisions

### Roles & seat caps
- Six professional roles: Agent, Lender, Inspector, Title Company, Appraiser, Contractor/Handyman
- Default seat caps vary by role: Agent: 5, Lender: 3, Inspector: 2, Title Company: 2, Appraiser: 2, Contractor/Handyman: 3
- No limit on how many ZIPs a professional can apply to — each ZIP is a separate $100 payment
- One application covers multiple ZIPs (primary ZIP + top 3 = up to 4 ZIPs, payment = number of ZIPs x $100)
- Application uniqueness constraint: one application per email + role combination (same person can apply for different roles)
- When a ZIP/role has 0 seats remaining, applicants can still apply but are warned — they go on waitlist

### Admin auth
- Email + password authentication (not magic link)
- 3 admin accounts total: 1 Approver, 2 Viewers
- Admin accounts can use username + password (don't need to be real email addresses)
- Manually provisioned — seed script or manual Supabase setup (Claude's discretion)
- Two admin permission levels: Viewer (read-only) and Approver (can approve/reject/waitlist applications, manage seat caps, manage phantom fill)

### Schema constraints
- Application statuses: Claude's discretion to design the status flow based on requirements
- ZIP storage model (junction table vs array): Claude's discretion based on query patterns
- Per-ZIP approval decisions on multi-ZIP applications: Claude's discretion
- Email log tracks ALL email types (received confirmation, approval, rejection, waitlist, and any future types)
- Deduplication: one application per email + role combination

### ZIP seeding
- All Houston metro area ZIPs (~180+ including suburbs like Katy, Sugar Land, Pearland)
- Three demand tiers: Premium, Standard, Suburban — Claude to research Houston real estate market data to assign ZIPs to tiers
- Tier cap multipliers: Claude's discretion based on scarcity model
- ZIP metadata stored: ZIP code, neighborhood name, and tier label
- Non-Houston ZIPs: accept any US ZIP in the seat checker but show "Coming soon to your area" — captures demand signal from outside Houston

### Claude's Discretion
- Application status flow design
- ZIP storage architecture (junction table vs array)
- Per-ZIP vs all-or-nothing approval on multi-ZIP applications
- Admin provisioning method (seed script vs manual Supabase)
- Tier cap multipliers for Premium/Standard/Suburban ZIPs
- Session duration and lockout policy for admin auth

</decisions>

<specifics>
## Specific Ideas

- Admin accounts don't need to use real emails — username + password is fine
- "Coming soon to your area" for non-Houston ZIPs captures demand signal for future expansion
- The multi-ZIP model means payment amount is dynamic ($100 x number of selected ZIPs)
- Seat checker should show availability even when 0 seats remain (warn, don't block)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-19*
