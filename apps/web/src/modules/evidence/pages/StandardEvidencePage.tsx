import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { useCan } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceEditorDialog } from '../components/EvidenceEditorDialog';
import { useEvidenceList, useStandards } from '../evidence.hooks';
import type { EvidenceQuery } from '../types/evidence.types';

export function StandardEvidencePage() {
  const { standardId = '' } = useParams();
  const navigate = useNavigate();
  const canCreate = useCan('evidence.create');
  const canSeeAll = useCan('evidence.view_all') || useCan('evidence.review');

  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: standards } = useStandards();
  const standard = useMemo(() => standards?.find((s) => s.id === standardId), [standards, standardId]);

  const query = useMemo<EvidenceQuery>(() => ({ scope, standardId }), [scope, standardId]);
  const { data: evidence, isLoading, isError } = useEvidenceList(query);

  return (
    <div className="space-y-5">
      <Link to="/evidence" className="inline-flex items-center gap-1 text-sm text-body hover:text-heading">
        <ArrowRight className="h-4 w-4" />
        عودة للمعايير
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">{standard?.name_ar ?? 'المعيار'}</h1>
          <p className="text-sm text-muted">شواهد هذا المعيار.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            شاهد جديد لهذا المعيار
          </Button>
        )}
      </div>

      {canSeeAll && (
        <Select className="sm:w-48" value={scope} onChange={(e) => setScope(e.target.value as 'mine' | 'all')} aria-label="النطاق">
          <option value="mine">شواهدي</option>
          <option value="all">كل الشواهد</option>
        </Select>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError ? (
        <Alert>تعذّر تحميل الشواهد.</Alert>
      ) : !evidence?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted">لا توجد شواهد في هذا المعيار بعد.</p>
          {canCreate && (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              أضف أول شاهد
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {evidence.map((e) => (
            <Link
              key={e.id}
              to={`/evidence/${e.id}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-background"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">{e.title}</p>
                {scope === 'all' && e.teacher?.full_name && (
                  <p className="mt-1 text-xs text-muted">{e.teacher.full_name}</p>
                )}
              </div>
              <StatusBadge status={e.status} />
            </Link>
          ))}
        </div>
      )}

      <EvidenceEditorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStandardId={standardId}
        onCreated={(id) => navigate(`/evidence/${id}`)}
      />
    </div>
  );
}
