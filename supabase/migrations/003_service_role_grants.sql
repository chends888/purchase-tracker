-- Grants for service_role (idempotent).
-- Needed when Supabase "Automatically expose new tables" is off: the Stripe
-- webhook uses SUPABASE_SERVICE_ROLE_KEY and gets Postgres 42501
-- (permission denied for table profiles) without these privileges.
-- Fresh installs: same grants are also at the end of 001_profiles_items.sql.
-- Run this if you already applied 001/002 before service_role grants existed.

grant usage on schema public to service_role;

grant select, update on table public.profiles to service_role;
grant select, insert, update, delete on table public.items to service_role;

grant usage, select on all sequences in schema public to service_role;
