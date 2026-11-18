---
"@next-friday/create-app": minor
---

A generated project reviews every pull request in CI. The new `Claude review` workflow reads the diff, `REVIEW.md`, and the change's `spec.md` and `plan.md`, and posts the findings as one comment. It needs the `CLAUDE_CODE_OAUTH_TOKEN` secret. The `sdlc-mode` skill no longer reviews a diff in the session, and the models rule no longer has a `review` role.
