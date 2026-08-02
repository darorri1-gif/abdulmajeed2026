-- =====================================================================
-- Migration 0003 — Application settings (key/value)
-- =====================================================================

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  scope      text not null default 'platform',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

alter table public.app_settings enable row level security;

create policy app_settings_select on public.app_settings for select to authenticated using (true);
create policy app_settings_write on public.app_settings for all to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));

-- Whether admin-created accounts must verify their email before signing in.
insert into public.app_settings (key, value) values
  ('auth.email_verification_enabled', 'false'::jsonb)
on conflict (key) do nothing;
