-- Waitlist interest table for landing page signups
CREATE TABLE waitlist_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent','lender','inspector','title_company','appraiser','contractor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, role)
);

ALTER TABLE waitlist_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert" ON waitlist_interest FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read" ON waitlist_interest FOR SELECT USING (
  (select auth.jwt()) ->> 'role' IN ('approver', 'viewer')
);
