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
