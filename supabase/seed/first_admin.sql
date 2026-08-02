-- =====================================================================
-- Bootstrap the first administrator (run ONCE, manually).
--
-- Step 1: Create the auth user in the Supabase Dashboard:
--         Authentication → Users → Add user
--         - Email:    admin@school.edu.sa   (use the real ministry email)
--         - Password: choose a temporary password
--         - Auto Confirm User: ON
--         Then copy the new user's UUID.
--
-- Step 2: Replace <AUTH_USER_UUID> below and run this in the SQL editor.
--         must_change_password is set to false so the bootstrap admin can
--         sign in directly. Regular accounts default to true (forced change).
-- =====================================================================

insert into public.profiles (id, full_name, email, username, specialization, status, must_change_password)
values (
  '<AUTH_USER_UUID>',
  'مدير النظام',
  'admin@school.edu.sa',
  'admin',
  'إدارة نظم المعلومات',
  'active',
  false
);
