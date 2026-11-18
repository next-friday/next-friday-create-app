# @next-friday/create-app

## 10.5.0

### Minor Changes

- 41154a3: A generated project holds a new rule, `asking-a-person`, that loads in every session. The agent asks a person only for a decision, checks that a request is needed before it makes one, and hands over an action a rule reserves for a person as one run.

### Patch Changes

- 41154a3: A pull request that changes only files under `intent/` runs the format check alone in CI, without the rule and agent gate checks. In the `payload` and `turborepo` stacks, CI starts PostgreSQL only when the checks that need it run.

## 10.4.0

### Minor Changes

- 431a659: The SDLC loop acts only in a session where a person typed `/sdlc-mode`, and the sdlc plugin lives in its own folder.

  Breaking for a generated project:

  - `pnpm plan:check`, `pnpm bands:check`, and `pnpm loop:measure` are removed. `scripts/check-plan.ts`, `scripts/check-bands.ts`, and `scripts/measure-loop.ts` move to `.claude/skills/sdlc-mode/scripts/`. `pre-push` and CI no longer run the plan check.
  - The loop's hooks are declared in the frontmatter of `.claude/skills/sdlc-mode/SKILL.md`, and `.claude/settings.json` holds none of them. They run from the call of `/sdlc-mode` to the end of the session. After a resumed session, type `/sdlc-mode` again.
  - The skill's push hook runs the plan check before a `git push`. It refuses a branch that changes an intent or a spec and code with no plan.
  - Every `.cursor/` folder is removed. The harness supports Claude Code only.
  - `playbooks/small.md` is removed. `pr-triage.yml` and `.github/labeler.yml` are removed.

  Also changed: each stack's `Verify` workflow runs one job, `All Checks`. `pnpm check`, which `pre-push` runs, no longer builds or checks the format. Patch coverage fails under 80 percent.

## 10.3.1

### Patch Changes

- 39f0133: A generated project's `sdlc` harness no longer refuses a change to an intent, a spec, or a plan that is merged, or its deletion. `pnpm plan:check` runs `check-plan.ts` only: the script `check-records.ts` is gone, a merged record may carry any status line, and a merged fix plan may change on any branch. The skill no longer forbids deleting or rewriting a merged record. A later round of the same change may revise the `intent.md` and the `spec.md` that are there, where the playbooks sent it to a new folder.

## 10.3.0

### Minor Changes

- 79ddc45: A generated project's `sdlc` harness writes lighter replies, sets up models by itself, and drops rules that cost time for no check. A reply that asks a question or stops at a gate starts with `**Waiting for you:**` and says what the person does. The steps of a playbook are in the agent tool's task list, and no reply holds a **Steps** section; the reply check blocks one. The agent writes no text while it works and asks a choice between ways through the agent tool's question picker where it has one. `/setup-sdlc` now sets the models only and edits no file of the project; send `/setup-sdlc project` for the steps of `SETUP.md`. A session with no models rule, such as a cloud session, writes the rule with the `balanced` budget and asks nothing. The agent now reaches first for a shell command or a script, such as `sed`, to change files. In a build, the agent proposes the files, the order, and the tests in the plan, and the engineer corrects the plan. A request that already states its outcome gets a draft intent with no interview. The reply check asks for **Checks** only when the agent ran a tool that can write a file. The agent no longer restates the request before it starts, starts a subagent for one command, reads a whole file before a search, or shows a whole draft again after one correction.

## 10.2.2

### Patch Changes

- b9e1359: `scripts/changed-documents.ts` in a generated project no longer builds a regular expression from each pattern of `.github/file-filters.yml`. It matches a path against a pattern segment by segment, so the `Semgrep (OWASP)` job no longer reports the script. The script gives the same answers as before for a file path. A folder's own name now matches a pattern that ends in `/**`, as the `Detect Changes` job matches it.

## 10.2.1

### Patch Changes

- 31e5f34: A session no longer tells a person to merge a change that is not proved. When a requirement of the change has no result, the reply holds a **Not yet** line that names it, and the **Now** line asks the person to decide between getting the result first and accepting the change without it. The reply-shape hook blocks a reply that says a check was not run and tells the person to merge. When a pull request adds a changeset, the session says that the merge opens a release pull request, and names the package and the version it publishes.

  A session now watches the pull request it opened when it lists a tool that subscribes it to the pull request's events, and fixes a failing check without being asked. It still never waits in a sleep and never polls in a loop of its own. It changes code for a comment only when the host marks the comment's author as an owner, a member, or a collaborator. A session with no such tool says that nobody watches the pull request.

## 10.2.0

### Minor Changes

- ca1a06d: A session of `/sdlc-mode` now waits for a subagent's report in one call: a generated project sets `CLAUDE_CODE_FORK_SUBAGENT` to `"0"` in `.claude/settings.json`, and `SETUP.md` says how a person removes it. The session does not poll, sleep, or message a subagent. A new role, `review`, runs the review of a pull request's diff, and a pull request that changes only files under `intent/` gets no agent review.

  `pnpm verify` and `pnpm check` end with one line for each step and its result. The `pre-push` hook runs `pnpm rules:check`, `pnpm plan:check`, and `pnpm format:check` for a push that changes only documents, and `pnpm check` otherwise; in the `turborepo` stack it runs only the affected apps. `rules:check` leaves `pre-commit`.

  `Done.` needs a result read in the same turn for every requirement of the change. A check that could not run, a skipped CI job, and a run in progress each keep the reply at `Not done:`. The interview asks the problem, its reason, and what is out of scope as open questions, and asks choices in numbered rounds in plain chat text.

  In the `turborepo` stack, `pnpm dev` and `pnpm start` pass `--concurrency=10`, so a fourth app starts.

## 10.1.2

### Patch Changes

