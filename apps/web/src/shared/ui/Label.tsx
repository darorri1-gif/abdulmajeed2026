import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/shared/lib/utils';

export const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('mb-1.5 block text-sm font-medium text-heading', className)}
    {...props}
  />
));
Label.displayName = 'Label';
