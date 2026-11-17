# Intent: Fast feedback before merge, full verification after it

Author: @joetakara (Developer Productivity). Status: accepted.

"The book" below is the AI-native SDLC playbook the harness follows, cited by page.

## Problem

The product owner, translated from Thai: "I found a problem in the intent of another repository. I see that it concerns us."

A project generated from the starter reported that its CI gates slow development: a fix that takes minutes to write waits about an hour to merge. The starter ships the files behind that report (read on `origin/main`, `a149372`):

- A pull request runs the end-to-end tests inside the one serial job `checks`: `templates/turborepo/.github/workflows/ci.yml:225-233`, `templates/nextjs/.github/workflows/ci.yml:150-152`, `templates/payload/.github/workflows/ci.yml:167-169`, `templates/nestjs/.github/workflows/ci.yml:146`. `nodejs` has no end-to-end step.
- The `pre-push` hook runs `pnpm check`: the static checks with `format:check`, the changed tests, and the build (`templates/turborepo/package.json:16` and `:46`). CI runs the same static checks and build again.
- lint-staged already formats every staged file at the commit (`templates/turborepo/.lintstagedrc.json`), and CI checks the format (`templates/turborepo/.github/workflows/ci.yml:135`).
- The `commit-msg` hook runs commitlint on every commit. Pull requests are squash-merged, so only the title reaches `main` (`templates/turborepo/CONTRIBUTING.md:60`), and `templates/base/.github/workflows/validate-pr-title.yml:31-46` checks its type, scope, and length.
- `templates/base/.github/workflows/pr-triage.yml` writes the labels `documentation`, `ci`, and `dependencies`. No workflow or script under `templates/` reads a label.
- In `turborepo`, `ci.yml` has seven jobs (`changes`, `affected-apps`, `agent-checks`, `checks`, `image`, `triage`, `ci`). A private repository is billed each job rounded up to the whole minute (https://docs.github.com/en/billing/reference/actions-runner-pricing; not opened for this intent).
- The weekly schedule of that `ci.yml` turns on only `affected-apps` and `image` (`:72`, `:253`).
- `codeql`, `dependency-review`, and `scorecard` do nothing in a private repository until `CODE_SCANNING` is set. `control-band`, `claude-fix-loop`, and `spec-on-intent-merge` do nothing until `CLAUDE_CI_ENABLED` is set. Each still starts a run that is skipped.
- In `turborepo`, the Remote Cache step runs only when `vars.TURBO_TEAM` is set (`ci.yml:183-184`).
- A defect of any size takes `playbooks/fix.md` with a plan and its acceptance: `playbooks/small.md` step 1 refuses a defect and step 2 refuses a `small/fix-` branch. The book sends "a small, well-bounded fix" to a pull request through the review gate (page 52) and asks only for the failing test first (page 32).
- `playbooks/deploy.md` step 4 promotes to an environment only when a person asks. The book lets the agent deploy freely in development (page 45).

## Proposed outcome

Everything in this section is a proposal, except where it names the book.

An engineer of a generated project learns in minutes whether a change can merge. The full verification runs after the merge and decides the promotion, not the merge.

### The gates

| Gate         | Runs                                                                   | Blocks        |
| :----------- | :--------------------------------------------------------------------- | :------------ |
| Commit       | gitleaks and lint-staged                                               | the commit    |
| Push         | the static checks and the tests related to the change                  | the push      |
| Pull request | the static checks, the tests with coverage, the build, the secret scan | the merge     |
| After merge  | the end-to-end suites                                                  | the promotion |
| Production   | the release manager's approval, as today                               | the deploy    |

The book places "the full test suite" at the commit or the pull request (page 27) and names no end-to-end test. Moving the end-to-end suites after the merge is not in the book.

### Cut

| What is cut                                                  | Why                                                                              |
| :----------------------------------------------------------- | :------------------------------------------------------------------------------- |
| End-to-end tests and the browser install on a pull request   | They run after the merge.                                                        |
| The build and `format:check` in `pre-push`                   | CI builds the same commit; lint-staged and CI cover the format.                  |
| The `commit-msg` hook and commitlint                         | Only the pull request title reaches `main`, and a workflow checks it.            |
| `pr-triage.yml` and `.github/labeler.yml`                    | Nothing reads the labels.                                                        |
| The small jobs of `ci.yml` as separate jobs                  | Each bills a whole minute for seconds of work. Their steps move into fewer jobs. |
| The plan and its acceptance for a small, well-bounded defect | The book, page 52. The failing test committed before the fix stays (page 32).    |

### Kept, and explained

- `control-band`, `claude-fix-loop`, `spec-on-intent-merge`, and the `triage` job: the book asks for each (pages 49 to 50, 38, 16, 45). `SETUP.md` says what `CLAUDE_CI_ENABLED` turns on.
- TruffleHog: it runs with `--results=verified,unknown` (`templates/base/.github/workflows/secret-scan.yml:33-36`), which reports secrets it verified with their provider. gitleaks does not verify.

### Added

- The end-to-end suites run on a push to the default branch, and `playbooks/deploy.md` step 1 stops a promotion while they fail or run.
- `playbooks/build.md`: before it pushes, the agent runs the end-to-end tests of the part it changed. The book asks a session to check its own work before a person sees it (pages 31 to 33).
- A failing after-merge check starts `playbooks/fix.md` without a person asking.
- `SETUP.md` tells the team to set `TURBO_TEAM`.
- `CONTRIBUTING.md`, `README.md`, and the Commands table of `AGENTS.md` of each stack say what each gate runs.

### Out of scope

- A deploy workflow: each team deploys its own way.
- What the production gate requires.
- A generated project's own tests, their speed, and their timeouts.

## Affected users and systems

- People: the engineers of every generated project, and their release manager, whose promotion now waits on the after-merge checks.
- Systems: `templates/<stack>/.github/workflows/ci.yml` of five stacks; `templates/base/.husky/pre-push` and `commit-msg`; `templates/base/.commitlintrc.json`; `templates/base/.github/workflows/pr-triage.yml` and `templates/base/.github/labeler.yml`; the `check` script of each stack's `package.json`; `templates/base/SETUP.md`; `plugins/sdlc/source/skills/sdlc-mode/playbooks/small.md`, `fix.md`, `build.md`, `deploy.md`; `plugins/sdlc/source/scripts/check-plan.ts`; each stack's `AGENTS.md`, `README.md`, `CONTRIBUTING.md`.

## Constraints

- The book is the company's standard. A check the book asks for stays.
- An agent session's token cannot push `.github/workflows/*`, and `.husky/**` is committed by a person.
- `AGENTS.md` convention 3: a change to a `base` file is made in each stack's replacement too.
- A project generated before this change gets it only by copying the files.
- No test is skipped, deleted, or weakened (the book, page 33).

## Open questions

- Whether the end-to-end suites leave the pull request, against page 27 of the book.
- Whether `codeql`, `dependency-review`, `scorecard`, the `image` job, and the weekly run leave the starter. The book names none of them. A public repository runs the first three with no variable.
- Whether patch coverage stays. The book does not mention coverage.
- Whether `playbooks/deploy.md` lets the agent deploy to the development environment after a merge without a person asking (the book, page 45).
- Not read for this intent: the lint-staged file and the jobs of `ci.yml` in the four stacks other than `turborepo`, and the times the generated project measured.
