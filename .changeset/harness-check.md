---
"@next-friday/create-app": patch
---

A generated project has a new command, `pnpm harness:check <version>`. It generates the reference project of that create-app version and fails when a harness file of the project is missing or differs from it, so a sync that leaves a file behind is caught by a script. `.agents/harness.json` names the stack, the harness paths, and the files the project keeps as its own.
