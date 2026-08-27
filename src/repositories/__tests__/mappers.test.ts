import { describe, expect, it } from 'vitest'
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
  personSkillToRow,
  personTeamToRow,
  personToRow,
  skillEndorsementToRow,
  skillToRow,
  mapUpgradeRequest,
  upgradeRequestToRow,
} from '@/repositories/mappers'

describe('DB row -> app type mappers', () => {
  it('maps an organization row', () => {
    const org = mapOrganization({
      id: 'org-1',
      name: 'Northstar',
      logo: null,
      industry: 'B2B SaaS',
      size: 500,
      is_demo: true,
      entity_isolation_mode: 'filter',
      created_at: '2026-01-01T00:00:00Z',
    })
    expect(org).toEqual({
      id: 'org-1',
      name: 'Northstar',
      logo: undefined,
      industry: 'B2B SaaS',
      size: 500,
      entityIsolationMode: 'filter',
      advancedPermissionsEnabled: false,
    })
  })

  it('maps an organization row with advanced permissions enabled via its features row', () => {
    const org = mapOrganization(
      {
        id: 'org-1',
        name: 'Northstar',
        logo: null,
        industry: 'B2B SaaS',
        size: 500,
        is_demo: true,
        entity_isolation_mode: 'filter',
        created_at: '2026-01-01T00:00:00Z',
      },
      { organization_id: 'org-1', advanced_permissions_enabled: true },
    )
    expect(org.advancedPermissionsEnabled).toBe(true)
  })

  it('maps a person row, converting null manager_id/avatar to undefined', () => {
    const person = mapPerson({
      id: 'p1',
      organization_id: 'org-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      avatar: null,
      job_title: 'Head of Engineering',
      department: 'Engineering',
      location: 'London, United Kingdom',
      country: 'United Kingdom',
      bio: 'Bio.',
      manager_id: null,
      start_date: '2020-01-01',
      status: 'active',
      email: 'ada@northstar.io',
      claimed_by_user_id: null,
      entity_id: null,
      created_at: '2026-01-01T00:00:00Z',
    })
    expect(person.managerId).toBeUndefined()
    expect(person.avatar).toBeUndefined()
    expect(person.claimedByUserId).toBeUndefined()
    expect(person.firstName).toBe('Ada')
    expect(person.organizationId).toBe('org-1')
  })

  it('maps a claimed_by_user_id through to claimedByUserId', () => {
    const person = mapPerson({
      id: 'p1',
      organization_id: 'org-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      avatar: null,
      job_title: 'Head of Engineering',
      department: 'Engineering',
      location: 'London, United Kingdom',
      country: 'United Kingdom',
      bio: 'Bio.',
      manager_id: null,
      start_date: '2020-01-01',
      status: 'active',
      email: 'ada@northstar.io',
      claimed_by_user_id: 'user-42',
      entity_id: null,
      created_at: '2026-01-01T00:00:00Z',
    })
    expect(person.claimedByUserId).toBe('user-42')
  })

  it('maps a skill, person_skill, team, person_team, connection and source row', () => {
    expect(
      mapSkill({
        id: 's1',
        organization_id: 'org-1',
        name: 'Salesforce',
        category: 'Technology',
        description: 'CRM',
        created_at: '2026-01-01T00:00:00Z',
      }),
    ).toMatchObject({ id: 's1', name: 'Salesforce', category: 'Technology' })

    expect(
      mapPersonSkill({
        organization_id: 'org-1',
        person_id: 'p1',
        skill_id: 's1',
        level: 'expert',
        years_experience: 5,
        source: 'verified',
      }),
    ).toEqual({ personId: 'p1', skillId: 's1', level: 'expert', yearsExperience: 5, source: 'verified' })

    expect(
      mapTeam({
        id: 't1',
        organization_id: 'org-1',
        name: 'Sales',
        description: 'Sales team',
        manager_id: null,
        created_at: '2026-01-01T00:00:00Z',
      }),
    ).toMatchObject({ id: 't1', name: 'Sales', managerId: undefined })

    expect(mapPersonTeam({ organization_id: 'org-1', person_id: 'p1', team_id: 't1' })).toEqual({
      personId: 'p1',
      teamId: 't1',
    })

    expect(
      mapConnection({
        id: 'c1',
        organization_id: 'org-1',
        person_a_id: 'p1',
        person_b_id: 'p2',
        type: 'peer',
        strength: 0.8,
        source: 'inferred',
      }),
    ).toMatchObject({ id: 'c1', personAId: 'p1', personBId: 'p2', strength: 0.8 })

    expect(
      mapSource({
        id: 'src1',
        organization_id: 'org-1',
        type: 'csv-import',
        name: 'CSV Import',
        last_sync_at: null,
        status: 'connected',
      }),
    ).toMatchObject({ id: 'src1', type: 'csv-import', lastSyncAt: undefined })

    expect(
      mapSkillEndorsement({
        id: 'e1',
        organization_id: 'org-1',
        person_id: 'p1',
        skill_id: 's1',
        endorsed_by_person_id: 'p2',
        created_at: '2026-01-01T00:00:00Z',
      }),
    ).toEqual({ id: 'e1', organizationId: 'org-1', personId: 'p1', skillId: 's1', endorsedByPersonId: 'p2' })
  })

  it('round-trips a skill endorsement through skillEndorsementToRow', () => {
    const row = skillEndorsementToRow({ organizationId: 'org-1', personId: 'p1', skillId: 's1', endorsedByPersonId: 'p2' })
    expect(row).toEqual({ organization_id: 'org-1', person_id: 'p1', skill_id: 's1', endorsed_by_person_id: 'p2' })
  })

  it('maps and round-trips an entity row', () => {
    const entity = mapEntity({ id: 'ent-1', organization_id: 'org-1', name: 'Acme France', created_at: '2026-01-01T00:00:00Z' })
    expect(entity).toEqual({ id: 'ent-1', organizationId: 'org-1', name: 'Acme France' })
    expect(entityToRow(entity)).toEqual({ id: 'ent-1', organization_id: 'org-1', name: 'Acme France' })
  })

  it('maps a membership row, converting a null entity_id to undefined', () => {
    const membership = mapMembership({
      user_id: 'u1',
      organization_id: 'org-1',
      role: 'director',
      entity_id: null,
      created_at: '2026-01-01T00:00:00Z',
    })
    expect(membership).toEqual({ userId: 'u1', organizationId: 'org-1', role: 'director', entityId: undefined })
  })

  it('maps an invitation row, converting nulls to undefined', () => {
    const invitation = mapInvitation({
      id: 'inv-1',
      organization_id: 'org-1',
      email: 'jane@example.com',
      role: 'manager',
      entity_id: null,
      invited_by: 'u1',
      token: 'tok-1',
      status: 'pending',
      last_sent_at: null,
      accepted_at: null,
      created_at: '2026-01-01T00:00:00Z',
    })
    expect(invitation).toEqual({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'jane@example.com',
      role: 'manager',
      entityId: undefined,
      invitedBy: 'u1',
      token: 'tok-1',
      status: 'pending',
      lastSentAt: undefined,
      acceptedAt: undefined,
    })
  })

  it('maps an upgrade request row, converting a null resolved_at to undefined', () => {
    const request = mapUpgradeRequest({
      id: 'ur-1',
      organization_id: 'org-1',
      requested_by: 'u1',
      status: 'pending',
      note: 'Need custom roles for our regional teams.',
      created_at: '2026-01-01T00:00:00Z',
      resolved_at: null,
    })
    expect(request).toEqual({
      id: 'ur-1',
      organizationId: 'org-1',
      requestedBy: 'u1',
      status: 'pending',
      note: 'Need custom roles for our regional teams.',
      createdAt: '2026-01-01T00:00:00Z',
      resolvedAt: undefined,
    })
  })

  it('builds an upgrade request insert row without id/status/timestamps (left to the DB defaults)', () => {
    const row = upgradeRequestToRow({ organizationId: 'org-1', requestedBy: 'u1', note: 'Please enable it.' })
    expect(row).toEqual({ organization_id: 'org-1', requested_by: 'u1', note: 'Please enable it.' })
  })

  it('builds an invitation insert row without id/token/status (left to the DB defaults)', () => {
    const row = invitationToRow({ organizationId: 'org-1', email: 'jane@example.com', role: 'manager', invitedBy: 'u1', entityId: 'ent-1' })
    expect(row).toEqual({ id: undefined, organization_id: 'org-1', email: 'jane@example.com', role: 'manager', entity_id: 'ent-1', invited_by: 'u1' })
  })
})

