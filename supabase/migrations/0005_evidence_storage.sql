-- =====================================================================
-- Migration 0005 — Evidence Storage (private bucket + object RLS)
-- Paths: evidence/{teacher_id}/{evidence_id}/{uuid}.{ext}
-- The teacher_id is folder segment 1, which the policies key on.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Upload: only into your own {teacher_id} folder.
create policy evidence_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Read: your own files, or any reviewer / all-evidence viewer (signed URLs).
create policy evidence_objects_select on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_permission('evidence.view_all')
      or public.has_permission('evidence.review')
    )
  );

-- Delete: owner only.
create policy evidence_objects_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
