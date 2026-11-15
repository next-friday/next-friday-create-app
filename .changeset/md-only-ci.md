---
"@next-friday/create-app": patch
---

In a generated project, a pull request or a push to `main` that changes only Markdown under `intent/`, `.agents/`, `.claude/`, or `.cursor/`, or the root `AGENTS.md` or `REVIEW.md`, runs only the agent checks and formatting in a new `Agent Checks & Formatting` job, not the build, tests, or container image. A push to `main` now chooses its jobs from the files it changed. SAST and OSV-Scanner skip a change that touches only Markdown; Secret Scan still runs on every change.
