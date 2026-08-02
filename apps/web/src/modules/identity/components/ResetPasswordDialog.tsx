import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Label } from '@/shared/ui/Label';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { Alert } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { useResetPassword } from '../users.hooks';

const schema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف.'),
});
type FormValues = z.infer<typeof schema>;

export function ResetPasswordDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const mutation = useResetPassword();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function submit(values: FormValues) {
    mutation.mutate(
      { id: userId, password: values.password },
      {
        onSuccess: () => {
          toast.success('تم تعيين كلمة مرور مؤقتة. سيغيّرها المستخدم عند الدخول.');
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="إعادة تعيين كلمة المرور" description="سيُطلب من المستخدم تغييرها عند أول دخول.">
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {mutation.isError && <Alert>{(mutation.error as Error).message}</Alert>}
          <div>
            <Label htmlFor="new_password">كلمة المرور المؤقتة</Label>
            <PasswordInput id="new_password" autoComplete="new-password" {...register('password')} aria-invalid={!!errors.password} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button type="submit" loading={mutation.isPending}>
              تعيين
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
