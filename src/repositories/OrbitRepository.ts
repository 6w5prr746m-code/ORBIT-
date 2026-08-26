import type {
  Connection,
  OrganizationDataset,
  Person,
  PersonSkill,
  PersonTeam,
  Skill,
  Team,
} from '@/types'

/**
 * Every read/write in this layer requires an explicit organizationId and filters by it.
 * This is the multi-tenant boundary: even though the MVP ships a single demo organization,
 * no query is ever allowed to return data across organizations, and the organizationId
 * argument is always supplied by trusted app state (the active session), never taken
 * verbatim from a client-controlled record id.
 */
export class OrbitRepository {
  private dataset: OrganizationDataset

  constructor(dataset: OrganizationDataset) {
    this.dataset = dataset
  }

  private assertOrg(organizationId: string) {
    if (organizationId !== this.dataset.organization.id) {
      throw new Error('Cross-organization access denied')
    }
  }

  getDataset(organizationId: string): OrganizationDataset {
    this.assertOrg(organizationId)
    return this.dataset
  }

  getOrganization(organizationId: string) {
    this.assertOrg(organizationId)
    return this.dataset.organization
  }

  listPeople(organizationId: string): Person[] {
    this.assertOrg(organizationId)
    return this.dataset.people.filter((p) => p.organizationId === organizationId)
  }

  getPerson(organizationId: string, personId: string): Person | undefined {
    this.assertOrg(organizationId)
    return this.dataset.people.find((p) => p.organizationId === organizationId && p.id === personId)
  }

  listSkills(organizationId: string): Skill[] {
    this.assertOrg(organizationId)
    return this.dataset.skills.filter((s) => s.organizationId === organizationId)
  }

  getSkill(organizationId: string, skillId: string): Skill | undefined {
    this.assertOrg(organizationId)
    return this.dataset.skills.find((s) => s.organizationId === organizationId && s.id === skillId)
  }

  listTeams(organizationId: string): Team[] {
    this.assertOrg(organizationId)
    return this.dataset.teams.filter((t) => t.organizationId === organizationId)
  }

  getTeam(organizationId: string, teamId: string): Team | undefined {
    this.assertOrg(organizationId)
    return this.dataset.teams.find((t) => t.organizationId === organizationId && t.id === teamId)
  }

  listPersonSkills(organizationId: string, personId?: string): PersonSkill[] {
    this.assertOrg(organizationId)
    const peopleIds = new Set(this.listPeople(organizationId).map((p) => p.id))
    return this.dataset.personSkills.filter(
      (ps) => peopleIds.has(ps.personId) && (!personId || ps.personId === personId),
    )
  }

  listPersonTeams(organizationId: string, personId?: string): PersonTeam[] {
    this.assertOrg(organizationId)
    const peopleIds = new Set(this.listPeople(organizationId).map((p) => p.id))
    return this.dataset.personTeams.filter(
      (pt) => peopleIds.has(pt.personId) && (!personId || pt.personId === personId),
    )
  }

  listConnections(organizationId: string, personId?: string): Connection[] {
    this.assertOrg(organizationId)
    return this.dataset.connections.filter(
      (c) =>
        c.organizationId === organizationId &&
        (!personId || c.personAId === personId || c.personBId === personId),
    )
  }

  listSources(organizationId: string) {
    this.assertOrg(organizationId)
    return this.dataset.sources.filter((s) => s.organizationId === organizationId)
  }

  addPeople(
    organizationId: string,
    people: Person[],
    personSkills: PersonSkill[],
    personTeams: PersonTeam[] = [],
  ): OrganizationDataset {
    this.assertOrg(organizationId)
    for (const p of people) {
      if (p.organizationId !== organizationId) throw new Error('Cannot import a person into another organization')
    }
    this.dataset = {
      ...this.dataset,
      people: [...this.dataset.people, ...people],
      personSkills: [...this.dataset.personSkills, ...personSkills],
      personTeams: [...this.dataset.personTeams, ...personTeams],
    }
    return this.dataset
  }

  addSkills(organizationId: string, skills: Skill[]): OrganizationDataset {
    this.assertOrg(organizationId)
    const existingNames = new Set(this.listSkills(organizationId).map((s) => s.name.toLowerCase()))
    const newSkills = skills.filter((s) => !existingNames.has(s.name.toLowerCase()))
    this.dataset = { ...this.dataset, skills: [...this.dataset.skills, ...newSkills] }
    return this.dataset
  }
}
