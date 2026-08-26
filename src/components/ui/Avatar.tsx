import { cn } from '@/lib/utils'

const PALETTE = ['#3b5bfd', '#1c8a5e', '#b5750f', '#c23b3b', '#6d4fc4', '#0f8a9e']

function colorFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function Avatar({
  name,
  initials,
  size = 40,
  className,
}: {
  name: string
  initials: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, backgroundColor: colorFor(name), fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
