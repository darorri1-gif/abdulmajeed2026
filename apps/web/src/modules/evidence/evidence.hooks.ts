import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/evidence.api';
import * as standardsApi from './data/standards.api';
import type { CreateEvidenceInput, EvidenceQuery } from './types/evidence.types';

export function useStandards(activeOnly = true) {
  return useQuery({ queryKey: ['standards', activeOnly], queryFn: () => standardsApi.listStandards(activeOnly) });
}

export function useIndicators(standardId: string | undefined) {
  return useQuery({
    queryKey: ['indicators', standardId],
    queryFn: () => standardsApi.listIndicators(standardId as string),
    enabled: !!standardId,
  });
}

export function useUpdateStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof standardsApi.updateStandard>[1] }) =>
      standardsApi.updateStandard(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards'] }),
  });
}

export function useEvidenceList(query: EvidenceQuery) {
  return useQuery({ queryKey: ['evidence', query], queryFn: () => api.listEvidence(query) });
}

export function useEvidence(id: string) {
  return useQuery({ queryKey: ['evidence-item', id], queryFn: () => api.getEvidence(id), enabled: !!id });
}

export function useCreateEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEvidenceInput) => api.createEvidence(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence'] }),
  });
}

export function useUpdateEvidence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateEvidence>[1]) => api.updateEvidence(id, patch),
    onSuccess: () => invalidate(qc, id),
  });
}

export function useSubmitEvidence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.setEvidenceStatus(id, 'submitted'),
    onSuccess: () => invalidate(qc, id),
  });
}

export function useReviewEvidence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, note }: { action: 'approve' | 'reject' | 'needs_revision'; note?: string }) =>
      api.reviewEvidence(id, action, note),
    onSuccess: () => invalidate(qc, id),
  });
}

export function useDeleteEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.softDeleteEvidence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence'] }),
  });
}

export function useEvidenceFiles(id: string) {
  return useQuery({ queryKey: ['evidence-files', id], queryFn: () => api.listFiles(id), enabled: !!id });
}

export function useUploadFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadFile(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence-files', id] }),
  });
}

export function useDeleteFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: Parameters<typeof api.deleteFile>[0]) => api.deleteFile(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence-files', id] }),
  });
}

export function useComments(id: string) {
  return useQuery({ queryKey: ['evidence-comments', id], queryFn: () => api.listComments(id), enabled: !!id });
}

export function useAddComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.addComment(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence-comments', id] }),
  });
}

export function useHistory(id: string) {
  return useQuery({ queryKey: ['evidence-history', id], queryFn: () => api.listHistory(id), enabled: !!id });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['evidence'] });
  qc.invalidateQueries({ queryKey: ['evidence-item', id] });
  qc.invalidateQueries({ queryKey: ['evidence-history', id] });
}
