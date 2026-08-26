import type { OrganizationDataset } from '@/types'
import {
  normalizeQuery,
  rankPeople,
  searchPeople,
  searchSkills,
  searchTeams,
  type PersonSearchResult,
} from './SearchService'

export type AskIntent = 'skill' | 'location' | 'team' | 'most-connected' | 'general'

export interface AskResult {
  query: string
  intent: AskIntent
  entity: string | null
  results: PersonSearchResult[]
  summary: string
}

const SKILL_INTENT_PATTERNS = [/who knows (.+)/, /who can help (?:me )?with (.+)/, /expert(?:s)? (?:in|on) (.+)/, /expertise (?:in|with) (.+)/]
const LOCATION_INTENT_PATTERNS = [/who has (?:worked|experience) in (.+)/, /who works? in (.+)/, /based in (.+)/]
const TEAM_INTENT_PATTERNS = [/who works? with (?:the )?(.+?) team/, /(.+?) team/]
const CONNECTED_INTENT_PATTERNS = [/most connected/, /best connected/, /well[- ]connected/]

function matchFirst(query: string, patterns: RegExp[]): string | null {
  const normalized = normalizeQuery(query)
  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

function detectIntent(query: string): { intent: AskIntent; entity: string | null } {
  const normalized = normalizeQuery(query)

  if (CONNECTED_INTENT_PATTERNS.some((p) => p.test(normalized))) {
    return { intent: 'most-connected', entity: null }
  }

  const location = matchFirst(query, LOCATION_INTENT_PATTERNS)
  if (location) return { intent: 'location', entity: location }

  const team = matchFirst(query, TEAM_INTENT_PATTERNS)
  if (team) return { intent: 'team', entity: team }

  const skill = matchFirst(query, SKILL_INTENT_PATTERNS)
  if (skill) return { intent: 'skill', entity: skill }

  return { intent: 'general', entity: null }
}

export function askOrbit(dataset: OrganizationDataset, rawQuery: string): AskResult {
  const query = rawQuery.trim()
  if (!query) {
    return { query, intent: 'general', entity: null, results: [], summary: 'Ask ORBIT anything about your organization.' }
  }

  const { intent, entity } = detectIntent(query)

  let results: PersonSearchResult[] = []
  let summary = ''

  switch (intent) {
    case 'most-connected': {
      const ranked = rankPeople(dataset, dataset.people).slice(0, 8)
      results = ranked.map((p) => ({
        person: p,
        score: Math.min(100, Math.round(p.connectionScore * 10)),
        matchedSkills: [],
        explanations: [{ kind: 'inference', text: `${p.connectionScore} connection strength across the organization` }],
      }))
      summary =
        results.length > 0
          ? `${results[0].person.firstName} ${results[0].person.lastName} is the most connected person in your organization.`
          : 'No connection data available yet.'
      break
    }
    case 'location': {
      results = searchPeople(dataset, entity ?? query)
      summary = entity
        ? results.length > 0
          ? `${results.length} ${results.length === 1 ? 'person has' : 'people have'} a connection to "${entity}".`
          : `No one in your organization is currently linked to "${entity}".`
        : ''
      break
    }
    case 'team': {
      const teamMatches = searchTeams(dataset, entity ?? query)
      if (teamMatches.length > 0) {
        results = searchPeople(dataset, '', { team: teamMatches[0].team.id }).map((r) => ({
          ...r,
          score: 70,
          explanations: [{ kind: 'fact' as const, text: `Member of the ${teamMatches[0].team.name} team` }],
        }))
        summary = `${results.length} people work with the ${teamMatches[0].team.name} team.`
      }
      break
    }
    case 'skill':
    default: {
      const searchTerm = entity ?? query
      results = searchPeople(dataset, searchTerm)
      if (results.length === 0) {
        const closeSkills = searchSkills(dataset, searchTerm).slice(0, 3)
        summary =
          closeSkills.length > 0
            ? `No exact match for "${searchTerm}" yet. Related: ${closeSkills.map((s) => s.skill.name).join(', ')}.`
            : `Nothing in your organization matches "${searchTerm}" yet.`
      } else {
        const top = results[0]
        summary = `${results.length} ${results.length === 1 ? 'person matches' : 'people match'} "${searchTerm}". Top match: ${top.person.firstName} ${top.person.lastName} (${top.score}%).`
      }
      break
    }
  }

  return { query, intent, entity, results: results.slice(0, 8), summary }
}

export const ASK_SUGGESTIONS = [
  'Who knows Salesforce?',
  'Who can help with AI?',
  'Who has experience in Germany?',
  'Who are our most connected people?',
  'Who works with the Finance team?',
]
