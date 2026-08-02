import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Download, Heart, Pin, Send, Trash2, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/shared/hooks/usePermission';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Textarea } from '@/shared/ui/Textarea';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { cn } from '@/shared/lib/utils';
import { getAttachmentUrl, toggleReaction } from '../data/discussion.api';
import {
  useAddComment,
  useAttachments,
  useComments,
  useDeletePost,
  usePost,
  useSetPinned,
  useUploadAttachment,
} from '../discussion.hooks';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function PostDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const myId = useAuthStore((s) => s.profile?.id);
  const canModerate = useCan('discussion.moderate');

  const { data: post, isLoading, isError } = usePost(id);
  const { data: comments } = useComments(id);
  const { data: attachments } = useAttachments(id);
  const addComment = useAddComment(id);
  const del = useDeletePost();
  const pin = useSetPinned();
  const upload = useUploadAttachment(id);
  const inputRef = useRef<HTMLInputElement>(null);

  const [comment, setComment] = useState('');
  const [reacted, setReacted] = useState<boolean | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !post) return <Alert>تعذّر تحميل الموضوع.</Alert>;

  const isOwner = post.author_id === myId;
  const canDelete = isOwner || canModerate;

  async function react() {
    try {
      const now = await toggleReaction(id);
      setReacted(now);
    } catch {
      toast.error('تعذّر تنفيذ الإجراء.');
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file, { onSuccess: () => toast.success('تم إرفاق الملف.'), onError: (er) => toast.error((er as Error).message) });
    e.target.value = '';
  }

  async function openAttachment(path: string) {
    try {
      window.open(await getAttachmentUrl(path), '_blank', 'noopener');
    } catch {
      toast.error('تعذّر فتح الملف.');
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/discussion" className="inline-flex items-center gap-1 text-sm text-body hover:text-heading">
        <ArrowRight className="h-4 w-4" />
        عودة للوحة
      </Link>

      <Card>
        <CardContent className="py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {post.is_pinned && <Pin className="h-4 w-4 text-brand-gold" />}
                {post.is_announcement && <Badge variant="warning">إعلان</Badge>}
                <h1 className="text-xl font-bold text-heading">{post.title}</h1>
              </div>
              <p className="mt-1 text-xs text-muted">
                {post.author?.full_name} · {formatDate(post.created_at)}
                {post.category?.name_ar ? ` · ${post.category.name_ar}` : ''}
              </p>
            </div>
          </div>

          {post.body && <p className="mt-4 whitespace-pre-wrap text-sm text-body">{post.body}</p>}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 p-2.5">
                  <span className="truncate text-sm text-heading">{a.original_name}</span>
                  <button onClick={() => openAttachment(a.storage_path)} className="p-1 text-body hover:text-brand-green" aria-label="فتح">
                    <Download className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={react}>
              <Heart className={cn('h-4 w-4', reacted && 'fill-current text-brand-green')} />
              إعجاب
            </Button>
            {isOwner && (
              <>
                <input ref={inputRef} type="file" className="hidden" onChange={onPickFile} />
                <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
                  <Upload className="h-4 w-4" />
                  إرفاق
                </Button>
              </>
            )}
            {canModerate && (
              <Button variant="secondary" size="sm" onClick={() => pin.mutate({ id, pinned: !post.is_pinned }, { onSuccess: () => toast.success('تم التحديث.') })}>
                <Pin className="h-4 w-4" />
                {post.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => del.mutate(id, { onSuccess: () => { toast.success('تم الحذف.'); navigate('/discussion'); } })}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">التعليقات</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {!comments?.length ? (
            <p className="text-sm text-muted">لا توجد تعليقات بعد.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-heading">{c.author?.full_name}</span>
                    <span className="text-xs text-muted">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-body">{c.body}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="أضف تعليقًا…" className="min-h-11" />
            <Button
              className="shrink-0"
              disabled={!comment.trim()}
              loading={addComment.isPending}
              onClick={() => addComment.mutate(comment.trim(), { onSuccess: () => setComment('') })}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
