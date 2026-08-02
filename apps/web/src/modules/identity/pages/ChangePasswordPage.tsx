import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/ui/Card';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-1 text-lg font-semibold text-heading">تحديث كلمة المرور</h2>
            <p className="mb-5 text-sm text-body">
              لأمان حسابك، يجب تعيين كلمة مرور جديدة قبل المتابعة.
            </p>
            <ChangePasswordForm onDone={() => navigate('/', { replace: true })} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
