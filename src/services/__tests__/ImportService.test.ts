import { describe, expect, it } from 'vitest'
import { seedDemoData } from '@/data/seed/generate'
import { buildImportPayload, buildPreview, parseCsv } from '@/services/ImportService'

const VALID_CSV = `firstName,lastName,email,jobTitle,department,location,country,skills
Jordan,Rivera,jordan.rivera@example.com,Product Manager,Product,Austin,United States,Product Analytics;Go-To-Market Strategy
Priya,Shah,priya.shah@example.com,Software Engineer,Engineering,London,United Kingdom,Python`

const INVALID_CSV = `firstName,lastName,email,jobTitle,department,location,country,skills
,Rivera,not-an-email,Product Manager,Product,Austin,United States,`

describe('parseCsv', () => {
  it('parses a simple CSV into rows of cells', () => {
    const rows = parseCsv('a,b,c\n1,2,3')
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('name,note\n"Doe, Jane","Says ""hi"""')
    expect(rows[1]).toEqual(['Doe, Jane', 'Says "hi"'])
  })
})

describe('buildPreview', () => {
  it('accepts a well-formed CSV', () => {
    const preview = buildPreview(VALID_CSV)
    expect(preview.validRowCount).toBe(2)
    expect(preview.errors).toHaveLength(0)
  })

  it('flags missing required fields and bad emails', () => {
    const preview = buildPreview(INVALID_CSV)
    expect(preview.validRowCount).toBe(0)
    expect(preview.errors.some((e) => e.field === 'firstName')).toBe(true)
    expect(preview.errors.some((e) => e.field === 'email')).toBe(true)
  })

  it('reports missing required columns', () => {
    const preview = buildPreview('firstName,lastName\nJane,Doe')
    expect(preview.rows).toHaveLength(0)
    expect(preview.errors[0].message).toContain('Missing required columns')
  })
})

describe('buildImportPayload', () => {
  it('creates new people scoped to the active organization, reusing existing skills by name', () => {
    const dataset = seedDemoData()
    const preview = buildPreview(VALID_CSV)
    const payload = buildImportPayload(dataset, preview.rows)

    expect(payload.people).toHaveLength(2)
    for (const person of payload.people) {
      expect(person.organizationId).toBe(dataset.organization.id)
    }

    const pythonSkill = dataset.skills.find((s) => s.name === 'Python')!
    const priya = payload.people.find((p) => p.firstName === 'Priya')!
    const priyaSkillIds = payload.personSkills.filter((ps) => ps.personId === priya.id).map((ps) => ps.skillId)
    expect(priyaSkillIds).toContain(pythonSkill.id)
    expect(payload.newSkills.some((s) => s.name === 'Python')).toBe(false)
  })

  it('creates a new skill when the CSV references one that does not exist yet', () => {
    const dataset = seedDemoData()
    const csv = `firstName,lastName,email,jobTitle,department,location,country,skills\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France,Quantum Computing`
    const preview = buildPreview(csv)
    const payload = buildImportPayload(dataset, preview.rows)
    expect(payload.newSkills.some((s) => s.name === 'Quantum Computing')).toBe(true)
  })

  it('carries a valid photoUrl column through to the person avatar', () => {
    const dataset = seedDemoData()
    const csv = `firstName,lastName,email,jobTitle,department,location,country,skills,photoUrl\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France,,https://i.pravatar.cc/300?u=sam.lee`
    const preview = buildPreview(csv)
    const payload = buildImportPayload(dataset, preview.rows)
    expect(payload.people[0].avatar).toBe('https://i.pravatar.cc/300?u=sam.lee')
  })

  it('drops an invalid photoUrl instead of storing it', () => {
    const dataset = seedDemoData()
    const csv = `firstName,lastName,email,jobTitle,department,location,country,skills,photoUrl\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France,,not-a-url`
    const preview = buildPreview(csv)
    const payload = buildImportPayload(dataset, preview.rows)
    expect(payload.people[0].avatar).toBeUndefined()
  })

  it('creates a new entity when the CSV references one that does not exist yet', () => {
    const dataset = seedDemoData()
    const csv = `firstName,lastName,email,jobTitle,department,location,country,entity\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France,Acme France`
    const preview = buildPreview(csv)
    const payload = buildImportPayload(dataset, preview.rows)
    expect(payload.newEntities.some((e) => e.name === 'Acme France')).toBe(true)
    expect(payload.people[0].entityId).toBe(payload.newEntities[0].id)
  })

  it('reuses an existing entity by name instead of creating a duplicate', () => {
    const dataset = seedDemoData()
    const existingEntity = { id: 'ent-existing', organizationId: dataset.organization.id, name: 'Acme France' }
    const datasetWithEntity = { ...dataset, entities: [existingEntity] }
    const csv = `firstName,lastName,email,jobTitle,department,location,country,entity\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France,Acme France`
    const preview = buildPreview(csv)
    const payload = buildImportPayload(datasetWithEntity, preview.rows)
    expect(payload.newEntities).toHaveLength(0)
    expect(payload.people[0].entityId).toBe('ent-existing')
  })

  it('leaves entityId undefined when no entity column is provided', () => {
    const dataset = seedDemoData()
    const csv = `firstName,lastName,email,jobTitle,department,location,country\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France`
    const preview = buildPreview(csv)
    const payload = buildImportPayload(dataset, preview.rows)
    expect(payload.people[0].entityId).toBeUndefined()
  })
})

describe('buildPreview photoUrl validation', () => {
  it('flags a malformed photoUrl as a row error', () => {
    const csv = `firstName,lastName,email,jobTitle,department,location,country,skills,photoUrl\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France,,not-a-url`
    const preview = buildPreview(csv)
    expect(preview.errors.some((e) => e.field === 'photoUrl')).toBe(true)
  })

  it('accepts a row with no photoUrl at all', () => {
    const csv = `firstName,lastName,email,jobTitle,department,location,country\nSam,Lee,sam.lee@example.com,Analyst,Finance,Remote,France`
    const preview = buildPreview(csv)
    expect(preview.validRowCount).toBe(1)
  })
})
