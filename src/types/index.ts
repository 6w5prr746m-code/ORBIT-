export type EntityIsolationMode = 'strict' | 'filter'

export interface Organization {
  id: string
  name: string
  logo?: string
  industry: string
  size: number
  entityIsolationMode: EntityIsolationMode
  advancedPermissionsEnabled: boolean
}

export interface Entity {
  id: string
  organizationId: string
  name: string
}

export type MembershipRole = 'owner' | 'member' | 'hr_admin' | 'director' | 'manager' | 'collaborator'

/** The four roles a client can actually assign; 'owner'/'member' are legacy, full-access, and not assignable via the UI. */
export type AssignableRole = 'hr_admin' | 'director' | 'manager' | 'collaborator'
export const ASSIGNABLE_ROLES: AssignableRole[] = ['collaborator', 'manager', 'director', 'hr_admin']

export interface Membership {
  userId: string
  organizationId: string
  role: MembershipRole
  entityId?: string
  customRoleId?: string
}

/** A custom role's base role still drives can_view_person()'s entity-scoping — see 0013_custom_roles.sql. */
export type CustomRoleBase = 'director' | 'manager' | 'collaborator'

export interface RolePagePermissions {
  skills: boolean
  discover: boolean
  coverage: boolean
  teamBuilder: boolean
  ask: boolean
}

export interface RoleActionPermissions {
  manageEntities: boolean
  manageAccess: boolean
  manageInvitations: boolean
  importData: boolean
}

export interface RolePermissions {
  pages: RolePagePermissions
  actions: RoleActionPermissions
}

export interface CustomRole {
  id: string
  organizationId: string
  name: string
  baseRole: CustomRoleBase
  permissions: RolePermissions
}

/** Full access — used for owner/hr_admin/legacy member, regardless of any custom role. */
export const FULL_PERMISSIONS: RolePermissions = {
  pages: { skills: true, discover: true, coverage: true, teamBuilder: true, ask: true },
  actions: { manageEntities: true, manageAccess: true, manageInvitations: true, importData: true },
}

/**
 * What director/manager/collaborator get today, with no custom role
 * assigned — every page visible (nothing has ever been page-gated), plus
 * exactly the admin actions that were already open to any org member
 * (entities, import) vs. already admin-only (access, invitations). This
 * is deliberately asymmetric because the app itself is: it's the "no
 * custom role" baseline every screen can gate on uniformly, without
 * changing behavior for any organization that never touches this feature.
 */
export const DEFAULT_SCOPED_PERMISSIONS: RolePermissions = {
  pages: { skills: true, discover: true, coverage: true, teamBuilder: true, ask: true },
  actions: { manageEntities: true, manageAccess: false, manageInvitations: false, importData: true },
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked'

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: AssignableRole
  entityId?: string
  invitedBy: string
  token: string
  status: InvitationStatus
  lastSentAt?: string
  acceptedAt?: string
}

export type UpgradeRequestStatus = 'pending' | 'approved' | 'declined'

export interface UpgradeRequest {
  id: string
  organizationId: string
  requestedBy: string
  status: UpgradeRequestStatus
  note: string
  createdAt: string
  resolvedAt?: string
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
  claimedByUserId?: string
  entityId?: string
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

export interface SkillEndorsement {
  id: string
  organizationId: string
  personId: string
  skillId: string
  endorsedByPersonId: string
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
  entities: Entity[]
  memberships: Membership[]
  invitations: Invitation[]
  upgradeRequests: UpgradeRequest[]
  customRoles: CustomRole[]
  people: Person[]
  skills: Skill[]
  personSkills: PersonSkill[]
  skillEndorsements: SkillEndorsement[]
  teams: Team[]
  personTeams: PersonTeam[]
  connections: Connection[]
  sources: Source[]
}
