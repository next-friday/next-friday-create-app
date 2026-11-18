---
"@next-friday/create-app": minor
---

A generated project's gates change. A pull request no longer runs the end-to-end tests: they run on a push to `main`, after the merge, and the `triage` job reports a failure there on the merged pull request. Each stack's `Verify` workflow runs one job, `All Checks`. `pnpm check`, which `pre-push` runs, no longer builds or checks the format. Patch coverage fails under 80 percent. The SDLC loop starts only when a person types `/sdlc-mode`: `plan:check` no longer refuses a branch that changes code with no plan, the push hook that compared commits with the plan is removed, and `playbooks/small.md` is removed. `pr-triage.yml` and `.github/labeler.yml` are removed.
