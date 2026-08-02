-- =====================================================================
-- Migration 0011 — Educational Discussion Board (staff community)
-- Minimal, additive tables. Staff-only (all authenticated can read/post);
-- pinning/announcements/moderation gated by a new discussion.moderate perm.
-- =====================================================================

create table if not exists public.discussion_categories (
  id         uuid primary key default gen_random_uuid(),
  name_ar    text not null,
  sort_order int not null default 0,
  is_active  boolean not null default true
);

create table if not exists public.discussion_posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles (id),
  category_id     uuid references public.discussion_categories (id),
  title           text not null,
  body            text,
  is_announcement boolean not null default false,
  is_pinned       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  deleted_by      uuid references public.profiles (id)
);
create index if not exists posts_created_idx on public.discussion_posts (is_pinned desc, created_at desc);
create index if not exists posts_category_idx on public.discussion_posts (category_id);
create index if not exists posts_title_trgm on public.discussion_posts using gin (title gin_trgm_ops);

create table if not exists public.discussion_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.discussion_posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists comments_post_idx on public.discussion_comments (post_id, created_at);

create table if not exists public.discussion_reactions (
  post_id uuid not null references public.discussion_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind    text not null default 'like',
  primary key (post_id, user_id)
);

create table if not exists public.discussion_attachments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.discussion_posts (id) on delete cascade,
  storage_path  text not null,
  original_name text not null,
  mime_type     text,
  file_size     bigint,
  uploaded_by   uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);
create index if not exists disc_attach_post_idx on public.discussion_attachments (post_id);

drop trigger if exists posts_set_updated_at on public.discussion_posts;
create trigger posts_set_updated_at before update on public.discussion_posts
  for each row execute function public.set_updated_at();

-- New permission for moderation
insert into public.permissions (key, module, name_ar) values
  ('discussion.moderate', 'discussion', 'إدارة لوحة النقاش')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.key = 'discussion.moderate'
where r.key in ('system_admin', 'principal', 'vice_principal')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.discussion_categories enable row level security;
alter table public.discussion_posts enable row level security;
alter table public.discussion_comments enable row level security;
alter table public.discussion_reactions enable row level security;
alter table public.discussion_attachments enable row level security;

create policy disc_categories_select on public.discussion_categories for select to authenticated using (true);
create policy disc_categories_write on public.discussion_categories for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy posts_select on public.discussion_posts for select to authenticated
  using (deleted_at is null);
create policy posts_insert on public.discussion_posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and ((is_announcement = false and is_pinned = false) or public.has_permission('discussion.moderate'))
  );
create policy posts_update on public.discussion_posts for update to authenticated
  using (author_id = (select auth.uid()) or public.has_permission('discussion.moderate'))
  with check (
    (author_id = (select auth.uid()) and is_pinned = false and is_announcement = false)
    or public.has_permission('discussion.moderate')
  );

create policy comments_select on public.discussion_comments for select to authenticated
  using (deleted_at is null);
create policy comments_insert on public.discussion_comments for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy comments_update on public.discussion_comments for update to authenticated
  using (author_id = (select auth.uid()) or public.has_permission('discussion.moderate'))
  with check (author_id = (select auth.uid()) or public.has_permission('discussion.moderate'));

create policy reactions_select on public.discussion_reactions for select to authenticated using (true);
create policy reactions_write on public.discussion_reactions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy disc_attach_select on public.discussion_attachments for select to authenticated using (true);
create policy disc_attach_insert on public.discussion_attachments for insert to authenticated
  with check (exists (select 1 from public.discussion_posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy disc_attach_delete on public.discussion_attachments for delete to authenticated
  using (
    exists (select 1 from public.discussion_posts p where p.id = post_id and p.author_id = (select auth.uid()))
    or public.has_permission('discussion.moderate')
  );

-- ---------------------------------------------------------------------
-- Feed RPC: posts with counts + whether the caller reacted
-- ---------------------------------------------------------------------
create or replace function public.list_discussion_posts(
  p_category text default null,
  p_search text default null,
  p_announcements boolean default false
)
returns table (
  id uuid, title text, body text, author_name text, category_name text,
  is_pinned boolean, is_announcement boolean, created_at timestamptz,
  comment_count bigint, reaction_count bigint, reacted boolean
)
language sql security definer set search_path = public stable as $$
  select
    p.id, p.title, p.body,
    au.full_name as author_name,
    c.name_ar as category_name,
    p.is_pinned, p.is_announcement, p.created_at,
    (select count(*) from public.discussion_comments dc where dc.post_id = p.id and dc.deleted_at is null) as comment_count,
    (select count(*) from public.discussion_reactions dr where dr.post_id = p.id) as reaction_count,
    exists (select 1 from public.discussion_reactions dr where dr.post_id = p.id and dr.user_id = (select auth.uid())) as reacted
  from public.discussion_posts p
  join public.profiles au on au.id = p.author_id
  left join public.discussion_categories c on c.id = p.category_id
  where p.deleted_at is null
    and (p_category is null or c.id::text = p_category)
    and (not p_announcements or p.is_announcement)
    and (p_search is null or p.title ilike '%' || p_search || '%' or p.body ilike '%' || p_search || '%')
  order by p.is_pinned desc, p.created_at desc
  limit 100;
$$;
grant execute on function public.list_discussion_posts(text, text, boolean) to authenticated;

create or replace function public.toggle_post_reaction(p_post_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if exists (select 1 from public.discussion_reactions where post_id = p_post_id and user_id = v_uid) then
    delete from public.discussion_reactions where post_id = p_post_id and user_id = v_uid;
    return false;
  else
    insert into public.discussion_reactions (post_id, user_id) values (p_post_id, v_uid);
    return true;
  end if;
end;
$$;
grant execute on function public.toggle_post_reaction(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Storage (private bucket + object RLS): discussion/{author_id}/{post_id}/...
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('discussion', 'discussion', false)
on conflict (id) do nothing;

create policy disc_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'discussion' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy disc_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'discussion');
create policy disc_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'discussion' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Seed a few categories
insert into public.discussion_categories (name_ar, sort_order) values
  ('عام', 1), ('إعلانات', 2), ('أفكار تربوية', 3), ('استفسارات', 4)
on conflict do nothing;
