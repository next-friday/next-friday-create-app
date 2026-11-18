# Plan: Fast feedback before merge, full verification after it

Accepted by: @joetakara.

## Files that change

Marked **person** below: a file the spec's area of concern 6 says a person commits, on this branch. The agent gives the engineer its new content as a patch.

Workflows, five stacks (`nestjs`, `nextjs`, `nodejs`, `payload`, `turborepo`):

- `templates/<stack>/.github/workflows/ci.yml` (changed): one job, `All Checks` (id `ci`), replaces `changes`, `agent-checks`, `checks`, `image`, `ci`, and `affected-apps` in `turborepo`. Its steps run in order: detect the changed paths and the verification mode; the agent checks; the static checks, the unit tests with coverage, and the build, when the mode is full; patch coverage with `--fail-under 80` on a pull request; the Playwright install and the end-to-end tests, when the mode is full; the container image steps (hadolint, build, smoke test, Trivy) when the mode is full or the run is the weekly schedule and `vars.CONTAINER_IMAGE != 'false'`. In `turborepo` the image steps loop over the affected apps in place of the matrix. The job takes the union of the old jobs' `permissions` and `services`. `triage` needs only `ci`; its condition and its comment do not change. The product owner chose one job in the build session (requirement 11 against requirement 12).
- `templates/base/.github/workflows/pr-triage.yml`, `templates/base/.github/labeler.yml` (deleted).
- `plugins/sdlc/source/scripts/changed-documents.ts` (changed), rendered to `templates/base/scripts/changed-documents.ts`: its two messages name the `All Checks` job, where they named `Detect Changes`.

Scripts and hooks:

- `templates/<stack>/package.json` (changed, five stacks): `check` runs `node scripts/run-checks.ts rules:check gates:check plan:check bands:check lint:check sort-package-json:check typecheck knip depcruise test:changed`. No build, no `format:check`. `verify` and `verify:static` do not change. The commitlint packages and script stay.
- `templates/base/.husky/pre-push` (changed, **person**): the document-only path runs `pnpm rules:check && pnpm plan:check`, and its error message loses `pnpm format:check`.
- `templates/base/.agents/hooks/agent-test-edit-gate.sh`, `templates/base/scripts/check-agent-gates.ts` (**person**): the build first gave a `small/fix-` branch the rule of a `fix/` branch, and the engineer committed it in `9b519cc`; with `small.md` gone, the engineer's second commit takes it out again.
- `plugins/sdlc/source/hooks/check-push.sh`, `check-push.cases.json`, their rendered copies, their entries in `plugins/sdlc/adapters/hooks.json`, and the paragraph of `plugins/sdlc/README.md` (deleted, **person**): with the hook's entries in `.claude/settings.json` and `.cursor/hooks.json` of the root and of `templates/base`, in one commit, because `pnpm plugin:check` refuses a settings file that names a hook the harness lacks, and a hook the settings lack.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed), rendered to `templates/base/scripts/check-plan.ts`: `findUnplannedChangeProblems`, which asked a plan of every branch that changes code, gives way to `findLoopPlanProblems`, which asks it only of a branch that also changes an `intent.md` or a `spec.md`. Its four self-tests cover both. The rule on a fix that edits a test the default branch holds stays.

Rules:

- `templates/base/.agents/rules/github-workflows.md` and its rendered copies `templates/base/.claude/rules/github-workflows.md` and `templates/base/.cursor/rules/github-workflows.mdc` (changed, **person**): the example `pr-triage.yml` goes; the sentence keeps the rule on `pull_request_target`.

Playbooks, under `plugins/sdlc/source/skills/sdlc-mode/`, rendered to `plugins/sdlc/adapters/claude-code/`, `.claude/skills/`, and `templates/base/.claude/skills/`:

- `SKILL.md` (changed): the row of `small.md` goes. `skills/sdlc-help/SKILL.md` (changed): the topic of a small change goes.
- `playbooks/small.md` (deleted).
- `playbooks/fix.md` (changed): step 10 runs the end-to-end tests of the part it changed before the push.
- `playbooks/build.md` (changed): step 9 runs the end-to-end tests of the part it changed before the push, and says so under **Not yet** when the project has none or the session cannot run them.
- `playbooks/review.md` step 5 and `SKILL.md` (changed), and the eval case `merged-with-a-run-in-progress-is-not-done` (renamed to `merged-with-a-run-on-main-in-progress-is-done`): a merged pull request whose checks passed is done, and a run still in progress on the default branch goes on the **Not yet** line.

Documents:

- `templates/base/SETUP.md` (changed): the sentence on a `small/` branch goes. Its sections on the `triage` job and on **Deploy** do not change.
- `templates/<stack>/README.md`, `CONTRIBUTING.md`, `AGENTS.md` (changed, five stacks): `AGENTS.md` drops `pnpm format:check` from the document-only path of `pre-push`, as the engineer's commit of that hook did. They say what the commit, the push, the pull request, and the push to the default branch run. `pnpm check` no longer builds; CI runs the end-to-end tests on the pull request, as before. The healthy output of `pnpm check` in the Commands table is copied from a generated project.

