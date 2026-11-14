# Plan: Close the gaps the plugin evals found on the default model (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): a task-list item and a **Steps** line hold each step's first sentence, copied word for word; when a playbook step says to say something in a few lines and stop, the reply is those lines and the **Now** line.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md` (changed): step 3 asks about the order of work and its tests only in a round after the files are settled.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/review.md` (changed): step 2 starts the reviewer with the session's subagent tool, reads the diff again only without one, and says which ran.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md` (changed): step 4 shows the line `File: intent/<short-description>/plan.md` above the plan.
- `plugins/sdlc/adapters/claude-code/`, `plugins/sdlc/adapters/cursor/`, and `templates/base/plugins/sdlc/` (changed): rendered by `pnpm plugin:sync`.
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/` (changed):
  - `drafts-intent-and-waits-for-yes` and `interviews-before-writing-intent`: the Steps grader asks for each step's first sentence.
  - `request-that-fits-no-row`: the grader that asked for a short reply is deleted, because the row asks the agent to answer what it can.
  - `drafts-intent-and-waits-for-yes`, `interviews-before-writing-intent`, `spec-for-unmerged-intent-stops`, and `statement-without-command-starts-no-work`: the branch-command pattern no longer matches `git branch --format`, `--sort`, or `--points-at`, which only list branches.
  - `statement-without-command-starts-no-work`: the scaffold's `AGENTS.md` holds the rule every generated project's `AGENTS.md` has, on a problem reported without a command.
- `intent/sdlc-eval-gaps/plan.md` (new): this plan.
- `.changeset/sdlc-eval-gaps.md` (new): `patch` for `@next-friday/create-app`.

## Order of work

Cause: the eval run on the default model failed cases where the playbook text is ambiguous, and cases where a grader asks for more than the playbook says. Evidence: the run's failed graders and replies.

1. Change the four playbook files, then run `pnpm plugin:sync`. `pnpm plugin:check` must pass.
2. Change the eval cases. `pnpm plugin:check` must pass.
3. Run `pnpm verify` in the root, and in a generated project of each stack with `--deploy none` and `--deploy railway`. All must pass.
4. Run the `needs-write` and `no-shell` evals on the default model. The changed cases must score higher than before.

## Risks

- A judge model scores some graders, so one run can differ from the next by a grader or two.
- Three cases still fail in the eval sandbox, because its `.git` is read-only and no branch can be created. This plan does not change them.

## Proof

- `pnpm plugin:check` and `pnpm verify` pass in the root and in the ten generated projects.
- The eval run on the default model before and after this change, with each changed case's score.
