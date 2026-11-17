# Intent: The harness enforces nothing the book does not say about a record

Author: @joetakara (Developer Productivity). Status: done.

"The book" below is the AI-native SDLC playbook the harness follows, cited by page.

## Problem

The product owner, translated from Thai:

- "Never refer to that project. It is a different project."
- "Open a new intent. This work must be done first."

The product owner decided, translated from Thai: on what the book does not speak of, "the harness must not enforce". That covers deleting an intent, a spec, or a plan, and forbidding a change to a record that is merged. A rule on another organization's name in a record comes from each organization and its law, and is no rule of the harness.

What the repository shows (read on `origin/main`, `7e1c623`):

- Three records name a project generated from the starter, and two of them link to its repository: `intent/consumer-first-project-gaps/plan.md:46`, `intent/md-only-ci/intent.md:8`, `intent/subagent-role-models/plan.md:24` and `:35`. This repository is public.
- `plugins/sdlc/source/scripts/check-records.ts` refuses a branch that deletes, moves, or changes a line of an intent, a spec, or a plan that the default branch holds, except a status word and a decision of a spec. `pre-push` and CI both run it, so nobody can take a name out of a record or delete a finished one.
- `intent/README.md` says of each change that "its record stays here".
- That rule came from the plan `intent/subagent-role-models/plan.md`: an agent had rewritten an intent and deleted a finished spec and plan to use a folder again. The plan cites no source for forbidding every change and every deletion.
- The book does not forbid it. Its audit trail is the chain of commits (page 7), and the evidence of an intent is "logged in the git history of the intent home" (page 13). A search of the book for delete, remove, archive, keep, and permanent finds no rule on a finished record.

## Proposed outcome

The first two bullets are the product owner's decision. The rest is a proposal of how to carry it out.

- The harness enforces nothing on changing or deleting an intent, a spec, or a plan. The book counts the changes made to an `intent.md` after its spec is committed (page 13), and does not speak of deleting one.
- The harness holds no rule on another organization's name in a record.
- `plugins/sdlc/source/scripts/check-records.ts` is deleted, and `plan:check` no longer runs it.
- The sentences that forbid deleting or rewriting a merged record leave `SKILL.md`, the playbooks, and `intent/README.md`.
- In this repository, the three records that name the project lose the name. This is the product owner's order for this repository, and no rule of the harness.

Out of scope:

- Rewriting git history. The name stays in earlier commits and in the pages of merged pull requests.
- Deleting finished folders.

## Affected users and systems

- People: everyone who writes or reviews a record, in this repository and in every generated project.
- Systems: `plugins/sdlc/source/scripts/check-records.ts` and its rendered copies; the `plan:check` script of the root `package.json` and of each stack's `package.json`; `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` and the playbooks `intent.md`, `design.md`, `build.md`, `fix.md`; `intent/README.md` and `templates/base/intent/README.md`; the three records named above.

## Constraints

- The script is rendered into `templates/`, so the change needs a changeset. Merging the release pull request that follows publishes `@next-friday/create-app` to npm.
- With the script and the sentences gone, nothing in the harness stops an agent from rewriting a record whose work is open. The eval case that tests that rule goes with it.
- This intent, its spec, and its plan name no other organization.

## Open questions

- Whether `intent/fast-merge-feedback` waits for this change. Its spec is in pull request 290, which is open.
