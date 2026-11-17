# Plan: The harness enforces nothing the book does not say about a record

Accepted by: @joetakara.

## Files that change

No file below is denied to the agent.

- `plugins/sdlc/source/scripts/check-records.ts` (deleted).
- `templates/base/scripts/check-records.ts` (deleted): `pnpm plugin:sync` removes the rendered copy.
- `package.json` (changed): `plan:check` runs `check-plan.ts` only.
- `templates/nestjs/package.json`, `templates/nextjs/package.json`, `templates/nodejs/package.json`, `templates/payload/package.json`, `templates/turborepo/package.json` (changed): the same.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed): `findStatusProblems` returns no problem for a file the branch does not add, and the set `editedStatuses` goes. The self-tests "removes a merged status line" and "sets a merged file to draft" stay and now expect no problem. The rule that only a fix plan on a `fix/` branch skips the intent and the spec applies to a plan the branch adds, and no longer to a plan the default branch holds. The rule on the status a pull request writes in a file it adds stays.
- `templates/base/scripts/check-plan.ts` (changed): rendered.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): line 76 goes.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/intent.md` (changed): step 4 says only that `<change>` is a short kebab-case name.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` (changed): step 1 no longer asks for a folder with no `spec.md`, and has no case for one that exists. With a `spec.md` there, the agent revises it from the intent.
- `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/`, `.claude/skills/sdlc-mode/`, `templates/base/.claude/skills/sdlc-mode/` (changed): the three files above, rendered.
- `plugins/sdlc/README.md` (changed): line 68 loses the clause on a deleted, moved, or rewritten record.
- `intent/README.md`, `templates/base/intent/README.md` (changed): line 3 loses "and its record stays here".
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/new-round-gets-a-new-intent-folder/` (deleted): `case.yaml`, `prompt.md`, `scaffold.sh`.
- `intent/consumer-first-project-gaps/plan.md`, `intent/md-only-ci/intent.md`, `intent/subagent-role-models/plan.md` (changed): four lines lose the project's name, with the words of requirements 12 to 14.
- `intent/cloud-session-skills/spec.md`, `intent/consumer-first-project-gaps/spec.md`, `intent/done-at-build/intent.md`, `intent/done-at-build/spec.md`, `intent/loop-autonomy/spec.md`, `intent/md-only-ci/spec.md`, `intent/monorepo-apps/spec.md`, `intent/plan-only-folders/spec.md` (changed): nine lines. Each Thai quote becomes English: "Write the spec of <name>" (five files), "The status must change automatically" (two lines), "Go on and write the spec of loop-autonomy", "Come back and finish the earlier intent".
- `.changeset/editable-records.md` (new): `patch` for `@next-friday/create-app`.
- `intent/editable-records/plan.md` (new). `intent/editable-records/intent.md`, `spec.md` (changed): `Status: done.`

## Order of work

1. Create `feat/editable-records` from `origin/main`. Commit `plan.md`. Check: `git log -1` shows the commit.
2. Delete `check-records.ts`, and take it out of the six `plan:check` scripts. Check: `git grep -n check-records -- . ':!intent' ':!CHANGELOG.md'` finds only `plugins/sdlc/README.md`.
3. Change `check-plan.ts`. Check: `node plugins/sdlc/source/scripts/check-plan.ts` passes its self-tests, and a merged intent set to `Status: draft.` in the working tree passes it.
4. Change `SKILL.md`, `intent.md`, `design.md`, the two `intent/README.md` files, and `plugins/sdlc/README.md`. Check: `git grep -n -i -E "Never delete or rewrite|record stays here|does not exist yet|already exists\.\*\*" -- plugins/sdlc/source intent/README.md templates/base/intent/README.md` finds nothing.
5. Delete the eval case folder. Check: `git grep -n new-round-gets-a-new-intent-folder -- . ':!intent'` finds nothing.
6. Run `pnpm plugin:sync`. Check: `pnpm plugin:check` and `pnpm rules:check` pass.
7. Change the four lines that name the project and the nine lines with Thai characters. Check: `git grep -i` for the project's name finds nothing, a search of every tracked file for a Thai character finds nothing, and `pnpm plan:check` passes.
8. Write the changeset, and set `Status: done.` in `intent.md` and `spec.md`. Check: `pnpm verify` passes in the root.
9. Generate a project of each stack of `src/stacks.ts` and run `pnpm verify` in each. Check: each exits 0.
10. Run `pnpm evals:run` and `pnpm evals:run:write`. Check: the scores are in the pull request.
11. Run the `verifier` subagent, push, and open the pull request.

## Risks

- The riskiest step is 3. `check-plan.ts` is one file of about 1,300 lines with 77 self-tests, and the status rule shares a function with the rule on an added file, which stays. The build found a second rule there that refused a change to a merged record: a fix plan with no intent and no spec could change only on a `fix/` branch. Requirement 4 needs it gone for a merged plan, so step 3 changed it too.
- With the check and the sentences gone, nothing in the harness stops an agent from rewriting or deleting a record whose work is open. The spec accepts that.
- Step 7 changes records that are quotes of the product owner. The translations are the agent's.
- Step 10 costs money. The suites hold 31 cases. Single cases cost about $0.05 to $0.20 each, so both suites are estimated at $2 to $6. The estimate is not measured for a whole suite.
- The name and the Thai text stay in git history and in the pages of merged pull requests.
- Options not taken:
  - Keeping `check-records.ts` with an exception for a name: the spec deletes it.
  - Deleting the eight records with Thai text: the spec changes nine lines.
  - `pnpm evals:run:scripts`, which `plugins/sdlc/README.md` line 89 also names: the spec asks for the two suites of `AGENTS.md`.

## Proof

1: `git ls-files` lists no `check-records.ts`.
2: the six `plan:check` scripts; `git grep -n check-records -- '*package.json'` finds nothing.
3: the self-tests of `check-plan.ts`, and the edit of step 3: a merged intent set to `Status: draft.` passes the new script and fails the script of the default branch.
4: `pnpm plan:check` and the `pre-push` hook pass on this branch, which changes thirteen lines of merged records; CI on the pull request.
5, 6, 7: the search of step 4, and review of the diff.
8: the search of step 5.
9, 10: the diff of `intent.md` and `design.md`; the eval case `writes-spec-from-merged-intent` still passes in step 10.
11: review of the diff: no new rule, check, or hook.
12, 13, 14, 15: the search for the project's name in step 7.
16: the search for a Thai character in step 7.
17: `pnpm plugin:sync`, then `pnpm plugin:check` and `pnpm rules:check`.
18: `pnpm verify` in the root and in a generated project of each stack.
19: the scores of step 10, in the pull request.
20: `.changeset/editable-records.md` holds `patch`; `pnpm verify` runs the changeset check.
21: the status lines of `intent.md` and `spec.md`.
