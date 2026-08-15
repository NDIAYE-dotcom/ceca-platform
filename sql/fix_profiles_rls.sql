-- CRITICAL, part 1: the profiles table had no working RLS restricting SELECT
-- (anyone could read every user's email/name/role) — fixed by the policies
-- below, scoping select/insert/update to auth.uid() = id.
--
-- CRITICAL, part 2 (found after part 1 was applied): RLS controls which ROWS
-- a policy allows touching, not which COLUMNS — "using (auth.uid() = id)"
-- on UPDATE still let a learner PATCH their own row's `role` column straight
-- to 'admin' and grant themselves full admin access. Confirmed exploitable
-- and fixed here with a trigger that blocks any role change (on INSERT or
-- UPDATE) unless the person making the request is already an admin.

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

-- security definer so this can check the caller's own role without being
-- blocked by the very RLS it's evaluating (that would recurse).
create or replace function public.guard_profiles_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Our own backend endpoints (api/create-learner-access.js, and the local
  -- server/index.js mirror) use the service-role key precisely to manage
  -- roles from trusted server code — those already gate on the caller being
  -- an admin before they ever get here. auth.uid() is null in that context,
  -- so without this bypass the check below would incorrectly block them too.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.role is distinct from old.role)
     or (tg_op = 'INSERT' and new.role is not null and new.role <> 'learner') then
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Not authorized to set this role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profiles_role_change on public.profiles;
create trigger trg_guard_profiles_role_change
  before insert or update on public.profiles
  for each row
  execute function public.guard_profiles_role_change();
