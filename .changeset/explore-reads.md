---
"@next-friday/create-app": patch
---

The `explore` rule of 10.1.1 now leaves out the read of four or more files. It names a search across the tree whose hits the session would read, and a comparison of two directories or two branches other than the session's own diff. The session still reads the files it needs to answer or to edit.

The push hook no longer asks for a review of every commit before a push; the review stays at the pull request (`.claude/skills/sdlc-mode/playbooks/review.md`). A hook that asks for a commit or a push no longer lifts a gate.

The rule `agent-owned-work` is removed from every generated project, with its entry in `.agents/rules.json`: it told the agent never to ask a person, so the agent took the step it could do alone over the step the person had ordered.

The `advise` subagent no longer reviews every plan and every finished change: it runs only when a check fails twice or two designs compete. `/sdlc-mode` reviews a pull request once, reports its URL, and stops; it drives the pull request to green only when a person asks. The session runs the `verifier` once when the work is done.

`pnpm plan:check` now also fails a branch that deletes an intent, a spec, or a plan of the default branch, moves one, or changes a line of one in more than its status word, a spec's `Decision:` lines excepted (`scripts/check-records.ts`). In the `turborepo` stack, `pnpm dev` starts both apps: `turbo.json` sets `concurrency` to 3. `/sdlc-help` names `small.md` and `fix.md` by paths that exist, and the session-start status no longer lists a change whose status is `replaced`. The text of `/sdlc-mode` and its playbooks is rewritten as one instruction per sentence. A `Proof` line of a plan starts with its requirement number.

The playbook that writes an intent is now `playbooks/intent.md`, not `playbooks/plan.md`: `plan.md` names only the build plan. The four policy skills are no longer started by the model on its own; `/sdlc-mode` reads each one by its path.

A generated project has a new command, `pnpm harness:check <version>`. It generates the reference project of that create-app version and fails when a harness file of the project is missing or differs from it, so a sync that leaves a file behind is caught by a script. `.agents/harness.json` names the stack, the harness paths, and the files the project keeps as its own.

The reply-shape hook (`.claude/skills/sdlc-mode/hooks/check-reply-shape.sh`) looks for changed files only in the project's folder. In a project that is a folder of a larger repository, a file that changed anywhere in that repository made the hook ask for **Checks** and send the reply back. `pnpm plan:check` passes in such a project, where `scripts/check-records.ts` used to fail because it found the outer repository's `origin` and no `origin/main`.
