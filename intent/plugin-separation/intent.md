# Intent: The sdlc plugin stays in its own folder, and acts only when a person calls it

Author: @joetakara (Developer Productivity). Status: accepted.

"The book" below is the AI-native SDLC playbook the harness follows, cited by page.

## Problem

The sdlc plugin and the repository are entangled, in this repository and in every generated project:

- `pnpm plugin:sync` copies six plugin scripts into `templates/base/scripts/`, beside the repository's own scripts.
- The repository calls the plugin's scripts itself. Each stack's `package.json` holds `plan:check` and `bands:check` inside `check` and `verify:static`, and `.husky/pre-push` and each stack's `ci.yml` run `pnpm plan:check`. A project is held to the loop's rules on every push, whether or not anyone started the loop.
- The plugin's hook entries sit in `.claude/settings.json`, a file a person commits. Each change to a plugin hook needs a person's commit.
- Three of the six scripts do no work of the loop: `run-checks.ts`, `changed-documents.ts`, and `check-harness.ts` serve the repository's build, push, and scaffold.
- The harness renders for a second agent tool, which doubles every hook, rule, and agent file.

The product owner decided:

- The loop starts only when a person types `/sdlc-mode`, as the front-door skills of other harnesses do. Outside it, nothing of the loop checks a push or a pull request: CI runs no plan check, and the code owner's review is the gate that remains (the book, pages 38 to 39).
- Once `/sdlc-mode` is called, the session is held to the playbooks.
- The harness supports Claude Code only. The second agent tool's files are removed.

## Proposed outcome

- Everything the plugin owns lives under `.claude/skills/` and `.claude/agents/`: its skills, playbooks, hooks, and the scripts `check-plan.ts`, `check-bands.ts`, and `measure-loop.ts`.
- The hooks of the loop are declared in the frontmatter of `sdlc-mode/SKILL.md`. Claude Code registers a skill's hooks when the skill is invoked and keeps them for the rest of the session ([Claude Code: Hooks in skills and agents](https://code.claude.com/docs/en/hooks.md#hooks-in-skills-and-agents)). `.claude/settings.json` holds no plugin hook.
- The playbooks run the plugin's scripts at the step that needs them. No `package.json` script, git hook, or workflow job of the repository runs `check-plan.ts`.
- `run-checks.ts`, `changed-documents.ts`, and `check-harness.ts` are the repository's own scripts.
- No file of the second agent tool remains, in this repository or in a generated project.

## Affected users and systems

- People: engineers in a generated project, who push without the loop's checks unless they called `/sdlc-mode`; the product owner and engineers who work in the loop.
- Systems: `plugins/sdlc/source/`, `plugins/sdlc/adapters/`, `scripts/sync-plugin.ts`, `scripts/sync-agent-rules.ts`, `scripts/check-agent-gates.ts`; `.claude/settings.json`, `.husky/pre-push`, `package.json`, and `ci.yml` in the root and in `templates/`; every `.cursor/` folder; `templates/base/.agents/hooks/`; the documents that name any of these.

## Constraints

- The work lands in the open pull request of `intent/fast-merge-feedback`, so one version goes out. The product owner's decision.
- The release is `minor`: a generated project loses `.cursor/`, `pnpm plan:check`, and `pnpm bands:check`. The product owner's decision.
- `spec-on-intent-merge.yml`, `claude-fix-loop.yml`, and `control-band.yml` stay in the template; `control-band.yml` runs `check-bands.ts` from the skill's folder. The product owner's decision.
- A trial in a scratch project on Claude Code 2.1.327 showed what a skill's frontmatter hooks do. They do not run in a session that did not call the skill. After the call they run on later turns, after `/compact`, can block `git push`, and can run a script in the skill's folder. They are gone after the session is resumed, and they do not run on a tool call a subagent makes. In a hook command of a project skill, `${CLAUDE_PROJECT_DIR}` resolves and `${CLAUDE_SKILL_DIR}` does not; in a plugin skill, `${CLAUDE_PLUGIN_ROOT}` resolves. The product owner accepted both gaps: after a resume the person types `/sdlc-mode` again.
- Files a person commits stay a person's to commit: `.claude/settings.json`, `.husky/**`, `.agents/hooks/**`, `.agents/rules/**` and its rendered copies, `scripts/check-agent-gates.ts`, `scripts/sync-agent-rules.ts`.
- An organization that locks hooks to plugins or to managed settings runs no hook of a project skill ([Claude Code: Limits on skill hooks](https://code.claude.com/docs/en/hooks.md#hooks-in-skills-and-agents)). `SETUP.md` says so.

## Open questions

- Whether the plan template stays stated twice, in `playbooks/build.md` and in `check-plan.ts`. The build decides it once the scripts have moved.
- How a project generated before this change moves to it. An issue for each such project follows the release.
