-- =====================================================================
-- Migration 0008 — Follow-up Storage (private bucket + object RLS)
-- Paths: follow-up/{author_id}/{entry_id}/{uuid}.{ext}
-- Reads mirror the privacy predicate; writes/deletes are author-only.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('follow-up', 'follow-up', false)
on conflict (id) do nothing;

create policy followup_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'follow-up'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy followup_objects_select on storage.objects for select to authenticated
  using (
    bucket_id = 'follow-up'
    and public.can_access_followup(((storage.foldername(name))[2])::uuid)
  );

create policy followup_objects_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'follow-up'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
