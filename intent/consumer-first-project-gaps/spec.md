# Spec: Close the gaps a consumer hit creating its first project

From `intent/consumer-first-project-gaps/intent.md`. Status: draft.

Request: "เขียน spec ของ consumer-first-project-gaps". Skills at 0d9684f.

## Requirements

1. Before an agent says that a pull request waits for a code owner, it reads the active rules of the base branch with `GET /repos/{owner}/{repo}/rules/branches/{branch}`. It reports the result in the reply that opens or updates the pull request, before anyone can merge:
   - **Review required:** a `pull_request` rule with `require_code_owner_review` true or `required_approving_review_count` of 1 or more. The agent names the review that is required.
   - **No review required:** no `pull_request` rule, or one that requires no approval. The agent says that a person can merge the pull request with no review once the required checks pass.
   - **Rules unavailable:** a `403` that says "Upgrade to GitHub Pro or make this repository public". The agent says that on this plan nothing can require a review, and names the two ways to get one: make the repository public, or upgrade the plan.
2. `playbooks/review.md`, `playbooks/open-pr.md`, and the reply examples in `SKILL.md` say "waits for a code owner" only for the **Review required** case of requirement 1.
3. When a pull request's head has no workflow run, the reply that reports the pull request says, on its **Not yet** line, that no CI ran and why, before anyone can merge.
4. When GitHub refuses a push or an API write because the token lacks the `workflow` scope, the agent opens no pull request that leaves the workflow files out. It stops with the whole change committed on the branch and says what it cannot do. It then names the two ways out: push from a machine with the person's own Git credentials, or give the agent's token the `workflow` permission. It hands the person no file to upload by hand unless the person chooses that.
5. Depends on area of concern 6. `pnpm plan:check` passes a branch that adds no `plan.md` when the remote default branch has no `package.json`, which is the import of a newly generated project. Every other branch behaves as it does today. `templates/base/SETUP.md` step 1 says how to make the first push when the GitHub repository already has a README.
6. `pnpm verify` in a generated project of every stack passes after `pnpm install` when `github.com` and `api.github.com` cannot be reached. CI still checks every file against `.editorconfig`.
7. The generated `AGENTS.md` and `CONTRIBUTING.md` of every stack say that a commit message is `<type>(<scope>): <subject>`, with a lowercase scope that is required and a subject of at most 50 characters.
8. Depends on area of concern 2. The `turborepo` stack's root files name its apps through `apps/*` globs wherever the tool accepts a glob. A team can add a second Next.js app with `turbo gen workspace --copy` and no edit to a root file, and remove `apps/backoffice` by following the stack's `README.md`.
9. The eval cases `writes-spec-from-merged-intent` and `drafts-intent-and-waits-for-yes` each pass three runs in a row on the default model. Every eval case that creates a branch or pushes either runs in a scaffold where Git can write, or is deleted.
10. `SKILL.md` tells the agent that:
    - it names each action by what it is, and calls something a review only when a review ran;
    - when a step fails for want of a permission, it stops and reports the failure and the person's options before it does anything in place of that step;
    - it writes an `Accepted by:` or `Author:` handle only when the person gave it, or when the host shows whose account the session runs as;
    - it explains a technical term the first time a reply uses it;
    - it gives a short progress line during work that runs longer than a few minutes;
    - it shows text in the reply instead of pointing to a file the person cannot open.
11. When the person's pending action has not changed since the previous reply and the person asked a question, the **Now** line says that nothing new is needed and holds no URL. `check-reply-shape.sh` keeps requiring a **Now** line as the last line.
12. On every GitHub plan, the hooks keep blocking the agent's approve and merge calls, and `pnpm gates:check` keeps covering those cases.
13. `templates/base/SETUP.md` marks each step that needs a paid GitHub plan and gives the free alternative next to it.
14. A project generated from each stack and pushed as the first commit of a new private repository on GitHub Free gets green CI on its first run; the build checks this once for each stack on a scratch repository, or says in the pull request that it was not run and why.
15. The pull request has one changeset of type `minor` for `@next-friday/create-app`. Before it opens, the user is told that it publishes 9.14.0, assuming no other changeset is pending.

## Design

- **`plugins/sdlc/source/skills/sdlc-mode/playbooks/open-pr.md`** (requirements 1, 3, 4):
  - After the push, a new step reads the branch rules as requirement 1 says, and checks for a workflow run on the head.
  - The step also sets the **Not yet** line.
  - When the push is refused for the `workflow` scope, the step stops as requirement 4 says, before the pull request opens.
