-- SQL fix: create_registration_fix.sql
-- Corrected policy syntax: remove USING for INSERT policies
-- Run in Supabase SQL editor

-- (Optional) Create table if it does not exist
CREATE TABLE IF NOT EXISTS public.registration (
  id text PRIMARY KEY,
  formation_id text,
  formation_title text,
  name text,
  email text,
  phone text,
  organization text,
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registration_formation_id ON public.registration (formation_id);
CREATE INDEX IF NOT EXISTS idx_registration_created_at ON public.registration (created_at DESC);

-- Enable RLS
ALTER TABLE public.registration ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists, then create correct INSERT policy
DROP POLICY IF EXISTS allow_public_insert_registration ON public.registration;

CREATE POLICY allow_public_insert_registration
  ON public.registration
  FOR INSERT
  WITH CHECK (true);

-- If you need a public SELECT policy for dev/testing, create it explicitly (uncomment):
-- DROP POLICY IF EXISTS allow_public_select_registration ON public.registration;
-- CREATE POLICY allow_public_select_registration
--   ON public.registration
--   FOR SELECT
--   USING (true);

-- (Optional) To copy existing rows from `registrations` to `registration`:
-- INSERT INTO public.registration (id, formation_id, formation_title, name, email, phone, organization, payment_method, notes, created_at)
-- SELECT id, formation_id, formation_title, name, email, phone, organization, payment_method, notes, created_at
-- FROM public.registrations;
