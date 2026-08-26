import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3.5 text-sm text-ink placeholder:text-graphite-soft transition-colors duration-150 focus:border-accent focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
