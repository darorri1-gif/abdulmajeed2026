import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useCan } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { StandardsBoard } from '../components/StandardsBoard';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceEditorDialog } from '../components/EvidenceEditorDialog';
import { useEvidenceList, useStandards } from '../evidence.hooks';
import type { EvidenceQuery, EvidenceStatus } from '../types/evidence.types';

export function EvidencePage() {
  const canCreate = useCan('evidence.create');
  const canViewAll = useCan('evidence.view_all');
  const canReview = useCan('evidence.review');
  const canSeeAll = canViewAll || canReview;
  const navigate = useNavigate();

  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeStandard, setActiveStandard] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useMemo<EvidenceQuery>(
    () => ({ scope, status: (status || undefined) as EvidenceStatus | undefined, search }),
    [scope, status, search],
  );

  const { data: standards } = useStandards();
  const { data: evidence, isLoading, isError } = useEvidenceList(query);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of evidence ?? []) map[e.standard_id] = (map[e.standard_id] ?? 0) + 1;
    return map;
  }, [evidence]);

  const visible = useMemo(
    () => (activeStandard ? (evidence ?? []).filter((e) => e.standard_id === activeStandard) : evidence ?? []),
    [evidence, activeStandard],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">الشواهد</h1>
          <p className="text-sm text-muted">توثيق الشواهد وفق معايير تمام الأحد عشر.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            شاهد جديد
          </Button>
        )}
      </div>

      {standards && (
        <StandardsBoard
          standards={standards}
          counts={counts}
          total={evidence?.length ?? 0}
          activeStandardId={activeStandard}
          onSelect={setActiveStandard}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
          <Input
            className="ps-9"
            placeholder="بحث بعنوان الشاهد"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select className="sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="الحالة">
          <option value="">كل الحالات</option>
          <option value="draft">مسودة</option>
          <option value="submitted">بانتظار المراجعة</option>
          <option value="approved">معتمد</option>
          <option value="needs_revision">يحتاج تعديل</option>
          <option value="rejected">مرفوض</option>
        </Select>
        {canSeeAll && (
          <Select className="sm:w-40" value={scope} onChange={(e) => setScope(e.target.value as 'mine' | 'all')} aria-label="النطاق">
            <option value="mine">شواهدي</option>
            <option value="all">كل الشواهد</option>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError ? (
        <Alert>تعذّر تحميل الشواهد.</Alert>
      ) : !visible.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          لا توجد شواهد مطابقة.
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((e) => (
            <Link
              key={e.id}
              to={`/evidence/${e.id}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-background"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">{e.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {e.standard?.name_ar}
                  {scope === 'all' && e.teacher?.full_name ? ` · ${e.teacher.full_name}` : ''}
                </p>
              </div>
              <StatusBadge status={e.status} />
            </Link>
          ))}
        </div>
      )}

      <EvidenceEditorDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/evidence/${id}`)} />
    </div>
  );
}
