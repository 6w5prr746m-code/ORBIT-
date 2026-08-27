import { describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from '@/test/fakeSupabase'
import { DEMO_ORGANIZATION_ID } from '@/lib/constants'

vi.mock('@/lib/supabaseClient', () => ({ supabase: fakeSupabase }))

const { fetchDemoDataset, fetchOrganizationDataset } = await import('@/repositories/SupabaseRepository')

describe('fetchDemoDataset', () => {
  it('fetches and maps the shared demo organization', async () => {
    const dataset = await fetchDemoDataset()
    expect(dataset.organization.id).toBe(DEMO_ORGANIZATION_ID)
    expect(dataset.organization.name).toBe('Northstar')
    expect(dataset.people.length).toBeGreaterThan(0)
    expect(dataset.people[0].firstName).toBe('Ada')
  })
})

describe('fetchOrganizationDataset', () => {
  it('throws when the organization does not exist', async () => {
    await expect(fetchOrganizationDataset('does-not-exist')).rejects.toThrow()
  })

  it('scopes every collection to the requested organization', async () => {
    const dataset = await fetchOrganizationDataset(DEMO_ORGANIZATION_ID)
    for (const person of dataset.people) expect(person.organizationId).toBe(DEMO_ORGANIZATION_ID)
    for (const skill of dataset.skills) expect(skill.organizationId).toBe(DEMO_ORGANIZATION_ID)
  })

  it('includes an empty skillEndorsements array when there are none yet', async () => {
    const dataset = await fetchOrganizationDataset(DEMO_ORGANIZATION_ID)
    expect(dataset.skillEndorsements).toEqual([])
  })
})
