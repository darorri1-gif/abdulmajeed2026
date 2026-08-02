import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/shared/ui/Card';

/**
 * Landing screen after sign-in. It renders the real signed-in profile.
 * The Personal Dashboard module replaces this content in a later feature.
 */
export function HomePage() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-heading">مرحبًا، {profile?.full_name}</h1>
      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">البريد الوزاري</dt>
              <dd className="text-heading">{profile?.email}</dd>
            </div>
            <div>
              <dt className="text-muted">التخصص</dt>
              <dd className="text-heading">{profile?.specialization}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-body">
            تم تسجيل دخولك بنجاح. ستظهر لوحة التحكم الشخصية هنا بعد بناء وحدتها.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
