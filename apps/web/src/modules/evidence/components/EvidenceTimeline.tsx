import { Spinner } from '@/shared/ui/feedback';
import { useHistory } from '../evidence.hooks';
import { STATUS_LABEL } from './StatusBadge';
import type { EvidenceStatus } from '../types/evidence.types';

function label(status: EvidenceStatus | null) {
  return status ? STATUS_LABEL[status] : 'إنشاء';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function EvidenceTimeline({ evidenceId }: { evidenceId: string }) {
  const { data: history, isLoading } = useHistory(evidenceId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }
  if (!history?.length) return <p className="text-sm text-muted">لا يوجد سجل بعد.</p>;

  return (
    <ol className="relative space-y-4 border-s border-border ps-4">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-green" />
          <div className="text-sm text-heading">
            {h.from_status ? `${label(h.from_status)} ← ${label(h.to_status)}` : label(h.to_status)}
          </div>
          <div className="text-xs text-muted">
            {h.actor?.full_name ?? 'النظام'} · {formatDate(h.created_at)}
          </div>
          {h.note && <div className="mt-1 rounded-lg bg-background p-2 text-xs text-body">{h.note}</div>}
        </li>
      ))}
    </ol>
  );
}
