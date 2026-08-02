/** Mirrors the public.profiles table (Identity foundation). */
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  specialization: string;
  phone: string | null;
  avatar_path: string | null;
  job_title: string | null;
  status: 'active' | 'suspended';
  must_change_password: boolean;
  last_login_at: string | null;
}

export interface LoginInput {
  identifier: string; // ministry email OR username
  password: string;
}