- 9827ef2: The `explore` rule of 10.1.1 now leaves out the read of four or more files. It names a search across the tree whose hits the session would read, and a comparison of two directories or two branches other than the session's own diff. The session still reads the files it needs to answer or to edit.

  The push hook no longer asks for a review of every commit before a push; the review stays at the pull request (`.claude/skills/sdlc-mode/playbooks/review.md`). A hook that asks for a commit or a push no longer lifts a gate.

  The rule `agent-owned-work` is removed from every generated project, with its entry in `.agents/rules.json`: it told the agent never to ask a person, so the agent took the step it could do alone over the step the person had ordered.

  The `advise` subagent no longer reviews every plan and every finished change: it runs only when a check fails twice or two designs compete. `/sdlc-mode` reviews a pull request once, reports its URL, and stops; it drives the pull request to green only when a person asks. The session runs the `verifier` once when the work is done.

  `pnpm plan:check` now also fails a branch that deletes an intent, a spec, or a plan of the default branch, moves one, or changes a line of one in more than its status word, a spec's `Decision:` lines excepted (`scripts/check-records.ts`). In the `turborepo` stack, `pnpm dev` starts both apps: `turbo.json` sets `concurrency` to 3. `/sdlc-help` names `small.md` and `fix.md` by paths that exist, and the session-start status no longer lists a change whose status is `replaced`. The text of `/sdlc-mode` and its playbooks is rewritten as one instruction per sentence. A `Proof` line of a plan starts with its requirement number.

  The playbook that writes an intent is now `playbooks/intent.md`, not `playbooks/plan.md`: `plan.md` names only the build plan. The four policy skills are no longer started by the model on its own; `/sdlc-mode` reads each one by its path.

  A generated project has a new command, `pnpm harness:check <version>`. It generates the reference project of that create-app version and fails when a harness file of the project is missing or differs from it, so a sync that leaves a file behind is caught by a script. `.agents/harness.json` names the stack, the harness paths, and the files the project keeps as its own.

  The reply-shape hook (`.claude/skills/sdlc-mode/hooks/check-reply-shape.sh`) looks for changed files only in the project's folder. In a project that is a folder of a larger repository, a file that changed anywhere in that repository made the hook ask for **Checks** and send the reply back. `pnpm plan:check` passes in such a project, where `scripts/check-records.ts` used to fail because it found the outer repository's `origin` and no `origin/main`.

  In a generated project, `intent/README.md` says how to read a record and names the five status words. The `payload` and `turborepo` stacks name `APP_URL` among the variables that `pnpm dev`, `pnpm build`, `pnpm check`, and `pnpm verify` need. `SETUP.md` names both folders that hold hook scripts.

## 10.1.1

### Patch Changes

- f28c3e5: In a generated project, `/sdlc-mode` sends exploration to the `explore` subagent, on `haiku` unless a models rule says otherwise, in every playbook step, `playbooks/question.md` included: a read of four or more files in one step other than the files a playbook step names by path, a search whose hits the session would read, and a comparison of two directories or two branches other than the session's own diff. The session reads only the subagent's report, so the main model spends fewer tokens. With no models rule, a subagent takes the `Default effort` column of `/setup-sdlc` step 3, not an effort from that skill's step 5 example. Both rules are in `.claude/skills/sdlc-mode/SKILL.md` step 4.

  In a generated project, every `**Result:**` line of `/sdlc-mode`, and an answer to whether the work is done, starts with `Done.` or `Not done:`. `Done.` needs every part of the request finished, merged where it goes through a pull request, with the proof read in that turn. `Not done:` names what is left and who does it, including a part that a spec, a plan, or the session set aside as a separate change. A notice that a pull request merged gets a `**Result:**` line, not `**No change:**`. The rule is in the reply shape of `.claude/skills/sdlc-mode/SKILL.md`.

## 10.1.0

### Minor Changes

- 4edc71f: In a generated project, each role of the `sdlc` harness has its own default reasoning effort: `main` on `sonnet` at `high`, `explore` on `haiku` at `xhigh`, and `advise` on `opus` at `medium`. `/setup-sdlc` offers the budget `balanced`, which keeps those efforts, as its first and recommended choice; `unlimited`, `large`, `medium`, and `small` still set one effort for every role. With no models rule, `/sdlc-mode` starts each subagent at its role's default effort instead of `xhigh`.
- 4edc71f: In a generated project, `/sdlc-mode` hands the person only what they can use as it is: a whole file, a whole prompt, or a whole command, never a fragment or a diff to apply by hand.

### Patch Changes

- 4edc71f: In a generated project, the `verifier` subagent starts on `haiku`, the `explore` default, when the call names no model. `/sdlc-mode` writes the intent of a new round of work in a new folder, and never deletes or rewrites an intent, spec, or plan on the default branch beyond its `Status:` line.

## 10.0.0

### Major Changes

- 7488db4: The CLI no longer has the `--deploy` option, and it no longer ships the Railway deploy files: `railway.json`, `.github/workflows/deploy.yml`, `runbooks/rollback-deploy.md`, and the `deploy-dev` job in `ci.yml`. `pnpm create @next-friday/app my-app --deploy railway` and `--deploy none` now fail with `Unknown option '--deploy'`. The first commit's `Command:` line no longer names a deploy target.

  Every generated project now has no deploy workflow. Its `SETUP.md` has a **Deploy** section that says what a deploy step needs: your own workflow, a `prod` environment with the release managers as required reviewers, and the image the `Dockerfile` builds.

  To migrate, drop `--deploy` from the command. A project generated with `--deploy railway` keeps working: keep its `deploy.yml`, `railway.json`, and runbook as your own deploy setup, and maintain them in that project.

### Minor Changes

- 7488db4: A generated project has `/sdlc-help` again, at `.claude/skills/sdlc-help/`. It explains how the workflow runs, including the `small/` route, and starts no work. `/sdlc-status` stays removed; a session still starts with the status list.

## 9.15.0

### Minor Changes

- 4364da3: A generated project loads the `sdlc` harness from its own folders, so it works in a Claude Code cloud session, which installs no plugin a repository enables. The six skills are in `.claude/skills/`, which Claude Code and Cursor both load; the `verifier` subagent is in `.claude/agents/` and `.cursor/agents/`; and `.claude/settings.json` and `.cursor/hooks.json` run the hook scripts from `.claude/skills/sdlc-mode/hooks/`, each once per session. The commands lose their plugin prefix: send `/sdlc-mode` in place of `/sdlc:sdlc-mode`, and `/setup-sdlc` in place of `/sdlc:setup-sdlc`; `/sdlc-help` and `/sdlc-status` are gone, and a session still starts with the status list. A small, well-bounded change now goes from a `small/` branch to one pull request with no intent, spec, or plan. The `Stop` hook that ran `pnpm verify` at the end of every turn is gone; `pre-push` and CI run the checks. The project no longer holds `plugins/sdlc/`, the local marketplace, the Cursor `workspaceOpen` hook, or the `Plugin evals` workflow, and the CI jobs that send `/sdlc-mode` pass no `--plugin-dir`. With no models rule, as in a cloud session that starts in a new container, `/sdlc-mode` starts each subagent on its role's default model, `haiku` to explore and `opus` to advise, in place of the session's model. `SETUP.md` lists the sessions in which part of the harness does not load. The CLI now makes the first commit itself, `build(repo): bootstrap <stack> workspace`, whose body names the CLI's version, the command, and the stack, on the branch `build/bootstrap-workspace` when the repository already has a commit; when a Git hook stops it, the CLI prints the commit to run. A project generated before this version keeps its plugin copy until it takes the change through its own pull request.

