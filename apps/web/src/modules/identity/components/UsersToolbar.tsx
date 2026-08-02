import { Search, UserPlus } from 'lucide-react';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { useRoles } from '../users.hooks';

interface Props {
  search: string;
  roleKey: string;
  status: string;
  onSearch: (v: string) => void;
  onRole: (v: string) => void;
  onStatus: (v: string) => void;
  onCreate: () => void;
  canManage: boolean;
}

export function UsersToolbar({ search, roleKey, status, onSearch, onRole, onStatus, onCreate, canManage }: Props) {
  const { data: roles } = useRoles();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted" />
        <Input
          className="ps-9"
          placeholder="بحث بالاسم أو البريد أو اسم المستخدم"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <Select className="sm:w-44" value={roleKey} onChange={(e) => onRole(e.target.value)} aria-label="الدور">
        <option value="">كل الأدوار</option>
        {roles?.map((r) => (
          <option key={r.key} value={r.key}>
            {r.name_ar}
          </option>
        ))}
      </Select>

      <Select className="sm:w-40" value={status} onChange={(e) => onStatus(e.target.value)} aria-label="الحالة">
        <option value="">كل الحالات</option>
        <option value="active">نشط</option>
        <option value="suspended">موقوف</option>
      </Select>

      {canManage && (
        <Button onClick={onCreate} className="shrink-0">
          <UserPlus className="h-4 w-4" />
          مستخدم جديد
        </Button>
      )}
    </div>
  );
}
