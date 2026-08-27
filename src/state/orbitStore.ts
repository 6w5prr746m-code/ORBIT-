import { create } from 'zustand'
import type { Entity, EntityIsolationMode, MembershipRole, OrganizationDataset, Person, PersonSkill, PersonTeam, Skill, SkillLevel } from '@/types'
import {
  assignPersonToEntity as assignPersonToEntityRemote,
  claimPerson as claimPersonRemote,
  createEntity as createEntityRemote,
  createOrganization as createOrganizationRemote,
  createSkillIfMissing,
  deleteEntity as deleteEntityRemote,
  endorseSkill as endorseSkillRemote,
  fetchDemoDataset,
  fetchMyOrganizationId,
  fetchOrganizationDataset,
  insertPeople,
  removeEndorsement as removeEndorsementRemote,
  removePersonSkill as removePersonSkillRemote,
  renameEntity as renameEntityRemote,
  setEntityIsolationMode as setEntityIsolationModeRemote,
  updateMembershipRole as updateMembershipRoleRemote,
  updatePersonProfile,
  upsertPersonSkill,
} from '@/repositories/SupabaseRepository'
import { useAuthStore } from '@/state/authStore'
import { inferSkillCategory } from '@/services/ImportService'

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
  importPeople: (
    people: Person[],
    personSkills: PersonSkill[],
    personTeams: PersonTeam[],
    newSkills: Skill[],
    newEntities?: Entity[],
  ) => Promise<void>
  claimPerson: (personId: string, userId: string) => Promise<void>
  updateMyProfile: (personId: string, patch: { bio?: string; avatar?: string | null }) => Promise<void>
  addMySkill: (personId: string, input: { skillId?: string; skillName?: string; level: SkillLevel; yearsExperience: number }) => Promise<void>
  removeMySkill: (personId: string, skillId: string) => Promise<void>
  endorseSkill: (personId: string, skillId: string) => Promise<void>
  removeEndorsement: (personId: string, skillId: string) => Promise<void>
  createEntity: (name: string) => Promise<void>
  renameEntity: (entityId: string, name: string) => Promise<void>
  deleteEntity: (entityId: string) => Promise<void>
  assignPersonToEntity: (personId: string, entityId: string | null) => Promise<void>
  setEntityIsolationMode: (mode: EntityIsolationMode) => Promise<void>
  updateMembershipRole: (userId: string, role: MembershipRole, entityId: string | null) => Promise<void>
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

  importPeople: async (people, personSkills, personTeams, newSkills, newEntities = []) => {
    const { dataset } = get()
    if (!dataset) return
    await insertPeople(dataset.organization.id, people, personSkills, personTeams, newSkills, newEntities)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  claimPerson: async (personId, userId) => {
    const { dataset } = get()
    if (!dataset) return
    await claimPersonRemote(personId, userId)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  updateMyProfile: async (personId, patch) => {
    const { dataset } = get()
    if (!dataset) return
    await updatePersonProfile(personId, patch)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  addMySkill: async (personId, input) => {
    const { dataset } = get()
    if (!dataset) return
    const organizationId = dataset.organization.id

    let skillId = input.skillId
    if (!skillId && input.skillName) {
      const existing = dataset.skills.find((s) => s.name.toLowerCase() === input.skillName!.toLowerCase())
      if (existing) {
        skillId = existing.id
      } else {
        const skill: Skill = {
          id: crypto.randomUUID(),
          organizationId,
          name: input.skillName,
          category: inferSkillCategory(input.skillName),
          description: 'Added by the person themself.',
        }
        await createSkillIfMissing(skill)
        skillId = skill.id
      }
    }
    if (!skillId) return

    await upsertPersonSkill(organizationId, personId, skillId, input.level, input.yearsExperience)
    const refreshed = await fetchOrganizationDataset(organizationId)
    set({ dataset: refreshed })
  },

  removeMySkill: async (personId, skillId) => {
    const { dataset } = get()
    if (!dataset) return
    await removePersonSkillRemote(personId, skillId)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  endorseSkill: async (personId, skillId) => {
    const { dataset } = get()
    const userId = useAuthStore.getState().user?.id
    const myPerson = dataset?.people.find((p) => p.claimedByUserId === userId)
    if (!dataset || !myPerson) return
    await endorseSkillRemote(dataset.organization.id, personId, skillId, myPerson.id)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  removeEndorsement: async (personId, skillId) => {
    const { dataset } = get()
    const userId = useAuthStore.getState().user?.id
    const myPerson = dataset?.people.find((p) => p.claimedByUserId === userId)
    if (!dataset || !myPerson) return
    await removeEndorsementRemote(personId, skillId, myPerson.id)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  createEntity: async (name) => {
    const { dataset } = get()
    if (!dataset) return
    await createEntityRemote(dataset.organization.id, name)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  renameEntity: async (entityId, name) => {
    const { dataset } = get()
    if (!dataset) return
    await renameEntityRemote(entityId, name)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  deleteEntity: async (entityId) => {
    const { dataset } = get()
    if (!dataset) return
    await deleteEntityRemote(entityId)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  assignPersonToEntity: async (personId, entityId) => {
    const { dataset } = get()
    if (!dataset) return
    await assignPersonToEntityRemote(personId, entityId)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  setEntityIsolationMode: async (mode) => {
    const { dataset } = get()
    if (!dataset) return
    await setEntityIsolationModeRemote(dataset.organization.id, mode)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  updateMembershipRole: async (userId, role, entityId) => {
    const { dataset } = get()
    if (!dataset) return
    await updateMembershipRoleRemote(dataset.organization.id, userId, role, entityId)
    const refreshed = await fetchOrganizationDataset(dataset.organization.id)
    set({ dataset: refreshed })
  },

  clear: () => set({ dataset: null, isDemo: false, error: null }),
}))
