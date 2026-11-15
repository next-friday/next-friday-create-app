# Intent: A hook checks the reply shape of the sdlc-mode skill

Author: @joetakara (Developer Productivity). Status: done.

## Problem

A reply of the `sdlc-mode` skill sometimes breaks the reply shape. It names a pull request by number, ends without the **Status** line or its `Next: <URL>`, or writes a path from the machine's root. The shape is prose, and a small model follows prose only part of the time. On the small model without a hook, the eval case `reply-gives-full-urls` passed 24 of 30 runs. Built in #171; #172 added Cursor, and #173 dropped the reply language rule.

## Proposed outcome

- The `sdlc` plugin ships a hook that checks each part of the reply shape a script can check, for Claude Code and for Cursor.
- A reply that breaks the shape is blocked once, with a reason, and the agent sends the whole reply again.
- The plugin no longer speaks about the language of a reply.
- Out of scope: repeating the checks as a rule in `SKILL.md`. The skill is not edited for the hook.

## Affected users and systems

- People who use the `sdlc` plugin in Claude Code or Cursor.
- `plugins/sdlc/source/hooks/`, `plugins/sdlc/adapters/`, `scripts/sync-plugin.ts`, and `plugins/sdlc/README.md`.
- The plugin's skills, playbooks, and eval cases, for the language rule.

## Constraints

- The product owner decided that a rule a script can check is enforced by a hook and a POSIX `sh` script, kept in the plugin in the tool's native plugin layout.
- Cursor's `stop` hook gets no reply text ([Cursor: Hooks](https://cursor.com/docs/hooks)).
- The script needs `jq`.

## Open questions

None
