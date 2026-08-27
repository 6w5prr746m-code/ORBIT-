import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataset } from '@/hooks/useDataset'
import { PageHeader } from '@/components/common/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { initials } from '@/lib/utils'
import { buildDiscoverRows, type DiscoverCard } from '@/services/DiscoverService'

function Card({ card }: { card: DiscoverCard }) {
  const { t } = useTranslation()
  if (card.kind === 'person') {
    const { person, reason } = card
    return (
      <Link
        to={`/people/${person.id}`}
        className="flex w-56 shrink-0 snap-start flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-canvas-raised p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
      >
        <Avatar name={`${person.firstName} ${person.lastName}`} initials={initials(person.firstName, person.lastName)} photoUrl={person.avatar} size={40} />
        <div>
          <p className="truncate text-sm font-semibold text-ink">
            {person.firstName} {person.lastName}
          </p>
          <p className="truncate text-xs text-graphite">{person.jobTitle}</p>
        </div>
        <p className="line-clamp-2 text-xs text-graphite-soft">{reason}</p>
      </Link>
    )
  }

  const { skill, peopleCount, reason } = card
  return (
    <Link
      to={`/skills/${skill.id}`}
      className="flex w-56 shrink-0 snap-start flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-canvas-raised p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
    >
      <Badge variant="outline" className="w-fit">
        {t(`skills.categories.${skill.category}`)}
      </Badge>
      <div>
        <p className="text-sm font-semibold text-ink">{skill.name}</p>
        <p className="text-xs text-graphite-soft">{t('common.people', { count: peopleCount })}</p>
      </div>
      <p className="line-clamp-2 text-xs text-graphite-soft">{reason}</p>
    </Link>
  )
}

export function DiscoverPage() {
  const dataset = useDataset()
  const { t } = useTranslation()
  const rows = useMemo(() => (dataset ? buildDiscoverRows(dataset) : []), [dataset])

  if (!dataset) return null

  return (
    <div>
      <PageHeader title={t('discover.title')} description={t('discover.description')} />

      <div className="flex flex-col gap-10 px-6 py-8 sm:px-10">
        {rows.map((row) => (
          <section key={row.id}>
            <div className="mb-3">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{t(`discover.rows.${row.id}.title`)}</h2>
              <p className="text-sm text-graphite">{t(`discover.rows.${row.id}.description`)}</p>
            </div>
            <div className="scrollbar-none -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
              {row.cards.map((card) => (
                <Card key={card.kind === 'person' ? card.person.id : card.skill.id} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
