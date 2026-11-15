# Spec: Name the plugin `sdlc` and its marketplace `next-friday-plugins`

From `intent/plugin-names/intent.md`. Status: done.

Request: "fix(repo): name the plugin sdlc". Skills at unknown.

## Requirements

1. `plugins/friday/` moves to `plugins/sdlc/`, with its source, adapters, eval cases, and README.
2. Every path in `scripts/sync-plugin.ts`, `package.json`, `scripts/check-changesets.ts`, `.github/CODEOWNERS`, and both marketplace files reads `plugins/sdlc`.
3. The plugin name in `scripts/sync-plugin.ts` and in the rendered `plugin.json` of both adapters is `sdlc`.
4. Both marketplace files name the marketplace `next-friday-plugins` and the plugin entry `sdlc`.
5. `.claude/settings.json` names the marketplace `next-friday-plugins` in `extraKnownMarketplaces` and enables `sdlc@next-friday-plugins`.
6. The front-door skill lives in `plugins/sdlc/source/skills/sdlc-mode/` with `name: sdlc-mode`, and the commands are `/sdlc:sdlc-mode` and `/sdlc:sdlc-help`.
7. `AGENTS.md`, `CONTRIBUTING.md`, `intent/README.md`, `intent/sdlc-plugin/`, and the plugin's README, skills, and eval cases use the new commands and name the `sdlc` plugin.
8. `sdlc-help` and the four policy skills keep their names.
9. `pnpm plugin:sync` changes nothing further, and `claude plugin validate .` and `claude plugin validate plugins/sdlc/adapters/claude-code` pass.
10. `pnpm pack --dry-run` ships the same file list as before.
11. `pnpm verify` exits 0.

## Design

- Pull request #160 moved the folder, changed every path, command, and prose name, and changed the plugin name, both marketplace files, and `.claude/settings.json` in one commit.
- Pull request #160 named the front-door skill `sdlc`, with the command `/sdlc:sdlc`.
- Pull request #165 moved `plugins/sdlc/source/skills/sdlc/` to `plugins/sdlc/source/skills/sdlc-mode/` and changed every path, command, and mention of the skill.
- In `intent/sdlc-plugin/`, the sentence on the plugin's name and the brand lines that named the organization in the plugin's name say that `sdlc` holds no organization name.

## Policies

- **Brand:** Does not apply. The plugin is development tooling; the change shows no user-visible text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change renames development tooling, not the application, so it touches no chapter (security rule 1).
- **Compliance:** Does not apply. The change collects, stores, shows, sends, or deletes no data about a person (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **The plugin name.** The name `next-friday` would repeat the organization in the command, and an identifier holds no organization name.
   Decision: name the plugin `sdlc`.
2. **The names change together.** `pnpm plugin:check` compares the names in the repository with `.claude/settings.json`.
   Decision: the plugin name, both marketplace files, and `.claude/settings.json` changed in one commit.
3. **`.github/workflows/release.yml` names `plugins/friday/CHANGELOG.md`.** It is a guarded file.
   Decision: leave it to a person; it is the only file that still names a `plugins/friday` path after #160.

## Open questions

None
