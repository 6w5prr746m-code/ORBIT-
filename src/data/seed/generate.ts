import type {
  Connection,
  Organization,
  OrganizationDataset,
  Person,
  PersonSkill,
  PersonTeam,
  Skill,
  SkillLevel,
  Source,
  Team,
} from '@/types'
import { BIO_TEMPLATES, CAN_HELP_TEMPLATES, COUNTRY_POOLS, SKILL_CATALOG, TEAM_DEFS } from './pools'
import { createRng, intBetween, pick, pickMany, type Rng } from './rng'

const SEED = 42
const ORGANIZATION_ID = 'org-northstar'
const PEOPLE_PER_TEAM = 6 // 10 teams * 6 = 60 detailed people (comfortably above the 50 minimum)

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

function levelFromYears(years: number): SkillLevel {
  if (years >= 6) return 'expert'
  if (years >= 3) return 'proficient'
  return 'familiar'
}

export function seedDemoData(): OrganizationDataset {
  const rng = createRng(SEED)

  const organization: Organization = {
    id: ORGANIZATION_ID,
    name: 'Northstar',
    industry: 'B2B SaaS',
    size: 500,
  }

  const skills: Skill[] = SKILL_CATALOG.map((def, i) => ({
    id: `skill-${i + 1}`,
    organizationId: ORGANIZATION_ID,
    name: def.name,
    category: def.category,
    description: def.description,
  }))
  const skillsByCategory = new Map<string, Skill[]>()
  for (const skill of skills) {
    const list = skillsByCategory.get(skill.category) ?? []
    list.push(skill)
    skillsByCategory.set(skill.category, list)
  }
  const languageSkills = skillsByCategory.get('Language') ?? []
  const languageForCountry: Record<string, string> = {
    France: 'French',
    'United Kingdom': 'English',
    Germany: 'German',
    'United States': 'English',
    Spain: 'Spanish',
    Netherlands: 'Dutch',
  }

  const teams: Team[] = TEAM_DEFS.map((def, i) => ({
    id: `team-${i + 1}`,
    organizationId: ORGANIZATION_ID,
    name: def.name,
    description: def.description,
    managerId: undefined,
  }))

  const people: Person[] = []
  const personSkills: PersonSkill[] = []
  const personTeams: PersonTeam[] = []
  const usedEmails = new Set<string>()
  let personCounter = 0

  function seniorityForIndex(i: number): 'junior' | 'mid' | 'senior' | 'lead' {
    if (i === 0) return 'lead'
    if (i <= 1) return 'senior'
    if (i <= 3) return 'mid'
    return 'junior'
  }

  const teamLeadIds: Record<string, string> = {}

  for (const [teamIndex, teamDef] of TEAM_DEFS.entries()) {
    const team = teams[teamIndex]
    const coreSkills = teamDef.coreSkillCategories.flatMap((c) => skillsByCategory.get(c) ?? [])
    const crossSkills = skills

    for (let i = 0; i < PEOPLE_PER_TEAM; i++) {
      personCounter += 1
      const countryPool = pick(rng, COUNTRY_POOLS)
      const firstName = pick(rng, countryPool.firstNames)
      const lastName = pick(rng, countryPool.lastNames)
      const city = pick(rng, countryPool.cities)
      const seniority = seniorityForIndex(i)
      const jobTitle = teamDef.jobTitles[seniority]
      const yearsAtCompany = intBetween(rng, 1, 9)

      let email = `${firstName}.${lastName}@northstar.io`.toLowerCase().replace(/\s+/g, '')
      let suffix = 1
      while (usedEmails.has(email)) {
        suffix += 1
        email = `${firstName}.${lastName}${suffix}@northstar.io`.toLowerCase().replace(/\s+/g, '')
      }
      usedEmails.add(email)

      const personId = `person-${personCounter}`
      const startYear = 2026 - yearsAtCompany
      const startDate = `${startYear}-${String(intBetween(rng, 1, 12)).padStart(2, '0')}-01`

      // Skill assignment: 2-3 core-to-team skills, 1-2 cross-functional skills, 1 language.
      const chosenCore = pickMany(rng, coreSkills.length > 0 ? coreSkills : crossSkills, intBetween(rng, 2, 3))
      const chosenCross = pickMany(rng, crossSkills, intBetween(rng, 1, 2))
      const nativeLanguageName = languageForCountry[countryPool.country] ?? 'English'
      const nativeLanguage = languageSkills.find((s) => s.name === nativeLanguageName)
      const secondLanguage =
        nativeLanguageName !== 'English' ? languageSkills.find((s) => s.name === 'English') : pick(rng, languageSkills)

      const personSkillSet = new Map<string, Skill>()
      for (const s of [...chosenCore, ...chosenCross]) personSkillSet.set(s.id, s)
      if (nativeLanguage) personSkillSet.set(nativeLanguage.id, nativeLanguage)
      if (secondLanguage) personSkillSet.set(secondLanguage.id, secondLanguage)

      const assignedSkills = [...personSkillSet.values()]
      for (const skill of assignedSkills) {
        const isLanguage = skill.category === 'Language'
        const years = isLanguage
          ? intBetween(rng, 3, Math.max(3, yearsAtCompany + 5))
          : intBetween(rng, 1, Math.max(1, yearsAtCompany + 2))
        personSkills.push({
          personId,
          skillId: skill.id,
          level: levelFromYears(years),
          yearsExperience: years,
          source: pick(rng, ['self-reported', 'inferred', 'verified'] as const),
        })
      }

      const skillNames = assignedSkills.filter((s) => s.category !== 'Language').map((s) => s.name)
      const bioTemplate = pick(rng, BIO_TEMPLATES)
      const bio = fillTemplate(bioTemplate, {
        org: organization.name,
        team: teamDef.name,
        years: String(yearsAtCompany),
        skill1: skillNames[0] ?? teamDef.name,
        skill2: skillNames[1] ?? skillNames[0] ?? teamDef.name,
      })

      const person: Person = {
        id: personId,
        organizationId: ORGANIZATION_ID,
        firstName,
        lastName,
        jobTitle,
        department: teamDef.department,
        location: `${city}, ${countryPool.country}`,
        country: countryPool.country,
        bio,
        startDate,
        status: 'active',
        email,
      }
      people.push(person)
      personTeams.push({ personId, teamId: team.id })

      if (seniority === 'lead') teamLeadIds[teamDef.key] = personId
    }
  }

  // Assign managers: team lead manages everyone else on their team.
  for (const [teamIndex, teamDef] of TEAM_DEFS.entries()) {
    const leadId = teamLeadIds[teamDef.key]
    const team = teams[teamIndex]
    team.managerId = leadId
    for (const pt of personTeams.filter((pt) => pt.teamId === team.id)) {
      if (pt.personId === leadId) continue
      const person = people.find((p) => p.id === pt.personId)
      if (person) person.managerId = leadId
    }
  }

  // Connections: within-team peers + cross-functional pairs based on related teams.
  const connections: Connection[] = []
  let connectionCounter = 0
  const peopleByTeamKey = new Map<string, Person[]>()
  for (const [teamIndex, teamDef] of TEAM_DEFS.entries()) {
    const team = teams[teamIndex]
    const members = personTeams.filter((pt) => pt.teamId === team.id).map((pt) => people.find((p) => p.id === pt.personId)!)
    peopleByTeamKey.set(teamDef.key, members)
  }

  function addConnection(rng: Rng, a: Person, b: Person, type: Connection['type']) {
    connectionCounter += 1
    connections.push({
      id: `conn-${connectionCounter}`,
      organizationId: ORGANIZATION_ID,
      personAId: a.id,
      personBId: b.id,
      type,
      strength: Math.round((0.4 + rng() * 0.6) * 100) / 100,
      source: 'inferred',
    })
  }

  for (const teamDef of TEAM_DEFS) {
    const members = peopleByTeamKey.get(teamDef.key) ?? []
    const leadId = teamLeadIds[teamDef.key]

    // Reports-to connections.
    for (const member of members) {
      if (member.id !== leadId && member.managerId) {
        const lead = members.find((m) => m.id === member.managerId)
        if (lead) addConnection(rng, member, lead, 'reports-to')
      }
    }

    // Peer connections within the team (a handful per person).
    for (const member of members) {
      const peers = pickMany(
        rng,
        members.filter((m) => m.id !== member.id),
        intBetween(rng, 2, 3),
      )
      for (const peer of peers) addConnection(rng, member, peer, 'peer')
    }

    // Cross-functional collaboration with related teams.
    for (const relatedKey of teamDef.relatedTeamKeys) {
      const relatedMembers = peopleByTeamKey.get(relatedKey) ?? []
      if (relatedMembers.length === 0) continue
      const collaborators = pickMany(rng, members, Math.min(3, members.length))
      for (const person of collaborators) {
        const partner = pick(rng, relatedMembers)
        addConnection(rng, person, partner, 'collaborates-with')
      }
    }
  }

  const sources: Source[] = [
    { id: 'src-1', organizationId: ORGANIZATION_ID, type: 'csv-import', name: 'Demo dataset (Northstar)', lastSyncAt: new Date().toISOString(), status: 'connected' },
    { id: 'src-2', organizationId: ORGANIZATION_ID, type: 'core-hr', name: 'Core HR', status: 'coming-soon' },
    { id: 'src-3', organizationId: ORGANIZATION_ID, type: 'microsoft-365', name: 'Microsoft 365', status: 'coming-soon' },
    { id: 'src-4', organizationId: ORGANIZATION_ID, type: 'google-workspace', name: 'Google Workspace', status: 'coming-soon' },
    { id: 'src-5', organizationId: ORGANIZATION_ID, type: 'slack', name: 'Slack', status: 'coming-soon' },
    { id: 'src-6', organizationId: ORGANIZATION_ID, type: 'teams', name: 'Microsoft Teams', status: 'coming-soon' },
    { id: 'src-7', organizationId: ORGANIZATION_ID, type: 'notion', name: 'Notion', status: 'coming-soon' },
    { id: 'src-8', organizationId: ORGANIZATION_ID, type: 'jira', name: 'Jira', status: 'coming-soon' },
  ]

  return { organization, people, skills, personSkills, teams, personTeams, connections, sources }
}

export function canHelpTopicsFor(personId: string, dataset: OrganizationDataset): string[] {
  const skillIds = dataset.personSkills
    .filter((ps) => ps.personId === personId && (ps.level === 'expert' || ps.level === 'proficient'))
    .map((ps) => ps.skillId)
  const relevantSkills = dataset.skills.filter((s) => skillIds.includes(s.id) && s.category !== 'Language')
  return relevantSkills.slice(0, 4).map((s) => {
    const rng = createRng(s.id.length * 7 + s.name.length)
    return fillTemplate(pick(rng, CAN_HELP_TEMPLATES), { skill: s.name })
  })
}
