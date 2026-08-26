import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card-lg)] border border-dashed border-border bg-canvas-raised/60 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist">
        <Icon className="h-5 w-5 text-graphite" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-graphite">{description}</p>
      {actionLabel && onAction && (
        <Button variant="accent" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
