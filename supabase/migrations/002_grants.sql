-- Grants for profiles + items (idempotent).
-- Run this if you already applied 001_profiles_items.sql before grants were added,
-- or if inserts/selects fail with "permission denied for table items".
-- Fresh installs: grants are also included at the end of 001_profiles_items.sql.

-- Profiles: no INSERT for authenticated — rows are created by handle_new_user (security definer).
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.items to authenticated;

grant usage, select on all sequences in schema public to authenticated;
