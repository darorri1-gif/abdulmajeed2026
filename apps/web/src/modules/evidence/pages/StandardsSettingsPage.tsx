import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Textarea } from '@/shared/ui/Textarea';
import { Switch } from '@/shared/ui/Switch';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { useStandards, useUpdateStandard } from '../evidence.hooks';
import type { Standard } from '../types/evidence.types';

const schema = z.object({
  name_ar: z.string().min(2, 'أدخل اسم المعيار.'),
  description_ar: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function EditStandardDialog({ standard, onClose }: { standard: Standard; onClose: () => void }) {
  const update = useUpdateStandard();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name_ar: standard.name_ar, description_ar: standard.description_ar ?? '' },
  });

  function submit(values: FormValues) {
    update.mutate(
      { id: standard.id, patch: { name_ar: values.name_ar, description_ar: values.description_ar || null } },
      {
        onSuccess: () => {
          toast.success('تم حفظ المعيار.');
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent title="تعديل المعيار">
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {update.isError && <Alert>{(update.error as Error).message}</Alert>}
          <div>
            <Label htmlFor="name_ar">اسم المعيار</Label>
            <Input id="name_ar" {...register('name_ar')} aria-invalid={!!errors.name_ar} />
            {errors.name_ar && <p className="mt-1 text-xs text-danger">{errors.name_ar.message}</p>}
          </div>
          <div>
            <Label htmlFor="description_ar">وصف (اختياري)</Label>
            <Textarea id="description_ar" {...register('description_ar')} />
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button type="submit" loading={update.isPending}>
              حفظ
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StandardsSettingsPage() {
  const { data: standards, isLoading } = useStandards(false);
  const update = useUpdateStandard();
  const toast = useToast();
  const [editing, setEditing] = useState<Standard | null>(null);

  function toggleActive(s: Standard) {
    update.mutate(
      { id: s.id, patch: { is_active: !s.is_active } },
      { onSuccess: () => toast.success(s.is_active ? 'تم إخفاء المعيار.' : 'تم تفعيل المعيار.') },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-heading">إعداد المعايير</h1>
        <p className="text-sm text-muted">أسماء معايير تمام الأحد عشر قابلة للتعديل والتفعيل.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {standards?.map((s) => (
                <li key={s.id} className="flex items-center gap-3 p-4">
                  <span className="w-8 shrink-0 text-xs text-muted">{s.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-heading">{s.name_ar}</span>
                  <button
                    onClick={() => setEditing(s)}
                    className="p-1.5 text-body hover:text-brand-green"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} aria-label="مُفعّل" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {editing && <EditStandardDialog standard={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
