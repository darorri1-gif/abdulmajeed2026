export interface GradeLevel {
  id: string;
  name_ar: string;
  sort_order: number;
}

export interface Subject {
  id: string;
  name_ar: string;
  code: string | null;
}

export interface ClassRow {
  id: string;
  name: string;
  grade_level_id: string | null;
  grade?: { name_ar: string } | null;
}

export interface Student {
  id: string;
  full_name: string;
  student_number: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  status: string;
}

export interface EnrollmentRow {
  id: string;
  student: { id: string; full_name: string; student_number: string | null };
}

export interface AssignmentRow {
  id: string;
  teacher: { id: string; full_name: string } | null;
  subject: { name_ar: string } | null;
}

export interface StaffRef {
  id: string;
  full_name: string;
}
