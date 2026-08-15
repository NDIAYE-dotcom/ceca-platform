-- Enables live updates (Supabase Realtime) for tables the admin panel
-- listens to via postgres_changes: new formation registrations (toast +
-- sidebar badge in Espace administration) and new contact messages.
-- Without this, the app still works correctly, it just requires a manual
-- "Rafraîchir" click to see new rows instead of updating instantly.
alter publication supabase_realtime add table public.registrations;
alter publication supabase_realtime add table public.messages;
