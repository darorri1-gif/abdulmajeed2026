import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/followup.api';
import type { CreateEntryInput } from './types/followup.types';

export function useCategories() {
  return useQuery({ queryKey: ['followup-categories'], queryFn: api.listCategories });
}
export function useMyClasses() {
  return useQuery({ queryKey: ['my-classes'], queryFn: api.myClasses });
}
export function useClassStudents(classId: string | undefined) {
  return useQuery({
    queryKey: ['followup-class-students', classId],
    queryFn: () => api.classStudents(classId as string),
    enabled: !!classId,
  });
}
export function useMyStudents(search: string) {
  return useQuery({ queryKey: ['my-students', search], queryFn: () => api.myStudents(search) });
}
export function useStaff() {
  return useQuery({ queryKey: ['followup-staff'], queryFn: api.listStaff });
}
export function useRoles() {
  return useQuery({ queryKey: ['followup-roles'], queryFn: api.listRoles });
}
export function useStudentTimeline(studentId: string, filters: { categoryId?: string; search?: string }) {
  return useQuery({
    queryKey: ['student-timeline', studentId, filters],
    queryFn: () => api.studentTimeline(studentId, filters),
    enabled: !!studentId,
  });
}
export function useMyRecentEntries() {
  return useQuery({ queryKey: ['my-recent-entries'], queryFn: () => api.myRecentEntries() });
}
export function useStudentBasic(id: string) {
  return useQuery({ queryKey: ['student-basic', id], queryFn: () => api.getStudentBasic(id), enabled: !!id });
}
export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEntryInput) => api.createEntry(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-timeline'] });
      qc.invalidateQueries({ queryKey: ['my-recent-entries'] });
    },
  });
}
export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-timeline'] });
      qc.invalidateQueries({ queryKey: ['my-recent-entries'] });
    },
  });
}
