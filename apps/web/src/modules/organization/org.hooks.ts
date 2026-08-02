import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/org.api';

export function useGradeLevels() {
  return useQuery({ queryKey: ['grade-levels'], queryFn: api.listGradeLevels });
}
export function useSubjects() {
  return useQuery({ queryKey: ['subjects'], queryFn: api.listSubjects });
}
export function useClasses() {
  return useQuery({ queryKey: ['classes'], queryFn: api.listClasses });
}
export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, gradeLevelId }: { name: string; gradeLevelId: string | null }) =>
      api.createClass(name, gradeLevelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}
export function useStudents(search: string) {
  return useQuery({ queryKey: ['students', search], queryFn: () => api.listStudents(search) });
}
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createStudent>[0]) => api.createStudent(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}
export function useClassStudents(classId: string) {
  return useQuery({ queryKey: ['class-students', classId], queryFn: () => api.listClassStudents(classId), enabled: !!classId });
}
export function useEnrollStudent(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => api.enrollStudent(classId, studentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-students', classId] }),
  });
}
export function useRemoveEnrollment(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => api.removeEnrollment(enrollmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-students', classId] }),
  });
}
export function useClassTeachers(classId: string) {
  return useQuery({ queryKey: ['class-teachers', classId], queryFn: () => api.listClassTeachers(classId), enabled: !!classId });
}
export function useAssignTeacher(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, subjectId }: { teacherId: string; subjectId: string | null }) =>
      api.assignTeacher(classId, teacherId, subjectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-teachers', classId] }),
  });
}
export function useRemoveAssignment(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-teachers', classId] }),
  });
}
export function useStaff() {
  return useQuery({ queryKey: ['staff'], queryFn: api.listStaff });
}
