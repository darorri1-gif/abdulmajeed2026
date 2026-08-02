import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/shared/ui/feedback';

/** Requires an authenticated session; enforces the forced password change. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;

  if (profile?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}

/** Requires a specific permission; redirects home when the user lacks it. */
export function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hasPerm = useAuthStore((s) => s.permissions.includes(perm));

  if (status === 'loading') return <FullPageSpinner />;
  if (!hasPerm) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Requires any one of several permissions. */
export function RequireAnyPermission({ perms, children }: { perms: string[]; children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const permissions = useAuthStore((s) => s.permissions);

  if (status === 'loading') return <FullPageSpinner />;
  if (!perms.some((p) => permissions.includes(p))) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** For pages that should not be shown to an already-authenticated user (login). */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') {
    return <Navigate to={profile?.must_change_password ? '/change-password' : '/'} replace />;
  }
  return <>{children}</>;
}
