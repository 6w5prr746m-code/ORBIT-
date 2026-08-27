import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fakeSupabase, resetFakeSupabaseFixtures } from '@/test/fakeSupabase'
import { DEMO_ORGANIZATION_ID } from '@/lib/constants'

vi.mock('@/lib/supabaseClient', () => ({ supabase: fakeSupabase }))

const { useOrbitStore } = await import('@/state/orbitStore')
const { useAuthStore } = await import('@/state/authStore')

beforeEach(() => {
  useOrbitStore.getState().clear()
  useAuthStore.setState({ user: null, session: null, initialized: true })
  resetFakeSupabaseFixtures()
})

describe('orbitStore.loadDemo', () => {
  it('loads the shared demo dataset and marks isDemo', async () => {
    await useOrbitStore.getState().loadDemo()
    const state = useOrbitStore.getState()
    expect(state.isDemo).toBe(true)
    expect(state.dataset?.organization.id).toBe(DEMO_ORGANIZATION_ID)
    expect(state.error).toBeNull()
  })
})

describe('orbitStore.loadMyOrganization', () => {
  it('returns "none" when no user is signed in', async () => {
    const result = await useOrbitStore.getState().loadMyOrganization()
    expect(result).toBe('none')
    expect(useOrbitStore.getState().dataset).toBeNull()
  })

  it('returns "none" for a signed-in user with no membership yet', async () => {
    useAuthStore.setState({ user: { id: 'brand-new-user' } as never, session: {} as never, initialized: true })
    const result = await useOrbitStore.getState().loadMyOrganization()
    expect(result).toBe('none')
  })

  it('loads the organization for a user with an existing membership', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never, initialized: true })
    const result = await useOrbitStore.getState().loadMyOrganization()
    expect(result).toBe('loaded')
    expect(useOrbitStore.getState().dataset?.organization.id).toBe(DEMO_ORGANIZATION_ID)
    expect(useOrbitStore.getState().isDemo).toBe(false)
  })
})

describe('orbitStore.createOrganization', () => {
  it('creates a new organization and loads it as the active dataset', async () => {
    await useOrbitStore.getState().createOrganization({ name: 'Acme', industry: 'Robotics', size: 42 })
    const state = useOrbitStore.getState()
    expect(state.dataset?.organization.name).toBe('Acme')
    expect(state.dataset?.people).toHaveLength(0)
    expect(state.isDemo).toBe(false)
  })
})

describe('orbitStore.importPeople', () => {
  it('does nothing without an active dataset', async () => {
    await useOrbitStore.getState().importPeople([], [], [], [])
    expect(useOrbitStore.getState().dataset).toBeNull()
  })

  it('inserts people and refreshes the dataset', async () => {
    await useOrbitStore.getState().createOrganization({ name: 'Acme', industry: 'Robotics', size: 42 })
    const orgId = useOrbitStore.getState().dataset!.organization.id

    await useOrbitStore.getState().importPeople(
      [
        {
          id: 'new-person',
          organizationId: orgId,
          firstName: 'Grace',
          lastName: 'Hopper',
          jobTitle: 'Engineer',
          department: 'Engineering',
          location: 'Remote',
          country: 'United States',
          bio: '',
          startDate: '2026-01-01',
          status: 'active',
          email: 'grace@acme.io',
        },
      ],
      [],
      [],
      [],
    )

    expect(useOrbitStore.getState().dataset?.people.some((p) => p.id === 'new-person')).toBe(true)
  })
})