## 9.14.3

### Patch Changes

- f2aec5a: In a generated project, a pull request or a push to `main` that changes only Markdown under `intent/`, `.agents/`, `.claude/`, or `.cursor/`, or the root `AGENTS.md` or `REVIEW.md`, runs only the agent checks and formatting in a new `Agent Checks & Formatting` job, not the build, tests, or container image. A push to `main` now chooses its jobs from the files it changed. SAST and OSV-Scanner skip a change that touches only Markdown; Secret Scan still runs on every change.

## 9.14.2

### Patch Changes

- 51fc7a0: In a generated project, `pnpm plan:check` fails a branch that adds or changes a plan beside a spec and changes code, unless the folder's `intent.md` and `spec.md` say `Status: done.`, so a change is marked done by the pull request that builds it. The `sdlc` plugin's build playbook sets that status before the first push and names any unmet requirement in the pull request description.

## 9.14.1

### Patch Changes

- 9a2eaa2: In a generated project, `pnpm plan:check` accepts a plan with no intent and no spec only when its title ends in "(fix)" and the branch starts with `fix/`, as `playbooks/fix.md` says, and its message tells the person to start from an intent. An intent or spec added for a change that is already built may say `Status: done.` The `sdlc` plugin tells the agent to report a blocked gate instead of writing another artifact to get past it.

## 9.14.0

### Minor Changes

- aed01d3: A generated project runs its first `pnpm verify` with no download from GitHub and makes its first push on GitHub Free: `editorconfig-checker` runs in CI from a pinned release, `pnpm plan:check` lets the first import through, and `SETUP.md` covers a repository that already has a README and marks each step that needs a paid plan. The `sdlc` plugin reads the branch rules before it says a pull request waits for a review, warns when no CI ran, stops when the token lacks a permission, writes `Status: accepted.` in the pull request that adds an intent or spec, and follows new reply rules. The `turborepo` stack names its apps through `apps/*`, and the agent instructions give the commit message format.

## 9.13.1

### Patch Changes

- 0d9684f: In a generated project, the `sdlc` plugin under `plugins/sdlc/` lists each step by its first sentence, keeps a reply to a few lines when a step stops early, settles the files before asking about the order of work, starts the review in a subagent, and names a fix plan's file.

## 9.13.0

### Minor Changes

- bcb4983: A generated project runs on Node.js 26.13.0 with the `@next-friday/*` configs at 5.2.1 and pnpm 12.18.0, holds new dependencies for seven days at install, and lets `@next-friday/*` updates skip Dependabot's cooldown. The turborepo images build from `turbo prune`, and its tasks run two at a time. The `sdlc` plugin runs `pnpm verify` before an agent's turn ends, refuses a push whose commit was not reviewed or whose plan does not name a changed file, and `pnpm plan:check` refuses a branch that changes code without a plan and a fix that edits an existing test. A rejected intent or spec is merged with `Status: rejected.`, and `SETUP.md` shows who acts at each stage.

## 9.12.0

### Minor Changes

- a0fa3b8: A generated project's `sdlc` plugin gains `/sdlc:sdlc-status` and a session-start hook that lists each change in `intent/` that is not done, with its stage and who acts next. The UI stacks' `AGENTS.md` tell the agent to look at a changed page with the Playwright MCP server, and the plugin's eval workflow also runs nightly.

## 9.11.0

### Minor Changes

- da4d4c0: The `sdlc` plugin adds a correction to the project's agent instructions when a person corrects the same mistake twice. Its `build` and `fix` playbooks take the engineer's acceptance of a plan in the session, and put `plan.md` in one pull request with the code and one changeset for the whole change; `pnpm plan:check` no longer asks for a pull request that holds only the plan. Before pushing or handing over a patch, the agent runs each CI check it can run on the changed files and says which it cannot.
- 4ed3db8: A generated project holds the `sdlc` plugin's eval cases under `plugins/sdlc/claude-code/evals/`, and `SETUP.md` step 8 describes the `Plugin evals` workflow, which runs them on a pull request that changes the plugin or `.agents/` once `CLAUDE_CI_ENABLED` is `true`, with the pass threshold and cost ceiling in the repository variables `EVAL_PASS_THRESHOLD` and `EVAL_MAX_COST_USD`.

## 9.10.0

### Minor Changes

- 75f1a52: The CLI is easier to start. Pressing Enter at the prompts creates `my-app` from the Next.js stack, each prompt says in a full sentence what the choice gives, and each stack's choice says what the project holds. `--yes`, or `-y`, takes those defaults and asks nothing, with or without a terminal; a name or `--stack` given with it wins. It stops before writing a file when a `my-app` directory with files already exists.

## 9.9.0

### Minor Changes

- 2b1b029: The `sdlc` plugin routes work by model. `/sdlc:setup-sdlc` now sets three roles, `main`, `explore`, and `advise` (defaults Sonnet, Haiku, and Opus), and writes them into a rule in the person's home directory that the agent tool loads in every session, in place of `.agents/sdlc-models.md`. The playbooks start a subagent on the `explore` model to read files and to run the `verifier`, and one on the `advise` model when a plan is written, when the same check fails twice, and before work is reported done. Run `/sdlc:setup-sdlc` again to write the new rule; an existing `.agents/sdlc-models.md` is no longer read.

## 9.8.1

### Patch Changes

- beda95e: A generated project's `AGENTS.md` now says that `RELEASE_APPROVAL` lifts the production gate only when it matches the first line of `.agents/release-approval-form`, as the gate has applied it since 9.5.1. The production gate paragraph of `AGENTS.md` and `SETUP.md` is held once, and a project with the deploy target `none` no longer says in `CONTRIBUTING.md` that a deploy promotes a commit.

