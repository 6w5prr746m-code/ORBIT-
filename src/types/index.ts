export interface Organization {
  id: string
  name: string
  logo?: string
  industry: string
  size: number
}

export type PersonStatus = 'active' | 'inactive'

export interface Person {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  avatar?: string
  jobTitle: string
  department: string
  location: string
  country: string
  bio: string
  managerId?: string
  startDate: string
  status: PersonStatus
  email: string
}

export type SkillCategory =
  | 'Technology'
  | 'Business'
  | 'Language'
  | 'Design'
  | 'Operations'
  | 'Leadership'

export interface Skill {
  id: string
  organizationId: string
  name: string
  category: SkillCategory
  description: string
}

export type SkillLevel = 'familiar' | 'proficient' | 'expert'
export type SkillSource = 'self-reported' | 'inferred' | 'verified'

export interface PersonSkill {
  personId: string
  skillId: string
  level: SkillLevel
  yearsExperience: number
  source: SkillSource
}

export interface Team {
  id: string
  organizationId: string
  name: string
  description: string
  managerId?: string
}

export interface PersonTeam {
  personId: string
  teamId: string
}

export type ConnectionType = 'collaborates-with' | 'reports-to' | 'peer'

export interface Connection {
  id: string
  organizationId: string
  personAId: string
  personBId: string
  type: ConnectionType
  strength: number // 0-1
  source: SkillSource
}

export type IntegrationSourceType =
  | 'core-hr'
  | 'microsoft-365'
  | 'google-workspace'
  | 'slack'
  | 'teams'
  | 'notion'
  | 'jira'
  | 'csv-import'

export interface Source {
  id: string
  organizationId: string
  type: IntegrationSourceType
  name: string
  lastSyncAt?: string
  status: 'connected' | 'coming-soon' | 'syncing' | 'error'
}

export interface OrganizationDataset {
  organization: Organization
  people: Person[]
  skills: Skill[]
  personSkills: PersonSkill[]
  teams: Team[]
  personTeams: PersonTeam[]
  connections: Connection[]
  sources: Source[]
}
