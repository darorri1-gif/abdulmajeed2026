-- =====================================================================
-- Migration 0007 — Student Follow-up (Module 2)
-- The most privacy-sensitive module. The visibility rule is enforced in
-- the database: nobody but the author sees an entry unless the author
-- shared it. There is NO admin override (confirmed decision).
-- =====================================================================

create table if not exists public.followup_categories (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  name_ar    text not null,
  icon       text,
  color      text,
  group_name text check (group_name in ('attendance', 'behavior', 'academic', 'communication', 'plan', 'note')),
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.followup_entries (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references public.profiles (id),
  category_id      uuid not null references public.followup_categories (id),
  academic_year_id uuid not null references public.academic_years (id),
  title            text,
  body             text,
  occurred_at      timestamptz not null default now(),
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  updated_by       uuid references public.profiles (id),
  deleted_at       timestamptz,
  deleted_by       uuid references public.profiles (id)
);
create index if not exists followup_author_time_idx on public.followup_entries (author_id, occurred_at desc);
create index if not exists followup_category_idx on public.followup_entries (category_id);
create index if not exists followup_year_idx on public.followup_entries (academic_year_id);
create index if not exists followup_body_fts on public.followup_entries using gin (to_tsvector('arabic', coalesce(body, '')));

create table if not exists public.followup_entry_students (
  entry_id     uuid not null references public.followup_entries (id) on delete cascade,
  student_id   uuid not null references public.students (id) on delete cascade,
  via_class_id uuid references public.classes (id),
  primary key (entry_id, student_id)
);
create index if not exists followup_entry_students_student_idx on public.followup_entry_students (student_id);

create table if not exists public.followup_visibility_grants (
  id              uuid primary key default gen_random_uuid(),
  entry_id        uuid not null references public.followup_entries (id) on delete cascade,
  grantee_type    text not null check (grantee_type in ('user', 'role', 'leadership_team')),
  grantee_user_id uuid references public.profiles (id),
  grantee_role_id uuid references public.roles (id),
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  check (
    (grantee_type = 'user' and grantee_user_id is not null and grantee_role_id is null)
    or (grantee_type = 'role' and grantee_role_id is not null and grantee_user_id is null)
    or (grantee_type = 'leadership_team' and grantee_user_id is null and grantee_role_id is null)
  )
);
create index if not exists followup_grants_user_idx on public.followup_visibility_grants (grantee_user_id);
create index if not exists followup_grants_role_idx on public.followup_visibility_grants (grantee_role_id);
create index if not exists followup_grants_entry_idx on public.followup_visibility_grants (entry_id);

create table if not exists public.followup_attachments (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references public.followup_entries (id) on delete cascade,
  storage_path  text not null,
  original_name text not null,
  mime_type     text,
  file_size     bigint,
  file_kind     text,
  uploaded_by   uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);
create index if not exists followup_attachments_entry_idx on public.followup_attachments (entry_id);

drop trigger if exists followup_set_updated_at on public.followup_entries;
create trigger followup_set_updated_at before update on public.followup_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- The privacy predicate. SECURITY DEFINER so it can evaluate grants
-- without exposing the underlying tables. Author OR a matching grant.
-- Leadership = holding role principal or vice_principal.
-- ---------------------------------------------------------------------
create or replace function public.can_access_followup(p_entry_id uuid)
returns boolean
language sql security definer set search_path = public stable as $$
  select
    exists (select 1 from public.followup_entries e where e.id = p_entry_id and e.author_id = (select auth.uid()))
    or exists (
      select 1 from public.followup_visibility_grants g
      where g.entry_id = p_entry_id and g.grantee_type = 'user' and g.grantee_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.followup_visibility_grants g
      join public.user_roles ur on ur.role_id = g.grantee_role_id
      where g.entry_id = p_entry_id and g.grantee_type = 'role' and ur.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.followup_visibility_grants g
      where g.entry_id = p_entry_id and g.grantee_type = 'leadership_team'
        and exists (
          select 1 from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = (select auth.uid()) and r.key in ('principal', 'vice_principal')
        )
    );
$$;
grant execute on function public.can_access_followup(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS — privacy enforced here.
-- ---------------------------------------------------------------------
alter table public.followup_categories enable row level security;
alter table public.followup_entries enable row level security;
alter table public.followup_entry_students enable row level security;
alter table public.followup_visibility_grants enable row level security;
alter table public.followup_attachments enable row level security;

create policy followup_categories_select on public.followup_categories for select to authenticated using (true);
create policy followup_categories_write on public.followup_categories for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy followup_entries_select on public.followup_entries for select to authenticated
  using (deleted_at is null and public.can_access_followup(id));
create policy followup_entries_insert on public.followup_entries for insert to authenticated
  with check (public.has_permission('followup.create') and author_id = (select auth.uid()));
create policy followup_entries_update on public.followup_entries for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy followup_students_select on public.followup_entry_students for select to authenticated
  using (public.can_access_followup(entry_id));
create policy followup_students_write on public.followup_entry_students for all to authenticated
  using (exists (select 1 from public.followup_entries e where e.id = entry_id and e.author_id = (select auth.uid())))
  with check (exists (select 1 from public.followup_entries e where e.id = entry_id and e.author_id = (select auth.uid())));

create policy followup_grants_select on public.followup_visibility_grants for select to authenticated
  using (public.can_access_followup(entry_id));
create policy followup_grants_write on public.followup_visibility_grants for all to authenticated
  using (exists (select 1 from public.followup_entries e where e.id = entry_id and e.author_id = (select auth.uid())))
  with check (exists (select 1 from public.followup_entries e where e.id = entry_id and e.author_id = (select auth.uid())));

create policy followup_attachments_select on public.followup_attachments for select to authenticated
  using (public.can_access_followup(entry_id));
create policy followup_attachments_write on public.followup_attachments for all to authenticated
  using (exists (select 1 from public.followup_entries e where e.id = entry_id and e.author_id = (select auth.uid())))
  with check (exists (select 1 from public.followup_entries e where e.id = entry_id and e.author_id = (select auth.uid())));

-- ---------------------------------------------------------------------
-- Atomic create: entry + student scope (verified) + visibility grants.
-- p_grants: jsonb array of { "type": "...", "user_id": "...", "role_id": "..." }
-- Provide EITHER p_class_id (whole class) OR p_student_ids (selected).
-- ---------------------------------------------------------------------
create or replace function public.create_followup_entry(
  p_category_id  uuid,
  p_title        text,
  p_body         text,
  p_occurred_at  timestamptz,
  p_class_id     uuid,
  p_student_ids  uuid[],
  p_grants       jsonb default '[]'::jsonb
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := (select auth.uid());
  v_year  uuid := public.current_academic_year_id();
  v_entry uuid;
begin
  if not public.has_permission('followup.create') then
    raise exception 'صلاحيات غير كافية' using errcode = '42501';
  end if;

  insert into public.followup_entries (author_id, category_id, academic_year_id, title, body, occurred_at, created_by)
  values (v_uid, p_category_id, v_year, p_title, p_body, coalesce(p_occurred_at, now()), v_uid)
  returning id into v_entry;

  if p_class_id is not null then
    if not exists (select 1 from public.teaching_assignments ta where ta.class_id = p_class_id and ta.teacher_id = v_uid) then
      raise exception 'هذا الفصل خارج نطاقك';
    end if;
    insert into public.followup_entry_students (entry_id, student_id, via_class_id)
    select v_entry, e.student_id, p_class_id
    from public.student_enrollments e
    where e.class_id = p_class_id and e.status = 'active';

  elsif p_student_ids is not null and array_length(p_student_ids, 1) is not null then
    if exists (
      select 1 from unnest(p_student_ids) sid
      where not exists (
        select 1 from public.student_enrollments en
        join public.teaching_assignments ta on ta.class_id = en.class_id and ta.teacher_id = v_uid
        where en.student_id = sid and en.status = 'active'
      )
    ) then
      raise exception 'أحد الطلاب خارج نطاقك';
    end if;
    insert into public.followup_entry_students (entry_id, student_id)
    select v_entry, sid from unnest(p_student_ids) sid;

  else
    raise exception 'حدّد الفصل أو الطلاب';
  end if;

  if p_grants is not null and jsonb_array_length(p_grants) > 0 then
    insert into public.followup_visibility_grants (entry_id, grantee_type, grantee_user_id, grantee_role_id, created_by)
    select
      v_entry,
      g->>'type',
      nullif(g->>'user_id', '')::uuid,
      nullif(g->>'role_id', '')::uuid,
      v_uid
    from jsonb_array_elements(p_grants) g;
  end if;

  return v_entry;
end;
$$;
grant execute on function public.create_followup_entry(uuid, text, text, timestamptz, uuid, uuid[], jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Seeds — follow-up categories (configurable)
-- ---------------------------------------------------------------------
insert into public.followup_categories (key, name_ar, group_name, sort_order, color) values
  ('attendance',        'حضور',                  'attendance',    1,  '#1B5E43'),
  ('late',              'تأخّر',                 'attendance',    2,  '#E8833A'),
  ('behavior_positive', 'سلوك إيجابي',           'behavior',      3,  '#1B5E43'),
  ('behavior_negative', 'سلوك سلبي',             'behavior',      4,  '#DC2626'),
  ('participation',     'مشاركة صفية',           'academic',      5,  '#1B5E43'),
  ('homework',          'الواجبات',              'academic',      6,  '#E8833A'),
  ('achievement',       'إنجاز',                 'academic',      7,  '#C9A227'),
  ('award',             'جائزة',                 'academic',      8,  '#C9A227'),
  ('certificate',       'شهادة',                 'academic',      9,  '#C9A227'),
  ('parent_comm',       'تواصل مع ولي الأمر',    'communication', 10, '#1B5E43'),
  ('treatment_plan',    'خطة علاجية',            'plan',          11, '#E8833A'),
  ('counselor_referral','إحالة للموجّه الطلابي', 'plan',          12, '#E8833A'),
  ('admin_note',        'ملاحظة إدارية',         'note',          13, '#94A3B8'),
  ('teacher_note',      'ملاحظة معلم',           'note',          14, '#94A3B8')
on conflict (key) do nothing;
