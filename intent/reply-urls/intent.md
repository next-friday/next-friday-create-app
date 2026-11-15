# Intent: A reply names a pull request by its URL

Author: @joetakara (Developer Productivity). Status: done.

## Problem

A reply of the `sdlc-mode` skill named a pull request by its number, such as "PR #42", and its **Status** line often ended without the URL of the page to open. Requirement 19 of `intent/sdlc-plugin/spec.md` asks for the full URL in both places. The eval case `reply-gives-full-urls` showed it: before the change, 0 of 6 runs passed. Built in #166; #167 renumbered the requirement it cites.

## Proposed outcome

- A reply names a pull request by its full URL, on the **Request** line and on the **Status** line.
- The **Status** line ends with `Next: <URL>` and is the last line of the reply.
- Out of scope: changing the graders of the eval case. They state requirement 19 as written.
- Out of scope: publishing anything. No file under `src/` or `templates/` changes.

## Affected users and systems

- People who read replies of the `sdlc-mode` skill.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` and its rendered copies in the adapters.

## Constraints

- The reply shape governs every reply of the skill, so the other eval cases read the same text.

## Open questions

None
