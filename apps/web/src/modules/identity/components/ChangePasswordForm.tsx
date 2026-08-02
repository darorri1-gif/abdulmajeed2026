import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Label } from '@/shared/ui/Label';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { Alert } from '@/shared/ui/feedback';
import { useChangePasswordMutation } from '../hooks';

const schema = z
  .object({
    newPassword: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف.'),
    confirm: z.string().min(1, 'أعد إدخال كلمة المرور.'),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: 'كلمتا المرور غير متطابقتين.',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const mutation = useChangePasswordMutation();

  return (
    <form
      onSubmit={handleSubmit((values) =>
        mutation.mutate(values.newPassword, { onSuccess: () => onDone?.() }),
      )}
      className="space-y-4"
      noValidate
    >
      {mutation.isError && <Alert>{(mutation.error as Error).message}</Alert>}

      <div>
        <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
        <PasswordInput id="newPassword" autoComplete="new-password" {...register('newPassword')} />
        {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
      </div>

      <div>
        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
        <PasswordInput id="confirm" autoComplete="new-password" {...register('confirm')} />
        {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={mutation.isPending}>
        حفظ كلمة المرور
      </Button>
    </form>
  );
}
