import { Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/shared/ui/toast';
import { useDeleteEntry } from '../followup.hooks';
import type { FollowupEntry } from '../types/followup.types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function FollowupTimeline({ entries, showAuthor }: { entries: FollowupEntry[]; showAuthor?: boolean }) {
  const myId = useAuthStore((s) => s.profile?.id);
  const del = useDeleteEntry();
  const toast = useToast();

  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        لا توجد متابعات.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.category?.color ?? '#94A3B8' }} />
              <span className="text-sm font-semibold text-heading">{e.category?.name_ar ?? 'متابعة'}</span>
            </div>
            <span className="text-xs text-muted">{formatDate(e.occurred_at)}</span>
          </div>

          {e.title && <p className="mt-2 text-sm font-medium text-heading">{e.title}</p>}
          {e.body && <p className="mt-1 whitespace-pre-wrap text-sm text-body">{e.body}</p>}

          <div className="mt-2 flex items-center justify-between">
            {showAuthor ? <span className="text-xs text-muted">{e.author?.full_name}</span> : <span />}
            {e.author_id === myId && (
              <button
                onClick={() => del.mutate(e.id, { onSuccess: () => toast.success('تم الحذف.') })}
                className="p-1 text-muted hover:text-danger"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
