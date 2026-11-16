# Intent: Make a new project ready at its first pull request

Author: @joetakara (Developer Productivity). Status: accepted.

## Problem

A project generated from the `turborepo` stack by version 10.1.2 and pushed to a private GitHub repository fails four jobs on its first pull request, before anyone has changed the generated code:

1. **Detect Affected Apps** stops with `fatal: could not read Username for 'https://github.com'`. `templates/turborepo/.github/workflows/ci.yml` checks out with `persist-credentials: false` and then runs `git fetch --no-tags origin "$BASE_REF"` (lines 87 and 177), which a private repository refuses without credentials.
2. **TruffleHog and Gitleaks** stops with `fatal: path '.gitleaks.toml' exists on disk, but not in '<base commit>'`. `templates/base/.github/workflows/secret-scan.yml:50` reads the Gitleaks rules from the pull request's base commit, and on the first pull request the base does not hold that file yet.
3. **Semgrep (OWASP)** reports four blocking findings in generated files:
   - `vi.stubEnv("PAYLOAD_SECRET", "test-secret")` in `apps/backoffice/src/collections/media.test.ts:37` and `apps/backoffice/src/payload.config.test.ts:18` and `:29`. `templates/payload/src/` holds the same three lines.
   - The pattern `/^Accepted by: @[\dA-Za-z][\w-]*\.$/` at `plugins/sdlc/source/scripts/check-plan.ts:145`, tested at line 234. It is anchored and has no nested quantifier, so the finding is a false positive, and every generated project carries the script.
4. **Scan / osv-scan** fails on `deepmerge` 4.3.1 (GHSA-gcqx-w48m-w2h4, CVSS 5.3), which has no fixed version. `pnpm why deepmerge` in that project names `payload` 3.93.0 as its only dependent.

Three things made the repair slow and risky in the project itself:

5. The project's rules and hooks, which the template ships, stop an agent from clearing these by itself: `.agents/rules/no-suppression.md` forbids the inline `nosemgrep` comment, and the hook on `.github/workflows/` sends an edit of `secret-scan.yml` to a person. The agent in that project reported both blocks, and a refused attempt to add `osv-scanner.toml`.
6. Each repair edits a file the harness owns. `templates/turborepo/.agents/harness.json` lists `.github` and `scripts` under `paths` with no `exceptions`, so a repaired project departs from the reference until a release ships the same repair.
7. This repository's CI caught none of the four. Its Template job generates each project inside this public repository and runs `pnpm verify`; it never runs the generated project's workflows, never uses a private repository, and never opens a first pull request.

Setting the project up is also left to a document the person may never open:

8. The CLI asks nothing about the project's owner. The generated files hold placeholders that `SETUP.md` steps 1 and 2 tell a person to replace by hand: `description`, `repository.url`, and `author` in `package.json`, every owner in `.github/CODEOWNERS`, the owner in `.github/zizmor.yml`, and `security@example.com` in `SECURITY.md`.
9. The originator generated two projects, opened their first pull requests, and only then found `SETUP.md`. `/setup-sdlc` could not finish the steps either: it stopped to ask for the owner's GitHub handle, the security contact, and whether the project ships a container image, because no file holds them.
10. `SETUP.md` does not say up front what a private repository on GitHub's free plan cannot do. The ruleset of `main`, enforced code owner review, `CODE_SCANNING`, and GitHub secret scanning each need a paid plan there, and the person learns it one step at a time.
11. `SETUP.md` step 1 tells a person whose repository already has a commit to push the import to a branch and open a pull request. That is the path that meets failure 2.

A `/setup-sdlc` session in the second project reported more of the same kind:

12. `package.json` named the template's own repository in `repository.url` while the project's `origin` remote named the project's, so the session had to ask which was right. `author` and `license` still hold the template's values.
13. The `CODEOWNERS` lines `SETUP.md` step 2 prescribes name paths the new project does not hold: `.agents/skills/` and the four `*-policy` folders under it.
14. On the private free-plan repository, GitHub answered the ruleset request with HTTP 403 and `Upgrade to GitHub Pro or make this repository public to enable this feature.` This is the evidence for item 10.
15. The session set five things of `SETUP.md` step 3 itself through `gh` and read each back: the `needs triage` label, read-only workflow permissions, squash-only merging with the pull request title as the message, deletion of merged branches, and Dependabot alerts with security updates. `SETUP.md` gives these to a repository admin, and `/setup-sdlc` reports them as `a person checks this`.
16. The end of `pnpm verify`'s output showed only the build's summary, so the session ran the test and static steps again one at a time to see their results.
17. `SECURITY.md` must name a contact email. A project with no shared security address ends up with one person's own address in a file every reader of the repository sees and that stays in the Git history.

