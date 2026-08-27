import type { OrganizationDataset, Person, PersonSkill, PersonTeam, Skill } from '@/types'

export const CSV_COLUMNS = ['firstName', 'lastName', 'email', 'jobTitle', 'department', 'location', 'country', 'skills', 'photoUrl'] as const
const OPTIONAL_CSV_COLUMNS: readonly string[] = ['skills', 'photoUrl']

export interface ParsedRow {
  rowNumber: number
  values: Record<string, string>
}

export interface RowError {
  rowNumber: number
  field?: string
  message: string
}

export interface ImportPreview {
  rows: ParsedRow[]
  errors: RowError[]
  validRowCount: number
}

/** Minimal RFC 4180-ish CSV parser: handles quoted fields, escaped quotes, and commas inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_PATTERN = /^https?:\/\/\S+$/i

export function buildPreview(csvText: string): ImportPreview {
  const rawRows = parseCsv(csvText)
  const errors: RowError[] = []

  if (rawRows.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, message: 'The file is empty.' }], validRowCount: 0 }
  }

  const header = rawRows[0].map((h) => h.trim())
  const missingColumns = CSV_COLUMNS.filter((c) => !OPTIONAL_CSV_COLUMNS.includes(c) && !header.includes(c))
  if (missingColumns.length > 0) {
    errors.push({ rowNumber: 0, message: `Missing required columns: ${missingColumns.join(', ')}` })
    return { rows: [], errors, validRowCount: 0 }
  }

  const rows: ParsedRow[] = rawRows.slice(1).map((cells, idx) => {
    const values: Record<string, string> = {}
    header.forEach((col, colIdx) => {
      values[col] = (cells[colIdx] ?? '').trim()
    })
    return { rowNumber: idx + 2, values }
  })

  let validRowCount = 0
  for (const row of rows) {
    const rowErrors: RowError[] = []
    if (!row.values.firstName) rowErrors.push({ rowNumber: row.rowNumber, field: 'firstName', message: 'First name is required.' })
    if (!row.values.lastName) rowErrors.push({ rowNumber: row.rowNumber, field: 'lastName', message: 'Last name is required.' })
    if (!row.values.email) rowErrors.push({ rowNumber: row.rowNumber, field: 'email', message: 'Email is required.' })
    else if (!EMAIL_PATTERN.test(row.values.email)) rowErrors.push({ rowNumber: row.rowNumber, field: 'email', message: 'Email looks invalid.' })
    if (!row.values.jobTitle) rowErrors.push({ rowNumber: row.rowNumber, field: 'jobTitle', message: 'Job title is required.' })
    if (!row.values.department) rowErrors.push({ rowNumber: row.rowNumber, field: 'department', message: 'Department is required.' })
    if (row.values.photoUrl && !URL_PATTERN.test(row.values.photoUrl))
      rowErrors.push({ rowNumber: row.rowNumber, field: 'photoUrl', message: 'Photo URL looks invalid.' })

    if (rowErrors.length === 0) validRowCount += 1
    errors.push(...rowErrors)
  }

  return { rows, errors, validRowCount }
}

export function inferSkillCategory(name: string): Skill['category'] {
  const lower = name.toLowerCase()
  if (/(python|java|sql|cloud|aws|azure|react|node|api|data|ai|ml|security|devops|salesforce|hubspot)/.test(lower))
    return 'Technology'
  if (/(design|ux|ui|branding|prototyp)/.test(lower)) return 'Design'
  if (/(english|french|german|spanish|dutch|italian|mandarin|portuguese)/.test(lower)) return 'Language'
  if (/(logistics|supply|process|procurement|facilities)/.test(lower)) return 'Operations'
  if (/(leadership|coaching|mentoring|speaking|management of people)/.test(lower)) return 'Leadership'
  return 'Business'
}

export interface ImportPayload {
  people: Person[]
  personSkills: PersonSkill[]
  personTeams: PersonTeam[]
  newSkills: Skill[]
}

export function buildImportPayload(dataset: OrganizationDataset, rows: ParsedRow[]): ImportPayload {
  const organizationId = dataset.organization.id
  const existingSkillsByName = new Map(dataset.skills.map((s) => [s.name.toLowerCase(), s]))
  const newSkills: Skill[] = []
  const people: Person[] = []
  const personSkills: PersonSkill[] = []
  const personTeams: PersonTeam[] = []

  for (const row of rows) {
    const v = row.values
    if (!v.firstName || !v.lastName || !v.email || !v.jobTitle || !v.department) continue

    const personId = crypto.randomUUID()
    const person: Person = {
      id: personId,
      organizationId,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      jobTitle: v.jobTitle,
      department: v.department,
      location: v.location || 'Unspecified',
      country: v.country || 'Unspecified',
      bio: `Imported via CSV. ${v.jobTitle} in ${v.department}.`,
      startDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      avatar: v.photoUrl && URL_PATTERN.test(v.photoUrl) ? v.photoUrl : undefined,
    }
    people.push(person)

    const skillNames = (v.skills || '')
      .split(/[;|]/)
      .map((s) => s.trim())
      .filter(Boolean)

    for (const skillName of skillNames) {
      let skill = existingSkillsByName.get(skillName.toLowerCase())
      if (!skill) {
        skill = {
          id: crypto.randomUUID(),
          organizationId,
          name: skillName,
          category: inferSkillCategory(skillName),
          description: `Added via CSV import.`,
        }
        newSkills.push(skill)
        existingSkillsByName.set(skillName.toLowerCase(), skill)
      }
      personSkills.push({
        personId,
        skillId: skill.id,
        level: 'proficient',
        yearsExperience: 2,
        source: 'self-reported',
      })
    }
  }

  return { people, personSkills, personTeams, newSkills }
}
