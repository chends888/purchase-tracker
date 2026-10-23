-- Purchase Tracker Phase 0 schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  plan_status text,
  created_at timestamptz not null default now()
);

-- Purchase items (matches app item fields)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  store text not null default 'Other',
  price text,
  url text,
  notes text,
  image text,
  status text not null default 'Want' check (status in ('Want', 'Ordered', 'Delivered')),
  shipped_to text,
  shipping_cost text,
  handling_fee text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_id_idx on public.items (user_id);
create index if not exists items_user_id_created_at_idx on public.items (user_id, created_at desc);

-- Keep updated_at fresh
create or replace function public.set_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row
  execute function public.set_items_updated_at();

-- Create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.items enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Items policies
drop policy if exists "Users can select own items" on public.items;
create policy "Users can select own items"
  on public.items for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own items" on public.items;
create policy "Users can insert own items"
  on public.items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own items" on public.items;
create policy "Users can update own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own items" on public.items;
create policy "Users can delete own items"
  on public.items for delete
  using (auth.uid() = user_id);

-- Table privileges (required when "Automatically expose new tables" is off).
-- Profiles: no INSERT for authenticated — rows are created by handle_new_user (security definer).
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.items to authenticated;

grant usage, select on all sequences in schema public to authenticated;
