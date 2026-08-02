import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-heading',
        'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40',
        'aria-[invalid=true]:border-danger disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
