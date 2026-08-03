import { Card, CardContent } from '@/shared/ui/Card';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/file_000000000910820aaccc0cbc01b1c6de.png"
            alt="ثانوية الأمير عبدالمجيد الأولى"
            className="mx-auto mb-4 h-28 w-auto object-contain"
          />
          <h1 className="text-lg font-bold text-heading sm:text-xl">ثانوية الأمير عبدالمجيد الأولى</h1>
          <p className="mt-1 text-sm text-muted">مساحة العمل الداخلية للمنسوبين</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-1 text-lg font-semibold text-heading">تسجيل الدخول</h2>
            <p className="mb-5 text-sm text-body">أدخل بياناتك للوصول إلى حسابك.</p>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          جميع الحقوق محفوظة — ثانوية الأمير عبدالمجيد الأولى
        </p>
      </div>
    </div>
  );
}
