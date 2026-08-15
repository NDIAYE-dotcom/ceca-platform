-- The registrations table only allowed admins to SELECT, so a logged-in
-- learner could never read their own registration row — which broke the new
-- "only show/allow courses this person actually registered for" check on
-- the e-learning pages (it always came back empty, denying access even to
-- someone genuinely registered). This adds a second, additive SELECT policy
-- letting a learner read rows that match their own email; the existing
-- admin-only policy is untouched and still applies.
drop policy if exists "Learners can read their own registrations" on public.registrations;
create policy "Learners can read their own registrations"
  on public.registrations
  for select
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
