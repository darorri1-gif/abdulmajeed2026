import { create } from 'zustand';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type ToastKind = 'success' | 'error';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
  };
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-2 rounded-lg border bg-white p-3 text-sm shadow-md',
            t.kind === 'success' ? 'border-brand-green/20' : 'border-danger/20',
          )}
        >
          {t.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          )}
          <span className="flex-1 text-body">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-muted hover:text-body" aria-label="إغلاق">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
