import { supabase } from '@/shared/lib/supabase';
import type { LoginInput, Profile } from '../types/auth.types';

/** Typed, user-facing (Arabic) error for the auth flow. */
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Resolve a login identifier (email or username) to the account email.
 * If it already looks like an email we use it directly; otherwise we ask the
 * server-side resolver.
 */
async function resolveEmail(identifier: string): Promise<string> {
  const value = identifier.trim();
  if (value.includes('@')) return value;

  const { data, error } = await supabase.rpc('resolve_login_identifier', { identifier: value });
  if (error) throw new AuthError('resolve_failed', 'تعذّر التحقق من اسم المستخدم، حاول مرة أخرى.');
  if (!data) throw new AuthError('invalid_credentials', 'بيانات الدخول غير صحيحة.');
  return data as string;
}

/** Fetch the current user's own profile (filtered by the authenticated user id). */
export async function fetchOwnProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

/** Sign in with email or username + password. Returns the profile on success. */
export async function login({ identifier, password }: LoginInput): Promise<Profile> {
  const email = await resolveEmail(identifier);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AuthError('invalid_credentials', 'بيانات الدخول غير صحيحة.');

  const profile = await fetchOwnProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw new AuthError('no_profile', 'لا يوجد ملف مرتبط بهذا الحساب. راجع مدير النظام.');
  }

  if (profile.status === 'suspended') {
    await supabase.auth.signOut();
    throw new AuthError('suspended', 'هذا الحساب موقوف. يرجى مراجعة مدير النظام.');
  }

  await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', profile.id);
  return profile;
}

/** Set a new password and clear the forced-change flag. */
export async function changePassword(newPassword: string, userId: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new AuthError('update_failed', 'تعذّر تحديث كلمة المرور، حاول مرة أخرى.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userId);
  if (profileError) throw new AuthError('update_failed', 'تم تغيير كلمة المرور لكن تعذّر تحديث الحالة.');
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** The current user's permission keys (used to gate the UI). */
export async function fetchMyPermissions(): Promise<string[]> {
  const { data, error } = await supabase.rpc('current_user_permissions');
  if (error) return [];
  return (data as string[]) ?? [];
}
