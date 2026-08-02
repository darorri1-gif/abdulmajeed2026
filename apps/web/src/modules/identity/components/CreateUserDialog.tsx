import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { Alert } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { useCreateUser, useRoles } from '../users.hooks';

const schema = z.object({
  full_name: z.string().min(3, 'أدخل الاسم الثلاثي.'),
  email: z.string().email('أدخل بريدًا وزاريًا صحيحًا.'),
  username: z.string().optional(),
  specialization: z.string().min(1, 'أدخل التخصص.'),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف.'),
  role_keys: z.array(z.string()).min(1, 'اختر دورًا واحدًا على الأقل.'),
});

type FormValues = z.infer<typeof schema>;

export function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: roles } = useRoles();
  const mutation = useCreateUser();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role_keys: [] } });

  const selected = watch('role_keys');

  function toggleRole(key: string) {
    setValue(
      'role_keys',
      selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key],
      { shouldValidate: true },
    );
  }

  function submit(values: FormValues) {
    mutation.mutate(
      { ...values, username: values.username?.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('تم إنشاء الحساب بنجاح.');
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="مستخدم جديد" description="سيُطلب من المستخدم تغيير كلمة المرور عند أول دخول.">
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {mutation.isError && <Alert>{(mutation.error as Error).message}</Alert>}

          <div>
            <Label htmlFor="full_name">الاسم الثلاثي</Label>
            <Input id="full_name" {...register('full_name')} aria-invalid={!!errors.full_name} />
            {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">البريد الوزاري</Label>
              <Input id="email" type="email" dir="ltr" {...register('email')} aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="username">اسم المستخدم (اختياري)</Label>
              <Input id="username" dir="ltr" {...register('username')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="specialization">التخصص</Label>
              <Input id="specialization" {...register('specialization')} aria-invalid={!!errors.specialization} />
              {errors.specialization && <p className="mt-1 text-xs text-danger">{errors.specialization.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور المؤقتة</Label>
              <PasswordInput id="password" autoComplete="new-password" {...register('password')} aria-invalid={!!errors.password} />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <Label>الأدوار</Label>
            <div className="flex flex-wrap gap-2">
              {roles?.map((r) => {
                const active = selected.includes(r.key);
                return (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => toggleRole(r.key)}
                    className={
                      'rounded-full border px-3 py-1.5 text-sm transition-colors ' +
                      (active
                        ? 'border-brand-green bg-brand-green/10 text-brand-green'
                        : 'border-border text-body hover:bg-background')
                    }
                  >
                    {r.name_ar}
                  </button>
                );
              })}
            </div>
            {errors.role_keys && <p className="mt-1 text-xs text-danger">{errors.role_keys.message as string}</p>}
          </div>

          <div className="flex justify-start gap-2 pt-2">
            <Button type="submit" loading={mutation.isPending}>
              إنشاء الحساب
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
