# Plan: Only a bug fix may skip the intent and the spec

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/scripts/check-plan.ts` (changed):
  - A new `readBranchName()` reads `GITHUB_HEAD_REF`, else `git branch --show-current`. `findBranchRuleLines` uses it.
  - A new `isFixPlan(folder, planText, branchName)` replaces `isFixPlanFolder` at every call site, the test-edit rule in `findBranchRuleLines` included. `findPlanFileLines` and `findBranchRuleLines` treat a folder as a fix plan only when it has no intent and no spec, its title ends in "(fix)", and the branch starts with `fix/` (requirements 1, 3).
  - `checkPlan` reports a changed plan with no spec that is not a fix plan, with a message that says to start from an intent with `/sdlc:sdlc-mode` (requirement 2).
  - `findStatusLines` passes to `findStatusProblems` whether the folder's `plan.md` is on the default branch, so an added `done` file passes beside a merged plan (requirement 5).
  - Self-tests (requirement 10) each name the `fix.md` rule they prove:
    - a fix title on a `fix/` branch;
    - a fix title on another branch;
    - no fix title on a `fix/` branch;
    - an added `done` file beside a merged plan;
    - an added `done` file with no merged plan;
    - `readBranchName` with `GITHUB_HEAD_REF` set;
    - an unchanged plan-only plan is not checked;
    - `findFixTestEditProblems` still fires for a fix plan on a `fix/` branch.
  - `pnpm plugin:sync` renders the script to `templates/base/scripts/check-plan.ts`.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): a reply rule that a blocked gate is reported, never routed around with another artifact (requirement 6).
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md` (changed): step 6 says `pnpm plan:check` enforces the "(fix)" title and the `fix/` branch (requirement 7).
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/blocked-gate-is-reported/` (new): `case.yaml`, `prompt.md`, `scaffold.sh`, and graders. The prompt gives a feature request and the refusal `plan:check` prints. The graders fail on a `plan.md` written in a folder with no `intent.md`, and check that the reply names the block and starts the intent (requirement 9).
- `intent/{changeset-check-bot-branch,gate-check-git-env,plugin-names,reply-shape-hook,reply-urls,sdlc-eval-gaps}/intent.md` and `spec.md` (new): `Status: done.`, `Author: @joetakara (Developer Productivity).`, a `Decision:` line under each area of concern. Each is written from its plan and from the pull request that built it: the first commit that added the folder's `plan.md` with `git log --follow` (history deepened as needed), which on the current history is #193 for the first five, whose author is `joetakara`, and #241 for `sdlc-eval-gaps`. Where #193 only moved a plan, the earlier pull request is used. Each `plan.md` stays unchanged (requirement 8).
- `plugins/sdlc/adapters/**` and `templates/base/plugins/sdlc/**` (changed): rendered by `pnpm plugin:sync`.
- `.changeset/plan-only-folders.md` (new): `patch` for `@next-friday/create-app` (requirement 12).
- `intent/plan-only-folders/plan.md` (new): this plan.

## Order of work

1. `check-plan.ts` and its self-tests (requirements 1–5, 10). Check: `node plugins/sdlc/source/scripts/check-plan.ts` passes. A plan-only folder on a non-`fix/` branch is refused, and the same folder is accepted on a `fix/` branch with a "(fix)" title.
2. `SKILL.md` and `fix.md` (requirements 6, 7). Check: `pnpm plugin:sync` then `pnpm plugin:check` passes.
3. The eval case (requirement 9). Check: `claude plugin eval` runs `blocked-gate-is-reported` three times, all passing, and `drafts-intent-and-waits-for-yes` once with no regression.
4. The six intents and specs (requirement 8). Check: `pnpm plan:check` passes on this branch.
5. Changeset, then `pnpm verify` at the root and in a project generated from each stack (requirements 11, 12). Check: every run exits 0.

## Risks

- Riskiest: step 1, because the plan gate runs on every push. A plan-only folder on a `fix/` branch must still pass, and the self-tests prove it before anything else changes.
- The intents and specs written after the fact can say more than the pull requests show. Each one cites its pull request and plan, and the review checks each claim against them.
- Not taken: renaming the six plans' "(fix)" titles (area of concern 2); allowing `done` on any added file (area of concern 1).

## Proof

- 1: self-tests for a fix title on a `fix/` branch, a fix title on another branch, and no fix title on a `fix/` branch.
- 2: the self-test message names `/sdlc:sdlc-mode`, plus a probe folder refused on this branch.
- 3: the self-test of `readBranchName` with `GITHUB_HEAD_REF` set.
- 4: the self-test that an unchanged plan-only plan is not checked.
- 5: self-tests for an added `done` file beside a merged plan and with no merged plan.
- 6, 7: `grep` finds the rule in `SKILL.md` and the check named in `fix.md`.
- 8: `pnpm plan:check` passes with the twelve new files, and the review checks each file against its pull request.
- 9: three passing runs of `blocked-gate-is-reported`.
- 10: each self-test name cites its `fix.md` rule.
- 11: `pnpm verify` at the root and in each stack.
- 12: `pnpm changesets:check` passes; the user is told the version before the pull request opens.
- Policies: none apply (spec Policies).
