# Plan: Make an sdlc-mode session follow its playbook and claim only what it proved

Accepted by: @joetakara.

## Files that change

Three agents work at once, each in its own worktree, each on files the others do not touch. The work goes in one pull request, as `playbooks/build.md` step 7 says. This departs from the spec's three pull requests, by the engineer's decision.

Pile 1, playbook text (requirements 1 to 4, 6 to 10, 16 to 24, 26 to 32, 34, 37, 40):

- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): steps 3, 4, and 6 and the reply rules say what the spec requires on waiting, files, questions, `Done.`, **Request**, and **Steps**.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/intent.md`, `design.md`, `build.md`, `open-pr.md`, and `review.md` (changed): the steps the spec names.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md` (changed): steps 2 and 3 point at `SKILL.md` step 6 in place of "one question at a time".
- `plugins/sdlc/source/agents/verifier.md` (changed): the verifier runs the app and runs no check its brief lists.
- `plugins/sdlc/source/skills/setup-sdlc/SKILL.md` (changed): a fourth role, `review`.
- `plugins/sdlc/adapters/tool-words.json` (changed): a wait line and a plan-mode line for each tool; the `question-tool` line goes.
- `plugins/sdlc/adapters/claude-code/evals/` (new cases, script graders only) for requirements 1, 2, 16, 17, 27, and 28. No case is run.

Pile 2, hooks and scripts (requirements 5, 11, 12, 14, 15, 25):

- `plugins/sdlc/source/scripts/run-checks.ts` (new): runs the steps of `verify` and `check`, and prints one line for each step with its result and whether Turborepo's cache answered.
- `plugins/sdlc/source/scripts/changed-documents.ts` (new): reads the one rule on which changes are documents, and says whether a set of changed files holds only documents.
- `scripts/sync-plugin.ts` (changed): renders the two new scripts into `templates/base/scripts/`.
- `templates/base/.husky/pre-push` and `templates/base/.husky/pre-commit` (changed): the push runs by what changed, and scopes Turborepo to the affected apps; `rules:check` leaves `pre-commit`.
- `templates/base/.claude/settings.json` (changed): `env.CLAUDE_CODE_FORK_SUBAGENT` is `"0"`.
- `templates/base/SETUP.md` (changed): says what that setting does and how a person removes it.
- `package.json` of the root and of each stack (changed): `verify` and `check` call the runner.
- `knip.json` of the root and of each stack (changed only when Knip reports the new scripts).
- `plugins/sdlc/source/hooks/check-reply-shape.cases.json` (changed): the case of requirement 25.
- `.github/file-filters.yml` and `templates/base/.github/file-filters.yml` (changed only when the rule gains a key).
- A person commits `.husky/pre-push` and `.claude/settings.json` of the root, and any file under `.github/workflows/`. The agent hands over each file's whole new text.

Pile 3, the `turborepo` stack and the stacks' documents (requirements 10 for `AGENTS.md`, 13 for `AGENTS.md`, 33, 35, 36):

- `templates/turborepo/package.json` (changed): `dev` and `start` pass their own `--concurrency`, so a fourth app starts.
- `test/turborepo-template.test.ts` (changed): checks the `--concurrency` of the `dev` and `start` scripts against the number of apps.
- `templates/turborepo/README.md` (changed): names every root file that adding an app changes, and which of them a person commits.
- `templates/turborepo/AGENTS.md` (changed): no task counts; the `--affected` form; the agent's narrow checks.
- `AGENTS.md` of the other four stacks (changed): the agent's narrow checks in "Verifying your work".
- `CONTRIBUTING.md` of each stack (changed): the form of a branch name.

After the three piles, in one session: the rendered copies under `plugins/sdlc/adapters/`, `.claude/skills/`, and `templates/base/` (changed by `pnpm plugin:sync`), `.changeset/session-conformance.md` (new, `patch`), `intent/sdlc-session-conformance/intent.md` and `spec.md` (`Status: done.`), and this plan.

## Order of work

