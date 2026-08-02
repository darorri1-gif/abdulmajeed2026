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

  const full_name = String(body.full_name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const username = body.username ? String(body.username).trim() : null;
  const specialization = String(body.specialization ?? '').trim();
  const password = String(body.password ?? '');
  const roleKeys = Array.isArray(body.role_keys) ? (body.role_keys as string[]) : [];

  if (!full_name || !email || !specialization || !password) {
    return json({ error: 'الحقول الإجبارية: الاسم الثلاثي، البريد الوزاري، التخصص، كلمة المرور' }, 400);
  }
  if (password.length < 8) {
    return json({ error: 'كلمة المرور يجب ألا تقل عن 8 أحرف' }, 400);
  }

  const admin = serviceClient();

  // Email verification is configurable.
  const { data: setting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'auth.email_verification_enabled')
    .maybeSingle();
  const emailVerification = setting?.value === true;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: !emailVerification,
  });
  if (createErr || !created?.user) {
    const dup = createErr?.message?.toLowerCase().includes('already');
    return json({ error: dup ? 'البريد مستخدم مسبقًا' : 'تعذّر إنشاء الحساب' }, 400);
  }
  const userId = created.user.id;

  const { error: profileErr } = await admin.from('profiles').insert({
    id: userId,
    full_name,
    email,
    username,
    specialization,
    status: 'active',
    must_change_password: true,
    created_by: guard.user.id,
  });
  if (profileErr) {
    // Roll back the auth user so we never leave an orphan.
    await admin.auth.admin.deleteUser(userId);
    const dup = profileErr.message.toLowerCase().includes('duplicate');
    return json({ error: dup ? 'اسم المستخدم مستخدم مسبقًا' : 'تعذّر إنشاء الملف الشخصي' }, 400);
  }

  if (roleKeys.length) {
    const { data: roles } = await admin.from('roles').select('id, key').in('key', roleKeys);
    if (roles?.length) {
      await admin.from('user_roles').insert(
        roles.map((r: { id: string }) => ({ user_id: userId, role_id: r.id, assigned_by: guard.user.id })),
      );
    }
  }

  return json({ id: userId }, 201);
});
