# Spec: Fast feedback before merge, full verification after it

From `intent/fast-merge-feedback/intent.md`. Status: done.

Request: "Write the spec" (translated from Thai), the product owner's order after the merge of the intent's pull request. Skills at `79ddc45`.

The product owner has not answered the intent's open questions. Each one is an area of concern below with a proposed decision, and each requirement that rests on one is marked **Proposal**. The product owner corrects them in review. "The book" is the AI-native SDLC playbook the harness follows, cited by page. A stack is one of `nestjs`, `nextjs`, `nodejs`, `payload`, `turborepo` under `templates/`. Playbook paths are under `plugins/sdlc/source/skills/sdlc-mode/playbooks/`.

## Requirements

The pull request gate:

1. **Proposal.** In each stack's `.github/workflows/ci.yml`, the step that runs `pnpm test:e2e` and the step that installs the Playwright browsers run only on a push to the default branch. A pull request runs neither. `nodejs` has neither step and does not change. Area of concern 1.
2. A pull request still runs the static checks, the tests with coverage, the build, patch coverage at 80, and the secret scan with gitleaks and TruffleHog. Areas of concern 3 and 5.
3. The job `All Checks` of a push to the default branch fails when an end-to-end test fails, as it does today.

The push gate:

4. The `check` script of each stack's `package.json` runs no build. It runs the static checks and `test:changed`.
5. `templates/base/.husky/pre-push` runs no `format:check`, on the path for a push that changes only documents and on the path that runs `pnpm check`. The `check` script runs the checks of `verify:static` other than `format:check`.
6. `pnpm verify` and CI run what they run today, `format:check` and the build included.

The commit gate:

7. `templates/base/.husky/commit-msg`, `templates/base/.commitlintrc.json`, and the commitlint packages and script of each stack's `package.json` stay as they are. commitlint is a company rule, the product owner's decision.
8. The `commit-msg` hook runs commitlint on every commit, as today.
9. The `pre-commit` hook runs gitleaks and lint-staged, as today.

Workflows and jobs:

10. `templates/base/.github/workflows/pr-triage.yml` and `templates/base/.github/labeler.yml` are deleted, and no file under `templates/` names them.
11. In each stack's `ci.yml`, the steps of `Detect Changes`, of `Detect Affected Apps` in `turborepo`, and of `All Checks` run inside the jobs that need their result, so a pull request starts fewer jobs than today. The name `All Checks` stays the name of the one check a ruleset requires, because `SETUP.md` tells a team to require it.
12. **Proposal.** `codeql.yml`, `dependency-review.yml`, `scorecard.yml`, the `image` job, and the weekly schedule stay as they are. Area of concern 2.
13. `control-band.yml`, `claude-fix-loop.yml`, `spec-on-intent-merge.yml`, and the `triage` job stay.

After the merge:

14. `deploy.md` step 1 names the end-to-end tests among the checks of the commit: a promotion stops while they fail or run. Its wording on a failed or running check does not change.
15. **Proposal.** When `CLAUDE_CI_ENABLED` is `true` and the run of a push to the default branch fails, the `triage` job runs and writes its summary as a comment on the pull request whose merge made that commit. The comment ends with the message that starts the fix: `/sdlc-mode fix` and the failing check's name. Area of concern 7.
16. **Proposal.** `templates/base/SETUP.md`, section **Deploy**, says that the team's deploy workflow deploys the development environment on a push to the default branch, and that a later environment takes a commit whose run passed. `deploy.md` step 4 does not change. Area of concern 4.

The session's own check:

17. `build.md` step 9 and `fix.md` say: before it pushes, the agent runs the end-to-end tests that cover the part it changed and keeps the output. When the project has no end-to-end test, or the session cannot run them, the reply says so under **Not yet**.

A small defect:

