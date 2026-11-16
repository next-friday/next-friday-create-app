---
"@next-friday/create-app": minor
---

In a generated project, each role of the `sdlc` harness has its own default reasoning effort: `main` on `sonnet` at `high`, `explore` on `haiku` at `xhigh`, and `advise` on `opus` at `medium`. `/setup-sdlc` offers the budget `balanced`, which keeps those efforts, as its first and recommended choice; `unlimited`, `large`, `medium`, and `small` still set one effort for every role. With no models rule, `/sdlc-mode` starts each subagent at its role's default effort instead of `xhigh`.
