import { useEffect, useMemo, useState } from 'react';
import { useCan } from '@/shared/hooks/usePermission';
import { Card, CardContent } from '@/shared/ui/Card';
import { Switch } from '@/shared/ui/Switch';
import { Pagination } from '@/shared/ui/Table';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { UsersToolbar } from '../components/UsersToolbar';
import { UsersTable } from '../components/UsersTable';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { useSetSetting, useSetUserStatus, useSetting, useUsers } from '../users.hooks';
import type { UserListItem, UsersQuery } from '../types/users.types';

const PAGE_SIZE = 20;

export function UsersListPage() {
  const canManage = useCan('users.manage');
  const canSettings = useCan('settings.manage');
  const toast = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useMemo<UsersQuery>(
    () => ({
      search,
      roleKey: roleKey || undefined,
      status: (status || undefined) as UsersQuery['status'],
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, roleKey, status, page],
  );

  const { data, isLoading, isError } = useUsers(query);
  const setStatusMutation = useSetUserStatus();

  const { data: emailVerification } = useSetting<boolean>('auth.email_verification_enabled');
  const setSetting = useSetSetting('auth.email_verification_enabled');

  function toggleStatus(user: UserListItem) {
    const next = user.status === 'active' ? 'suspended' : 'active';
    setStatusMutation.mutate(
      { id: user.id, status: next },
      {
        onSuccess: () => toast.success(next === 'active' ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.'),
        onError: () => toast.error('تعذّر تحديث الحالة.'),
      },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-heading">المستخدمون</h1>
        <p className="text-sm text-muted">إدارة حسابات منسوبي المدرسة وأدوارهم.</p>
      </div>

      {canSettings && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-heading">التحقق من البريد الإلكتروني</p>
              <p className="text-xs text-muted">عند التفعيل، يؤكّد الحساب الجديد بريده قبل أول دخول.</p>
            </div>
            <Switch
              checked={!!emailVerification}
              onCheckedChange={(v) => setSetting.mutate(v, { onSuccess: () => toast.success('تم حفظ الإعداد.') })}
            />
          </CardContent>
        </Card>
      )}

      <UsersToolbar
        search={searchInput}
        roleKey={roleKey}
        status={status}
        onSearch={setSearchInput}
        onRole={(v) => {
          setRoleKey(v);
          setPage(1);
        }}
        onStatus={(v) => {
          setStatus(v);
          setPage(1);
        }}
        onCreate={() => setCreateOpen(true)}
        canManage={canManage}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError || !data ? (
        <Alert>تعذّر تحميل المستخدمين.</Alert>
      ) : (
        <>
          <UsersTable users={data.rows} canManage={canManage} onToggleStatus={toggleStatus} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
        </>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
