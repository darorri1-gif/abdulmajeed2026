import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import {
  useAssignTeacher,
  useClassStudents,
  useClassTeachers,
  useEnrollStudent,
  useRemoveAssignment,
  useRemoveEnrollment,
  useStaff,
  useStudents,
  useSubjects,
} from '../org.hooks';
import type { ClassRow } from '../types/org.types';

export function ClassManageDialog({ cls, onClose }: { cls: ClassRow; onClose: () => void }) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const { data: enrolled, isLoading: loadingStudents } = useClassStudents(cls.id);
  const { data: found } = useStudents(search);
  const { data: teachers } = useClassTeachers(cls.id);
  const { data: staff } = useStaff();
  const { data: subjects } = useSubjects();

  const enroll = useEnrollStudent(cls.id);
  const removeEnroll = useRemoveEnrollment(cls.id);
  const assign = useAssignTeacher(cls.id);
  const removeAssign = useRemoveAssignment(cls.id);

  const enrolledIds = new Set((enrolled ?? []).map((e) => e.student.id));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent title={`إدارة الفصل: ${cls.name}`} className="max-w-2xl">
        <div className="space-y-6">
          {/* Students */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-heading">الطلاب</h3>
            {loadingStudents ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <ul className="mb-3 divide-y divide-border rounded-lg border border-border">
                {(enrolled ?? []).length === 0 && <li className="p-3 text-sm text-muted">لا يوجد طلاب مسجّلون.</li>}
                {(enrolled ?? []).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 p-2.5">
                    <span className="text-sm text-heading">{e.student.full_name}</span>
                    <button
                      onClick={() => removeEnroll.mutate(e.id, { onSuccess: () => toast.success('تم الحذف.') })}
                      className="p-1.5 text-body hover:text-danger"
                      aria-label="إزالة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Input placeholder="ابحث عن طالب لإضافته…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search.trim() && (
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border">
                {(found ?? [])
                  .filter((s) => !enrolledIds.has(s.id))
                  .map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 p-2.5">
                      <span className="text-sm text-body">{s.full_name}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          enroll.mutate(s.id, {
                            onSuccess: () => toast.success('تم التسجيل.'),
                            onError: (err) => toast.error((err as Error).message),
                          })
                        }
                      >
                        <UserPlus className="h-4 w-4" />
                        إضافة
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* Teachers */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-heading">المعلمون</h3>
            <ul className="mb-3 divide-y divide-border rounded-lg border border-border">
              {(teachers ?? []).length === 0 && <li className="p-3 text-sm text-muted">لا يوجد معلمون مُسندون.</li>}
              {(teachers ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 p-2.5">
                  <span className="text-sm text-heading">
                    {t.teacher?.full_name}
                    {t.subject?.name_ar ? <span className="text-muted"> · {t.subject.name_ar}</span> : null}
                  </span>
                  <button
                    onClick={() => removeAssign.mutate(t.id, { onSuccess: () => toast.success('تم الحذف.') })}
                    className="p-1.5 text-body hover:text-danger"
                    aria-label="إزالة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} aria-label="المعلم">
                <option value="">اختر المعلم…</option>
                {staff?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </Select>
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="المادة">
                <option value="">بدون مادة</option>
                {subjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </Select>
              <Button
                className="shrink-0"
                disabled={!teacherId}
                loading={assign.isPending}
                onClick={() =>
                  assign.mutate(
                    { teacherId, subjectId: subjectId || null },
                    {
                      onSuccess: () => {
                        toast.success('تم الإسناد.');
                        setTeacherId('');
                        setSubjectId('');
                      },
                      onError: (err) => toast.error((err as Error).message),
                    },
                  )
                }
              >
                إسناد
              </Button>
            </div>
          </section>

          <div className="flex justify-start">
            <Button variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
