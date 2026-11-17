# Plan: Semgrep refuses the script that the push hook calls (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/source/scripts/changed-documents.ts` (changed): matches a path against a glob segment by segment, with no regular expression built from the glob.
- `templates/base/scripts/changed-documents.ts` (changed by `pnpm plugin:sync`): the rendered copy.
- `.changeset/changed-documents-semgrep.md` (new, `patch`).

## Order of work

1. Change the matcher and add self-tests for it. Check: `node plugins/sdlc/source/scripts/changed-documents.ts --self-test`.
2. Compare the old matcher and the new one on real paths. Check: no path gets a different answer.
3. Render and push. Check: the `pre-push` output.

## Risks

- The riskiest step is 1: a matcher that answers differently would let a push of code through as documents. Step 2 compares both matchers on the tracked paths of this repository and of its templates, and the Proof names the one path that differs.
- Semgrep cannot run in the session that makes this fix, because its rule sets come from a host the session cannot reach. The finding is fixed by removing what the rule names, and it is proved only when a generated project's `Semgrep (OWASP)` job runs.

## Proof

- The cause: every stack's `sast.yml` runs Semgrep with `p/nodejsscan`, whose rule `regex_dos` reports a regular expression that is built at run time and then tested. `changed-documents.ts` built one from each glob of `.github/file-filters.yml`, so the `Semgrep (OWASP)` job of a generated project failed on the first pull request that held the script.
- The fix: 12 self-tests of `changed-documents.ts`. The old and the new matcher give the same answer for 822 of 823 paths. The one path is a folder's own name against a pattern that ends in `/**`, such as `intent` against `intent/**`: the new matcher matches it, as `picomatch` 4.0.7 does with `dot: true`, and the old one did not.
