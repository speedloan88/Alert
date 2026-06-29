-- Run this in Supabase SQL Editor
-- Creates the staff table for Internal Alerts app

CREATE TABLE IF NOT EXISTS ia_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default admin account (change password after first login)
INSERT INTO ia_staff (name, username, password, role)
VALUES ('Admin', 'admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;
