import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/modules/identity/hooks';
import { NotificationBell } from '@/modules/notifications/components/NotificationBell';
import { Button } from '@/shared/ui/Button';
import { Sidebar } from './Sidebar';

/** Persistent layout for authenticated screens: header + sidebar + routed content. */
export function AppShell() {
  const profile = useAuthStore((s) => s.profile);
  const logout = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-body hover:bg-background lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green text-sm font-bold text-white">
              أ
            </div>
            <span className="hidden text-sm font-semibold text-heading sm:inline">
              ثانوية الأمير عبدالمجيد الأولى
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-start leading-tight">
              <p className="text-sm font-medium text-heading">{profile?.full_name}</p>
              <p className="text-xs text-muted">{profile?.specialization}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-heading/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[80%] bg-surface p-4 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-heading">القائمة</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-body"
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
