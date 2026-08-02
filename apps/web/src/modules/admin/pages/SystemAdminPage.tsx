import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, DatabaseBackup, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { cn } from '@/shared/lib/utils';
import { SystemStats } from '../components/SystemStats';
import { SettingsEditor } from '../components/SettingsEditor';
import { AuditLogViewer } from '../components/AuditLogViewer';

type Tab = 'monitoring' | 'settings' | 'audit' | 'backup';

const TABS: { key: Tab; label: string }[] = [
  { key: 'monitoring', label: 'المراقبة' },
  { key: 'settings', label: 'الإعدادات' },
  { key: 'audit', label: 'سجل التدقيق' },
  { key: 'backup', label: 'النسخ الاحتياطي' },
];

const LINKS = [
  { to: '/users', label: 'إدارة المستخدمين', icon: Users },
  { to: '/roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck },
  { to: '/school-setup', label: 'إدارة المدرسة', icon: Building2 },
];

export function SystemAdminPage() {
  const [tab, setTab] = useState<Tab>('monitoring');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-heading">لوحة مدير النظام</h1>
        <p className="text-sm text-muted">الإعدادات العامة، المراقبة، وسجل التدقيق.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-heading hover:bg-background"
          >
            <l.icon className="h-4 w-4 text-brand-green" />
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'border-brand-green text-brand-green' : 'border-transparent text-body hover:text-heading',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'monitoring' && <SystemStats />}
      {tab === 'settings' && <SettingsEditor />}
      {tab === 'audit' && <AuditLogViewer />}
      {tab === 'backup' && (
        <Card>
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center gap-2 text-heading">
              <DatabaseBackup className="h-5 w-5 text-brand-green" />
              <span className="text-sm font-semibold">النسخ الاحتياطي</span>
            </div>
            <p className="text-sm text-body">
              النسخ الاحتياطي مُدار على مستوى Supabase (نسخ يومية تلقائية مع إمكانية الاستعادة الزمنية حسب الخطة).
              تُدار الجداول الزمنية والاحتفاظ من لوحة تحكم المشروع في Supabase تحت Database → Backups.
            </p>
            <p className="text-xs text-muted">
              للاستعادة أو تغيير سياسة الاحتفاظ، استخدم لوحة Supabase مباشرة؛ تُسجَّل عمليات الاستعادة ضمن سجل التدقيق عند تنفيذها عبر التطبيق.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
