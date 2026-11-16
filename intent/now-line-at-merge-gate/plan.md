# Plan: The Now line tells a person to merge a change that is not proved (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/hooks/check-reply-shape.cases.json` (changed): six cases. A reply that says a check was not run, or was skipped, and tells the person to merge is blocked. It passes with a **Not yet** line, with every check holding a result, with "accepted without a result", and after the merge.
- `plugins/sdlc/source/hooks/check-reply-shape.sh` (changed): blocks the first case.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/review.md` (changed): step 6 says what the **Not yet** line and the **Now** line hold when a requirement has no result, and what a merge publishes when the pull request adds a changeset.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): the **Not yet** rule names a requirement with no result.
- The rendered copies under `plugins/sdlc/adapters/`, `.claude/skills/`, and `templates/base/` (changed by `pnpm plugin:sync`).
- `.changeset/now-line-at-merge-gate.md` (new, `patch`).

## Order of work

1. Add the three cases. Check: `pnpm plugin:check` fails on the first case, "expected block, got pass".
2. Change the hook, the playbook, and the skill, and render. Check: `pnpm plugin:check` passes.
3. Push. Check: the `pre-push` output.

## Risks

- The hook reads English words: "not run", "not verified", "not proved", "unproved", "no result", and "merge". A reply in another language passes the hook, and the playbook's rule is then the only guard.
- A reply that quotes those words about something else is blocked until it gains a **Not yet** line or drops the merge from the **Now** line.

## Proof

- The cause: `playbooks/review.md` step 6 says the **Now** line "names the **Gate** and the person who merges", and no rule says what it holds when a requirement has no result. A session wrote `Not done:` with requirements not proved and a **Now** line that said to merge, and the person merged and released.
- The fix: the three cases in `check-reply-shape.cases.json`; `pnpm plugin:check`.
