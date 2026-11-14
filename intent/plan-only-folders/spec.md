# Spec: Only a bug fix may skip the intent and the spec

From `intent/plan-only-folders/intent.md`. Status: accepted.

Request: "เขียน spec ของ plan-only-folders". Skills at aed01d3.

## Requirements

1. `pnpm plan:check` accepts a plan on a branch whose folder has no `intent.md` and no `spec.md` only when both of these hold:
   - the plan's title ends in "(fix)";
   - the branch name starts with `fix/`.
2. Any other changed plan whose folder has no `spec.md` fails. The message says to start from an intent with `/sdlc:sdlc-mode`.
3. The branch name comes from `GITHUB_HEAD_REF` when it is set, and otherwise from `git branch --show-current`, as the existing branch rule reads it.
4. A plan the branch does not change is not checked, as today, so a folder already on the default branch does not start failing on an unrelated branch.
5. A branch may add an `intent.md` or a `spec.md` that says `Status: done.` when the folder's `plan.md` is already on the default branch, which is the case for a change built before its intent or spec was written. Every other added `intent.md` or `spec.md` still says `accepted` or `rejected`.
6. `SKILL.md` tells the agent that when a gate blocks it, it does not write another artifact that the gate accepts. It reports the block and the person's options.
7. `playbooks/fix.md` says that `pnpm plan:check` enforces the "(fix)" title and the `fix/` branch.
8. Each of `changeset-check-bot-branch`, `gate-check-git-env`, `plugin-names`, `reply-shape-hook`, `reply-urls`, and `sdlc-eval-gaps` under `intent/` gains an `intent.md` and a `spec.md` that say `Status: done.` Each holds only what its merged pull request, its plan, and its commits show. Its `plan.md` does not change.
9. `pnpm verify` passes at the root and in a project generated from each stack.
10. The pull request has one changeset of type `patch` for `@next-friday/create-app`. Before it opens, the user is told the version it publishes.

## Design

- **`plugins/sdlc/source/scripts/check-plan.ts`:**
  - A helper `readBranchName()` reads `GITHUB_HEAD_REF`, falling back to `git branch --show-current`. `findBranchRuleLines` uses it, and so does the new rule (requirement 3).
  - `findPlanFileLines` passes the branch name to `checkPlan`. A folder with no intent and no spec counts as a fix plan only when the title ends in "(fix)" and the branch starts with `fix/`. Otherwise `checkPlan` reports the requirement 2 message in place of the fix-proof checks (requirements 1, 2).
  - `findStatusLines` looks up the folder's `plan.md` with `readDefaultBranchFile` and passes the result to `findStatusProblems`, which then also accepts `done` on an added file (requirement 5).
  - `findBranchRuleLines` keeps using the same fix-plan test for the test-edit rule, so a fix plan is one folder with the same three facts everywhere.
  - Self-tests cover:
    - a fix title on a `fix/` branch;
    - a fix title on another branch;
    - no fix title on a `fix/` branch;
    - an added `done` file beside a merged plan;
    - an added `done` file with no merged plan.
  - `pnpm plugin:sync` renders the script to `templates/base/scripts/check-plan.ts`.
- **`plugins/sdlc/source/skills/sdlc-mode/SKILL.md`:** one reply rule beside the existing permission rule (requirement 6).
- **`plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md`:** step 4 or step 6 names the check (requirement 7).
- **`intent/<folder>/intent.md` and `spec.md`** for the six folders (requirement 8), each written from that folder's pull request:
  - `intent.md` uses the plan playbook's template: `Author: @<the pull request author's handle> (<team>). Status: done.`, which `findAuthorProblems` requires.
  - `spec.md` uses the design playbook's template, with a `Decision:` line under each area of concern stating what the pull request shipped, which `findDecisionProblems` requires.
- **`.changeset/plan-only-folders.md`** (new): `patch` (requirement 10).

## Policies

- **Brand:** Does not apply. The change shows no brand value (brand rule 1).
- **Security:** Does not apply. The change touches development tooling, not the application, so no ASVS chapter applies (security rule 1).
- **Compliance:** Does not apply. The change handles no personal data (compliance rule 1).
- **UX:** Does not apply. The change adds no user interface (UX rule 1).

## Areas of concern

1. **Added files that say `Status: done.`** (a decision the files do not settle; no policy). The rule shipped in 9.14.0 lets an added intent or spec say only `accepted` or `rejected`, yet the six folders were built before their intents and specs existed.
   Decision: allow `done` on an added file only when the folder's `plan.md` is already on the default branch (requirement 5).
2. **The plans keep their "(fix)" titles** (a decision the files do not settle; no policy). After requirement 8, these folders hold a spec, so `check-plan.ts` no longer treats them as fix plans. Their titles still end in "(fix)".
   Decision: leave each `plan.md` unchanged as the record of what was accepted. A plan is checked only when a branch changes it.

## Open questions

- **Patch or minor:** patch. The change corrects the check to match `playbooks/fix.md` and adds no behavior that the playbook does not already describe (`.changeset/README.md`).
- **The branch in CI:** from `GITHUB_HEAD_REF`, which `check-plan.ts` declares at line 375 and reads at lines 1159–1163 for the branch rule (requirement 3).
