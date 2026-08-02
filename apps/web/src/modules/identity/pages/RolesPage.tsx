import { RolePermissionsMatrix } from '../components/RolePermissionsMatrix';

export function RolesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-heading">الأدوار والصلاحيات</h1>
        <p className="text-sm text-muted">تحكّم في الصلاحيات الممنوحة لكل دور في المنصة.</p>
      </div>
      <RolePermissionsMatrix />
    </div>
  );
}