A `/setup-sdlc` session in the first project reported four more:

18. The reply-shape Stop hook sent the session's reply back for a **Checks** section after it wrote the models rule in the person's home directory, while `git status --short` in the project was empty. `/setup-sdlc` writes that rule on every run, so the skill meets its own hook. The session then ran the build, the tests, and the static checks, which prove nothing about that file.
19. The checks the session ran itself came back from Turborepo's cache (`2 cached, 2 total`), so they were not fresh runs; only the `verifier`, which set `TURBO_FORCE=true`, ran them anew.
20. The generated `.env` points the backoffice at a PostgreSQL role and database the machine did not have. `/health`, `/api/*`, and `/admin` answered 500 and `pnpm test:e2e` could not run. Nothing at creation or in `/setup-sdlc` creates them or says they are missing.
21. The rules tell the session to wait for a subagent's report before it goes on, and the session had no blocking way to wait, so it ended two turns early to receive the report.
22. On the first push, GitHub reported one low-severity Dependabot alert on the default branch. Both projects saw one. Neither session opened it.

## Proposed outcome

The template ships the five repairs that turned that project's first pull request green, so a new project needs none of them:

1. **Fetch.** `templates/turborepo/.github/workflows/ci.yml` loses both "Fetch the pull request base" steps. The checkout before each has `fetch-depth: 0`, and the two jobs passed in the private repository without the step.
2. **Gitleaks.** `templates/base/.github/workflows/secret-scan.yml` uses the base commit's `.gitleaks.toml` when the base holds one, and Gitleaks' built-in rules (`[extend]` with `useDefault = true`) when it does not. It never reads the pull request's own file, so a pull request cannot loosen the scan.
3. **Test secret.** The Payload tests in `templates/payload/src/` and `templates/turborepo/apps/backoffice/src/` stub `PAYLOAD_SECRET` with a `randomUUID()` made at run time, so no secret literal remains.
4. **Accepted line.** `check-plan.ts` checks the `Accepted by:` line without a regular expression, with the same result for every input. In the project the new function sits in its own file, because `check-plan.ts` is at the 1000-line limit of `sonarjs/max-lines`.
5. **Advisory with no fix.** A new project does not fail osv-scan on an advisory that has no fixed version and that the project did not choose. How is open question 1.

This repository's CI fails when a change to `templates/` would bring back failure 1, 2, or 3.

The CLI sets the project up when it creates it, so the first commit holds real values and `SETUP.md` is left with what only a person on a website can do:

6. **Questions at creation.** The CLI asks for what no file can tell it and writes the answers into the generated files in place of the placeholders. The originator named this the place for setup; which values it asks for is open question 8.
7. **What the plan allows.** A person learns at creation, or at the top of `SETUP.md`, which steps a private repository on the free plan cannot do.
8. **Values the repository already holds.** The CLI and `/setup-sdlc` take a value from the project when the project shows it, such as `repository.url` from the `origin` remote, and ask only for the rest (items 12 and 9).
9. **Settings an agent can apply.** The settings of `SETUP.md` step 3 that a session set through `gh` are applied for the person, with their agreement, and `/setup-sdlc` reports them `done` (item 15). Which ones is open question 12.
10. **Owners and contact that fit the project.** The `CODEOWNERS` lines the setup writes name paths the project holds, and `SECURITY.md` does not force one person's own email address into the repository (items 13 and 17).

The harness stops working against the session that sets a project up:

11. **Reply-shape hook.** A session that changes no file of the project is not sent back for a **Checks** section, and `/setup-sdlc` ends in one reply (item 18).
12. **Database.** A person who creates a project that needs PostgreSQL learns at creation what the app expects and whether the machine has it, before a request answers 500 (item 20).
13. **Waiting for a subagent.** The rule on waiting for a subagent's report says what a session that cannot block does (item 21).

Items 16, 19, and 22 promise no outcome yet: each rests on one session's report, and open questions 14, 17, and 20 hold them.

A project already generated by 10.1.2 can take the same files from the release that ships these repairs, and `pnpm harness:check` then reports no difference for them.

