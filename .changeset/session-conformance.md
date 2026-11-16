---
"@next-friday/create-app": patch
---

A session of `/sdlc-mode` now waits for a subagent's report in one call: a generated project sets `CLAUDE_CODE_FORK_SUBAGENT` to `"0"` in `.claude/settings.json`, and `SETUP.md` says how a person removes it. The session does not poll, sleep, or message a subagent. A new role, `review`, runs the review of a pull request's diff, and a pull request that changes only files under `intent/` gets no agent review.

`pnpm verify` and `pnpm check` end with one line for each step and its result. The `pre-push` hook runs `pnpm plan:check` and `pnpm format:check` for a push that changes only documents, and `pnpm check` otherwise; in the `turborepo` stack it runs only the affected apps. `rules:check` leaves `pre-commit`.

`Done.` needs a result read in the same turn for every requirement of the change. A check that could not run, a skipped CI job, and a run in progress each keep the reply at `Not done:`. The interview asks the problem, its reason, and what is out of scope as open questions, and asks choices in numbered rounds in plain chat text.

In the `turborepo` stack, `pnpm dev` and `pnpm start` pass `--concurrency=10`, so a fourth app starts.
