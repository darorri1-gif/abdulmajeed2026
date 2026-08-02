import { supabase } from '@/shared/lib/supabase';

export interface SchoolOverview {
  staff_count: number;
  student_count: number;
  class_count: number;
  evidence: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    needs_revision: number;
    rejected: number;
  };
  followup_shared: number;
}

export interface TeacherProgress {
  teacher_id: string;
  full_name: string;
  total: number;
  approved: number;
  submitted: number;
  needs_revision: number;
}

export interface StandardCompletion {
  standard_id: string;
  name_ar: string;
  total: number;
  approved: number;
}

export async function schoolOverview(): Promise<SchoolOverview> {
  const { data, error } = await supabase.rpc('school_overview');
  if (error) throw error;
  return data as SchoolOverview;
}

export async function teacherProgress(): Promise<TeacherProgress[]> {
  const { data, error } = await supabase.rpc('teacher_evidence_progress');
  if (error) throw error;
  return (data as TeacherProgress[]) ?? [];
}

export async function evidenceByStandard(): Promise<StandardCompletion[]> {
  const { data, error } = await supabase.rpc('evidence_by_standard');
  if (error) throw error;
  return (data as StandardCompletion[]) ?? [];
}
