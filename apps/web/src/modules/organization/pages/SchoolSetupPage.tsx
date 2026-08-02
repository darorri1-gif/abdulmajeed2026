import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Select } from '@/shared/ui/Select';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/ui/toast';
import { ClassManageDialog } from '../components/ClassManageDialog';
import { useClasses, useCreateClass, useCreateStudent, useGradeLevels, useStudents } from '../org.hooks';
import type { ClassRow } from '../types/org.types';

const classSchema = z.object({ name: z.string().min(1, 'أدخل اسم الفصل.'), grade_level_id: z.string().optional() });
const studentSchema = z.object({
  full_name: z.string().min(3, 'أدخل اسم الطالب.'),
  student_number: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
});

function CreateClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: grades } = useGradeLevels();
  const create = useCreateClass();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="فصل جديد">
        <form
          onSubmit={handleSubmit((v) =>
            create.mutate(
              { name: v.name, gradeLevelId: v.grade_level_id || null },
              {
                onSuccess: () => {
                  toast.success('تم إنشاء الفصل.');
                  reset();
                  onOpenChange(false);
                },
                onError: (e) => toast.error((e as Error).message),
              },
            ),
          )}
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="name">اسم الفصل</Label>
            <Input id="name" placeholder="مثال: أول ثانوي/1" {...register('name')} aria-invalid={!!errors.name} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="grade_level_id">الصف</Label>
            <Select id="grade_level_id" {...register('grade_level_id')}>
              <option value="">بدون تحديد</option>
              {grades?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button type="submit" loading={create.isPending}>
              إنشاء
            </Button>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateStudentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateStudent();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="طالب جديد">
        <form
          onSubmit={handleSubmit((v) =>
            create.mutate(v, {
              onSuccess: () => {
                toast.success('تمت إضافة الطالب.');
                reset();
                onOpenChange(false);
              },
              onError: (e) => toast.error((e as Error).message),
            }),
          )}
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="full_name">اسم الطالب</Label>
            <Input id="full_name" {...register('full_name')} aria-invalid={!!errors.full_name} />
            {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="student_number">رقم الطالب</Label>
              <Input id="student_number" dir="ltr" {...register('student_number')} />
            </div>
            <div>
              <Label htmlFor="guardian_phone">جوال ولي الأمر</Label>
              <Input id="guardian_phone" dir="ltr" {...register('guardian_phone')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="guardian_name">اسم ولي الأمر</Label>
              <Input id="guardian_name" {...register('guardian_name')} />
            </div>
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button type="submit" loading={create.isPending}>
              إضافة
            </Button>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SchoolSetupPage() {
  const [tab, setTab] = useState<'classes' | 'students'>('classes');
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [managing, setManaging] = useState<ClassRow | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: students, isLoading: loadingStudents } = useStudents(studentSearch);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-heading">إعداد المدرسة</h1>
        <p className="text-sm text-muted">إدارة الفصول والطلاب وإسناد المعلمين.</p>
      </div>

      <div className="flex gap-2">
        {(['classes', 'students'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t ? 'bg-brand-green/10 text-brand-green' : 'text-body hover:bg-background',
            )}
          >
            {t === 'classes' ? 'الفصول' : 'الطلاب'}
          </button>
        ))}
      </div>

      {tab === 'classes' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateClassOpen(true)}>
              <Plus className="h-4 w-4" />
              فصل جديد
            </Button>
          </div>
          {loadingClasses ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !classes?.length ? (
            <Alert>لا توجد فصول بعد. ابدأ بإضافة فصل.</Alert>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-heading">{c.name}</p>
                      <p className="text-xs text-muted">{c.grade?.name_ar ?? '—'}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setManaging(c)}>
                      <Settings2 className="h-4 w-4" />
                      إدارة
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
              <Input
                className="ps-9"
                placeholder="ابحث بالاسم أو رقم الطالب"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateStudentOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              طالب جديد
            </Button>
          </div>
          {loadingStudents ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !students?.length ? (
            <Alert>لا يوجد طلاب مطابقون.</Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {students.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium text-heading">{s.full_name}</p>
                        <p className="text-xs text-muted">{s.student_number ?? '—'}</p>
                      </div>
                      {s.guardian_phone && <span className="text-xs text-muted" dir="ltr">{s.guardian_phone}</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreateClassDialog open={createClassOpen} onOpenChange={setCreateClassOpen} />
      <CreateStudentDialog open={createStudentOpen} onOpenChange={setCreateStudentOpen} />
      {managing && <ClassManageDialog cls={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}
