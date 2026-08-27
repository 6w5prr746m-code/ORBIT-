import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataset } from '@/hooks/useDataset'
import { PageHeader } from '@/components/common/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { initials } from '@/lib/utils'
import { buildCoverageReport, type RiskySkill } from '@/services/CoverageService'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

function RiskySkillRow({ item }: { item: RiskySkill }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border bg-canvas-raised px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{item.skill.name}</p>
          <Badge variant="outline" className="shrink-0">
            {t(`skills.categories.${item.skill.category}`)}
          </Badge>
        </div>
      </div>
      <div className="flex shrink-0 -space-x-2">
        {item.holders.map(({ person }) => (
          <Link key={person.id} to={`/people/${person.id}`} title={`${person.firstName} ${person.lastName}`}>
            <Avatar
              name={`${person.firstName} ${person.lastName}`}
              initials={initials(person.firstName, person.lastName)}
              photoUrl={person.avatar}
              size={32}
              className="border-2 border-canvas-raised"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CoveragePage() {
  const dataset = useDataset()
  const { t } = useTranslation()
  const report = useMemo(() => (dataset ? buildCoverageReport(dataset) : null), [dataset])

  if (!dataset || !report) return null

  return (
    <div>
      <PageHeader title={t('coverage.title')} description={t('coverage.description')} />

      <div className="flex flex-col gap-10 px-6 py-8 sm:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: t('coverage.stats.totalSkills'), value: report.totalSkills },
            { label: t('coverage.stats.critical'), value: report.criticalSkills.length },
            { label: t('coverage.stats.fragile'), value: report.fragileSkills.length },
            { label: t('coverage.stats.teams'), value: report.teamRisk.length },
          ].map((stat) => (
            <Card key={stat.label} className="p-5">
              <p className="text-2xl font-semibold tracking-tight text-ink">{stat.value}</p>
              <p className="mt-1 text-[13px] text-graphite-soft">{stat.label}</p>
            </Card>
          ))}
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-danger" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('coverage.critical.title')}</h2>
          </div>
          <p className="mb-3 max-w-2xl text-sm text-graphite">{t('coverage.critical.description')}</p>
          {report.criticalSkills.length === 0 ? (
            <EmptyState icon={ShieldCheck} title={t('coverage.critical.empty')} description={t('coverage.critical.emptyDescription')} />
          ) : (
            <div className="flex flex-col gap-2">
              {report.criticalSkills.map((item) => (
                <RiskySkillRow key={item.skill.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-graphite-soft" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('coverage.fragile.title')}</h2>
          </div>
          <p className="mb-3 max-w-2xl text-sm text-graphite">{t('coverage.fragile.description')}</p>
          {report.fragileSkills.length === 0 ? (
            <p className="text-sm text-graphite-soft">{t('coverage.fragile.empty')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {report.fragileSkills.map((item) => (
                <RiskySkillRow key={item.skill.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {report.teamRisk.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">{t('coverage.byTeam.title')}</h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-xs uppercase tracking-wide text-graphite-soft">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">{t('coverage.byTeam.team')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('coverage.byTeam.members')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('coverage.stats.critical')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('coverage.stats.fragile')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.teamRisk.map((row) => (
                    <tr key={row.team.id} className="border-t border-border">
                      <td className="px-4 py-2.5 font-medium text-ink">{row.team.name}</td>
                      <td className="px-4 py-2.5 text-graphite">{row.memberCount}</td>
                      <td className="px-4 py-2.5">
                        {row.criticalCount > 0 ? (
                          <Badge variant="default" className="border-danger/30 text-danger">
                            {row.criticalCount}
                          </Badge>
                        ) : (
                          <span className="text-graphite-soft">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-graphite">{row.fragileCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
