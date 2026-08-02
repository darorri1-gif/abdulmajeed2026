import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, KeyRound } from 'lucide-react';
import { useCan } from '@/shared/hooks/usePermission';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { UserEditForm } from '../components/UserEditForm';
import { UserRolesEditor } from '../components/UserRolesEditor';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { useSetUserStatus, useUserDetail } from '../users.hooks';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const { data: user, isLoading, isError } = useUserDetail(id);
  const canManage = useCan('users.manage');
  const setStatus = useSetUserStatus();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !user) return <Alert>تعذّر تحميل بيانات المستخدم.</Alert>;

  function toggleStatus() {
    if (!user) return;
    const next = user.status === 'active' ? 'suspended' : 'active';
    setStatus.mutate(
      { id: user.id, status: next },
      { onSuccess: () => toast.success(next === 'active' ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.') },
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/users" className="inline-flex items-center gap-1 text-sm text-body hover:text-heading">
        <ArrowRight className="h-4 w-4" />
        عودة للمستخدمين
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">{user.full_name}</h1>
          <p className="text-sm text-muted" dir="ltr">
            {user.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
            {user.status === 'active' ? 'نشط' : 'موقوف'}
          </Badge>
          {user.must_change_password && <Badge variant="warning">بانتظار تغيير كلمة المرور</Badge>}
        </div>
      </div>

      {canManage ? (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-heading">البيانات الأساسية</h2>
            </CardHeader>
            <CardContent>
              <UserEditForm user={user} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-heading">الأدوار</h2>
            </CardHeader>
            <CardContent>
              <UserRolesEditor user={user} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-heading">إجراءات الحساب</h2>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                <KeyRound className="h-4 w-4" />
                إعادة تعيين كلمة المرور
              </Button>
              <Button
                variant={user.status === 'active' ? 'destructive' : 'primary'}
                onClick={toggleStatus}
                loading={setStatus.isPending}
              >
                {user.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
              </Button>
            </CardContent>
          </Card>

          <ResetPasswordDialog userId={user.id} open={resetOpen} onOpenChange={setResetOpen} />
        </>
      ) : (
        <Card>
          <CardContent className="space-y-2 py-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">التخصص</span>
              <span className="font-medium text-heading">{user.specialization}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">الأدوار</span>
              <span className="font-medium text-heading">
                {user.user_roles.map((ur) => ur.role.name_ar).join('، ') || '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
