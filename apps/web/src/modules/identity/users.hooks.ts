import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from './data/users.api';
import * as adminApi from './data/admin.api';
import type { CreateUserInput, UpdateUserInput, UsersQuery } from './types/users.types';

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => usersApi.searchUsers(query),
  });
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUserDetail(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      usersApi.setUserStatus(id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}

export function useSetUserRoles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleIds: string[]) => usersApi.setUserRoles(id, roleIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersApi.resetUserPassword(id, password),
  });
}

/* ---- Roles, permissions & settings ---- */

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: adminApi.listRoles });
}

export function usePermissionsList() {
  return useQuery({ queryKey: ['permissions'], queryFn: adminApi.listPermissions });
}

export function useRolePermissionIds(roleId: string) {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => adminApi.getRolePermissionIds(roleId),
    enabled: !!roleId,
  });
}

export function useSetRolePermissions(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissionIds: string[]) => adminApi.setRolePermissions(roleId, permissionIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-permissions', roleId] }),
  });
}

export function useSetting<T = unknown>(key: string) {
  return useQuery({ queryKey: ['setting', key], queryFn: () => adminApi.getSetting<T>(key) });
}

export function useSetSetting(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: unknown) => adminApi.setSetting(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setting', key] }),
  });
}
