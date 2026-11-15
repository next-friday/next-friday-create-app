---
"@next-friday/create-app": patch
---

In a generated project, `pnpm plan:check` fails a branch that adds or changes a plan beside a spec and changes code, unless the folder's `intent.md` and `spec.md` say `Status: done.`, so a change is marked done by the pull request that builds it. The `sdlc` plugin's build playbook sets that status before the first push and names any unmet requirement in the pull request description.
