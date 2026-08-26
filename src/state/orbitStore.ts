import { create } from 'zustand'
import type { OrganizationDataset, Person, PersonSkill, PersonTeam, Skill } from '@/types'
import {
  createOrganization as createOrganizationRemote,
  fetchDemoDataset,
  fetchMyOrganizationId,
  fetchOrganizationDataset,
  insertPeople,
} from '@/repositories/SupabaseRepository'
import { useAuthStore } from '@/state/authStore'

export type LoadOrganizationResult = 'loaded' | 'none' | 'error'

interface OrbitState {
  dataset: OrganizationDataset | null
  loading: boolean
  error: string | null
  isDemo: boolean

  loadDemo: () => Promise<void>
  /** Looks up the signed-in user's organization and loads it. 'none' means they haven't created one yet. */
  loadMyOrganization: () => Promise<LoadOrganizationResult>
  createOrganization: (input: { name: string; industry: string; size: number }) => Promise<void>
  importPeople: (people: Person[], personSkills: PersonSkill[], personTeams: PersonTeam[], newSkills: Skill[]) => Promise<void>
  clear: () => void
}

export const useOrbitStore = create<OrbitState>((set, get) => ({
  dataset: null,
  loading: false,
  error: null,
  isDemo: false,

  loadDemo: async () => {
    set({ loading: true, error: null })
    try {
      const dataset = await fetchDemoDataset()
      set({ dataset, isDemo: true, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Could not load the demo organization.' })
    }
  },

  loadMyOrganization: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return 'none'

    set({ loading: true, error: null })
    try {
      const organizationId = await fetchMyOrganizationId(userId)
      if (!organizationId) {
        set({ loading: false })
        return 'none'
      }
      const dataset = await fetchOrganizationDataset(organizationId)
      set({ dataset, isDemo: false, loading: false })
      return 'loaded'
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Could not load your organization.' })
      return 'error'
    }
  },

  createOrganization: async ({ name, industry, size }) => {
    set({ loading: true, error: null })
    try {
      const organizationId = await createOrganizationRemote({ name, industry, size })
      const dataset = await fetchOrganizationDataset(organizationId)
      set({ dataset, isDemo: false, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Could not create your organization.' })
      throw err
    }
  },

  importPeople: async (people, personSkills, personTeams, newSkills) => {
    const { dataset } = get()
    if (!dataset) return
    await insertPeople(dataset.organization.id, people, personSkills, personTeams, newSkills)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  clear: () => set({ dataset: null, isDemo: false, error: null }),
}))