## 9.8.0

### Minor Changes

- 9d4c827: A reply of the `sdlc` plugin has a new shape. Its first line is `**Answer:**`, `**Result:**`, or `**No change:**`; a `**Not yet:**` line says what the person must not do yet; its last line is `**Now:**`, with the one thing the person does and one link, or with nothing to do and no link. The `**Status:**` line and its `Next:` link are gone. The plugin's hook blocks a `**Now:**` line that links a list page, links the page the `**Not yet:**` line names, or holds more than one link, and a reply with more than one `**Not yet:**` line. The line that ends each playbook is now `**Hands off to:**`. To use the new shape in a project created earlier, copy `plugins/sdlc/` from a new project of the same stack.

## 9.7.2

### Patch Changes

- 5d61997: A template marker that names an unknown deploy target now stops the run with an error, where it removed its section without one. The `CONTAINER_IMAGE` repository variable, which the entry of 9.7.0 names, has skipped the CI job that builds and scans the container image since 9.7.1; no workflow of 9.7.0 reads it. In a project created with 9.7.0, copy the `if:` line of the `image` job in `.github/workflows/ci.yml` from a new project to use the variable.

## 9.7.1

### Patch Changes

- 547e309: A project created with `--deploy railway` keeps the README sentences that name Railway, and a project created without `--deploy` no longer holds the deploy workflow, the `deploy-dev` job, or the Railway check of the production gate.

## 9.7.0

### Minor Changes

- 072741b: The CLI takes `--deploy railway|none`, the deploy target. The default is `none`: a new project holds the `Dockerfile` and no deploy workflow, no `railway.json`, no rollback runbook, and no `deploy-dev` job, and its README says what a deploy step needs. Pass `--deploy railway` for the files a project got before. Set the repository variable `CONTAINER_IMAGE` to `false` to skip the CI job that builds and scans the container image.

## 9.6.0

### Minor Changes

- e477661: The `sdlc` plugin's stop hook now blocks a reply with no **Checks** section when a file outside `intent/` changed during the turn. `SETUP.md` and the `setup-sdlc` skill say what code owners, the ruleset of `main`, and the OpenTelemetry export each need. The `review` playbook says when findings are not on the pull request, and the `maintain` playbook has the service owner schedule a finding with a comment.

## 9.5.1

### Patch Changes

- 56a7062: fix(templates): make the gate hooks record and check the approval form

  Version 9.5.0 shipped `.agents/release-approval-form` and the `SETUP.md` text for it without the hooks that use them. In a generated project, the hooks now do what that text says:

  - Each hook that allows or blocks an action appends a line to `.agents/logs/gate-decisions.jsonl`: the time, the hook, the decision, the session, and a fixed reason for a block. The line holds no command text and no path.
  - `RELEASE_APPROVAL` lifts the production gate only when it matches the first line of `.agents/release-approval-form`. A value such as `1` no longer lifts it. A lifted gate records the value and the Git user name.
  - A hook blocks, with a message that names the file, when `.agents/hooks/record-gate-decision.sh` cannot be loaded.

## 9.5.0

### Minor Changes

- 324c123: feat(templates): record each gate decision

  In a generated project:

  - Each hook that allows or blocks an action appends a line to `.agents/logs/gate-decisions.jsonl`, which git ignores: the time, the hook, the decision, the reason for a block, and the session. The line holds no command text.
  - `RELEASE_APPROVAL` lifts the production gate only when it matches the expression in the new `.agents/release-approval-form`, shipped as `^[A-Z]+-[0-9]+$`. A value such as `1`, which lifted the gate before, no longer does: set the form to your organization's approval records. A lifted gate records the value and the Git user name.

## 9.4.1

### Patch Changes

- d3df970: fix(templates): close gaps in the plan gate

  - `pnpm plan:check` stops with the host tool's error when `GH_TOKEN` is set and the host cannot be read, where it passed without checking who merged the plan.
  - The `build` and `fix` playbooks commit and push the plan in one step and wait for the engineer's merge in the next, pick up a plan that is already merged or already on a branch, and confirm a merged plan with `git fetch` when the host cannot be read.
  - A handle may hold an underscore.

## 9.4.0

### Minor Changes

- 10fd2f4: feat(templates): accept a plan by merging its pull request

  In a generated project, the `sdlc` plugin now records who approved at three gates:

  - A plan is committed in a pull request of its own, and the engineer accepts it by merging that pull request. The code follows in a second pull request, and `pnpm plan:check` fails a branch that adds a plan together with code.
  - With `GH_TOKEN` and `gh`, `pnpm plan:check` fails a plan whose `Accepted by:` line is not the account that merged the plan's pull request.
  - A spec carries a `Decision:` line under each area of concern and the commit of the skills that wrote it, and an intent names its author by handle.

## 9.3.1

### Patch Changes

- a092416: A generated project no longer ships `.cursor/BUGBOT.md`, and `SETUP.md` no longer has the step that enables Cursor Bugbot. The Cursor step of `SETUP.md` keeps the sandbox policy.

## 9.3.0

### Minor Changes

