# Spec: A Markdown-only change runs only the checks it can break

From `intent/md-only-ci/intent.md`. Status: done.

Request: "Write the spec of md-only-ci". Skills at 51fc7a0.

## Requirements

1. A pull request or a push to `main` whose changed files all match the `agent_docs` filter (requirement 4), and no `heavy` or `ci_policy` file, runs only these checks, in this repository and in a generated project:
   - `rules:check`, `gates:check`, and `plan:check`;
   - `format:check`, because Prettier checks Markdown (`package.json` `format:check`, and the same script in each `templates/<stack>/package.json`);
   - in this repository, also `changesets:check`, which runs in the same Agent Gates job.

   It runs no lint, type, Knip, test, build, end-to-end, Docker image, Template, Compatibility, or Consumer Smoke job.

2. A pull request or a push to `main` that changes a `heavy` or a `ci_policy` file runs every job it runs today.
3. A push to `main` chooses its mode from the files the push changed, by the same rules as a pull request. The weekly scheduled run of a generated project keeps the jobs it runs today.
4. Each filter file gains an `agent_docs` filter for:
   - every file under `intent/`;
   - the Markdown files of `.agents/`, `.claude/`, and `.cursor/`, and the `.mdc` rule files under `.cursor/rules/`, which `rules:sync` renders;
   - `AGENTS.md` and `REVIEW.md` at the project root, and `apps/*/AGENTS.md`. `REVIEW.md` is rendered from `.agents/review.md`.

   A file that `agent_docs` matches no longer counts as `heavy` or `ci_policy`. In this repository, every file under `templates/` still counts as `ci_policy`, because it ships to every generated project.

5. `sast.yml` of each stack and `templates/base/.github/workflows/osv-scanner.yml` do not run on a pull request or a push whose changed files are all Markdown. They still run on their schedules.
6. `secret-scan.yml`, at the root and in `templates/base/`, runs on every pull request and every push, as today.
7. `All Checks` passes when the jobs it needs were skipped. `Deploy to dev` does not run on a push that changed only Markdown.
8. The root of this repository and every stack in `src/stacks.ts` follow requirements 1 to 7.
9. `pnpm verify` passes at the root and in a generated project of each stack. The `Zizmor` job of `.github/workflows/zizmor.yml` passes on the build pull request.
10. The pull request has one changeset of type `patch` for `@next-friday/create-app`. Before it opens, the user is told the version it publishes.

## Design

- **`.github/file-filters.yml` and `templates/base/.github/file-filters.yml`:**
  - A new `agent_docs` filter lists `intent/**`, `.agents/**/*.md`, `.claude/**/*.md`, `.cursor/**/*.md`, `.cursor/rules/*.mdc`, `AGENTS.md`, `REVIEW.md`, and `apps/*/AGENTS.md`. The root-level patterns match only at the project root, so the root's `templates/*/AGENTS.md` stays outside `agent_docs`.
  - `heavy` and `ci_policy` exclude those same patterns with `!` entries. The `some-with-excludes` predicate that both files already use includes a file "if it matches at least one pattern and no negated pattern" (`dorny/paths-filter` README, `predicate-quantifier`).
  - In the template, `intent/**` and `REVIEW.md` move out of `ci_policy` and into `agent_docs`.
  - The root keeps `templates/**` in `ci_policy`.
- **The `changes` job:**
  - This affects `.github/workflows/ci.yml` and each `templates/<stack>/.github/workflows/ci.yml`.
  - The `Detect relevant changes` step runs on `push` too. The template changes its `if: github.event_name == 'pull_request'` to `if: github.event_name != 'schedule'`, so a scheduled run keeps skipping it.
  - On a push to `main`, `dorny/paths-filter` detects "changes … against the most recent commit on the same branch before the push" when `base` is that branch, and `base` defaults to the default branch (`dorny/paths-filter` README, section "Long lived branches").
  - `Select verification mode` writes two outputs:
    - `full_verification`: true when `heavy` or `ci_policy` matched. It is also true on a root release pull request, as today.
    - `agent_checks`: true when `full_verification` is true or `agent_docs` matched.
  - The `push` shortcut goes.
  - The template keeps its draft rule on `pull_request` for both outputs: a draft pull request runs neither.
  - The template's `schedule` behaviour is unchanged: today `full_verification` is false on `schedule`, and only the jobs whose `if` names `schedule` run.
