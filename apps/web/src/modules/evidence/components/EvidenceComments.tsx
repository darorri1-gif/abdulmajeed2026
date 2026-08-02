import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { Spinner } from '@/shared/ui/feedback';
import { useAddComment, useComments } from '../evidence.hooks';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function EvidenceComments({ evidenceId }: { evidenceId: string }) {
  const { data: comments, isLoading } = useComments(evidenceId);
  const add = useAddComment(evidenceId);
  const [body, setBody] = useState('');

  function submit() {
    const value = body.trim();
    if (!value) return;
    add.mutate(value, { onSuccess: () => setBody('') });
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : !comments?.length ? (
        <p className="text-sm text-muted">لا توجد ملاحظات بعد.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-heading">{c.author?.full_name ?? 'مستخدم'}</span>
                <span className="text-xs text-muted">{formatDate(c.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-body">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="أضف ملاحظة…"
          className="min-h-11"
        />
        <Button onClick={submit} loading={add.isPending} disabled={!body.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
