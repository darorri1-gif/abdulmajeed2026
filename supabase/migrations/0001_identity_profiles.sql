-- =====================================================================
-- Migration 0001 — Identity foundation (profiles)
-- Complies with the approved Database Design (Foundation A — Identity & Access).
-- Scope for the Authentication feature: the profiles table + auth support.
-- Roles, permissions and the admin-create-user flow arrive in later modules.
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- profiles: one row per staff user, 1:1 with auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  full_name             text not null,                       -- الاسم الثلاثي
  email                 text not null unique,                -- البريد الوزاري (login identifier)
  username              text unique,                         -- optional alternative login identifier
  specialization        text not null,                       -- التخصص
  phone                 text,
  avatar_path           text,
  job_title             text,
  status                text not null default 'active' check (status in ('active', 'suspended')),
  must_change_password  boolean not null default true,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references public.profiles (id),
  updated_by            uuid references public.profiles (id)
);

comment on table public.profiles is 'Staff profiles, 1:1 with auth.users. Accounts are provisioned by the admin only.';

-- Trigram index for fast name search (used by later modules)
create index if not exists profiles_full_name_trgm
  on public.profiles using gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- (RLS is enabled in the same migration that creates the table.)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user may read their own profile. Broader directory read (users.view)
-- is added with the Roles & Permissions module.
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select
  using (id = (select auth.uid()));

-- A user may update their own profile (needed for the first-login password change
-- and last_login_at). Column-level tightening is layered in later.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No self INSERT or DELETE: accounts are provisioned by the admin (service role)
-- in the User Management module.

-- ---------------------------------------------------------------------
-- Login identifier resolution (email OR username)
-- Returns the account email for a given identifier so the client can call
-- Supabase Auth signInWithPassword. SECURITY DEFINER so it can read profiles
-- before the user is authenticated.
-- ---------------------------------------------------------------------
create or replace function public.resolve_login_identifier(identifier text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email
  from public.profiles
  where status = 'active'
    and (lower(email) = lower(identifier) or lower(username) = lower(identifier))
  limit 1;
$$;

revoke all on function public.resolve_login_identifier(text) from public;
grant execute on function public.resolve_login_identifier(text) to anon, authenticated;
