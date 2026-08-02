# Deployment Guide — Abdulmajeed2026

## Live backend status (Supabase project `cjaiifnkpxujszvkmuqd`)

- **Database:** ✅ all 12 migrations applied — 33 tables (RLS on every one), 74 RLS policies.
- **Storage:** ✅ 3 private buckets (`evidence`, `follow-up`, `discussion`) + 9 object policies.
- **Functions/triggers:** ✅ 22 SECURITY DEFINER functions, 20 triggers, all seeds loaded.
- **Edge Functions:** ✅ `admin-create-user` and `admin-reset-password` deployed & ACTIVE (verify_jwt = on).
- **First admin:** ⏳ one manual step (below) — needs the admin's real email/password.

## 1) Netlify environment variables (turnkey values)

Netlify → Site settings → Environment variables:

```
VITE_SUPABASE_URL       = https://cjaiifnkpxujszvkmuqd.supabase.co
VITE_SUPABASE_ANON_KEY  = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYWlpZm5rcHh1anN6dmttdXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzQ0MDUsImV4cCI6MjEwMTExMDQwNX0.c-w-nWJxjbhAtJlzr4LunGrcPWM0FmRd02fPyYxaLPg
```

(The anon key is a public client key — safe in the browser. The service_role key must NEVER be
placed in the frontend or the repo.)

## 2) First System Administrator (the one remaining step)

Because creating an auth login requires choosing a real email + password, do this once:

1. Supabase Dashboard → Authentication → Users → **Add user**
   - Email: the real ministry email, Password: a temporary one, **Auto Confirm User: ON**.
   - Copy the new user's UUID.
2. Open `supabase/seed/first_admin.sql`, replace `<AUTH_USER_UUID>` (and the email/name), run it
   in the SQL editor. It creates the profile and grants `system_admin`.

## 3) Auth hardening

Authentication → Providers → Email → turn **off** public sign-ups (accounts are admin-provisioned).

## 4) Netlify build

`netlify.toml` (repo root) already sets `base = apps/web`, `command = npm run build`,
`publish = dist`, SPA redirect, and security headers. Connect the repo (or drag-and-drop this
folder); Netlify runs `npm install` then `npm run build` (`tsc` → `vite build`) and publishes
`apps/web/dist`.

## 5) PWA icons (before build)

Add `apps/web/public/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
(referenced in `public/manifest.webmanifest`).

## Notes

- The production build runs on Netlify (this packaging environment has no network to install npm
  dependencies). Run `npm run typecheck` locally for an early type gate.
