# Plan: A Markdown-only change runs only the checks it can break

Accepted by: @joetakara.

## Files that change

- `.github/file-filters.yml` (changed):
  - a new `agent_docs` filter, with the patterns of spec requirement 4;
  - `heavy` and `ci_policy` exclude those patterns with `!` entries;
  - `templates/**` stays in `ci_policy`.
- `.github/workflows/ci.yml` (changed). The agent's token has no `workflow` scope, so the branch carries the new file at `.github/workflows-pending/ci.yml`. The product owner moves it into place on GitHub with their own account: they delete the old file, then rename the pending one. The agent then deletes `.github/workflows-pending/`. The new file:
  - **`changes` job:** a new output `agent_checks`. `Select verification mode` drops the `push` shortcut and reads `AGENT_DOCS` from the filter. `full_verification` stays true for a root release pull request.
  - **`agent-gates` job:** it runs when `agent_checks` is true, and gains the `Check formatting` step with its `GITHUB_TOKEN`. The step moves from `format`.
    - Requirement 1 asks for `format:check`, while the spec's design names only `agent-gates`. Moving the step satisfies both.
    - The `editorconfig-checker` that `format:check` runs (`package.json:46`) is fine on Markdown, because its download already uses the token.
  - **`format` job:** it keeps `Check package.json ordering` and `full_verification`.
  - **Every other job** keeps `full_verification`.
  - **`concurrency`:** the group becomes `${{ github.workflow }}-${{ github.event.pull_request.number || github.run_id }}`, as in the templates, so a push to `main` never cancels another push. With a per-ref group, a later Markdown-only push could cancel the run of an earlier code push, which requirement 2 forbids. GitHub cancels a waiting run in the same group even without `cancel-in-progress`.
- `templates/base/.github/file-filters.yml` (changed): the same `agent_docs` filter. `intent/**` and `REVIEW.md` move out of `ci_policy`, and `heavy` and `ci_policy` exclude the `agent_docs` patterns.
- `templates/{nodejs,nestjs,nextjs,payload,turborepo}/.github/workflows/ci.yml` (changed). Each file is edited on its own, because the text around `checks` and the `needs` lists differs in `payload` and `turborepo`:
  - **`changes` job:**
    - Its checkout takes `fetch-depth: 0`. On a push, `dorny/paths-filter` compares with the commit before the push and fetches it when it is missing, and that fetch has no credentials under `persist-credentials: false`, so it would fail in a private repository. The root checkout gets the same depth.
    - `Detect relevant changes` runs when `github.event_name != 'schedule'`.
    - `Select verification mode` writes `full_verification` and `agent_checks`, keeps the draft rule, and drops the `push` shortcut.
    - This text is the same in all five files.
  - **New `agent-checks` job, with `needs: changes` only:**
    - It holds `Check rendered agent rules match .agents/rules`, `Check agent gates`, `Check plans`, and `Check formatting`, the same text in all five files.
    - It repeats the checkout with `fetch-depth: 0` and the `pnpm/setup` step, and takes `pull-requests: read` and `GH_TOKEN`.
    - In `turborepo` it copies none of the `checks` job's `services`, `TURBO_*` env, `id-token`, base fetch, or scope steps.
  - **`checks` job:**
    - It loses those four steps, `pull-requests: read`, and `GH_TOKEN`.
    - It keeps `fetch-depth: 0`. The patch-coverage step compares against `origin/$BASE_REF` (`templates/nodejs/.github/workflows/ci.yml:117-124`), and `turborepo` needs history for `TURBO_SCM_BASE`.
  - **`deploy-dev`, `triage`, and `All Checks`:** each adds `agent-checks` to its `needs`, so a failing `plan:check` or `format:check` still blocks a deploy as it does today. `turborepo`'s `deploy-dev` condition also requires `needs.agent-checks.result == 'success'` (`templates/turborepo/.github/workflows/ci.yml:289`).
  - **`affected-apps` and `image`:** unchanged.
- `templates/{nodejs,nestjs,nextjs,payload,turborepo}/.github/workflows/sast.yml` and `templates/base/.github/workflows/osv-scanner.yml` (changed): `pull_request` and `push` gain `paths-ignore: ["**/*.md"]`. `branches` and `paths-ignore` may coexist under `push`.
- `.changeset/md-only-ci.md` (new): `patch` for `@next-friday/create-app`.
- `intent/md-only-ci/plan.md` (new): this plan.
- `intent/md-only-ci/intent.md` and `spec.md` (changed): `Status: done.`, set before the first push.

