import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, MapPin, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataset } from '@/hooks/useDataset'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PersonCard } from '@/components/people/PersonCard'
import { initials, formatDate } from '@/lib/utils'
import { recommendPeople, skillsForPerson } from '@/services/SearchService'
import { canHelpTopicsFor } from '@/data/seed/generate'

export function PersonProfilePage() {
  const { personId } = useParams<{ personId: string }>()
  const dataset = useDataset()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const data = useMemo(() => {
    if (!dataset || !personId) return null
    const person = dataset.people.find((p) => p.id === personId)
    if (!person) return null

    const skills = skillsForPerson(dataset, person.id).sort((a, b) => b.yearsExperience - a.yearsExperience)
    const teams = dataset.personTeams.filter((pt) => pt.personId === person.id).map((pt) => dataset.teams.find((t) => t.id === pt.teamId)!)
    const manager = person.managerId ? dataset.people.find((p) => p.id === person.managerId) : undefined

    const connections = dataset.connections.filter((c) => c.personAId === person.id || c.personBId === person.id)
    const worksWithIds = [...new Set(connections.map((c) => (c.personAId === person.id ? c.personBId : c.personAId)))]
    const worksWith = worksWithIds.map((id) => dataset.people.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 6)

    const canHelpWith = canHelpTopicsFor(person.id, dataset)
    const related = recommendPeople(dataset, { excludePersonId: person.id, sharedTeamWith: person.id, limit: 4 })

    return { person, skills, teams, manager, worksWith, canHelpWith, related }
  }, [dataset, personId])

  if (!dataset) return null
  if (!data) return <Navigate to="/people" replace />

  const { person, skills, teams, manager, worksWith, canHelpWith, related } = data
  const nonLanguageSkills = skills.filter((s) => s.category !== 'Language')
  const topSkillName = nonLanguageSkills[0]?.name

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-graphite hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {t('personProfile.back')}
      </button>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={`${person.firstName} ${person.lastName}`} initials={initials(person.firstName, person.lastName)} size={72} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {person.firstName} {person.lastName}
            </h1>
            <p className="mt-0.5 text-base text-graphite">{person.jobTitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-graphite-soft">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {teams[0]?.name ?? person.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {person.location}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="accent"
          onClick={() =>
            navigate(
              `/ask?q=${encodeURIComponent(
                topSkillName
                  ? t('personProfile.askQuestion', { firstName: person.firstName, skill: topSkillName })
                  : t('personProfile.askQuestionFallback', { fullName: `${person.firstName} ${person.lastName}` }),
              )}`,
            )
          }
        >
          <MessageCircle className="h-4 w-4" />
          {t('personProfile.askAboutPerson')}
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('personProfile.expertise')}</h2>
            <div className="flex flex-wrap gap-2">
              {nonLanguageSkills.map((s) => (
                <Tag key={s.id} className="gap-1.5">
                  {s.name}
                  <Badge variant={s.level === 'expert' ? 'accent' : 'default'} className="px-1.5 py-0 text-[10px]">
                    {t(`common.levels.${s.level}`)}
                  </Badge>
                </Tag>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('personProfile.about')}</h2>
            <p className="text-[15px] leading-relaxed text-ink">{person.bio}</p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('personProfile.experience')}</h2>
            <Card className="p-5">
              <p className="text-sm font-medium text-ink">{person.jobTitle}</p>
              <p className="text-sm text-graphite">
                {teams[0]?.name ?? person.department} · {t('personProfile.since', { date: formatDate(person.startDate) })}
              </p>
              {manager && (
                <p className="mt-2 text-sm text-graphite-soft">
                  {t('personProfile.reportsTo')}{' '}
                  <Link to={`/people/${manager.id}`} className="font-medium text-accent-ink hover:underline">
                    {manager.firstName} {manager.lastName}
                  </Link>
                </p>
              )}
            </Card>
          </section>

          {canHelpWith.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('personProfile.canHelpWith')}</h2>
              <ul className="flex flex-col gap-2">
                {canHelpWith.map((topic) => (
                  <li key={topic} className="rounded-[var(--radius-control)] border border-border bg-canvas-raised px-4 py-3 text-sm text-ink">
                    {topic}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-8">
          {worksWith.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('personProfile.worksWith')}</h2>
              <div className="flex flex-col gap-3">
                {worksWith.map((p) => (
                  <Link key={p.id} to={`/people/${p.id}`} className="flex items-center gap-3 rounded-[var(--radius-control)] p-2 transition-colors hover:bg-mist">
                    <Avatar name={`${p.firstName} ${p.lastName}`} initials={initials(p.firstName, p.lastName)} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="truncate text-xs text-graphite-soft">{p.jobTitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('personProfile.relatedPeople')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                topSkills={skillsForPerson(dataset, p.id)
                  .filter((s) => s.category !== 'Language')
                  .map((s) => s.name)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
