-- =====================================================================
-- Migration 0009 — Notifications (Module 3) + Dashboard aggregates
-- =====================================================================

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  entity_type  text,
  entity_id    uuid,
  is_read      boolean not null default false,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, is_read, created_at desc);

alter table public.notifications enable row level security;

-- Recipients read and mark their own as read. Rows are created only by
-- SECURITY DEFINER triggers/functions — no INSERT policy is exposed.
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Emit notifications on evidence status changes.
-- Submit -> notify reviewers; review decision -> notify the author.
-- ---------------------------------------------------------------------
create or replace function public.evidence_notify_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'submitted' then
      insert into public.notifications (recipient_id, type, title, body, entity_type, entity_id)
      select distinct ur.user_id, 'evidence.submitted', 'شاهد بانتظار المراجعة', new.title, 'evidence', new.id
      from public.user_roles ur
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions p on p.id = rp.permission_id
      where p.key = 'evidence.review' and ur.user_id <> new.teacher_id;

    elsif new.status in ('approved', 'rejected', 'needs_revision') then
      insert into public.notifications (recipient_id, type, title, body, entity_type, entity_id)
      values (
        new.teacher_id,
        'evidence.reviewed',
        case new.status
          when 'approved' then 'تم اعتماد شاهدك'
          when 'rejected' then 'تم رفض شاهدك'
          else 'شاهدك يحتاج تعديلًا'
        end,
        new.title, 'evidence', new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists evidence_notify_after_update_trg on public.evidence;
create trigger evidence_notify_after_update_trg after update on public.evidence
  for each row execute function public.evidence_notify_after_update();

-- ---------------------------------------------------------------------
-- Dashboard aggregates (gated by dashboard.view)
-- ---------------------------------------------------------------------
create or replace function public.school_overview()
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare
  result jsonb;
begin
  if not public.has_permission('dashboard.view') then
    raise exception 'صلاحيات غير كافية' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'staff_count', (select count(*) from public.profiles where status = 'active'),
    'student_count', (select count(*) from public.students where deleted_at is null and status = 'active'),
    'class_count', (select count(*) from public.classes where academic_year_id = public.current_academic_year_id()),
    'evidence', (
      select jsonb_build_object(
        'total', count(*),
        'draft', count(*) filter (where status = 'draft'),
        'submitted', count(*) filter (where status = 'submitted'),
        'approved', count(*) filter (where status = 'approved'),
        'needs_revision', count(*) filter (where status = 'needs_revision'),
        'rejected', count(*) filter (where status = 'rejected')
      ) from public.evidence where deleted_at is null
    ),
    -- Privacy-safe: only follow-up the caller is actually allowed to see.
    'followup_shared', (
      select count(*) from public.followup_entries e
      where e.deleted_at is null and public.can_access_followup(e.id)
    )
  ) into result;

  return result;
end;
$$;
grant execute on function public.school_overview() to authenticated;

create or replace function public.teacher_evidence_progress()
returns table (teacher_id uuid, full_name text, total bigint, approved bigint, submitted bigint, needs_revision bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_permission('dashboard.view') then
    raise exception 'صلاحيات غير كافية' using errcode = '42501';
  end if;

  return query
  select p.id, p.full_name,
    count(e.id) as total,
    count(*) filter (where e.status = 'approved') as approved,
    count(*) filter (where e.status = 'submitted') as submitted,
    count(*) filter (where e.status = 'needs_revision') as needs_revision
  from public.profiles p
  join public.evidence e on e.teacher_id = p.id and e.deleted_at is null
  group by p.id, p.full_name
  order by total desc;
end;
$$;
grant execute on function public.teacher_evidence_progress() to authenticated;

create or replace function public.evidence_by_standard()
returns table (standard_id uuid, name_ar text, total bigint, approved bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_permission('dashboard.view') then
    raise exception 'صلاحيات غير كافية' using errcode = '42501';
  end if;

  return query
  select s.id, s.name_ar,
    count(e.id) as total,
    count(*) filter (where e.status = 'approved') as approved
  from public.standards s
  left join public.evidence e on e.standard_id = s.id and e.deleted_at is null
  where s.is_active
  group by s.id, s.name_ar, s.sort_order
  order by s.sort_order;
end;
$$;
grant execute on function public.evidence_by_standard() to authenticated;
