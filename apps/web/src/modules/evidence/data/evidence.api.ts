import { supabase } from '@/shared/lib/supabase';
import { likeTerm } from '@/shared/lib/utils';
import type {
  CreateEvidenceInput,
  EvidenceComment,
  EvidenceDetail,
  EvidenceFile,
  EvidenceHistoryItem,
  EvidenceListItem,
  EvidenceQuery,
  EvidenceStatus,
} from '../types/evidence.types';

const LIST_COLUMNS =
  'id, title, status, standard_id, teacher_id, created_at, updated_at, teacher:profiles!evidence_teacher_id_fkey(full_name), standard:standards(name_ar)';

export async function listEvidence(q: EvidenceQuery): Promise<EvidenceListItem[]> {
  let query = supabase.from('evidence').select(LIST_COLUMNS).is('deleted_at', null);

  if (q.scope === 'mine') {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) query = query.eq('teacher_id', auth.user.id);
  }
  if (q.standardId) query = query.eq('standard_id', q.standardId);
  if (q.status) query = query.eq('status', q.status);
  if (q.search?.trim()) {
    const term = likeTerm(q.search);
    if (term) query = query.ilike('title', `%${term}%`);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw error;
  return data as unknown as EvidenceListItem[];
}

export async function getEvidence(id: string): Promise<EvidenceDetail | null> {
  const { data, error } = await supabase
    .from('evidence')
    .select(
      'id, title, description, status, standard_id, indicator_id, academic_year_id, teacher_id, submitted_at, reviewed_at, review_note, created_at, updated_at, teacher:profiles!evidence_teacher_id_fkey(full_name), standard:standards(name_ar)',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EvidenceDetail) ?? null;
}

export async function createEvidence(input: CreateEvidenceInput): Promise<{ id: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('لا توجد جلسة صالحة.');

  const { data: yearId, error: yearErr } = await supabase.rpc('current_academic_year_id');
  if (yearErr || !yearId) throw new Error('لم يتم تحديد السنة الدراسية الحالية.');

  const { data, error } = await supabase
    .from('evidence')
    .insert({
      teacher_id: uid,
      created_by: uid,
      academic_year_id: yearId,
      standard_id: input.standard_id,
      indicator_id: input.indicator_id ?? null,
      title: input.title,
      description: input.description ?? null,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateEvidence(
  id: string,
  patch: { title?: string; description?: string | null; standard_id?: string; indicator_id?: string | null },
): Promise<void> {
  const { error } = await supabase.from('evidence').update(patch).eq('id', id);
  if (error) throw error;
}

export async function setEvidenceStatus(id: string, status: Extract<EvidenceStatus, 'submitted' | 'draft'>): Promise<void> {
  const { error } = await supabase.from('evidence').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function softDeleteEvidence(id: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('evidence')
    .update({ deleted_at: new Date().toISOString(), deleted_by: auth.user?.id })
    .eq('id', id);
  if (error) throw error;
}

export async function reviewEvidence(
  id: string,
  action: 'approve' | 'reject' | 'needs_revision',
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc('review_evidence', { p_evidence_id: id, p_action: action, p_note: note ?? null });
  if (error) throw error;
}

/* ---- Files (Storage) ---- */

function fileKind(mime: string): EvidenceFile['file_kind'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('word') || mime.includes('excel') || mime.includes('presentation') || mime.includes('officedocument'))
    return 'office';
  return 'other';
}

export async function listFiles(evidenceId: string): Promise<EvidenceFile[]> {
  const { data, error } = await supabase
    .from('evidence_files')
    .select('*')
    .eq('evidence_id', evidenceId)
    .eq('is_current', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as EvidenceFile[];
}

export async function uploadFile(evidenceId: string, file: File): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('لا توجد جلسة صالحة.');

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${uid}/${evidenceId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage.from('evidence').upload(path, file, { upsert: false });
  if (upErr) throw new Error('تعذّر رفع الملف.');

  const { error } = await supabase.from('evidence_files').insert({
    evidence_id: evidenceId,
    storage_path: path,
    original_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    file_kind: fileKind(file.type || ''),
    uploaded_by: uid,
  });
  if (error) throw error;
}

export async function getFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('evidence').createSignedUrl(path, 120);
  if (error || !data) throw new Error('تعذّر فتح الملف.');
  return data.signedUrl;
}

export async function deleteFile(file: EvidenceFile): Promise<void> {
  await supabase.storage.from('evidence').remove([file.storage_path]);
  const { error } = await supabase.from('evidence_files').delete().eq('id', file.id);
  if (error) throw error;
}

/* ---- Comments & history ---- */

export async function listComments(evidenceId: string): Promise<EvidenceComment[]> {
  const { data, error } = await supabase
    .from('evidence_comments')
    .select('id, evidence_id, author_id, body, created_at, author:profiles!evidence_comments_author_id_fkey(full_name)')
    .eq('evidence_id', evidenceId)
    .is('deleted_at', null)
    .order('created_at');
  if (error) throw error;
  return data as unknown as EvidenceComment[];
}

export async function addComment(evidenceId: string, body: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('لا توجد جلسة صالحة.');
  const { error } = await supabase.from('evidence_comments').insert({ evidence_id: evidenceId, author_id: uid, body });
  if (error) throw error;
}

export async function listHistory(evidenceId: string): Promise<EvidenceHistoryItem[]> {
  const { data, error } = await supabase
    .from('evidence_status_history')
    .select('id, from_status, to_status, changed_by, note, created_at, actor:profiles!evidence_status_history_changed_by_fkey(full_name)')
    .eq('evidence_id', evidenceId)
    .order('created_at');
  if (error) throw error;
  return data as unknown as EvidenceHistoryItem[];
}
