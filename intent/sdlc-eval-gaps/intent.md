# Intent: Close the gaps the plugin evals found on the default model

Author: @joetakara (Developer Productivity). Status: done.

## Problem

The plugin evals ran on `claude-sonnet-5-5`, the plugin's default model for the main session, and some cases failed. Each failed grader was compared with what the playbooks say. Some failures came from playbook text the model could read two ways. Others came from graders that asked for more than the playbooks say. The rest came from the eval sandbox. Built in #241.

## Proposed outcome

- The playbook text that the model read two ways says one thing.
- Each grader asks for what the playbooks say, and no more.
- The changed eval cases score higher on the default model than before.
- Out of scope: the cases that fail because the eval sandbox makes `.git` read-only.

## Affected users and systems

- People who use the `sdlc` plugin: `SKILL.md` and the playbooks `build.md`, `review.md`, and `fix.md`.
- Every generated project, which receives the plugin under `templates/base/plugins/sdlc/`.
- The eval cases in `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/`.
- npm: the change publishes a patch of `@next-friday/create-app`.

## Constraints

- A judge model scores some graders, so one run can differ from the next by a grader or two.
- The eval sandbox keeps `.git` read-only, so no branch can be created in it.

## Open questions

None
