import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function Alert({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-green', className)} aria-hidden />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
