-- =============================================================================
-- Migration: 004_realtime_and_page_visits
-- Description: Enable Supabase Realtime for zip_seats; add page_visits table for funnel analytics
-- =============================================================================

-- ============================================================================
-- Section 1: Enable Realtime publication for zip_seats
-- ============================================================================
-- Without this, Realtime postgres_changes subscriptions on zip_seats silently
-- receive no events. The public seat checker needs this to reflect admin
-- changes to phantom fill and seat caps in real time.

ALTER PUBLICATION supabase_realtime ADD TABLE zip_seats;

-- ============================================================================
-- Section 2: page_visits table for funnel analytics (ANLY-01)
-- ============================================================================
-- Write-once table — landing page fires on load to capture funnel entry points.
-- ip_hash stores a hashed IP for session dedup, not raw PII.

CREATE TABLE page_visits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at   timestamptz NOT NULL DEFAULT now(),
  path         text NOT NULL DEFAULT '/',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  session_id   text,
  ip_hash      text
);

-- Enable RLS — explicit deny by default
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Anon INSERT: landing page fires on load without auth
CREATE POLICY "page_visits_anon_insert"
  ON page_visits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin SELECT: approvers and viewers can read visit data for analytics
CREATE POLICY "page_visits_admin_read"
  ON page_visits
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt())->'app_metadata'->>'role' IN ('approver', 'viewer'));

-- Index for time-series queries in analytics dashboard
CREATE INDEX page_visits_visited_at_idx ON page_visits (visited_at DESC);

-- Index for path-level funnel analysis
CREATE INDEX page_visits_path_idx ON page_visits (path);
