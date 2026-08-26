import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { Person } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { initials } from '@/lib/utils'

export function PersonCard({ person, topSkills }: { person: Person; topSkills: string[] }) {
  return (
    <Link
      to={`/people/${person.id}`}
      className="group flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-canvas-raised p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
    >
      <div className="flex items-center gap-3">
        <Avatar name={`${person.firstName} ${person.lastName}`} initials={initials(person.firstName, person.lastName)} size={44} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">
            {person.firstName} {person.lastName}
          </p>
          <p className="truncate text-sm text-graphite">{person.jobTitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-graphite-soft">
        <span>{person.department}</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {person.location}
        </span>
      </div>

      {topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topSkills.slice(0, 4).map((skill) => (
            <Tag key={skill} className="group-hover:border-accent/30 group-hover:text-accent-ink">
              {skill}
            </Tag>
          ))}
        </div>
      )}
    </Link>
  )
}
