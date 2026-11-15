# Spec: The gate check and the eval runner leave the caller's repository alone

From `intent/gate-check-git-env/intent.md`. Status: done.

Request: "fix(repo): keep git hook env out of eval runs". Skills at unknown.

## Requirements

1. Each child `git` and each gate script that `scripts/check-agent-gates.ts` starts runs without the variables `git rev-parse --local-env-vars` lists.
2. `templates/base/scripts/check-agent-gates.ts` matches the root copy.
3. `templates/base/scripts/run-agent-evals.ts` runs its fixture commands and the agent command without the same variables.
4. `test/check-agent-gates.test.ts` runs the gate check with `GIT_DIR` set to a scratch repository and expects exit 0, with that repository's `HEAD` and branches unchanged.
5. `GIT_DIR=<scratch>/.git node scripts/check-agent-gates.ts` exits 0 and leaves the scratch repository unchanged.
6. In a generated `nodejs` project, `GIT_DIR=<scratch>/.git pnpm gates:check` exits 0 with the scratch repository unchanged.
7. `pnpm verify` exits 0 in the root and in a generated `nodejs` project.
8. The change adds no changeset, so no version of `@next-friday/create-app` waits for release.

## Design

- The scripts read the variable names from `git rev-parse --local-env-vars` and remove them from the environment each child process gets.
- The test went in before the fix and failed because `HEAD` moved.
- Pull request #153 added `.changeset/gate-check-git-env.md`; #162 removed it by the product owner's decision, and dropped its row from the plan.

## Policies

- **Brand:** Does not apply. The change shows no user-visible text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change touches development scripts, not the application, so it touches no chapter (security rule 1).
- **Compliance:** Does not apply. The change collects, stores, shows, sends, or deletes no data about a person (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **Which variables to remove.** Removing every `GIT_` variable would also drop settings the scripts may need.
   Decision: remove only the variables `git rev-parse --local-env-vars` lists, which is git's documented list.
2. **A person commits the gate check scripts.** The test fails until that commit lands, and the pre-push hook runs the tests.
   Decision: a person committed `scripts/check-agent-gates.ts` and its template copy from an issue that carries the exact text, and the test was pushed after that commit.
3. **The release of the template change.** The change touches `templates/`.
   Decision: the changeset was removed in #162, so nothing waits for release.

## Open questions

None
