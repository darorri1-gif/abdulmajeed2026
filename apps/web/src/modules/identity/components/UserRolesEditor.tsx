import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/toast';
import { useRoles, useSetUserRoles } from '../users.hooks';
import type { UserDetail } from '../types/users.types';

export function UserRolesEditor({ user }: { user: UserDetail }) {
  const { data: roles } = useRoles();
  const mutation = useSetUserRoles(user.id);
  const toast = useToast();

  const initial = user.user_roles.map((ur) => ur.role.id);
  const [selected, setSelected] = useState<string[]>(initial);

  // Re-sync when the user record refreshes.
  useEffect(() => {
    setSelected(user.user_roles.map((ur) => ur.role.id));
  }, [user.id, user.user_roles]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  const dirty =
    selected.length !== initial.length || selected.some((id) => !initial.includes(id));

  function save() {
    mutation.mutate(selected, { onSuccess: () => toast.success('تم تحديث الأدوار.') });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {roles?.map((r) => {
          const active = selected.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              className={
                'rounded-full border px-3 py-1.5 text-sm transition-colors ' +
                (active
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-border text-body hover:bg-background')
              }
            >
              {r.name_ar}
            </button>
          );
        })}
      </div>
      <Button onClick={save} loading={mutation.isPending} disabled={!dirty}>
        حفظ الأدوار
      </Button>
    </div>
  );
}