- 6b9babb: A generated project now holds the `sdlc` plugin instead of copies of its skills. `plugins/sdlc/claude-code/` and `plugins/sdlc/cursor/` hold the plugin, and `.claude-plugin/marketplace.json` lists it as `sdlc` in the marketplace `next-friday-plugins`. The commands are `/sdlc:sdlc-mode`, `/sdlc:sdlc-help`, and the new `/sdlc:setup-sdlc`, which chooses the model for each role and reports which steps of `SETUP.md` are done. A team replaces a default policy with its own `.agents/skills/<area>-policy/SKILL.md`, which wins over the plugin's default. The skills, the `verifier` subagent, the eval cases in `.agents/skill-evals/`, `scripts/run-agent-evals.ts`, the `evals:run` script, and the workflow `agent-evals.yml` no longer ship; each stack's `AGENTS.md` now states how the `verifier` subagent starts the app, `SETUP.md`, `intent/README.md`, and `REVIEW.md` name the plugin, and `CONTRIBUTING.md` loses its eval step. `scripts/check-plan.ts`, `scripts/check-bands.ts`, and `scripts/measure-loop.ts` stay, because `pnpm verify`, the pre-push hook, and CI call them.

  A project generated earlier keeps working as it is. To move one, copy `plugins/sdlc/` and `.claude-plugin/marketplace.json` from a new project of the same stack, add `extraKnownMarketplaces` with the entry `next-friday-plugins` (source `directory`, path `.`) and `enabledPlugins` with `sdlc@next-friday-plugins: true` to `.claude/settings.json`, then delete `.agents/skills/` (except any policy of your own), `.claude/skills/`, `.cursor/skills/`, `.agents/skill-evals/`, `.agents/agents.json`, the `verifier.md` files under `.agents/agents/`, `.claude/agents/`, and `.cursor/agents/`, `scripts/run-agent-evals.ts`, `.github/workflows/agent-evals.yml`, and the `evals:run` script. Replace `/sdlc` with `/sdlc:sdlc-mode` in the two workflows `spec-on-intent-merge.yml` and `control-band.yml`, and pass `--plugin-dir plugins/sdlc/claude-code` in their `claude_args`. For Cursor, copy `.cursor/hooks/load-project-plugins.sh` and its `workspaceOpen` entry in `.cursor/hooks.json` from a new project.

## 9.2.1

### Patch Changes

- 81e71d6: A generated project no longer tells the agent which language to write in. The `sdlc` playbooks, the `sdlc-help` skill, and `AGENTS.md` lose their language rules, and the eval cases under `.agents/skill-evals/` lose the checks on the reply's language.

## 9.2.0

### Minor Changes

- 90c2ed0: A person accepts an intent or a spec by merging its pull request and edits no status line. The spec's pull request sets the intent to `Status: accepted.`, and the plan's commit sets the spec. `pnpm plan:check` fails when a branch writes `Status: accepted.` in an intent or a spec that is not on `main`, or in a folder that has no file for the next stage. The `Spec on intent merge` workflow runs for an intent that reaches `main` with `Status: draft.` or `Status: accepted.` and no `spec.md` beside it.
- 90c2ed0: Every generated project gets `pnpm evals:run`, which runs the agent evals in `.agents/skill-evals/` with Claude Code and the developer's own Claude login. Each case holds a prompt, a `case.yaml` with deterministic `checks` (files changed, commits made, the reply matching or lacking a pattern, the branch, the files of the first commit) and an optional fixture of files, commits, branches, and a local remote, and `graders/` that a model judges. The runner copies the project to a temporary directory, runs `claude -p` with the small model `claude-haiku-5-5` (set `AGENT_EVALS_MODEL` to change it), prints one line per case and the pass rate, and exits non-zero when a case that ran fails. A case whose fixture is only prose is reported as skipped. The command is not part of `pnpm verify`. `CONTRIBUTING.md` says to run it after changing `AGENTS.md`, a skill, or a hook. The project ships the same 18 cases as this repository, including one that checks the agent interviews the engineer before it plans.
- 90c2ed0: The Commands table in each stack's `AGENTS.md` gains a "Healthy output" column that shows what each command prints when it succeeds. The review instructions compare a change with the design principles that the four policies state, and `payload` and `turborepo` list their own generated files to skip while the other stacks list `pnpm-lock.yaml`. In the `/sdlc` build playbook, the agent interviews the engineer about the files, the order of work, the tests, and the options ruled out before it writes the plan, and closes the loop with a screenshot comparison in a stack that ships the Playwright MCP server. In the review playbook, a mistake that an earlier review flagged too goes into `AGENTS.md` under "Things Claude gets wrong" as part of the review.
- 90c2ed0: Every generated project gets `pnpm bands:check <file>`. It reads `bands.yaml` and a JSON file `{"baseline": [...], "recent": [...]}`, applies the Western Electric rules to the metric, and prints one JSON line with the tier, its action, tools, and routes. A `2sigma` or `3sigma` result goes to `/sdlc` as a finding. With no argument it runs its self-tests, and `pnpm verify` runs them. Each stack gains the `yaml` dev dependency.
- 90c2ed0: Every generated project gets five workflows that call Claude, and all of them stay off until the repository variable `CLAUDE_CI_ENABLED` is `true`: `Agent evals` runs `pnpm evals:run` when a pull request changes the agent's configuration and every night; `Spec on intent merge` runs `/sdlc` on an accepted `intent.md` that reaches `main` and opens the spec as a pull request; `Claude fix loop` answers an `@claude` review comment on a pull request from the same repository and pushes to its branch; the `triage` job in `ci.yml` summarizes a failed build on a pull request with the `Read` tool only; `Control band` runs the command in the `CONTROL_BAND_METRIC_COMMAND` variable, then `pnpm bands:check`, and runs `/sdlc` with the finding when the tier's action is `diagnose` or `propose`. Each job accepts a `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` secret, runs the small model with a turn cap, and cannot approve, merge, or push to `main`. `SETUP.md` step 8 lists them.
- 90c2ed0: `pnpm depcruise` reads TypeScript 7 sources through the SWC parser: every stack gains the `@swc/core` dev dependency and `"parser": "swc"` in `.dependency-cruiser.json`.
- 90c2ed0: A generated project has no `pnpm human-gates:check`, `pnpm intent:check`, `pnpm suppressions:check`, or `pnpm peers:check` command, no `scripts/check-human-gates.ts` or `scripts/check-intent.ts`, and no `.agents/hooks/agent-suppression-gate.sh`. `pnpm verify:static`, the `pnpm check` that `pre-push` runs, and the CI workflow run `pnpm rules:check`, `pnpm gates:check`, `pnpm plan:check`, `pnpm bands:check`, and the other static checks without them. `/sdlc` runs no intent checker.

  The `pre-push` hook rejects a push to `main` and then runs `pnpm check`. It does not reject a push of a branch whose remote branch no longer exists.

  The shell gate `.agents/hooks/agent-shell-gate.sh` blocks shell writes to protected files and `gh` commands that merge a pull request, approve one, or approve a deployment. It does not look for `--no-verify`, `git commit -n`, `HUSKY=0`, `core.hooksPath`, git aliases, `git commit-tree`, `git update-ref`, `gh repo delete`, `gh issue delete`, `gh release delete`, or a `gh api` call that reads its input from a file, and it never asks before a command, including `git push --force`, `git reset --hard`, `git clean`, `git branch -D`, `git stash drop`, and `git worktree remove --force`. `.claude/settings.json` denies edits to the protected files and `gh pr merge`; it does not deny the commands in this paragraph. The MCP gate blocks `merge_pull_request`, `enable_pr_auto_merge`, and `pull_request_review_write` with the event `APPROVE` in any letter case, and allows review comments and change requests.

  `RELEASE_APPROVAL` lifts `.agents/hooks/agent-production-gate.sh` for every value except an empty value, `0`, `false`, and `no`, in any letter case. `SETUP.md` and each stack's `AGENTS.md` say so.

  `.claude/managed-settings.example.json` sets no `allowManagedHooksOnly`, allows the MCP server `npx @playwright/mcp@0.0.83`, and allows `pnpm build`, `pnpm test`, and `pnpm lint:check`.

