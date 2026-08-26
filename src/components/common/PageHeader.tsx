import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-graphite-soft">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-graphite sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  )
}