describe('app type -> DB row (write path)', () => {
  it('round-trips a person through personToRow -> mapPerson', () => {
    const person = mapPerson({
      id: 'p1',
      organization_id: 'org-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      avatar: null,
      job_title: 'Head of Engineering',
      department: 'Engineering',
      location: 'London, United Kingdom',
      country: 'United Kingdom',
      bio: 'Bio.',
      manager_id: null,
      start_date: '2020-01-01',
      status: 'active',
      email: 'ada@northstar.io',
      claimed_by_user_id: null,
      entity_id: null,
      created_at: '2026-01-01T00:00:00Z',
    })
    const row = personToRow(person)
    expect(row.first_name).toBe('Ada')
    expect(row.manager_id).toBeNull()
    expect(mapPerson({ ...row, created_at: '2026-01-01T00:00:00Z' } as Parameters<typeof mapPerson>[0])).toEqual(
      person,
    )
  })

  it('round-trips a skill through skillToRow', () => {
    const skill = mapSkill({
      id: 's1',
      organization_id: 'org-1',
      name: 'Salesforce',
      category: 'Technology',
      description: 'CRM',
      created_at: '2026-01-01T00:00:00Z',
    })
    expect(skillToRow(skill)).toMatchObject({ id: 's1', organization_id: 'org-1', name: 'Salesforce' })
  })

  it('injects organizationId into person_skills and person_teams rows', () => {
    const psRow = personSkillToRow({ personId: 'p1', skillId: 's1', level: 'expert', yearsExperience: 5, source: 'verified' }, 'org-1')
    expect(psRow.organization_id).toBe('org-1')

    const ptRow = personTeamToRow({ personId: 'p1', teamId: 't1' }, 'org-1')
    expect(ptRow.organization_id).toBe('org-1')
  })
})
