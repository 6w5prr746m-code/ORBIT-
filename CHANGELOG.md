# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) (pre-1.0:
a `MINOR` bump means a new feature, a `PATCH` bump means a fix).

## [Unreleased]

## [0.9.0] - 2026-08-27
### Added
- Role-based access control: four fixed roles on top of the existing
  owner/member memberships — Collaborator, Manager, Director and HR admin —
  assignable from a new Settings → Team & access screen (visible to every
  signed-in member: admins get the full roster with role/entity dropdowns,
  everyone else sees their own role). When an organization's entity
  isolation mode (0008_entities.sql) is set to `strict`, visibility of
  `people` (and the data attached to a specific person — skills, team
  membership, connections, endorsements) is enforced at the database level
  via a `can_view_person()` RLS helper: a Director sees their own entity,
  a Manager sees their direct reports, a Collaborator sees their own
  entity, and HR admin/Owner/legacy Member keep full visibility, exactly
  as before. `filter` mode still never restricts anyone. Only SELECT is
  scoped — the write model is unchanged for this release.
### Changed
- Entity isolation mode (introduced storage-only in 0.8.0) now actually
  does something: this is the release that makes `strict` mode enforce a
  real wall between entities.

## [0.8.0] - 2026-08-27
### Added
- Multi-entity support: an organization can now have entities (subsidiaries
  / business units), managed from Settings → Entities — create, rename,
  delete, and assign people (also settable via an optional `entity` CSV
  import column). A per-organization choice of isolation mode (`filter`:
  simple grouping, everyone still sees everyone; `strict`: hard wall between
  entities) is stored but not yet enforced — that lands with role-based
  access control in the next release, which is what actually needs the
  isolation mode to mean something.

## [0.7.0] - 2026-08-26
### Added
- In-app digest on Home: proactive, deterministic signals surfaced on
  arrival instead of waiting for someone to go looking — recent joiners,
  skills that just became a single point of failure, hidden experts, and
  emerging skills. Reuses CoverageService and DiscoverService as the single
  source of truth for what those mean; no email, no new infrastructure.

## [0.6.0] - 2026-08-26
### Added
- Team Builder (`/team-builder`): describe the skills a project needs, an
  optional team size and location, and get a candidate team back — each
  pick shown with exactly which required skills (and level) earned their
  spot. Deterministic greedy set-cover over the existing dataset, same
  explainability discipline as Ask Orbit; no schema changes.

## [0.5.0] - 2026-08-26
### Added
- Skill Risk (`/coverage`): a deterministic, rule-based view of "bus factor"
  — skills held by exactly one person org-wide ("single points of failure")
  or exactly two ("fragile"), plus a per-team breakdown of how much of that
  risk sits on each team. Pure computation over existing data, no schema
  changes.

## [0.4.0] - 2026-08-26
### Added
- Peer endorsements: a person with a claimed profile can vouch for a
  colleague's skill (one endorsement per person per skill, can't endorse
  yourself). Endorsement counts show up as a small thumbs-up badge next to
  each skill on a person's profile, giving self-reported skills social
  proof without silently rewriting `person_skills.source`.

## [0.3.0] - 2026-08-26
### Added
- Claim your profile: a signed-in user can link their account to their own
  `people` row (`/me`, also reachable from the sidebar and Settings → User)
  and self-service edit their bio, photo URL and skill list. Skills added
  this way are recorded as self-reported, keeping the door open for peer
  endorsement to upgrade them to verified in a future release.

## [0.2.0] - 2026-08-26
### Added
- Trombinoscope: a photo-grid view on the People page (toggle between list and
  grid), real photo rendering everywhere a person appears (falls back to
  initials if the photo fails to load), and an optional `photoUrl` CSV import
  column. Photos are plain external URLs — no new storage infrastructure.

## [0.1.1] - 2026-08-26
### Added
- Semantic versioning process: `CHANGELOG.md`, and a GitHub Actions workflow
  (`tag-release.yml`) that tags and publishes a GitHub Release automatically
  whenever `package.json`'s version is bumped on `main`. This entry is the
  first release it produces end-to-end.

## [0.1.0] - 2026-08-26
### Added
- Initial ORBIT MVP: People, Skills, Discover and Ask Orbit pages, a deterministic
  (non-LLM) search/ranking engine, the Northstar demo dataset, CSV import, an
  installable PWA, and GitHub Pages deployment.
- Multi-tenant Supabase backend: Postgres schema with Row Level Security,
  email/password auth, real organization creation, and CSV import writing to
  the database.
- Internationalization: full French, Spanish, Italian, German and English
  translations, with a language switcher on the landing page and in Settings
  (persisted per-browser).
### Fixed
- Settings page crash caused by a malformed translation key (the security
  checklist was a JSON object instead of an array).
