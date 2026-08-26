# ORBIT

**Know who knows what.**

ORBIT is a People Intelligence platform — not a HRIS. It connects to the
systems an organization already uses and turns scattered people data into a
searchable, explainable map of who knows what, who works with whom, and who
can help with a given topic. The Core HR system stays the system of record;
ORBIT is the system of intelligence layered on top of it.

This repository is the MVP: a installable, offline-capable PWA with a
deterministic (non-LLM) search and ranking engine, a realistic 60-person demo
organization ("Northstar"), and a CSV import path for bringing in real data.

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
  → repositories/  OrbitRepository — the only place that touches the data layer,
                    every method requires and validates an organizationId
  → data/          seed generator + localStorage persistence
```

State is a single Zustand store (`src/state/orbitStore.ts`) holding the
active `OrganizationDataset` and mirroring it to `localStorage`, so a demo or
an imported organization survives a refresh. There is no backend in this
MVP — everything runs client-side, which is why the repository layer is
strict about `organizationId` scoping: it's the seam a real multi-tenant
backend would enforce, kept in place here so the same rules already hold
when one is added.

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

## Run

```bash
npm run dev
```

Open the printed URL, then click **Explore demo** to load the Northstar
demo organization — the fastest way to see the product working.

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
and validation, `DiscoverService` determinism, and `OrbitRepository`
cross-organization isolation. A small App-level smoke test covers routing
(welcome redirect, home render, 404).

## PWA

Configured via `vite-plugin-pwa` (`vite.config.ts`): a generated
`manifest.webmanifest`, a Workbox service worker with SPA offline fallback
(`navigateFallback: '/index.html'`), and installable icons in `public/icons/`.
Run `npm run build && npm run preview` and check your browser's install
prompt to verify.

## Data model

Defined in `src/types/index.ts`:

`Organization → Person, Skill, Team, Source` as top-level entities, with
`PersonSkill` and `PersonTeam` as join records (skill level, years of
experience, and a `source` of `self-reported | inferred | verified` — this
is what lets the UI distinguish a fact from an inference instead of
presenting everything as equally certain). `Connection` records
collaboration strength between two people, tagged `peer | reports-to |
collaborates-with`.

## Seed data

`src/data/seed/generate.ts` exports `seedDemoData()`, a **deterministic**
generator (seeded PRNG, no `Math.random`) that builds "Northstar": 60
people across 10 teams and 6 countries, 100+ skills across six categories,
manager relationships, and cross-functional connections between related
teams (Sales ↔ Customer Success, Product ↔ Engineering, Engineering ↔ IT,
Finance ↔ People, and so on). Running it twice produces byte-identical
output — see `SearchService.test.ts`'s determinism assertions.

## Import

Settings → Import (also offered during onboarding) accepts a CSV with
columns `firstName,lastName,email,jobTitle,department,location,country,skills`
(semicolon-separated skills). `ImportService` parses it, validates required
fields and email format, previews the parsed rows, and on confirmation
creates new `Person`/`PersonSkill` records — reusing existing skills by name
and creating new ones only when necessary. No OAuth in this MVP; CSV is the
only import path.

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
  matcher, behind the same `searchPeople` / `searchSkills` signatures.
- **A real knowledge graph / organization graph**, multi-tenant backend, and
  an AI Agent API for other systems to query "who knows what" programmatically.
