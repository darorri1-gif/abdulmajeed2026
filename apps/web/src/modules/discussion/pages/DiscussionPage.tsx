import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Megaphone, Pin, Plus, Search } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Badge } from '@/shared/ui/Badge';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { cn } from '@/shared/lib/utils';
import { PostComposer } from '../components/PostComposer';
import { useCategories, usePosts } from '../discussion.hooks';

function timeAgo(iso: string) {
  return new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' });
}

export function DiscussionPage() {
  const { data: categories } = useCategories();
  const [category, setCategory] = useState('');
  const [announcements, setAnnouncements] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: posts, isLoading, isError } = usePosts({
    category: category || undefined,
    search: search || undefined,
    announcements,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">لوحة النقاش</h1>
          <p className="text-sm text-muted">مجتمع المنسوبين — أفكار وإعلانات ونقاشات.</p>
        </div>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus className="h-4 w-4" />
          موضوع جديد
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
          <Input className="ps-9" placeholder="ابحث في المواضيع" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Select className="sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="التصنيف">
          <option value="">كل التصنيفات</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </Select>
        <button
          onClick={() => setAnnouncements((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
            announcements ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-border text-body hover:bg-background',
          )}
        >
          <Megaphone className="h-4 w-4" />
          الإعلانات
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError ? (
        <Alert>تعذّر تحميل المواضيع.</Alert>
      ) : !posts?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          لا توجد مواضيع بعد.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/discussion/${p.id}`}
              className="block rounded-2xl border border-border bg-surface p-4 hover:bg-background"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.is_pinned && <Pin className="h-3.5 w-3.5 text-brand-gold" />}
                    {p.is_announcement && <Badge variant="warning">إعلان</Badge>}
                    <span className="font-semibold text-heading">{p.title}</span>
                  </div>
                  {p.body && <p className="mt-1 line-clamp-2 text-sm text-body">{p.body}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>{p.author_name}</span>
                    {p.category_name && <Badge>{p.category_name}</Badge>}
                    <span>{timeAgo(p.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                <span className={cn('flex items-center gap-1', p.reacted && 'text-brand-green')}>
                  <Heart className={cn('h-4 w-4', p.reacted && 'fill-current')} />
                  {p.reaction_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {p.comment_count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <PostComposer open={composerOpen} onOpenChange={setComposerOpen} onCreated={(id) => navigate(`/discussion/${id}`)} />
    </div>
  );
}
