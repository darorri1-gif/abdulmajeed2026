import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Alert } from '@/shared/ui/feedback';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/ui/toast';
import { VisibilitySelector } from './VisibilitySelector';
import { useCategories, useClassStudents, useCreateEntry, useMyClasses } from '../followup.hooks';
import type { StudentRef, VisibilityGrant } from '../types/followup.types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When provided, the entry is scoped to this single student. */
  student?: StudentRef;
}

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function QuickEntryDialog({ open, onOpenChange, student }: Props) {
  const { data: categories } = useCategories();
  const { data: classes } = useMyClasses();
  const create = useCreateEntry();
  const toast = useToast();

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [occurredAt, setOccurredAt] = useState(toLocalInput(new Date()));
  const [grants, setGrants] = useState<VisibilityGrant[]>([]);

  // Scope (only when no fixed student)
  const [scopeType, setScopeType] = useState<'class' | 'students'>('class');
  const [classId, setClassId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { data: classStudents } = useClassStudents(scopeType === 'students' ? classId : undefined);

  const canSubmit = useMemo(() => {
    if (!categoryId) return false;
    if (student) return true;
    if (scopeType === 'class') return !!classId;
    return selected.length > 0;
  }, [categoryId, student, scopeType, classId, selected]);

  function reset() {
    setCategoryId('');
    setTitle('');
    setBody('');
    setOccurredAt(toLocalInput(new Date()));
    setGrants([]);
    setScopeType('class');
    setClassId('');
    setSelected([]);
  }

  function submit() {
    const payload = {
      category_id: categoryId,
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      occurred_at: new Date(occurredAt).toISOString(),
      grants,
      class_id: student ? null : scopeType === 'class' ? classId : null,
      student_ids: student ? [student.id] : scopeType === 'students' ? selected : null,
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success('تم تسجيل المتابعة.');
        reset();
        onOpenChange(false);
      },
      onError: (err) => toast.error((err as Error).message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="تسجيل متابعة"
        description={student ? `عن الطالب: ${student.full_name}` : undefined}
        className="max-w-xl"
      >
        <div className="space-y-4">
          {create.isError && <Alert>{(create.error as Error).message}</Alert>}

          <div>
            <Label htmlFor="category">النوع</Label>
            <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">اختر النوع…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </Select>
          </div>

          {!student && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['class', 'students'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setScopeType(t)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm transition-colors',
                      scopeType === t ? 'bg-brand-green/10 text-brand-green' : 'text-body hover:bg-background',
                    )}
                  >
                    {t === 'class' ? 'فصل كامل' : 'طلاب محددون'}
                  </button>
                ))}
              </div>

              <Select value={classId} onChange={(e) => { setClassId(e.target.value); setSelected([]); }}>
                <option value="">اختر الفصل…</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>

              {scopeType === 'students' && classId && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2">
                  {(classStudents ?? []).map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-body">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-green"
                        checked={selected.includes(s.id)}
                        onChange={() =>
                          setSelected((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))
                        }
                      />
                      {s.full_name}
                    </label>
                  ))}
                  {classStudents && classStudents.length === 0 && (
                    <p className="p-2 text-xs text-muted">لا يوجد طلاب في هذا الفصل.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="title">عنوان مختصر (اختياري)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="body">التفاصيل</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="occurred">التاريخ والوقت</Label>
            <Input id="occurred" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>

          <VisibilitySelector onChange={setGrants} />

          <div className="flex justify-start gap-2 pt-2">
            <Button onClick={submit} loading={create.isPending} disabled={!canSubmit}>
              حفظ
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
