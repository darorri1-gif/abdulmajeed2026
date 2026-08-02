-- =====================================================================
-- Migration 0010 — Audit Trail (Module 4) + System monitoring
-- Append-only audit log written by SECURITY DEFINER triggers, so it can
-- never be forgotten by application code and cannot be forged via the API.
-- Follow-up content is deliberately NOT audited (privacy).
-- =====================================================================

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  summary     text,
  changes     jsonb,
  context     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index if not exists audit_actor_idx on public.audit_log (actor_id, created_at desc);
create index if not exists audit_action_idx on public.audit_log (action);

alter table public.audit_log enable row level security;

-- Read only for audit.view. No INSERT/UPDATE/DELETE policy → write-once from
-- the API's perspective; rows come solely from the definer trigger below.
create policy audit_select on public.audit_log for select to authenticated
  using (public.has_permission('audit.view'));

-- ---------------------------------------------------------------------
-- Generic audit trigger. Uses to_jsonb() so it works on any table
-- without referencing columns that may not exist.
-- ---------------------------------------------------------------------
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec      jsonb;
  v_action text;
  v_entity uuid;
  v_summary text;
begin
  if tg_op = 'DELETE' then rec := to_jsonb(old); else rec := to_jsonb(new); end if;

  v_action := lower(tg_op);
  v_entity := nullif(rec->>'id', '')::uuid;

  if tg_table_name = 'evidence' then
    if tg_op = 'UPDATE' and (rec->>'status') is distinct from (to_jsonb(old)->>'status') then
      v_action := case rec->>'status'
        when 'submitted' then 'submit'
        when 'approved' then 'approve'
        when 'rejected' then 'reject'
        else 'update' end;
      v_summary := 'حالة الشاهد: ' || (rec->>'status');
    elsif tg_op = 'INSERT' then
      v_action := 'create';
    end if;

  elsif tg_table_name = 'user_roles' then
    v_action := case when tg_op = 'INSERT' then 'grant' else 'revoke' end;
    v_entity := (rec->>'user_id')::uuid;
    v_summary := 'تغيير أدوار مستخدم';

  elsif tg_table_name = 'role_permissions' then
    v_action := 'config_change';
    v_entity := (rec->>'role_id')::uuid;
    v_summary := 'تعديل صلاحيات دور';

  elsif tg_table_name = 'app_settings' then
    v_action := 'config_change';
    v_entity := null;
    v_summary := 'إعداد: ' || (rec->>'key');

  elsif tg_table_name = 'profiles' then
    v_summary := 'تعديل ملف مستخدم';

  elsif tg_table_name = 'students' then
    v_summary := case when tg_op = 'INSERT' then 'إضافة طالب' else 'تعديل طالب' end;

  elsif tg_table_name = 'classes' then
    v_summary := case when tg_op = 'INSERT' then 'إضافة فصل' else 'تعديل فصل' end;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, summary)
  values ((select auth.uid()), v_action, tg_table_name, v_entity, v_summary);

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists audit_evidence on public.evidence;
create trigger audit_evidence after insert or update or delete on public.evidence
  for each row execute function public.audit_trigger();

drop trigger if exists audit_user_roles on public.user_roles;
create trigger audit_user_roles after insert or delete on public.user_roles
  for each row execute function public.audit_trigger();

drop trigger if exists audit_role_permissions on public.role_permissions;
create trigger audit_role_permissions after insert or delete on public.role_permissions
  for each row execute function public.audit_trigger();

drop trigger if exists audit_app_settings on public.app_settings;
create trigger audit_app_settings after insert or update on public.app_settings
  for each row execute function public.audit_trigger();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles
  for each row execute function public.audit_trigger();

drop trigger if exists audit_students on public.students;
create trigger audit_students after insert or update on public.students
  for each row execute function public.audit_trigger();

drop trigger if exists audit_classes on public.classes;
create trigger audit_classes after insert or update on public.classes
  for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------
-- System monitoring counts (gated by settings.manage)
-- ---------------------------------------------------------------------
create or replace function public.system_stats()
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare
  result jsonb;
begin
  if not public.has_permission('settings.manage') then
    raise exception 'صلاحيات غير كافية' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'staff', (select count(*) from public.profiles),
    'active_staff', (select count(*) from public.profiles where status = 'active'),
    'students', (select count(*) from public.students where deleted_at is null),
    'classes', (select count(*) from public.classes),
    'evidence', (select count(*) from public.evidence where deleted_at is null),
    'followup_entries', (select count(*) from public.followup_entries where deleted_at is null),
    'notifications', (select count(*) from public.notifications),
    'audit_entries', (select count(*) from public.audit_log)
  ) into result;

  return result;
end;
$$;
grant execute on function public.system_stats() to authenticated;
