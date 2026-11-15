# Intent: The changeset check knows a dependency bot's pull request after a person updates its branch

Author: @joetakara (Developer Productivity). Status: done.

## Problem

`pnpm changesets:check` let a Dependabot pull request pass without a changeset only when the workflow run's actor was `dependabot[bot]`. When a person merges `main` into that branch, the next run's actor is the person. The check then fails on a change that is still only the bot's. Pull request #150 shows it: its runs on `6ea456c` and `58e9dcc` have the actor `joetakara` and fail. Built in #152.

## Proposed outcome

- The check decides from who wrote the branch, not from who started the run.
- A Dependabot branch that a person updated from `main` still needs no changeset.
- A person's own change on such a branch still needs one.
- Out of scope: asking Dependabot to recreate the pull request, because the next update by a person would fail again.
- Out of scope: the rule that every changed published path is a dependency file. It stays as it is.

## Affected users and systems

- `scripts/check-changesets.ts` in this repository, which `pnpm changesets:check` and `pnpm verify` run.
- People who update a Dependabot branch, and the dependency bot's pull requests.

## Constraints

- A person's commit on a bot's branch must still need a changeset.
- An author's name and email can be set by hand, so in a pull request run the check also needs Dependabot as the pull request's author, which GitHub sets.

## Open questions

None
