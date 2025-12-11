-- SQL: create_registrations.sql
-- Run this in your Supabase SQL editor (or via psql) to create the registrations table

create table if not exists public.registrations (
  id text primary key,
  formation_id text,
  formation_title text,
  name text,
  email text,
  phone text,
  organization text,
  payment_method text,
  notes text,
  created_at timestamptz default now()
);

-- Optional: create an index to speed queries by formation or created_at
create index if not exists idx_registrations_formation_id on public.registrations (formation_id);
create index if not exists idx_registrations_created_at on public.registrations (created_at desc);

-- Row Level Security: enable RLS and add a permissive insert policy for testing/dev.
-- WARNING: the following policy allows unauthenticated inserts. Tighten for production.

alter table public.registrations enable row level security;

create policy "allow_public_insert_registrations"
  on public.registrations
  for insert
  using (true)
  with check (true);

-- You may also allow selects for authenticated users only:
-- create policy "select_for_authenticated" on public.registrations for select using (auth.role() = 'authenticated');

-- If you want the frontend (anon key) to read registrations, add a select policy for anon (not recommended in production):
-- create policy "allow_public_select" on public.registrations for select using (true);


-- To revoke open policies in production, replace them with stricter policies that check auth.uid() or profile role.
-- Example: only allow select to users with role = 'admin' in your profiles table (requires join with auth.user metadata or embedding role in JWT).


-- End of file
