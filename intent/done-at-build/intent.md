# Intent: The build pull request marks its change done

Author: @joetakara (Developer Productivity). Status: done.

## Problem

- `playbooks/build.md` step 8 says the pull request that meets the last requirement of a spec sets `Status: done.` in its `intent.md` and `spec.md`, and step 7 puts the whole build in one pull request. So every build pull request should mark its change done.
- Nothing checks it. The agent forgot it in #245 and again in #251, and each time a second pull request set the line after the merge: #248, and #253, which is open.
- Until that second pull request merges, the files on `main` say `accepted` for a change that is built, which is the stale status the product owner asked to remove (`intent/consumer-first-project-gaps/spec.md`, area of concern 7: "The status must change automatically").

## Proposed outcome

- `pnpm plan:check` fails a branch that adds or changes a `plan.md` beside a `spec.md` and changes a file outside `intent/`, unless the branch also sets `Status: done.` in that folder's `intent.md` and `spec.md`. The message names both files.
- So the status says `done` the moment the build pull request merges, with no second pull request.
- Out of scope: fix plans, which have no intent or spec; and branches that change only files under `intent/`.

## Affected users and systems

- Every generated project and this repository: `plugins/sdlc/source/scripts/check-plan.ts`, rendered to `templates/base/scripts/check-plan.ts`.
- The `sdlc` plugin: `playbooks/build.md` step 8.
- npm: the change publishes a new version of `@next-friday/create-app`.

## Constraints

- A change built over more than one pull request is not allowed by `build.md` step 7, so the rule may assume one build pull request per change.

## Open questions

- When a build leaves a requirement unmet, should the check still demand `done`? Proposal: yes. The pull request reports the unmet requirement, and the product owner decides at the merge, as #248's description records for `consumer-first-project-gaps`.
