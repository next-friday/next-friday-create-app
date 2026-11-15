---
"@next-friday/create-app": patch
---

In a generated project, `pnpm plan:check` accepts a plan with no intent and no spec only when its title ends in "(fix)" and the branch starts with `fix/`, as `playbooks/fix.md` says, and its message tells the person to start from an intent. An intent or spec added for a change that is already built may say `Status: done.` The `sdlc` plugin tells the agent to report a blocked gate instead of writing another artifact to get past it.
