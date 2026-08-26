import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Tag({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-pill)] border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-graphite transition-colors',
        className,
      )}
      {...props}
    />
  )
}
