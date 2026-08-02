import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Service-role client for privileged operations. Never exposed to the browser. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Validate the caller's JWT and required permission. Returns { user } when
 * allowed, or { error: Response } to return immediately.
 */
export async function requirePermission(
  req: Request,
  permission: string,
): Promise<{ user: { id: string } } | { error: Response }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return { error: json({ error: 'غير مصرح' }, 401) };

  const { data: allowed } = await userClient.rpc('has_permission', { p_key: permission });
  if (!allowed) return { error: json({ error: 'صلاحيات غير كافية' }, 403) };

  return { user: { id: data.user.id } };
}
