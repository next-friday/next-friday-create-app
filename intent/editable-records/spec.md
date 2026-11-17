# Spec: The harness enforces nothing the book does not say about a record

From `intent/editable-records/intent.md`. Status: accepted.

Request: "Write", the product owner's order after the merge of the intent's pull request, when told that the spec is the next step. Skills at `79ddc45`.

A record is an `intent.md`, a `spec.md`, or a `plan.md` under `intent/`. "The book" is the AI-native SDLC playbook the harness follows, cited by page. A stack is one of `nestjs`, `nextjs`, `nodejs`, `payload`, `turborepo` under `templates/`.

## Requirements

The check:

1. `plugins/sdlc/source/scripts/check-records.ts` and its rendered copy `templates/base/scripts/check-records.ts` are deleted.
2. The `plan:check` script of the root `package.json` and of each stack's `package.json` runs `check-plan.ts` only.
3. `plugins/sdlc/source/scripts/check-plan.ts` no longer refuses a record of the default branch whose status line changes to a word other than accepted, rejected, done, withdrawn, or replaced (lines 574 to 579 today). Its self-tests follow. Area of concern 1.
4. A branch that changes a line of a record of the default branch, or deletes the record, passes `pnpm plan:check`, `pre-push`, and CI.

The rules:

5. `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` loses the sentence that starts "Never delete or rewrite an `intent.md`, `spec.md`, or `plan.md` that is on the default branch" (line 76), with the two sentences that follow it on that line.
6. `intent/README.md` and `templates/base/intent/README.md` lose the words "and its record stays here" (line 3). The sentence on git history stays.
7. `plugins/sdlc/README.md` line 68 loses the clause on a branch that deletes, moves, or rewrites a record, and no file outside `intent/` and `CHANGELOG.md` names `check-records`.
8. The eval case `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/new-round-gets-a-new-intent-folder/` is deleted, as the intent says.
9. `playbooks/intent.md` step 4 says only that `<change>` is a short kebab-case name. It loses the words "for a folder that does not exist yet" and the sentence that gives a later round of the same work its own folder. A later round of the same change may revise the `intent.md` that is there.
10. `playbooks/design.md` step 1 loses the condition that the intent has no `spec.md` beside it, and its case "`spec.md` already exists". When the folder holds a `spec.md`, the agent revises that file from the intent and goes on with the playbook.
11. The change adds no rule, check, or hook on another organization's name in a record, and none on the language of a record.

This repository's records:

12. `intent/consumer-first-project-gaps/plan.md` line 46 names the project today. It changes to "a private generated project (403)".
13. `intent/md-only-ci/intent.md` line 8 names the project today. It changes to "In a generated project, pull request #10".
14. `intent/subagent-role-models/plan.md` line 24 links to the project's pull request today, and changes to "a generated project deleted". Line 35 links to the project today, and changes to "as one generated project does".
15. `git grep -i` for the project's name over the tree finds nothing.
16. No file of the repository holds a Thai character. Today nine lines in eight records hold one: `intent/cloud-session-skills/spec.md`, `intent/consumer-first-project-gaps/spec.md` (two lines), `intent/done-at-build/intent.md`, `intent/done-at-build/spec.md`, `intent/loop-autonomy/spec.md`, `intent/md-only-ci/spec.md`, `intent/monorepo-apps/spec.md`, and `intent/plan-only-folders/spec.md`. Each Thai passage changes to its English translation.

Delivery:

17. `pnpm plugin:sync` renders the changed skill, playbooks, and script into `plugins/sdlc/adapters/`, `.claude/skills/`, and `templates/base/`, and `pnpm plugin:check` and `pnpm rules:check` pass.
18. `pnpm verify` passes in the root and in a generated project of each stack of `src/stacks.ts`.
19. `pnpm evals:run` and `pnpm evals:run:write` are run and their scores reported, as `AGENTS.md` says for a change to a skill. The cost is told to the product owner before they run.
20. The change has one changeset for `@next-friday/create-app`. **Proposal:** `patch`, because a generated project loses a check and no CLI argument, prompt, or stack name changes. The package is at `10.3.0`; merging the release pull request that follows publishes `10.3.1` to npm.
21. The build's pull request sets `Status: done.` in this folder's `intent.md` and `spec.md`.

## Design

**Proposal:** the change is not higher risk. It deletes one script, one rule of another script, and the sentences of requirements 5 to 10, and changes no CLI argument, prompt, or stack name.

- `plugins/sdlc/source/scripts/check-records.ts`, `templates/base/scripts/check-records.ts`: deleted.
- `package.json` line 55 and each stack's `package.json` (`nestjs` line 31, `nextjs` 28, `nodejs` 27, `payload` 33, `turborepo` 32): `plan:check` loses `&& node …/check-records.ts`.
- `plugins/sdlc/source/scripts/check-plan.ts`: requirement 3. Its other checks stay: each plan against the template and its spec, and the status a pull request writes in a file it adds.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`: requirement 5.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/intent.md` and `design.md`: requirements 9 and 10. `pnpm plugin:sync` renders the skill and the playbooks.
- `intent/README.md`, `templates/base/intent/README.md`, `plugins/sdlc/README.md`: requirements 6 and 7.
- The eval case folder of requirement 8: deleted.
- The records of requirements 12 to 14 and 16: four lines lose the project's name, and nine lines lose their Thai characters. Today the record check refuses that, so the build deletes the check in the same pull request.
- `.changeset/<name>.md`: requirement 20.

The book's passages behind requirements 1 to 10:

- Page 7: "The chain of commits is also the audit trail: who asked for what, what the agent produced, and who approved it."
- Page 13: "The evidence is the committed intent.md, which lists the author, the timestamp and the full revision history. It's logged in the git history of the intent home."
- Page 13, the lagging indicator: "the number of changes made to the intent.md that are made after the first spec.md commit for the same change."
- Page 17, the lagging indicator: "Count spec.md commits dated after the first plan.md commit for the same change."
- Page 20: "The plan and its revisions are logged along with who accepted it."

Requirements 12 to 16 are the product owner's orders for this repository and are no rule of the harness: "Never refer to that project" and "No Thai character in the repo".

## Policies

- Brand: Does not apply. The change shows a user no text, colour, typeface, logo, or message.
- Security: Does not apply. The change touches no chapter of the standard: it removes checks on Markdown records and changes no code of an application.
- Compliance: Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- UX: Does not apply. The change has no user interface.

## Areas of concern

1. No policy. `check-plan.ts` refuses a merged record whose status line goes back to `Status: draft.` or holds a word outside its list. That is a rule on changing a record, and the book does not give it: its only status word is `Status: draft.`, in the example on page 13. The product owner was asked whether it stays and has not answered.

   Decision: the rule leaves `check-plan.ts`, on the product owner's ruling in the intent that on what the book does not speak of "the harness must not enforce".

## Open questions

1. Whether a check can refuse another organization's name: the intent dropped it. Requirement 11 adds none.
2. Whether `intent/fast-merge-feedback` waits for this change: the product owner said "This work must be done first". This change is built first, and the spec of `fast-merge-feedback` stays in its open pull request.
3. The product owner decided that a later round of the same change does not go to a new folder: "Follow the book". Requirements 9 and 10 carry it.
