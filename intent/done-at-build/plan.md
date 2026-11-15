# Plan: The build pull request marks its change done

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/scripts/plan-check-self-test-cases.ts` (new): the data the self-tests of `check-plan.ts` read, so `check-plan.ts` stays under the `sonarjs/max-lines` limit of 1000 counted lines (`eslint` with a lowered limit reports 995 today). It holds:
  - the `planOnlyCases` and `statusCases` tables and their constants, moved unchanged;
  - `createChangeFolder` with the folders it makes, moved unchanged;
  - the new `doneCases` table.
    It imports nothing from `check-plan.ts`, so the two modules do not import each other.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed):
  - It imports the tables and the folders from the new module.
  - A new `isBuildPlan(folder, changedPaths, isCodeChanged)` is true when all of these hold (requirements 1, 3, 4):
    - `isCodeChanged` is true;
    - `<folder>/plan.md` exists, and its path, normalised with `split(path.sep).join("/")` as `findStatusLines` does, is in `changedPaths`;
    - `<folder>/spec.md` exists.
  - A new `findDoneProblems(isBuildPlan, statuses)` takes `[path, status]` pairs for the intent and the spec. A missing file is read as status `undefined` through an `existsSync` guard, as `readSpec` does. For each pair that is not `done`, it returns `<path>: the build pull request sets "Status: done." here; when a requirement stays unmet, its description names it` (requirements 1, 2, 6).
  - A new `findDoneLines(changeFolders)` reads `findBranchChanges()` once. It sets `isCodeChanged` from `requiresAcceptance` and returns the lines.
  - The main block runs `findDoneLines` only when no paths are given, as it runs `findBranchRuleLines`.
  - The self-test list maps `doneCases` to `isBuildPlan` and `findDoneProblems`. Each case expects at most one line, because `isSelfTestFailure` expects exactly one problem when a message part is set. The "without done" case therefore leaves only the spec not done. The cleanup loop removes the new folders too.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md` (changed): the last sentence of step 8 becomes the text of requirement 7.
- `templates/base/scripts/check-plan.ts`, `templates/base/scripts/plan-check-self-test-cases.ts`, `plugins/sdlc/adapters/**`, `templates/base/plugins/sdlc/**` (changed or new): rendered by `pnpm plugin:sync`, which copies every file in `plugins/sdlc/source/scripts/` (`scripts/sync-plugin.ts:671`).
- `.changeset/done-at-build.md` (new): `patch` for `@next-friday/create-app` (requirement 11).
- `intent/done-at-build/plan.md` (new): this plan.
- `intent/done-at-build/intent.md` and `spec.md` (changed): `Status: done.`, set before the first push (requirement 7). This branch is the first one the new rule checks.

## Order of work

1. Move the tables and `createChangeFolder` into the new module. Check: `node plugins/sdlc/source/scripts/check-plan.ts` still reports 66 self-tests, and `pnpm lint:check` passes.
2. Add `isBuildPlan`, `findDoneProblems`, `findDoneLines`, the main block line, and `doneCases`. Commit `plan.md` and the code: `findBranchChanges` reads commits only. Check: the script reports 73 self-tests. On this branch, with `intent.md` and `spec.md` still `accepted`, it prints the requirement 2 line for both files. `pnpm lint:check` passes.
3. Change `build.md` step 8, then run `pnpm plugin:sync`. Check: `pnpm plugin:check` passes, and `grep -rln "fails the push without it" plugins/sdlc templates/base/plugins/sdlc` finds the sentence in every rendered copy.
4. Add the changeset, then set `Status: done.` in `intent.md` and `spec.md`. Check: `pnpm plan:check` and `pnpm changesets:check` pass.
5. Run `pnpm verify` at the root. Then generate a project from each stack in `src/stacks.ts`, as `AGENTS.md` says, and run its `pnpm verify`. Check: every run exits 0.
6. Run `pnpm evals:run` and `pnpm evals:run:write`. Check: both report scores. The pull request lists the scores, and any case that cannot run in this session, with the reason.
7. Run `npm view @next-friday/create-app dist-tags` again, and tell the user the version before the pull request opens.

## Risks

- The riskiest steps are 2 and 1. `plan:check` runs on every push, in this repository and in every generated project:
  - a wrong `isBuildPlan` would block every branch, or none;
  - a broken move would stop the self-tests.
    The unchanged self-test count after step 1, the seven new cases, and the failing run on this branch in step 2 cover these.
- A branch that adds `spec.md` together with a plan and code can never pass. An added file must say accepted or rejected (`check-plan.ts:551`), but this rule demands done. `build.md` step 1 already needs the spec merged before the build, so the plan only states it.
- Without `origin/main`, for example in a generated project before its first fetch, the rule says nothing, because `requiresAcceptance` is false. The other branch rules behave the same, and CI fetches the default branch.
- An open branch that adds a plan beside a spec and changes code fails once it merges `main`. Every folder with a `plan.md` in this repository says `done` today.
- A deleted plan passes, because `isBuildPlan` checks that the file exists. A renamed folder shows its new path in `git diff --name-only`, so it is checked there.
- Not taken: extending `findStatusLines`. That function judges each file on its own, and this rule needs the whole folder and the branch's code paths.
- Not taken: trimming the existing self-tests to make room, because each one guards a separate rule.

## Proof

- 1: the self-tests "a build branch without done fails" and "a build branch with done passes"; the failing run on this branch in step 2.
- 2: the "without done" self-test expects the words `sets "Status: done." here`. The step 2 run shows the full line with each path.
- 3: the self-test "a folder with no spec.md passes".
- 4: the self-test "a branch that changes only intent/ passes".
- 5: the self-test "a folder already done passes". It uses the same statuses as "with done", because requirement 5 needs no extra code (spec Design).
- 6: the "with done" self-test passes with no check of the requirements. The `build.md` step 8 sentence names the description rule (grep in step 3).
- 7: the grep in step 3.
- 8: the self-test count rises from 66 to 73, and `doneCases` names the seven cases.
- 9: `pnpm verify` at the root and in each generated stack.
- 10: the scores of `pnpm evals:run` and `pnpm evals:run:write` in the pull request.
- 11: `pnpm changesets:check`, and the version from step 7 told to the user.
- Policies: none apply (spec Policies).
