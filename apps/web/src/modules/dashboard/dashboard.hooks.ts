import { useQuery } from '@tanstack/react-query';
import * as api from './data/dashboard.api';

export function useSchoolOverview() {
  return useQuery({ queryKey: ['school-overview'], queryFn: api.schoolOverview });
}
export function useTeacherProgress() {
  return useQuery({ queryKey: ['teacher-progress'], queryFn: api.teacherProgress });
}
export function useEvidenceByStandard() {
  return useQuery({ queryKey: ['evidence-by-standard'], queryFn: api.evidenceByStandard });
}
