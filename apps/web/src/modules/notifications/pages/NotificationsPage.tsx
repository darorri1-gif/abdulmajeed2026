import { useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/feedback';
import { cn } from '@/shared/lib/utils';
import { useMarkAllRead, useMarkRead, useNotifications } from '../notifications.hooks';
import type { AppNotification } from '../data/notifications.api';

function linkFor(n: AppNotification): string | null {
  if (n.entity_type === 'evidence' && n.entity_id) return `/evidence/${n.entity_id}`;
  return null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const navigate = useNavigate();

  function open(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
    const to = linkFor(n);
    if (to) navigate(to);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-heading">الإشعارات</h1>
        <Button variant="secondary" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending}>
          <CheckCheck className="h-4 w-4" />
          تعليم الكل كمقروء
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : !notifications?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          لا توجد إشعارات.
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => open(n)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-start transition-colors',
                  n.is_read ? 'border-border bg-surface' : 'border-brand-green/30 bg-brand-green/5',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-heading">{n.title}</span>
                  <span className="shrink-0 text-xs text-muted">{formatDate(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-1 line-clamp-2 text-sm text-body">{n.body}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
