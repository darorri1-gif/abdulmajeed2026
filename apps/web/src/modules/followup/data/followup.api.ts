import { supabase } from '@/shared/lib/supabase';
import { likeTerm } from '@/shared/lib/utils';
import type {
  CreateEntryInput,
  FollowupCategory,
  FollowupEntry,
  MyClass,
  RoleRef,
  StaffRef,
  StudentRef,
} from '../types/followup.types';

export async function listCategories(): Promise<FollowupCategory[]> {
  const { data, error } = await supabase
    .from('followup_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as FollowupCategory[];
}

export async function myClasses(): Promise<MyClass[]> {
  const { data, error } = await supabase.rpc('my_classes');
  if (error) throw error;
  return (data as MyClass[]) ?? [];
}

export async function classStudents(classId: string): Promise<StudentRef[]> {
  const { data, error } = await supabase.rpc('class_students', { p_class_id: classId });
  if (error) throw error;
  return (data as StudentRef[]) ?? [];
}

export async function myStudents(search?: string): Promise<StudentRef[]> {
  const { data, error } = await supabase.rpc('my_students', { p_search: search?.trim() || null });
  if (error) throw error;
  return (data as StudentRef[]) ?? [];
}

export async function listStaff(): Promise<StaffRef[]> {
  const { data, error } = await supabase.rpc('list_shareable_staff');
  if (error) throw error;
  return (data as StaffRef[]) ?? [];
}

export async function listRoles(): Promise<RoleRef[]> {
  const { data, error } = await supabase.from('roles').select('id, key, name_ar').order('name_ar');
  if (error) throw error;
  return data as RoleRef[];
}

const ENTRY_COLUMNS =
  'id, title, body, occurred_at, author_id, category:followup_categories(name_ar, color, key), author:profiles!followup_entries_author_id_fkey(full_name)';

/** Timeline for one student — RLS returns only entries the caller may see. */
export async function studentTimeline(
  studentId: string,
  filters: { categoryId?: string; search?: string } = {},
): Promise<FollowupEntry[]> {
  let query = supabase
    .from('followup_entries')
    .select(`${ENTRY_COLUMNS}, followup_entry_students!inner(student_id)`)
    .eq('followup_entry_students.student_id', studentId)
    .is('deleted_at', null);

  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.search?.trim()) {
    const term = likeTerm(filters.search);
    if (term) query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }

  const { data, error } = await query.order('occurred_at', { ascending: false });
  if (error) throw error;
  return data as unknown as FollowupEntry[];
}

/** The current user's own recent entries. */
export async function myRecentEntries(limit = 20): Promise<FollowupEntry[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from('followup_entries')
    .select(ENTRY_COLUMNS)
    .eq('author_id', auth.user.id)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as FollowupEntry[];
}

export async function createEntry(input: CreateEntryInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_followup_entry', {
    p_category_id: input.category_id,
    p_title: input.title ?? null,
    p_body: input.body ?? null,
    p_occurred_at: input.occurred_at ?? new Date().toISOString(),
    p_class_id: input.class_id ?? null,
    p_student_ids: input.student_ids ?? null,
    p_grants: input.grants ?? [],
  });
  if (error) throw error;
  return data as string;
}

export async function deleteEntry(id: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('followup_entries')
    .update({ deleted_at: new Date().toISOString(), deleted_by: auth.user?.id })
    .eq('id', id);
  if (error) throw error;
}

export async function getStudentBasic(id: string): Promise<StudentRef | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, student_number')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as StudentRef) ?? null;
}
