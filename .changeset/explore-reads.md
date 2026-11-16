---
"@next-friday/create-app": patch
---

In a generated project, `/sdlc-mode` sends exploration to the `explore` subagent, on `haiku` unless a models rule says otherwise, in every playbook step, `playbooks/question.md` included: a search across the tree whose hits the session would read, and a comparison of two directories or two branches other than the session's own diff. The session still reads the files it needs to answer or to edit. The session reads only the subagent's report, so the main model spends fewer tokens. With no models rule, a subagent takes the `Default effort` column of `/setup-sdlc` step 3, not an effort from that skill's step 5 example. Both rules are in `.claude/skills/sdlc-mode/SKILL.md` step 4.

In a generated project, every `**Result:**` line of `/sdlc-mode`, and an answer to whether the work is done, starts with `Done.` or `Not done:`. `Done.` needs every part of the request finished, merged where it goes through a pull request, with the proof read in that turn. `Not done:` names what is left and who does it, including a part that a spec, a plan, or the session set aside as a separate change. A notice that a pull request merged gets a `**Result:**` line, not `**No change:**`. The rule is in the reply shape of `.claude/skills/sdlc-mode/SKILL.md`.

The push hook no longer asks for a review of every commit before a push; the review stays at the pull request (`.claude/skills/sdlc-mode/playbooks/review.md`). A hook that asks for a commit or a push no longer lifts a gate.

The rule `agent-owned-work` is removed from every generated project, with its entry in `.agents/rules.json`: it told the agent never to ask a person, so the agent took the step it could do alone over the step the person had ordered.

The `advise` subagent no longer reviews every plan and every finished change: it runs only when a check fails twice or two designs compete. `/sdlc-mode` reviews a pull request once, reports its URL, and stops; it drives the pull request to green only when a person asks. The session runs the `verifier` once when the work is done.

`pnpm plan:check` now also fails a branch that deletes an intent, a spec, or a plan of the default branch, moves one, or changes a line of one in more than its status word, a spec's `Decision:` lines excepted (`scripts/check-records.ts`). In the `turborepo` stack, `pnpm dev` starts both apps: `turbo.json` sets `concurrency` to 3. `/sdlc-help` names `small.md` and `fix.md` by paths that exist, and the session-start status no longer lists a change whose status is `replaced`. The text of `/sdlc-mode` and its playbooks is rewritten as one instruction per sentence. A `Proof` line of a plan starts with its requirement number.

The playbook that writes an intent is now `playbooks/intent.md`, not `playbooks/plan.md`: `plan.md` names only the build plan. The four policy skills are no longer started by the model on its own; `/sdlc-mode` reads each one by its path.