The CI repairs and the questions at creation are one change, by the originator's decision.

Out of scope: checks a project's own later code fails, and repairing projects already generated, which their owners do.

## Affected users and systems

- Every team that generates a project and opens its first pull request, most of all in a private repository.
- `templates/turborepo/.github/workflows/ci.yml`, `templates/base/.github/workflows/secret-scan.yml`, and `templates/base/.github/workflows/osv-scanner.yml`.
- The Payload test files under `templates/payload/` and `templates/turborepo/apps/backoffice/`.
- `plugins/sdlc/source/scripts/check-plan.ts`, the copies `pnpm plugin:sync` renders from it, and `scripts/sync-plugin.ts` if a second script file is rendered.
- This repository's Template job in `.github/workflows/ci.yml`.
- The CLI's prompts and arguments in `src/`, `templates/base/SETUP.md`, and the `setup-sdlc` skill, which reports the same steps.

## Constraints

- A finding is fixed, or recorded as an accepted risk in the tool's central file with an owner and a reason; no inline suppression.
- Workflow files keep `persist-credentials: false`.
- The secret scan never takes its rules from the pull request under scan.
- The rewritten `Accepted by:` check passes the script's existing self-tests unchanged.
- Existing CLI arguments, prompts, and stack names keep working; a run with no terminal, such as CI's, still finishes without an answer.
- A session whose GitHub token lacks the `workflow` scope cannot push the workflow changes; a person or a local agent pushes them.

## Open questions

1. How the template handles an advisory with no fixed version. The project recorded `GHSA-gcqx-w48m-w2h4` in `osv-scanner.toml` with an owner and `ignoreUntil = 2026-12-17`. The template cannot ship that entry as it is: it holds no lockfile, the owner is the project's, and the date passes. The choices seen so far are to fail only on advisories that have a fixed version, to ship no entry and document the step in `SETUP.md`, or to keep today's behaviour. Whether OSV-Scanner can fail only on fixable advisories has not been checked.
2. Whether the same failures appear on the other four stacks. Failure 2 sits in `templates/base`, so it should; failure 1 was found only in the `turborepo` workflow. No project of another stack was observed.
3. Whether a public repository hits failure 1; it was observed only in a private one.
4. How this repository's CI exercises a generated project's workflows: a private scratch repository, a local runner, or static checks of the workflow files.
5. Whether the `Accepted by:` function stays in `check-plan.ts` or moves to its own file here, and what `pnpm plugin:sync` and each stack's `tsconfig.json` need for a second script file. The project had to add `allowImportingTsExtensions` to its `tsconfig.json`.
6. Whether the claim behind repair 1, that `fetch-depth: 0` creates `origin/<base>`, holds in every case. It passed in one project and has not been checked against the checkout action's documentation.
7. Whether `pnpm harness:check` reports the repaired files in that project today; it has not been run there.
8. Which values the CLI asks for. The ones a project needed were the owner's GitHub handle, the security contact, the repository URL, and whether the project ships a container image. The description, the author, and whether the repository is private on the free plan are further candidates.
9. What a run with no terminal does for each new question: a flag, a default, or the placeholder as today.
10. Whether a change to the prompts needs a major changeset, as convention 2 of `AGENTS.md` says for a break, or a minor one because the old arguments still work.
11. Whether the CLI reads `repository.url` from the `origin` remote when one exists, which would settle item 12 without a question.
12. Whether `/setup-sdlc`, or the CLI, applies the settings of item 15 when the session has `gh` and the person agrees, and which of them stay with a repository admin.
13. Whether `SETUP.md` step 2 keeps `CODEOWNERS` lines for paths a new project does not hold.
14. What the end of `pnpm verify` should print so one read shows every step's result. Item 16 is one session's report; the output has not been read.
15. Whether the template offers a contact other than an email for `SECURITY.md`, such as GitHub's private vulnerability reporting. Whether a private repository on the free plan can use that has not been checked.
16. Why the reply-shape hook fired in item 18 when the project's tree was unchanged; the hook's input in that session has not been read.
17. Whether a check answered from Turborepo's cache counts as run, and whether the commands `AGENTS.md` names for an agent should force a fresh run.
18. What the `turborepo` and `payload` stacks do about the database at creation: create it, check for it and say so, or document the step. Item 20 is one machine's report.
19. What the waiting rule of item 21 should say for a session that cannot block.
20. Which package the alert of item 22 names, and whether it comes from a dependency the template chooses.