- 90c2ed0: `Status: done.` is the status an agent sets in `intent.md` once the tree meets every requirement of the spec; `intent/README.md` says when and who.
- 90c2ed0: Every generated project gets `pnpm loop:measure`. For each `intent/<change>/` it reads git history and prints the date of the first `intent.md`, `spec.md`, and `plan.md` commits, the days from intent to spec, the `intent.md` commits made after the first `spec.md` commit, and the `spec.md` commits made after the first `plan.md` commit. It is not part of `pnpm verify`.
- 90c2ed0: The `AGENTS.md` of every stack gains a convention for parallel sessions: start each with `claude --worktree <name>` on tasks that touch different files, run tasks that share files one after another in one session, and begin with two or three sessions.
- 90c2ed0: Every generated project gets `pnpm plan:check`. It checks each `intent/<change>/plan.md` that a branch adds or changes: the headings of the plan template, the `Accepted by:` line once the branch changes a file outside `intent/`, a `spec.md` beside the plan, and a Proof section that names every numbered requirement of that spec; it also reports a spec with `Status: done.` that has no plan.

  A folder under `intent/` that holds a `plan.md` and neither an `intent.md` nor a `spec.md` is a fix plan. It needs the same headings and the same `Accepted by:` line, needs no `spec.md`, and needs a Proof section that is not empty.

- 90c2ed0: The review instructions in `.agents/review.md` and `REVIEW.md` name the generated files each stack has, so a review skips them: `pnpm-lock.yaml` in every stack, and the Payload types and migrations in the `payload` and `turborepo` stacks. For a change classed as higher risk, the product owner consults a tech lead before accepting the spec. Each stack's `AGENTS.md` carries the rules on issues, on what belongs in the repository, and on sourced requirements.
- 90c2ed0: Every generated project gets `runbooks/rollback-deploy.md`: the one command that redeploys the previous production commit through the `Deploy` workflow, how to rehearse it on `uat`, and that a release manager runs it. The deploy playbook points to it when a request asks to return production to an earlier commit. The maintain playbook says a dismissed finding tunes `bands.yaml`.
- 90c2ed0: Generated projects gain a path for fixing a defect. When a request is a defect in behaviour that already exists, `/sdlc` follows the new playbook `.agents/skills/sdlc/playbooks/fix.md`: it reproduces the defect by running the code, finds the one cause the evidence leaves, writes `intent/<short-description>/plan.md` and waits for an engineer to accept it, then commits that plan and a failing test on a `fix/<short-description>` branch, makes the test pass, runs the checks, and opens a pull request. A fix has no `intent.md` and no `spec.md`. A change that adds behaviour, a dependency, a schema, or a public interface goes through intent, spec, and plan.

### Patch Changes

- 90c2ed0: The CLI writes errors to standard error and exits with a named message when the working directory or a template directory is missing. `--help` and `--version` answer without checking the other arguments. `--skip-git` in a directory that already holds a repository does not tell you to run `git init`, and an existing `.git` directory is left untouched. The project name is checked again after the prompts, and `SIGTERM` and `SIGHUP` clean up a half-written project as Ctrl+C does.

  In the `nodejs` stack a request target that is not a valid URL gets `404`, and `pnpm start` builds first. In the `nodejs` and `nestjs` stacks `pnpm build` writes `dist/` every time, the container runs as the non-root user with UID 1000, and its `HEALTHCHECK` reads `PORT`; the `nestjs` stack's `pnpm verify` also runs `pnpm test:e2e`. Every stack's `Dockerfile` names the Node.js image by tag and digest.

  In the `payload` stack and the `turborepo` backoffice, `/health` initialises Payload, so it answers `500` when Payload cannot initialise because the database is unreachable, and the first health check after a deploy applies the migrations. Uploads accept AVIF, GIF, JPEG, PNG, and WebP only.

  The `nextjs`, `payload`, and `turborepo` pages do not name Next Friday, their `tsconfig.json` defines no `@/*` path alias, and the `turborepo` apps each carry an `AGENTS.md`.

  In the `turborepo` stack a failure while listing the affected apps fails the job, a change to the root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `railway.json`, or `.dockerignore` selects every app, a change to a `README.md` selects none, and `pnpm test:changed` sees changes to root files.

  The CI of every generated project runs `pnpm plan:check` and `pnpm bands:check`, and the SAST workflow runs on every push to `main`. `pnpm plan:check` reads the project's own `intent/` files and `pnpm bands:check` its own `bands.yaml`, as well as running their self-tests. Dependabot proposes major npm updates and uses the default time zone. The secret scan reads its configuration from the base commit of a pull request, and the deploy check accepts an app URL with a trailing slash. CodeQL, dependency review, and OpenSSF Scorecard run on public repositories and, on private ones, when the `CODE_SCANNING` variable is `true`. The gitleaks configuration needs gitleaks 8.21 or later.

  `/sdlc` writes the `Accepted by:` line when it continues from a plan an engineer already accepted. `SETUP.md` names the `CODE_SCANNING` and `DEPLOY_ENABLED` variables.

## 9.1.1

### Patch Changes

- 79c45d9: In generated projects, a spec that `/sdlc` writes now records the commit of the skills in force, beside the request that started it: `Request: "…". Skills at <commit>.`

## 9.1.0

### Minor Changes

