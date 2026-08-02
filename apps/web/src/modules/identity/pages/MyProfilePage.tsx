import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-heading">{value || '—'}</span>
    </div>
  );
}

export function MyProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  if (!profile) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-heading">ملفي الشخصي</h1>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">البيانات</h2>
        </CardHeader>
        <CardContent className="pt-0">
          <Row label="الاسم الثلاثي" value={profile.full_name} />
          <Row label="البريد الوزاري" value={profile.email} />
          <Row label="اسم المستخدم" value={profile.username} />
          <Row label="التخصص" value={profile.specialization} />
          <Row label="الجوال" value={profile.phone} />
          <Row label="المسمى الوظيفي" value={profile.job_title} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">الأمان</h2>
        </CardHeader>
        <CardContent>
          <Link
            to="/change-password"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-5 text-sm font-medium text-heading hover:bg-background"
          >
            <KeyRound className="h-4 w-4" />
            تغيير كلمة المرور
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
