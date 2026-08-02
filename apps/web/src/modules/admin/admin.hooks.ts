import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/admin-system.api';
import type { AuditQuery } from './data/admin-system.api';

export function useAudit(query: AuditQuery) {
  return useQuery({ queryKey: ['audit', query], queryFn: () => api.listAudit(query) });
}
export function useSystemStats() {
  return useQuery({ queryKey: ['system-stats'], queryFn: api.systemStats });
}
export function useSettings() {
  return useQuery({ queryKey: ['app-settings'], queryFn: api.listSettings });
}
export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => api.upsertSetting(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-settings'] }),
  });
}
