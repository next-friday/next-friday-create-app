# Spec: A hook checks the reply shape of the sdlc-mode skill

From `intent/reply-shape-hook/intent.md`. Status: done.

Request: "fix(repo): check the reply shape with a plugin hook". Skills at unknown.

## Requirements

1. `plugins/sdlc/source/hooks/check-reply-shape.sh` is a POSIX `sh` script that reads the hook input with `jq`.
2. It acts only on a reply whose first non-blank line starts with `**Request:**`.
3. It blocks such a reply once, with one reason, when the reply names a pull request or an issue by number outside a URL, a fenced block, and a code span.
4. It blocks such a reply when it does not end with a `**Status:**` line.
5. It blocks such a reply when its **Request** line holds a URL and its **Status** line holds neither `Next: <URL>` nor "no next page".
6. It blocks such a reply when it holds a path from the machine's root.
7. It does nothing when the input says the session is already continuing from a stop hook.
8. The reason ends with "Send the whole reply again."
9. The Claude Code adapter runs the script from a `Stop` hook in `hooks/hooks.json`, through `sh` from `${CLAUDE_PLUGIN_ROOT}`.
10. The Cursor adapter runs the script from `afterAgentResponse` with `save`, which writes the reply text to a file named after the conversation under `${TMPDIR:-/tmp}/sdlc-reply-shape/`.
11. The Cursor adapter runs the script from `stop` with `followup` and `loop_limit` 1. It reads and deletes that file, and after a completed run with `loop_count` 0 it prints the same reason as a `followup_message`.
12. The Cursor `plugin.json` names `./hooks/hooks.json` in its `hooks` field.
13. `plugins/sdlc/adapters/hooks.json` lists the hooks of each tool, and `pnpm plugin:sync` renders each tool's hook config and script copy from it.
14. `pnpm plugin:check` reports a stale or orphan rendered hook file, runs `sh -n`, runs the script against `check-reply-shape.cases.json` with a private `TMPDIR` for each case, and reports a tool name in `source/hooks/`.
15. `plugins/sdlc/README.md` says the plugin ships the hook for both tools, what it checks, what the Cursor pair does, where it keeps its state file, and that it needs `jq`.
16. The plugin's skills, playbooks, and eval cases no longer state or grade the language of a reply.
17. `claude plugin validate plugins/sdlc/adapters/claude-code` passes, and `pnpm verify` exits 0.

## Design

- Pull request #171 added the script, the case table, the Claude Code render, and the checks in `scripts/sync-plugin.ts`.
- Pull request #172 added the `save` and `followup` arguments, the Cursor entry in `plugins/sdlc/adapters/hooks.json`, the Cursor render, and the cases for both arguments. Without an argument the script behaves as before.
- Pull request #173 removed the language clauses from `sdlc-mode/SKILL.md`, `sdlc-help/SKILL.md`, and the playbooks `plan.md`, `design.md`, `build.md`, `fix.md`, and `maintain.md`. It removed the `reply-is-in-thai` graders and the rubrics that graded language, and wrote the eval prompts in English.
- The checks and the reason exist once, in the script.

## Policies

- **Brand:** Does not apply. The hook checks the shape of an agent's reply in development tooling; it shows no brand text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change touches development tooling, not the application, so it touches no chapter (security rule 1).
- **Compliance:** Does not apply. The Cursor pair stores the agent's reply text, not data about a person, and the next `stop` deletes it (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **The hook runs on every reply of a session that enables the plugin.** Not every reply is a reply of the skill.
   Decision: act only when the first non-blank line starts with `**Request:**`, and block a reply at most once.
2. **`jq` may be missing.** Without it the script cannot read its input.
   Decision: without `jq` on the `PATH` the script exits 0 and checks nothing, and the README says it needs `jq`.
3. **The checks are patterns, not a parser.** Some wording sits near the edge, such as "issue 3 of the list".
   Decision: ship the patterns with their case table; a reply with a URL on its **Request** line and no page to open next passes only when its **Status** line says "no next page".
4. **Cursor's `stop` hook gets no reply text.**
   Decision: a pair of hooks; `afterAgentResponse` saves the text and `stop` checks it and sends the reason as a `followup_message`.
5. **The Cursor pair was not run in Cursor.** The case table checks it, and no eval runs it.
   Decision: ship the pair checked by the case table, with its commands and file shape taken from Cursor's hooks documentation.
6. **`intent/sdlc-plugin/intent.md` lists moving hooks into the plugin as out of scope.**
   Decision: the product owner decided that the plugin holds its SDLC hooks, so the plugin holds this one.
7. **The language of a reply.** The plugin told the agent which language to write in, and the eval cases graded it.
   Decision: the language is the model's to choose, so the plugin no longer speaks about it.

## Open questions

None
