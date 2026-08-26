import type { OrganizationDataset, Person, Skill } from '@/types'
import { rankPeople, skillsForPerson } from './SearchService'

export interface DiscoverPersonCard {
  kind: 'person'
  person: Person
  reason: string
}

export interface DiscoverSkillCard {
  kind: 'skill'
  skill: Skill
  peopleCount: number
  reason: string
}

export type DiscoverCard = DiscoverPersonCard | DiscoverSkillCard

export interface DiscoverRow {
  id: string
  title: string
  description: string
  cards: DiscoverCard[]
}

function topPeopleBySkillCategory(dataset: OrganizationDataset, category: Skill['category'], limit: number): DiscoverPersonCard[] {
  const scored = dataset.people.map((person) => {
    const skills = skillsForPerson(dataset, person.id).filter((s) => s.category === category)
    const best = skills.sort((a, b) => b.yearsExperience - a.yearsExperience)[0]
    const strength = skills.reduce((sum, s) => sum + (s.level === 'expert' ? 3 : s.level === 'proficient' ? 2 : 1), 0)
    return { person, strength, best }
  })
  return scored
    .filter((s) => s.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map((s) => ({
      kind: 'person' as const,
      person: s.person,
      reason: s.best ? `${s.best.name} — ${s.best.level}` : category,
    }))
}

/** Deterministic, rule-based recommendations. This is not a trained model — every row is
 *  computed straight from the dataset (skill levels, connection strength, skill rarity). */
export function buildDiscoverRows(dataset: OrganizationDataset): DiscoverRow[] {
  const rows: DiscoverRow[] = []

  rows.push({
    id: 'ai-technology',
    title: 'AI & Technology',
    description: 'People with the deepest technical and AI expertise.',
    cards: topPeopleBySkillCategory(dataset, 'Technology', 10),
  })

  rows.push({
    id: 'business-experts',
    title: 'Business Experts',
    description: 'People driving strategy, growth and operations.',
    cards: topPeopleBySkillCategory(dataset, 'Business', 10),
  })

  // Hidden experts: hold an expert-level skill that very few people in the org have,
  // and are not already among the most-connected — genuinely easy to miss.
  const skillHolderCounts = new Map<string, number>()
  for (const ps of dataset.personSkills) {
    skillHolderCounts.set(ps.skillId, (skillHolderCounts.get(ps.skillId) ?? 0) + 1)
  }
  const connectionRanked = rankPeople(dataset, dataset.people)
  const wellConnectedIds = new Set(connectionRanked.slice(0, Math.ceil(connectionRanked.length * 0.3)).map((p) => p.id))
  const hiddenCandidates: DiscoverPersonCard[] = []
  for (const person of dataset.people) {
    if (wellConnectedIds.has(person.id)) continue
    const skills = skillsForPerson(dataset, person.id)
    const rareExpert = skills
      .filter((s) => s.level === 'expert' && (skillHolderCounts.get(s.id) ?? 0) <= 4)
      .sort((a, b) => (skillHolderCounts.get(a.id) ?? 0) - (skillHolderCounts.get(b.id) ?? 0))[0]
    if (rareExpert) {
      hiddenCandidates.push({
        kind: 'person',
        person,
        reason: `Rare expertise in ${rareExpert.name} — only ${skillHolderCounts.get(rareExpert.id)} people org-wide`,
      })
    }
  }
  rows.push({
    id: 'hidden-experts',
    title: 'Hidden Experts',
    description: 'Rare, valuable expertise that rarely shows up on the radar.',
    cards: hiddenCandidates.slice(0, 10),
  })

  rows.push({
    id: 'most-connected',
    title: 'Most Connected',
    description: 'People at the center of how work gets done.',
    cards: connectionRanked.slice(0, 10).map((p) => ({
      kind: 'person' as const,
      person: p,
      reason: `${p.connectionScore} connection strength`,
    })),
  })

  // Emerging skills: adopted recently (low average tenure with the skill) by a meaningful group.
  const skillYears = new Map<string, number[]>()
  for (const ps of dataset.personSkills) {
    const list = skillYears.get(ps.skillId) ?? []
    list.push(ps.yearsExperience)
    skillYears.set(ps.skillId, list)
  }
  const emergingSkills: DiscoverSkillCard[] = dataset.skills
    .filter((s) => s.category !== 'Language')
    .map((skill) => {
      const years = skillYears.get(skill.id) ?? []
      const avgYears = years.length > 0 ? years.reduce((a, b) => a + b, 0) / years.length : Infinity
      return { skill, peopleCount: years.length, avgYears }
    })
    .filter((s) => s.peopleCount >= 3 && s.avgYears <= 2.5)
    .sort((a, b) => a.avgYears - b.avgYears)
    .slice(0, 10)
    .map((s) => ({
      kind: 'skill' as const,
      skill: s.skill,
      peopleCount: s.peopleCount,
      reason: `Growing fast — average ${s.avgYears.toFixed(1)} yrs experience`,
    }))
  rows.push({
    id: 'emerging-skills',
    title: 'Emerging Skills',
    description: 'Capabilities gaining ground across the organization.',
    cards: emergingSkills,
  })

  // Cross-functional people: highest count of collaborates-with connections to other teams.
  const personTeamMap = new Map<string, string>()
  for (const pt of dataset.personTeams) personTeamMap.set(pt.personId, pt.teamId)
  const crossFunctionalCounts = new Map<string, number>()
  for (const c of dataset.connections) {
    if (c.type !== 'collaborates-with') continue
    const teamA = personTeamMap.get(c.personAId)
    const teamB = personTeamMap.get(c.personBId)
    if (teamA && teamB && teamA !== teamB) {
      crossFunctionalCounts.set(c.personAId, (crossFunctionalCounts.get(c.personAId) ?? 0) + 1)
      crossFunctionalCounts.set(c.personBId, (crossFunctionalCounts.get(c.personBId) ?? 0) + 1)
    }
  }
  const crossFunctional: DiscoverPersonCard[] = [...crossFunctionalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([personId, count]) => {
      const person = dataset.people.find((p) => p.id === personId)!
      return { kind: 'person' as const, person, reason: `Collaborates across ${count} cross-team connection${count === 1 ? '' : 's'}` }
    })
  rows.push({
    id: 'cross-functional',
    title: 'Cross-functional People',
    description: 'People who connect teams together.',
    cards: crossFunctional,
  })

  return rows.filter((row) => row.cards.length > 0)
}
