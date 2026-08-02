import { useEffect, useState } from 'react';
import { Label } from '@/shared/ui/Label';
import { Select } from '@/shared/ui/Select';
import { useRoles, useStaff } from '../followup.hooks';
import type { VisibilityGrant } from '../types/followup.types';

/**
 * Emits the visibility grants array. Default = teacher only (no grants),
 * which the database treats as fully private.
 */
export function VisibilitySelector({ onChange }: { onChange: (grants: VisibilityGrant[]) => void }) {
  const { data: roles } = useRoles();
  const { data: staff } = useStaff();
  const [mode, setMode] = useState('teacher_only');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const roleId = (key: string) => roles?.find((r) => r.key === key)?.id;
    let grants: VisibilityGrant[] = [];
    if (mode === 'leadership_team') grants = [{ type: 'leadership_team' }];
    else if (mode === 'user') grants = userId ? [{ type: 'user', user_id: userId }] : [];
    else if (mode.startsWith('role:')) {
      const id = roleId(mode.slice(5));
      grants = id ? [{ type: 'role', role_id: id }] : [];
    }
    onChange(grants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, userId, roles]);

  return (
    <div className="space-y-2">
      <Label>من يمكنه الاطلاع؟</Label>
      <Select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="teacher_only">أنا فقط (خاص)</option>
        <option value="leadership_team">فريق قيادة المدرسة</option>
        <option value="role:vice_principal">جميع الوكلاء</option>
        <option value="role:counselor">الموجّه الطلابي</option>
        <option value="role:admin_staff">الإداريون</option>
        <option value="user">مستخدم محدد…</option>
      </Select>
      {mode === 'user' && (
        <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">اختر المستخدم…</option>
          {staff?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </Select>
      )}
      <p className="text-xs text-muted">الافتراضي خاص بك تمامًا؛ لا يطّلع عليه أحد إلا بمشاركتك.</p>
    </div>
  );
}
