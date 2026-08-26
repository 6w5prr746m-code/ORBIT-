import { Link } from 'react-router-dom'
import type { Skill } from '@/types'
import { Badge } from '@/components/ui/Badge'

export function SkillCard({ skill, peopleCount }: { skill: Skill; peopleCount: number }) {
  return (
    <Link
      to={`/skills/${skill.id}`}
      className="group flex flex-col justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-canvas-raised p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
    >
      <div>
        <Badge variant="outline" className="mb-3">
          {skill.category}
        </Badge>
        <p className="text-[15px] font-semibold text-ink group-hover:text-accent-ink">{skill.name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-graphite">{skill.description}</p>
      </div>
      <p className="text-sm font-medium text-graphite-soft">
        {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
      </p>
    </Link>
  )
}
