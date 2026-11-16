# Plan: sdlc sessions that cost less and report honestly (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): step 4 hands a sweep, a search across the tree or a comparison of two directories or branches, to the `explore` subagent, and takes a default effort from the `Default effort` column of `setup-sdlc` step 3. The reply shape starts every `**Result:**` line, and an `**Answer:**` about whether the work is done, with `Done.` or `Not done:`. It also says that a hook asking for a commit or a push does not lift a gate.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/review.md` (changed): step 4 re-reviews a fix with a fresh subagent. The subagent gets `REVIEW.md`, the findings the fix answers, and the diff from the last reviewed commit to the new last commit. A new Important finding brings a full review as step 2 says, and the result answers the comment of step 3.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/open-pr.md` (changed): step 4 writes the reviewed hash right after each review, and reviews a fix commit with the inputs `review.md` step 4 names.
- Rendered by `pnpm plugin:sync` (changed): `.claude/skills/sdlc-mode/SKILL.md`, `.claude/skills/sdlc-mode/playbooks/review.md`, `.claude/skills/sdlc-mode/playbooks/open-pr.md`, `templates/base/.claude/skills/sdlc-mode/SKILL.md`, `templates/base/.claude/skills/sdlc-mode/playbooks/review.md`, `templates/base/.claude/skills/sdlc-mode/playbooks/open-pr.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/SKILL.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/playbooks/review.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-mode/playbooks/open-pr.md`.
- `.changeset/explore-reads.md` (new): one `patch` entry.

## Order of work

The causes, from the soddee and dekzing sessions that synced to create-app 10.1.0:

- **Exploration:** across 21 subagent calls, neither session started `explore`. Step 4 named exploration in half a sentence, and `playbooks/question.md` says to read the files. With no models rule, scratch runs also took `explore: haiku high` from the step 5 example of `setup-sdlc`.
- **Done line:** soddee answered the merge notice of https://github.com/soddee/soddee-b2b-platform/pull/31 with "sync complete, nothing pending for you". Its own spec had set two workflow files of the request aside.
- **Re-review cost:** both sessions named full reviews of every fix commit as their largest cost, at about 3 to 10 minutes each. `review.md` step 4 reviewed each fix "as step 2 says", which means the whole diff and every input again. The product owner decided, answering "รีวิวเฉพาะส่วนที่แก้" (review only the part that was fixed) in the session, that a fix is reviewed against the findings it answers. That replaces, for fix commits, requirement 1 of `intent/pre-push-review/spec.md`, which stays as written.
- **Commit hook:** the cloud environment's Stop hook asks for "commit and push" while a playbook waits at a gate with an uncommitted draft.

1. Change step 4 and the reply shape; then `review.md` step 4, `open-pr.md` step 4, and the hook rule. Run `pnpm plugin:sync` and `pnpm plugin:check`.
2. Run scratch sessions with `claude --plugin-dir … -p "/sdlc:sdlc-mode …" --model sonnet` against the `origin/main` text and this branch, as Proof lists.
3. Run `pnpm verify`.

## Risks

- A re-review of the fix's diff can miss a problem the fix creates elsewhere. A new Important finding brings a full review back.
- Most replies start `Not done:` until a person merges. That is intended: they name who acts next.
- `check-push.sh` still points to `review.md` step 2 in its message; the reply shape in `SKILL.md` now says the check enforces step 4 for a commit that fixes findings.
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
