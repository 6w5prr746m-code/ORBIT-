# ORBIT

**Know who knows what.**

ORBIT is a People Intelligence platform — not a HRIS. It connects to the
systems an organization already uses and turns scattered people data into a
searchable, explainable map of who knows what, who works with whom, and who
can help with a given topic. The Core HR system stays the system of record;
ORBIT is the system of intelligence layered on top of it.

This repository is the MVP: a installable, offline-capable PWA with a
deterministic (non-LLM) search and ranking engine, a real multi-tenant
Supabase backend (Postgres + Auth + Row Level Security), a realistic
60-person shared demo organization ("Northstar"), and a CSV import path for
bringing in real data.

## What's in scope (and what isn't)

Four pillars, on purpose: **People**, **Skills**, **Discover**, **Ask**.

Explicitly out of scope for this MVP: payroll, leave/absence management,
recruiting, performance reviews, compliance workflows, contracts, and deep
third-party integrations. Those are represented in Settings → Integrations
as "coming soon" and described in [Future architecture](#future-architecture).

## Architecture

Strict one-way layering — no page ever touches a repository directly, and no
business logic lives inside a component:

```
pages/            route-level screens (People, Skills, Ask, Discover, ...)
  → components/   presentational + composed UI (cards, layout, forms)
  → hooks/        thin React bindings over state + services
  → services/      business logic: SearchService, AskService, DiscoverService,
                    ImportService — pure functions over an OrganizationDataset
  → repositories/  SupabaseRepository + mappers — the only place that talks to
                    Supabase; every query is scoped to an organizationId
  → data/          deterministic demo-data generator (used to seed Supabase)
```

State lives in two small Zustand stores:
- `src/state/authStore.ts` — the Supabase Auth session (sign up / log in / sign out).
- `src/state/orbitStore.ts` — the active `OrganizationDataset`, fetched from
  Supabase (either the shared demo org or the signed-in user's own org).

There is a real backend: **Supabase** (hosted Postgres + Auth + PostgREST).
`organizationId` scoping is enforced twice — once defensively in the old
in-app repository pattern this MVP started with, and now authoritatively by
**Postgres Row Level Security** (`supabase/migrations/0002_rls.sql`): every
table's policies resolve through an `is_org_member()` / `is_org_readable()`
check, so cross-organization access is refused by the database itself, not
just by application code. The one exception is the shared demo organization
(`is_demo = true`), which is readable by anyone — including signed-out
visitors — but never writable by anyone but ORBIT's own seed script.

### Design system

Tokens live in `src/index.css` as CSS custom properties (`@theme` block,
Tailwind v4): a warm neutral palette (`--color-canvas`, `--color-ink`,
`--color-graphite`, `--color-mist`) plus a single swappable accent
(`--color-accent`). Changing the whole product's accent color is a
one-line edit — Settings → Workspace demonstrates this live. Base UI
primitives (`Button`, `Card`, `Badge`, `Tag`, `Input`, `Avatar`, `Skeleton`,
`Toast`, `EmptyState`) live in `src/components/ui/`.

## Install

```bash
npm install
```

## Backend setup (Supabase)

ORBIT needs a Supabase project to talk to. One-time setup:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, paste and run the four files in
   `supabase/migrations/` **in order** (`0001_schema.sql`, `0002_rls.sql`,
   `0003_functions.sql`, `0004_seed_demo.sql`). They can be pasted as one
   combined script — each file is idempotent-ordered and comments explain
   what it does.
3. Copy your project's **Project URL** and **anon public key**
   (Project Settings → Data API) into a local `.env.local`:
   ```bash
   cp .env.example .env.local
   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
4. For the deployed site, add the same two values as GitHub repo secrets
   named `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Settings → Secrets and
   variables → Actions) — `.github/workflows/deploy-pages.yml` reads them
   at build time.

The anon key is meant to be public (Row Level Security is what actually
protects the data), so it's safe to embed in the built frontend either way.

If `supabase/migrations/0004_seed_demo.sql` ever needs regenerating (e.g.
after changing the demo dataset generator), run:
```bash
npx tsx scripts/generate-demo-seed-sql.ts > supabase/migrations/0004_seed_demo.sql
```

## Run

```bash
npm run dev
```

Open the printed URL, then click **Explore demo** to load the shared
Northstar demo organization — no account needed, the fastest way to see the
product working. Use **Create account** to sign up with email + password and
set up your own organization instead.

## Build

```bash
npm run build     # tsc -b && vite build, output in dist/
npm run preview   # serve the production build locally
```

## Test

```bash
npm test          # vitest run — unit tests, single pass
npm run test:watch
```

Coverage focuses on the parts that must never lie: `SearchService` ranking
(including a regression test that a department like "Sales" never
false-matches a skill like "Salesforce"), `AskService` intent detection for
the exact example queries in the product brief, `ImportService` CSV parsing
and validation, `DiscoverService` determinism, the DB-row ↔ app-type
mappers, and `orbitStore`'s async flows (demo load, org creation, import)
against a fully mocked Supabase client (`src/test/fakeSupabase.ts`) — this
sandbox has no network access to a real Supabase instance, so these tests
never touch the network, by design, not by accident. A small App-level
smoke test covers routing (welcome redirect, home render, 404). Row Level
Security itself can only really be verified against a live Postgres
instance — do that manually via the Supabase SQL editor if you change
`0002_rls.sql`.

## PWA

Configured via `vite-plugin-pwa` (`vite.config.ts`): a generated
`manifest.webmanifest`, a Workbox service worker with SPA offline fallback
(`navigateFallback: '/index.html'`), and installable icons in `public/icons/`.
Run `npm run build && npm run preview` and check your browser's install
prompt to verify.

## Data model

App-level types live in `src/types/index.ts`; the matching Postgres schema
is `supabase/migrations/0001_schema.sql` (kept in sync by hand — see
`src/types/database.ts` and `src/repositories/mappers.ts` for the
snake_case ↔ camelCase translation layer).

`Organization → Person, Skill, Team, Source` as top-level entities, with
`PersonSkill` and `PersonTeam` as join records (skill level, years of
experience, and a `source` of `self-reported | inferred | verified` — this
is what lets the UI distinguish a fact from an inference instead of
presenting everything as equally certain). `Connection` records
collaboration strength between two people, tagged `peer | reports-to |
collaborates-with`. A `memberships` table links Supabase Auth users to the
organization(s) they belong to — the root of multi-tenancy, and the one
table RLS never lets a client write to directly (only the
`create_organization()` Postgres function can, atomically, so no user can
grant themselves access to someone else's org).

## Seed data

`src/data/seed/generate.ts` exports `seedDemoData()`, a **deterministic**
generator (seeded PRNG, no `Math.random`) that builds "Northstar": 60
people across 10 teams and 6 countries, 100+ skills across six categories,
manager relationships, and cross-functional connections between related
teams (Sales ↔ Customer Success, Product ↔ Engineering, Engineering ↔ IT,
Finance ↔ People, and so on). Running it twice produces byte-identical
output — see `SearchService.test.ts`'s determinism assertions.
`scripts/generate-demo-seed-sql.ts` turns that same dataset into the SQL
insert statements in `supabase/migrations/0004_seed_demo.sql`, which is
what actually populates the shared demo organization in Supabase (fixed id
`00000000-0000-0000-0000-000000000001`, marked `is_demo = true`).

## Import

Settings → Import (also offered during onboarding) accepts a CSV with
columns `firstName,lastName,email,jobTitle,department,location,country,skills`
(semicolon-separated skills). `ImportService` parses it, validates required
fields and email format, and previews the parsed rows entirely client-side;
on confirmation it writes new `Person`/`PersonSkill` rows straight to
Supabase — reusing existing skills by name and creating new ones only when
necessary. Import is disabled while viewing the shared demo organization
(it's read-only by RLS) — a signed-in user with their own organization is
required. No OAuth in this MVP; CSV is the only import path.

## Search & Ask engine

`SearchService` does fuzzy + keyword matching with weighted scoring (skill
level, years of experience, exact vs. partial text match) — no LLM calls,
fully deterministic, and structured so a real embedding-based engine could
be substituted behind the same function signatures later. `AskService`
layers lightweight intent detection on top (skill / location / team / most-
connected / general) and always returns an explanation for every result,
each tagged `fact` or `inference` depending on whether the underlying
`PersonSkill.source` is verified. `DiscoverService`'s rows (AI & Technology,
Business Experts, Hidden Experts, Most Connected, Emerging Skills,
Cross-functional People) are rule-based over the same dataset — never
described as AI-generated, because they aren't.

## Future architecture

Deliberately not built yet, but the seams are already in place for:

- **Real integrations** — Core HR, Microsoft 365, Google Workspace, Slack,
  Teams, Notion, Jira (currently listed as "coming soon" `Source` records
  in Settings → Integrations).
- **An LLM layer** for `Ask` — `AskService`'s pipeline (normalize → intent →
  search → rank → explain) is structured so a model could replace or augment
  the intent-detection and explanation steps without changing the rest of
  the app.
- **Vector search** as a drop-in alternative to `SearchService`'s fuzzy
  matcher, behind the same `searchPeople` / `searchSkills` signatures —
  Postgres + `pgvector` on the same Supabase project is a natural next step.
- **A real knowledge graph / organization graph** and an AI Agent API for
  other systems to query "who knows what" programmatically, on top of the
  multi-tenant Postgres schema that already exists.
