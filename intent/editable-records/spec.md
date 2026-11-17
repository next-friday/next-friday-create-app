# Spec: The harness enforces nothing the book does not say about a record

From `intent/editable-records/intent.md`. Status: accepted.

Request: "Write" (translated from Thai), the product owner's order after the merge of the intent's pull request, when told that the spec is the next step. Skills at `79ddc45`.

A record is an `intent.md`, a `spec.md`, or a `plan.md` under `intent/`. "The book" is the AI-native SDLC playbook the harness follows, cited by page. A stack is one of `nestjs`, `nextjs`, `nodejs`, `payload`, `turborepo` under `templates/`.

## Requirements

The check:

1. `plugins/sdlc/source/scripts/check-records.ts` and its rendered copy `templates/base/scripts/check-records.ts` are deleted.
2. The `plan:check` script of the root `package.json` and of each stack's `package.json` runs `check-plan.ts` only.
3. A branch that changes a line of a record of the default branch, or deletes the record, passes `pnpm plan:check`, `pre-push`, and CI.

The rules:

4. `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` loses the sentence that starts "Never delete or rewrite an `intent.md`, `spec.md`, or `plan.md` that is on the default branch" (line 76), with the two sentences that follow it on that line.
5. `intent/README.md` and `templates/base/intent/README.md` lose the words "and its record stays here" (line 3). The sentence on git history stays.
6. `plugins/sdlc/README.md` line 68 loses the clause on a branch that deletes, moves, or rewrites a record, and no file outside `intent/` and `CHANGELOG.md` names `check-records`.
7. The eval case `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/new-round-gets-a-new-intent-folder/` is deleted, as the intent says.
8. The change adds no rule, check, or hook on another organization's name in a record.

This repository's records:

9. `intent/consumer-first-project-gaps/plan.md` line 46 says "a private generated project (403)" where it names the project.
10. `intent/md-only-ci/intent.md` line 8 says "In a generated project, pull request #10" where it names the project.
11. `intent/subagent-role-models/plan.md` line 24 says "a generated project deleted" where it links to the project's pull request, and line 35 says "as one generated project does" where it links to the project.
12. `git grep -i` for the project's name over the tree finds nothing.

Delivery:

13. `pnpm plugin:sync` renders the changed skill into `plugins/sdlc/adapters/`, `.claude/skills/`, and `templates/base/`, and `pnpm plugin:check` and `pnpm rules:check` pass.
14. `pnpm verify` passes in the root and in a generated project of each stack of `src/stacks.ts`.
15. `pnpm evals:run` and `pnpm evals:run:write` are run and their scores reported, as `AGENTS.md` says for a change to a skill. The cost is told to the product owner before they run.
16. The change has one changeset for `@next-friday/create-app`. **Proposal:** `patch`, because a generated project loses a check and no CLI argument, prompt, or stack name changes. The package is at `10.3.0`; merging the release pull request that follows publishes `10.3.1` to npm.
17. The build's pull request sets `Status: done.` in this folder's `intent.md` and `spec.md`.

## Design

**Proposal:** the change is not higher risk. It deletes one script and four sentences, and changes no CLI argument, prompt, or stack name.

- `plugins/sdlc/source/scripts/check-records.ts`, `templates/base/scripts/check-records.ts`: deleted.
- `package.json` line 55 and each stack's `package.json` (`nestjs` line 31, `nextjs` 28, `nodejs` 27, `payload` 33, `turborepo` 32): `plan:check` loses `&& node …/check-records.ts`.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`: requirement 4. `pnpm plugin:sync` renders it.
- `intent/README.md`, `templates/base/intent/README.md`, `plugins/sdlc/README.md`: requirements 5 and 6.
- The eval case folder of requirement 7: deleted.
- The three records of requirements 9 to 11: four lines change. Today the record check refuses that, so the build deletes the check in the same pull request.
- `.changeset/<name>.md`: requirement 16.

`check-plan.ts` does not change. It still checks each plan against the template and its spec.

The book's passages behind requirements 1 to 7:

- Page 7: "The chain of commits is also the audit trail: who asked for what, what the agent produced, and who approved it."
- Page 13: "The evidence is the committed intent.md, which lists the author, the timestamp and the full revision history. It's logged in the git history of the intent home."
- Page 13, the lagging indicator: "the number of changes made to the intent.md that are made after the first spec.md commit for the same change."

## Policies

- Brand: Does not apply. The change shows a user no text, colour, typeface, logo, or message.
- Security: Does not apply. The change touches no chapter of the standard: it removes a check on Markdown records and changes no code of an application.
- Compliance: Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- UX: Does not apply. The change has no user interface.

## Areas of concern

1. No policy. Two sentences of the playbooks speak of folders and are not named by the intent: `playbooks/intent.md` step 4 gives a later round of the same work its own folder, and `playbooks/design.md` step 1 stops when `spec.md` already exists. Neither forbids changing or deleting a record.

   Decision: both stay as they are. The intent removes only the sentences that forbid deleting or rewriting a record.

## Open questions

1. Whether a check can refuse another organization's name: the intent dropped it. Requirement 8 adds none.
2. Whether `intent/fast-merge-feedback` waits for this change: the product owner said "This work must be done first" (translated from Thai). This change is built first, and the spec of `fast-merge-feedback` stays in its open pull request.
