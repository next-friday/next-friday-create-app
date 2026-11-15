# Spec: Close the gaps the plugin evals found on the default model

From `intent/sdlc-eval-gaps/intent.md`. Status: done.

Request: "fix(plugin): close the eval gaps on the default model". Skills at unknown.

## Requirements

1. `SKILL.md` says that a task-list item and a **Steps** line hold each step's first sentence, copied word for word.
2. `SKILL.md` says that when a playbook step says to answer in a few lines and stop, the reply is those lines and the **Now** line, without **Request**, **Steps**, or **Checks**.
3. Step 3 of `playbooks/build.md` asks about the order of work and its tests only in a round after the files are settled.
4. Step 2 of `playbooks/review.md` starts the reviewer with the session's subagent tool, reads the diff again only when the session has no such tool, and says which of the two ran.
5. Step 4 of `playbooks/fix.md` shows the line `File: intent/<short-description>/plan.md` above the plan.
6. `pnpm plugin:sync` renders the changes into both adapters and `templates/base/plugins/sdlc/`, and `pnpm plugin:check` passes.
7. The Steps graders of `drafts-intent-and-waits-for-yes` and `interviews-before-writing-intent` ask for each step's first sentence.
8. `request-that-fits-no-row` has no grader that asks for a short reply.
9. In `drafts-intent-and-waits-for-yes`, `interviews-before-writing-intent`, `spec-for-unmerged-intent-stops`, and `statement-without-command-starts-no-work`, the branch-command pattern does not match `git branch --format`, `--sort`, or `--points-at`.
10. The scaffold of `statement-without-command-starts-no-work` writes an `AGENTS.md` that holds the rule every generated project's `AGENTS.md` has, on a problem reported without a command.
11. `pnpm verify` passes in the root and in a generated project of each stack, with `--deploy none` and with `--deploy railway`.
12. The pull request has one changeset of type `patch` for `@next-friday/create-app`.

## Design

- The playbook text lives in `plugins/sdlc/source/` and is rendered into the adapters and `templates/base/plugins/sdlc/`.
- Before the change, the `SKILL.md` rule said "the step", which the model read as either the whole step or its title.
- The build questions on order and tests depend on the files, so they come after the files are settled.
- The row of `request-that-fits-no-row` says to "answer what you can … and stop", not to be short, so its "reply is short" grader is deleted.
- The changeset publishes `@next-friday/create-app` 9.13.1.

## Policies

- **Brand:** Does not apply. The change edits playbook text and eval cases; it shows no brand text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change touches development tooling, not the application, so it touches no chapter (security rule 1).
- **Compliance:** Does not apply. The change collects, stores, shows, sends, or deletes no data about a person (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **A judge model scores some graders.** One run can differ from the next by a grader or two.
   Decision: compare one run per case before and after, with the same judge, `claude-haiku-5-5`, and two runs for two cases.
2. **Cases that fail in the eval sandbox.** Its `.git` is read-only, so no branch can be created.
   Decision: leave those cases unchanged.
3. **A grader that asks for more than the playbook says.**
   Decision: change the grader to match the playbook, or delete it when the playbook does not ask for it.

## Open questions

- `interviews-before-writing-intent` still fails its Steps and restatement graders, though the reply holds both blocks.
- `writes-spec-from-merged-intent` and `drafts-intent-and-waits-for-yes` vary from run to run; in the failing runs the model wrote the file outside the working directory or read a policy file from a path that does not exist.
- `build-continues`, `maintain`, and the push in `writes-spec` still fail, because the eval sandbox makes `.git` read-only.
