# ثانوية الأمير عبدالمجيد الأولى — Internal Staff Workspace

Version 1 — built module by module on the approved Modular Architecture (React + TypeScript + Vite PWA, Supabase backend, RTL Arabic-first).

## Feature 1 — Authentication (this delivery)

Included and production-ready:

- **Project foundation** (shared, reused by every later module): Vite + React + TS, Tailwind design tokens (school colors, IBM Plex Sans Arabic), the `cn` helper, the Supabase client, the TanStack Query client, and the app shell/providers.
- **UI design-system primitives**: Button, Input, Label, PasswordInput, Card, Alert, Spinner.
- **Auth session management**: `AuthProvider` bootstraps the session and syncs the profile into a Zustand store; auto token refresh via supabase-js.
- **Login by email OR username** + password (username is resolved to the account email server-side).
- **Forced first-login password change**.
- **Route guards**: `ProtectedRoute` / `PublicOnlyRoute`, with the forced-change redirect.
- **Sign-out**.
- **Supabase migration** `0001_identity_profiles.sql`: the `profiles` table, RLS (self read/update), the `updated_at` trigger, and the `resolve_login_identifier` function.

## Feature 2 — User Management + RBAC (this delivery)

Included and production-ready:

- **Database-driven RBAC** (`0002_rbac.sql`): `roles`, `permissions`, `role_permissions`, `user_roles`; helper functions `has_permission()`, `current_user_permissions()`, and the paginated `search_users()`; RLS on every table; directory read (`users.view`) and admin write (`users.manage`) policies on `profiles`; system-role delete protection; and seed data (6 roles, permission catalog, default role→permission mappings).
- **App settings** (`0003_app_settings.sql`): key/value store with the configurable `auth.email_verification_enabled` flag.
- **Edge Functions** (service role, permission-guarded): `admin-create-user` (creates the auth user, respects email-verification, stamps the profile, assigns roles, rolls back on failure) and `admin-reset-password`.
- **User list**: server-side search, role/status filters, and pagination; responsive table (cards on mobile).
- **Create / edit users**, **activate / deactivate**, **assign roles**, **reset password**, and a **role → permission matrix**.
- **Personal profile page** and a permission-gated **sidebar + mobile drawer**.
- UI primitives added: Dialog, Table, Badge, Select, Switch, and a lightweight toast system.

Deferred to later modules (by design): Evidence, Student Follow-up, dashboards. **"Assign School" is intentionally not built** — the approved database is single-school; multi-school support would be a database change awaiting approval.

## Feature 3 — Evidence Management (الشواهد) (this delivery)

Built on the approved Database Design (Module 1). Educational philosophy of تمام is unchanged; the 11 standards are configurable data.

- **Schema** (`0004_evidence.sql`): `academic_years` (with a single-current constraint), `standards` + `standard_indicators`, `evidence`, `evidence_files`, `evidence_comments`, `evidence_status_history`; full RLS (owner/reviewer/view-all); `review_evidence()` RPC (atomic status change gated by `evidence.approve`/`evidence.review`); automatic status-history + timestamps via triggers; seed of the current year and the 11 standards.
- **Storage** (`0005_evidence_storage.sql`): private `evidence` bucket with object-level RLS mirroring the data rules (owner writes; owner/reviewer reads via signed URLs).
- **UI**: standards board with per-standard counts, filters (status/search/scope), create & edit, submit-for-review, reviewer approve/needs-revision/reject with notes, file attachments (upload + signed-URL download + delete), comment thread, and an approval timeline. Plus a **Standards settings** screen to rename/activate standards.

Deferred to later modules (by design): Student Follow-up, dashboards, discussion board, worksheets.

## Feature 4 — Organization + Student Follow-up (this delivery)

**Organization foundation** (`0006_organization.sql`): `grade_levels`, `subjects`, `classes`, `students`, `student_enrollments`, `teaching_assignments`, with RLS (`organization.view/manage`, `students.view/manage`) and teacher-scoped RPCs (`my_classes`, `class_students`, `my_students`, `list_shareable_staff`) so teachers see only their own structure without broad read access. Seeds: grade levels + common subjects. A lean **School Setup** admin creates classes/students, enrolls students, and assigns teachers.

**Student Follow-up** (`0007_followup.sql`, `0008_followup_storage.sql`) — the privacy-critical module. The rule is enforced in SQL via `can_access_followup()`: an entry is visible only to its **author** unless the author shares it (to a specific user, a role, or the leadership team). **No role — including System Administrator — can read private follow-up content; there is no admin override.** Whole-class entries materialize to per-student rows (`via_class_id`), so each student's timeline is one fast query. Creation is atomic through `create_followup_entry()` (verifies the students are within the teacher's classes). UI: classroom overview, instant student search, per-student timeline with filters/search, and a fast quick-entry dialog with the visibility selector. A private `follow-up` storage bucket exists with object RLS mirroring the same predicate.

Deferred to later modules (by design): dashboards, discussion board, worksheets.

## Feature 5 — Principal Dashboard + Notifications (this delivery)

