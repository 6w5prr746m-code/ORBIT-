import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { buildTeam } from '@/services/TeamBuilderService'

describe('buildTeam', () => {
  it('returns nothing for an empty skill list', () => {
    const dataset = seedDemoData()
    const result = buildTeam(dataset, { skillIds: [], teamSize: 3 })
    expect(result.team).toHaveLength(0)
  })

  it('is deterministic given the same input', () => {
    const dataset = seedDemoData()
    const skillIds = dataset.skills.filter((s) => s.category !== 'Language').slice(0, 3).map((s) => s.id)
    const a = buildTeam(dataset, { skillIds, teamSize: 4 })
    const b = buildTeam(dataset, { skillIds, teamSize: 4 })
    expect(a.team.map((t) => t.person.id)).toEqual(b.team.map((t) => t.person.id))
  })

  it('never returns more people than the requested team size', () => {
    const dataset = seedDemoData()
    const skillIds = dataset.skills.filter((s) => s.category !== 'Language').slice(0, 5).map((s) => s.id)
    const result = buildTeam(dataset, { skillIds, teamSize: 2 })
    expect(result.team.length).toBeLessThanOrEqual(2)
  })

  it('every selected person actually covers at least one requested skill', () => {
    const dataset = seedDemoData()
    const skillIds = dataset.skills.filter((s) => s.category !== 'Language').slice(0, 3).map((s) => s.id)
    const result = buildTeam(dataset, { skillIds, teamSize: 3 })
    for (const candidate of result.team) {
      expect(candidate.coveredSkills.length).toBeGreaterThan(0)
      for (const c of candidate.coveredSkills) expect(skillIds).toContain(c.skill.id)
    }
  })

  it('reports a skill as uncovered when nobody in the org holds it', () => {
    const dataset = seedDemoData()
    const fakeSkill = { id: 'nonexistent-skill', organizationId: dataset.organization.id, name: 'Time Travel', category: 'Technology' as const, description: '' }
    const datasetWithFakeSkill = { ...dataset, skills: [...dataset.skills, fakeSkill] }
    const result = buildTeam(datasetWithFakeSkill, { skillIds: [fakeSkill.id], teamSize: 3 })
    expect(result.uncoveredSkills.map((s) => s.id)).toContain('nonexistent-skill')
  })

  it('respects a location filter', () => {
    const dataset = seedDemoData()
    const location = dataset.people[0].location
    const skillIds = dataset.skills.filter((s) => s.category !== 'Language').slice(0, 3).map((s) => s.id)
    const result = buildTeam(dataset, { skillIds, teamSize: 5, location })
    for (const candidate of result.team) expect(candidate.person.location).toBe(location)
  })
})
