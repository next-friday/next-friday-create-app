---
"@next-friday/create-app": minor
---

A generated project's gates change. Each stack's `Verify` workflow runs one job, `All Checks`. `pnpm check`, which `pre-push` runs, no longer builds or checks the format. Patch coverage fails under 80 percent. The SDLC loop starts only when a person types `/sdlc-mode`: `plan:check` refuses a branch that changes code with no plan only when it also changes an intent or a spec, the push hook that compared commits with the plan is removed, and `playbooks/small.md` is removed. `pr-triage.yml` and `.github/labeler.yml` are removed.
