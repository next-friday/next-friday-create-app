# Intent: Load the `sdlc` harness in every session, in every agent tool the team uses

Author: @joetakara (Developer Productivity). Status: accepted.

## Problem

- In a Claude Code cloud session, `/sdlc:sdlc-mode` answers "isn't a command here": the session loads no `sdlc` plugin.
- The cause is documented: "A cloud session doesn't install the plugins a repository turns on under `enabledPlugins`, including ones from the marketplaces it lists under `extraKnownMarketplaces`" ([Claude Code: Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md), "What carries over from your setup").
- So in every Claude Code cloud session, in this repository and in every generated project, none of the plugin loads: none of its eight skills, not the `verifier` subagent, and not its hooks.
- In a generated project, Cursor gets the plugin through one hook: `.cursor/hooks.json` runs `load-project-plugins.sh` on `workspaceOpen`, which returns `plugins/sdlc/cursor`. A session that does not run that hook has no plugin. This repository has no such hook; it lists its Cursor copy in `.cursor-plugin/marketplace.json`.
- The harness ships inside each project so that a team sets nothing up. That does not hold today for a person who works in a cloud session.

## Proposed outcome

- A person opens a project and starts the loop with `/sdlc-mode`, with nothing to set up for a person or for a project, in:
  - Claude Code: a cloud session started from the web, the mobile app, or the desktop app, and a local session in the desktop app, the terminal, or an IDE extension;
  - Cursor: the editor on a person's machine, and a cloud agent.
- Proposal: in any other agent tool, the agent finds the `sdlc-mode` skill from the path `AGENTS.md` names, and follows it.
- Every skill works the way it is meant to be used:

  | Skill                                                               | How it runs                                                                        |
  | :------------------------------------------------------------------ | :--------------------------------------------------------------------------------- |
  | `sdlc-mode`, `sdlc-help`, `sdlc-status`, `setup-sdlc`               | A person types `/sdlc-mode`, `/sdlc-help`, `/sdlc-status`, `/setup-sdlc`           |
  | `brand-policy`, `security-policy`, `compliance-policy`, `ux-policy` | The agent loads it when the work touches its area, and a person can type `/<name>` |

- Every path a skill or playbook opens resolves in those sessions, and a project's own policy still wins over the default policy.
- In Claude Code and in Cursor, the `verifier` subagent runs, and so do the hooks that check the reply shape, block a stop before the checks pass, check a push, and show the status. Another agent tool gets the skills and no hooks; the checks in `pre-push` and in CI apply to every person, whichever tool they use.
- The only exceptions are the two limits of Claude Code that **Constraints** names.
- The harness stays embedded in the project. The skills, playbooks, subagent text, and hook scripts keep one source, `plugins/sdlc/source/`; `pnpm plugin:sync` renders them into the folders each tool reads from the repository, in this repository and in `templates/base/`, and `pnpm plugin:check` fails on a stale copy.
- Every mention of `/sdlc:<skill>` in this repository and in `templates/` names the new command.
- The product owner decided:
  - The harness stays embedded in each project, and the plugin does not move to a repository of its own.
  - Claude Code and Cursor change together, in this one change.
  - The command is `/sdlc-mode`.
- Out of scope:
  - Listing the plugin in a public marketplace or directory.
  - Updating projects already generated; each takes the change through its own pull request.

## Affected users and systems

- Every person and agent that runs the loop in this repository or in a generated project. The product owner gives the team's tools as about 60% Claude Code, 30% Cursor, and 10% other agent tools.
- In the root: `plugins/sdlc/`, `scripts/sync-plugin.ts`, `package.json`, `.claude/`, `.cursor/`, both marketplace files, `.github/CODEOWNERS`, `AGENTS.md`, `CONTRIBUTING.md`, and `intent/README.md`.
- In `templates/`: the plugin copy, `.claude/`, `.cursor/`, the marketplace file, `scripts/check-plan.ts`, `SETUP.md`, and `intent/README.md` in `templates/base/`, and `AGENTS.md` in each stack.
- The workflows in `templates/base/.github/workflows/` that load the plugin with `--plugin-dir`.
- The `sdlc-plugin` intent, whose decision that the template enables the plugin as a local marketplace this intent replaces.
- The eval cases and `pnpm evals:run`, which load the plugin with `claude plugin eval`.

