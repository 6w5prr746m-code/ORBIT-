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
      entity_isolation_mode: 'filter',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  entities: [],
  invitations: [],
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
      claimed_by_user_id: null,
      entity_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p2',
      organization_id: DEMO_ORGANIZATION_ID,
      first_name: 'Grace',
      last_name: 'Hopper',
      avatar: null,
      job_title: 'Principal Engineer',
      department: 'Engineering',
      location: 'Remote',
      country: 'United States',
      bio: 'Test bio.',
      manager_id: null,
      start_date: '2020-01-01',
      status: 'active',
      email: 'grace@northstar.io',
      claimed_by_user_id: null,
      entity_id: null,
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
  skill_endorsements: [],
  teams: [],
  person_teams: [],
  connections: [],
  sources: [],
  memberships: [
    { user_id: 'u1', organization_id: DEMO_ORGANIZATION_ID, role: 'owner', entity_id: null, created_at: '2026-01-01T00:00:00Z' },
    { user_id: 'u2', organization_id: DEMO_ORGANIZATION_ID, role: 'member', entity_id: null, created_at: '2026-01-01T00:00:00Z' },
  ],
}

/** Tables whose primary key is a single `id` column with a `default gen_random_uuid()` — as opposed to composite-PK tables like person_skills/person_teams, which have no id column at all. */
const TABLES_WITH_ID_PK = new Set([
  'organizations',
  'entities',
  'people',
  'skills',
  'skill_endorsements',
  'teams',
  'connections',
  'sources',
  'invitations',
])

/** Mirrors a table's `default ...` columns, for rows inserted/upserted without them (matching Postgres, not just id generation). */
const ROW_DEFAULTS: Record<string, () => Record<string, unknown>> = {
  invitations: () => ({
    token: crypto.randomUUID(),
    status: 'pending',
    last_sent_at: null,
    accepted_at: null,
    created_at: new Date().toISOString(),
  }),
}

/**
 * A row missing (or explicitly setting undefined) a column with a Postgres
 * default — e.g. `id`, or invitations' `token`/`status` — should get that
 * default applied, exactly as a real insert/upsert against Supabase would.
 */
function applyRowDefaults(table: string, row: Record<string, unknown>) {
  if (TABLES_WITH_ID_PK.has(table) && (!('id' in row) || row.id === undefined)) row.id = crypto.randomUUID()
  const defaults = ROW_DEFAULTS[table]?.()
  if (!defaults) return
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in row) || row[key] === undefined) row[key] = value
  }
}

class FakeQuery {
  private filters: Array<(row: Record<string, unknown>) => boolean> = []
  private limitCount: number | null = null
  private table: string
  private rows: Record<string, unknown>[]
  private pendingOp: 'update' | 'delete' | 'insert' | null = null
  private pendingPatch: Record<string, unknown> | null = null
  private pendingInsertRows: Record<string, unknown>[] | null = null

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

  is(column: string, value: unknown) {
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

  update(patch: Record<string, unknown>) {
    this.pendingOp = 'update'
    this.pendingPatch = patch
    return this
  }

  delete() {
    this.pendingOp = 'delete'
    return this
  }

  insert(rows: Record<string, unknown>[] | Record<string, unknown>) {
    this.pendingOp = 'insert'
    this.pendingInsertRows = Array.isArray(rows) ? rows : [rows]
    return this
  }

  upsert(rows: Record<string, unknown>[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    const conflictColumns = options?.onConflict?.split(',')
    for (const row of rows) {
      if (conflictColumns) {
        const existingIdx = this.rows.findIndex((r) => conflictColumns.every((c) => r[c] === row[c]))
        if (existingIdx !== -1) {
          if (!options?.ignoreDuplicates) this.rows[existingIdx] = { ...this.rows[existingIdx], ...row }
          continue
        }
      }
      applyRowDefaults(this.table, row)
      this.rows.push(row)
    }
    return Promise.resolve({ data: null, error: null })
  }

  private execute(): Record<string, unknown>[] {
    if (this.pendingOp === 'insert' && this.pendingInsertRows) {
      for (const row of this.pendingInsertRows) {
        applyRowDefaults(this.table, row)
      }
      this.rows.push(...this.pendingInsertRows)
      return this.pendingInsertRows
    }
    const matched = this.rows.filter((row) => this.filters.every((f) => f(row)))
    if (this.pendingOp === 'update' && this.pendingPatch) {
      for (const row of matched) Object.assign(row, this.pendingPatch)
    } else if (this.pendingOp === 'delete') {
      for (const row of matched) {
        const idx = this.rows.indexOf(row)
        if (idx !== -1) this.rows.splice(idx, 1)
      }
    }
    return this.limitCount !== null ? matched.slice(0, this.limitCount) : matched
  }

  single() {
    const rows = this.execute()
    return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: `${this.table}: not found` } })
  }

  maybeSingle() {
    const rows = this.execute()
    return Promise.resolve({ data: rows[0] ?? null, error: null })
  }

  then<T>(
    onfulfilled?: ((value: { data: Record<string, unknown>[]; error: null }) => T) | null,
    onrejected?: (reason: unknown) => T,
  ) {
    return Promise.resolve({ data: this.execute(), error: null }).then(onfulfilled, onrejected)
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
        entity_isolation_mode: 'filter',
        logo: null,
        created_at: new Date().toISOString(),
      })
      return { data: id, error: null }
    }
    return { data: null, error: null }
  },
  functions: {
    /** Stands in for the send-invitation-emails Edge Function: marks each invitation sent, no real network call. */
    invoke: async (fnName: string, opts?: { body?: Record<string, unknown> }) => {
      if (fnName === 'send-invitation-emails') {
        const ids = (opts?.body?.invitationIds as string[] | undefined) ?? []
        const now = new Date().toISOString()
        for (const inv of FIXTURES.invitations) {
          if (ids.includes(inv.id as string)) inv.last_sent_at = now
        }
        return { data: { results: ids.map((id) => ({ id, ok: true })) }, error: null }
      }
      return { data: null, error: null }
    },
  },
}

const INITIAL_FIXTURES = structuredClone(FIXTURES)

/** Test helper: reset every fixture table (rows and in-place mutations alike) between tests. */
export function resetFakeSupabaseFixtures() {
  for (const table of Object.keys(FIXTURES)) {
    FIXTURES[table] = structuredClone(INITIAL_FIXTURES[table])
  }
}
