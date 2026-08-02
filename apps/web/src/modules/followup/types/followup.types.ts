export interface FollowupCategory {
  id: string;
  key: string;
  name_ar: string;
  group_name: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface MyClass {
  id: string;
  name: string;
  grade_name: string | null;
  student_count: number;
}

export interface StudentRef {
  id: string;
  full_name: string;
  student_number: string | null;
  class_name?: string | null;
}

export interface FollowupEntry {
  id: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  author_id: string;
  category?: { name_ar: string; color: string | null; key: string } | null;
  author?: { full_name: string } | null;
}

export type GrantType = 'user' | 'role' | 'leadership_team';

export interface VisibilityGrant {
  type: GrantType;
  user_id?: string;
  role_id?: string;
}

export interface CreateEntryInput {
  category_id: string;
  title?: string;
  body?: string;
  occurred_at?: string;
  class_id?: string | null;
  student_ids?: string[] | null;
  grants: VisibilityGrant[];
}

export interface RoleRef {
  id: string;
  key: string;
  name_ar: string;
}

export interface StaffRef {
  id: string;
  full_name: string;
}
