# Spec: A reply names a pull request by its URL

From `intent/reply-urls/intent.md`. Status: done.

Request: "fix(repo): name a pull request by its URL in replies". Skills at unknown.

## Requirements

1. The reply shape in `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` says to build the URL from the repository and the number before writing, and to use it where the person wrote the number.
2. It gives one worked example of the **Request** and **Status** lines.
3. It ends the **Status** line with `Next: <URL>` and makes it the last line of the reply.
4. It names two things to check before sending.
5. Both adapters' copies of `SKILL.md` are rendered from it by `pnpm plugin:sync`, and `pnpm plugin:check` exits 0.
6. On the eval case `reply-gives-full-urls`, more runs pass on the small model and on the mid-size model than before the change.
7. `pnpm verify` exits 0.

## Design

- The rule moved next to the lines it governs, with the worked example beside it.
- The graders of the eval case are unchanged.
- Pull request #167 renumbered the requirements of `intent/sdlc-plugin/spec.md`; the requirement on URLs in a reply is now requirement 19, and `intent/reply-urls/plan.md` cites it.

## Policies

- **Brand:** Does not apply. The change shapes an agent's reply in development tooling; it shows no brand text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change touches a skill's text, not the application, so it touches no chapter (security rule 1).
- **Compliance:** Does not apply. The change collects, stores, shows, sends, or deletes no data about a person (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **The reply shape governs every reply of the skill.** A change to it reaches every eval case.
   Decision: change only the reply shape in `SKILL.md`, and run the `no-shell` eval cases before and after.
2. **The graders of the eval case.** Changing them would make the case pass without changing replies.
   Decision: leave the graders unchanged; they state requirement 19 as written.

## Open questions

None
