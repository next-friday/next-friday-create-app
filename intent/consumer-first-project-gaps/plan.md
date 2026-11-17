# Plan: Close the gaps a consumer hit creating its first project

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/scripts/check-plan.ts` (changed): skips the no-plan rule while `origin/<default>:package.json` does not exist (requirement 5). A branch that adds `intent.md` or `spec.md` must write `accepted` or `rejected` there; an edit to a merged file may write `rejected`, `done`, `withdrawn`, or `replaced`; the refusal of `accepted` off the default branch goes (requirement 16). Its self-tests cover each case. `pnpm plugin:sync` renders it to `templates/base/scripts/check-plan.ts`, which every template's `plan:check` runs.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/open-pr.md` (changed): after the push, reads `GET /repos/{owner}/{repo}/rules/branches/{branch}` and reports one of the three cases of requirement 1. It checks for a workflow run on the head and says on **Not yet** when none ran (requirement 3). On a `workflow`-scope refusal, it stops before the pull request opens (requirement 4).
- `playbooks/review.md` (changed): step 6 reports the gate that `open-pr.md` found (requirement 2).
- `playbooks/plan.md`, `playbooks/design.md`, `playbooks/build.md` (changed): the templates write `Status: accepted.`; the steps that set the previous file's status go; rejection is a `Status: rejected.` commit before or after the merge (requirement 16). `design.md` step 5: the product owner gives each `Decision:` in the chat or on the pull request, and the agent writes it (requirement 10).
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): reply examples follow the three cases of requirement 1. Adds the reply rules of requirement 10 and the **Now** rule of requirement 11.
- `plugins/sdlc/source/hooks/check-reply-shape.cases.json` (changed): a reply whose **Now** line says nothing new is needed passes (requirement 11).
- `intent/README.md` (changed): lines 6 to 9 follow requirement 16. `templates/base/intent/README.md` needs no change: it holds only the `done` rule.
- `templates/{nodejs,nestjs,nextjs,payload,turborepo}/package.json` (changed): `format:check` runs Prettier only; the `editorconfig-checker` devDependency goes (requirement 6).
- `templates/{nodejs,nestjs,nextjs,payload,turborepo}/.github/workflows/ci.yml` (changed): a step downloads a pinned `editorconfig-checker` release, checks its SHA-256, and runs it, as the hadolint step does (requirement 6). The release is `v4.0.2`, the version the root `CONTRIBUTING.md` pins; the SHA-256 comes from that release's published checksum, or is computed from the downloaded asset and recorded with the release URL. The `GITHUB_TOKEN` line and its comment on the `format:check` step go, because nothing downloads there any more. `templates/payload/.editorconfig-checker.json` and `templates/turborepo/.editorconfig-checker.json` stay, because the CI step reads them.
- `templates/{nodejs,nestjs,nextjs,payload,turborepo}/AGENTS.md` and `CONTRIBUTING.md` (changed): one line on `<type>(<scope>): <subject>`, with a required lowercase scope and a subject of at most 50 characters (requirement 7). `CONTRIBUTING.md` drops the `editorconfig-checker` mention from `format:check` where it has one.
- `templates/base/SETUP.md` (changed): step 1 covers a repository that already has a README (requirement 5). Each step that needs a paid plan is marked, with the free alternative next to it (requirement 13).
- `templates/turborepo/knip.json`, `eslint.config.ts`, `prettier.config.ts`, `.github/dependabot.yml`, `.github/workflows/ci.yml`, `package.json` (changed): name apps through `apps/*` where the tool accepts a glob (requirement 8).
- `templates/turborepo/README.md` (changed): "Add a Next.js app" with `turbo gen workspace --copy`, and "Remove the backoffice" (requirement 8).
- `test/stacks.test.ts` (changed): checks that the `turborepo` root files a copied app would touch name apps only through `apps/*` (requirement 8). The repository's testing rule extends the file that already owns the stack contract instead of adding one.
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/writes-spec-from-merged-intent/` and `drafts-intent-and-waits-for-yes/` (changed): prompts and graders name the exact paths (requirement 9).
- `.../build-continues-from-an-accepted-plan/` (deleted): the eval sandbox keeps the workspace's `.git` read-only, so `git checkout -b` fails with "cannot lock ref" even with a remote or a separate Git directory set up by the scaffold, and the case cannot pass (requirement 9, area of concern 4). `writes-spec-from-merged-intent` and `maintain-writes-intent-from-a-finding` (changed): each keeps its other graders and drops only the grader that needs a pushed branch, because the rest of each case passes. `spec-for-unmerged-intent-stops/scaffold.sh` follows requirement 16.
- `plugins/sdlc/adapters/**` and `templates/base/plugins/sdlc/**` (changed): rendered by `pnpm plugin:sync` and `pnpm rules:sync`.
- `.changeset/consumer-first-project-gaps.md` (new): `minor` for `@next-friday/create-app` (requirement 15).
- `intent/consumer-first-project-gaps/plan.md` (new) and `spec.md` (changed): the first commit adds this plan and sets the spec to `Status: accepted.`; `Status: done.` in `intent.md` and `spec.md` when the last requirement is met.

## Order of work

1. `check-plan.ts` and its self-tests (requirements 5, 16). Check: `node plugins/sdlc/source/scripts/check-plan.ts` passes, with the new self-tests.
2. Playbooks, `SKILL.md`, `intent/README.md`, and the reply-shape cases (requirements 1–4, 10, 11, 16). Check: `pnpm plugin:sync`, then `pnpm plugin:check`, the reply-shape cases, and `pnpm plan:check` in a generated project pass.
3. Templates (requirements 6, 7, 8, 13, 5's `SETUP.md` part) and the test in `test/stacks.test.ts`. Before writing it, read `turbo gen workspace` in the installed Turborepo `docs/reference/generate.mdx`. Check: `pnpm vitest run test/stacks.test.ts` passes, and `zizmor --offline` on each changed `ci.yml` reports the same findings as on `main`.
4. Evals (requirement 9). These need the engineer's own Claude login, as `AGENTS.md` says. Check: `pnpm evals:run` and `pnpm evals:run:write` report scores; the two named cases pass three runs in a row.
5. Changeset, and tell the user it publishes `@next-friday/create-app` 9.14.0; then `pnpm verify` at the root and in a generated project of each of the five stacks. Check: every run exits 0.

## Risks

- Riskiest: step 1, because `plan:check` gates every push in this repository and in every generated project; a wrong inversion lets an unaccepted plan through. The self-tests cover each status case before anything else changes.
- Moving `editorconfig-checker` to CI means a local `pnpm verify` no longer catches an `.editorconfig` violation; CI does (area of concern 3).
- An eval case may still fail to write Git in the sandbox; it is then deleted and listed in the pull request (area of concern 4).
- The root repository keeps `editorconfig-checker` in its own `package.json`, `CONTRIBUTING.md`, and workflows: requirement 6 covers generated projects only.
- Requirement 14 is not run in this session, which cannot create a repository. The pull request says so, and an engineer runs it after the merge.
- Not taken: a new Next.js-only stack (area 2); a workflow that commits the status after the merge (area 7); a CLI push (open question 4); a setup step that switches gates on (area 5).

## Proof

- 1: `open-pr.md` names the endpoint and the three cases; reviewed against the live answers for a private generated project (403) and this repository (`required_approving_review_count: 0`).
- 2: `grep -rn "waits for a code owner" plugins/sdlc/source` finds it only under the **Review required** case.
- 3: `grep -n "no CI ran" plugins/sdlc/source/skills/sdlc-mode/playbooks/open-pr.md` finds the **Not yet** rule.
- 4: `grep -n "workflow" plugins/sdlc/source/skills/sdlc-mode/playbooks/open-pr.md` finds the stop and the two ways out.
- 5: `check-plan.ts` self-test for a remote default branch with no `package.json`; `SETUP.md` step 1 text.
- 6: `pnpm verify` in a generated project of each stack runs no `editorconfig-checker`; each `ci.yml` runs it with a checksum.
- 7: `grep` finds the commit format line in each stack's `AGENTS.md` and `CONTRIBUTING.md`.
- 8: the `apps/*` test in `test/stacks.test.ts`.
- 9: three runs of each named eval case; the branch case is deleted and the push graders dropped, as Files says.
- 10: `grep` finds each of the seven rules in `SKILL.md`.
- 11: the new `check-reply-shape.cases.json` case passes.
- 12: no hook changes; `pnpm gates:check` passes.
- 13: `grep -n "paid" templates/base/SETUP.md` finds a mark and a free alternative on each paid step.
- 14: not run in this session; stated in the pull request.
- 15: `pnpm changesets:check` passes with one `minor` changeset; the user was told 9.14.0 before the pull request opened.
- 16: `check-plan.ts` self-tests for `accepted`, `rejected`, and `done`; `grep -rn "Status: draft" plugins/sdlc/source/skills/sdlc-mode/playbooks plugins/sdlc/adapters/claude-code/evals` finds nothing.
- Policies: brand, compliance, and UX do not apply; security rule 6 is a review step on requirements 4 and 6 (no token in output; checksum pinned).
