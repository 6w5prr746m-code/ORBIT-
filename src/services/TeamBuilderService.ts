import type { OrganizationDataset, Person, Skill, SkillLevel } from '@/types'

function levelWeight(level: SkillLevel): number {
  return level === 'expert' ? 3 : level === 'proficient' ? 2 : 1
}

export interface CoveredSkill {
  skill: Skill
  level: SkillLevel
  yearsExperience: number
}

export interface TeamCandidate {
  person: Person
  coveredSkills: CoveredSkill[]
  score: number
}

export interface TeamBuilderInput {
  skillIds: string[]
  teamSize: number
  location?: string
}

export interface TeamBuilderResult {
  team: TeamCandidate[]
  uncoveredSkills: Skill[]
}

/**
 * Deterministic, explainable team composition: greedy set-cover over the
 * requested skills (each pick maximizes coverage of the skills still
 * missing), then rounds out the requested size with the next best overall
 * candidates. Every pick carries the exact skills/levels that earned their
 * spot — no black-box scoring.
 */
export function buildTeam(dataset: OrganizationDataset, input: TeamBuilderInput): TeamBuilderResult {
  const requestedSkills = input.skillIds
    .map((id) => dataset.skills.find((s) => s.id === id))
    .filter((s): s is Skill => !!s)
  if (requestedSkills.length === 0 || input.teamSize <= 0) {
    return { team: [], uncoveredSkills: requestedSkills }
  }

  let pool = dataset.people.filter((p) => p.status === 'active')
  if (input.location) pool = pool.filter((p) => p.location === input.location)

  const coverageByPerson = new Map<string, CoveredSkill[]>()
  for (const person of pool) {
    const covered: CoveredSkill[] = []
    for (const skill of requestedSkills) {
      const ps = dataset.personSkills.find((entry) => entry.personId === person.id && entry.skillId === skill.id)
      if (ps) covered.push({ skill, level: ps.level, yearsExperience: ps.yearsExperience })
    }
    if (covered.length > 0) coverageByPerson.set(person.id, covered)
  }

  function scoreOf(covered: CoveredSkill[]): number {
    return covered.reduce((sum, c) => sum + levelWeight(c.level) * 10 + c.yearsExperience, 0)
  }

  const candidates = [...coverageByPerson.entries()]
    .map(([personId, covered]) => ({
      person: pool.find((p) => p.id === personId)!,
      coveredSkills: covered,
      score: scoreOf(covered),
    }))
    .sort((a, b) => b.score - a.score || a.person.id.localeCompare(b.person.id))

  const remaining = new Set(requestedSkills.map((s) => s.id))
  const team: TeamCandidate[] = []
  const usedPersonIds = new Set<string>()

  // Phase 1: greedy set-cover — each pick maximizes weighted coverage of skills still missing.
  while (team.length < input.teamSize && remaining.size > 0) {
    let best: TeamCandidate | null = null
    let bestGain = 0
    for (const candidate of candidates) {
      if (usedPersonIds.has(candidate.person.id)) continue
      const stillMissing = candidate.coveredSkills.filter((c) => remaining.has(c.skill.id))
      if (stillMissing.length === 0) continue
      const gain = scoreOf(stillMissing)
      if (gain > bestGain) {
        best = candidate
        bestGain = gain
      }
    }
    if (!best) break
    team.push(best)
    usedPersonIds.add(best.person.id)
    for (const c of best.coveredSkills) remaining.delete(c.skill.id)
  }

  // Phase 2: round out the requested size with the next best overall candidates.
  for (const candidate of candidates) {
    if (team.length >= input.teamSize) break
    if (usedPersonIds.has(candidate.person.id)) continue
    team.push(candidate)
    usedPersonIds.add(candidate.person.id)
  }

  const uncoveredSkills = requestedSkills.filter((s) => remaining.has(s.id))
  return { team, uncoveredSkills }
}