18. `small.md` step 1 accepts a defect that meets every other condition of that step, and step 2 names its branch `small/fix-<short-description>`. The change has no plan and no acceptance of a plan.
19. On a `small/fix-` branch, the first commit holds only the test that fails for the defect, and the fix follows in a later commit that edits no test. `small.md` says so, and `fix.md` step 1 sends such a defect to `small.md`.
20. `plugins/sdlc/source/scripts/check-plan.ts` lets a `small/fix-` branch through with no plan while it changes at most five files, and refuses one that edits a test the default branch holds, as it refuses that on a `fix/` branch. Its self-tests gain a case that passes and a case that fails.
21. `templates/base/.agents/hooks/agent-test-edit-gate.sh` blocks a test edit on a `small/fix-` branch once a test is committed, as on a `fix/` branch, and `scripts/check-agent-gates.ts` gains a case for it. Area of concern 6.
22. A defect that fails a condition of `small.md` step 1 takes `fix.md` with its plan, as today.

Documents:

23. `templates/base/SETUP.md` says what each of `CLAUDE_CI_ENABLED` and `CODE_SCANNING` turns on, as it does today at lines 101 and 147, and gains the `triage` job on a push.
24. Each stack's `README.md`, `CONTRIBUTING.md`, and the Commands table of `AGENTS.md` say what the commit, the push, the pull request, and the push to the default branch each run. None still says that a pull request runs the end-to-end tests or that `pre-push` builds.

Delivery:

25. `pnpm plugin:sync` renders each changed playbook and script into `plugins/sdlc/adapters/` and `templates/base/`, and `pnpm plugin:check` and `pnpm rules:check` pass.
26. `pnpm verify` passes in the root and in a generated project of each stack of `src/stacks.ts`.
27. The eval cases that state the old rule of `small.md` or `fix.md` on a small defect change to requirements 18 to 22. `pnpm evals:run` and `pnpm evals:run:write` are run and their scores reported, as `AGENTS.md` says for a change to a skill. The cost is told to the product owner before they run.
28. The change has one changeset for `@next-friday/create-app`. **Proposal:** `minor`, because a generated project's gates change and no CLI argument, prompt, or stack name does. The package is at `10.3.0`; merging the release pull request that follows publishes `10.4.0` to npm.

## Design

**Proposal:** the change is higher risk. It moves a test gate from before the merge to after it in every generated project, and it takes the build and `format:check` out of `pre-push`. The product owner consults a tech lead before the merge, as `design.md` step 5 says.

- `templates/<stack>/.github/workflows/ci.yml`, four stacks with end-to-end steps: each of those steps gains `if: github.event_name == 'push'`. A push to the default branch already runs the job `checks` when the commit changes code (`templates/nestjs/.github/workflows/ci.yml:55-58`), so no new workflow is needed. All five stacks: the jobs fold as requirement 11 says, and the `triage` job's condition also accepts a failed push (requirement 15).
- `templates/<stack>/package.json`: the `check` script (line 16) drops `build` and names the static checks without `format:check`.
- `templates/base/.husky/pre-push`: the document-only path runs `pnpm rules:check && pnpm plan:check`.
- `templates/base/.github/workflows/pr-triage.yml`, `templates/base/.github/labeler.yml`: deleted.
- `templates/<stack>/.github/workflows/ci.yml`: `diff-cover` runs with `--fail-under 80`, where it has `--fail-under 95`.
- `small.md`, `fix.md`, `build.md`, `deploy.md`: requirements 14 and 17 to 19. `review.md` does not change.
- `plugins/sdlc/source/scripts/check-plan.ts`: requirement 20. Today line 1019 holds the self-test that refuses `small/fix-a`.
- `templates/base/.agents/hooks/agent-test-edit-gate.sh` line 31 and `scripts/check-agent-gates.ts`: requirement 21.
- `templates/base/SETUP.md`, each stack's `README.md` and `CONTRIBUTING.md`: requirements 16, 23, and 24. `templates/turborepo/README.md:47` already tells the team to set `TURBO_TEAM`, so the intent's item on that is met and nothing is added.
- `.changeset/<name>.md`: requirement 28.

