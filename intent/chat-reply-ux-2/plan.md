# Plan: Make the chat light to read, and move process state into the tool's interface

Accepted by: @joetakara.

## Files that change

Paths are under `plugins/sdlc/` unless they start at the root.

- `source/skills/sdlc-mode/SKILL.md` (changed): step 3 lets a shell command or a script make a change that repeats in many places. Step 2 keeps the task list and no longer puts steps in the reply. Step 4 writes the models rule when none exists. Step 6 asks an open question in plain text and a choice through the picker. The reply shape gains `**Waiting for you:**` as a first line, the step line, and the rules on language, numbering, risks, and totals under **Checks**, and loses **Steps**, the progress note, and the fixed English **Now** sentence.
- `source/skills/sdlc-mode/playbooks/maintain.md` (changed): a dismissal is a merge, never a closed pull request.
- `source/skills/sdlc-mode/playbooks/question.md`, `fix.md`, `small.md` (changed): the rules the note under **Risks** lists.
- `source/skills/sdlc-mode/playbooks/intent.md`, `build.md`, `design.md`, `review.md` (changed): each sentence on **Steps**, the picker, or a round in plain text follows the new rules. `build.md` step 5 names the plan approval. `deploy.md` names none of them and stays as it is.
- `source/skills/setup-sdlc/SKILL.md` (changed): `/setup-sdlc` does steps 1 to 5 and stops. Steps 6 to 8 run on `/setup-sdlc project`.
- `source/skills/sdlc-help/SKILL.md` (changed): describes the new reply and the two forms of `/setup-sdlc`.
- `source/hooks/check-reply-shape.sh` (changed): reads `**Waiting for you:**` as a first-line label and blocks a line that starts with `**Steps`. Its message on a missing **Checks** section words the new rule.
- `source/hooks/check-reply-shape.cases.json` (changed): a blocking case and a passing case for each of the two.
- `/scripts/sync-plugin.ts` (changed): a hook case can hold a transcript, which the runner writes to a file and names in the case input.
- `adapters/tool-words.json` (changed): the words `question-picker` and `task-list` for each agent tool.
- `README.md` (changed): the first-line labels the reply check reads, and its check on a **Steps** section. It does not name `/setup-sdlc` and gains no sentence on it.
- `adapters/claude-code/evals/sdlc-mode/` (changed, new): the cases that expect a plain-text round for a choice or a **Steps** section follow the new rules. Three new cases, for requirements 1, 3, and 5. Requirement 7 has no case: the eval runner offers a session no question picker, and the two cases that tested the build interview are removed with the rule they tested.
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
- The file rule of `SKILL.md` step 3 changes too, on the product owner's word after the spec merged: "Add this matter: allow `sed`, allow a script" (translated from Thai). A session that had to make the same change in about a thousand places did it one edit at a time, because the rule allowed the shell only for a generator and `git mv`. The rule now tells the agent to reach first for a shell command or a script and to write by hand only what no command can produce, lets one command make a change that repeats, asks for a read of the diff after it, and keeps the files reserved for a person out of the shell's reach. The spec is on the default branch and is not rewritten, so this plan holds the change. It could let a wrong pattern change many files at once; the read of the diff is the check.
- More rules change on the product owner's word after the spec merged: "Hunt for the bad rules, and compare them with the book. Where the book says to do it, keep it" and "Fix all of them" (translated from Thai). The book is the AI-native SDLC playbook the harness follows. A reader with a fresh context read all of it against the harness, and these rules had no backing in it:
  - one `diff` command had to go to a subagent;
  - a draft, a spec, or a plan was shown whole again after each correction;
  - the engineer had to say the files, the order, the tests, and the options ruled out before a plan was written, where the book has the agent write the plan and the engineer correct it;
  - a named file was read whole before any search;
  - three **Request** lines came before the first tool call;
  - each task-list item copied a playbook sentence word for word;
  - the checks CI runs were run again before the push;
  - a fix reply listed every candidate cause it ruled out;
  - a build, a fix, and a small change read all four policies, where the book asks for them at design and at review. A build now reads the policies the spec says apply, and a fix or a small change reads the ones the change touches.
