# Intent: Close the gaps a consumer hit creating its first project

Author: @joetakara (Developer Productivity). Status: done.

## Problem

A consumer created its first project from `@next-friday/create-app@9.13.1` with an agent. Most people who try the kit are students, junior developers, and individuals on GitHub Free. The consumer hit these gaps:

1. **The agent reports a review gate that GitHub does not enforce.** `playbooks/review.md` step 6 says the pull request waits for a code owner's approval. `templates/base/SETUP.md` says that until the ruleset of its step 3 exists, a pull request merges without that approval, and that rulesets on a private repository need GitHub Pro, Team, or Enterprise; `templates/base/.github/CODEOWNERS` names no owner. The consumer's first pull request merged with no review and no check run while the agent said it waited for a code owner.
2. **Workflow files fall to the consumer.** The agent's token had no `workflow` scope, and GitHub refused the workflow files both on `git push` ("refusing to allow an OAuth App to create or update workflow `.github/workflows/ci.yml` without `workflow` scope") and through the GitHub App ("Insufficient scope: required "workflow""). No playbook covers this. The agent pushed without the workflows and handed the consumer a zip to upload by hand. The pull request merged before anyone uploaded it, so the repository has no CI.
3. **The `turborepo` stack fixes its apps.** It always has a Next.js app and a Payload backoffice that needs PostgreSQL (`src/stacks.ts`). The consumer wanted two Next.js apps; that takes hand edits in 15 files outside `apps/` that name `apps/app` or `apps/backoffice`, `ci.yml` included (`grep -rlE "apps/(app|backoffice)\b" templates/turborepo --exclude-dir=apps`). The withdrawn `intent/monorepo-apps` kept the five stacks as they are.
4. **`pnpm verify` needs GitHub at run time.** `format:check` runs `editorconfig-checker` 7.0.0, which downloads its binary from GitHub releases on first run. Where that host is blocked, `pnpm verify` fails.
5. **The documented first push assumes an empty repository.** `templates/base/SETUP.md` step 1 pushes the first commit to `main`, and the `pre-push` hook allows only the push that creates `main`. A repository created on GitHub with a README already has `main`, so the first push goes through a branch, where `pnpm plan:check` refuses it until an engineer-accepted `plan.md` exists. Nothing tells the consumer this.
6. **Commit messages need a scope nobody mentions.** The commitlint config rejects a commit with no scope (`scope-empty`), and neither the generated `AGENTS.md` nor `CONTRIBUTING.md` says so; the agent's first commit failed on it.
7. **Two plugin evals are flaky and the branch cases cannot pass.** `writes-spec-from-merged-intent` and `drafts-intent-and-waits-for-yes` fail on some runs because the model writes the wrong file or policy path. The cases that create a branch or push fail in the eval sandbox, whose `.git` is read-only.
8. **The agent's replies mislead or burden the person.** Nothing in the plugin stops these:
   - An agent can name its own reminder to check CI as re-checking the pull request, which reads as a review.
   - No step tells it to warn, before a person can merge, that the pull request has no CI or that nothing requires a review.
   - No step tells it to say, before it starts, which step it cannot do; it hands the person manual work instead.
   - It can write an `Accepted by:` handle the engineer did not give, although `playbooks/build.md` step 6 says to ask for one.
   - The reply shape in `SKILL.md` ends every reply with one **Now** action, so a reply repeats the same request for approval while the person is still asking questions.
   - It uses terms such as ruleset, scope, and changeset without explaining them, and goes silent during long work.

## Proposed outcome

- A person on GitHub Free, with no paid service, can generate a project, run `pnpm dev` and `pnpm verify`, make the first push, and get green CI, on the first try, whether the GitHub repository is empty or already has a README.
- On every plan, the gates that need no paid feature hold: the chat gates of each playbook, and the hooks that allow, ask, or block, including the ones that block the agent's approve and merge calls.
- The agent never says a pull request waits for a code owner unless GitHub requires that approval in the repository. When nothing requires a review, the agent says before the merge that a person can merge the pull request with no review. Branch protection that requires a code owner's approval stays an optional upgrade.
- A consumer whose agent creates the project does not upload workflow files by hand. When an agent cannot add them, it says so before it opens the pull request, and does not report the pull request as ready.
- If the product owner reopens the decision of `intent/monorepo-apps` (Open questions): a team can create a Turborepo project whose apps are all Next.js, without hand edits.
- `pnpm verify` runs with no download at run time.
- The generated agent instructions say what commitlint requires.
- The agent's replies tell the person what is true and what to do, without making them ask twice:
  - It names each action by what it is.
  - Before a person can merge, it warns about what is missing, such as CI or a required review.
  - It says, before it starts, which step it cannot do and what the person's options are.
  - It writes a person's handle only when that person gave it.
  - It asks for an approval once and repeats the request only when something changed.
  - It explains a technical term the first time it uses it, reports progress during long work, and shows text in the chat instead of pointing to a file the person cannot open.
- The two flaky evals pass on every run, and each branch or push case either runs where it can pass or is removed.
- All of this ships in one pull request with one changeset.
- Out of scope: problems of the cloud session itself, such as the network proxy, the preinstalled browser version, and its git fetch settings.

## Affected users and systems

- Students, junior developers, and individuals on GitHub Free, teams on paid plans, and the agents that create projects for them.
- `src/stacks.ts`, `templates/base`, `templates/turborepo`, and every stack whose `pnpm verify` runs `editorconfig-checker`.
- The `sdlc` plugin: `SKILL.md` and its reply shape, `playbooks/review.md`, `playbooks/open-pr.md`, `playbooks/build.md`, and the eval cases.
- npm: the change publishes a new version of `@next-friday/create-app`.

## Constraints

- Everything the kit requires works on GitHub Free with no paid service.
- One pull request and one changeset, as the originator asked. Before that pull request opens, the user is told the package name and the version it publishes.
- A published npm version stays on npm.
- After the template change, `pnpm verify` passes in a generated project of every stack in `src/stacks.ts`.

## Open questions

- Problem 3: does the product owner reopen the decision of the withdrawn `intent/monorepo-apps` for a Next.js-only Turborepo, or does problem 3 leave this intent?
- Should the project's gates switch on only after a setup step, so that a new project's first run meets none of them? Proposal: yes, one setup step that uses the person's own GitHub login.
- Can CI flag a pull request that merged with no approval on GitHub Free, where a workflow runs only after the merge? Proposal: the spec checks what GitHub allows.
- Problem 2: should the CLI make and push the first commit with the consumer's own Git credentials, or should the playbooks only hand the workflows over safely? The spec compares the two.
- Problem 8: does every reply still end with a **Now** line, or may a reply that waits on nothing new from the person end without one?
- Is the changeset a patch or a minor? A new stack, CLI option, or command makes it minor; renaming or removing one would make it major (`.changeset/README.md`).
