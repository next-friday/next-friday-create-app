# Spec: The changeset check knows a dependency bot's pull request after a person updates its branch

From `intent/changeset-check-bot-branch/intent.md`. Status: done.

Request: "fix(repo): know a bot's branch after an update". Skills at unknown.

## Requirements

1. A branch counts as a dependency bot's when every commit on it that is not a merge has Dependabot's name and email as its author.
2. In a pull request run, the branch also needs Dependabot as the pull request's author, read from the run's event.
3. The check no longer reads the run's actor.
4. A Dependabot branch with a merge of `main` by a person needs no changeset.
5. Each of these still needs a changeset: one more commit by a person on the bot's branch, a person's pull request whose commits carry the bot's name, the bot's name with another email, and no commit author at all.
6. On the head of pull request #150 (`58e9dcc`), the check exits 0 when the run's actor is `joetakara` and Dependabot opened the pull request.
7. The self-tests of `scripts/check-changesets.ts` cover each case, and `pnpm verify` exits 0.

## Design

- `scripts/check-changesets.ts` reads the authors with `git log --no-merges --format="%an <%ae>" <merge base>..HEAD`.
- It reads the pull request's author from the file that `GITHUB_EVENT_PATH` names.
- It passes both to `findChangesetProblems` in place of `GITHUB_ACTOR`.

## Policies

- **Brand:** Does not apply. The change shows no user-visible text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change touches a repository check, not the application, so it touches no chapter (security rule 1).
- **Compliance:** Does not apply. The check reads commit authors only to compare them with Dependabot's, and stores, shows, or sends no data about a person (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **A hand-set author name and email.** Anyone can write Dependabot's name and email on a commit.
   Decision: in a pull request run the check also needs Dependabot as the pull request's author; outside a pull request run the commit authors alone decide.
2. **A merge commit by a person can carry its own change to a dependency file.** The check passes it.
   Decision: accept it. A change to any other published file still needs a changeset, and a person still reads the pull request before merging it.

## Open questions

None
