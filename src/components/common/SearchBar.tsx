import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export function SearchBar({
  className,
  inputClassName,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string; inputClassName?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-graphite-soft" />
      <input
        className={cn(
          'h-14 w-full rounded-[var(--radius-card)] border border-border bg-canvas-raised pl-12 pr-4 text-[15px] text-ink shadow-[var(--shadow-card)] placeholder:text-graphite-soft transition-colors duration-150 focus:border-accent focus-visible:outline-none',
          inputClassName,
        )}
        {...props}
      />
    </div>
  )
}
