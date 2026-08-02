import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import { Alert } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { useCreateEvidence, useIndicators, useStandards, useUpdateEvidence } from '../evidence.hooks';
import type { EvidenceDetail } from '../types/evidence.types';

const schema = z.object({
  standard_id: z.string().min(1, 'اختر المعيار.'),
  indicator_id: z.string().optional(),
  title: z.string().min(3, 'أدخل عنوانًا واضحًا للشاهد.'),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  evidence?: EvidenceDetail;
  onCreated?: (id: string) => void;
}

export function EvidenceEditorDialog({ open, onOpenChange, evidence, onCreated }: Props) {
  const isEdit = !!evidence;
  const { data: standards } = useStandards();
  const toast = useToast();
  const create = useCreateEvidence();
  const update = useUpdateEvidence(evidence?.id ?? '');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      standard_id: evidence?.standard_id ?? '',
      indicator_id: evidence?.indicator_id ?? '',
      title: evidence?.title ?? '',
      description: evidence?.description ?? '',
    },
  });

  const standardId = watch('standard_id');
  const { data: indicators } = useIndicators(standardId || undefined);
  const pending = create.isPending || update.isPending;
  const error = (create.error ?? update.error) as Error | null;

  function submit(values: FormValues) {
    const payload = {
      standard_id: values.standard_id,
      indicator_id: values.indicator_id || null,
      title: values.title,
      description: values.description || null,
    };
    if (isEdit) {
      update.mutate(payload, {
        onSuccess: () => {
          toast.success('تم حفظ الشاهد.');
          onOpenChange(false);
        },
      });
    } else {
      create.mutate(
        { standard_id: payload.standard_id, indicator_id: payload.indicator_id, title: payload.title, description: payload.description ?? undefined },
        {
          onSuccess: (res) => {
            toast.success('تم إنشاء الشاهد كمسودة.');
            reset();
            onOpenChange(false);
            onCreated?.(res.id);
          },
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEdit ? 'تعديل الشاهد' : 'شاهد جديد'}>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {error && <Alert>{error.message}</Alert>}

          <div>
            <Label htmlFor="standard_id">المعيار</Label>
            <Select id="standard_id" {...register('standard_id')} aria-invalid={!!errors.standard_id}>
              <option value="">اختر المعيار…</option>
              {standards?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </Select>
            {errors.standard_id && <p className="mt-1 text-xs text-danger">{errors.standard_id.message}</p>}
          </div>

          {indicators && indicators.length > 0 && (
            <div>
              <Label htmlFor="indicator_id">المؤشر (اختياري)</Label>
              <Select id="indicator_id" {...register('indicator_id')}>
                <option value="">بدون مؤشر محدد</option>
                {indicators.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name_ar}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="title">عنوان الشاهد</Label>
            <Input id="title" {...register('title')} aria-invalid={!!errors.title} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">وصف مختصر (اختياري)</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="flex justify-start gap-2 pt-2">
            <Button type="submit" loading={pending}>
              {isEdit ? 'حفظ' : 'إنشاء'}
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
