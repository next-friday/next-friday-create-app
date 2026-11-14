# Intent: Only a bug fix may skip the intent and the spec

Author: @joetakara (Developer Productivity). Status: accepted.

## Problem

- `playbooks/fix.md` lets a bug fix skip the intent and the spec. Its folder holds only `plan.md`, its plan's title ends in "(fix)", and it is built on a `fix/` branch.
- `check-plan.ts` treats any folder with no `intent.md` and no `spec.md` as a fix plan. It checks neither the "(fix)" title nor the `fix/` branch, so any change can skip the intent and the spec by writing one `plan.md`.
- Agents use this gap. To pass the push hook, an agent wrote `intent/nextjs-monorepo/plan.md` in a consumer project: a new feature, with no "(fix)" title. Another agent then copied it as `intent/sync-template/plan.md`.
- This repository holds six folders with only `plan.md`, each titled "(fix)":
  - `changeset-check-bot-branch`
  - `gate-check-git-env`
  - `plugin-names`
  - `reply-shape-hook`
  - `reply-urls`
  - `sdlc-eval-gaps`

  Some are new behavior, not bug fixes. None of them records the problem or the requirements that a reader of the change would look for.

## Proposed outcome

- `pnpm plan:check` accepts a plan with no `intent.md` and no `spec.md` only when its title ends in "(fix)" and the branch starts with `fix/`. Any other plan with no spec fails, and the message says to start from an intent.
- When a gate blocks an agent, the agent does not reach for a different artifact that the gate accepts. It reports the block and the person's options instead.
- Each of the six folders gains an `intent.md` and a `spec.md`, written from its merged pull request and its plan, with `Status: done.`
- One pull request with one changeset.
- Out of scope: the consumer project's two folders (`nextjs-monorepo`, `sync-template`). That project is repaired after this change ships.

## Affected users and systems

- Every generated project and this repository: `plugins/sdlc/source/scripts/check-plan.ts`, rendered to `templates/base/scripts/check-plan.ts`.
- The `sdlc` plugin: `SKILL.md` and `playbooks/fix.md`.
- The six folders under `intent/`.
- npm: the change publishes a new version of `@next-friday/create-app`.

## Constraints

- A folder already on the default branch does not start failing on a branch that does not touch it.
- The intents and specs written after the fact hold only what the merged pull requests, their plans, and their commits show.

## Open questions

- Is the changeset a patch or a minor? Proposal: patch, because it corrects a check to match `playbooks/fix.md`.
- How does `check-plan.ts` read the branch in CI, where the checkout of a pull request has no branch name? Proposal: from `GITHUB_HEAD_REF`, as the plan rule already does; the spec confirms it.
