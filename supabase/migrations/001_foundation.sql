-- =============================================================================
-- Migration: 001_foundation
-- Description: Full database schema for MVR Founding Seat Landing Page
-- Tables: applications, application_zips, zip_seats, email_log, out_of_area_interest
-- =============================================================================

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE professional_role AS ENUM (
  'agent',
  'lender',
  'inspector',
  'title_company',
  'appraiser',
  'contractor'
);

CREATE TYPE application_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'waitlisted'
);

CREATE TYPE zip_tier AS ENUM (
  'premium',
  'standard',
  'suburban'
);

-- ============================================================================
-- Tables
-- ============================================================================

-- applications: core table for multi-step application records
CREATE TABLE applications (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  step_completed           int NOT NULL DEFAULT 1,
  status                   application_status NOT NULL DEFAULT 'draft',

  -- Step 1 — Contact & Role
  name                     text NOT NULL,
  email                    text NOT NULL,
  phone                    text,
  role                     professional_role NOT NULL,

  -- Step 2 — Business Details
  primary_zip              text,
  monthly_lead_spend       text,
  leads_per_month          text,
  transactions_closed      text,
  buys_online_leads        boolean,

  -- Step 3 / Payment
  stripe_payment_intent_id text,
  stripe_payment_status    text,
  paid_at                  timestamptz,
  payment_amount_cents     int,

  -- Legal
  terms_accepted_at        timestamptz,
  terms_version            text,

  -- Admin fields
  reviewed_by              uuid,
  reviewed_at              timestamptz,
  admin_notes              text,

  -- Tracking / UTM
  utm_source               text,
  utm_medium               text,
  utm_campaign             text,
  referrer                 text,
  session_id               text
);

-- Critical: partial unique index prevents duplicate applications per email+role
-- Allows same email+role to re-apply after rejection (WHERE status != 'rejected')
-- DB-level guarantee closes race condition window that app-level checks cannot
CREATE UNIQUE INDEX applications_email_role_active_unique
  ON applications (email, role)
  WHERE status != 'rejected';

-- application_zips: junction table for selected ZIP territories per application
-- Primary ZIP + up to 3 additional ZIPs; each ZIP = $100 payment unit
CREATE TABLE application_zips (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  zip_code        text NOT NULL,
  is_primary      boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(application_id, zip_code)
);

-- zip_seats: one row per (zip_code, role) combination
-- total_cap: max founding seats for this ZIP+role; phantom_count: admin-controlled fill
-- Seat caps differ by role and tier (Premium 1x, Standard 1.5x, Suburban 2x multipliers)
CREATE TABLE zip_seats (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code       text NOT NULL,
  role           professional_role NOT NULL,
  total_cap      int NOT NULL DEFAULT 3,
  phantom_count  int NOT NULL DEFAULT 0,
  tier           zip_tier NOT NULL DEFAULT 'standard',
  neighborhood   text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(zip_code, role)
);

-- email_log: transactional email audit trail for all email types
-- email_type: confirmation | approved | rejected | waitlisted | abandonment_1 | abandonment_2
CREATE TABLE email_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id       uuid NOT NULL REFERENCES applications(id),
  email_type           text NOT NULL,
  sent_at              timestamptz DEFAULT now(),
  provider_message_id  text,
  status               text NOT NULL DEFAULT 'sent'  -- sent | bounced | failed
);

-- out_of_area_interest: demand signal capture for non-Houston ZIP entries
-- Captures interest from the seat checker when a non-Houston ZIP is entered
-- Enables future expansion planning based on geographic demand data
CREATE TABLE out_of_area_interest (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code    text NOT NULL,
  role        professional_role,
  created_at  timestamptz DEFAULT now(),
  ip_address  text,
  user_agent  text
);

-- ============================================================================
-- updated_at Trigger
-- ============================================================================

-- Generic trigger function to update updated_at on row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER zip_seats_updated_at
  BEFORE UPDATE ON zip_seats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS on ALL tables — explicit deny by default; policies grant access
ALTER TABLE applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_zips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_seats           ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE out_of_area_interest ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- zip_seats policies
-- Public read: landing page seat checker needs seat counts without auth
-- Admin write: only approvers can mutate seat caps and phantom fill
-- ----------------------------------------------------------------------------

CREATE POLICY "zip_seats_public_read"
  ON zip_seats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Approvers can INSERT/UPDATE/DELETE; viewers and approvers can SELECT (covered above)
CREATE POLICY "zip_seats_approver_write"
  ON zip_seats
  FOR ALL
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' = 'approver')
  WITH CHECK ((select auth.jwt())->'app_metadata'->>'role' = 'approver');

-- ----------------------------------------------------------------------------
-- applications policies
-- Applicants are NOT auth users — they use session_id for their own record
-- Admins are authenticated via Supabase Auth
-- ----------------------------------------------------------------------------

-- Anon INSERT: applicants create their own applications (unauthenticated)
CREATE POLICY "applications_anon_insert"
  ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon SELECT: applicants can read their own application by session_id
-- Used for multi-step form recovery and progress tracking
CREATE POLICY "applications_session_read"
  ON applications
  FOR SELECT
  TO anon
  USING (session_id = ((select auth.jwt()) ->> 'sub'));

-- Authenticated admin SELECT: approvers and viewers can read all applications
CREATE POLICY "applications_admin_read"
  ON applications
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));

-- Authenticated admin UPDATE: only approvers can update applications (approve/reject/waitlist)
CREATE POLICY "applications_approver_update"
  ON applications
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' = 'approver')
  WITH CHECK ((select auth.jwt())->'app_metadata'->>'role' = 'approver');

-- ----------------------------------------------------------------------------
-- application_zips policies
-- Created alongside applications (anon); read by admins
-- ----------------------------------------------------------------------------

CREATE POLICY "application_zips_anon_insert"
  ON application_zips
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "application_zips_admin_read"
  ON application_zips
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));

-- ----------------------------------------------------------------------------
-- email_log policies
-- Internal audit trail; no public access; admin read-only
-- Webhook handler uses service-role client (bypasses RLS entirely)
-- ----------------------------------------------------------------------------

CREATE POLICY "email_log_admin_read"
  ON email_log
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));

-- ----------------------------------------------------------------------------
-- out_of_area_interest policies
-- Anon INSERT: public seat checker writes demand signals for non-Houston ZIPs
-- Admin SELECT: admin views demand data for expansion planning
-- ----------------------------------------------------------------------------

CREATE POLICY "out_of_area_interest_anon_insert"
  ON out_of_area_interest
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "out_of_area_interest_admin_read"
  ON out_of_area_interest
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));
