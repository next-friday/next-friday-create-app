# Intent: A Markdown-only change runs only the checks it can break

Author: @joetakara (Developer Productivity). Status: accepted.

## Problem

- A pull request or a merge that changes only Markdown files runs the full CI, in this repository and in every generated project.
- In `soddee/soddee-b2b-platform`, pull request #10 changed only `intent/sync-create-app-9-14-2/intent.md` and `spec.md`:
  - **On the pull request:** Verify ran in full, about 2 minutes, with SAST, OSV-Scanner, and Secret Scan.
  - **On the merge:** Verify ran in full again, 2 minutes 16 seconds. That included the build, Playwright end-to-end tests, two Docker image builds with a Trivy scan, and SAST, OSV-Scanner, and Secret Scan.
- In this repository, pull request #255 changed only `intent/done-at-build/spec.md`. The pull request ran light. The merge ran Verify in full: 25 jobs in 2 minutes 41 seconds, including 10 Template jobs and 5 Compatibility jobs on Linux, macOS, and Windows.
- The causes:
  1. A push to `main` always runs in full. `.github/workflows/ci.yml:55`, and line 53 of each `templates/<stack>/.github/workflows/ci.yml`, set `full_verification=true` for every `push`, without reading which files changed.
  2. The two filter files disagree. `templates/base/.github/file-filters.yml` lists `intent/**` and `REVIEW.md` under `ci_policy`, so a Markdown change there runs every job of a generated project. Pull request #140 added them to the template only. The root `.github/file-filters.yml` does not list `intent/**`, so on a pull request in this repository an intent change runs no job, `plan:check` included.
  3. `templates/<stack>/.github/workflows/sast.yml`, `templates/base/.github/workflows/osv-scanner.yml`, and `secret-scan.yml` run on every pull request and every push, whatever changed.

## Proposed outcome

- A pull request or a merge that changes only files under `intent/` runs `plan:check` and Secret Scan, and nothing heavier.
- A Markdown change under `.agents/`, `.claude/`, or `.cursor/`, or to `AGENTS.md`, runs the agent checks (`rules:check`, `gates:check`, and `plan:check`) and Secret Scan. It runs no build, test, end-to-end test, Docker image, or Template job.
- SAST and OSV-Scanner do not run on a change that touches only Markdown.
- Secret Scan still runs on every pull request and every push, because a secret can land in a Markdown file.
- A push to `main` chooses its jobs from the files it changed, by the same rules as a pull request.
- The scheduled weekly run stays a full run.
- The root of this repository and `templates/` follow the same rules, so a generated project gets them.
- Out of scope:
  - which jobs run when code changes;
  - the release jobs;
  - any new workflow.

## Affected users and systems

- This repository: `.github/file-filters.yml` and `.github/workflows/ci.yml`.
- Every generated project:
  - `templates/base/.github/file-filters.yml`;
  - `templates/<stack>/.github/workflows/ci.yml` and `sast.yml` for each stack in `src/stacks.ts`;
  - `templates/base/.github/workflows/osv-scanner.yml`.
- npm: the change publishes a new version of `@next-friday/create-app`.

## Constraints

- After the template change, `pnpm verify` passes in a generated project of every stack in `src/stacks.ts`.
- This session's GitHub token has no `workflow` scope, so it cannot push a file under the root `.github/workflows/`. Files under `templates/` are not affected.
- No developer and no computer are available. The agent does the work, and the product owner decides at each gate from a phone.

## Open questions

- How does a required check behave when the job is skipped? A job that GitHub branch protection or a ruleset requires reports "skipped" when its condition is false. The spec checks GitHub's documentation on whether a skipped required check blocks the merge, and keeps `All Checks` as the one required job.
- How does the root `.github/workflows/ci.yml` change land, since this session cannot push it? `playbooks/open-pr.md` gives the options. The spec proposes one.
