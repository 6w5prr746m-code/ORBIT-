import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataset } from '@/hooks/useDataset'
import { Badge } from '@/components/ui/Badge'
import { PersonCard } from '@/components/people/PersonCard'
import { SearchBar } from '@/components/common/SearchBar'
import { normalizeQuery, skillsForPerson } from '@/services/SearchService'

export function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>()
  const dataset = useDataset()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const data = useMemo(() => {
    if (!dataset || !skillId) return null
    const skill = dataset.skills.find((s) => s.id === skillId)
    if (!skill) return null

    const holders = dataset.personSkills
      .filter((ps) => ps.skillId === skill.id)
      .map((ps) => ({ person: dataset.people.find((p) => p.id === ps.personId)!, ...ps }))
      .filter((h) => h.person)
      .sort((a, b) => b.yearsExperience - a.yearsExperience)

    const teamCounts = new Map<string, number>()
    for (const h of holders) {
      const teamIds = dataset.personTeams.filter((pt) => pt.personId === h.person.id).map((pt) => pt.teamId)
      for (const teamId of teamIds) teamCounts.set(teamId, (teamCounts.get(teamId) ?? 0) + 1)
    }
    const topTeams = [...teamCounts.entries()]
      .map(([teamId, count]) => ({ team: dataset.teams.find((t) => t.id === teamId)!, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const locationCounts = new Map<string, number>()
    for (const h of holders) locationCounts.set(h.person.location, (locationCounts.get(h.person.location) ?? 0) + 1)
    const topLocations = [...locationCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

    const relatedSkillCounts = new Map<string, number>()
    for (const h of holders) {
      const otherSkills = dataset.personSkills.filter((ps) => ps.personId === h.person.id && ps.skillId !== skill.id)
      for (const os of otherSkills) relatedSkillCounts.set(os.skillId, (relatedSkillCounts.get(os.skillId) ?? 0) + 1)
    }
    const relatedSkills = [...relatedSkillCounts.entries()]
      .map(([id, count]) => ({ skill: dataset.skills.find((s) => s.id === id)!, count }))
      .filter((r) => r.skill && r.skill.category !== 'Language')
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return { skill, holders, topTeams, topLocations, relatedSkills }
  }, [dataset, skillId])

  if (!dataset) return null
  if (!data) return <Navigate to="/skills" replace />

  const { skill, holders, topTeams, topLocations, relatedSkills } = data
  const filteredHolders = query.trim()
    ? holders.filter((h) => normalizeQuery(`${h.person.firstName} ${h.person.lastName} ${h.person.jobTitle}`).includes(normalizeQuery(query)))
    : holders

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-graphite hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {t('skillDetail.back')}
      </button>

      <Badge variant="outline" className="mb-3">
        {t(`skills.categories.${skill.category}`)}
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{skill.name}</h1>
      <p className="mt-1 text-base text-graphite">{t('skillDetail.people', { count: holders.length })}</p>
      <p className="mt-3 max-w-xl text-[15px] text-graphite">{t('skillDetail.description', { skillName: skill.name })}</p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('skillDetail.topExperts')}</h2>
          <div className="flex flex-col gap-2">
            {holders.slice(0, 5).map((h) => (
              <div key={h.person.id} className="flex items-center justify-between rounded-[var(--radius-control)] border border-border bg-canvas-raised px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {h.person.firstName} {h.person.lastName}
                  </p>
                  <p className="text-xs text-graphite-soft">{h.person.jobTitle}</p>
                </div>
                <Badge variant={h.level === 'expert' ? 'accent' : 'default'}>{t(`common.levels.${h.level}`)}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {topTeams.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('skillDetail.teams')}</h2>
              <div className="flex flex-col gap-2">
                {topTeams.map(({ team, count }) => (
                  <div key={team.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{team.name}</span>
                    <span className="text-graphite-soft">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topLocations.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('skillDetail.locations')}</h2>
              <div className="flex flex-col gap-2">
                {topLocations.map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{location}</span>
                    <span className="text-graphite-soft">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedSkills.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('skillDetail.relatedSkills')}</h2>
          <div className="flex flex-wrap gap-2">
            {relatedSkills.map(({ skill: rs }) => (
              <button
                key={rs.id}
                onClick={() => navigate(`/skills/${rs.id}`)}
                className="rounded-[var(--radius-pill)] border border-border bg-canvas-raised px-3.5 py-1.5 text-[13px] text-graphite transition-colors hover:border-accent/40 hover:text-accent-ink"
              >
                {rs.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('skillDetail.findSomeone')}</h2>
        <SearchBar placeholder={t('skillDetail.findSomeonePlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} className="mb-4 max-w-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHolders.map((h) => (
            <PersonCard
              key={h.person.id}
              person={h.person}
              topSkills={skillsForPerson(dataset, h.person.id)
                .filter((s) => s.category !== 'Language')
                .map((s) => s.name)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