describe('orbitStore profile self-service', () => {
  beforeEach(async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never, initialized: true })
    await useOrbitStore.getState().loadMyOrganization()
  })

  it('claims a person for the signed-in user', async () => {
    await useOrbitStore.getState().claimPerson('p1', 'u1')
    const me = useOrbitStore.getState().dataset?.people.find((p) => p.id === 'p1')
    expect(me?.claimedByUserId).toBe('u1')
  })

  it('rejects claiming a person that is already claimed', async () => {
    await useOrbitStore.getState().claimPerson('p1', 'u1')
    await expect(useOrbitStore.getState().claimPerson('p1', 'someone-else')).rejects.toThrow()
  })

  it('updates the bio and photo of a claimed profile', async () => {
    await useOrbitStore.getState().claimPerson('p1', 'u1')
    await useOrbitStore.getState().updateMyProfile('p1', { bio: 'New bio.', avatar: 'https://example.com/me.jpg' })
    const me = useOrbitStore.getState().dataset?.people.find((p) => p.id === 'p1')
    expect(me?.bio).toBe('New bio.')
    expect(me?.avatar).toBe('https://example.com/me.jpg')
  })

  it('adds a new self-reported skill, creating the skill if it does not exist yet', async () => {
    await useOrbitStore.getState().addMySkill('p1', { skillName: 'Quantum Computing', level: 'proficient', yearsExperience: 1 })
    const state = useOrbitStore.getState()
    const skill = state.dataset?.skills.find((s) => s.name === 'Quantum Computing')
    expect(skill).toBeDefined()
    expect(state.dataset?.personSkills.some((ps) => ps.personId === 'p1' && ps.skillId === skill!.id && ps.source === 'self-reported')).toBe(true)
  })

  it('reuses an existing skill by name instead of creating a duplicate', async () => {
    await useOrbitStore.getState().addMySkill('p1', { skillName: 'Salesforce', level: 'expert', yearsExperience: 5 })
    const state = useOrbitStore.getState()
    expect(state.dataset?.skills.filter((s) => s.name === 'Salesforce')).toHaveLength(1)
  })

  it('removes a skill', async () => {
    await useOrbitStore.getState().addMySkill('p1', { skillName: 'Salesforce', level: 'expert', yearsExperience: 5 })
    const skillId = useOrbitStore.getState().dataset!.skills.find((s) => s.name === 'Salesforce')!.id
    await useOrbitStore.getState().removeMySkill('p1', skillId)
    expect(useOrbitStore.getState().dataset?.personSkills.some((ps) => ps.personId === 'p1' && ps.skillId === skillId)).toBe(false)
  })
})

describe('orbitStore peer endorsements', () => {
  beforeEach(async () => {
    useAuthStore.setState({ user: { id: 'u2' } as never, session: {} as never, initialized: true })
    await useOrbitStore.getState().loadMyOrganization()
    await useOrbitStore.getState().claimPerson('p2', 'u2')
  })

  it('does nothing when the signed-in user has no claimed person', async () => {
    useAuthStore.setState({ user: { id: 'u-without-a-claim' } as never, session: {} as never, initialized: true })
    await useOrbitStore.getState().endorseSkill('p1', 's1')
    expect(useOrbitStore.getState().dataset?.skillEndorsements).toHaveLength(0)
  })

  it('endorses a colleague on a skill', async () => {
    await useOrbitStore.getState().endorseSkill('p1', 's1')
    const endorsement = useOrbitStore.getState().dataset?.skillEndorsements.find((e) => e.personId === 'p1' && e.skillId === 's1')
    expect(endorsement?.endorsedByPersonId).toBe('p2')
  })

  it('removes an endorsement', async () => {
    await useOrbitStore.getState().endorseSkill('p1', 's1')
    await useOrbitStore.getState().removeEndorsement('p1', 's1')
    expect(useOrbitStore.getState().dataset?.skillEndorsements.some((e) => e.personId === 'p1' && e.skillId === 's1')).toBe(false)
  })
})

describe('orbitStore entities', () => {
  beforeEach(async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never, initialized: true })
    await useOrbitStore.getState().loadMyOrganization()
  })

  it('creates an entity', async () => {
    await useOrbitStore.getState().createEntity('Acme France')
    const entity = useOrbitStore.getState().dataset?.entities.find((e) => e.name === 'Acme France')
    expect(entity).toBeDefined()
  })

  it('renames an entity', async () => {
    await useOrbitStore.getState().createEntity('Acme France')
    const entityId = useOrbitStore.getState().dataset!.entities.find((e) => e.name === 'Acme France')!.id
    await useOrbitStore.getState().renameEntity(entityId, 'Acme FR')
    expect(useOrbitStore.getState().dataset?.entities.find((e) => e.id === entityId)?.name).toBe('Acme FR')
  })

  it('deletes an entity', async () => {
    await useOrbitStore.getState().createEntity('Acme France')
    const entityId = useOrbitStore.getState().dataset!.entities.find((e) => e.name === 'Acme France')!.id
    await useOrbitStore.getState().deleteEntity(entityId)
    expect(useOrbitStore.getState().dataset?.entities.some((e) => e.id === entityId)).toBe(false)
  })

  it('assigns a person to an entity', async () => {
    await useOrbitStore.getState().createEntity('Acme France')
    const entityId = useOrbitStore.getState().dataset!.entities.find((e) => e.name === 'Acme France')!.id
    await useOrbitStore.getState().assignPersonToEntity('p1', entityId)
    expect(useOrbitStore.getState().dataset?.people.find((p) => p.id === 'p1')?.entityId).toBe(entityId)
  })

  it('changes the entity isolation mode', async () => {
    await useOrbitStore.getState().setEntityIsolationMode('strict')
    expect(useOrbitStore.getState().dataset?.organization.entityIsolationMode).toBe('strict')
  })
})

