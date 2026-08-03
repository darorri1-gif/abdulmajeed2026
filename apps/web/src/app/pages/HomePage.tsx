import { Link } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  MessagesSquare,
  NotebookPen,
  ServerCog,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Shortcut {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  perm?: string;
  perms?: string[]; // any-of
}

const SHORTCUTS: Shortcut[] = [
  { to: '/dashboard', label: 'لوحة القيادة', desc: 'إحصاءات المدرسة وتقارير الأداء', icon: LayoutDashboard, perm: 'dashboard.view' },
  { to: '/followup', label: 'متابعة الطلاب', desc: 'تسجيل ومتابعة حالات الطلاب', icon: NotebookPen, perm: 'followup.create' },
  { to: '/evidence', label: 'الشواهد', desc: 'توثيق شواهد معايير تمام', icon: FileCheck2, perms: ['evidence.create', 'evidence.view_all', 'evidence.review'] },
  { to: '/discussion', label: 'لوحة النقاش', desc: 'مجتمع المنسوبين والإعلانات', icon: MessagesSquare },
  { to: '/worksheets', label: 'أوراق العمل', desc: 'أنشطة صفّية تفاعلية', icon: ClipboardList },
  { to: '/school-setup', label: 'إعداد المدرسة', desc: 'الفصول والطلاب والإسناد', icon: Building2, perm: 'organization.manage' },
  { to: '/users', label: 'المستخدمون', desc: 'إدارة حسابات المنسوبين', icon: Users, perm: 'users.view' },
  { to: '/roles', label: 'الأدوار والصلاحيات', desc: 'ضبط صلاحيات الأدوار', icon: ShieldCheck, perm: 'roles.manage' },
  { to: '/admin', label: 'مدير النظام', desc: 'الإعدادات والمراقبة وسجل التدقيق', icon: ServerCog, perm: 'settings.manage' },
];

export function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const permissions = useAuthStore((s) => s.permissions);

  const can = (s: Shortcut) => {
    if (s.perm) return permissions.includes(s.perm);
    if (s.perms) return s.perms.some((p) => permissions.includes(p));
    return true; // open to all signed-in staff
  };
  const items = SHORTCUTS.filter(can);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-heading">مرحبًا، {profile?.full_name}</h1>
        <p className="mt-1 text-sm text-muted">{profile?.specialization ?? 'منسوب'} — اختر ما تريد الوصول إليه.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-background"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-heading">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
