import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Users2, X } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { PageHeader } from '@/components/common/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { EmptyState } from '@/components/ui/EmptyState'
import { initials } from '@/lib/utils'
import { buildTeam } from '@/services/TeamBuilderService'

export function TeamBuilderPage() {
  const dataset = useDataset()
  const { t } = useTranslation()
  const [skillIds, setSkillIds] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [teamSize, setTeamSize] = useState('4')
  const [location, setLocation] = useState('')

  const locations = useMemo(() => (dataset ? [...new Set(dataset.people.map((p) => p.location))].sort() : []), [dataset])

  const result = useMemo(() => {
    if (!dataset || skillIds.length === 0) return null
    return buildTeam(dataset, { skillIds, teamSize: Number(teamSize) || 1, location: location || undefined })
  }, [dataset, skillIds, teamSize, location])

  if (!dataset) return null

  function addSkill() {
    const match = dataset!.skills.find((s) => s.name.toLowerCase() === skillInput.trim().toLowerCase())
    if (match && !skillIds.includes(match.id)) setSkillIds((prev) => [...prev, match.id])
    setSkillInput('')
  }

  function removeSkill(skillId: string) {
    setSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  return (
    <div>
      <PageHeader title={t('teamBuilder.title')} description={t('teamBuilder.description')} />

      <div className="flex flex-col gap-8 px-6 py-8 sm:px-10">
        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">{t('teamBuilder.skillsLabel')}</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {skillIds.map((id) => {
                  const skill = dataset.skills.find((s) => s.id === id)
                  if (!skill) return null
                  return (
                    <Tag key={id} className="gap-1.5">
                      {skill.name}
                      <button onClick={() => removeSkill(id)} aria-label={t('teamBuilder.removeSkill', { skill: skill.name })} className="text-graphite-soft hover:text-danger">
                        <X className="h-3 w-3" />
                      </button>
                    </Tag>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  list="team-builder-skill-options"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder={t('teamBuilder.skillsPlaceholder')}
                  className="max-w-sm"
                />
                <datalist id="team-builder-skill-options">
                  {dataset.skills
                    .filter((s) => s.category !== 'Language')
                    .map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                </datalist>
                <button
                  onClick={addSkill}
                  className="rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3.5 text-sm font-medium text-graphite transition-colors hover:text-ink"
                >
                  {t('teamBuilder.addSkill')}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('teamBuilder.teamSizeLabel')}</label>
                <Input type="number" min="1" max="20" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="w-24" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('teamBuilder.locationLabel')}</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-3 text-sm text-ink focus-visible:outline-none focus:border-accent"
                >
                  <option value="">{t('teamBuilder.anyLocation')}</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {!result && skillIds.length === 0 && <p className="text-sm text-graphite-soft">{t('teamBuilder.emptyPrompt')}</p>}

        {result && result.team.length === 0 && (
          <EmptyState icon={Users2} title={t('teamBuilder.noMatch.title')} description={t('teamBuilder.noMatch.description')} />
        )}

        {result && result.team.length > 0 && (
          <div className="flex flex-col gap-4">
            {result.uncoveredSkills.length > 0 && (
              <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <p>{t('teamBuilder.uncovered', { skills: result.uncoveredSkills.map((s) => s.name).join(', ') })}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.team.map((candidate) => (
                <Card key={candidate.person.id} className="p-5">
                  <Link to={`/people/${candidate.person.id}`} className="flex items-center gap-3">
                    <Avatar
                      name={`${candidate.person.firstName} ${candidate.person.lastName}`}
                      initials={initials(candidate.person.firstName, candidate.person.lastName)}
                      photoUrl={candidate.person.avatar}
                      size={44}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">
                        {candidate.person.firstName} {candidate.person.lastName}
                      </p>
                      <p className="truncate text-sm text-graphite">{candidate.person.jobTitle}</p>
                    </div>
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.coveredSkills.map((c) => (
                      <Tag key={c.skill.id} className="gap-1">
                        {c.skill.name}
                        <Badge variant={c.level === 'expert' ? 'accent' : 'default'} className="px-1.5 py-0 text-[10px]">
                          {t(`common.levels.${c.level}`)}
                        </Badge>
                      </Tag>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