- **`playbooks/review.md`** (requirement 2): step 6 reports the gate that requirement 1 found, not a fixed code owner.
- **`SKILL.md`** (requirements 2, 10, 11): the reply examples follow the three cases. The reply rules gain the lines of requirement 10 and the **Now** rule of requirement 11.
- **`plugins/sdlc/source/hooks/check-reply-shape.sh`** (requirement 11): unchanged; its cases file gains a reply whose **Now** line says that nothing new is needed.
- **`plugins/sdlc/source/scripts/check-plan.ts`** (requirement 5): when `origin/<default>:package.json` does not exist, it skips the no-plan rule, and a self-test covers that case.
- **`templates/base/SETUP.md`** (requirements 5, 13): step 1 covers a repository that already has a README. Each step that needs a paid plan is marked, with the free alternative next to it.
- **`templates/*/package.json` and `templates/*/.github/workflows/ci.yml`** (requirement 6):
  - `format:check` runs Prettier only, and the `editorconfig-checker` devDependency is removed.
  - Each `ci.yml` downloads a pinned `editorconfig-checker` release with a checksum, as it already does for hadolint, and runs it.
- **`templates/*/AGENTS.md` and `templates/*/CONTRIBUTING.md`** (requirement 7): one line on the commit message format.
- **`templates/turborepo`** (requirement 8):
  - `knip.json`, `eslint.config.ts`, `prettier.config.ts`, `.github/dependabot.yml`, the `ci.yml` coverage step, and the root `package.json` scripts take `apps/*` where the tool accepts a glob.
  - `README.md` gains "Add a Next.js app" with `turbo gen workspace --copy` and "Remove the backoffice".
  - A test in `test/` generates the stack, copies `apps/app`, and checks that `pnpm verify` passes with no root edit.
- **`plugins/sdlc/adapters/claude-code/evals/sdlc-mode/`** (requirement 9): the two flaky cases name the exact files the model must write. Each branch or push case's `scaffold.sh` creates its own repository and a bare remote under the writable workspace.
- **The check of requirement 14:** run by hand during the build, not in CI. For each stack the engineer generates a project, pushes it to a new private scratch repository on GitHub Free, and records the workflow run's result in the pull request.
- **`.changeset/consumer-first-project-gaps.md`** (requirement 15): `minor`.
- **Rendered copies:** `pnpm plugin:sync` and `pnpm rules:sync` render the changes into `plugins/sdlc/adapters/` and `templates/base/plugins/sdlc/`.

## Policies

- **Brand:** Does not apply. The change shows no brand value to a user (brand rule 1).
- **Security:**
  - No ASVS 5.0.0 chapter applies. The change touches development tooling, not the application.
  - Rule 6 applies to requirements 4 and 6: no token appears in a reply, log, or workflow output, and the CI download checks a pinned checksum.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, or deletes no personal data (compliance rule 1).
- **UX:** Does not apply. The change adds no user interface (UX rule 1); agent replies are covered by requirements 10 and 11.

## Areas of concern

1. **The intent's "no manual upload" cannot hold for an agent whose token lacks the `workflow` permission** (decision the files do not settle). GitHub refuses the write, and no change in this repository grants the permission.
   Decision: requirement 4 stops the agent before the pull request and names the two ways out. "No manual upload" holds for a person who runs the CLI and pushes with their own credentials.
2. **A Next.js-only Turborepo against the withdrawn `intent/monorepo-apps`** (decision the files do not settle). That intent kept the five stacks as they are.
   Decision: no new stack. Requirement 8 makes adding and removing apps in the existing `turborepo` stack need no root edit, through Turborepo's own `turbo gen workspace --copy`.
3. **Local `pnpm verify` stops checking `.editorconfig`** (security rule 6, and the decision the files do not settle). No maintained npm package that ships the checker's binary was found; `eclint` exists on npm but is not maintained.
   Decision: requirement 6 moves the check to CI only, downloaded with a pinned checksum.
4. **The scaffold design for branch and push evals is not verified** (decision the files do not settle). Whether the eval sandbox lets a scaffold create a writable repository outside the read-only `.git` is not checked.
   Decision: the build tries requirement 9's scaffold first. A case that still cannot write is deleted, and the pull request lists each deleted case.
5. **Gates only after a setup step** (decision the files do not settle). The intent proposed that a new project's gates switch on after one setup step.
   Decision: every gate stays on from the start, and the blockers of the first run are fixed one by one (requirements 5, 6, and 7), so no setup step is needed before the first push.
6. **`pnpm plan:check` loosens for the first import** (decision the files do not settle). The intent asks that the first push works and that the person is told how; it does not ask to change the gate.
   Decision: requirement 5 skips the no-plan rule only while the remote default branch has no `package.json`, so every later branch still needs an accepted plan.

## Open questions

- **Problem 3, reopening `intent/monorepo-apps`:** carried into area of concern 2.
- **Gates only after a setup step:** carried into area of concern 5.
- **CI flagging a merge with no approval on GitHub Free:** a workflow on `push` to `main` could read the merged pull request's reviews, but it would fail on every merge a solo developer makes. Requirement 1 warns before the merge instead, so nothing is added.
- **CLI push or playbook handover:** the playbook handover of requirement 4. A CLI push does not help an agent whose token lacks the `workflow` permission, because the agent runs the CLI with that same token.
- **Patch or minor:** minor, because new behavior is added and nothing is removed (`.changeset/README.md`).
- **Problem 8, the Now line:** every reply keeps a **Now** line, and requirement 11 lets it say that nothing new is needed.
