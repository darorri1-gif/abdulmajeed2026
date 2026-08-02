import { corsHeaders, json, requirePermission, serviceClient } from '../_shared/edge.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const guard = await requirePermission(req, 'users.manage');
  if ('error' in guard) return guard.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'طلب غير صالح' }, 400);
  }

  const userId = String(body.user_id ?? '');
  const newPassword = String(body.new_password ?? '');
  if (!userId || newPassword.length < 8) {
    return json({ error: 'كلمة المرور يجب ألا تقل عن 8 أحرف' }, 400);
  }

  const admin = serviceClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return json({ error: 'تعذّر إعادة تعيين كلمة المرور' }, 400);

  // Force the user to change it on next login.
  await admin.from('profiles').update({ must_change_password: true }).eq('id', userId);

  return json({ ok: true });
});
