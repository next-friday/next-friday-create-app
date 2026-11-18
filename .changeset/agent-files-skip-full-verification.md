---
"@next-friday/create-app": patch
---

A pull request that changes only files under `.agents/` or `.claude/` no longer runs full verification in a generated project. It runs the agent checks and the format check, because lint, type checks, Knip, tests, and the build do not read those folders.
