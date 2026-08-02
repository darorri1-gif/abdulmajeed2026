import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Plus, Search, SquarePen } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Textarea } from '@/shared/ui/Textarea';
import { Card, CardContent } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/ui/toast';
import { useCreateWorksheet, useWorksheets } from '../worksheets.hooks';

function CreateDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const create = useCreateWorksheet();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="ورقة عمل جديدة">
        <div className="space-y-4">
          <div>
            <Label htmlFor="t">العنوان</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="d">وصف (اختياري)</Label>
            <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button
              onClick={() =>
                title.trim().length >= 3
                  ? create.mutate(
                      { title: title.trim(), description: description.trim() || undefined },
                      { onSuccess: (r) => { toast.success('تم الإنشاء.'); onOpenChange(false); onCreated(r.id); } },
                    )
                  : toast.error('أدخل عنوانًا واضحًا.')
              }
              loading={create.isPending}
            >
              إنشاء
            </Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WorksheetsPage() {
  const myId = useAuthStore((s) => s.profile?.id);
  const [scope, setScope] = useState<'mine' | 'library'>('mine');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: worksheets, isLoading, isError } = useWorksheets(scope, search);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">أوراق العمل التفاعلية</h1>
          <p className="text-sm text-muted">صمّم أنشطة صفّية تفاعلية واعرضها مباشرة.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          ورقة جديدة
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {(['mine', 'library'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                scope === s ? 'bg-brand-green/10 text-brand-green' : 'text-body hover:bg-background',
              )}
            >
              {s === 'mine' ? 'أوراقي' : 'المكتبة المشتركة'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
          <Input className="ps-9" placeholder="بحث بالعنوان" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError ? (
        <Alert>تعذّر تحميل أوراق العمل.</Alert>
      ) : !worksheets?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          لا توجد أوراق عمل.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map((w) => (
            <Card key={w.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-heading">{w.title}</p>
                  {w.is_published && <Badge variant="success">منشورة</Badge>}
                </div>
                {w.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{w.description}</p>}
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/worksheets/${w.id}/present`}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-green px-3 text-sm text-white hover:bg-brand-green-hover"
                  >
                    <Play className="h-4 w-4" />
                    عرض
                  </Link>
                  {w.owner_id === myId && (
                    <Link
                      to={`/worksheets/${w.id}/edit`}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm text-heading hover:bg-background"
                    >
                      <SquarePen className="h-4 w-4" />
                      تحرير
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/worksheets/${id}/edit`)} />
    </div>
  );
}
