import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { buildDiscoverRows } from '@/services/DiscoverService'

describe('buildDiscoverRows', () => {
  it('is deterministic given the same dataset', () => {
    const dataset = seedDemoData()
    const a = buildDiscoverRows(dataset)
    const b = buildDiscoverRows(dataset)
    expect(a.map((r) => r.cards.map((c) => (c.kind === 'person' ? c.person.id : c.skill.id)))).toEqual(
      b.map((r) => r.cards.map((c) => (c.kind === 'person' ? c.person.id : c.skill.id))),
    )
  })

  it('only surfaces "Hidden experts" who genuinely hold a rare expert-level skill', () => {
    const dataset = seedDemoData()
    const rows = buildDiscoverRows(dataset)
    const hidden = rows.find((r) => r.id === 'hidden-experts')
    expect(hidden).toBeDefined()
    for (const card of hidden!.cards) {
      if (card.kind !== 'person') continue
      const skills = dataset.personSkills.filter((ps) => ps.personId === card.person.id && ps.level === 'expert')
      expect(skills.length).toBeGreaterThan(0)
    }
  })

  it('produces non-empty rows for a well-populated organization', () => {
    const dataset = seedDemoData()
    const rows = buildDiscoverRows(dataset)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.cards.length).toBeGreaterThan(0)
    }
  })
})
