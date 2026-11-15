# Spec: The build pull request marks its change done

From `intent/done-at-build/intent.md`. Status: done.

Request: "เขียน spec ของ done-at-build". Skills at 9a2eaa2.

## Requirements

1. `pnpm plan:check` fails a branch when all of these hold:
   - the branch adds or changes an `intent/<change>/plan.md`, and the file exists on the branch, so a deleted plan is not checked;
   - that folder has a `spec.md`;
   - the branch changes a file outside `intent/`.

   It fails unless the folder's `intent.md` and `spec.md` on the branch each say `Status: done.` A missing `intent.md` counts as not `done`.

2. The failure is one line for each file that does not say `Status: done.`: `<path>: the build pull request sets "Status: done." here; when a requirement stays unmet, its description names it`.
3. A plan in a folder with no `spec.md` is not checked by this rule. This is a fix plan, which `playbooks/fix.md` covers.
4. A branch that changes only files under `intent/` is not checked by this rule. This covers an intent, a spec, or a plan written before the code.
5. A folder whose `intent.md` and `spec.md` already say `Status: done.` on the default branch passes when a later branch changes its plan and code.
6. The rule demands `Status: done.` even when the build leaves a requirement of the spec unmet. `playbooks/build.md` step 8 then says that the pull request description names each unmet requirement, so the product owner decides at the merge.
7. The last sentence of `playbooks/build.md` step 8 becomes: "Before the branch is first pushed, set `Status: done.` in `intent.md` and `spec.md`; `pnpm plan:check` fails the push without it. When a requirement of `spec.md` stays unmet, name it in the pull request description."
8. Self-tests cover each case:
   - a build branch without `done`, which fails;
   - a build branch with `done`, which passes;
   - a folder already `done` on the default branch, which passes;
   - a missing `intent.md`, which fails;
   - a branch that changes only files under `intent/`, which passes;
   - a folder with no `spec.md`, which passes;
   - a deleted plan, which passes.
9. `pnpm verify` passes at the root, and in a project generated from each stack in `src/stacks.ts`.
10. `pnpm evals:run` and `pnpm evals:run:write` run after the playbook change, as `AGENTS.md` requires, and the pull request reports their scores.
11. The pull request has one changeset of type `patch` for `@next-friday/create-app`. Before it opens, the user is told the version it publishes.

## Design

- **`plugins/sdlc/source/scripts/check-plan.ts`:**
  - A new pure `findDoneProblems(isBuildPlan, intentStatus, specStatus)` returns the requirement 2 message for each status that is not `done`, and nothing when `isBuildPlan` is false. `readStatus` gives each status, or undefined for a missing file (requirements 1, 2).
  - A new `isBuildPlan(folder, changedPaths, isCodeChanged)` is true when all of these hold:
    - `isCodeChanged`, which `findDoneLines` sets from `requiresAcceptance(branchChanges)`, is true, which already means "the branch changes a file outside `intent/`" (requirement 4);
    - the folder's `plan.md` is in `changedPaths` and passes `existsSync`, as `findBranchRuleLines` filters it (requirement 1);
    - the folder has `spec.md` (requirement 3).
  - A new `findDoneLines(changeFolders)` reads `findBranchChanges()` once, and passes `isBuildPlan` and the two statuses of each folder to `findDoneProblems`.
  - Requirement 5 needs no extra code: the rule reads the files on the branch, so a status that is already `done` passes.
  - A repository whose default branch has no `package.json` gets no exemption. `findBranchRuleLines` uses that first-import case only for the no-plan rule, and a first import with a spec and a plan is a build.
  - The main block adds `findDoneLines(changeFolders)` beside `findStatusLines`, only when no paths are given, as `findBranchRuleLines` is.
  - The self-tests call `isBuildPlan` and `findDoneProblems` from a new table, as `planOnlyCases` calls `findPlanOnlyProblems`. Folders come from `createChangeFolder`; the deleted plan is a folder with no `plan.md` whose path is in `changedPaths` (requirement 8).
  - `pnpm plugin:sync` renders the script to `templates/base/scripts/check-plan.ts`, which every stack's `plan:check` runs.
- **`plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md` step 8:**
  - The last sentence becomes the text of requirement 7 (requirements 6, 7).
  - `pnpm plugin:sync` renders the playbook to the adapters and to `templates/base/plugins/sdlc`.
- **`intent/README.md`:** no change. Its **Done** bullet already says the pull request that meets the last requirement sets `Status: done.`
- **`.changeset/done-at-build.md`** (new): `patch` for `@next-friday/create-app` (requirement 11). npm `latest` is `9.14.1` (`npm view @next-friday/create-app dist-tags`), so the release would be `9.14.2`.

## Policies

- **Brand:** Does not apply. The change shows no brand value (brand rule 1).
- **Security:** Does not apply. The change touches development tooling, not the application, so no ASVS chapter applies (security rule 1).
- **Compliance:** Does not apply. The change handles no personal data (compliance rule 1).
- **UX:** Does not apply. The change adds no user interface (UX rule 1).

## Areas of concern

1. **Every push of a build branch must already say `done`** (a decision the files do not settle; no policy).
   - `.husky/pre-push` runs `pnpm verify`, which runs `pnpm plan:check`.
   - A build branch pushed before the work is finished, for example to save it, fails until it says `Status: done.`
   - `playbooks/build.md` step 10 pushes only after the build and its checks. Step 7 keeps the whole build on one branch.

   Decision: accept it. Step 8 sets `done` before the first push (requirement 7).

2. **`done` with an unmet requirement** (a decision the files do not settle; no policy). `intent/README.md` defines done as "the tree meets every numbered requirement of its `spec.md`". A build that leaves a requirement unmet would still say `done`.

   Decision: demand `done`. The pull request names each unmet requirement, and the product owner decides at the merge (requirement 6).

3. **A plan changed beside a rejected, replaced, or withdrawn spec** (a decision the files do not settle; no policy). `findStatusProblems` lets an edited file keep these statuses. A branch that changes such a folder's plan together with code fails this rule.

   Decision: keep the failure. A rejected, replaced, or withdrawn change is not built, so a branch that builds it starts a new intent.

## Open questions

- **When a build leaves a requirement unmet, should the check still demand `done`?**
  - Answered: yes, as area of concern 2 and requirement 6 state.
  - Evidence: the intent's proposal; the description of #248 records the same choice for `consumer-first-project-gaps`.
