import { Link } from 'react-router-dom'
import type { Person } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { initials } from '@/lib/utils'

export function PersonGridCard({ person }: { person: Person }) {
  return (
    <Link
      to={`/people/${person.id}`}
      className="group flex flex-col items-center gap-2.5 rounded-[var(--radius-card)] border border-border bg-canvas-raised p-4 text-center shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
    >
      <Avatar
        name={`${person.firstName} ${person.lastName}`}
        initials={initials(person.firstName, person.lastName)}
        photoUrl={person.avatar}
        size={72}
      />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-ink">
          {person.firstName} {person.lastName}
        </p>
        <p className="truncate text-xs text-graphite">{person.jobTitle}</p>
      </div>
    </Link>
  )
}
