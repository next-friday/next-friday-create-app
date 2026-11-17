---
"@next-friday/create-app": patch
---

A generated project's `sdlc` harness no longer refuses a change to an intent, a spec, or a plan that is merged, or its deletion. `pnpm plan:check` runs `check-plan.ts` only: the script `check-records.ts` is gone, a merged record may carry any status line, and a merged fix plan may change on any branch. The skill no longer forbids deleting or rewriting a merged record. A later round of the same change may revise the `intent.md` and the `spec.md` that are there, where the playbooks sent it to a new folder.
