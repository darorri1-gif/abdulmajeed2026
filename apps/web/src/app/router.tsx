import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute, RequireAnyPermission, RequirePermission } from './guards';
import { FullPageSpinner } from '@/shared/ui/feedback';

// Route-level code splitting: each page ships in its own chunk.
const LoginPage = lazy(() => import('@/modules/identity/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const ChangePasswordPage = lazy(() => import('@/modules/identity/pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));
const UsersListPage = lazy(() => import('@/modules/identity/pages/UsersListPage').then((m) => ({ default: m.UsersListPage })));
const UserDetailPage = lazy(() => import('@/modules/identity/pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage })));
const RolesPage = lazy(() => import('@/modules/identity/pages/RolesPage').then((m) => ({ default: m.RolesPage })));
const MyProfilePage = lazy(() => import('@/modules/identity/pages/MyProfilePage').then((m) => ({ default: m.MyProfilePage })));
const EvidencePage = lazy(() => import('@/modules/evidence/pages/EvidencePage').then((m) => ({ default: m.EvidencePage })));
const EvidenceDetailPage = lazy(() => import('@/modules/evidence/pages/EvidenceDetailPage').then((m) => ({ default: m.EvidenceDetailPage })));
const StandardEvidencePage = lazy(() => import('@/modules/evidence/pages/StandardEvidencePage').then((m) => ({ default: m.StandardEvidencePage })));
const StandardsSettingsPage = lazy(() => import('@/modules/evidence/pages/StandardsSettingsPage').then((m) => ({ default: m.StandardsSettingsPage })));
const FollowupPage = lazy(() => import('@/modules/followup/pages/FollowupPage').then((m) => ({ default: m.FollowupPage })));
const StudentTimelinePage = lazy(() => import('@/modules/followup/pages/StudentTimelinePage').then((m) => ({ default: m.StudentTimelinePage })));
const SchoolSetupPage = lazy(() => import('@/modules/organization/pages/SchoolSetupPage').then((m) => ({ default: m.SchoolSetupPage })));
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SystemAdminPage = lazy(() => import('@/modules/admin/pages/SystemAdminPage').then((m) => ({ default: m.SystemAdminPage })));
const DiscussionPage = lazy(() => import('@/modules/discussion/pages/DiscussionPage').then((m) => ({ default: m.DiscussionPage })));
const PostDetailPage = lazy(() => import('@/modules/discussion/pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })));
const WorksheetsPage = lazy(() => import('@/modules/worksheets/pages/WorksheetsPage').then((m) => ({ default: m.WorksheetsPage })));
const WorksheetEditPage = lazy(() => import('@/modules/worksheets/pages/WorksheetEditPage').then((m) => ({ default: m.WorksheetEditPage })));
const WorksheetPresentPage = lazy(() => import('@/modules/worksheets/pages/WorksheetPresentPage').then((m) => ({ default: m.WorksheetPresentPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/discussion" element={<DiscussionPage />} />
            <Route path="/discussion/:id" element={<PostDetailPage />} />
            <Route path="/worksheets" element={<WorksheetsPage />} />
            <Route path="/worksheets/:id/edit" element={<WorksheetEditPage />} />
            <Route path="/worksheets/:id/present" element={<WorksheetPresentPage />} />
            <Route
              path="/dashboard"
              element={
                <RequirePermission perm="dashboard.view">
                  <DashboardPage />
                </RequirePermission>
              }
            />
            <Route
              path="/admin"
              element={
                <RequirePermission perm="settings.manage">
                  <SystemAdminPage />
                </RequirePermission>
              }
            />
            <Route
              path="/followup"
              element={
                <RequirePermission perm="followup.create">
                  <FollowupPage />
                </RequirePermission>
              }
            />
            <Route
              path="/followup/students/:id"
              element={
                <RequirePermission perm="followup.create">
                  <StudentTimelinePage />
                </RequirePermission>
              }
            />
            <Route
              path="/school-setup"
              element={
                <RequirePermission perm="organization.manage">
                  <SchoolSetupPage />
                </RequirePermission>
              }
            />
            <Route
              path="/evidence"
              element={
                <RequireAnyPermission perms={['evidence.create', 'evidence.view_all', 'evidence.review']}>
                  <EvidencePage />
                </RequireAnyPermission>
              }
            />
            <Route
              path="/evidence/standards"
              element={
                <RequirePermission perm="settings.manage">
                  <StandardsSettingsPage />
                </RequirePermission>
              }
            />
            <Route
              path="/evidence/standard/:standardId"
              element={
                <RequireAnyPermission perms={['evidence.create', 'evidence.view_all', 'evidence.review']}>
                  <StandardEvidencePage />
                </RequireAnyPermission>
              }
            />
            <Route
              path="/evidence/:id"
              element={
                <RequireAnyPermission perms={['evidence.create', 'evidence.view_all', 'evidence.review']}>
                  <EvidenceDetailPage />
                </RequireAnyPermission>
              }
            />
            <Route
              path="/users"
              element={
                <RequirePermission perm="users.view">
                  <UsersListPage />
                </RequirePermission>
              }
            />
            <Route
              path="/users/:id"
              element={
                <RequirePermission perm="users.view">
                  <UserDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="/roles"
              element={
                <RequirePermission perm="roles.manage">
                  <RolesPage />
                </RequirePermission>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
