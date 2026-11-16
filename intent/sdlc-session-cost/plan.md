# Plan: sdlc sessions that cost less and report honestly (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): step 4 hands a sweep, a search across the tree or a comparison of two directories or branches, to the `explore` subagent, and takes a default effort from the `Default effort` column of `setup-sdlc` step 3. The reply shape starts every `**Result:**` line, and an `**Answer:**` about whether the work is done, with `Done.` or `Not done:`. It also says that a hook asking for a commit or a push does not lift a gate.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/review.md` (changed): step 4 fixes each Important finding, runs the checks, pushes, and answers the review comment, with no review before the push.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/open-pr.md` (changed): step 4 no longer reviews each commit before a push or writes a review hash.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/plan.md`, `design.md`, and `maintain.md` (changed), with their copies in `.claude/skills/sdlc-mode/playbooks/`, `templates/base/.claude/skills/sdlc-mode/playbooks/`, and `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/playbooks/`: the commit step pushes with no review or review hash first.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md`, `fix.md`, `small.md`, `review.md`, and `open-pr.md`, and `plugins/sdlc/source/skills/setup-sdlc/SKILL.md` (changed), with their copies under `.claude/skills/`, `templates/base/.claude/skills/`, and `plugins/sdlc/adapters/claude-code/skills/`. The product owner ordered four changes after comparing the skill with the AI-Native SDLC Playbook and with `pstack/skills/poteto-mode` of https://github.com/cursor/plugins:
  - The `advise` subagent no longer reviews every plan and every finished change. It runs only when a check fails twice or two designs compete. The playbook names no such review; `poteto-mode/playbooks/feature.md` step 7 says "If the design is contested, `interrogate` before shipping".
  - The session verifies its own work and runs the `verifier` once (playbook page 31).
  - `review.md` reviews a pull request once, reports its URL, and stops. It sweeps the pull request only when a person asks. `poteto-mode/playbooks/opening-a-pr.md` says "Opening a PR does not start a babysit."
  - The playbooks are shorter. `open-pr.md` step 5 asks the person how to hand over a file the token cannot push.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` and every file in `plugins/sdlc/source/skills/sdlc-mode/playbooks/` (changed), with their rendered copies: rewritten by the rules of `pstack/skills/technical-writing` and `pstack/skills/unslop` of https://github.com/cursor/plugins, which the product owner named. Each sentence holds one instruction, and no sentence has a semicolon. Three rules change with it: a record's `Status:` word and a spec's `Decision:` lines are what a branch may change, a `Proof` line starts with its requirement number, and `review.md` step 6 names the person who merges.
- `plugins/sdlc/source/scripts/check-records.ts` (new), rendered to `templates/base/scripts/check-records.ts`: fails a branch that deletes an intent, a spec, or a plan of the default branch, moves one, or changes a line of one in more than its status word; a spec's `Decision:` lines may change. It fails when the project has an `origin` remote and `origin/main` cannot be found; a new project with no remote passes. `package.json`, `templates/nestjs/package.json`, `templates/nextjs/package.json`, `templates/nodejs/package.json`, `templates/payload/package.json`, and `templates/turborepo/package.json` (changed): `plan:check` also runs it.
- Three defects that the dekzing session found in the 10.1.0 template:
  - `templates/turborepo/turbo.json` (changed): `concurrency` is 3, because turbo refuses two persistent `dev` tasks at a concurrency of 2. `test/turborepo-template.test.ts` (new) checks it.
  - `plugins/sdlc/source/skills/sdlc-help/SKILL.md` (changed), with its copies: the paths of `small.md` and `fix.md` start at `../sdlc-mode/`. `scripts/plugin-file-checks.ts` and `scripts/sync-plugin.ts` (changed): `plugin:check` fails a skill that names a playbook its own folder does not hold.
  - `plugins/sdlc/source/hooks/sdlc-status.sh` (changed), with its copies: a change whose status is `replaced` is not listed as open, and `plugins/sdlc/source/hooks/sdlc-status.cases.json` (changed) holds the case.
- `plugins/sdlc/source/scripts/check-harness.ts` (new), rendered to `templates/base/scripts/check-harness.ts`; the root `package.json` (changed) runs its self-tests in `pnpm verify`: `pnpm harness:check <version>` generates the reference project of that create-app version and fails when a harness file of the project is missing or differs. `templates/nestjs/.agents/harness.json`, `templates/nextjs/.agents/harness.json`, `templates/nodejs/.agents/harness.json`, `templates/payload/.agents/harness.json`, and `templates/turborepo/.agents/harness.json` (new) name the stack, the harness paths, and the files a project keeps as its own. The `package.json` and `AGENTS.md` of each stack (changed) hold the command. The soddee session proposed it: its sync left two workflow files behind, and no check saw it.
- `plugins/sdlc/source/hooks/check-push.sh` and `plugins/sdlc/source/hooks/check-push.cases.json` (changed), with the rendered `plugins/sdlc/adapters/claude-code/hooks/check-push.sh`, `.claude/skills/sdlc-mode/hooks/check-push.sh`, and `templates/base/.claude/skills/sdlc-mode/hooks/check-push.sh`: the hook no longer refuses a push with no review hash; it still checks that `plan.md` names each changed file. `plugins/sdlc/README.md` (changed) says so. The product owner ordered it: the AI-Native SDLC Playbook reviews at the pull request (pages 33 and 37) and runs a verifier once when the work is done (page 31), not before every push.
- Rendered by `pnpm plugin:sync` (changed): `.claude/skills/sdlc-mode/SKILL.md`, `.claude/skills/sdlc-mode/playbooks/review.md`, `.claude/skills/sdlc-mode/playbooks/open-pr.md`, `templates/base/.claude/skills/sdlc-mode/SKILL.md`, `templates/base/.claude/skills/sdlc-mode/playbooks/review.md`, `templates/base/.claude/skills/sdlc-mode/playbooks/open-pr.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/SKILL.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/playbooks/review.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/playbooks/open-pr.md`.
- `.agents/rules/agent-owned-work.md`, `.claude/rules/agent-owned-work.md`, `.cursor/rules/agent-owned-work.mdc`, `templates/base/.agents/rules/agent-owned-work.md`, `templates/base/.claude/rules/agent-owned-work.md`, and `templates/base/.cursor/rules/agent-owned-work.mdc` (deleted): the product owner ordered the rule removed. No page of the AI-Native SDLC Playbook (design v2.1, 54 pages) says "never ask a person"; page 7 says "Humans remain accountable for every decision that requires judgment".
- `.agents/rules.json`, `templates/nestjs/.agents/rules.json`, `templates/nextjs/.agents/rules.json`, `templates/nodejs/.agents/rules.json`, `templates/payload/.agents/rules.json`, and `templates/turborepo/.agents/rules.json` (changed): the `agent-owned-work` entry is removed.
- `.changeset/explore-reads.md` (new): one `patch` entry.

## Order of work

The causes, from the soddee and dekzing sessions that synced to create-app 10.1.0:

- **Exploration:** across 21 subagent calls, neither session started `explore`. Step 4 named exploration in half a sentence, and `playbooks/question.md` says to read the files. With no models rule, scratch runs also took `explore: haiku high` from the step 5 example of `setup-sdlc`.
- **Done line:** soddee answered the merge notice of https://github.com/soddee/soddee-b2b-platform/pull/31 with "sync complete, nothing pending for you". Its own spec had set two workflow files of the request aside.
- **Re-review cost:** both sessions named full reviews of every fix commit as their largest cost, at about 3 to 10 minutes each. `review.md` step 4 reviewed each fix "as step 2 says", which means the whole diff and every input again. The product owner then ordered the review before every push removed, because the AI-Native SDLC Playbook reviews at the pull request (pages 33 and 37). For pushes, that replaces requirement 1 of `intent/pre-push-review/spec.md`, which stays as written.
- **Agent-owned work:** sessions routed around the person's instruction when it met a check: the rule said "never ask a person", so a session took the step it could do alone, such as opening a new pull request, over the step the person had ordered.
- **Commit hook:** the cloud environment's Stop hook asks for "commit and push" while a playbook waits at a gate with an uncommitted draft.

1. Change step 4 and the reply shape; then `review.md` step 4, `open-pr.md` step 4, and the hook rule. Run `pnpm plugin:sync` and `pnpm plugin:check`.
2. Run scratch sessions with `claude --plugin-dir … -p "/sdlc:sdlc-mode …" --model sonnet` against the `origin/main` text and this branch, as Proof lists.
3. Run `pnpm verify`.

## Risks

- A fix that answers a review finding gets no second review before the push. The checks of `pre-push` and of CI still run on it, and the code owner reads it.
- Most replies start `Not done:` until a person merges. That is intended: they name who acts next.
- Not taken: a shorter route for harness syncs, because a 5-file sync already fits `playbooks/small.md`; opening a pull request as a draft while protected files wait; eval cases, because the product owner asked for this fix now.
- Release: a patch of `@next-friday/create-app`.

## Proof

- **Exploration**, "Which files under templates/nestjs and templates/nextjs differ, and how?": `origin/main` delegated 0 of 2 runs; this branch delegated 3 of 3, to `haiku` `xhigh`.
- **Done line**, a merge notice for a sync whose done spec set two files aside: `origin/main` answered 2 of 2 runs with "nothing else is needed"; this branch answered 2 of 2 runs with `**Result:** Not done:`.
- **Re-review**, a fix commit for one Important finding: 2 of 2 runs started a fresh subagent with only `REVIEW.md`, the finding, and the one-line diff since the reviewed commit.
- **Commit hook**, a project Stop hook that prints the cloud hook's message: no run committed with either text; this branch's 2 of 2 replies start `Not done:` and say that the gate still holds.
- **Existing evals** (`claude plugin eval … --trust-plugin --ablation none`, 3 runs each, final text unless noted): `no-shell` passed 3 of 4 cases and `needs-write` 12 of 19. The cases rerun against `origin/main` in the same session swing on both texts:
  - `answers-question-without-writing`: 2 of 6 runs on `origin/main`, and 1 of 3 on this branch's final text.
  - `build-plans-and-waits-for-the-engineer`: 4 of 6 on `origin/main`, and 2 of 3 on the final text.
  - `review-reports-findings-and-never-merges`: 0 of 3 on `origin/main`, and 1 of 3 on this branch.
  - `fix-reproduces-finds-the-cause-and-waits-for-the-engineer`: 2 of 3 on both.
  - Not rerun against `origin/main`: `second-run-changes-nothing`, `maintain-writes-intent-from-a-finding`, `spec-for-unmerged-intent-stops`, and `writes-spec-from-merged-intent`.
