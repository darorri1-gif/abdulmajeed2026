import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { QuickEntryDialog } from '../components/QuickEntryDialog';
import { FollowupTimeline } from '../components/FollowupTimeline';
import { useCategories, useStudentBasic, useStudentTimeline } from '../followup.hooks';

export function StudentTimelinePage() {
  const { id = '' } = useParams();
  const { data: student, isLoading: loadingStudent, isError } = useStudentBasic(id);
  const { data: categories } = useCategories();

  const [categoryId, setCategoryId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const { data: entries, isLoading } = useStudentTimeline(id, {
    categoryId: categoryId || undefined,
    search: searchInput || undefined,
  });

  if (loadingStudent) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !student) return <Alert>تعذّر تحميل بيانات الطالب.</Alert>;

  return (
    <div className="space-y-5">
      <Link to="/followup" className="inline-flex items-center gap-1 text-sm text-body hover:text-heading">
        <ArrowRight className="h-4 w-4" />
        عودة للمتابعة
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">{student.full_name}</h1>
          {student.student_number && <p className="text-sm text-muted">{student.student_number}</p>}
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          تسجيل متابعة
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
          <Input
            className="ps-9"
            placeholder="بحث في المتابعات"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select className="sm:w-52" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="النوع">
          <option value="">كل الأنواع</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <FollowupTimeline entries={entries ?? []} showAuthor />
      )}

      <QuickEntryDialog open={addOpen} onOpenChange={setAddOpen} student={student} />
    </div>
  );
}
