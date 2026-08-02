import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { Switch } from '@/shared/ui/Switch';
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/Table';
import type { UserListItem } from '../types/users.types';

interface Props {
  users: UserListItem[];
  canManage: boolean;
  onToggleStatus: (user: UserListItem) => void;
}

function RolesBadges({ roles }: { roles: UserListItem['roles'] }) {
  if (!roles.length) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r.key}>{r.name_ar}</Badge>
      ))}
    </div>
  );
}

function StatusCell({ user, canManage, onToggle }: { user: UserListItem; canManage: boolean; onToggle: () => void }) {
  if (canManage) {
    return (
      <div className="flex items-center gap-2">
        <Switch checked={user.status === 'active'} onCheckedChange={onToggle} aria-label="الحالة" />
        <span className="text-xs text-muted">{user.status === 'active' ? 'نشط' : 'موقوف'}</span>
      </div>
    );
  }
  return <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status === 'active' ? 'نشط' : 'موقوف'}</Badge>;
}

export function UsersTable({ users, canManage, onToggleStatus }: Props) {
  if (!users.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        لا توجد نتائج مطابقة.
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden rounded-2xl border border-border bg-surface md:block">
        <Table>
          <THead>
            <TR>
              <TH>الاسم</TH>
              <TH>الأدوار</TH>
              <TH>التخصص</TH>
              <TH>الحالة</TH>
              <TH className="text-end">—</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="font-medium">{u.full_name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </TD>
                <TD>
                  <RolesBadges roles={u.roles} />
                </TD>
                <TD className="text-body">{u.specialization}</TD>
                <TD>
                  <StatusCell user={u} canManage={canManage} onToggle={() => onToggleStatus(u)} />
                </TD>
                <TD className="text-end">
                  <Link to={`/users/${u.id}`} className="inline-flex items-center gap-1 text-sm text-brand-green hover:underline">
                    عرض
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="grid gap-3 md:hidden">
        {users.map((u) => (
          <Link
            key={u.id}
            to={`/users/${u.id}`}
            className="rounded-2xl border border-border bg-surface p-4 active:bg-background"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-heading">{u.full_name}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
              <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                {u.status === 'active' ? 'نشط' : 'موقوف'}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-body">{u.specialization}</div>
            <div className="mt-2">
              <RolesBadges roles={u.roles} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
