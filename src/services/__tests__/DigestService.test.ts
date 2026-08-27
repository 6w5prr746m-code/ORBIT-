import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { buildDigest } from '@/services/DigestService'

describe('buildDigest', () => {
  it('is deterministic given the same dataset and reference time', () => {
    const dataset = seedDemoData()
    const now = new Date('2026-06-15T00:00:00Z')
    const a = buildDigest(dataset, now)
    const b = buildDigest(dataset, now)
    expect(a).toEqual(b)
  })

  it('surfaces someone who joined within the last 30 days', () => {
    const dataset = seedDemoData()
    const now = new Date('2026-06-15T00:00:00Z')
    const withRecentJoiner = {
      ...dataset,
      people: [
        { ...dataset.people[0], startDate: '2026-06-01', status: 'active' as const },
        ...dataset.people.slice(1),
      ],
    }
    const items = buildDigest(withRecentJoiner, now)
    const joinerItem = items.find((i) => i.kind === 'new-joiners')
    expect(joinerItem).toBeDefined()
    expect(joinerItem!.params.names).toContain(dataset.people[0].firstName)
  })

  it('does not surface a joiner from more than 30 days ago', () => {
    const dataset = seedDemoData()
    const now = new Date('2026-06-15T00:00:00Z')
    const noRecentJoiners = {
      ...dataset,
      people: dataset.people.map((p) => ({ ...p, startDate: '2020-01-01' })),
    }
    const items = buildDigest(noRecentJoiners, now)
    expect(items.some((i) => i.kind === 'new-joiners')).toBe(false)
  })

  it('surfaces a single point of failure with a link to the holder', () => {
    const dataset = seedDemoData()
    // Force every non-Language skill down to zero holders except one, so it's
    // unambiguously the (alphabetically first) critical skill the digest picks up.
    const target = [...dataset.skills].filter((s) => s.category !== 'Language').sort((a, b) => a.name.localeCompare(b.name))[0]
    const withCriticalSkill = {
      ...dataset,
      personSkills: [{ personId: dataset.people[0].id, skillId: target.id, level: 'expert' as const, yearsExperience: 5, source: 'verified' as const }],
    }
    const items = buildDigest(withCriticalSkill, new Date('2026-06-15T00:00:00Z'))
    const criticalItem = items.find((i) => i.id === `critical-${target.id}`)
    expect(criticalItem).toBeDefined()
    expect(criticalItem!.linkTo).toBe(`/people/${dataset.people[0].id}`)
  })

  it('returns an empty digest for an organization with no people', () => {
    const dataset = seedDemoData()
    const empty = { ...dataset, people: [], personSkills: [], connections: [], personTeams: [] }
    expect(buildDigest(empty, new Date('2026-06-15T00:00:00Z'))).toEqual([])
  })
})
