import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { changePassword, login, logout } from './data/auth.api';
import type { LoginInput } from './types/auth.types';

export function useLoginMutation() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const setStatus = useAuthStore((s) => s.setStatus);

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (profile) => {
      setProfile(profile);
      setStatus('authenticated');
    },
  });
}

export function useChangePasswordMutation() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: (newPassword: string) => {
      if (!profile) throw new Error('لا توجد جلسة صالحة.');
      return changePassword(newPassword, profile.id);
    },
    onSuccess: () => {
      if (profile) setProfile({ ...profile, must_change_password: false });
    },
  });
}

export function useLogout() {
  const reset = useAuthStore((s) => s.reset);
  return async () => {
    await logout();
    reset();
  };
}