**Notifications** (`0009`): `notifications` table with recipient-only RLS; rows are written solely by a `SECURITY DEFINER` trigger on evidence status changes (submit → notify reviewers; approve/reject/needs-revision → notify the author). App-wide bell with unread badge (polls every 60s) and a notifications page with deep links + mark-as-read.

**Principal Dashboard** (`dashboard.view`): aggregate RPCs — `school_overview()` (staff/students/classes + evidence by status), `teacher_evidence_progress()`, `evidence_by_standard()` (completion bars). **Follow-up summary is privacy-safe**: it counts only entries the viewer is actually permitted to see (`can_access_followup`), never private content. Reports: browser print + CSV export of teacher progress. Quick links to permission management and school setup.

Deferred to later modules (by design): System Administrator dashboard, discussion board, worksheets.

## Feature 6 — System Administrator Dashboard (this delivery)

**Audit Trail** (`0010`, Module 4): append-only `audit_log`, read-only via `audit.view`, written solely by a `SECURITY DEFINER` `audit_trigger()` attached to evidence, user_roles, role_permissions, app_settings, profiles, students, and classes. Actions are recorded (create/submit/approve/grant/revoke/config_change…) with ids and short summaries — **follow-up content is never audited** (privacy). `system_stats()` powers monitoring counts.

**Admin console** (`settings.manage`, i.e. system_admin): tabs for **monitoring** (live counts), **settings** (a key/value editor covering global, email, and feature-flag settings that the relevant modules read — booleans render as switches), **audit log** (filter by action/entity + pagination), and **backup** (guidance: Supabase-managed automated backups). Plus quick links to user, role, and school management (reusing the existing modules rather than duplicating them).

Deferred to later modules (by design): discussion board, worksheets.

## Feature 7 — Educational Discussion Board (this delivery)

`0011_discussion.sql`: `discussion_categories`, `discussion_posts` (with pin/announcement flags), `discussion_comments`, `discussion_reactions`, `discussion_attachments`, plus a private `discussion` storage bucket. Staff-only community: all authenticated staff read/post/comment/react; **pinning and announcements are gated by a new `discussion.moderate` permission** (granted to system_admin, principal, vice_principal). Feed via `list_discussion_posts()` (counts + whether you reacted), reactions toggled atomically by `toggle_post_reaction()`. UI: feed with category filter, search, announcements toggle, composer, and a post page with reactions, attachments, comments, pin/delete.

## Feature 8 — Interactive Worksheets (this delivery)

`0012_worksheets.sql`: `worksheets` + ordered `worksheet_items` (multiple_choice, poll, short_answer, info). A modern classroom activity builder — not a graded LMS, not a Madrasati clone. Owners build activities; published worksheets form a shared staff library (RLS: own or published). UI: a builder (add/reorder/edit items, set correct answers) and a clean full-screen **presenter** for class delivery with reveal-answer and prev/next.

---

## ✅ Version 1 complete

All seven modules are built on the approved Architecture, Database Design, and Design System, single-school for ثانوية الأمير عبدالمجيد الأولى. See the completion report for deployment and testing checklists.

## Setup

Prerequisites: Node.js 18+ and a Supabase project.

1. **Install**
   ```bash
   cd apps/web
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project
   ```

3. **Apply the database migrations (in order)**
   Run these in the Supabase SQL editor (or `supabase db push` via the CLI):
   `0001_identity_profiles.sql` → `0002_rbac.sql` → `0003_app_settings.sql` →
   `0004_evidence.sql` → `0005_evidence_storage.sql` → `0006_organization.sql` →
   `0007_followup.sql` → `0008_followup_storage.sql` → `0009_notifications_dashboard.sql` →
   `0010_audit_system.sql` → `0011_discussion.sql` → `0012_worksheets.sql`.

4. **Deploy the Edge Functions**
   ```bash
   supabase functions deploy admin-create-user
   supabase functions deploy admin-reset-password
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
   automatically by Supabase — no manual secrets required.

5. **Create the first admin**
   Follow the steps in `supabase/seed/first_admin.sql` (create the auth user in the
   Dashboard, then insert the matching profile), then grant it the `system_admin`
   role:
   ```sql
   insert into public.user_roles (user_id, role_id)
   select p.id, r.id from public.profiles p, public.roles r
   where p.email = '<admin-email>' and r.key = 'system_admin';
   ```

6. **Disable public sign-up**
   Supabase Dashboard → Authentication → Providers → Email → turn **off** "Allow new users to sign up".
   (Accounts are provisioned by the admin only.)

7. **Run**
   ```bash
   npm run dev
   ```
   Sign in with the admin's ministry email (or username `admin`) and the password you set.

## Notes

- PWA icons are referenced in `public/manifest.webmanifest` at `/icons/…`; add the PNG assets before an installable production build.
- The Arabic font loads from Google Fonts for now; it can be self-hosted (`@fontsource/ibm-plex-sans-arabic`) later without code changes.

---

جميع الحقوق محفوظة — ثانوية الأمير عبدالمجيد الأولى · تطوير وتصميم: أحمد الدوسي
