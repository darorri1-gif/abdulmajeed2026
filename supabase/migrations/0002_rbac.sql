-- =====================================================================
-- Migration 0002 — Roles, Permissions & RBAC (Identity & Access)
-- Database-driven authorization. Nothing hardcoded. Complies with the
-- approved Database Design (Foundation A).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.roles (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique,
  name_ar        text not null,
  name_en        text,
  description_ar text,
  is_system      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.permissions (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique,
  module         text not null,
  name_ar        text not null,
  description_ar text,
  created_at     timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);
create index if not exists role_permissions_permission_idx on public.role_permissions (permission_id);

create table if not exists public.user_roles (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role_id     uuid not null references public.roles (id) on delete restrict,
  assigned_by uuid references public.profiles (id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index if not exists user_roles_role_idx on public.user_roles (role_id);

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

-- Protect built-in roles from deletion
create or replace function public.prevent_system_role_delete()
returns trigger language plpgsql as $$
begin
  if old.is_system then
    raise exception 'لا يمكن حذف دور نظامي';
  end if;
  return old;
end;
$$;

drop trigger if exists roles_prevent_system_delete on public.roles;
create trigger roles_prevent_system_delete before delete on public.roles
  for each row execute function public.prevent_system_role_delete();

-- ---------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------
create or replace function public.has_permission(p_key text)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = (select auth.uid()) and p.key = p_key
  );
$$;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.current_user_permissions()
returns setof text
language sql security definer set search_path = public stable
as $$
  select distinct p.key
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = (select auth.uid());
$$;
grant execute on function public.current_user_permissions() to authenticated;

-- Paginated user search (guarded by users.view). Returns { total, rows[] }.
create or replace function public.search_users(
  p_search   text default null,
  p_role_key text default null,
  p_status   text default null,
  p_limit    int  default 20,
  p_offset   int  default 0
)
returns jsonb
language plpgsql security definer set search_path = public stable
as $$
declare
  result jsonb;
begin
  if not public.has_permission('users.view') then
    raise exception 'صلاحيات غير كافية' using errcode = '42501';
  end if;

  with filtered as (
    select pr.*
    from public.profiles pr
    where (p_status is null or pr.status = p_status)
      and (
        p_search is null
        or pr.full_name ilike '%' || p_search || '%'
        or pr.email ilike '%' || p_search || '%'
        or coalesce(pr.username, '') ilike '%' || p_search || '%'
      )
      and (
        p_role_key is null
        or exists (
          select 1 from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = pr.id and r.key = p_role_key
        )
      )
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'rows', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          f.id, f.full_name, f.email, f.username, f.specialization,
          f.status, f.last_login_at, f.must_change_password,
          coalesce((
            select jsonb_agg(jsonb_build_object('key', r.key, 'name_ar', r.name_ar))
            from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where ur.user_id = f.id
          ), '[]'::jsonb) as roles
        from filtered f
        order by f.full_name
        limit p_limit offset p_offset
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;
grant execute on function public.search_users(text, text, text, int, int) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

create policy roles_select on public.roles for select to authenticated using (true);
create policy roles_write on public.roles for all to authenticated
  using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

create policy permissions_select on public.permissions for select to authenticated using (true);
-- permissions are seed data, managed only by migrations (no write policy)

create policy role_permissions_select on public.role_permissions for select to authenticated using (true);
create policy role_permissions_write on public.role_permissions for all to authenticated
  using (public.has_permission('roles.manage'))
  with check (public.has_permission('roles.manage'));

create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('users.view'));
create policy user_roles_write on public.user_roles for all to authenticated
  using (public.has_permission('users.manage'))
  with check (public.has_permission('users.manage'));

-- Extend profiles policies (added to the self policies from migration 0001)
create policy profiles_select_directory on public.profiles for select to authenticated
  using (public.has_permission('users.view'));
create policy profiles_update_manage on public.profiles for update to authenticated
  using (public.has_permission('users.manage'))
  with check (public.has_permission('users.manage'));

-- ---------------------------------------------------------------------
-- Seed: roles
-- ---------------------------------------------------------------------
insert into public.roles (key, name_ar, is_system) values
  ('system_admin',  'مدير النظام',      true),
  ('principal',     'قائد المدرسة',     true),
  ('vice_principal','وكيل',             true),
  ('counselor',     'الموجّه الطلابي',  true),
  ('admin_staff',   'إداري',            true),
  ('teacher',       'معلم',             true)
on conflict (key) do nothing;

-- Seed: permissions
insert into public.permissions (key, module, name_ar) values
  ('users.view',          'users',        'عرض المستخدمين'),
  ('users.manage',        'users',        'إدارة المستخدمين'),
  ('roles.manage',        'roles',        'إدارة الأدوار والصلاحيات'),
  ('evidence.create',     'evidence',     'إضافة الشواهد'),
  ('evidence.view_all',   'evidence',     'عرض جميع الشواهد'),
  ('evidence.review',     'evidence',     'مراجعة الشواهد'),
  ('evidence.approve',    'evidence',     'اعتماد الشواهد'),
  ('followup.create',     'followup',     'تسجيل متابعة الطلاب'),
  ('students.view',       'students',     'عرض الطلاب'),
  ('students.manage',     'students',     'إدارة الطلاب'),
  ('organization.view',   'organization', 'عرض الهيكل المدرسي'),
  ('organization.manage', 'organization', 'إدارة الهيكل المدرسي'),
  ('audit.view',          'audit',        'عرض سجل التدقيق'),
  ('settings.manage',     'settings',     'إدارة الإعدادات'),
  ('dashboard.view',      'dashboard',    'عرض لوحة التحكم')
on conflict (key) do nothing;

-- Seed: default role -> permission mappings
-- system_admin: everything
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'system_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p
  on p.key = any (array['users.view','evidence.view_all','evidence.review','evidence.approve','audit.view','organization.view','students.view','followup.create','dashboard.view'])
where r.key = 'principal'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p
  on p.key = any (array['evidence.view_all','evidence.review','evidence.approve','organization.view','students.view','followup.create','dashboard.view'])
where r.key = 'vice_principal'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p
  on p.key = any (array['students.view','followup.create','dashboard.view'])
where r.key = 'counselor'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p
  on p.key = any (array['organization.view','students.view','dashboard.view'])
where r.key = 'admin_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p
  on p.key = any (array['evidence.create','followup.create','students.view','dashboard.view'])
where r.key = 'teacher'
on conflict do nothing;
