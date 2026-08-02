-- =====================================================================
-- Migration 0012 — Interactive Worksheets (تفاعلي)
-- A modern classroom activity builder + presenter. Not a graded LMS and
-- not a Madrasati clone: teachers compose interactive activity cards
-- (multiple-choice, poll, short-answer, info) and present them in class.
-- Published worksheets form a shared staff library. Additive tables only.
-- =====================================================================

create table if not exists public.worksheets (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id),
  title        text not null,
  description  text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  deleted_by   uuid references public.profiles (id)
);
create index if not exists worksheets_owner_idx on public.worksheets (owner_id);
create index if not exists worksheets_published_idx on public.worksheets (is_published);

create table if not exists public.worksheet_items (
  id           uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null references public.worksheets (id) on delete cascade,
  type         text not null check (type in ('multiple_choice', 'poll', 'short_answer', 'info')),
  position     int not null default 0,
  prompt       text not null,
  options      jsonb not null default '[]'::jsonb,   -- for multiple_choice / poll: ["أ","ب",...]
  answer       jsonb,                                 -- for multiple_choice: correct index; short_answer: model answer
  settings     jsonb not null default '{}'::jsonb
);
create index if not exists worksheet_items_ws_idx on public.worksheet_items (worksheet_id, position);

drop trigger if exists worksheets_set_updated_at on public.worksheets;
create trigger worksheets_set_updated_at before update on public.worksheets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: owner manages own; published worksheets are readable by all staff.
-- ---------------------------------------------------------------------
alter table public.worksheets enable row level security;
alter table public.worksheet_items enable row level security;

create policy worksheets_select on public.worksheets for select to authenticated
  using (deleted_at is null and (owner_id = (select auth.uid()) or is_published));
create policy worksheets_insert on public.worksheets for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy worksheets_update on public.worksheets for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy worksheets_delete on public.worksheets for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy worksheet_items_select on public.worksheet_items for select to authenticated
  using (exists (
    select 1 from public.worksheets w
    where w.id = worksheet_id and w.deleted_at is null and (w.owner_id = (select auth.uid()) or w.is_published)
  ));
create policy worksheet_items_write on public.worksheet_items for all to authenticated
  using (exists (select 1 from public.worksheets w where w.id = worksheet_id and w.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.worksheets w where w.id = worksheet_id and w.owner_id = (select auth.uid())));
