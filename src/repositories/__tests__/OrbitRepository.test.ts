import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { OrbitRepository } from '@/repositories/OrbitRepository'

describe('OrbitRepository organization isolation', () => {
  it('rejects any read for an organizationId that is not the loaded organization', () => {
    const dataset = seedDemoData()
    const repo = new OrbitRepository(dataset)
    expect(() => repo.listPeople('some-other-org')).toThrow('Cross-organization access denied')
    expect(() => repo.listSkills('some-other-org')).toThrow('Cross-organization access denied')
    expect(() => repo.getPerson('some-other-org', dataset.people[0].id)).toThrow('Cross-organization access denied')
  })

  it('returns only data belonging to the active organization', () => {
    const dataset = seedDemoData()
    const repo = new OrbitRepository(dataset)
    const people = repo.listPeople(dataset.organization.id)
    expect(people.length).toBe(dataset.people.length)
    expect(people.every((p) => p.organizationId === dataset.organization.id)).toBe(true)
  })

  it('refuses to import a person tagged with a different organizationId', () => {
    const dataset = seedDemoData()
    const repo = new OrbitRepository(dataset)
    const rogue = { ...dataset.people[0], id: 'rogue-1', organizationId: 'another-org' }
    expect(() => repo.addPeople(dataset.organization.id, [rogue], [], [])).toThrow(
      'Cannot import a person into another organization',
    )
  })

  it('addPeople appends new people without mutating the original dataset object', () => {
    const dataset = seedDemoData()
    const repo = new OrbitRepository(dataset)
    const newPerson = { ...dataset.people[0], id: 'new-1' }
    const updated = repo.addPeople(dataset.organization.id, [newPerson], [], [])
    expect(updated.people.length).toBe(dataset.people.length + 1)
    expect(dataset.people.length).toBe(updated.people.length - 1)
  })
})