- `maintain.md` step 6 no longer lets the service owner close a pull request to dismiss a finding. The book dismisses that way, and the product owner decided that the company's rule comes first: "Follow the company's rule. Never close a pull request" (translated from Thai). A dismissal is a merge of the intent with `Status: rejected.` and the reason.
- Two more rules change on the product owner's word, after another session listed what slowed it: "Fix 2 and 5" (translated from Thai).
  - `intent.md` step 3 made the agent interview a person whose request already stated its outcome. It now goes to the draft when the request and the repository give the five things, and asks only for what is missing. The book has the originator describe the problem, the agent write the intent, and the originator correct it.
  - `check-reply-shape.sh` asked for **Checks** whenever a file changed during a turn, also when the person changed it. In Claude Code it now reads the transcript that the hook input names, and asks only when the agent ran a tool that can write a file. `scripts/sync-plugin.ts` gives a hook case a transcript. With no transcript, as in Cursor, any change still counts.
- Requirement 10 is not built as the spec words it. The book says to "show the output" of the checks and to "paste the output", so **Checks** keeps each command and the lines of its output that show the result, as before this change.
- Options not taken:
  - Translating the first-line labels: the hook reads them, and the spec's decision 1 keeps them.
  - A hook check on text written while the agent works: no hook reads it with certainty.
  - A second intent or pull request for the setup skill: the spec's decision 6 keeps one change.
  - Removing **Checks**: a reply keeps each check that did not pass.
  - Running the whole eval suite in this change: the engineer chose to run only the cases this change adds or changes, once each, after the cost of one run was known.

## Proof

1, 2: `SKILL.md`, "The parts of a reply" and "Done or not done"; the new eval case `question-reply-starts-with-waiting-for-you`; the hook case that passes a `**Waiting for you:**` first line.
3, 6: `SKILL.md`, "Reply shape"; the search of step 2; the new eval case `writes-no-text-between-tool-calls`.
4: `SKILL.md` step 2, unchanged in its task-list rule; review of the diff.
5: the hook case that blocks a `**Steps` line; the new eval case `reply-holds-a-step-line-and-no-steps`.
7, 8: `SKILL.md` step 6 and `intent.md` step 3; no eval covers a round through the picker; the case `intent-asks-open-questions-in-plain-text`, which still refuses the picker for an open question.
9: `build.md` step 5; review of the diff.
10: not built, as **Risks** says: **Checks** keeps each command and its result, as the book asks.
11: `SKILL.md`, the **Checks** rule; review of the diff.
12, 13, 14, 15: `SKILL.md`, "Reply shape" and "The parts of a reply"; review of the diff.
16: the hook's self-tests in `pnpm plugin:check`, with the four new cases.
17: the rendered `tool-words/claude-code.md` and `tool-words/cursor.md` after step 5.
18: the searches of steps 3 and 6.
19: the three new case folders exist and `pnpm plugin:check` passes. Twelve cases this change added or changed were run once each before the last rules changed; the pull request gives their results, and says which cases were removed or changed after that run. The whole suite, as `pnpm evals:run` and `pnpm evals:run:write` run it, was not run, and the pull request names this as unmet.
20: `pnpm plugin:sync`, then `pnpm plugin:check`.
21: `pnpm verify` in the root and in a generated project of each stack.
22: `.changeset/chat-reply-ux-2.md` holds `minor`; `pnpm verify` runs the changeset check.
23: `setup-sdlc/SKILL.md`; the changed eval cases of `setup-sdlc`.
24, 25: `SKILL.md` step 4; review of the diff.
The file rule: `SKILL.md` step 3, **Files**; review of the diff. No requirement of the spec covers it.
Brand rule 4: the labels of requirements 1 and 16 are the same words in `SKILL.md`, the hook, and its cases; the search `git grep -n "Waiting for you" plugins/sdlc/source`.
