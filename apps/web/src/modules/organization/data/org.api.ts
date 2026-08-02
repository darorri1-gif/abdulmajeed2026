import { supabase } from '@/shared/lib/supabase';
import { likeTerm } from '@/shared/lib/utils';
import type {
  AssignmentRow,
  ClassRow,
  EnrollmentRow,
  GradeLevel,
  StaffRef,
  Student,
  Subject,
} from '../types/org.types';

async function currentYearId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_academic_year_id');
  if (error || !data) throw new Error('لم يتم تحديد السنة الدراسية الحالية.');
  return data as string;
}

export async function listGradeLevels(): Promise<GradeLevel[]> {
  const { data, error } = await supabase.from('grade_levels').select('*').order('sort_order');
  if (error) throw error;
  return data as GradeLevel[];
}

export async function listSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase.from('subjects').select('*').order('name_ar');
  if (error) throw error;
  return data as Subject[];
}

export async function listClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, grade_level_id, grade:grade_levels(name_ar)')
    .order('name');
  if (error) throw error;
  return data as unknown as ClassRow[];
}

export async function createClass(name: string, gradeLevelId: string | null): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const year = await currentYearId();
  const { error } = await supabase
    .from('classes')
    .insert({ name, grade_level_id: gradeLevelId, academic_year_id: year, created_by: auth.user?.id });
  if (error) throw new Error(error.message.includes('duplicate') ? 'اسم الفصل مستخدم مسبقًا.' : 'تعذّر إنشاء الفصل.');
}

export async function listStudents(search?: string): Promise<Student[]> {
  let query = supabase
    .from('students')
    .select('id, full_name, student_number, guardian_name, guardian_phone, status')
    .is('deleted_at', null)
    .order('full_name')
    .limit(100);
  if (search?.trim()) {
    const term = likeTerm(search);
    if (term) query = query.or(`full_name.ilike.%${term}%,student_number.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Student[];
}

export async function createStudent(input: {
  full_name: string;
  student_number?: string;
  guardian_name?: string;
  guardian_phone?: string;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('students').insert({
    full_name: input.full_name,
    student_number: input.student_number || null,
    guardian_name: input.guardian_name || null,
    guardian_phone: input.guardian_phone || null,
    created_by: auth.user?.id,
  });
  if (error) throw new Error(error.message.includes('duplicate') ? 'رقم الطالب مستخدم مسبقًا.' : 'تعذّر إضافة الطالب.');
}

export async function listClassStudents(classId: string): Promise<EnrollmentRow[]> {
  const { data, error } = await supabase
    .from('student_enrollments')
    .select('id, student:students(id, full_name, student_number)')
    .eq('class_id', classId)
    .eq('status', 'active');
  if (error) throw error;
  return data as unknown as EnrollmentRow[];
}

export async function enrollStudent(classId: string, studentId: string): Promise<void> {
  const year = await currentYearId();
  const { error } = await supabase
    .from('student_enrollments')
    .insert({ class_id: classId, student_id: studentId, academic_year_id: year, status: 'active' });
  if (error)
    throw new Error(error.message.includes('duplicate') ? 'الطالب مسجّل في فصل هذا العام بالفعل.' : 'تعذّر التسجيل.');
}

export async function removeEnrollment(enrollmentId: string): Promise<void> {
  const { error } = await supabase.from('student_enrollments').delete().eq('id', enrollmentId);
  if (error) throw error;
}

export async function listClassTeachers(classId: string): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from('teaching_assignments')
    .select('id, teacher:profiles!teaching_assignments_teacher_id_fkey(id, full_name), subject:subjects(name_ar)')
    .eq('class_id', classId);
  if (error) throw error;
  return data as unknown as AssignmentRow[];
}

export async function assignTeacher(classId: string, teacherId: string, subjectId: string | null): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const year = await currentYearId();
  const { error } = await supabase.from('teaching_assignments').insert({
    class_id: classId,
    teacher_id: teacherId,
    subject_id: subjectId,
    academic_year_id: year,
    created_by: auth.user?.id,
  });
  if (error) throw new Error(error.message.includes('duplicate') ? 'المعلم مُسند لهذا الفصل بالفعل.' : 'تعذّر الإسناد.');
}

export async function removeAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('teaching_assignments').delete().eq('id', id);
  if (error) throw error;
}

export async function listStaff(): Promise<StaffRef[]> {
  const { data, error } = await supabase.rpc('list_shareable_staff');
  if (error) throw error;
  return (data as StaffRef[]) ?? [];
}