- 3064b0b: Generated projects gain the rest of the `/sdlc` loop. `/sdlc` now routes to a `maintain` playbook, which writes an `intent.md` from a finding, and a `deploy` playbook, which stops at the production gate. `pnpm intent:check` checks an `intent.md` and runs in `pnpm verify` and CI. A plan records who accepted it and a spec records the request that started it. New files: `SECURITY.md`, `lessons/README.md`, and a documentation issue form.

### Patch Changes

- 3064b0b: Generated projects load fewer repeated agent instructions. `AGENTS.md`, the `/sdlc` skill, its playbooks, `SETUP.md`, and `intent/README.md` no longer restate a rule that a rule file, a hook, or another playbook already holds. No rule changes.

## 9.0.0

### Major Changes

- 326cee6: `/sdlc` now plans and builds from a merged spec, opens the pull request, reviews it, and drives it to green: send the spec's path with `/sdlc`, for example `/sdlc build intent/<change>/spec.md`, and the `build`, `open-pr`, and `review` playbooks run to the code owner's gate. The `babysit-pr` skill is removed from `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` of generated projects, and the `AGENTS.md` of every stack now points to `.agents/skills/sdlc/playbooks/review.md`; send `/sdlc` with the pull request instead, for example `/sdlc review <pull request URL>`.

## 8.0.1

### Patch Changes

- c54ec9f: The pull request template in each generated project now says to link an issue with `Closes #123` only when one already exists, and not to open an issue for the pull request.

## 8.0.0

### Major Changes

- 13fc9f4: `/sdlc` now writes the spec through the `design` playbook: send the intent's path with `/sdlc`, for example `/sdlc write the spec of intent/<change>/intent.md`, once the intent's pull request is merged. The `write-spec` skill is removed from `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` of generated projects; send the intent's path with `/sdlc` instead. The `security-policy`, `ux-policy`, `compliance-policy`, and `brand-policy` skills ship usable defaults (OWASP ASVS 5.0.0 Level 1, WCAG 2.2 Level AA, the OECD privacy principles, and one declared source for every brand value); review them and replace or add the organization's own rules.

## 7.1.0

### Minor Changes

- 2ccd3d7: Generated projects run `pnpm human-gates:check` in `pnpm verify` (`verify:static` in each stack) and in CI. The check reads `.agents/skills/sdlc/playbooks/*.md` and fails when a gate or a waiting step names no human role, or when a playbook lacks a `**Next:**` line that names what runs next, who runs it, and what starts it. The `plan` and `question` playbooks now carry that line, and the `plan` playbook says that in plan mode the originator approving the plan is the yes to the draft. A rejected intent is a closed pull request, no longer `Status: rejected.`; the product owner still accepts by setting `Status: accepted.` and merging.

### Patch Changes

- 260485f: Generated projects' `constitution-changes` rule (`.agents/rules/constitution-changes.md`, `.agents/rules.json`, and the rendered `.claude/rules` and `.cursor/rules` copies) now says the constitution changes in a pull request like any other change, and a code owner approves it in review. It no longer requires a dedicated issue. When a task needs a constitution change, the agent writes the exact new text and the files it goes in on the pull request, and a person commits it to that branch.

## 7.0.0

### Major Changes

- 478ee72: Generated projects no longer include the `git-workflow` and `script-driven-changes` agent skills, in `.agents/skills/`, `.claude/skills/`, or `.cursor/skills/`, or the links to them in `.cursor/BUGBOT.md`. Each stack's `AGENTS.md` has a new convention with the rules from `git-workflow` that no Git hook enforces: branch from the latest `origin/main` as `<type>/<short-description>`, open the pull request ready for review, drive it until it waits only on code owner approval, rebase and force-push with lease only your own branches, and leave the merge to a person. If a script or habit in your project calls either skill, use the `AGENTS.md` convention instead.
- 40b0775: Generated projects start work through one command, `/sdlc`, and no longer include the `write-intent` skill. `/sdlc` matches a request to a playbook in `.agents/skills/sdlc/playbooks/`: `question` answers without changing anything, and `plan` interviews the originator, drafts `intent/<change>/intent.md`, and waits for their yes before it commits or opens a pull request. A request for a later step, such as a spec or a deploy, is told that the step has no playbook yet. `/sdlc-help` explains the workflow and starts no work. Each stack's `AGENTS.md` gains a convention for replies a person can check, and tells the agent to answer a problem report with the `/sdlc` message that would start the work. If you ran `/write-intent`, send the same request with `/sdlc`.

## 6.0.2

### Patch Changes

- 9ce62fc: Generated projects now block agents from `prod`: `.agents/hooks/agent-production-gate.sh` stops `gh workflow run` and workflow dispatches with `environment=prod`, Railway CLI commands that name `prod` as their environment, release tag pushes (a `v<number>`, `tags/`, or `refs/tags/` ref, `--tags`, `--follow-tags`, or `--mirror`), and any command that mentions `push.followTags`, unless the agent was started with `RELEASE_APPROVAL` set. The hook used to look for a command containing both "deploy" and "production", so it never matched the `prod` environment. `SETUP.md` documents `RELEASE_APPROVAL`, and each stack's README asks for required reviewers on `prod` only, because `dev` deploys on every push to `main`.

## 6.0.1

### Patch Changes

- ecfaf2d: The CLI no longer follows a Git repository named by an inherited `GIT_DIR`, as Git sets when the CLI runs from a Git hook. It used to treat the new project as inside that repository and skip `git init`, and `pnpm install` set the Git hooks path in that repository's config. Both now act on the new project's own repository.

## 6.0.0

### Major Changes

- 6f20a84: The CLI's command `create-friday-app` is now `next-friday-create-app`, matching the repository name. `pnpm create @next-friday/app`, `npm init @next-friday/app`, and `npx @next-friday/create-app` work as before. If you installed the package globally or call the command by name in a script, run `next-friday-create-app` instead.

## 5.0.3

### Patch Changes

- 6fb83e6: Generated projects start agent work only when a person asks: the `write-intent` skill runs only through `/write-intent` and interviews the originator in rounds before it writes and commits the intent, `babysit-pr` drives a pull request to code owner review without merging it, and each stack's `AGENTS.md` lists when the agent stops.

## 5.0.2

### Patch Changes

- 74fe4ec: The generated `.husky/pre-push` hook's refusal for a deleted branch no longer guesses that the branch's pull request merged or closed, since the remote branch may have been deleted by hand. It says the branch no longer exists on the remote, how to continue on a new branch from the latest `main`, and that `git fetch --prune` followed by `git branch --unset-upstream` lets you reuse the name.

