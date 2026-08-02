import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { ItemPresenter } from '../components/ItemPresenter';
import { useWorksheet } from '../worksheets.hooks';

export function WorksheetPresentPage() {
  const { id = '' } = useParams();
  const { data, isLoading, isError } = useWorksheet(id);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !data) return <Alert>تعذّر تحميل ورقة العمل.</Alert>;

  const { worksheet, items } = data;

  if (!items.length) {
    return (
      <div className="space-y-4">
        <Alert>لا توجد عناصر في هذه الورقة بعد.</Alert>
        <Link to={`/worksheets/${id}/edit`} className="text-sm text-brand-green hover:underline">
          إضافة عناصر
        </Link>
      </div>
    );
  }

  const item = items[Math.min(index, items.length - 1)];

  function go(dir: -1 | 1) {
    setRevealed(false);
    setIndex((i) => Math.max(0, Math.min(items.length - 1, i + dir)));
  }

  const canReveal = item.type === 'multiple_choice' || item.type === 'short_answer';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <span className="truncate text-sm font-semibold text-heading">{worksheet.title}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted">
            {index + 1} / {items.length}
          </span>
          <Link to="/worksheets" className="rounded-lg p-2 text-body hover:bg-background" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <ItemPresenter item={item} revealed={revealed} />
      </main>

      <footer className="flex items-center justify-between border-t border-border bg-surface px-4 py-3">
        <Button variant="secondary" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>

        {canReveal ? (
          <Button variant={revealed ? 'secondary' : 'primary'} onClick={() => setRevealed((r) => !r)}>
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {revealed ? 'إخفاء الإجابة' : 'كشف الإجابة'}
          </Button>
        ) : (
          <span />
        )}

        <Button variant="secondary" onClick={() => go(1)} disabled={index === items.length - 1}>
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
