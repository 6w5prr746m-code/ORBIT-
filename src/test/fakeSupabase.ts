import { DEMO_ORGANIZATION_ID } from '@/lib/constants'

/** Minimal fixture standing in for the real demo dataset in Supabase. */
const FIXTURES: Record<string, Record<string, unknown>[]> = {
  organizations: [
    {
      id: DEMO_ORGANIZATION_ID,
      name: 'Northstar',
      logo: null,
      industry: 'B2B SaaS',
      size: 500,
      is_demo: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  people: [
    {
      id: 'p1',
      organization_id: DEMO_ORGANIZATION_ID,
      first_name: 'Ada',
      last_name: 'Lovelace',
      avatar: null,
      job_title: 'Head of Engineering',
      department: 'Engineering',
      location: 'London, United Kingdom',
      country: 'United Kingdom',
      bio: 'Test bio.',
      manager_id: null,
      start_date: '2020-01-01',
      status: 'active',
      email: 'ada@northstar.io',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  skills: [
    {
      id: 's1',
      organization_id: DEMO_ORGANIZATION_ID,
      name: 'Salesforce',
      category: 'Technology',
      description: 'Test skill.',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  person_skills: [],
  teams: [],
  person_teams: [],
  connections: [],
  sources: [],
  memberships: [{ user_id: 'u1', organization_id: DEMO_ORGANIZATION_ID, role: 'owner', created_at: '2026-01-01T00:00:00Z' }],
}

class FakeQuery {
  private filters: Array<(row: Record<string, unknown>) => boolean> = []
  private limitCount: number | null = null
  private table: string
  private rows: Record<string, unknown>[]

  constructor(table: string, rows: Record<string, unknown>[]) {
    this.table = table
    this.rows = rows
  }

  select() {
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value)
    return this
  }

  order() {
    return this
  }

  limit(n: number) {
    this.limitCount = n
    return this
  }

  private resolveRows() {
    let result = this.rows.filter((row) => this.filters.every((f) => f(row)))
    if (this.limitCount !== null) result = result.slice(0, this.limitCount)
    return result
  }

  single() {
    const rows = this.resolveRows()
    return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: `${this.table}: not found` } })
  }

  maybeSingle() {
    const rows = this.resolveRows()
    return Promise.resolve({ data: rows[0] ?? null, error: null })
  }

  upsert(rows: Record<string, unknown>[]) {
    this.rows.push(...rows)
    return Promise.resolve({ data: null, error: null })
  }

  insert(rows: Record<string, unknown>[]) {
    this.rows.push(...rows)
    return Promise.resolve({ data: null, error: null })
  }

  then<T>(
    onfulfilled?: ((value: { data: Record<string, unknown>[]; error: null }) => T) | null,
    onrejected?: (reason: unknown) => T,
  ) {
    return Promise.resolve({ data: this.resolveRows(), error: null }).then(onfulfilled, onrejected)
  }
}

export const fakeSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: { session: null, user: null }, error: null }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from(table: string) {
    return new FakeQuery(table, FIXTURES[table] ?? [])
  },
  rpc: async (fnName: string, args?: Record<string, unknown>) => {
    if (fnName === 'create_organization') {
      const id = `org-${Math.random().toString(36).slice(2)}`
      FIXTURES.organizations.push({
        id,
        name: args?.org_name,
        industry: args?.org_industry,
        size: args?.org_size,
        is_demo: false,
        logo: null,
        created_at: new Date().toISOString(),
      })
      return { data: id, error: null }
    }
    return { data: null, error: null }
  },
}

/** Test helper: reset fixture tables mutated by rpc()/insert()/upsert() between tests. */
export function resetFakeSupabaseFixtures() {
  FIXTURES.organizations = FIXTURES.organizations.slice(0, 1)
  FIXTURES.people = FIXTURES.people.slice(0, 1)
  FIXTURES.skills = FIXTURES.skills.slice(0, 1)
}