Evals and release:

- `AGENTS.md` and each stack's `AGENTS.md` (changed): `/sdlc-mode` starts the SDLC loop only when a person types it. `templates/base/SETUP.md` (changed): the sentence on a `small/` branch goes.
- The eval case `fix-reproduces-finds-the-cause-and-waits-for-the-engineer` does not change: the build first moved its defect into six files, and took that out again with `small.md`.
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
8. Change the eval case. Check: `pnpm plugin:check` passes. The product owner was told the cost of `pnpm evals:run` and `pnpm evals:run:write` and decided not to run them, so requirement 27 is met in part.
9. Write the changeset, and set `Status: done.` in `intent.md` and `spec.md`. Check: `pnpm verify` passes in the root.
10. Generate a project of each stack and run `pnpm verify` and `pnpm check` there; in the stacks with end-to-end tests, also `pnpm test:e2e`. Copy the healthy output of `pnpm check` into each `AGENTS.md`. Check: each exits 0.
11. Run the `verifier` subagent, push, and open the pull request.

## Risks

- The riskiest step is 5. The five `ci.yml` files become one job each, and a mistake there runs too much, too little, or nothing; `zizmor` and `actionlint` catch syntax, not intent. The pull request's own CI does not run the template workflows; the `Template` job in CI checks only that a generated project's `pnpm verify` passes. The proof of the new job is a generated project on GitHub, which this session cannot create.
- One job is slower than parallel jobs: the container image steps now run after the tests in the same job, and a pull request waits for both. The product owner chose this over keeping `image` apart.
- The first build moved the end-to-end tests behind the merge. The product owner then kept them on the pull request, as the book's page 27 says, so the slowest step of a pull request stays as slow as it was. The one job, the lighter `pre-push`, and patch coverage at 80 are what this change gains.
- `check-plan.ts` is near the lint limit of 1,000 lines; the new self-test row may need another line shortened.
- The session's token may not push a change under `templates/*/.github/workflows/`. If GitHub refuses the push, the engineer commits those five files.
- The evals did not run: each case runs three times, with a second arm that has no plugin, about $0.40 a case, and the two suites hold 30 cases, about $12. The product owner decided not to run them. No score shows how the changed playbooks behave.
- Options not taken:
  - Keeping `image` as its own job beside `All Checks`: the product owner chose one job.
  - Keeping `small.md` for a small defect: the product owner removed it in the build session, with the rule that every code branch needs a plan.
  - Folding `triage` into `All Checks`: it must run after the job fails and needs its own permissions.

## Proof

1: the five `ci.yml` files, review of the diff: the end-to-end and Playwright steps run when the mode is full, on a pull request and on a push; `nodejs` has neither.
2: the same review: coverage, build, `diff-cover --fail-under 80` on a pull request; `secret-scan.yml` does not change.
3: the same review: a failed end-to-end step fails the one job `All Checks`.
4, 5: `git grep -n '"check":' -- 'templates/*/package.json'`, the diff of `pre-push`, and `pnpm check` in each generated project.
6: `verify` and `verify:static` unchanged in the diff; `pnpm verify` in each generated project.
7, 8, 9: `commit-msg`, `.commitlintrc.json`, `pre-commit`, and the commitlint packages are not in the diff.
10: `git grep -n -E "pr-triage|labeler" -- templates` finds nothing.
11: review of the diff: each `ci.yml` has the jobs `ci` (named `All Checks`) and `triage` only.
12: `codeql.yml`, `dependency-review.yml`, `scorecard.yml` are not in the diff; the image steps and the weekly schedule stay, inside `All Checks`.
13: `control-band.yml`, `claude-fix-loop.yml`, `spec-on-intent-merge.yml` are not in the diff; `triage` stays.
14: `deploy.md` is not in the diff.
15: review of the `triage` job: its condition and its last step match the default branch's.
16, 23: the diff of `SETUP.md`.
17: the diff of `build.md` step 9 and `fix.md` step 10.
18, 19, 22: `git ls-files` lists no `small.md`; the diff of `SKILL.md`, `sdlc-help`, `fix.md` step 1, and the `AGENTS.md` files.
20: the four self-tests of `findLoopPlanProblems`; `node plugins/sdlc/source/scripts/check-plan.ts`.
21: `git grep check-push` outside `intent/` and `CHANGELOG.md` finds nothing after the engineer's commit; `pnpm plugin:check` passes.
24: the search of step 7, and review of the five stacks' documents.
25: `pnpm plugin:sync`, then `pnpm plugin:check` and `pnpm rules:check`.
26: `pnpm verify` in the root and in a generated project of each stack.
27: the diff of the eval case. The suites did not run, by the product owner's decision.
28: `.changeset/fast-merge-feedback.md` holds `minor`; `pnpm verify` runs the changeset check.
29: the diff of `review.md` step 5 and `SKILL.md`, and the eval case's graders. The case did not run.
