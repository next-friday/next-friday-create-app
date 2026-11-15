# Plan: Restore the `sdlc-help` skill (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/adapters/claude-code/evals/sdlc-help/` (restored): the three eval cases `explains-how-to-start-work`, `work-request-is-sent-to-sdlc`, and `unknown-playbook-is-not-invented`.
- `plugins/sdlc/source/skills/sdlc-help/SKILL.md` (restored): the help skill as it was before its removal, with the `small` route added to its map.
- `.claude/skills/sdlc-help/SKILL.md`, `templates/base/.claude/skills/sdlc-help/SKILL.md`, `plugins/sdlc/adapters/claude-code/skills/sdlc-help/SKILL.md` (rendered by `pnpm plugin:sync`).
- `scripts/sync-plugin.ts` and the rendered `plugins/sdlc/adapters/claude-code/.claude-plugin/plugin.json` (changed): the plugin description names the help skill again.
- `plugins/sdlc/README.md` (changed): seven skills, a help skill among them. `templates/base/SETUP.md` (changed): the sentence on `/sdlc-help`.
- `intent/cloud-session-skills/spec.md` (changed): requirement 20 keeps `sdlc-help` and removes only `sdlc-status`.
- `.changeset/restore-sdlc-help.md` (new): a `minor` changeset.

## Order of work

The cause: commit `3cb3c6b` (spec requirement 20) removed `sdlc-help` as a skill for what a file already says. The product owner reversed that: a person needs one command that explains how the workflow runs and starts no work, as pstack's `poteto-help` does.

1. Restore the eval cases and commit them. Check: `claude plugin eval plugins/sdlc/adapters/claude-code --case 'explains-how-to-start-work' --ablation none` fails, because no `sdlc-help` skill exists.
2. Restore the skill, add the `small` route to its map, and run `pnpm plugin:sync`. Check: `pnpm plugin:check` passes and `ls .claude/skills templates/base/.claude/skills` lists `sdlc-help`.
3. Change the plugin description, the README, `SETUP.md`, the spec, and add the changeset. Check: `pnpm verify` passes.
4. Run the three `sdlc-help` eval cases. Check: each passes at least as often as before its removal (`explains-how-to-start-work` 2/3, the other two 3/3).

## Risks

- The help skill can drift from the playbooks it maps. Its step 3 says the files win when they disagree, and its eval cases run when it changes.
- Option not taken: putting the help text in `AGENTS.md`. The product owner wants a command a person types, which starts no work.

## Proof

- Step 1's eval case fails before step 2 and passes after it.
- `pnpm plugin:check` passes, and the three `sdlc-help` eval cases pass as step 4 says.
