---
"@next-friday/create-app": patch
---

A pull request that changes only files under `intent/` runs the format check alone in CI, without the rule and agent gate checks. In the `payload` and `turborepo` stacks, CI starts PostgreSQL only when the checks that need it run.
