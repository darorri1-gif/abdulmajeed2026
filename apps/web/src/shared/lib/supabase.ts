import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * The single Supabase client for the app. Per the architecture, components never
 * import this directly — they go through each module's data-access layer.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
