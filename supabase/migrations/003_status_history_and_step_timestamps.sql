-- =============================================================================
-- Migration: 003_status_history_and_step_timestamps
-- Description: Add application status history audit trail and step completion
--              timestamps. Also adds outreach_notes column for admin use.
-- =============================================================================

-- Status history audit trail table
CREATE TABLE application_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status     application_status,
  to_status       application_status NOT NULL,
  changed_by      uuid,
  reason          text,
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

-- Add outreach_notes and step completion timestamps to applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS outreach_notes text,
  ADD COLUMN IF NOT EXISTS step1_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS step2_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS step3_completed_at timestamptz;
