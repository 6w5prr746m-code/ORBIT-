import { supabase } from '@/lib/supabaseClient'
import { DEMO_ORGANIZATION_ID } from '@/lib/constants'
import type { AssignableRole, Entity, EntityIsolationMode, Membership, MembershipRole, OrganizationDataset, Person, PersonSkill, PersonTeam, Skill, SkillLevel, UpgradeRequest } from '@/types'
import {
  entityToRow,
  invitationToRow,
  mapConnection,
  mapEntity,
  mapInvitation,
  mapMembership,
  mapOrganization,
  mapPerson,
  mapPersonSkill,
  mapPersonTeam,
  mapSkill,
  mapSkillEndorsement,
  mapSource,
  mapTeam,
  mapUpgradeRequest,
  personSkillToRow,
  personTeamToRow,
  personToRow,
  skillEndorsementToRow,
  skillToRow,
  upgradeRequestToRow,
} from './mappers'

/** Fetches everything needed to render the app for one organization, in parallel. */
export async function fetchOrganizationDataset(organizationId: string): Promise<OrganizationDataset> {
  const [org, features, entities, memberships, invitations, upgradeRequests, people, skills, personSkills, skillEndorsements, teams, personTeams, connections, sources] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organizationId).single(),
    supabase.from('organization_features').select('*').eq('organization_id', organizationId).maybeSingle(),
    supabase.from('entities').select('*').eq('organization_id', organizationId),
    supabase.from('memberships').select('*').eq('organization_id', organizationId),
    supabase.from('invitations').select('*').eq('organization_id', organizationId),
    supabase.from('upgrade_requests').select('*').eq('organization_id', organizationId),
    supabase.from('people').select('*').eq('organization_id', organizationId),
    supabase.from('skills').select('*').eq('organization_id', organizationId),
    supabase.from('person_skills').select('*').eq('organization_id', organizationId),
    supabase.from('skill_endorsements').select('*').eq('organization_id', organizationId),
    supabase.from('teams').select('*').eq('organization_id', organizationId),
    supabase.from('person_teams').select('*').eq('organization_id', organizationId),
    supabase.from('connections').select('*').eq('organization_id', organizationId),
    supabase.from('sources').select('*').eq('organization_id', organizationId),
  ])

  const failed = [org, features, entities, memberships, invitations, upgradeRequests, people, skills, personSkills, skillEndorsements, teams, personTeams, connections, sources].find(
    (r) => r.error,
  )
  if (failed?.error) throw new Error(failed.error.message)
  if (!org.data) throw new Error('Organization not found')

  return {
    organization: mapOrganization(org.data, features.data),
    entities: (entities.data ?? []).map(mapEntity),
    memberships: (memberships.data ?? []).map(mapMembership),
    invitations: (invitations.data ?? []).map(mapInvitation),
    upgradeRequests: (upgradeRequests.data ?? []).map(mapUpgradeRequest),
    people: (people.data ?? []).map(mapPerson),
    skills: (skills.data ?? []).map(mapSkill),
    personSkills: (personSkills.data ?? []).map(mapPersonSkill),
    skillEndorsements: (skillEndorsements.data ?? []).map(mapSkillEndorsement),
    teams: (teams.data ?? []).map(mapTeam),
    personTeams: (personTeams.data ?? []).map(mapPersonTeam),
    connections: (connections.data ?? []).map(mapConnection),
    sources: (sources.data ?? []).map(mapSource),
  }
}

export function fetchDemoDataset(): Promise<OrganizationDataset> {
  return fetchOrganizationDataset(DEMO_ORGANIZATION_ID)
}

/** MVP: one organization per user. Returns null if they haven't created/joined one yet. */
export async function fetchMyOrganizationId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.organization_id ?? null
}