1. Find three facts before any edit. Check: each is written here.
   - `"concurrency"` in `templates/turborepo/turbo.json` came with `intent/ci/`, whose spec asks for "a `--concurrency` that fits the runner's memory" and whose plan calls it "a starting value for a two-core runner". The value has a reason, so it stays, and the `dev` and `start` scripts pass their own.
   - All five stacks define `check` as `pnpm verify:static && pnpm test:changed && pnpm build` and `verify:static` as the same ten steps. `verify` adds `test:coverage` and `build`, and `nestjs` adds `test:e2e`.
   - In this repository, `eslint --fix` on one `.ts` file took 5.3 seconds cold and 2.1 seconds with its cache, and `prettier --write` took 0.2 seconds. The slow part of the edit hook is ESLint. The spec changes nothing in that hook.
2. Start the three agents, each in a worktree from the build branch, each with its pile, the spec, and this plan. Each is started so that its report returns in one call; the session does not poll, sleep, or message them. Check: three reports.
3. Read each agent's diff against the spec, requirement by requirement. Send a pile back once with what is wrong. Check: each requirement of the pile has its line in the diff.
4. Bring the three worktrees' changes onto the build branch. Check: `git status` shows no conflict, and no file is changed by two piles.
5. Run `pnpm plugin:sync` and `pnpm rules:sync`. Check: `pnpm plugin:check` passes.
6. Generate a project of each stack and run its `pnpm verify`; in the `turborepo` project add a fourth app with the README's recipe and run `pnpm dev`. Check: exit 0 in each, and four apps answer.
7. Hand the person the whole new text of each file a person commits, and stop until they are on the branch. Check: the files are in `git log`.
8. Push once. Check: the `pre-push` output, quoted in the pull request.
9. Open the pull request and review it once, with a reviewer on `sonnet` at `high`, started so that its report returns in one call. Check: one comment with the findings.

## Risks

- **The riskiest step is 4.** If two piles touch one file, the changes conflict. The piles are split by file, and each stack's `AGENTS.md` belongs to pile 3 alone.
- **The push hook can let a broken push through** if the document rule is wrong. The hook cases of requirement 11 cover a push of code, of documents, and of both.
- **The runner changes what `pnpm verify` prints**, and `AGENTS.md` quotes its healthy output. Pile 3 describes the last line without quoting counts, and step 3 checks the text against the runner's real output.
- **The session that builds runs on the harness as it is today.** Steps 2 and 9 say how it waits.
- **Rendered copies.** The push hook refuses a file this plan does not name. The plan is changed in the same commit when `pnpm plugin:sync` writes a path it does not list.
- Not taken: three sessions by the spec's parts A, B, and C, because the parts share `SKILL.md`, `build.md`, and `review.md`.
- Not taken: three pull requests, because the three piles pass `pnpm verify` only together.
- Not taken: removing `"concurrency"` from `turbo.json`, because step 1 found its reason.
- Not taken: an eval run, by the product owner's order.

## Proof

1, 2, 3, 4: read `SKILL.md` step 4 and `tool-words.json` in the diff; `pnpm plugin:check`.
5: `templates/base/.claude/settings.json` in the diff; the root file in `git log`, committed by a person.
6, 7, 8, 9, 10: read `verifier.md`, `review.md`, `setup-sdlc/SKILL.md`, `open-pr.md`, and `build.md` in the diff.
11, 12, 14: self-tests of `changed-documents.ts` for a push of code, of documents, and of both; `pre-push` and `pre-commit` in the diff.
13: in a generated `turborepo` project, `TURBO_FILTER=--affected pnpm check` with one app changed runs that app's tasks only.
15: the last lines of `pnpm verify` in the root and in a generated project of each stack.
16, 17, 18, 19, 20, 21, 22, 23, 24, 26: read `SKILL.md` and the playbooks in the diff.
25: the new case in `check-reply-shape.cases.json`; `pnpm plugin:check`.
27, 28, 29, 30, 31, 32, 34, 37: read `intent.md`, `design.md`, `build.md`, and `review.md` in the diff.
33, 36: read each stack's `CONTRIBUTING.md` and `templates/turborepo/AGENTS.md` in the diff.
35: step 6, four apps answer under `pnpm dev`.
38: `pnpm plugin:sync`, then `pnpm plugin:check`.
39: `pnpm verify` in the root and in a generated project of each stack.
40: no new case under `evals/` holds `type: llm`.
41: `.changeset/session-conformance.md` exists, with the type `patch`.
