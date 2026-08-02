-- =====================================================================
-- Migration 0004 — Evidence Management (الشواهد) + minimal Organization
-- Implements the approved Database Design, Module 1 (Evidence) and the
-- academic_years it depends on. Educational philosophy (11 تمام standards)
-- is unchanged; the standards remain configurable data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Organization (minimal slice needed by Evidence): academic years
-- ---------------------------------------------------------------------
create table if not exists public.academic_years (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  start_date date,
  end_date   date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
-- Only one current year at a time.
create unique index if not exists academic_years_one_current
  on public.academic_years (is_current) where is_current;

create or replace function public.current_academic_year_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.academic_years where is_current limit 1;
$$;
grant execute on function public.current_academic_year_id() to authenticated;

-- ---------------------------------------------------------------------
-- Standards catalog (the 11 تمام standards) + optional indicators
-- ---------------------------------------------------------------------
create table if not exists public.standards (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,
  name_ar        text not null,
  description_ar text,
  weight         numeric,
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.standard_indicators (
  id          uuid primary key default gen_random_uuid(),
  standard_id uuid not null references public.standards (id) on delete cascade,
  code        text,
  name_ar     text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);
create index if not exists standard_indicators_standard_idx on public.standard_indicators (standard_id);

drop trigger if exists standards_set_updated_at on public.standards;
create trigger standards_set_updated_at before update on public.standards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Evidence
-- ---------------------------------------------------------------------
create table if not exists public.evidence (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.profiles (id),
  academic_year_id uuid not null references public.academic_years (id),
  standard_id      uuid not null references public.standards (id),
  indicator_id     uuid references public.standard_indicators (id),
  title            text not null,
  description      text,
  status           text not null default 'draft'
                   check (status in ('draft', 'submitted', 'approved', 'needs_revision', 'rejected')),
  submitted_at     timestamptz,
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles (id),
  review_note      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  updated_by       uuid references public.profiles (id),
  deleted_at       timestamptz,
  deleted_by       uuid references public.profiles (id)
);
create index if not exists evidence_teacher_standard_status_idx on public.evidence (teacher_id, standard_id, status);
create index if not exists evidence_status_idx on public.evidence (status);
create index if not exists evidence_year_idx on public.evidence (academic_year_id);
create index if not exists evidence_title_trgm on public.evidence using gin (title gin_trgm_ops);

create table if not exists public.evidence_files (
  id            uuid primary key default gen_random_uuid(),
  evidence_id   uuid not null references public.evidence (id) on delete cascade,
  storage_path  text not null,
  original_name text not null,
  mime_type     text,
  file_size     bigint,
  file_kind     text check (file_kind in ('image', 'pdf', 'office', 'video', 'audio', 'other')),
  version       int not null default 1,
  is_current    boolean not null default true,
  uploaded_by   uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);
create index if not exists evidence_files_current_idx on public.evidence_files (evidence_id, is_current);

create table if not exists public.evidence_comments (
  id          uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists evidence_comments_idx on public.evidence_comments (evidence_id, created_at);

create table if not exists public.evidence_status_history (
  id          uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references public.profiles (id),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists evidence_history_idx on public.evidence_status_history (evidence_id, created_at);

-- ---------------------------------------------------------------------
-- Status-change automation: timestamps + immutable history
-- ---------------------------------------------------------------------
create or replace function public.evidence_before_update()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'submitted' then new.submitted_at = now(); end if;
    if new.status in ('approved', 'rejected', 'needs_revision') then new.reviewed_at = now(); end if;
  end if;
  new.updated_by = (select auth.uid());
  return new;
end;
$$;

drop trigger if exists evidence_before_update_trg on public.evidence;
create trigger evidence_before_update_trg before update on public.evidence
  for each row execute function public.evidence_before_update();

-- SECURITY DEFINER so history is written even though users have no direct
-- INSERT policy on the history table (it cannot be forged).
create or replace function public.evidence_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.evidence_status_history (evidence_id, from_status, to_status, changed_by, note)
    values (new.id, old.status, new.status, (select auth.uid()), new.review_note);
  end if;
  return new;
end;
$$;

drop trigger if exists evidence_after_update_trg on public.evidence;
create trigger evidence_after_update_trg after update on public.evidence
  for each row execute function public.evidence_after_update();

-- Log the initial 'draft' creation into history too.
create or replace function public.evidence_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.evidence_status_history (evidence_id, from_status, to_status, changed_by, note)
  values (new.id, null, new.status, (select auth.uid()), null);
  return new;
end;
$$;

drop trigger if exists evidence_after_insert_trg on public.evidence;
create trigger evidence_after_insert_trg after insert on public.evidence
  for each row execute function public.evidence_after_insert();

-- ---------------------------------------------------------------------
-- Reviewer action (approve / reject / needs_revision) — atomic.
-- ---------------------------------------------------------------------
create or replace function public.review_evidence(p_evidence_id uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_status text;
begin
  if p_action = 'approve' then
    if not public.has_permission('evidence.approve') then
      raise exception 'صلاحيات غير كافية' using errcode = '42501';
    end if;
    v_status := 'approved';
  elsif p_action = 'reject' then
    if not public.has_permission('evidence.review') then
      raise exception 'صلاحيات غير كافية' using errcode = '42501';
    end if;
    v_status := 'rejected';
  elsif p_action = 'needs_revision' then
    if not public.has_permission('evidence.review') then
      raise exception 'صلاحيات غير كافية' using errcode = '42501';
    end if;
    v_status := 'needs_revision';
  else
    raise exception 'إجراء غير معروف';
  end if;

  update public.evidence
     set status = v_status, review_note = p_note, reviewed_by = (select auth.uid())
   where id = p_evidence_id and deleted_at is null;

  if not found then
    raise exception 'الشاهد غير موجود';
  end if;
end;
$$;
grant execute on function public.review_evidence(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.academic_years enable row level security;
alter table public.standards enable row level security;
alter table public.standard_indicators enable row level security;
alter table public.evidence enable row level security;
alter table public.evidence_files enable row level security;
alter table public.evidence_comments enable row level security;
alter table public.evidence_status_history enable row level security;

-- Reference/config tables: readable by all staff, writable by settings.manage
create policy academic_years_select on public.academic_years for select to authenticated using (true);
create policy academic_years_write on public.academic_years for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy standards_select on public.standards for select to authenticated using (true);
create policy standards_write on public.standards for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy indicators_select on public.standard_indicators for select to authenticated using (true);
create policy indicators_write on public.standard_indicators for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- evidence
create policy evidence_select on public.evidence for select to authenticated
  using (
    deleted_at is null
    and (
      teacher_id = (select auth.uid())
      or public.has_permission('evidence.review')
      or public.has_permission('evidence.view_all')
    )
  );

create policy evidence_insert on public.evidence for insert to authenticated
  with check (public.has_permission('evidence.create') and teacher_id = (select auth.uid()));

-- Owner may edit only while draft / needs_revision, and cannot self-approve.
create policy evidence_update_owner on public.evidence for update to authenticated
  using (teacher_id = (select auth.uid()) and status in ('draft', 'needs_revision') and deleted_at is null)
  with check (teacher_id = (select auth.uid()) and status in ('draft', 'submitted', 'needs_revision'));

-- evidence_files: gated by access to the parent evidence
create policy evidence_files_select on public.evidence_files for select to authenticated
  using (exists (select 1 from public.evidence e where e.id = evidence_id));
create policy evidence_files_insert on public.evidence_files for insert to authenticated
  with check (exists (select 1 from public.evidence e where e.id = evidence_id and e.teacher_id = (select auth.uid())));
create policy evidence_files_delete on public.evidence_files for delete to authenticated
  using (exists (select 1 from public.evidence e where e.id = evidence_id and e.teacher_id = (select auth.uid())));

-- evidence_comments: read if parent accessible; author writes their own
create policy evidence_comments_select on public.evidence_comments for select to authenticated
  using (deleted_at is null and exists (select 1 from public.evidence e where e.id = evidence_id));
create policy evidence_comments_insert on public.evidence_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (select 1 from public.evidence e where e.id = evidence_id));
create policy evidence_comments_update on public.evidence_comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

-- history: read-only for users; inserts happen through SECURITY DEFINER triggers
create policy evidence_history_select on public.evidence_status_history for select to authenticated
  using (exists (select 1 from public.evidence e where e.id = evidence_id));

-- ---------------------------------------------------------------------
-- Seeds
-- ---------------------------------------------------------------------
insert into public.academic_years (label, is_current)
select '1447هـ', true
where not exists (select 1 from public.academic_years);

-- The 11 standards. Names are configurable data — adjust to match تمام's
-- official wording from the Standards settings screen.
insert into public.standards (code, name_ar, sort_order) values
  ('S01', 'القيادة والإدارة المدرسية', 1),
  ('S02', 'التخطيط المدرسي', 2),
  ('S03', 'التعليم والتعلم', 3),
  ('S04', 'البيئة المدرسية الآمنة والمحفزة', 4),
  ('S05', 'رعاية السلوك والانضباط', 5),
  ('S06', 'الإرشاد الطلابي', 6),
  ('S07', 'الأنشطة الطلابية', 7),
  ('S08', 'الشراكة الأسرية والمجتمعية', 8),
  ('S09', 'التطوير المهني للمعلمين', 9),
  ('S10', 'التحصيل الدراسي وتحليل النتائج', 10),
  ('S11', 'تقنية المعلومات والتحول الرقمي', 11)
on conflict (code) do nothing;
