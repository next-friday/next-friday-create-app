# Intent: The gate check and the eval runner leave the caller's repository alone

Author: @joetakara (Developer Productivity). Status: done.

## Problem

`pnpm gates:check` and the eval runner build scratch repositories with `git -C <temporary directory>`. A git hook exports `GIT_DIR`, and `git -C` does not override it. Under `pnpm verify` in the pre-push hook of a linked worktree, those commands ran against the repository that pushes. They added commits by "Gate Check", created the branch `fix/login-error`, and moved `HEAD` to it. Built in #153; #162 removed its changeset.

## Proposed outcome

- Each child `git`, each gate script, and the agent command run without the variables that tie a process to one repository.
- The caller's `HEAD` and branches stay as they were after a gate check or an eval run.
- Out of scope: removing every variable whose name starts with `GIT_`.

## Affected users and systems

- `scripts/check-agent-gates.ts` and its copy in `templates/base/scripts/`.
- `templates/base/scripts/run-agent-evals.ts`.
- Every generated project, which receives the template copies.
- People who push from a linked worktree.

## Constraints

- A gate under test still reads the branch of its own project directory with `git`.
- The list of variables comes from git itself, with `git rev-parse --local-env-vars`.

## Open questions

None
