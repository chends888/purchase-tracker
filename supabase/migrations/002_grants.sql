-- Grants for profiles + items (idempotent).
-- Run this if you already applied 001_profiles_items.sql before grants were added,
-- or if inserts/selects fail with "permission denied for table items".
-- Fresh installs: grants are also included at the end of 001_profiles_items.sql.
-- For service_role-only (Stripe webhook 42501), prefer 003_service_role_grants.sql.

-- Profiles: no INSERT for authenticated — rows are created by handle_new_user (security definer).
-- service_role: Stripe webhook updates profiles.plan (bypasses RLS but still needs GRANT).
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.items to authenticated;

grant select, update on table public.profiles to service_role;
grant select, insert, update, delete on table public.items to service_role;

grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;
