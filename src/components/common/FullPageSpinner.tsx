import { Orbit } from 'lucide-react'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas">
      <Orbit className="h-8 w-8 animate-spin text-graphite-soft" strokeWidth={1.5} />
      <p className="text-sm text-graphite-soft">Loading your organization…</p>
    </div>
  )
}
