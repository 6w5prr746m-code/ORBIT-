import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <Compass className="h-10 w-10 text-graphite-soft" strokeWidth={1.5} />
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-graphite">This part of your organization doesn't exist — yet.</p>
      <Link
        to="/"
        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-medium text-white transition-all hover:brightness-110"
      >
        Back to Home
      </Link>
    </div>
  )
}
