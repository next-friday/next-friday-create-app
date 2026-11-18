---
"@next-friday/create-app": minor
---

The SDLC loop acts only in a session where a person typed `/sdlc-mode`, and the sdlc plugin lives in its own folder.

Breaking for a generated project:

- `pnpm plan:check`, `pnpm bands:check`, and `pnpm loop:measure` are removed. `scripts/check-plan.ts`, `scripts/check-bands.ts`, and `scripts/measure-loop.ts` move to `.claude/skills/sdlc-mode/scripts/`. `pre-push` and CI no longer run the plan check.
- The loop's hooks are declared in the frontmatter of `.claude/skills/sdlc-mode/SKILL.md`, and `.claude/settings.json` holds none of them. They run from the call of `/sdlc-mode` to the end of the session. After a resumed session, type `/sdlc-mode` again.
- The skill's push hook runs the plan check before a `git push`. It refuses a branch that changes an intent or a spec and code with no plan.
- Every `.cursor/` folder is removed. The harness supports Claude Code only.
- `playbooks/small.md` is removed. `pr-triage.yml` and `.github/labeler.yml` are removed.

Also changed: each stack's `Verify` workflow runs one job, `All Checks`. `pnpm check`, which `pre-push` runs, no longer builds or checks the format. Patch coverage fails under 80 percent.
