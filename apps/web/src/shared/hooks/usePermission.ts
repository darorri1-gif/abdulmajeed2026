import { useAuthStore } from '@/store/authStore';

/** Returns a predicate to check whether the current user holds a permission. */
export function useHasPermission() {
  const permissions = useAuthStore((s) => s.permissions);
  return (key: string) => permissions.includes(key);
}

/** Reactive boolean for a single permission. */
export function useCan(key: string) {
  return useAuthStore((s) => s.permissions.includes(key));
}
