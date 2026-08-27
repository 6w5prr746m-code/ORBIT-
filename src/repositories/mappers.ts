import type { Connection, Organization, Person, PersonSkill, PersonTeam, Skill, SkillEndorsement, Source, Team } from '@/types'
import type { Database } from '@/types/database'

type Tables = Database['public']['Tables']

export function mapOrganization(row: Tables['organizations']['Row']): Organization {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo ?? undefined,
    industry: row.industry,
    size: row.size,
  }
}

export function mapPerson(row: Tables['people']['Row']): Person {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.avatar ?? undefined,
    jobTitle: row.job_title,
    department: row.department,
    location: row.location,
    country: row.country,
    bio: row.bio,
    managerId: row.manager_id ?? undefined,
    startDate: row.start_date,
    status: row.status,
    email: row.email,
    claimedByUserId: row.claimed_by_user_id ?? undefined,
  }
}

export function mapSkill(row: Tables['skills']['Row']): Skill {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    category: row.category,
    description: row.description,
  }
}

export function mapPersonSkill(row: Tables['person_skills']['Row']): PersonSkill {
  return {
    personId: row.person_id,
    skillId: row.skill_id,
    level: row.level,
    yearsExperience: row.years_experience,
    source: row.source,
  }
}

export function mapSkillEndorsement(row: Tables['skill_endorsements']['Row']): SkillEndorsement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    personId: row.person_id,
    skillId: row.skill_id,
    endorsedByPersonId: row.endorsed_by_person_id,
  }
}

export function skillEndorsementToRow(e: Omit<SkillEndorsement, 'id'>): Tables['skill_endorsements']['Insert'] {
  return {
    organization_id: e.organizationId,
    person_id: e.personId,
    skill_id: e.skillId,
    endorsed_by_person_id: e.endorsedByPersonId,
  }
}

export function mapTeam(row: Tables['teams']['Row']): Team {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    managerId: row.manager_id ?? undefined,
  }
}

export function mapPersonTeam(row: Tables['person_teams']['Row']): PersonTeam {
  return {
    personId: row.person_id,
    teamId: row.team_id,
  }
}

export function mapConnection(row: Tables['connections']['Row']): Connection {
  return {
    id: row.id,
    organizationId: row.organization_id,
    personAId: row.person_a_id,
    personBId: row.person_b_id,
    type: row.type,
    strength: row.strength,
    source: row.source,
  }
}

export function mapSource(row: Tables['sources']['Row']): Source {
  return {
    id: row.id,
    organizationId: row.organization_id,
    type: row.type,
    name: row.name,
    lastSyncAt: row.last_sync_at ?? undefined,
    status: row.status,
  }
}

export function personToRow(p: Person): Tables['people']['Insert'] {
  return {
    id: p.id,
    organization_id: p.organizationId,
    first_name: p.firstName,
    last_name: p.lastName,
    avatar: p.avatar ?? null,
    job_title: p.jobTitle,
    department: p.department,
    location: p.location,
    country: p.country,
    bio: p.bio,
    manager_id: p.managerId ?? null,
    start_date: p.startDate,
    status: p.status,
    email: p.email,
    claimed_by_user_id: p.claimedByUserId ?? null,
  }
}

export function skillToRow(s: Skill): Tables['skills']['Insert'] {
  return {
    id: s.id,
    organization_id: s.organizationId,
    name: s.name,
    category: s.category,
    description: s.description,
  }
}

export function personSkillToRow(ps: PersonSkill, organizationId: string): Tables['person_skills']['Insert'] {
  return {
    organization_id: organizationId,
    person_id: ps.personId,
    skill_id: ps.skillId,
    level: ps.level,
    years_experience: ps.yearsExperience,
    source: ps.source,
  }
}

export function personTeamToRow(pt: PersonTeam, organizationId: string): Tables['person_teams']['Insert'] {
  return {
    organization_id: organizationId,
    person_id: pt.personId,
    team_id: pt.teamId,
  }
}
