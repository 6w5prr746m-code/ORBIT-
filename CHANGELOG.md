# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) (pre-1.0:
a `MINOR` bump means a new feature, a `PATCH` bump means a fix).

## [Unreleased]

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
