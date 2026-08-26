import type { OrganizationDataset, Person, PersonSkill, Skill, Team } from '@/types'

const COMBINING_DIACRITICS = /[̀-ͯ]/g

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[?!.,]/g, '')
    .trim()
}

function tokens(text: string): string[] {
  return normalizeQuery(text)
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

const STOPWORDS = new Set([
  'who',
  'knows',
  'know',
  'can',
  'help',
  'with',
  'has',
  'have',
  'worked',
  'working',
  'work',
  'works',
  'experience',
  'expert',
  'experts',
  'expertise',
  'the',
  'our',
  'are',
  'is',
  'in',
  'on',
  'of',
  'about',
  'team',
  'and',
  'for',
])

function meaningfulTokens(query: string): string[] {
  return tokens(query).filter((t) => !STOPWORDS.has(t))
}

/** Common acronyms people actually type, mapped to how they appear in the skill catalog. */
const QUERY_ALIASES: Record<string, string> = {
  ai: 'artificial intelligence',
  ml: 'machine learning',
  ux: 'ux design',
  ui: 'ui design',
  qa: 'qa & test automation',
  bi: 'business intelligence',
  nlp: 'natural language processing',
  hr: 'people',
}

/** Cheap fuzzy containment: exact substring beats token overlap, both beat nothing. */
function textScore(haystack: string, needle: string): number {
  const h = normalizeQuery(haystack)
  const n = normalizeQuery(needle)
  if (!n) return 0
  const candidates = [n, QUERY_ALIASES[n]].filter((c): c is string => !!c)

  for (const candidate of candidates) {
    if (h === candidate) return 100
    // Haystack-contains-needle only: a short field like "Sales" must never register as a
    // match for a longer query like "Salesforce" just because it's a substring of it.
    if (h.includes(candidate)) return 80
  }

  const needleTokens = meaningfulTokens(needle)
  const haystackTokens = new Set(tokens(haystack))
  if (needleTokens.length === 0) return 0
  const overlap = needleTokens.filter((t) => haystackTokens.has(t)).length
  return overlap > 0 ? Math.round((overlap / needleTokens.length) * 60) : 0
}

export type ExplanationKind = 'fact' | 'inference' | 'recommendation'
export interface Explanation {
  kind: ExplanationKind
  text: string
}

export interface PersonSearchResult {
  person: Person
  score: number
  matchedSkills: Skill[]
  explanations: Explanation[]
}

export interface SearchFilters {
  team?: string
  location?: string
  role?: string
  skillIds?: string[]
}

function personTeams(dataset: OrganizationDataset, personId: string): Team[] {
  const teamIds = dataset.personTeams.filter((pt) => pt.personId === personId).map((pt) => pt.teamId)
  return dataset.teams.filter((t) => teamIds.includes(t.id))
}

function personSkillEntries(dataset: OrganizationDataset, personId: string): PersonSkill[] {
  return dataset.personSkills.filter((ps) => ps.personId === personId)
}

export function skillsForPerson(dataset: OrganizationDataset, personId: string): (Skill & PersonSkill)[] {
  const entries = personSkillEntries(dataset, personId)
  return entries
    .map((entry) => {
      const skill = dataset.skills.find((s) => s.id === entry.skillId)
      return skill ? { ...skill, ...entry } : null
    })
    .filter((s): s is Skill & PersonSkill => s !== null)
}

function levelWeight(level: PersonSkill['level']): number {
  return level === 'expert' ? 20 : level === 'proficient' ? 10 : 4
}

/**
 * Base relevance of a person against a free-text query, independent of any specific skill match.
 * Matches on name, job title, department, location, bio.
 */
function personTextRelevance(person: Person, query: string): number {
  const fields = [person.jobTitle, person.department, `${person.firstName} ${person.lastName}`, person.location, person.bio]
  return Math.max(...fields.map((f) => textScore(f, query)))
}

export function searchPeople(dataset: OrganizationDataset, query: string, filters: SearchFilters = {}): PersonSearchResult[] {
  let candidates = dataset.people

  if (filters.team) {
    const teamIds = dataset.personTeams.filter((pt) => pt.teamId === filters.team).map((pt) => pt.personId)
    candidates = candidates.filter((p) => teamIds.includes(p.id))
  }
  if (filters.location) {
    candidates = candidates.filter((p) => p.location === filters.location || p.country === filters.location)
  }
  if (filters.role) {
    candidates = candidates.filter((p) => p.jobTitle === filters.role)
  }
  if (filters.skillIds && filters.skillIds.length > 0) {
    const withSkill = new Set(dataset.personSkills.filter((ps) => filters.skillIds!.includes(ps.skillId)).map((ps) => ps.personId))
    candidates = candidates.filter((p) => withSkill.has(p.id))
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return candidates.map((person) => ({ person, score: 0, matchedSkills: [], explanations: [] }))
  }

  const matchingSkillIds = new Set(
    dataset.skills.filter((s) => textScore(s.name, trimmedQuery) >= 60).map((s) => s.id),
  )

  const results: PersonSearchResult[] = candidates.map((person) => {
    const mySkills = skillsForPerson(dataset, person.id)
    const matchedSkills = mySkills.filter((s) => matchingSkillIds.has(s.id))
    const explanations: Explanation[] = []
    let score = 0

    for (const skill of matchedSkills) {
      const base = 50 + levelWeight(skill.level) + Math.min(skill.yearsExperience, 10) * 2
      score += base
      explanations.push({
        kind: skill.source === 'verified' ? 'fact' : 'inference',
        text: `${skill.name} — ${skill.level} (${skill.yearsExperience} yr${skill.yearsExperience === 1 ? '' : 's'})`,
      })
    }

    const textRelevance = personTextRelevance(person, trimmedQuery)
    if (matchedSkills.length === 0 && textRelevance > 0) {
      score += textRelevance
      explanations.push({ kind: 'fact', text: `Matches "${trimmedQuery}" in role, team or bio` })
    } else if (textRelevance >= 60) {
      score += 15
    }

    const teams = personTeams(dataset, person.id)
    if (teams.length > 0 && matchedSkills.length > 0) {
      explanations.push({ kind: 'fact', text: `Works with the ${teams[0].name} team` })
    }

    return { person, score: Math.min(100, score), matchedSkills, explanations }
  })

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

export interface SkillSearchResult {
  skill: Skill
  peopleCount: number
  score: number
}

export function searchSkills(dataset: OrganizationDataset, query: string): SkillSearchResult[] {
  const trimmed = query.trim()
  return dataset.skills
    .map((skill) => {
      const score = trimmed ? textScore(skill.name, trimmed) : 0
      const peopleCount = dataset.personSkills.filter((ps) => ps.skillId === skill.id).length
      return { skill, peopleCount, score }
    })
    .filter((r) => (trimmed ? r.score > 0 : true))
    .sort((a, b) => b.score - a.score || b.peopleCount - a.peopleCount)
}

export interface TeamSearchResult {
  team: Team
  memberCount: number
  score: number
}

export function searchTeams(dataset: OrganizationDataset, query: string): TeamSearchResult[] {
  const trimmed = query.trim()
  return dataset.teams
    .map((team) => {
      const score = trimmed ? textScore(team.name, trimmed) : 0
      const memberCount = dataset.personTeams.filter((pt) => pt.teamId === team.id).length
      return { team, memberCount, score }
    })
    .filter((r) => (trimmed ? r.score > 0 : true))
    .sort((a, b) => b.score - a.score || b.memberCount - a.memberCount)
}

/** Overall org-wide search used by the global search bar (Home). */
export function searchOrganization(dataset: OrganizationDataset, query: string) {
  return {
    people: searchPeople(dataset, query).slice(0, 8),
    skills: searchSkills(dataset, query).slice(0, 6),
    teams: searchTeams(dataset, query).slice(0, 4),
  }
}

/** Deterministic connection-strength ranking, used by Discover's "Most connected" row. */
export function rankPeople(dataset: OrganizationDataset, candidates: Person[]): (Person & { connectionScore: number })[] {
  return candidates
    .map((person) => {
      const strength = dataset.connections
        .filter((c) => c.personAId === person.id || c.personBId === person.id)
        .reduce((sum, c) => sum + c.strength, 0)
      return { ...person, connectionScore: Math.round(strength * 10) / 10 }
    })
    .sort((a, b) => b.connectionScore - a.connectionScore)
}

export function recommendPeople(
  dataset: OrganizationDataset,
  criteria: { excludePersonId?: string; sharedTeamWith?: string; sharedSkillWith?: string; limit?: number },
): Person[] {
  const limit = criteria.limit ?? 5
  let pool = dataset.people.filter((p) => p.id !== criteria.excludePersonId)

  if (criteria.sharedTeamWith) {
    const teamIds = new Set(dataset.personTeams.filter((pt) => pt.personId === criteria.sharedTeamWith).map((pt) => pt.teamId))
    const peopleInTeams = new Set(
      dataset.personTeams.filter((pt) => teamIds.has(pt.teamId)).map((pt) => pt.personId),
    )
    pool = pool.filter((p) => peopleInTeams.has(p.id))
  }

  if (criteria.sharedSkillWith) {
    const skillIds = new Set(dataset.personSkills.filter((ps) => ps.personId === criteria.sharedSkillWith).map((ps) => ps.skillId))
    const peopleWithSkills = new Set(
      dataset.personSkills.filter((ps) => skillIds.has(ps.skillId)).map((ps) => ps.personId),
    )
    pool = pool.filter((p) => peopleWithSkills.has(p.id))
  }

  return rankPeople(dataset, pool).slice(0, limit)
}
