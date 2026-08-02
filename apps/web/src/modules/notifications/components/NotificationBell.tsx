import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '../notifications.hooks';

export function NotificationBell() {
  const { data: count } = useUnreadCount();
  const unread = count ?? 0;

  return (
    <Link to="/notifications" className="relative rounded-lg p-2 text-body hover:bg-background" aria-label="الإشعارات">
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
