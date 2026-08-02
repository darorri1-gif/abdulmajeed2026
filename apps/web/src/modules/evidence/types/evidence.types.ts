export type EvidenceStatus = 'draft' | 'submitted' | 'approved' | 'needs_revision' | 'rejected';

export interface Standard {
  id: string;
  code: string | null;
  name_ar: string;
  description_ar: string | null;
  weight: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface StandardIndicator {
  id: string;
  standard_id: string;
  code: string | null;
  name_ar: string;
  sort_order: number;
  is_active: boolean;
}

export interface EvidenceListItem {
  id: string;
  title: string;
  status: EvidenceStatus;
  standard_id: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  teacher?: { full_name: string } | null;
  standard?: { name_ar: string } | null;
}

export interface EvidenceDetail extends EvidenceListItem {
  description: string | null;
  indicator_id: string | null;
  academic_year_id: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

export interface EvidenceFile {
  id: string;
  evidence_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  file_kind: string | null;
  created_at: string;
}

export interface EvidenceComment {
  id: string;
  evidence_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { full_name: string } | null;
}

export interface EvidenceHistoryItem {
  id: string;
  from_status: EvidenceStatus | null;
  to_status: EvidenceStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
  actor?: { full_name: string } | null;
}

export interface EvidenceQuery {
  standardId?: string;
  status?: EvidenceStatus;
  search?: string;
  scope: 'mine' | 'all';
}

export interface CreateEvidenceInput {
  standard_id: string;
  indicator_id?: string | null;
  title: string;
  description?: string;
}
