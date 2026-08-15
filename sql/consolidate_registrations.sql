-- consolidate_registrations.sql
-- Merges the two registration tables left over from an incomplete rename
-- ('registration' singular, holding the real data; 'registrations' plural,
-- empty) into a single canonical 'registrations' table, and locks down
-- read access (currently anyone with the public site key can read every
-- registrant's name/email/phone from `registration` — this closes that).
--
-- Run STEP 1, check the counts printed out, then run STEP 2.

-- ============ STEP 1: copy data, keep the old table as a backup ============

-- Safety copy of the old table under a new name (not dropped, just renamed
-- out of the way, so nothing is destroyed if something looks wrong).
alter table if exists public.registration rename to registration_old_backup;

insert into public.registrations (id, formation_id, formation_title, name, email, phone, organization, payment_method, notes, created_at)
select id, formation_id, formation_title, name, email, phone, organization, payment_method, notes, created_at
from public.registration_old_backup
on conflict (id) do nothing;

-- Verify: these two counts should now match.
select count(*) as registrations_count from public.registrations;
select count(*) as registration_old_backup_count from public.registration_old_backup;


-- ============ STEP 2: lock down access on the canonical table ============
-- Only run this after confirming the counts above match.

alter table public.registrations enable row level security;

-- Public registration form can still insert (visitors aren't logged in).
drop policy if exists allow_public_insert_registrations on public.registrations;
create policy allow_public_insert_registrations
  on public.registrations
  for insert
  with check (true);

-- Only admins can read the list (this is what was missing/wrong before).
drop policy if exists "Admins can read registrations" on public.registrations;
create policy "Admins can read registrations"
  on public.registrations
  for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Only admins can delete.
drop policy if exists "Admins can delete registrations" on public.registrations;
create policy "Admins can delete registrations"
  on public.registrations
  for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Once you've confirmed the admin panel still shows all 7 (or more) registrations
-- correctly, `registration_old_backup` can be dropped for good:
-- drop table public.registration_old_backup;
