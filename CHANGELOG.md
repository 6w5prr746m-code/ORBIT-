# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) (pre-1.0:
a `MINOR` bump means a new feature, a `PATCH` bump means a fix).

## [Unreleased]

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
