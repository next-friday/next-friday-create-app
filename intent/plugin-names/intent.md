# Intent: Name the plugin `sdlc` and its marketplace `next-friday-plugins`

Author: @joetakara (Developer Productivity). Status: done.

## Problem

The plugin and its marketplace did not carry the names the product owner decided. A person typed the wrong command and enabled the wrong key. Built in #160; #165 named the front-door skill.

## Proposed outcome

- The plugin is `sdlc`, its folder is `plugins/sdlc/`, and its marketplace is `next-friday-plugins`.
- The plugin key is `sdlc@next-friday-plugins`.
- The front-door skill is `sdlc-mode`, and the commands are `/sdlc:sdlc-mode` and `/sdlc:sdlc-help`.
- The names follow `cursor/plugins`, where the plugin `pstack` installs as `pstack@cursor-plugins` and has the skills `poteto-mode` and `poteto-help`.
- Out of scope: renaming `sdlc-help` and the four policy skills.
- Out of scope: publishing anything. No file under `src/` or `templates/` changes.

## Affected users and systems

- People who run the plugin's commands or enable it in this repository.
- `plugins/sdlc/`, `scripts/sync-plugin.ts`, `scripts/check-changesets.ts`, `package.json` scripts, `.github/CODEOWNERS`, both marketplace files, and `.claude/settings.json`.
- `AGENTS.md`, `CONTRIBUTING.md`, `intent/README.md`, and `intent/sdlc-plugin/`.

## Constraints

- An identifier holds no organization name (`.agents/rules/descriptive-naming.md`).
- `pnpm plugin:check` compares the plugin and marketplace names with `.claude/settings.json`, so the names change in one commit.
- `.github/workflows/release.yml` is a guarded file that a person changes.

## Open questions

None
