import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/modules/identity/types/auth.types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  permissions: string[];
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setPermissions: (permissions: string[]) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  permissions: [],
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setPermissions: (permissions) => set({ permissions }),
  setStatus: (status) => set({ status }),
  reset: () => set({ status: 'unauthenticated', session: null, profile: null, permissions: [] }),
}));
