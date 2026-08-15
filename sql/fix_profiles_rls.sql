-- CRITICAL: the profiles table (id, email, full_name, role) had no working
-- row-level-security restriction on SELECT — anyone with the public anon
-- key (i.e. anyone on the internet) could read every user's email, name and
-- role via a plain REST request. Found during a general security audit.
--
-- This wipes ALL existing policies on public.profiles (in case a stray
-- permissive one — e.g. "using (true)" — is what's causing the leak) and
-- replaces them with strict own-row-only access, matching how the app
-- actually uses this table (every read/write in the codebase is already
-- scoped to auth.uid() = id; nothing needs to read another user's profile).

alter table public.profiles enable row level security;

do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
