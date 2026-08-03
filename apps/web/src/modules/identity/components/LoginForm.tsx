import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { Alert } from '@/shared/ui/feedback';
import { useLoginMutation } from '../hooks';

const schema = z.object({
  identifier: z.string().min(1, 'أدخل البريد الإلكتروني أو اسم المستخدم.'),
  password: z.string().min(1, 'أدخل كلمة المرور.'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const mutation = useLoginMutation();

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
      {mutation.isError && <Alert>{(mutation.error as Error).message}</Alert>}

      <div>
        <Label htmlFor="identifier">البريد الإلكتروني أو اسم المستخدم</Label>
        <Input
          id="identifier"
          autoComplete="username"
          aria-invalid={!!errors.identifier}
          {...register('identifier')}
        />
        {errors.identifier && <p className="mt-1 text-xs text-danger">{errors.identifier.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={mutation.isPending}>
        تسجيل الدخول
      </Button>
    </form>
  );
}
