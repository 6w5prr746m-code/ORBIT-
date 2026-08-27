import type { OrganizationDataset, Person, PersonSkill, Skill, Team } from '@/types'

export interface SkillHolder {
  person: Person
  level: PersonSkill['level']
}

export interface RiskySkill {
  skill: Skill
  holders: SkillHolder[]
}

export interface TeamRiskSummary {
  team: Team
  memberCount: number
  criticalCount: number
  fragileCount: number
}

export interface CoverageReport {
  totalSkills: number
  /** Held by exactly one person org-wide — if they leave, this knowledge leaves with them. */
  criticalSkills: RiskySkill[]
  /** Held by exactly two people org-wide — one departure away from becoming critical. */
  fragileSkills: RiskySkill[]
  teamRisk: TeamRiskSummary[]
}

/** Deterministic, rule-based risk analysis — no LLM, every number traces back to person_skills. */
export function buildCoverageReport(dataset: OrganizationDataset): CoverageReport {
  const nonLanguageSkills = dataset.skills.filter((s) => s.category !== 'Language')

  const holdersBySkill = new Map<string, SkillHolder[]>()
  for (const ps of dataset.personSkills) {
    const skill = dataset.skills.find((s) => s.id === ps.skillId)
    if (!skill || skill.category === 'Language') continue
    const person = dataset.people.find((p) => p.id === ps.personId)
    if (!person) continue
    const list = holdersBySkill.get(ps.skillId) ?? []
    list.push({ person, level: ps.level })
    holdersBySkill.set(ps.skillId, list)
  }

  const criticalSkills: RiskySkill[] = []
  const fragileSkills: RiskySkill[] = []
  for (const skill of nonLanguageSkills) {
    const holders = holdersBySkill.get(skill.id) ?? []
    if (holders.length === 1) criticalSkills.push({ skill, holders })
    else if (holders.length === 2) fragileSkills.push({ skill, holders })
  }
  criticalSkills.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
  fragileSkills.sort((a, b) => a.skill.name.localeCompare(b.skill.name))

  const criticalSkillIds = new Set(criticalSkills.map((c) => c.skill.id))
  const fragileSkillIds = new Set(fragileSkills.map((c) => c.skill.id))

  const teamIdsByPerson = new Map<string, string[]>()
  for (const pt of dataset.personTeams) {
    const list = teamIdsByPerson.get(pt.personId) ?? []
    list.push(pt.teamId)
    teamIdsByPerson.set(pt.personId, list)
  }
  const memberCountByTeam = new Map<string, number>()
  for (const pt of dataset.personTeams) memberCountByTeam.set(pt.teamId, (memberCountByTeam.get(pt.teamId) ?? 0) + 1)

  const teamRisk: TeamRiskSummary[] = dataset.teams
    .map((team) => {
      const seenCritical = new Set<string>()
      const seenFragile = new Set<string>()
      for (const ps of dataset.personSkills) {
        const teamIds = teamIdsByPerson.get(ps.personId) ?? []
        if (!teamIds.includes(team.id)) continue
        if (criticalSkillIds.has(ps.skillId)) seenCritical.add(ps.skillId)
        if (fragileSkillIds.has(ps.skillId)) seenFragile.add(ps.skillId)
      }
      return {
        team,
        memberCount: memberCountByTeam.get(team.id) ?? 0,
        criticalCount: seenCritical.size,
        fragileCount: seenFragile.size,
      }
    })
    .sort((a, b) => b.criticalCount - a.criticalCount || b.fragileCount - a.fragileCount)

  return { totalSkills: nonLanguageSkills.length, criticalSkills, fragileSkills, teamRisk }
}