## Order of work

1. **Both filter files.** Check: a probe script in the scratchpad, not committed, runs `picomatch@2.3.1` with `{dot: true}`. That is what `dorny/paths-filter` pins and calls. The script applies "matches at least one pattern and no negated pattern" to each filter, at the root and in the template, over these paths:

   | Path                                              | Expected verdict        |
   | :------------------------------------------------ | :---------------------- |
   | `intent/x/spec.md`                                | `agent_docs` only       |
   | `.agents/rules/a.md`                              | `agent_docs` only       |
   | `.claude/rules/a.md`                              | `agent_docs` only       |
   | `.cursor/rules/a.mdc`                             | `agent_docs` only       |
   | `AGENTS.md`                                       | `agent_docs` only       |
   | `REVIEW.md`                                       | `agent_docs` only       |
   | `apps/app/AGENTS.md`                              | `agent_docs` only       |
   | `templates/nodejs/AGENTS.md` (root filter)        | `ci_policy` only        |
   | `templates/base/intent/x.md` (root filter)        | `ci_policy` only        |
   | `templates/base/.agents/rules/a.md` (root filter) | `ci_policy` only        |
   | `README.md`                                       | no filter               |
   | `src/a.ts`                                        | `heavy`                 |
   | `.agents/hooks/a.sh`                              | `heavy` and `ci_policy` |
   | `.github/workflows/ci.yml`                        | `heavy` and `ci_policy` |

2. **The five template `ci.yml`, `sast.yml`, and `osv-scanner.yml`**, each file edited on its own. Check:
   - `actionlint` 1.7.12, downloaded with the SHA-256 that the root CI pins (`.github/workflows/ci.yml:302-311`), reports nothing on the changed workflows. It checks `needs` references and expressions.
   - `pnpm build`, then a project generated from each stack, runs `pnpm verify`, as `AGENTS.md` says.
3. **The root `ci.yml`.** Check: `actionlint` on it.
4. **The changeset, then `Status: done.`** Check: `pnpm verify` at the root.
5. **Push.** If GitHub refuses the root workflow file for lack of the `workflow` scope, stop and report, as spec area of concern 2 and `playbooks/open-pr.md` step 5 say. Check, on the pull request:
   - the `Zizmor` job passes;
   - `All Checks` passes;
   - the pull request runs every job, because it changes `ci_policy` files.
6. **After the merge.** The first Markdown-only pull request and its merge show only the agent jobs. That is outside this pull request, and the pull request says so.

## Risks

- **Step 2 is the riskiest.** It edits the CI of every generated project, so a wrong `if` or `needs` would skip or always run a job, or let a deploy skip the agent checks. `actionlint` catches expression and `needs` errors. CI-only behaviour is proven only on GitHub, which step 5 and step 6 cover.
- **A force push to `main`** can remove the commit before the push from the history, and the `changes` job then fails on that push. `main` takes squash merges, not force pushes.
- **The root workflow push can be refused** (spec area of concern 2). The plan then stops with the branch held, and opens no pull request without the file.
- **A required check that a workflow skips stays "Pending"** (spec area of concern 1). Only SAST and OSV-Scanner get `paths-ignore`, and `SETUP.md:83` does not require them.
- **Not taken: one `checks` job with a step-level `if` on every heavy step.** It repeats the condition about 15 times per stack, where a separate `agent-checks` job states it once.
- **Not taken: `paths-ignore` on `ci.yml`.** A skipped workflow would leave `All Checks` "Pending" and block every Markdown-only pull request.

## Proof

- **1, 2, 4:** the filter probe in step 1, and the job conditions in the diff. Step 6 shows them on GitHub.
- **3:** the `changes` job diff, and the root `concurrency` change. Step 6 shows the push behaviour on GitHub.
- **5:** the `paths-ignore` diff on `sast.yml` and `osv-scanner.yml`.
- **6:** `secret-scan.yml` is unchanged in the diff.
- **7:** `All Checks` keeps `if: always()` and fails only on `failure` or `cancelled`. On a Markdown-only push, `deploy-dev` waits on `checks` and `agent-checks`, so it is skipped with `checks`. The pull request's CI shows `All Checks` passing.
- **8:** the diff covers the root and all five stacks.
- **9:** `pnpm verify` at the root and in each stack, `actionlint`, and the `Zizmor` job on the pull request.
- **10:** `pnpm changesets:check`, and the version told to the user before the pull request opens.
- **Policies:** none apply (spec Policies).
