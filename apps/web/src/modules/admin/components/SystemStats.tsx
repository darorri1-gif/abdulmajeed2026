import { Card, CardContent } from '@/shared/ui/Card';
import { Spinner } from '@/shared/ui/feedback';
import { useSystemStats } from '../admin.hooks';
import type { SystemStats as SystemStatsData } from '../data/admin-system.api';

const LABELS: { key: keyof SystemStatsData; label: string }[] = [
  { key: 'active_staff', label: 'منسوبون نشطون' },
  { key: 'staff', label: 'إجمالي الحسابات' },
  { key: 'students', label: 'الطلاب' },
  { key: 'classes', label: 'الفصول' },
  { key: 'evidence', label: 'الشواهد' },
  { key: 'followup_entries', label: 'سجلات المتابعة' },
  { key: 'notifications', label: 'الإشعارات' },
  { key: 'audit_entries', label: 'أحداث التدقيق' },
];

export function SystemStats() {
  const { data, isLoading } = useSystemStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {LABELS.map((s) => (
        <Card key={s.key}>
          <CardContent className="py-4">
            <div className="text-2xl font-bold tabular-nums text-heading">{data[s.key]}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