`AGENTS.md` convention 3 applies: `turborepo` replaces `base` files, so each change to a `base` file is checked against that stack's replacement.

The root of this repository keeps its own hooks and workflows. This spec changes `templates/` and the plugin only.

## Policies

- Brand: Does not apply. The change shows a user no text, colour, typeface, logo, or message.
- Security: rule 6, secrets stay out of the repository. Requirements 2 and 9 keep the secret scan at the commit and on the pull request, with both scanners. The change touches no chapter of the standard: it changes when checks run and no code of an application.
- Compliance: Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- UX: Does not apply. The change has no user interface.

## Areas of concern

1. No policy; the intent's constraint "A check the book asks for stays". The book places "the full test suite" at the commit or the pull request (page 27) and names no end-to-end test. Requirement 1 moves the end-to-end tests after the merge.

   Decision: the end-to-end tests run after the merge, as the company's exception to page 27. The unit tests with coverage stay on the pull request, and requirement 17 has the session run the end-to-end tests of the part it changed before it pushes, which pages 31 to 33 ask for.

2. No policy; open question 2 of the intent. The book names none of CodeQL, dependency review, Scorecard, the container image job, or a weekly run.

   Decision: all stay. In a private repository the first three do nothing until `CODE_SCANNING` is set, and a public repository runs them. Removing them from the starter removes them from every project that uses them.

3. No policy. The book does not mention coverage, and no file gives a source for the 95 that `diff-cover` requires.

   Decision: patch coverage stays on the pull request and fails under 80. The product owner's decision.

4. No policy; open question 3 of the intent. The book lets the agent deploy freely in development (page 45). The starter ships no deploy workflow, and after a merge no session is running to deploy.

   Decision: the team's deploy workflow deploys the development environment on a push to the default branch, as a script with no model, and `SETUP.md` says so. `deploy.md` step 4 keeps asking for a person's word before an agent promotes.

5. Security rule 6. gitleaks and TruffleHog scan the same commits, and only TruffleHog verifies a found secret with its provider (`templates/base/.github/workflows/secret-scan.yml:33-36`).

   Decision: TruffleHog stays. The product owner's decision.

6. No policy. Requirements 5 and 21 change files that a person commits, by the project's own rule: `.husky/**`, `.agents/hooks/**`, and `scripts/check-agent-gates.ts`. An agent session's token also cannot push a file under `.github/workflows/`.

   Decision: the build's plan lists those files with their new content, and a person commits them on the pull request's branch.

7. No policy. The intent says that a failing after-merge check starts `playbooks/fix.md` without a person asking. `fix.md` stops for the engineer's acceptance of a plan, and no job today runs on a failed push.

   Decision: the `triage` job reports the failure on the merged pull request with the message that starts the fix, and a person sends it. No agent writes code that nobody asked for.

8. No policy. Requirement 4 removes the build from `pre-push`, so a change that breaks the build is first seen in CI.

   Decision: accepted. CI builds every pull request, and `pnpm verify` still builds for a session that checks its own work.

## Open questions

1. Whether the end-to-end suites leave the pull request: area of concern 1.
2. Whether the scanners, the `image` job, and the weekly run leave the starter: area of concern 2.
3. Whether the agent deploys to the development environment: area of concern 4.
4. The files the intent did not read are read now. Each stack has its own `.lintstagedrc.json`. `nestjs`, `nextjs`, `nodejs`, and `payload` each have six jobs in `ci.yml` (`changes`, `agent-checks`, `checks`, `image`, `triage`, `ci`), and `turborepo` has those and `affected-apps`. The times the generated project measured were not read; no requirement rests on them.
5. Carried forward: how many fewer jobs requirement 11 gives. The plan counts them for each stack.