## 5.0.1

### Patch Changes

- fc7a388: The generated `.husky/pre-push` hook refuses a push that recreates a branch the remote deleted after its pull request merged or closed. The hook treats a branch as pushed before when `refs/remotes/<remote>/<branch>` exists or the branch upstream points at it, and the push of a new branch name still works.

## 5.0.0

### Major Changes

- 2f474f9: Generated projects no longer call the Claude API from GitHub Actions, so they need no workload identity federation or repository variables. The `Claude` and `Agent evals` workflows, the `Triage failed build` job in `ci.yml`, `evals/`, and `lessons/` are removed, and `SETUP.md` drops their steps. Claude Code Review still reviews pull requests from the Claude GitHub App.

## 4.0.1

### Patch Changes

- 47e7676: Generated Dockerfiles (`nodejs`, `nestjs`, `nextjs`, `payload`, and both `turborepo` apps) activate pnpm with `corepack enable`, which installs the version and sha512 hash in `package.json#packageManager`, instead of `npm install --global pnpm`. Their `node` base image is referenced by digest alone, and long `FROM` and `rm -rf` lines are split with backslash continuations.

## 4.0.0

### Major Changes

- 26a3bdd: Generated projects load fewer rules at session start: `git-workflow` and `script-driven-changes` are skills in `.agents/skills/`, and `constitution-changes`, `diagnostics-and-error-handling`, and `structured-logging` load only for matching files. Accepted risks in a tool's central file need an owner and a reason, and no expiry date.

## 3.0.0

### Major Changes

- 67ebf66: Generated projects follow Anthropic's AI-native SDLC Playbook in Claude Code and Cursor: `SETUP.md` replaces the setup steps in `README.md`; `intent/`, `lessons/`, `evals/`, `bands.yaml`, skills, a `verifier` subagent, and a review policy are written once in the project and in `.agents/`, and `pnpm rules:sync` renders them for each tool; sessions start in plan mode; new hooks format edits, block test edits during a bug fix, and gate production deploys; CI triages failed builds; `@claude` fixes review comments.

  Migration: generate a new project with the same stack, copy the new files, and follow its `SETUP.md`.

## 2.1.9

### Patch Changes

- 5bf1bfa: Generated Node.js, NestJS, Next.js, and Payload projects format `*.sh` files on commit, as Turborepo projects already do.

## 2.1.8

### Patch Changes

- c1d9f41: Generated projects deploy only from `main`, promote to `prod` only from runs on `main`, format `*.sh` files on commit in every stack, run the shell gate for every Claude Code shell tool. The turborepo CI no longer expands step outputs inside `run:`.

## 2.1.7

### Patch Changes

- 0a8567e: Each generated project's `AGENTS.md` lists the commands to run, including a single test, explains how the stack's code fits together, and names the stack's known pitfalls. The Turborepo guide points agents to the Next.js docs inside each app instead of the workspace root.

## 2.1.6

### Patch Changes

- 4353d52: Generated projects include Evidence, Platform and Library First, Logging, Constitution Changes, and Agent-Owned Work rules. The Dependencies rule accepts a maintained library that replaces custom code.

## 2.1.5

### Patch Changes

- c6f6604: Generated projects include a Descriptive Naming rule. Agents give paths and identifiers names that say what they hold, keep organization names out of them, and do not copy a sibling name that breaks the rule.

## 2.1.4

### Patch Changes

- 98aed8f: Generated projects include a Codebase Hygiene rule. Agents change existing code instead of accumulating new code, and git keeps the history.

## 2.1.3

### Patch Changes

- 8691e3b: Generated projects include `CLAUDE.md`, which imports `AGENTS.md`, so Claude Code loads the same agent guide as Cursor.

## 2.1.2

### Patch Changes

- d1b9a9f: This repository and generated projects run GitHub Dependency Review, CodeQL, and OpenSSF Scorecard. Generated projects also upload zizmor results to code scanning and pin TruffleHog with the CLI repository.
- acc8fa7: Generated projects run the production build from `pnpm check` and `pnpm verify`, so the `pre-push` hook matches the CLI gate.

## 2.1.1

### Patch Changes

- 29ee3af: Generated `turborepo` projects run affected Turborepo tasks on pull requests, cache eligible tasks, deploy only Railway services whose packages changed, and document how to add an Expo app under `apps/mobile`.

## 2.1.0

### Minor Changes

- a6617be: Add a `turborepo` stack. Generated projects are a pnpm workspace with a Next.js app in `apps/app` and a Payload backoffice in `apps/backoffice`. `pnpm dev` starts the app on port 3000 and the backoffice on port 3001. The backoffice API is REST at `/api`. The company checks, hooks, and CI match the other templates. Deploy to Railway updates both services on the same commit.

### Patch Changes

- a6617be: Generated `payload` projects serve the REST API at `/api`.

## 2.0.0

### Major Changes

- 35623d0: Generated `payload` projects serve the REST API. The admin panel is unchanged.

  Migration: call the REST API at `/api`.

## 1.0.0

### Major Changes

- e4018ec: Generate `nestjs` projects on TypeScript 7.0.2 and `@next-friday/eslint-config-friday` 5.1.0.

  The Nest CLI needs the TypeScript compiler API, which TypeScript 7.0 does not ship, so generated `nestjs` projects no longer use it. `@nestjs/cli`, `@nestjs/schematics`, and `nest-cli.json` are gone. `pnpm build` now runs `tsc -p tsconfig.build.json`, and `pnpm start`, `pnpm start:dev`, and `pnpm start:debug` compile with `tsc` and run `dist/main` with `node`. The scripts keep their names and `.env` handling.

  Migration: `nest generate` is no longer available in generated `nestjs` projects. Add modules, controllers, and services by hand.

## 0.1.0

### Minor Changes

- f909f4c: First release of `pnpm create @next-friday/app`.

  - Asks for a project name and a stack: Node.js, NestJS, Next.js, or Payload.
  - Copies the stack's bundled template, renames the project, and writes `.env` from `.env.example`.
  - Runs `git init --initial-branch=main` and `pnpm install`.
  - `<name>` and `--stack` skip the prompts, and `.` uses the current directory.
  - `--skip-git` and `--skip-install` skip the Git and install steps.
