# Plan: Make the chat light to read, and move process state into the tool's interface

Accepted by: @joetakara.

## Files that change

Paths are under `plugins/sdlc/` unless they start at the root.

- `source/skills/sdlc-mode/SKILL.md` (changed): step 2 keeps the task list and no longer puts steps in the reply. Step 4 writes the models rule when none exists. Step 6 asks an open question in plain text and a choice through the picker. The reply shape gains `**Waiting for you:**` as a first line, the step line, and the rules on language, numbering, risks, and totals under **Checks**, and loses **Steps**, the progress note, and the fixed English **Now** sentence.
- `source/skills/sdlc-mode/playbooks/intent.md`, `build.md`, `design.md`, `review.md` (changed): each sentence on **Steps**, the picker, or a round in plain text follows the new rules. `build.md` step 5 names the plan approval. `deploy.md` names none of them and stays as it is.
- `source/skills/setup-sdlc/SKILL.md` (changed): `/setup-sdlc` does steps 1 to 5 and stops. Steps 6 to 8 run on `/setup-sdlc project`.
- `source/skills/sdlc-help/SKILL.md` (changed): describes the new reply and the two forms of `/setup-sdlc`.
- `source/hooks/check-reply-shape.sh` (changed): reads `**Waiting for you:**` as a first-line label and blocks a line that starts with `**Steps`. Its message on a missing **Checks** section words the new rule.
- `source/hooks/check-reply-shape.cases.json` (changed): a blocking case and a passing case for each of the two.
- `adapters/tool-words.json` (changed): the words `question-picker` and `task-list` for each agent tool.
- `README.md` (changed): the first-line labels the reply check reads, and its check on a **Steps** section. It does not name `/setup-sdlc` and gains no sentence on it.
- `adapters/claude-code/evals/sdlc-mode/` (changed, new): the cases that expect a plain-text round for a choice or a **Steps** section follow the new rules. Four new cases, for requirements 1, 3, 5, and 10. The case for requirement 7 is `build-asks-in-numbered-rounds`, renamed `build-asks-a-round-through-the-picker`, because that case already offers the picker.
- `adapters/claude-code/evals/setup-sdlc/` (changed): `writes-the-models-file` expects no read of `SETUP.md` and no edit of a project file. `second-run-changes-nothing` sends `/setup-sdlc project` and keeps its checks on `SETUP.md`.
- `adapters/claude-code/`, `/.claude/skills/`, `/templates/base/.claude/skills/` (changed): rendered by `pnpm plugin:sync`.
- `/templates/base/SETUP.md` (changed): the sentence that names `/setup-sdlc` for the project's steps names `/setup-sdlc project`. The root `README.md` does not name the command and stays as it is.
- `/.changeset/chat-reply-ux-2.md` (new): one `minor` changeset for `@next-friday/create-app`.
- `/intent/chat-reply-ux-2/plan.md` (new). `/intent/chat-reply-ux-2/intent.md`, `spec.md` (changed): `Status: done.`

## Order of work

1. Create `feat/chat-reply-ux-2` from `origin/main`. Commit `plan.md` and `Status: done.` in `intent.md` and `spec.md`. Check: `pnpm plan:check` passes.
2. Change `sdlc-mode/SKILL.md`. Check: `git grep -n -E "\*\*Steps|progress note|Answer the question above" plugins/sdlc/source/skills/sdlc-mode/SKILL.md` finds nothing.
3. Change the four playbooks and `sdlc-help/SKILL.md`. Check: the same search over `plugins/sdlc/source/skills` finds nothing, and no file says that every question is asked in plain chat text.
4. Change `check-reply-shape.sh` and its cases. Check: the hook's self-tests pass, and each new blocking case fails against the hook of `origin/main`.
5. Add the two words to `tool-words.json`. Check: `pnpm plugin:sync` renders both `tool-words/` files with the new lines.
6. Change `setup-sdlc/SKILL.md`, `templates/base/SETUP.md`, and the plugin's `README.md`. Check: `git grep -n "setup-sdlc" -- templates/base/SETUP.md` shows `project` wherever the project's steps are meant.
7. Change and add the eval cases. Check: every case folder holds the files its siblings hold, and `pnpm plugin:check` passes.
8. Run `pnpm plugin:sync`. Check: `pnpm plugin:check` and `pnpm rules:check` pass.
9. Write the changeset. Check: `pnpm verify` passes in the root.
10. Generate a project of each stack of `src/stacks.ts` and run `pnpm verify` in each. Check: each exits 0.
11. Run the `verifier` subagent, push, and open the pull request.

## Risks

- The riskiest step is 2. `SKILL.md` governs every reply of every session, and a rule that reads two ways changes all of them. The eval cases of step 7 are written against it and are not run in this change, so a wrong reading shows only in real sessions.
- Step 4 can block replies that pass today, such as one that quotes a line starting with `**Steps`. The passing cases cover a reply that names **Steps** inside a sentence.
- Step 6 changes what `/setup-sdlc` does with no word. A person who relied on it for the project's steps now sends `/setup-sdlc project`. The changeset says so.
- Options not taken:
  - Translating the first-line labels: the hook reads them, and the spec's decision 1 keeps them.
  - A hook check on text written while the agent works: no hook reads it with certainty.
  - A second intent or pull request for the setup skill: the spec's decision 6 keeps one change.
  - Removing **Checks**: a reply keeps each check that did not pass.
  - Running the evals in this change: the engineer chose to write the cases and run them after the cost is known.

## Proof

1, 2: `SKILL.md`, "The parts of a reply" and "Done or not done"; the new eval case `question-reply-starts-with-waiting-for-you`; the hook case that passes a `**Waiting for you:**` first line.
3, 6: `SKILL.md`, "Reply shape"; the search of step 2; the new eval case `writes-no-text-between-tool-calls`.
4: `SKILL.md` step 2, unchanged in its task-list rule; review of the diff.
5: the hook case that blocks a `**Steps` line; the new eval case `reply-holds-a-step-line-and-no-steps`.
7, 8: `SKILL.md` step 6 and `intent.md` step 3; the renamed eval case `build-asks-a-round-through-the-picker`; the case `intent-asks-open-questions-in-plain-text`, which still refuses the picker for an open question.
9: `build.md` step 5; review of the diff.
10, 11: `SKILL.md`, the **Checks** rule; the new eval case `checks-count-passed-and-show-failures`.
12, 13, 14, 15: `SKILL.md`, "Reply shape" and "The parts of a reply"; review of the diff.
16: the hook's self-tests in `pnpm plugin:check`, with the four new cases.
17: the rendered `tool-words/claude-code.md` and `tool-words/cursor.md` after step 5.
18: the searches of steps 3 and 6.
19: the four new case folders and the renamed one exist and `pnpm plugin:check` passes. `pnpm evals:run` and `pnpm evals:run:write` are not run in this change; the pull request names this as unmet.
20: `pnpm plugin:sync`, then `pnpm plugin:check`.
21: `pnpm verify` in the root and in a generated project of each stack.
22: `.changeset/chat-reply-ux-2.md` holds `minor`; `pnpm verify` runs the changeset check.
23: `setup-sdlc/SKILL.md`; the changed eval cases of `setup-sdlc`.
24, 25: `SKILL.md` step 4; review of the diff.
Brand rule 4: the labels of requirements 1 and 16 are the same words in `SKILL.md`, the hook, and its cases; the search `git grep -n "Waiting for you" plugins/sdlc/source`.
