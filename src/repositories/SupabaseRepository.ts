import { supabase } from '@/lib/supabaseClient'
import { DEMO_ORGANIZATION_ID } from '@/lib/constants'
import type { Entity, EntityIsolationMode, OrganizationDataset, Person, PersonSkill, PersonTeam, Skill, SkillLevel } from '@/types'
import {
  entityToRow,
  mapConnection,
  mapEntity,
  mapOrganization,
  mapPerson,
  mapPersonSkill,
  mapPersonTeam,
  mapSkill,
  mapSkillEndorsement,
  mapSource,
  mapTeam,
  personSkillToRow,
  personTeamToRow,
  personToRow,
  skillEndorsementToRow,
  skillToRow,
} from './mappers'

/** Fetches everything needed to render the app for one organization, in parallel. */
export async function fetchOrganizationDataset(organizationId: string): Promise<OrganizationDataset> {
  const [org, entities, people, skills, personSkills, skillEndorsements, teams, personTeams, connections, sources] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organizationId).single(),
    supabase.from('entities').select('*').eq('organization_id', organizationId),
    supabase.from('people').select('*').eq('organization_id', organizationId),
    supabase.from('skills').select('*').eq('organization_id', organizationId),
    supabase.from('person_skills').select('*').eq('organization_id', organizationId),
    supabase.from('skill_endorsements').select('*').eq('organization_id', organizationId),
    supabase.from('teams').select('*').eq('organization_id', organizationId),
    supabase.from('person_teams').select('*').eq('organization_id', organizationId),
    supabase.from('connections').select('*').eq('organization_id', organizationId),
    supabase.from('sources').select('*').eq('organization_id', organizationId),
  ])

  const failed = [org, entities, people, skills, personSkills, skillEndorsements, teams, personTeams, connections, sources].find(
    (r) => r.error,
  )
  if (failed?.error) throw new Error(failed.error.message)
  if (!org.data) throw new Error('Organization not found')

  return {
    organization: mapOrganization(org.data),
    entities: (entities.data ?? []).map(mapEntity),
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
