import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/queryClient';
import { AuthProvider } from '@/modules/identity/AuthProvider';
import { Toaster } from '@/shared/ui/toast';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
