import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-heading',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