describe('orbitStore RBAC', () => {
  beforeEach(async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never, initialized: true })
    await useOrbitStore.getState().loadMyOrganization()
  })

  it('loads existing memberships into the dataset', () => {
    const memberships = useOrbitStore.getState().dataset?.memberships
    expect(memberships?.find((m) => m.userId === 'u1')?.role).toBe('owner')
    expect(memberships?.find((m) => m.userId === 'u2')?.role).toBe('member')
  })

  it('assigns a scoped role and entity to a member', async () => {
    await useOrbitStore.getState().createEntity('Acme France')
    const entityId = useOrbitStore.getState().dataset!.entities.find((e) => e.name === 'Acme France')!.id

    await useOrbitStore.getState().updateMembershipRole('u2', 'director', entityId)

    const membership = useOrbitStore.getState().dataset?.memberships.find((m) => m.userId === 'u2')
    expect(membership?.role).toBe('director')
    expect(membership?.entityId).toBe(entityId)
  })

  it('clears the entity when reassigning a role without one', async () => {
    await useOrbitStore.getState().updateMembershipRole('u2', 'hr_admin', null)
    const membership = useOrbitStore.getState().dataset?.memberships.find((m) => m.userId === 'u2')
    expect(membership?.role).toBe('hr_admin')
    expect(membership?.entityId).toBeUndefined()
  })
})

describe('orbitStore invitations', () => {
  beforeEach(async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never, initialized: true })
    await useOrbitStore.getState().loadMyOrganization()
  })

  it('creates invitations and sends the emails', async () => {
    await useOrbitStore.getState().createInvitations([{ email: 'new1@northstar.io', role: 'collaborator' }, { email: 'new2@northstar.io', role: 'manager' }])
    const invitations = useOrbitStore.getState().dataset?.invitations
    expect(invitations).toHaveLength(2)
    expect(invitations?.every((i) => i.status === 'pending')).toBe(true)
    expect(invitations?.every((i) => i.lastSentAt)).toBe(true)
  })

  it('does not create a duplicate invitation for an already-invited email', async () => {
    await useOrbitStore.getState().createInvitations([{ email: 'new1@northstar.io', role: 'collaborator' }])
    await useOrbitStore.getState().createInvitations([{ email: 'new1@northstar.io', role: 'director' }])
    const invitations = useOrbitStore.getState().dataset?.invitations
    expect(invitations).toHaveLength(1)
    expect(invitations?.[0].role).toBe('collaborator')
  })

  it('resends an invitation, updating lastSentAt', async () => {
    await useOrbitStore.getState().createInvitations([{ email: 'new1@northstar.io', role: 'collaborator' }])
    const invitationId = useOrbitStore.getState().dataset!.invitations[0].id
    const firstSentAt = useOrbitStore.getState().dataset!.invitations[0].lastSentAt

    await new Promise((resolve) => setTimeout(resolve, 5))
    await useOrbitStore.getState().resendInvitations([invitationId])

    const resent = useOrbitStore.getState().dataset?.invitations.find((i) => i.id === invitationId)
    expect(resent?.lastSentAt).toBeDefined()
    expect(resent?.lastSentAt).not.toBe(firstSentAt)
  })

  it('revokes an invitation', async () => {
    await useOrbitStore.getState().createInvitations([{ email: 'new1@northstar.io', role: 'collaborator' }])
    const invitationId = useOrbitStore.getState().dataset!.invitations[0].id

    await useOrbitStore.getState().revokeInvitation(invitationId)

    expect(useOrbitStore.getState().dataset?.invitations.find((i) => i.id === invitationId)?.status).toBe('revoked')
  })
})
