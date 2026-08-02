import { supabase } from '@/shared/lib/supabase';
import type { Permission, Role } from '../types/users.types';

export async function listRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, key, name_ar, name_en, is_system')
    .order('is_system', { ascending: false })
    .order('name_ar');
  if (error) throw error;
  return data as Role[];
}

export async function listPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('id, key, module, name_ar')
    .order('module');
  if (error) throw error;
  return data as Permission[];
}

export async function getRolePermissionIds(roleId: string): Promise<string[]> {
  const { data, error } = await supabase.from('role_permissions').select('permission_id').eq('role_id', roleId);
  if (error) throw error;
  return (data ?? []).map((r) => r.permission_id as string);
}

export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const { error: delErr } = await supabase.from('role_permissions').delete().eq('role_id', roleId);
  if (delErr) throw delErr;
  if (permissionIds.length) {
    const { error } = await supabase
      .from('role_permissions')
      .insert(permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })));
    if (error) throw error;
  }
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return (data?.value ?? null) as T | null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
