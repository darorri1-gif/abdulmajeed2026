import { supabase } from '@/shared/lib/supabase';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserDetail,
  UsersQuery,
  UsersResult,
} from '../types/users.types';

export async function searchUsers(q: UsersQuery): Promise<UsersResult> {
  const { data, error } = await supabase.rpc('search_users', {
    p_search: q.search?.trim() || null,
    p_role_key: q.roleKey || null,
    p_status: q.status || null,
    p_limit: q.pageSize,
    p_offset: (q.page - 1) * q.pageSize,
  });
  if (error) throw error;
  return data as UsersResult;
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, username, specialization, phone, job_title, status, last_login_at, must_change_password, user_roles(role:roles(id, key, name_ar))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as UserDetail) ?? null;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<void> {
  const { error } = await supabase.from('profiles').update(input).eq('id', id);
  if (error) throw error;
}

export async function setUserStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function setUserRoles(userId: string, roleIds: string[]): Promise<void> {
  const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
  if (delErr) throw delErr;
  if (roleIds.length) {
    const { error } = await supabase
      .from('user_roles')
      .insert(roleIds.map((role_id) => ({ user_id: userId, role_id })));
    if (error) throw error;
  }
}

export async function createUser(input: CreateUserInput): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke('admin-create-user', { body: input });
  if (error) throw new Error(await extractFnError(error));
  return data as { id: string };
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-reset-password', {
    body: { user_id: userId, new_password: newPassword },
  });
  if (error) throw new Error(await extractFnError(error));
}

/** Edge Functions return their Arabic error message in the response body. */
async function extractFnError(error: unknown): Promise<string> {
  const withContext = error as { context?: Response };
  try {
    if (withContext.context) {
      const body = await withContext.context.json();
      if (body?.error) return body.error as string;
    }
  } catch {
    /* fall through */
  }
  return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
}
