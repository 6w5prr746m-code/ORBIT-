import type { OrganizationDataset } from '@/types'
import { buildCoverageReport } from './CoverageService'
import { buildDiscoverRows } from './DiscoverService'

export type DigestItemKind = 'new-joiners' | 'critical-skill' | 'hidden-experts' | 'emerging-skills'

export interface DigestItem {
  id: string
  kind: DigestItemKind
  i18nKey: string
  params: Record<string, string | number>
  linkTo: string
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Proactive, deterministic signals surfaced on Home instead of waiting for
 * someone to visit Discover — reuses CoverageService/DiscoverService so
 * there's exactly one source of truth for what "critical" or "hidden
 * expert" means. `now` is injectable for tests; defaults to the real clock.
 */
export function buildDigest(dataset: OrganizationDataset, now: Date = new Date()): DigestItem[] {
  const items: DigestItem[] = []

  const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS)
  const newJoiners = dataset.people.filter((p) => p.status === 'active' && new Date(p.startDate) >= cutoff)
  if (newJoiners.length > 0) {
    const names = newJoiners.slice(0, 3).map((p) => `${p.firstName} ${p.lastName}`)
    items.push({
      id: 'new-joiners',
      kind: 'new-joiners',
      i18nKey: 'digest.newJoiners',
      params: { count: newJoiners.length, names: names.join(', ') },
      linkTo: '/people',
    })
  }

  const coverage = buildCoverageReport(dataset)
  for (const critical of coverage.criticalSkills.slice(0, 3)) {
    const holder = critical.holders[0].person
    items.push({
      id: `critical-${critical.skill.id}`,
      kind: 'critical-skill',
      i18nKey: 'digest.criticalSkill',
      params: { skill: critical.skill.name, person: `${holder.firstName} ${holder.lastName}` },
      linkTo: `/people/${holder.id}`,
    })
  }

  const discoverRows = buildDiscoverRows(dataset)
  const hiddenRow = discoverRows.find((r) => r.id === 'hidden-experts')
  if (hiddenRow && hiddenRow.cards.length > 0) {
    items.push({
      id: 'hidden-experts',
      kind: 'hidden-experts',
      i18nKey: 'digest.hiddenExperts',
      params: { count: hiddenRow.cards.length },
      linkTo: '/discover',
    })
  }

  const emergingRow = discoverRows.find((r) => r.id === 'emerging-skills')
  if (emergingRow && emergingRow.cards.length > 0) {
    items.push({
      id: 'emerging-skills',
      kind: 'emerging-skills',
      i18nKey: 'digest.emergingSkills',
      params: { count: emergingRow.cards.length },
      linkTo: '/discover',
    })
  }

  return items
}
