import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/notifications.api';

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: api.listNotifications });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: api.unreadCount,
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}
