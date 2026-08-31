import { describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from '@/test/fakeSupabase'
import { DEMO_ORGANIZATION_ID } from '@/lib/constants'

vi.mock('@/lib/supabaseClient', () => ({ supabase: fakeSupabase }))

const { fetchDemoDataset, fetchOrganizationDataset, sendInvitationEmails } = await import('@/repositories/SupabaseRepository')

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

describe('sendInvitationEmails', () => {
  it('throws when the Edge Function reports a per-item failure, even though it returns 200', async () => {
    // The real send-invitation-emails function always responds 200 (a batch
    // can be partially successful), so a Resend-side failure for one
    // recipient must not be silently swallowed as an overall success.
    const invoke = vi.spyOn(fakeSupabase.functions, 'invoke').mockResolvedValueOnce({
      data: { results: [{ id: 'inv-1', ok: false, error: 'You can only send testing emails to your own email address.' }] },
      error: null,
    })

    await expect(sendInvitationEmails(['inv-1'])).rejects.toThrow(/own email address/)

    invoke.mockRestore()
  })

  it('does not throw when every item in the batch succeeded', async () => {
    const invoke = vi.spyOn(fakeSupabase.functions, 'invoke').mockResolvedValueOnce({
      data: { results: [{ id: 'inv-1', ok: true }] },
      error: null,
    })

    await expect(sendInvitationEmails(['inv-1'])).resolves.toBeUndefined()

    invoke.mockRestore()
  })
})
