export interface RoleRef {
  key: string;
  name_ar: string;
}

export interface UserListItem {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  specialization: string;
  status: 'active' | 'suspended';
  last_login_at: string | null;
  must_change_password: boolean;
  roles: RoleRef[];
}

export interface UsersQuery {
  search?: string;
  roleKey?: string;
  status?: 'active' | 'suspended';
  page: number;
  pageSize: number;
}

export interface UsersResult {
  total: number;
  rows: UserListItem[];
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  username?: string;
  specialization: string;
  password: string;
  role_keys: string[];
}

export interface UpdateUserInput {
  full_name?: string;
  specialization?: string;
  username?: string | null;
  phone?: string | null;
  job_title?: string | null;
}

export interface Role {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  is_system: boolean;
}

export interface Permission {
  id: string;
  key: string;
  module: string;
  name_ar: string;
}

/** Shape returned by getUserDetail (profile + embedded roles). */
export interface UserDetail {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  specialization: string;
  phone: string | null;
  job_title: string | null;
  status: 'active' | 'suspended';
  last_login_at: string | null;
  must_change_password: boolean;
  user_roles: { role: { id: string; key: string; name_ar: string } }[];
}