export async function createOrganization(input: { name: string; industry: string; size: number }): Promise<string> {
  const { data, error } = await supabase.rpc('create_organization', {
    org_name: input.name,
    org_industry: input.industry,
    org_size: input.size,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function insertPeople(
  organizationId: string,
  people: Person[],
  personSkills: PersonSkill[],
  personTeams: PersonTeam[],
  newSkills: Skill[],
  newEntities: Entity[] = [],
): Promise<void> {
  if (newSkills.length > 0) {
    const { error } = await supabase
      .from('skills')
      .upsert(
        newSkills.map(skillToRow),
        { onConflict: 'organization_id,name', ignoreDuplicates: true },
      )
    if (error) throw new Error(error.message)
  }

  if (newEntities.length > 0) {
    const { error } = await supabase
      .from('entities')
      .upsert(newEntities.map((e) => entityToRow(e)), { onConflict: 'organization_id,name', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }

  if (people.length > 0) {
    const { error } = await supabase.from('people').insert(people.map(personToRow))
    if (error) throw new Error(error.message)
  }

  if (personSkills.length > 0) {
    const { error } = await supabase
      .from('person_skills')
      .insert(personSkills.map((ps) => personSkillToRow(ps, organizationId)))
    if (error) throw new Error(error.message)
  }

  if (personTeams.length > 0) {
    const { error } = await supabase
      .from('person_teams')
      .insert(personTeams.map((pt) => personTeamToRow(pt, organizationId)))
    if (error) throw new Error(error.message)
  }
}

/**
 * Links a person row to the signed-in user ("claim your profile"). The
 * `.is('claimed_by_user_id', null)` guard makes this safe against a race
 * with someone else claiming the same row a moment earlier — the update
 * simply matches zero rows in that case, which the caller surfaces as an
 * error rather than silently succeeding.
 */
export async function claimPerson(personId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('people')
    .update({ claimed_by_user_id: userId })
    .eq('id', personId)
    .is('claimed_by_user_id', null)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('This profile was just claimed by someone else.')
}

export async function updatePersonProfile(personId: string, patch: { bio?: string; avatar?: string | null }): Promise<void> {
  const { error } = await supabase
    .from('people')
    .update({ bio: patch.bio, avatar: patch.avatar ?? null })
    .eq('id', personId)
  if (error) throw new Error(error.message)
}

export async function upsertPersonSkill(
  organizationId: string,
  personId: string,
  skillId: string,
  level: SkillLevel,
  yearsExperience: number,
): Promise<void> {
  const { error } = await supabase.from('person_skills').upsert(
    [personSkillToRow({ personId, skillId, level, yearsExperience, source: 'self-reported' }, organizationId)],
    { onConflict: 'person_id,skill_id' },
  )
  if (error) throw new Error(error.message)
}

export async function removePersonSkill(personId: string, skillId: string): Promise<void> {
  const { error } = await supabase.from('person_skills').delete().eq('person_id', personId).eq('skill_id', skillId)
  if (error) throw new Error(error.message)
}

export async function createSkillIfMissing(skill: Skill): Promise<void> {
  const { error } = await supabase
    .from('skills')
    .upsert([skillToRow(skill)], { onConflict: 'organization_id,name', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export async function endorseSkill(
  organizationId: string,
  personId: string,
  skillId: string,
  endorsedByPersonId: string,
): Promise<void> {
  const { error } = await supabase
    .from('skill_endorsements')
    .upsert(
      [skillEndorsementToRow({ organizationId, personId, skillId, endorsedByPersonId })],
      { onConflict: 'person_id,skill_id,endorsed_by_person_id', ignoreDuplicates: true },
    )
  if (error) throw new Error(error.message)
}

export async function removeEndorsement(personId: string, skillId: string, endorsedByPersonId: string): Promise<void> {
  const { error } = await supabase
    .from('skill_endorsements')
    .delete()
    .eq('person_id', personId)
    .eq('skill_id', skillId)
    .eq('endorsed_by_person_id', endorsedByPersonId)
  if (error) throw new Error(error.message)
}

export async function createEntity(organizationId: string, name: string): Promise<Entity> {
  const { data, error } = await supabase
    .from('entities')
    .insert(entityToRow({ organizationId, name }))
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapEntity(data)
}

export async function renameEntity(entityId: string, name: string): Promise<void> {
  const { error } = await supabase.from('entities').update({ name }).eq('id', entityId)
  if (error) throw new Error(error.message)
}

export async function deleteEntity(entityId: string): Promise<void> {
  const { error } = await supabase.from('entities').delete().eq('id', entityId)
  if (error) throw new Error(error.message)
}

export async function assignPersonToEntity(personId: string, entityId: string | null): Promise<void> {
  const { error } = await supabase.from('people').update({ entity_id: entityId }).eq('id', personId)
  if (error) throw new Error(error.message)
}

export async function setEntityIsolationMode(organizationId: string, mode: EntityIsolationMode): Promise<void> {
  const { error } = await supabase.from('organizations').update({ entity_isolation_mode: mode }).eq('id', organizationId)
  if (error) throw new Error(error.message)
}

export async function createInvitations(
  organizationId: string,
  invitedBy: string,
  entries: { email: string; role: AssignableRole; entityId?: string }[],
): Promise<void> {
  if (entries.length === 0) return
  const { error } = await supabase.from('invitations').upsert(
    entries.map((e) => invitationToRow({ organizationId, invitedBy, email: e.email, role: e.role, entityId: e.entityId })),
    { onConflict: 'organization_id,email', ignoreDuplicates: true },
  )
  if (error) throw new Error(error.message)
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.from('invitations').update({ status: 'revoked' }).eq('id', invitationId)
  if (error) throw new Error(error.message)
}

/** Calls the send-invitation-emails Edge Function, which holds the Resend API key server-side. */
export async function sendInvitationEmails(invitationIds: string[]): Promise<void> {
  if (invitationIds.length === 0) return
  const { error } = await supabase.functions.invoke('send-invitation-emails', { body: { invitationIds } })
  if (error) throw new Error(error.message)
}

export async function acceptInvitation(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invitation', { invitation_token: token })
  if (error) throw new Error(error.message)
  return data
}

export async function getInvitationPreview(
  token: string,
): Promise<{ email: string; organizationName: string; role: AssignableRole } | null> {
  const { data, error } = await supabase.rpc('get_invitation_preview', { invitation_token: token })
  if (error) throw new Error(error.message)
  const row = data?.[0]
  if (!row) return null
  return { email: row.email, organizationName: row.organization_name, role: row.role as AssignableRole }
}

export async function createUpgradeRequest(organizationId: string, requestedBy: string, note: string): Promise<UpgradeRequest> {
  const { data, error } = await supabase
    .from('upgrade_requests')
    .insert(upgradeRequestToRow({ organizationId, requestedBy, note }))
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapUpgradeRequest(data)
}

/** Calls the notify-upgrade-request Edge Function, which emails the vendor and holds the Resend API key server-side. */
export async function notifyVendorUpgradeRequest(upgradeRequestId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('notify-upgrade-request', { body: { upgradeRequestId } })
  if (error) throw new Error(error.message)
}

export async function updateMembershipRole(
  organizationId: string,
  userId: string,
  role: MembershipRole,
  entityId: string | null,
): Promise<Membership> {
  const { data, error } = await supabase
    .from('memberships')
    .update({ role, entity_id: entityId })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapMembership(data)
}
