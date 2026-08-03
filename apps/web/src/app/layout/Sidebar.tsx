import { NavLink } from 'react-router-dom';
import { Building2, ClipboardList, FileCheck2, Home, LayoutDashboard, ListChecks, MessagesSquare, NotebookPen, ServerCog, ShieldCheck, UserCircle, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  perm?: string;
  perms?: string[]; // any-of
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, perm: 'dashboard.view' },
  { to: '/followup', label: 'متابعة الطلاب', icon: NotebookPen, perm: 'followup.create' },
  { to: '/evidence', label: 'الشواهد', icon: FileCheck2, perms: ['evidence.create', 'evidence.view_all', 'evidence.review'] },
  { to: '/discussion', label: 'لوحة النقاش', icon: MessagesSquare },
  { to: '/worksheets', label: 'أوراق العمل', icon: ClipboardList },
  { to: '/school-setup', label: 'إعداد المدرسة', icon: Building2, perm: 'organization.manage' },
  { to: '/users', label: 'المستخدمون', icon: Users, perm: 'users.view' },
  { to: '/evidence/standards', label: 'إعداد المعايير', icon: ListChecks, perm: 'settings.manage' },
  { to: '/roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, perm: 'roles.manage' },
  { to: '/admin', label: 'مدير النظام', icon: ServerCog, perm: 'settings.manage' },
  { to: '/profile', label: 'ملفي الشخصي', icon: UserCircle },
];

function allowed(item: NavItem, permissions: string[]): boolean {
  if (item.perm) return permissions.includes(item.perm);
  if (item.perms) return item.perms.some((p) => permissions.includes(p));
  return true;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const permissions = useAuthStore((s) => s.permissions);
  const items = ITEMS.filter((i) => allowed(i, permissions));

  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-2 border-b border-border px-2 pb-4 text-center">
        <img
          src="/file_000000000910820aaccc0cbc01b1c6de.png"
          alt="ثانوية الأمير عبدالمجيد الأولى"
          className="h-16 w-auto object-contain"
        />
        <span className="text-xs font-semibold leading-tight text-heading">ثانوية الأمير عبدالمجيد الأولى</span>
      </div>

      <nav className="space-y-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-green/10 text-brand-green' : 'text-body hover:bg-background',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
