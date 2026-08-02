import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Alert } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { useUpdateUser } from '../users.hooks';
import type { UserDetail } from '../types/users.types';

const schema = z.object({
  full_name: z.string().min(3, 'أدخل الاسم الثلاثي.'),
  specialization: z.string().min(1, 'أدخل التخصص.'),
  username: z.string().optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UserEditForm({ user }: { user: UserDetail }) {
  const mutation = useUpdateUser(user.id);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user.full_name,
      specialization: user.specialization,
      username: user.username ?? '',
      phone: user.phone ?? '',
      job_title: user.job_title ?? '',
    },
  });

  function submit(values: FormValues) {
    mutation.mutate(
      {
        full_name: values.full_name,
        specialization: values.specialization,
        username: values.username?.trim() || null,
        phone: values.phone?.trim() || null,
        job_title: values.job_title?.trim() || null,
      },
      { onSuccess: () => toast.success('تم حفظ التعديلات.') },
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {mutation.isError && <Alert>{(mutation.error as Error).message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">الاسم الثلاثي</Label>
          <Input id="full_name" {...register('full_name')} aria-invalid={!!errors.full_name} />
          {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="specialization">التخصص</Label>
          <Input id="specialization" {...register('specialization')} aria-invalid={!!errors.specialization} />
          {errors.specialization && <p className="mt-1 text-xs text-danger">{errors.specialization.message}</p>}
        </div>
        <div>
          <Label htmlFor="username">اسم المستخدم</Label>
          <Input id="username" dir="ltr" {...register('username')} />
        </div>
        <div>
          <Label htmlFor="phone">الجوال</Label>
          <Input id="phone" dir="ltr" {...register('phone')} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="job_title">المسمى الوظيفي</Label>
          <Input id="job_title" {...register('job_title')} />
        </div>
      </div>

      <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
        حفظ التعديلات
      </Button>
    </form>
  );
}
