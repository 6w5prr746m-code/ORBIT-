import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-mist text-graphite',
        accent: 'bg-accent-soft text-accent-ink',
        outline: 'border border-border text-graphite bg-transparent',
        success: 'bg-success/10 text-success',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
