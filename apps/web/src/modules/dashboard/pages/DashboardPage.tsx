import { Link } from 'react-router-dom';
import { Download, GraduationCap, Layers, Printer, ShieldCheck, Users } from 'lucide-react';
import { useCan } from '@/shared/hooks/usePermission';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Table, TBody, TD, TH, THead, TR } from '@/shared/ui/Table';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useEvidenceByStandard, useSchoolOverview, useTeacherProgress } from '../dashboard.hooks';
import type { TeacherProgress } from '../data/dashboard.api';

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums text-heading">{value}</div>
          <div className="text-xs text-muted">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function exportCsv(rows: TeacherProgress[]) {
  const header = ['المعلم', 'الإجمالي', 'معتمد', 'بانتظار المراجعة', 'يحتاج تعديل'];
  const lines = rows.map((r) => [r.full_name, r.total, r.approved, r.submitted, r.needs_revision].join(','));
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'teacher-progress.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const canManageRoles = useCan('roles.manage');
  const canManageOrg = useCan('organization.manage');
  const { data: overview, isLoading, isError } = useSchoolOverview();
  const { data: teachers } = useTeacherProgress();
  const { data: standards } = useEvidenceByStandard();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !overview) return <Alert>تعذّر تحميل لوحة التحكم.</Alert>;

  const ev = overview.evidence;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">لوحة قائد المدرسة</h1>
          <p className="text-sm text-muted">نظرة عامة على أداء المدرسة.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          {teachers && teachers.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => exportCsv(teachers)}>
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="المنسوبون" value={overview.staff_count} />
        <StatCard icon={GraduationCap} label="الطلاب" value={overview.student_count} />
        <StatCard icon={Layers} label="الفصول" value={overview.class_count} />
        <StatCard icon={ShieldCheck} label="إجمالي الشواهد" value={ev.total} />
      </div>

      {/* Evidence completion */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">اكتمال الشواهد</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'مسودة', value: ev.draft },
              { label: 'بانتظار المراجعة', value: ev.submitted },
              { label: 'معتمد', value: ev.approved },
              { label: 'يحتاج تعديل', value: ev.needs_revision },
              { label: 'مرفوض', value: ev.rejected },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                <div className="text-xl font-bold tabular-nums text-heading">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teacher progress */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">تقدّم المعلمين</h2>
        </CardHeader>
        <CardContent className="p-0">
          {!teachers?.length ? (
            <p className="p-4 text-sm text-muted">لا توجد بيانات بعد.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>المعلم</TH>
                  <TH>الإجمالي</TH>
                  <TH>معتمد</TH>
                  <TH>بانتظار</TH>
                  <TH>يحتاج تعديل</TH>
                </TR>
              </THead>
              <TBody>
                {teachers.map((t) => (
                  <TR key={t.teacher_id}>
                    <TD className="font-medium">{t.full_name}</TD>
                    <TD className="tabular-nums">{t.total}</TD>
                    <TD className="tabular-nums text-brand-green">{t.approved}</TD>
                    <TD className="tabular-nums">{t.submitted}</TD>
                    <TD className="tabular-nums text-brand-orange">{t.needs_revision}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Standards completion */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">اكتمال المعايير</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {(standards ?? []).map((s) => {
            const pct = s.total ? Math.round((s.approved / s.total) * 100) : 0;
            return (
              <div key={s.standard_id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-body">{s.name_ar}</span>
                  <span className="tabular-nums text-muted">
                    {s.approved}/{s.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Follow-up summary + quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold tabular-nums text-heading">{overview.followup_shared}</div>
            <div className="text-xs text-muted">متابعات مُشاركة معك</div>
            <p className="mt-2 text-xs text-muted">تُعرض فقط المتابعات التي شاركها المعلمون معك — الخصوصية مضمونة.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-heading">إدارة</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canManageRoles && (
              <Link
                to="/roles"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm text-heading hover:bg-background"
              >
                الصلاحيات
              </Link>
            )}
            {canManageOrg && (
              <Link
                to="/school-setup"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm text-heading hover:bg-background"
              >
                إعداد المدرسة
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
