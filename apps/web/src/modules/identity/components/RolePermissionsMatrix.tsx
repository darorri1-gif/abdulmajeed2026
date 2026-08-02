import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { usePermissionsList, useRolePermissionIds, useRoles, useSetRolePermissions } from '../users.hooks';
import type { Permission } from '../types/users.types';

const MODULE_LABELS: Record<string, string> = {
  users: 'المستخدمون',
  roles: 'الأدوار والصلاحيات',
  evidence: 'الشواهد',
  followup: 'متابعة الطلاب',
  students: 'الطلاب',
  organization: 'الهيكل المدرسي',
  audit: 'سجل التدقيق',
  settings: 'الإعدادات',
  dashboard: 'لوحة التحكم',
};

function groupByModule(permissions: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of permissions) {
    (groups[p.module] ??= []).push(p);
  }
  return groups;
}

export function RolePermissionsMatrix() {
  const { data: roles } = useRoles();
  const { data: permissions } = usePermissionsList();
  const toast = useToast();

  const [roleId, setRoleId] = useState('');
  useEffect(() => {
    if (!roleId && roles?.length) setRoleId(roles[0].id);
  }, [roles, roleId]);

  const { data: assigned, isLoading } = useRolePermissionIds(roleId);
  const mutation = useSetRolePermissions(roleId);

  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (assigned) setSelected(assigned);
  }, [assigned, roleId]);

  const groups = useMemo(() => groupByModule(permissions ?? []), [permissions]);
  const dirty =
    !!assigned &&
    (selected.length !== assigned.length || selected.some((id) => !assigned.includes(id)));

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function save() {
    mutation.mutate(selected, { onSuccess: () => toast.success('تم حفظ صلاحيات الدور.') });
  }

  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <Select value={roleId} onChange={(e) => setRoleId(e.target.value)} aria-label="الدور">
          {roles?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name_ar}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(groups).map(([module, perms]) => (
            <div key={module} className="rounded-2xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-heading">{MODULE_LABELS[module] ?? module}</h3>
              <div className="space-y-2">
                {perms.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-green"
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    {p.name_ar}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={save} loading={mutation.isPending} disabled={!dirty}>
        حفظ الصلاحيات
      </Button>
    </div>
  );
}