- **Root agent checks:** the `agent-gates` job runs when `agent_checks` is true. Every other job keeps `full_verification`.
- **Template agent checks:**
  - A new `agent-checks` job holds four steps that move out of `checks`: `Check rendered agent rules match .agents/rules`, `Check agent gates`, `Check plans`, and `Check formatting`. It runs when `agent_checks` is true.
  - It repeats the checkout of `checks`, with `fetch-depth: 0`, which `plan:check` needs to read the default branch, and the same `pnpm/setup` step with `cache: true` and `require-lockfile: true`.
  - It takes the `pull-requests: read` permission and the `GH_TOKEN` that `plan:check` needs. `checks` drops both, because no step left in it reads pull requests.
  - `checks` keeps every other step and its `full_verification` condition.
  - `All Checks` adds `agent-checks` to its `needs`.
  - In the `turborepo` stack, `affected-apps` and `image` keep their `full_verification` condition, so they need no new mode.
- **`All Checks` and `Deploy to dev`:**
  - `All Checks` already runs with `if: always()` and fails only on `failure` or `cancelled`.
  - A skipped job reports "Success" (GitHub Docs, "Using conditions to control job execution": "A job that is skipped will report its status as 'Success'").
  - `Deploy to dev` needs `checks`. In four stacks it is skipped when `checks` is skipped. The `turborepo` stack's condition requires `needs.checks.result == 'success'` (`templates/turborepo/.github/workflows/ci.yml:289`), and a skipped need does not satisfy it, so it does not run either.
- **`sast.yml` of each stack and `templates/base/.github/workflows/osv-scanner.yml`:** `pull_request` and `push` gain `paths-ignore: ["**/*.md"]`. `schedule` keeps no filter.
- **`.changeset/md-only-ci.md`** (new): `patch` for `@next-friday/create-app`.

## Policies

- **Brand:** Does not apply. The change shows no brand value (brand rule 1).
- **Security:** Does not apply. The change touches CI configuration, not the application, so no ASVS chapter applies (security rule 1). Requirement 6 keeps Secret Scan on every change, and requirement 5 keeps SAST and OSV-Scanner on every change that is not Markdown-only.
- **Compliance:** Does not apply. The change handles no personal data (compliance rule 1).
- **UX:** Does not apply. The change adds no user interface (UX rule 1).

## Areas of concern

1. **A required workflow that path filtering skips stays "Pending"** (a decision the files do not settle; no policy).
   - GitHub Docs ("Workflow syntax for GitHub Actions"): "If a workflow is skipped due to … path filtering … checks associated with that workflow will remain in a 'Pending' state. A pull request that requires those checks to be successful will be blocked from merging."
   - `templates/base/SETUP.md:83` requires only `All Checks` and `Validate pull request title`, so SAST and OSV-Scanner are not required.
   - A project that makes them required would block every Markdown-only pull request.

   Decision: use `paths-ignore` on SAST and OSV-Scanner, and keep job-level conditions inside `ci.yml`, where a skipped job reports "Success". `SETUP.md` keeps naming only `All Checks` and `Validate pull request title` as required.

2. **The agent's token cannot push the root `.github/workflows/ci.yml`** (a platform constraint; no policy).
   - The agent's GitHub token has no `workflow` scope, and GitHub refuses a push to `.github/workflows/` without it.
   - `playbooks/open-pr.md` step 5 says to open no pull request that leaves the file out. Its two ways out are:
     - a person pushes the branch with their own credentials;
     - the person "gives the agent's token that permission".
   - No developer and no computer are available (intent, Constraints).

   Decision: the product owner gives the agent's token the `workflow` permission before the build. If GitHub still refuses the push, the build reports the refusal and stops, as `playbooks/open-pr.md` step 5 says.

3. **A push of several commits** (a decision the files do not settle; no policy).
   - On a push, `dorny/paths-filter` compares against the commit before the push and fetches history as it needs it (`initial-fetch-depth`, default 100).
   - A squash merge pushes one commit, and each stack's `AGENTS.md` says a person merges "with `--squash`".

   Decision: rely on the action's own fetch. The build checks it on the first Markdown-only push to `main`.

4. **`format:check` on a Markdown-only change** (a decision the files do not settle; no policy). The intent lists the agent checks and Secret Scan. Prettier also checks Markdown, so skipping `format:check` lets a badly formatted file reach `main`.

   Decision: the agent checks include `format:check` (requirement 1).

## Open questions

- **How does a required check behave when the job is skipped?**
  - Answered: a skipped job reports "Success", but a workflow that path filtering skips leaves its checks "Pending".
  - Evidence: GitHub Docs, quoted in Design and in area of concern 1.
  - So `ci.yml` uses job-level conditions, `All Checks` stays the required job, and `paths-ignore` goes only on workflows that are not required.
- **How does the root `.github/workflows/ci.yml` change land?** Answered by area of concern 2.
