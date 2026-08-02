import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-background text-body',
      success: 'bg-brand-green/10 text-brand-green',
      warning: 'bg-brand-orange/10 text-brand-orange',
      danger: 'bg-danger/10 text-danger',
      gold: 'bg-brand-gold/10 text-brand-gold',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
