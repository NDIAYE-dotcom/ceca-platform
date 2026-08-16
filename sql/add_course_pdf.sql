-- Real, downloadable course PDF support. The "Télécharger le PDF" button
-- (Elearning.jsx and Classroom.jsx) referenced course.pdf, but no such
-- column ever existed on public.formations — the button has always been
-- non-functional, even before this session's changes.

alter table public.formations add column if not exists pdf_url text;

-- Storage bucket admins upload course PDFs into from FormationsAdmin.jsx.
-- Public bucket: course materials are meant to be downloadable by anyone
-- with the link (same trust level as the rest of the public catalogue),
-- but only an admin can upload/replace/remove files.
insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', true)
on conflict (id) do nothing;

drop policy if exists "Public can read course materials" on storage.objects;
create policy "Public can read course materials"
  on storage.objects
  for select
  using (bucket_id = 'course-materials');

drop policy if exists "Admins can upload course materials" on storage.objects;
create policy "Admins can upload course materials"
  on storage.objects
  for insert
  with check (
    bucket_id = 'course-materials'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins can update course materials" on storage.objects;
create policy "Admins can update course materials"
  on storage.objects
  for update
  using (
    bucket_id = 'course-materials'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins can delete course materials" on storage.objects;
create policy "Admins can delete course materials"
  on storage.objects
  for delete
  using (
    bucket_id = 'course-materials'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
