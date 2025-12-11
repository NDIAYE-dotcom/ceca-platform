-- rename_registration_to_registrations.sql
-- Usage: copy/paste the whole file into Supabase SQL Editor and execute.
-- What it does (safe, reversible):
-- 1. Creates backups of current tables (backup_registration)
-- 2. Renames `registration` -> `registrations` (if `registrations` doesn't already exist)
-- 3. Creates indexes and RLS policies suitable for dev
-- 4. Provides verification queries and rollback notes

-- 1) Backup the current table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='registration') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.backup_registration AS TABLE public.registration';
  END IF;
END$$;

-- 2) Rename only if registrations does not already exist and registration exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='registration')
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='registrations') THEN
    EXECUTE 'ALTER TABLE public.registration RENAME TO registrations';
  END IF;
END$$;

-- 3) Ensure table `registrations` exists with expected columns (id, formation_id, etc.)
-- If table was renamed, columns are preserved. If registrations did not exist and registration didn't either,
-- you may want to run create_registrations.sql instead.

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_formation_id ON public.registrations (formation_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);

-- 5) Enable Row Level Security and create permissive INSERT policy for DEV (safe for development only)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_public_insert_registrations ON public.registrations;
CREATE POLICY allow_public_insert_registrations
  ON public.registrations
  FOR INSERT
  WITH CHECK (true);

-- (Optional) If you want to allow public SELECT in dev, uncomment and execute the following:
-- DROP POLICY IF EXISTS allow_public_select_registrations ON public.registrations;
-- CREATE POLICY allow_public_select_registrations
--   ON public.registrations
--   FOR SELECT
--   USING (true);

-- 6) Verification queries (run these after the script completes):
-- SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT 'registrations' as table_name, count(*) FROM public.registrations;
-- SELECT * FROM public.registrations LIMIT 10;

-- 7) Rollback (if you need to revert):
-- If you want to restore previous state where `registration` existed, and you created a backup:
-- DROP TABLE IF EXISTS public.registrations;
-- ALTER TABLE public.backup_registration RENAME TO registration;
-- (Then recreate any policies/indexes as needed.)

-- End of script
