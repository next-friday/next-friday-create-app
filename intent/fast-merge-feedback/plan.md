# Plan: Fast feedback before merge, full verification after it

Accepted by: @joetakara.

## Files that change

Marked **person** below: a file the spec's area of concern 6 says a person commits, on this branch. The agent gives the engineer its new content as a patch.

Workflows, five stacks (`nestjs`, `nextjs`, `nodejs`, `payload`, `turborepo`):

- `templates/<stack>/.github/workflows/ci.yml` (changed): one job, `All Checks` (id `ci`), replaces `changes`, `agent-checks`, `checks`, `image`, `ci`, and `affected-apps` in `turborepo`. Its steps run in order: detect the changed paths and the verification mode; the agent checks; the static checks, the unit tests with coverage, and the build, when the mode is full; patch coverage with `--fail-under 80` on a pull request; the Playwright install and the end-to-end tests only when `github.event_name == 'push'`; the container image steps (hadolint, build, smoke test, Trivy) when the mode is full or the run is the weekly schedule and `vars.CONTAINER_IMAGE != 'false'`. In `turborepo` the image steps loop over the affected apps in place of the matrix. The job takes the union of the old jobs' `permissions` and `services`. `triage` needs only `ci`, and its condition also accepts `github.event_name == 'push'`; on a push it finds the merged pull request with `gh api repos/$REPOSITORY/commits/$SHA/pulls`, comments there, and ends the comment with `/sdlc-mode fix <name of the failed step>`. The product owner chose one job in the build session (requirement 11 against requirement 12).
- `templates/base/.github/workflows/pr-triage.yml`, `templates/base/.github/labeler.yml` (deleted).
- `plugins/sdlc/source/scripts/changed-documents.ts` (changed), rendered to `templates/base/scripts/changed-documents.ts`: its two messages name the `All Checks` job, where they named `Detect Changes`.

Scripts and hooks:

- `templates/<stack>/package.json` (changed, five stacks): `check` runs `node scripts/run-checks.ts rules:check gates:check plan:check bands:check lint:check sort-package-json:check typecheck knip depcruise test:changed`. No build, no `format:check`. `verify` and `verify:static` do not change. The commitlint packages and script stay.
- `templates/base/.husky/pre-push` (changed, **person**): the document-only path runs `pnpm rules:check && pnpm plan:check`, and its error message loses `pnpm format:check`.
- `templates/base/.agents/hooks/agent-test-edit-gate.sh` (changed, **person**): line 31 reads `[[ $branch == fix/* || $branch == small/fix-* ]] || allow`.
- `templates/base/scripts/check-agent-gates.ts` (changed, **person**): one case, an edit of a committed test on `small/fix-a`, expects a block.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed), rendered to `templates/base/scripts/check-plan.ts`: a `small/fix-` branch of at most five files needs no plan; it is refused when it edits a test the default branch holds, with the message of a `fix/` branch. The self-test row `[false, "small/fix-a", …]` becomes two rows: one that passes, one that edits a held test and fails.

Rules:

- `templates/base/.agents/rules/github-workflows.md` and its rendered copies `templates/base/.claude/rules/github-workflows.md` and `templates/base/.cursor/rules/github-workflows.mdc` (changed, **person**): the example `pr-triage.yml` goes; the sentence keeps the rule on `pull_request_target`.

Playbooks, under `plugins/sdlc/source/skills/sdlc-mode/`, rendered to `plugins/sdlc/adapters/claude-code/`, `.claude/skills/`, and `templates/base/.claude/skills/`:

- `SKILL.md` (changed): the row of `small.md` covers a small defect, as step 1 of the small playbook defines it; the row of `fix.md` covers any other defect.
- `playbooks/small.md` (changed): step 1 drops "It is not a defect" and sends a defect that fails a condition to `fix.md`; step 2 names `small/fix-<short-description>` for a defect; a new step for a defect: reproduce it, commit only the failing test first, then fix it in a later commit that edits no test.
- `playbooks/fix.md` (changed): step 1 sends a defect that meets every condition of `small.md` step 1 to `small.md`; step 10 runs the end-to-end tests of the part it changed before the push.
- `playbooks/build.md` (changed): step 9 runs the end-to-end tests of the part it changed before the push, and says so under **Not yet** when the project has none or the session cannot run them.
- `playbooks/deploy.md` (changed): step 1 names the end-to-end tests among the checks of the commit.

Documents:

- `AGENTS.md` (changed): line 20 tells the agent to run only the check of the files it changed and not to run `pnpm verify` itself, because `pre-push` runs it. `playbooks/small.md` step 4 and `playbooks/fix.md` step 10 (changed) verify as `build.md` step 9 says, in place of running every check. Each stack's `AGENTS.md` says the same above its **Verifying your work** list. The product owner ordered these three in the build session; the spec does not name them.
- `templates/base/SETUP.md` (changed): section 8 says the `triage` job also reports a failed push to the default branch on the merged pull request; section **Deploy** says the team's deploy workflow deploys the development environment on a push to the default branch, and a later environment takes a commit whose run passed.
- `templates/<stack>/README.md`, `CONTRIBUTING.md`, `AGENTS.md` (changed, five stacks): what the commit, the push, the pull request, and the push to the default branch run. `pnpm check` no longer builds; CI runs the end-to-end tests after the merge. The healthy output of `pnpm check` in the Commands table is copied from a generated project.

Evals and release:

- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/fix-reproduces-finds-the-cause-and-waits-for-the-engineer/case.yaml`, `prompt.md`, `scaffold.sh` (changed): the defect fails a condition of `small.md` step 1 (its fix touches six files), so the case still tests `fix.md` and its gate. The graders do not change.
- `.changeset/fast-merge-feedback.md` (new): `minor` for `@next-friday/create-app`.
- `intent/fast-merge-feedback/plan.md` (new). `intent/fast-merge-feedback/intent.md`, `spec.md` (changed): `Status: done.`

## Order of work

1. Create `feat/fast-merge-feedback` from `origin/main`. Commit this plan. Check: `git log -1`.
2. The engineer commits the **person** files from the agent's patch, and pushes them after the agent's first push of step 11: `pre-push` refuses a branch that changes code before it has `Status: done.` and a changeset. Check: `bash -n` passes on the two shell files, and `node scripts/check-agent-gates.ts` passes in a generated project with the patch.
3. Change `check-plan.ts`. Check: `node plugins/sdlc/source/scripts/check-plan.ts` passes its self-tests, and `pnpm lint:check` passes (the file is near the `sonarjs/max-lines` limit).
4. Change `SKILL.md` and the four playbooks. Run `pnpm plugin:sync`. Check: `pnpm plugin:check` and `pnpm rules:check` pass.
5. Change the five `ci.yml` files and delete `pr-triage.yml` and `labeler.yml`. Check: `actionlint` and `zizmor` pass on each file, and `git grep -n -E "pr-triage|labeler" -- templates` finds nothing.
6. Change the five `package.json` `check` scripts. Check: `git grep -n '"check":' -- 'templates/*/package.json'` shows no `build` and no `format:check`.
7. Change `SETUP.md` and the five stacks' `README.md`, `CONTRIBUTING.md`, `AGENTS.md`. Check: `git grep -n -i -E "pull request.*end-to-end|end-to-end.*every pull request|production build \(the .pre-push" -- templates` finds nothing.
8. Change the eval case. Tell the product owner the cost, then run `pnpm evals:run` and `pnpm evals:run:write`. Check: the scores are in the pull request.
9. Write the changeset, and set `Status: done.` in `intent.md` and `spec.md`. Check: `pnpm verify` passes in the root.
10. Generate a project of each stack and run `pnpm verify` and `pnpm check` there; in the stacks with end-to-end tests, also `pnpm test:e2e`. Copy the healthy output of `pnpm check` into each `AGENTS.md`. Check: each exits 0.
11. Run the `verifier` subagent, push, and open the pull request.

## Risks

- The riskiest step is 5. The five `ci.yml` files become one job each, and a mistake there runs too much, too little, or nothing; `zizmor` and `actionlint` catch syntax, not intent. The pull request's own CI does not run the template workflows; the `Template` job in CI checks only that a generated project's `pnpm verify` passes. The proof of the new job is a generated project on GitHub, which this session cannot create.
- One job is slower than parallel jobs: the container image steps now run after the tests in the same job, and a pull request waits for both. The product owner chose this over keeping `image` apart.
- The end-to-end tests stop guarding the merge. A broken flow is first seen after the merge, on `main`.
- `check-plan.ts` is near the lint limit of 1,000 lines; the new self-test row may need another line shortened.
- The session's token may not push a change under `templates/*/.github/workflows/`. If GitHub refuses the push, the engineer commits those five files.
- Step 8 costs money: each case runs three times, with a second arm that has no plugin, about $0.40 a case. The two suites hold 30 cases, about $12.
- Options not taken:
  - Keeping `image` as its own job beside `All Checks`: the product owner chose one job.
  - Adding a new eval case for a small defect: requirement 27 changes the cases that state the old rule and adds none.
  - Folding `triage` into `All Checks`: it must run after the job fails and needs its own permissions.

## Proof

1: the five `ci.yml` files, review of the diff: the end-to-end and Playwright steps carry `if: github.event_name == 'push'`; `nodejs` has neither.
2: the same review: coverage, build, `diff-cover --fail-under 80` on a pull request; `secret-scan.yml` does not change.
3: the same review: a failed end-to-end step on a push fails the one job `All Checks`.
4, 5: `git grep -n '"check":' -- 'templates/*/package.json'`, the diff of `pre-push`, and `pnpm check` in each generated project.
6: `verify` and `verify:static` unchanged in the diff; `pnpm verify` in each generated project.
7, 8, 9: `commit-msg`, `.commitlintrc.json`, `pre-commit`, and the commitlint packages are not in the diff.
10: `git grep -n -E "pr-triage|labeler" -- templates` finds nothing.
11: review of the diff: each `ci.yml` has the jobs `ci` (named `All Checks`) and `triage` only.
12: `codeql.yml`, `dependency-review.yml`, `scorecard.yml` are not in the diff; the image steps and the weekly schedule stay, inside `All Checks`.
13: `control-band.yml`, `claude-fix-loop.yml`, `spec-on-intent-merge.yml` are not in the diff; `triage` stays.
14: the diff of `deploy.md` step 1.
15: review of the `triage` job: its condition, the `commits/<sha>/pulls` call, and the last line of the comment.
16, 23: the diff of `SETUP.md`.
17: the diff of `build.md` step 9 and `fix.md` step 10.
18, 19, 22: the diff of `small.md`, `fix.md` step 1, and `SKILL.md`.
20: the two new self-test rows of `check-plan.ts`; `node plugins/sdlc/source/scripts/check-plan.ts`.
21: the new case of `check-agent-gates.ts`; `pnpm gates:check` in a generated project.
24: the search of step 7, and review of the five stacks' documents.
25: `pnpm plugin:sync`, then `pnpm plugin:check` and `pnpm rules:check`.
26: `pnpm verify` in the root and in a generated project of each stack.
27: the diff of the eval case, and the scores of step 8 in the pull request.
28: `.changeset/fast-merge-feedback.md` holds `minor`; `pnpm verify` runs the changeset check.
