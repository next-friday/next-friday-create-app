# Plan: Restore the `sdlc-help` skill and close the harness audit (fix)

Accepted by: @joetakara.

Test change accepted by: @joetakara.

## Files that change

- `plugins/sdlc/adapters/claude-code/evals/sdlc-help/` (restored): the three eval cases `explains-how-to-start-work`, `work-request-is-sent-to-sdlc`, and `unknown-playbook-is-not-invented`.
- `plugins/sdlc/source/skills/sdlc-help/SKILL.md` (restored): the help skill, with the `small` route for non-defects only and every defect on the fix route.
- `scripts/sync-plugin.ts` (changed): the plugin description names the help skill again, and a hook case can mark its commit as merged to `origin/main`.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): the fix row comes before the small row, the small row excludes defects, and a new step 6 asks one question at a time through the session's question tool, the recommended answer first, with no draft before the interview ends.
- `plugins/sdlc/adapters/tool-words.json` (changed): the `question-tool` word for Claude Code, `AskUserQuestion`.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/plan.md` (changed): the intent interview settles the problem, who is affected, the outcome and what success looks like, the constraints, and what is out of scope, one question at a time.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md` (changed): the plan interview asks one question at a time; the build stops when an area of concern has no `Decision:` line instead of proposing one; a changeset only when the project has `.changeset/`.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/small.md` (changed): a defect never qualifies and never goes on a `small/fix-` branch; it reads the four policies, runs the `verifier`, and for UI work does the visual check of `build.md` before it reports done.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md` (changed): every defect qualifies, and a new dependency, schema change, or public-interface change goes under **Risks**; it reads the four policies and `lessons/` for an earlier incident of the same class, asks one question at a time, and runs the `verifier`, plus the visual check for UI work, before it reports done.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` (changed): the `Skills at` hash also counts `.agents/skills`.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/maintain.md` (changed): a route other than `pull_request` is a runbook that the agent names and never runs; only a session a release manager started with `RELEASE_APPROVAL` runs one; the diagnosis reads `lessons/` first.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/deploy.md` (changed): it reads the deploy section of `SETUP.md` and the deploy workflow the team added, and keeps the production gate.
- `plugins/sdlc/source/skills/*-policy/SKILL.md` (changed): each description names the events that load it.
- `plugins/sdlc/source/agents/verifier.md` (changed): the verifier also exercises the two flows nearest to the change.
- `plugins/sdlc/source/hooks/sdlc-status.sh` and `sdlc-status.cases.json` (changed): rejected and withdrawn changes are not listed, nor a fix folder whose plan is on `origin`'s default branch.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed): a `small/fix-` branch needs a plan.
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/interviews-before-writing-intent/`, `build-interviews-before-planning/`, and `reported-problem-starts-the-plan/` (changed): the graders expect one question, not a numbered round.
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/deploy-stops-at-the-production-gate/fixture.md` and `scaffold.sh` (changed): the project holds a team-added release workflow and a `SETUP.md` deploy section, with no `DEPLOY_ENABLED`; the graders are unchanged.
- `plugins/sdlc/README.md` (changed): seven skills, a help skill among them, the status hook's new rules, and `--case` for a change with a full run before a release.
- Every file `pnpm plugin:sync` renders from the files above, in `.claude/`, `.cursor/agents/`, `templates/base/`, and `plugins/sdlc/adapters/claude-code/`.
- `.agents/review.md`, `REVIEW.md`, and the `review.md` and `REVIEW.md` of `templates/base`, `templates/payload`, and `templates/turborepo` (changed): the policy default is the harness file at `.claude/skills/<area>-policy/SKILL.md`, and the root drops the deploy layer.
- `bands.yaml` and `templates/base/bands.yaml` (changed): no `baseline:` key; the metric command supplies the window.
- `templates/base/.github/workflows/control-band.yml` (changed): the detection report goes to the log and the job summary, the diagnosis goes to the job summary, and a runbook is named, never run.
- `templates/base/.github/workflows/spec-on-intent-merge.yml` (changed): only `Status: accepted.` starts a spec, and `--allowedTools` grants `Task`, `Bash(git rev-parse *)`, and `Bash(gh api repos/*/rules/branches/*)` for the review subagent, the reviewed hash, and the branch rules.
- `templates/base/lessons/README.md` (changed): read `lessons/` for an earlier incident of the same class; the fix's failing test is the incident's regression case.
- `templates/base/SETUP.md` (changed): the two jobs that start work, the runbook rule, who writes intents, the product owner's Claude seat, the job summary, and one short **Deploy** section.
- `templates/<stack>/AGENTS.md` (changed): shorter; the production gate and the reply rules move out, and they gain the failing-test rule and the parallel-session rule, which ends with adding a session only while every stream can be reviewed. `AGENTS.md` at the root gains both rules too.
- `templates/payload/CONTRIBUTING.md` and `templates/turborepo/CONTRIBUTING.md` (changed): an **Architecture** section takes the long architecture prose from that stack's `AGENTS.md`.
- `src/arguments.ts`, `src/create.ts` (changed), `src/deploy-targets.ts`, `src/deploy-sections.ts`, `test/deploy-sections.test.ts`, `templates/deploy-railway/` (deleted), `test/arguments.test.ts`, `test/create.test.ts` (changed): the `--deploy` option and the Railway layer are gone, and the first commit's `Command:` line names no deploy target.
- `templates/<stack>/README.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml` (changed): the `deploy:railway` sections and markers are gone.
- `README.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml` (changed): no deploy option, no deploy layer, and one Template job per stack.
- `.changeset/restore-sdlc-help.md` (new, `minor`) and `.changeset/remove-deploy-option.md` (new, `major`).
- `intent/cloud-session-skills/spec.md` (changed): requirement 20 keeps `sdlc-help` and removes only `sdlc-status`.

## Order of work

The cause: commit `3cb3c6b` (spec requirement 20) removed `sdlc-help`, and the harness audit found nineteen places where the harness files contradict each other or the playbook. The product owner decided each one, and decided to remove the Railway deploy target.

1. Restore the `sdlc-help` eval cases and the skill, and run `pnpm plugin:sync`. Check: `pnpm plugin:check` passes and `ls .claude/skills templates/base/.claude/skills` lists `sdlc-help`.
2. Remove `--deploy` and the Railway layer from the CLI, the templates, the docs, and CI. Check: `pnpm test:coverage` is 100%, and `node dist/main.mjs app --stack nodejs --deploy none` fails with `Unknown option '--deploy'`.
3. Change the harness sources, the eval graders, and the hook cases, then run `pnpm plugin:sync && pnpm rules:sync`. Check: `pnpm plugin:check` runs the new `sdlc-status` cases and passes, `pnpm rules:check` passes, and `diff -r .claude/skills templates/base/.claude/skills` prints nothing.
4. Change the template workflows, `bands.yaml`, `SETUP.md`, and each stack's `AGENTS.md`. Check: a project generated from each stack passes `prettier --check` on its `SETUP.md` and `AGENTS.md`, and `actionlint` in CI.
5. Run the eval cases of what changed. Check: the `sdlc-help` cases pass as often as before their removal, and the three interview cases pass with one question.

## Risks

- The riskiest step is 2: the protected files `templates/base/.agents/hooks/agent-production-gate.sh` and `templates/base/scripts/check-agent-gates.ts` still hold `deploy:railway` sections, which the CLI no longer removes. A person commits their new text in this pull request; until then a generated project holds those markers.
- Step 2 changes `test/arguments.test.ts` and `test/create.test.ts` and deletes `test/deploy-sections.test.ts`, which the default branch holds, because the option they test is removed. `pnpm plan:check` refuses that on a `fix/` branch until a code owner who accepts it adds the `Test change accepted by:` line to this plan.
- One question at a time makes the interview take more turns. The eval cases keep the agent from writing a draft before it ends.
- The status hook reads `origin/HEAD` or `origin/main`; without a remote it lists every fix folder, as before.
- Option not taken: keeping `--deploy` with only `none`. A flag with one value adds nothing; consumers set up their own deploy.
- Option not taken: putting the help text in `AGENTS.md`. The product owner wants a command a person types, which starts no work.

## Proof

- `pnpm plugin:check`, `pnpm rules:check`, `pnpm lint:check`, `pnpm typecheck`, `pnpm knip`, and `pnpm test:coverage` at 100% pass.
- The `sdlc-status` cases for a merged fix plan, a fix plan on its branch, and a rejected and a withdrawn intent pass in `pnpm plugin:check`.
- The `check-plan.ts` self-test that a `small/fix-a` branch needs a plan passes.
- The `sdlc-help` and the three interview eval cases pass with `pnpm evals:run --case <name>`.
