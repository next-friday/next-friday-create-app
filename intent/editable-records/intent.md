# Intent: A record can be edited and deleted, and names no other organization

Author: @joetakara (Developer Productivity). Status: accepted.

"The book" below is the AI-native SDLC playbook the harness follows, cited by page.

## Problem

The product owner, translated from Thai:

- "Never refer to that project. It is a different project."
- "Open a new intent. This work must be done first."

The product owner decided that a record on the default branch can be edited and deleted.

What the repository shows (read on `origin/main`, `7e1c623`):

- Three records name a project generated from the starter, and two of them link to its repository: `intent/consumer-first-project-gaps/plan.md:46`, `intent/md-only-ci/intent.md:8`, `intent/subagent-role-models/plan.md:24` and `:35`. This repository is public.
- No rule says that a record names no other organization. `.agents/rules/descriptive-naming.md` forbids an organization's name in a path or an identifier only.
- `plugins/sdlc/source/scripts/check-records.ts` refuses a branch that deletes, moves, or changes a line of an intent, a spec, or a plan that the default branch holds, except a status word and a decision of a spec. `pre-push` and CI both run it, so nobody can take a name out of a record or delete a finished one.
- `intent/README.md` says of each change that "its record stays here".
- That rule came from the plan `intent/subagent-role-models/plan.md`: an agent had rewritten an intent and deleted a finished spec and plan to use a folder again. The plan cites no source for forbidding every change and every deletion.
- The book does not forbid it. Its audit trail is the chain of commits (page 7), and the evidence of an intent is "logged in the git history of the intent home" (page 13). A search of the book for delete, remove, archive, keep, and permanent finds no rule on a finished record.

## Proposed outcome

Everything in this section is a proposal, except the first bullet, which the product owner decided.

- A branch may change any line of an intent, a spec, or a plan that the default branch holds, and may delete it. Git history keeps every revision, as the book says (pages 7 and 13).
- `plugins/sdlc/source/scripts/check-records.ts` is deleted, and `plan:check` no longer runs it.
- New work still starts in a new folder: an agent does not rewrite a finished record to use its folder again. This stays a rule of the playbooks, with the eval case that tests it, and no script enforces it.
- A record names no other organization and links to no repository of a generated project. It says "a generated project".
- The three records that name the project lose the name in the same change.
- `intent/README.md` and the playbooks say these rules.

Out of scope:

- Rewriting git history. The name stays in earlier commits and in the pages of merged pull requests.
- Deleting finished folders. Each team decides when to clean its `intent/` folder.

## Affected users and systems

- People: everyone who writes or reviews a record, in this repository and in every generated project.
- Systems: `plugins/sdlc/source/scripts/check-records.ts` and its rendered copies; the `plan:check` script of the root `package.json` and of each stack's `package.json`; `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` and the playbooks `intent.md`, `design.md`, `build.md`, `fix.md`; `intent/README.md` and `templates/base/intent/README.md`; the three records named above.

## Constraints

- The script is rendered into `templates/`, so the change needs a changeset. Merging the release pull request that follows publishes `@next-friday/create-app` to npm.
- With the script gone, only the playbooks' rule and its eval case stand between an agent and the rewriting of a record whose work is open.
- This intent, its spec, and its plan name no other organization.

## Open questions

- Whether a check can refuse another organization's name without holding a list of names.
- Whether `intent/fast-merge-feedback` waits for this change. Its spec is in pull request 290, which is open.
