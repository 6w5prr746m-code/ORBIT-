import { create } from 'zustand'
import type { Organization, OrganizationDataset, Person, PersonSkill, PersonTeam, Skill, Source } from '@/types'
import { seedDemoData } from '@/data/seed/generate'
import { OrbitRepository } from '@/repositories/OrbitRepository'

const DATASET_KEY = 'orbit:dataset:v1'
const ONBOARDED_KEY = 'orbit:onboarded:v1'

function loadPersistedDataset(): OrganizationDataset | null {
  try {
    const raw = localStorage.getItem(DATASET_KEY)
    return raw ? (JSON.parse(raw) as OrganizationDataset) : null
  } catch {
    return null
  }
}

function persistDataset(dataset: OrganizationDataset | null) {
  try {
    if (dataset) localStorage.setItem(DATASET_KEY, JSON.stringify(dataset))
    else localStorage.removeItem(DATASET_KEY)
  } catch {
    // Storage unavailable (private mode, quota) — the session still works in-memory.
  }
}

interface OrbitState {
  dataset: OrganizationDataset | null
  repository: OrbitRepository | null
  onboarded: boolean
  loadDemo: () => void
  createOrganization: (input: { name: string; industry: string; size: number }) => void
  importPeople: (people: Person[], personSkills: PersonSkill[], personTeams: PersonTeam[], newSkills: Skill[]) => void
  resetOrganization: () => void
  markOnboarded: () => void
}

function emptySources(organizationId: string): Source[] {
  return [
    { id: 'src-core-hr', organizationId, type: 'core-hr', name: 'Core HR', status: 'coming-soon' },
    { id: 'src-m365', organizationId, type: 'microsoft-365', name: 'Microsoft 365', status: 'coming-soon' },
    { id: 'src-gws', organizationId, type: 'google-workspace', name: 'Google Workspace', status: 'coming-soon' },
    { id: 'src-slack', organizationId, type: 'slack', name: 'Slack', status: 'coming-soon' },
    { id: 'src-teams', organizationId, type: 'teams', name: 'Microsoft Teams', status: 'coming-soon' },
    { id: 'src-notion', organizationId, type: 'notion', name: 'Notion', status: 'coming-soon' },
    { id: 'src-jira', organizationId, type: 'jira', name: 'Jira', status: 'coming-soon' },
  ]
}

export const useOrbitStore = create<OrbitState>((set, get) => ({
  dataset: loadPersistedDataset(),
  repository: (() => {
    const d = loadPersistedDataset()
    return d ? new OrbitRepository(d) : null
  })(),
  onboarded: (() => {
    try {
      return localStorage.getItem(ONBOARDED_KEY) === 'true'
    } catch {
      return false
    }
  })(),

  loadDemo: () => {
    const dataset = seedDemoData()
    persistDataset(dataset)
    try {
      localStorage.setItem(ONBOARDED_KEY, 'true')
    } catch {
      // ignore
    }
    set({ dataset, repository: new OrbitRepository(dataset), onboarded: true })
  },

  createOrganization: ({ name, industry, size }) => {
    const organizationId = `org-${crypto.randomUUID()}`
    const organization: Organization = { id: organizationId, name, industry, size }
    const dataset: OrganizationDataset = {
      organization,
      people: [],
      skills: [],
      personSkills: [],
      teams: [],
      personTeams: [],
      connections: [],
      sources: emptySources(organizationId),
    }
    persistDataset(dataset)
    try {
      localStorage.setItem(ONBOARDED_KEY, 'true')
    } catch {
      // ignore
    }
    set({ dataset, repository: new OrbitRepository(dataset), onboarded: true })
  },

  importPeople: (people, personSkills, personTeams, newSkills) => {
    const { dataset } = get()
    if (!dataset) return
    const repo = new OrbitRepository(dataset)
    let next = repo.addSkills(dataset.organization.id, newSkills)
    const repo2 = new OrbitRepository(next)
    next = repo2.addPeople(dataset.organization.id, people, personSkills, personTeams)
    persistDataset(next)
    set({ dataset: next, repository: new OrbitRepository(next) })
  },

  resetOrganization: () => {
    persistDataset(null)
    try {
      localStorage.removeItem(ONBOARDED_KEY)
    } catch {
      // ignore
    }
    set({ dataset: null, repository: null, onboarded: false })
  },

  markOnboarded: () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, 'true')
    } catch {
      // ignore
    }
    set({ onboarded: true })
  },
}))
