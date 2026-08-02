import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/worksheets.api';
import type { ItemType } from './types/worksheet.types';

export function useWorksheets(scope: 'mine' | 'library', search: string) {
  return useQuery({ queryKey: ['worksheets', scope, search], queryFn: () => api.listWorksheets(scope, search) });
}
export function useWorksheet(id: string) {
  return useQuery({ queryKey: ['worksheet', id], queryFn: () => api.getWorksheet(id), enabled: !!id });
}
export function useCreateWorksheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) => api.createWorksheet(title, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worksheets'] }),
  });
}
export function useUpdateWorksheet(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateWorksheet>[1]) => api.updateWorksheet(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worksheet', id] });
      qc.invalidateQueries({ queryKey: ['worksheets'] });
    },
  });
}
export function useDeleteWorksheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteWorksheet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worksheets'] }),
  });
}
export function useAddItem(worksheetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, position }: { type: ItemType; position: number }) => api.addItem(worksheetId, type, position),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worksheet', worksheetId] }),
  });
}
export function useUpdateItem(worksheetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateItem>[1] }) => api.updateItem(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worksheet', worksheetId] }),
  });
}
export function useDeleteItem(worksheetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worksheet', worksheetId] }),
  });
}
