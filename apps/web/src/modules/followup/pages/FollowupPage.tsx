import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Spinner } from '@/shared/ui/feedback';
import { QuickEntryDialog } from '../components/QuickEntryDialog';
import { FollowupTimeline } from '../components/FollowupTimeline';
import { useClassStudents, useMyClasses, useMyRecentEntries, useMyStudents } from '../followup.hooks';

export function FollowupPage() {
  const { data: classes, isLoading: loadingClasses } = useMyClasses();
  const { data: recent, isLoading: loadingRecent } = useMyRecentEntries();
  const [addOpen, setAddOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  const { data: foundStudents } = useMyStudents(search);

  const [openClassId, setOpenClassId] = useState<string | null>(null);
  const { data: classStudents } = useClassStudents(openClassId ?? undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">متابعة الطلاب</h1>
          <p className="text-sm text-muted">سجّل ملاحظة في ثوانٍ. أنت تتحكّم بمن يطّلع عليها.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          تسجيل متابعة
        </Button>
      </div>

      {/* Quick student search */}
      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
        <Input
          className="ps-9"
          placeholder="ابحث عن طالب للانتقال إلى سجله"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {search.trim() && foundStudents && foundStudents.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            {foundStudents.map((s) => (
              <Link
                key={s.id}
                to={`/followup/students/${s.id}`}
                className="flex items-center justify-between gap-2 border-b border-border p-3 last:border-0 hover:bg-background"
              >
                <span className="text-sm text-heading">{s.full_name}</span>
                <span className="text-xs text-muted">{s.class_name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Classroom overview */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-heading">فصولي</h2>
        {loadingClasses ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !classes?.length ? (
          <p className="text-sm text-muted">لا توجد فصول مُسندة إليك.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenClassId((prev) => (prev === c.id ? null : c.id))}
                className="rounded-2xl border border-border bg-surface p-4 text-start hover:bg-background"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-heading">{c.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3.5 w-3.5" />
                    {c.student_count}
                  </span>
                </div>
                <span className="text-xs text-muted">{c.grade_name ?? ''}</span>
              </button>
            ))}
          </div>
        )}

        {openClassId && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            {(classStudents ?? []).map((s) => (
              <Link
                key={s.id}
                to={`/followup/students/${s.id}`}
                className="flex items-center justify-between gap-2 border-b border-border bg-surface p-3 last:border-0 hover:bg-background"
              >
                <span className="text-sm text-heading">{s.full_name}</span>
                <ChevronLeft className="h-4 w-4 text-muted" />
              </Link>
            ))}
            {classStudents && classStudents.length === 0 && (
              <p className="bg-surface p-3 text-sm text-muted">لا يوجد طلاب في هذا الفصل.</p>
            )}
          </div>
        )}
      </section>

      {/* Recent entries */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-heading">أحدث ما سجّلت</h2>
        {loadingRecent ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <FollowupTimeline entries={recent ?? []} />
        )}
      </section>

      <QuickEntryDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
