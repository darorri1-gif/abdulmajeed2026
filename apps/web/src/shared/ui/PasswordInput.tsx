import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={cn(
            'h-11 w-full rounded-lg border border-border bg-surface px-3 pe-10 text-sm text-heading',
            'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40',
            'aria-[invalid=true]:border-danger disabled:opacity-50',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          className="absolute inset-y-0 end-2 flex items-center text-muted hover:text-body"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
