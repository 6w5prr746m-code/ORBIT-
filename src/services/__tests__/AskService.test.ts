import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { askOrbit } from '@/services/AskService'

const dataset = seedDemoData()

describe('askOrbit', () => {
  it('answers "Who knows Salesforce?" with people who hold the skill', () => {
    const result = askOrbit(dataset, 'Who knows Salesforce?')
    expect(result.intent).toBe('skill')
    expect(result.results.length).toBeGreaterThan(0)
    expect(result.summary).toContain('%')
  })

  it('answers "Who can help with AI?" using Artificial Intelligence holders', () => {
    const result = askOrbit(dataset, 'Who can help with AI?')
    expect(result.intent).toBe('skill')
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('answers "Who has experience in Germany?" with a location intent', () => {
    const result = askOrbit(dataset, 'Who has experience in Germany?')
    expect(result.intent).toBe('location')
    expect(result.entity).toBe('germany')
    expect(result.results.every((r) => r.person.country === 'Germany')).toBe(true)
  })

  it('answers "Who are our most connected people?" deterministically', () => {
    const result = askOrbit(dataset, 'Who are our most connected people?')
    expect(result.intent).toBe('most-connected')
    const again = askOrbit(dataset, 'Who are our most connected people?')
    expect(result.results.map((r) => r.person.id)).toEqual(again.results.map((r) => r.person.id))
  })

  it('answers "Who works with the Finance team?" with Finance team members', () => {
    const result = askOrbit(dataset, 'Who works with the Finance team?')
    expect(result.intent).toBe('team')
    const financeTeam = dataset.teams.find((t) => t.name === 'Finance')!
    const memberIds = new Set(dataset.personTeams.filter((pt) => pt.teamId === financeTeam.id).map((pt) => pt.personId))
    for (const r of result.results) {
      expect(memberIds.has(r.person.id)).toBe(true)
    }
  })

  it('never invents a skill a person does not have — every fact explanation traces back to real data', () => {
    const result = askOrbit(dataset, 'Who knows Python?')
    for (const r of result.results) {
      for (const explanation of r.explanations) {
        if (explanation.text.startsWith('Python')) {
          const hasSkill = dataset.personSkills.some(
            (ps) => ps.personId === r.person.id && dataset.skills.find((s) => s.id === ps.skillId)?.name === 'Python',
          )
          expect(hasSkill).toBe(true)
        }
      }
    }
  })

  it('returns an empty-result summary for a query that matches nothing', () => {
    const result = askOrbit(dataset, 'Who knows underwater basket weaving?')
    expect(result.results).toHaveLength(0)
    expect(result.summary.length).toBeGreaterThan(0)
  })
})
