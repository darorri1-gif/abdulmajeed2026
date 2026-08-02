import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { fetchMyPermissions, fetchOwnProfile } from './data/auth.api';

/**
 * Initializes the auth session on load and keeps the store in sync with
 * Supabase auth state changes (sign-in, sign-out, token refresh).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setStatus = useAuthStore((s) => s.setStatus);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const [profile, permissions] = await Promise.all([fetchOwnProfile(), fetchMyPermissions()]);
        if (!active) return;
        setProfile(profile);
        setPermissions(permissions);
        setStatus(profile ? 'authenticated' : 'unauthenticated');
      } catch {
        if (active) setStatus('unauthenticated');
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) void loadProfile();
      else setStatus('unauthenticated');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) void loadProfile();
      else reset();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setPermissions, setStatus, reset]);

  return <>{children}</>;
}
