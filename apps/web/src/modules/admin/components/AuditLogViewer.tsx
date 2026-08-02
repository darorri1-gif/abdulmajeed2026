import { useState } from 'react';
import { Select } from '@/shared/ui/Select';
import { Card, CardContent } from '@/shared/ui/Card';
import { Table, TBody, TD, TH, THead, TR, Pagination } from '@/shared/ui/Table';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useAudit } from '../admin.hooks';

const ACTION_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  submit: 'إرسال',
  approve: 'اعتماد',
  reject: 'رفض',
  grant: 'منح',
  revoke: 'سحب',
  config_change: 'تغيير إعداد',
};

const ENTITY_LABELS: Record<string, string> = {
  evidence: 'شاهد',
  user_roles: 'أدوار',
  role_permissions: 'صلاحيات دور',
  app_settings: 'إعداد',
  profiles: 'ملف',
  students: 'طالب',
  classes: 'فصل',
};

const PAGE_SIZE = 25;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' });
}

export function AuditLogViewer() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAudit({
    action: action || undefined,
    entityType: entityType || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="الإجراء">
          <option value="">كل الإجراءات</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} aria-label="النوع">
          <option value="">كل الأنواع</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : isError || !data ? (
        <Alert>تعذّر تحميل سجل التدقيق.</Alert>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>الوقت</TH>
                    <TH>المستخدم</TH>
                    <TH>الإجراء</TH>
                    <TH>النوع</TH>
                    <TH>التفاصيل</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.rows.map((r) => (
                    <TR key={r.id}>
                      <TD className="whitespace-nowrap text-xs text-muted">{formatDate(r.created_at)}</TD>
                      <TD className="text-sm">{r.actor?.full_name ?? 'النظام'}</TD>
                      <TD className="text-sm">{ACTION_LABELS[r.action] ?? r.action}</TD>
                      <TD className="text-sm">{r.entity_type ? ENTITY_LABELS[r.entity_type] ?? r.entity_type : '—'}</TD>
                      <TD className="text-xs text-body">{r.summary ?? '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
