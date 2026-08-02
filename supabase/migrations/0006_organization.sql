-- =====================================================================
-- Migration 0006 — Organization foundation (Foundation B)
-- Grades, subjects, classes, students, enrollments, teaching assignments.
-- Single-school. Provides the real data the Follow-up module operates on.
-- =====================================================================

create table if not exists public.grade_levels (
  id         uuid primary key default gen_random_uuid(),
  name_ar    text not null,
  sort_order int not null default 0
);

create table if not exists public.subjects (
  id      uuid primary key default gen_random_uuid(),
  name_ar text not null,
  code    text unique
);

create table if not exists public.classes (
  id               uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id),
  grade_level_id   uuid references public.grade_levels (id),
  name             text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  updated_by       uuid references public.profiles (id),
  unique (academic_year_id, name)
);
create index if not exists classes_year_idx on public.classes (academic_year_id);
create index if not exists classes_grade_idx on public.classes (grade_level_id);

create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  student_number text unique,
  national_id    text unique,
  gender         text check (gender in ('male', 'female')),
  birth_date     date,
  guardian_name  text,
  guardian_phone text,
  status         text not null default 'active' check (status in ('active', 'transferred', 'graduated', 'withdrawn')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references public.profiles (id),
  updated_by     uuid references public.profiles (id),
  deleted_at     timestamptz,
  deleted_by     uuid references public.profiles (id)
);
create index if not exists students_number_idx on public.students (student_number);
create index if not exists students_name_trgm on public.students using gin (full_name gin_trgm_ops);

create table if not exists public.student_enrollments (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students (id) on delete cascade,
  class_id         uuid not null references public.classes (id) on delete restrict,
  academic_year_id uuid not null references public.academic_years (id),
  status           text not null default 'active',
  unique (student_id, academic_year_id)
);
create index if not exists enrollments_class_idx on public.student_enrollments (class_id);
create index if not exists enrollments_student_idx on public.student_enrollments (student_id);

create table if not exists public.teaching_assignments (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.profiles (id) on delete cascade,
  class_id         uuid not null references public.classes (id) on delete cascade,
  subject_id       uuid references public.subjects (id),
  academic_year_id uuid not null references public.academic_years (id),
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  unique (teacher_id, class_id, subject_id, academic_year_id)
);
create index if not exists teaching_teacher_idx on public.teaching_assignments (teacher_id);
create index if not exists teaching_class_idx on public.teaching_assignments (class_id);

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes
  for each row execute function public.set_updated_at();
drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.grade_levels enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.teaching_assignments enable row level security;

create policy grade_levels_select on public.grade_levels for select to authenticated using (true);
create policy grade_levels_write on public.grade_levels for all to authenticated
  using (public.has_permission('organization.manage')) with check (public.has_permission('organization.manage'));

create policy subjects_select on public.subjects for select to authenticated using (true);
create policy subjects_write on public.subjects for all to authenticated
  using (public.has_permission('organization.manage')) with check (public.has_permission('organization.manage'));

create policy classes_select on public.classes for select to authenticated
  using (public.has_permission('organization.view'));
create policy classes_write on public.classes for all to authenticated
  using (public.has_permission('organization.manage')) with check (public.has_permission('organization.manage'));

create policy students_select on public.students for select to authenticated
  using (deleted_at is null and public.has_permission('students.view'));
create policy students_write on public.students for all to authenticated
  using (public.has_permission('students.manage')) with check (public.has_permission('students.manage'));

create policy enrollments_select on public.student_enrollments for select to authenticated
  using (public.has_permission('organization.view'));
create policy enrollments_write on public.student_enrollments for all to authenticated
  using (public.has_permission('organization.manage')) with check (public.has_permission('organization.manage'));

create policy teaching_select on public.teaching_assignments for select to authenticated
  using (public.has_permission('organization.view') or teacher_id = (select auth.uid()));
create policy teaching_write on public.teaching_assignments for all to authenticated
  using (public.has_permission('organization.manage')) with check (public.has_permission('organization.manage'));

-- ---------------------------------------------------------------------
-- Teacher-scoped read RPCs (least privilege — teachers need no
-- organization.view to see their own classes/students).
-- ---------------------------------------------------------------------
create or replace function public.my_classes()
returns table (id uuid, name text, grade_name text, student_count bigint)
language sql security definer set search_path = public stable as $$
  select c.id, c.name, gl.name_ar as grade_name,
    (select count(*) from public.student_enrollments e where e.class_id = c.id and e.status = 'active') as student_count
  from public.classes c
  left join public.grade_levels gl on gl.id = c.grade_level_id
  where c.academic_year_id = public.current_academic_year_id()
    and exists (
      select 1 from public.teaching_assignments ta
      where ta.class_id = c.id and ta.teacher_id = (select auth.uid())
    )
  order by c.name;
$$;
grant execute on function public.my_classes() to authenticated;

create or replace function public.class_students(p_class_id uuid)
returns table (id uuid, full_name text, student_number text)
language sql security definer set search_path = public stable as $$
  select s.id, s.full_name, s.student_number
  from public.students s
  join public.student_enrollments e on e.student_id = s.id
  where e.class_id = p_class_id and e.status = 'active' and s.deleted_at is null
    and (
      public.has_permission('students.view')
      or exists (
        select 1 from public.teaching_assignments ta
        where ta.class_id = p_class_id and ta.teacher_id = (select auth.uid())
      )
    )
  order by s.full_name;
$$;
grant execute on function public.class_students(uuid) to authenticated;

create or replace function public.my_students(p_search text default null)
returns table (id uuid, full_name text, student_number text, class_name text)
language sql security definer set search_path = public stable as $$
  select distinct s.id, s.full_name, s.student_number, c.name as class_name
  from public.students s
  join public.student_enrollments e on e.student_id = s.id
  join public.classes c on c.id = e.class_id
  join public.teaching_assignments ta on ta.class_id = c.id and ta.teacher_id = (select auth.uid())
  where s.deleted_at is null and e.status = 'active'
    and c.academic_year_id = public.current_academic_year_id()
    and (p_search is null or s.full_name ilike '%' || p_search || '%' or coalesce(s.student_number, '') ilike '%' || p_search || '%')
  order by s.full_name
  limit 50;
$$;
grant execute on function public.my_students(text) to authenticated;

-- Minimal staff directory for share pickers (no users.view required).
create or replace function public.list_shareable_staff()
returns table (id uuid, full_name text)
language sql security definer set search_path = public stable as $$
  select p.id, p.full_name
  from public.profiles p
  where p.status = 'active' and p.id <> (select auth.uid())
  order by p.full_name;
$$;
grant execute on function public.list_shareable_staff() to authenticated;

-- ---------------------------------------------------------------------
-- Seeds (configuration data)
-- ---------------------------------------------------------------------
insert into public.grade_levels (name_ar, sort_order) values
  ('أول ثانوي', 1), ('ثاني ثانوي', 2), ('ثالث ثانوي', 3)
on conflict do nothing;

insert into public.subjects (name_ar, code) values
  ('القرآن الكريم', 'QURAN'),
  ('الدراسات الإسلامية', 'ISLAMIC'),
  ('اللغة العربية', 'ARABIC'),
  ('اللغة الإنجليزية', 'ENGLISH'),
  ('الرياضيات', 'MATH'),
  ('الفيزياء', 'PHYSICS'),
  ('الكيمياء', 'CHEMISTRY'),
  ('الأحياء', 'BIOLOGY'),
  ('الاجتماعيات', 'SOCIAL'),
  ('الحاسب وتقنية المعلومات', 'CS')
on conflict (code) do nothing;
