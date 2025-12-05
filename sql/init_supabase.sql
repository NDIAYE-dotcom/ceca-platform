-- Init script for Supabase: profiles table + RLS policies + admin helper
-- Run this in Supabase SQL Editor (be sûr d'utiliser la bonne DB)

-- 1) Create profiles table if it does not exist
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  role text,
  created_at timestamptz default now()
);

-- 2) Enable Row Level Security on profiles
alter table profiles enable row level security;

-- 3) Create RLS policies (drop if exist then create)
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4) Convenience function/examples
-- A) Upsert profile for a given auth user id (replace USER_UUID / values)
-- update profiles set role = 'admin' where id = 'USER_UUID';

-- B) Upsert by email (creates profile if missing or updates role)
-- Replace 'email@example.com' and desired role
-- insert into profiles (id, email, full_name, role)
-- select id, email, coalesce(user_metadata->>'name', '') as full_name, 'admin'
-- from auth.users where email = 'email@example.com'
-- on conflict (id) do update set role = EXCLUDED.role;

-- C) List policies for debugging
-- select * from pg_policies where tablename = 'profiles';

-- End of script
-- Supabase initialization script for CECA-Solutions
-- Create profiles (if not present), courses and enrollments tables
-- Ready to run in Supabase SQL Editor

-- Enable pgcrypto (gen_random_uuid)
create extension if not exists pgcrypto;

-- Profiles: link with auth.users (useful for roles and metadata)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  full_name text,
  role text,
  created_at timestamptz default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Allow select for owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Allow insert for owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow update for owner" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Courses table
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text,
  duration text,
  modules jsonb,
  description text,
  instructor_id uuid references auth.users(id) on delete set null,
  price numeric(10,2) default 0,
  video_url text,
  pdf_url text,
  created_at timestamptz default now()
);

-- Enable RLS for courses. Public can read; only instructors/admins (as per profiles.role) can modify.
alter table public.courses enable row level security;

create policy "Public read access to courses" on public.courses
  for select using (true);

create policy "Instructors/Admins can modify courses" on public.courses
  for insert, update, delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('instructor','admin'))
  );

-- Enrollments table: link users to courses, store progress and completion
create table if not exists public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  completed boolean default false,
  enrolled_at timestamptz default now()
);

-- Enable RLS on enrollments so users can only see/manage their own enrollments
alter table public.enrollments enable row level security;

create policy "Users can manage their enrollments" on public.enrollments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes to improve query performance
create index if not exists idx_courses_category on public.courses(category);
create index if not exists idx_enrollments_user on public.enrollments(user_id);

-- Sample course (optional)
insert into public.courses (title, category, duration, modules, description, price)
values (
  'Marchés publics : procédures et passation',
  'Marchés publics',
  '3 jours',
  '["Cadre juridique","Procédure de passation","Contrôle et audits"]'::jsonb,
  'Maîtriser les procédures de passation et le contrôle des marchés publics.',
  250
)
on conflict do nothing;

-- End of script
