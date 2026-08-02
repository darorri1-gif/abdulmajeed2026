import { Badge } from '@/shared/ui/Badge';
import type { EvidenceStatus } from '../types/evidence.types';

type Variant = 'neutral' | 'success' | 'warning' | 'danger';

const MAP: Record<EvidenceStatus, { label: string; variant: Variant }> = {
  draft: { label: 'مسودة', variant: 'neutral' },
  submitted: { label: 'بانتظار المراجعة', variant: 'warning' },
  approved: { label: 'معتمد', variant: 'success' },
  needs_revision: { label: 'يحتاج تعديل', variant: 'warning' },
  rejected: { label: 'مرفوض', variant: 'danger' },
};

export const STATUS_LABEL: Record<EvidenceStatus, string> = {
  draft: 'مسودة',
  submitted: 'بانتظار المراجعة',
  approved: 'معتمد',
  needs_revision: 'يحتاج تعديل',
  rejected: 'مرفوض',
};

export function StatusBadge({ status }: { status: EvidenceStatus }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
