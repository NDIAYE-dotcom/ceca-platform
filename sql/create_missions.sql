-- create_missions.sql
-- Agenda de programmation des missions (Gestion de l'entreprise > Agenda).
-- Purely internal admin data — never shown to public site visitors — so unlike
-- `formations`/`registrations`, every operation (not just writes) is admin-only.

create table if not exists public.missions (
  id text primary key,
  title text not null,
  client text,
  location text,
  start_date date,
  end_date date,
  reminder_date date,
  notes text,
  status text default 'planifiee',
  created_at timestamptz default now()
);

alter table public.missions enable row level security;

drop policy if exists "Admins can manage missions" on public.missions;
create policy "Admins can manage missions"
  on public.missions
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
