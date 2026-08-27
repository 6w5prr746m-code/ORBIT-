import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { buildCoverageReport } from '@/services/CoverageService'
import type { OrganizationDataset } from '@/types'

describe('buildCoverageReport', () => {
  it('is deterministic given the same dataset', () => {
    const dataset = seedDemoData()
    const a = buildCoverageReport(dataset)
    const b = buildCoverageReport(dataset)
    expect(a.criticalSkills.map((c) => c.skill.id)).toEqual(b.criticalSkills.map((c) => c.skill.id))
    expect(a.fragileSkills.map((c) => c.skill.id)).toEqual(b.fragileSkills.map((c) => c.skill.id))
  })

  it('never classifies a Language skill as critical or fragile', () => {
    const dataset = seedDemoData()
    const report = buildCoverageReport(dataset)
    for (const c of [...report.criticalSkills, ...report.fragileSkills]) {
      expect(c.skill.category).not.toBe('Language')
    }
  })

  it('classifies a skill held by exactly one person as critical, with that person listed', () => {
    const dataset = seedDemoData()
    const target = dataset.skills.find((s) => s.category !== 'Language')!
    const dataset2: OrganizationDataset = {
      ...dataset,
      personSkills: [
        ...dataset.personSkills.filter((ps) => ps.skillId !== target.id),
        { personId: dataset.people[0].id, skillId: target.id, level: 'expert', yearsExperience: 5, source: 'verified' },
      ],
    }
    const report = buildCoverageReport(dataset2)
    const critical = report.criticalSkills.find((c) => c.skill.id === target.id)
    expect(critical).toBeDefined()
    expect(critical!.holders).toHaveLength(1)
    expect(critical!.holders[0].person.id).toBe(dataset.people[0].id)
  })

  it('classifies a skill held by exactly two people as fragile, not critical', () => {
    const dataset = seedDemoData()
    const target = dataset.skills.find((s) => s.category !== 'Language')!
    const dataset2: OrganizationDataset = {
      ...dataset,
      personSkills: [
        ...dataset.personSkills.filter((ps) => ps.skillId !== target.id),
        { personId: dataset.people[0].id, skillId: target.id, level: 'expert', yearsExperience: 5, source: 'verified' },
        { personId: dataset.people[1].id, skillId: target.id, level: 'proficient', yearsExperience: 3, source: 'verified' },
      ],
    }
    const report = buildCoverageReport(dataset2)
    expect(report.fragileSkills.some((c) => c.skill.id === target.id)).toBe(true)
    expect(report.criticalSkills.some((c) => c.skill.id === target.id)).toBe(false)
  })

  it('sorts team risk with the highest critical-skill exposure first', () => {
    const dataset = seedDemoData()
    const report = buildCoverageReport(dataset)
    for (let i = 1; i < report.teamRisk.length; i++) {
      const prev = report.teamRisk[i - 1]
      const curr = report.teamRisk[i]
      expect(prev.criticalCount > curr.criticalCount || (prev.criticalCount === curr.criticalCount && prev.fragileCount >= curr.fragileCount)).toBe(true)
    }
  })
})
