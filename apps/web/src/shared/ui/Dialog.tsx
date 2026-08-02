import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  title,
  description,
  children,
}: {
  className?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-heading/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-md focus:outline-none',
          className,
        )}
      >
        <div className="mb-4 pe-8">
          <DialogPrimitive.Title className="text-lg font-semibold text-heading">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-1 text-sm text-body">{description}</DialogPrimitive.Description>
          )}
        </div>
        {children}
        <DialogPrimitive.Close
          className="absolute end-4 top-4 text-muted hover:text-body focus:outline-none"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
