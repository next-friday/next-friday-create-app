---
"@next-friday/create-app": minor
---

A generated project's gates change. A pull request no longer runs the end-to-end tests: they run on a push to `main`, after the merge, and the `triage` job reports a failure there on the merged pull request. Each stack's `Verify` workflow runs one job, `All Checks`. `pnpm check`, which `pre-push` runs, no longer builds or checks the format. Patch coverage fails under 80 percent. A small defect takes the small playbook on a `small/fix-` branch, with its failing test committed first and no plan. `pr-triage.yml` and `.github/labeler.yml` are removed.