## Constraints

- What a Claude Code cloud session loads from the clone, from the same page: the repository's `.claude/skills/`, `.claude/agents/`, and `.claude/commands/` ("Part of the clone"), and `.claude/settings.json` hooks "in a session with one repository".
- A skill at `.claude/skills/<name>/SKILL.md` runs as `/<name>`, and "Skills can include multiple files in their directory" ([Claude Code: Skills](https://code.claude.com/docs/en/skills.md)).
- A plugin skill and a project skill with the same name both load, as `/<plugin>:<skill>` and `/<skill>` (same page), so a session must not get both.
- Two limits of Claude Code that this change cannot lift:
  - A cloud session with several repositories "reads only the `enabledPlugins` and `extraKnownMarketplaces` keys from each repository's `.claude/settings.json`, not permission rules, hooks, `env`, or other keys" ([Claude Code: Settings](https://code.claude.com/docs/en/settings.md)), so the hooks do not run there.
  - A cloud thread in a Claude project loads neither the skills nor the hooks: "In a project's cloud thread, skills committed to a repository's `.claude/skills/` aren't available" ([Claude Code: Skills](https://code.claude.com/docs/en/skills.md)), and there "none of a repository's `.claude/settings.json` permission rules, hooks, or `env` apply, however many repositories the project has" ([Claude Code: Settings](https://code.claude.com/docs/en/settings.md)).
- The two rendered copies of the skills differ in two files, `sdlc-mode/SKILL.md` and `setup-sdlc/SKILL.md`, by the six tool words in `plugins/sdlc/adapters/tool-words.json`.
- `.claude/settings.json` and `.cursor/hooks.json` are protected paths (`scripts/check-agent-gates.ts`), and `.claude/settings.json` denies an agent's edit to both and to `.cursor/hooks/`: a person commits the change to them.
- Releasing it publishes a new version of `@next-friday/create-app` to npm. The command changes in `templates/`, and "A template change is therefore `patch` or `minor`, never `major`" (`.changeset/README.md`).
- The human gates stay as they are.

## Open questions

- Three claims about Cursor are not confirmed from its documentation; the spec checks each:
  - `workspaceOpen` "is an IDE lifecycle hook and doesn't apply to cloud agents", which would mean a Cursor cloud agent has no plugin today.
  - Cursor reads project skills from `.agents/skills/`, `.cursor/skills/`, and `.claude/skills/`.
  - A Cursor cloud agent runs the hooks in the repository's `.cursor/hooks.json`.
- Whether one copy of the skills can serve every tool, and whether Cursor shows a skill twice when two of the folders it reads hold it.
- Who confirms the outcome in Cursor before the release: no check in this repository runs Cursor.
- Which tools the other 10% of the team use, and whether each reads `AGENTS.md`.
- Whether hooks from `.claude/settings.json` run in a Claude Code cloud session with one repository, as the documentation says. The build tests it in a cloud session before the release.
- Whether the `verifier` subagent loads from `.claude/agents/` in a cloud session; the same test shows it.
- Whether the agent still loads the four policy skills by itself from a project folder, as it can from the plugin.
- Whether the hook scripts, which read `${CLAUDE_PLUGIN_ROOT}` and `${CURSOR_PLUGIN_ROOT}` today, work from the project's own folders.
- Whether the CI jobs can run `/sdlc-mode` from the project's skills in a non-interactive run, or keep `--plugin-dir`.
- Whether `claude plugin eval` and `pnpm evals:run` still need a plugin directory.
