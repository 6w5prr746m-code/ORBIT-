import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { normalizeQuery, rankPeople, searchPeople, searchSkills } from '@/services/SearchService'

const dataset = seedDemoData()

describe('seedDemoData', () => {
  it('produces enough people and skills for a convincing demo', () => {
    expect(dataset.people.length).toBeGreaterThanOrEqual(50)
    expect(dataset.skills.length).toBeGreaterThanOrEqual(100)
    expect(dataset.teams.length).toBe(10)
  })

  it('is deterministic across runs', () => {
    const again = seedDemoData()
    expect(again.people.map((p) => p.id)).toEqual(dataset.people.map((p) => p.id))
    expect(again.people[0].firstName).toBe(dataset.people[0].firstName)
  })

  it('never assigns a person to a different organization', () => {
    for (const person of dataset.people) {
      expect(person.organizationId).toBe(dataset.organization.id)
    }
  })
})

describe('searchSkills', () => {
  it('finds Salesforce by name', () => {
    const results = searchSkills(dataset, 'Salesforce')
    expect(results[0]?.skill.name).toBe('Salesforce')
  })

  it('finds AI via Artificial Intelligence', () => {
    const results = searchSkills(dataset, 'AI')
    expect(results.some((r) => r.skill.name === 'Artificial Intelligence')).toBe(true)
  })
})

describe('searchPeople', () => {
  it('"Salesforce" only returns people who actually hold the Salesforce skill', () => {
    const results = searchPeople(dataset, 'Salesforce')
    const salesforceSkill = dataset.skills.find((s) => s.name === 'Salesforce')!
    const actualHolderIds = new Set(
      dataset.personSkills.filter((ps) => ps.skillId === salesforceSkill.id).map((ps) => ps.personId),
    )
    expect(results.length).toBeGreaterThan(0)
    for (const r of results) {
      expect(actualHolderIds.has(r.person.id)).toBe(true)
    }
  })

  it('never matches a department name as if it were a longer skill name (Sales vs Salesforce)', () => {
    const results = searchPeople(dataset, 'Salesforce')
    const salesforceSkill = dataset.skills.find((s) => s.name === 'Salesforce')!
    const holderIds = new Set(
      dataset.personSkills.filter((ps) => ps.skillId === salesforceSkill.id).map((ps) => ps.personId),
    )
    // Every Sales-department person without the Salesforce skill must be absent from results.
    const falsePositives = results.filter((r) => r.person.department === 'Sales' && !holderIds.has(r.person.id))
    expect(falsePositives).toHaveLength(0)
  })

  it('ranks higher skill level and more years of experience above lower ones', () => {
    const results = searchPeople(dataset, 'Salesforce')
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score)
    }
  })

  it('"Germany" matches people located in Germany', () => {
    const results = searchPeople(dataset, 'Germany')
    expect(results.length).toBeGreaterThan(0)
    for (const r of results) {
      expect(r.person.country === 'Germany' || r.person.location.includes('Germany')).toBe(true)
    }
  })

  it('filters by team', () => {
    const salesTeam = dataset.teams.find((t) => t.name === 'Sales')!
    const results = searchPeople(dataset, '', { team: salesTeam.id })
    const memberIds = new Set(dataset.personTeams.filter((pt) => pt.teamId === salesTeam.id).map((pt) => pt.personId))
    expect(results.every((r) => memberIds.has(r.person.id))).toBe(true)
  })
})

describe('rankPeople', () => {
  it('sorts by connection strength descending', () => {
    const ranked = rankPeople(dataset, dataset.people)
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].connectionScore).toBeGreaterThanOrEqual(ranked[i + 1].connectionScore)
    }
  })
})

describe('normalizeQuery', () => {
  it('lowercases, strips punctuation and trims', () => {
    expect(normalizeQuery('Who knows Salesforce?')).toBe('who knows salesforce')
  })

  it('strips accents so French queries still match', () => {
    expect(normalizeQuery('développeur')).toBe('developpeur')
  })
})
