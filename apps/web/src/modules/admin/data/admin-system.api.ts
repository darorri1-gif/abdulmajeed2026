import { supabase } from '@/shared/lib/supabase';

export interface AuditEntry {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
  actor?: { full_name: string } | null;
}

export interface SystemStats {
  staff: number;
  active_staff: number;
  students: number;
  classes: number;
  evidence: number;
  followup_entries: number;
  notifications: number;
  audit_entries: number;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface AuditQuery {
  action?: string;
  entityType?: string;
  page: number;
  pageSize: number;
}

export async function listAudit(q: AuditQuery): Promise<{ rows: AuditEntry[]; total: number }> {
  let query = supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, summary, created_at, actor:profiles!audit_log_actor_id_fkey(full_name)', {
      count: 'exact',
    })
    .order('id', { ascending: false });

  if (q.action) query = query.eq('action', q.action);
  if (q.entityType) query = query.eq('entity_type', q.entityType);

  const from = (q.page - 1) * q.pageSize;
  const { data, error, count } = await query.range(from, from + q.pageSize - 1);
  if (error) throw error;
  return { rows: data as unknown as AuditEntry[], total: count ?? 0 };
}

export async function systemStats(): Promise<SystemStats> {
  const { data, error } = await supabase.rpc('system_stats');
  if (error) throw error;
  return data as SystemStats;
}

export async function listSettings(): Promise<AppSetting[]> {
  const { data, error } = await supabase.from('app_settings').select('key, value, updated_at').order('key');
  if (error) throw error;
  return data as AppSetting[];
}

export async function upsertSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
