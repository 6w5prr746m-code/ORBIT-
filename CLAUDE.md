# ORBIT — working notes

## Versioning (do this on every feature/fix, not just on request)

This project follows [Semantic Versioning](https://semver.org/) (pre-1.0:
`MINOR` = new feature, `PATCH` = fix) and [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

When a PR is ready to ship:

1. Bump the `version` field in `package.json` — `minor` for a new feature,
   `patch` for a bug fix.
2. Add an entry to `CHANGELOG.md` under a new `## [x.y.z] - YYYY-MM-DD`
   heading (use the current date), with `### Added` / `### Fixed` /
   `### Changed` subsections as needed. Keep the `## [Unreleased]` heading
   at the top, empty, for whatever comes next.
3. Commit both files as part of the feature/fix commit (or its own small
   commit) — don't ship a version bump without a changelog entry, or a
   changelog entry without a version bump.

Once that PR merges to `main`, `.github/workflows/tag-release.yml` picks up
the `package.json` change automatically: it tags the commit `vX.Y.Z` and
publishes a GitHub Release using the matching `CHANGELOG.md` section as the
release notes. No manual `git tag` needed.

## Branch workflow

Development happens on `claude/orbit-mvp-people-intelligence-f2to8j`, merged
into `main` via PR. Because PRs are squash-merged, after a merge the branch
must be restarted from the fresh `main` before starting new work:

```
git fetch origin main && git checkout -B claude/orbit-mvp-people-intelligence-f2to8j origin/main
```

Stash (`git stash push -u`) any uncommitted work first if the branch has
diverged, then pop it back after resetting.
