# Plan: Load the `sdlc` harness from the project's own folders

Accepted by: @joetakara.

## Files that change

Paths are from the repository root. "Rendered" means `pnpm plugin:sync` writes the file from `plugins/sdlc/source/`; no one edits it by hand. A rendered or deleted tree is named here by its folder. The push hook compares literal paths and lets through a commit that also changes this file, so the commit that writes or deletes such a tree changes this file too.

**The harness source**

- `plugins/sdlc/source/hooks/check-reply-shape.sh` (changed): before it writes any state, exits with no output when its input holds `cursor_version` and its argument is empty or `snapshot`. Treats the new argument `submit` as it treats `snapshot`.
- `plugins/sdlc/source/hooks/check-push.sh`, `plugins/sdlc/source/hooks/sdlc-status.sh` (changed): each exits with no output, before any state write, when its input holds `cursor_version` and it has no argument. `sdlc-status.sh` names `/sdlc-mode`.
- `plugins/sdlc/source/hooks/check-reply-shape.cases.json`, `plugins/sdlc/source/hooks/check-push.cases.json`, `plugins/sdlc/source/hooks/sdlc-status.cases.json` (changed):
  - every case that passes the second tool's argument (`save`, `followup`, `json`, `submit`) carries `cursor_version` in its input, so a guard that exits on that field alone fails them;
  - each file gains a twin of a case that blocks or prints today: the same input with `cursor_version` and the first tool's argument, expecting no output;
  - `check-reply-shape.cases.json` gains a case whose snapshot is taken with `submit` and whose `followup` then blocks, and a case whose snapshot is asked for with `snapshot` under `cursor_version` and whose `followup` then finds no change;
  - `sdlc-status.cases.json` names the new command. No case name holds an agent tool's name.
- `plugins/sdlc/adapters/hooks.json` (changed): the second tool's `beforeSubmitPrompt` entry passes `submit`, so the two tools share no argument.
- `plugins/sdlc/adapters/tool-words.json` (changed): the six words stay, as the spec's Design says, and their layout changes: each tool gains its display name; the keys lose their braces; each value stands alone as one line, with no leading space, and a tool with no advisor has no `advisor` key.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): step 4 holds no tool word. It names the `rules-file` and `subagent-model` lines of the file under `tool-words/` whose first line names the agent tool the session runs in. With such a file and no rule or no line for a role, it starts the subagent on the role's default model from `setup-sdlc` step 3, chosen as that skill's steps 1 and 3 say, at the effort of the `large` budget or the nearest one the model offers; on the session's model only when the session offers no model of that family or there is no such file (spec requirement 18). It waits for each subagent's report in the same turn, because a subagent still running when the turn ends leaves `playbooks/build.md` step 4 without its advice. Names `/sdlc-mode` and `/setup-sdlc`.
- `plugins/sdlc/source/skills/setup-sdlc/SKILL.md` (changed): steps 2 and 5 and the sentence on choosing the main model name the lines of that same file in place of the tool words; it says the `advisor` line only when the file has one. With no file for the tool, it says so, writes no rule, and goes on to the `SETUP.md` report.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/maintain.md`, `plugins/sdlc/source/skills/sdlc-mode/playbooks/review.md`, `plugins/sdlc/source/skills/sdlc-mode/playbooks/question.md` (changed): name `/<skill>`.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` (changed): names `/<skill>`, and takes the `Skills at` hash from the folder that holds the skills, `../..` from the playbook. The source may not hold a tool's folder name, and in a project that folder is `.claude/skills/`, as spec requirement 7 asks.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed): its message names `/sdlc-mode`.
- `plugins/sdlc/adapters/claude-code/` (changed, rendered): the plugin that only `claude plugin eval` loads: the skills with `sdlc-mode/tool-words/`, the subagent, and the hooks in the plugin's own layout.
- `plugins/sdlc/adapters/claude-code/evals/` (changed, authored): a prompt keeps `/sdlc:<skill>`, because the eval tool loads the skills as the plugin `sdlc`. Every other line names `/<skill>`: the patterns, the graders, the expected outcomes, and the project text the two scaffolds write. The `not_contains` pattern of `sdlc-mode/reported-problem-starts-the-plan/case.yaml` rejects both forms. `sdlc-mode/verifier-runs-on-the-chosen-model` expects the `explore` role's default model, haiku, at the `large` budget's effort, when no rule can be read.
- `plugins/sdlc/adapters/cursor/` (deleted).
- `plugins/sdlc/README.md` (changed): says where the harness loads from, and states the limits of spec requirement 13.

**The sync script**

- `scripts/sync-plugin.ts` (changed):
  - Renders `skills/sdlc-mode/tool-words/claude-code.md` and `skills/sdlc-mode/tool-words/cursor.md` into every rendered copy of the skills. Each starts with a heading that names its tool, then one list item for each word. The text is what Prettier would write.
  - Renders the project folders, in the root and in `templates/base/`: `.claude/skills/` (the six skills, the tool-words files, and the three hook scripts under `sdlc-mode/hooks/`), `.claude/agents/verifier.md`, and `.cursor/agents/verifier.md`.
  - Builds, from `plugins/sdlc/adapters/hooks.json`, the hook entries each protected file must hold: for `.claude/settings.json`, `sh "$CLAUDE_PROJECT_DIR"/.claude/skills/sdlc-mode/hooks/<script> <argument>` with its event, matcher, and timeout; for `.cursor/hooks.json`, `sh .claude/skills/sdlc-mode/hooks/<script> <argument>` with its event and loop limit.
  - `--check` fails, with a message that names the file and the entry and says that a person commits it, when one of the four protected files lacks an entry, or holds `extraKnownMarketplaces`, `enabledPlugins`, or a `workspaceOpen` hook, or when `templates/base/.cursor/hooks/load-project-plugins.sh` exists. The script never writes those files.
  - `--check` fails when a relative path that a rendered skill or playbook names does not exist in its project folder.
  - `--check` counts as stale any file under a rendered `.claude/skills/`, `.claude/agents/`, or `.cursor/agents/` that the source does not produce.
  - `runHookCase` takes a case's snapshot with the argument the case names in `snapshotArgument`, or else with `submit` when the case's input holds `cursor_version`, or else with `snapshot`.
  - Removed, with their self-tests: the Cursor adapter, the plugin copy under `templates/base/plugins/sdlc/`, `renderTemplateMarketplace`, both reads of a marketplace file, `findSettingsProblems`, and `renderToolWords`. `findToolWords` stays, and now finds a tool word left in any rendered file.
  - Its self-tests cover the tool-words render, the project render, the protected-file check, and the reference check.

**The CLI (spec requirement 19)**

- `src/setup.ts` (changed): `commitProject` commits every file with the project's Git hooks, on `build/bootstrap-workspace` when the repository already has a commit, and reports `committed`, `branched`, `branch-taken`, or `failed`.
- `src/create.ts` (changed): writes the first commit's message from the CLI's name and version, the options, and the stack's hint; commits after a successful install unless the run skipped Git or the install or found a parent repository; the next steps name the branch and the pull request title, or print the commit to run.
- `test/setup.test.ts`, `test/create.test.ts` (changed): cover each result with real Git, the message, and the next steps.
- `README.md` (changed): **What the CLI does** gains the first commit.

**What the playbook says not to do (spec requirement 20)**

- `plugins/sdlc/source/skills/sdlc-mode/playbooks/small.md` (new) and `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): the small route and its row in step 1.
- `plugins/sdlc/source/scripts/check-plan.ts` and `templates/base/scripts/check-plan.ts` (changed): a `small/` branch of at most five changed files needs no plan.
- `plugins/sdlc/source/skills/sdlc-help/`, `plugins/sdlc/source/skills/sdlc-status/`, `plugins/sdlc/adapters/claude-code/evals/sdlc-help/`, `plugins/sdlc/source/hooks/check-verify.sh`, `plugins/sdlc/source/hooks/check-verify.cases.json` (deleted), with their rendered copies.
- `plugins/sdlc/adapters/hooks.json` (changed): no `check-verify.sh` entry. `scripts/sync-plugin.ts` (changed): `--check` fails on a stale harness hook entry in a protected file. Its rendered `plugins/sdlc/adapters/claude-code/.claude-plugin/plugin.json` names no help skill.
- `.claude/settings.json`, `.cursor/hooks.json`, `templates/base/.claude/settings.json`, `templates/base/.cursor/hooks.json` (changed by a person): lose the `check-verify.sh` entries.
- `AGENTS.md`, `CONTRIBUTING.md`, `templates/nodejs/AGENTS.md`, `templates/nestjs/AGENTS.md`, `templates/nextjs/AGENTS.md`, `templates/payload/AGENTS.md`, `templates/turborepo/AGENTS.md`, `plugins/sdlc/README.md`, `templates/base/SETUP.md` (changed): as requirement 20 says.

**The root project**

- `.claude/skills/`, `.claude/agents/verifier.md`, `.cursor/agents/verifier.md` (new, rendered).
- `.claude/settings.json` (changed by a person): loses `extraKnownMarketplaces` and `enabledPlugins`; gains the five Claude Code hook entries.
- `.cursor/hooks.json` (changed by a person): gains the six Cursor hook entries.
- `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json` (deleted).
- `.github/CODEOWNERS` (changed): names the owners of `.claude/skills/`, `.claude/agents/`, and `.cursor/agents/`, with the policy owner on the policy skills and on `sdlc-mode`.
- `AGENTS.md` (changed): the commands table, the architecture paragraph, convention 4, and convention 7 say where the harness loads from and name `/sdlc-mode`; the "Testing a skill" line tests in a generated project with `claude -p "/sdlc-mode <request>"`; the file names `.claude/skills/sdlc-mode/SKILL.md` for an agent tool with no command for the skill.
- `CONTRIBUTING.md`, `intent/README.md` (changed): name the new commands and folders.
- `intent/cloud-session-skills/plan.md` (new). `intent/cloud-session-skills/intent.md`, `intent/cloud-session-skills/spec.md` (changed): `Status: done.`; `spec.md` also takes the two fixes its review left for the next push: requirement 13 gains the limit that a Cursor cloud agent runs no hook in its early read-only turns, and the sentence of requirement 5 that quotes "All hooks receive a base set of fields" becomes two.
- `.changeset/cloud-session-skills.md` (new): one `minor` changeset for `@next-friday/create-app`.

**The template**

- `templates/base/.claude/skills/`, `templates/base/.claude/agents/verifier.md`, `templates/base/.cursor/agents/verifier.md` (new, rendered).
- `templates/base/.claude/settings.json`, `templates/base/.cursor/hooks.json` (changed by a person): as in the root; the second also loses its `workspaceOpen` hook.
- `templates/base/.cursor/hooks/load-project-plugins.sh` (deleted by a person).
- `templates/base/plugins/sdlc/`, `templates/base/.claude-plugin/marketplace.json` (deleted).
- `templates/base/.github/workflows/spec-on-intent-merge.yml`, `templates/base/.github/workflows/control-band.yml` (changed): send `/sdlc-mode` and pass no `--plugin-dir`.
- `templates/base/.github/workflows/plugin-evals.yml` (deleted). `templates/base/.github/zizmor.yml` (changed): holds no `adhoc-packages` rule and no comment for that workflow.
- `templates/base/scripts/check-plan.ts` (changed, rendered).
- `templates/base/SETUP.md` (changed): step 1 says that the CLI made the first commit, pushes it, and moves the description and owner edits to a branch after the push (spec requirement 19); says how the harness loads; names the new commands; names `.claude/skills/` in its `CODEOWNERS` lines and its policies paragraph; drops the sentence on `pnpm rules:sync` rendering a policy skill, the sentence on adding a marketplace to `strictKnownMarketplaces`, the `Plugin evals` paragraph, and the `--plugin-dir` paragraph; states the limits of spec requirement 13.
- `templates/base/intent/README.md` (changed): names the new commands and the playbooks' new path.
- `templates/nodejs/AGENTS.md`, `templates/nestjs/AGENTS.md`, `templates/nextjs/AGENTS.md`, `templates/payload/AGENTS.md`, `templates/turborepo/AGENTS.md` (changed): name `/sdlc-mode` and the path of spec requirement 9.
- `templates/nodejs/_gitignore`, `templates/nestjs/_gitignore`, `templates/nextjs/_gitignore`, `templates/payload/_gitignore`, `templates/turborepo/_gitignore` (changed): lose the line for the plugin copy's eval results.

## Order of work

1. On `origin/main`, before any change, run `pnpm evals:run` and `pnpm evals:run:write` and keep each case's score, because the eval results are not in Git. Check: both commands finish and print their scores.
2. Create `feat/cloud-session-skills` from `origin/main`. Commit `plan.md` with the `Accepted by:` line, `Status: done.` in `intent.md` and `spec.md`, and the two fixes in `spec.md`. Review the commit, push, and open the pull request, so that a person has a branch to commit to; its description lists the requirements still unmet. Check: `pnpm verify` passes in the `pre-push` hook.
3. Change the three hook scripts, their case files, `plugins/sdlc/adapters/hooks.json`, and `runHookCase`. Run `pnpm plugin:sync`. Check: `pnpm plugin:check` passes, the new cases among its hook cases.
4. Change the skills, the playbooks, `check-plan.ts`, and `plugins/sdlc/adapters/tool-words.json`, with the fallback of spec requirement 18. Check: `git grep -n "{{" plugins/sdlc/source` finds nothing, and `pnpm plan:check` passes with its self-tests.
5. Change the rest of `scripts/sync-plugin.ts`. Delete `plugins/sdlc/adapters/cursor/`, both marketplace files, `templates/base/plugins/sdlc/`, and `templates/base/.claude-plugin/`. Run `pnpm plugin:sync`. Check: its self-tests pass; `pnpm plugin:check` reports only the four protected files, with the entries each lacks and the keys each must lose, and `load-project-plugins.sh`; `pnpm exec prettier --check .claude .cursor/agents` passes.
6. Post one comment on the pull request with the exact new text of `.claude/settings.json` and `.cursor/hooks.json` for the root and for `templates/base/`, formatted by Prettier, the deletion of `templates/base/.cursor/hooks/load-project-plugins.sh`, and a link to each file's web editor on the branch. The product owner commits them there. Steps 7 to 10 do not wait for it. Check: in a scratch copy of the tree that holds those four texts and lacks that script, `pnpm plugin:check` passes.
7. Change the eval cases. Check: `git grep -n "/sdlc:" plugins/sdlc/adapters/claude-code/evals` finds a match only in a `prompt.md` and in the one pattern that rejects both forms.
8. Change the template's workflows, `zizmor.yml`, `SETUP.md`, `intent/README.md`, and each stack's `AGENTS.md` and `_gitignore`. Check: `git grep -n "plugins/sdlc\|plugin-dir\|next-friday-plugins" templates` finds a match only in the three files a person changes.
9. Change the root `AGENTS.md`, `CONTRIBUTING.md`, `intent/README.md`, `plugins/sdlc/README.md`, and `.github/CODEOWNERS`. Check: `git grep -n "/sdlc:"` finds a match only under `intent/`, in `CHANGELOG.md`, in the changeset, and in the eval cases as step 7 leaves them.
10. Add the changeset. Check: `pnpm changesets:check` passes.
11. When the product owner's commits of step 6 are on the branch, fetch them and put the unpushed commits of steps 3 to 10 on top. Check: `pnpm plugin:check` passes; `pnpm verify` passes at the root; a project generated from each of the five stacks passes its own `pnpm verify`, and holds no `plugins/` folder.
12. Run `pnpm evals:run` and `pnpm evals:run:write`. Check: every case that passed in step 1 passes; for one that does not, fix the skill's text, never the grader.
13. In a project generated from one stack, run `claude -p "/sdlc-mode how do I start new work"`. Check: the reply comes from the skill and names `/sdlc-mode`.
14. Run the `verifier` subagent and the advice review, review the commits, write the hash, and push. Check: the push passes the `pre-push` hook.
15. Start a Claude Code cloud session with this repository alone on the pull request's branch. Send it `/sdlc-mode where does each change stand`, then ask it to push a commit that has no review. Check: the session lists `/sdlc-mode`, `/sdlc-help`, `/sdlc-status`, and `/setup-sdlc`, and the `verifier` subagent; it refuses the push; and its command list holds no second `sdlc-mode` from `templates/base/.claude/skills/`.
16. Post on the pull request the steps for the person who runs Cursor, in the editor and in a cloud agent, with Cursor's settings at their defaults. The engineer who accepted this plan names that person before this step, as the spec's area of concern 3 decides. That person writes the result there. Check: `/sdlc-mode` is listed once, `verifier` is listed once, a `git push` of a commit with no review is refused with one message, and the checks run once when a turn ends.
17. Write the results of steps 12, 13, 15, and 16 in the pull request's description, and keep the pull request green as `playbooks/review.md` says.
18. Build spec requirement 19 in `src/setup.ts`, `src/create.ts`, their tests, `README.md`, and `templates/base/SETUP.md`. Check: `pnpm test` passes with the new cases, and a project generated from each stack passes its own `pnpm verify`.
19. Build spec requirement 20 and run the eval cases of `sdlc-mode` that route a request. Check: `pnpm plan:check` passes its small-branch self-tests, `pnpm plugin:check` passes once the person's commits are on the branch, and a project generated from each stack passes its own `pnpm verify`.

## Risks

- **The riskiest step is 4.** The skills no longer hold the tool words in their sentences: the agent reads a second file to learn the path of the models rule and how to pass a subagent's model. An eval case of `setup-sdlc` or `sdlc-mode` may fail. Steps 1 and 12 compare each case before and after. A case's score also varies between two runs of the same text.
- **Nothing can be pushed between step 2 and step 11.** `pnpm plugin:check` fails until a person has committed the protected files, and the `pre-push` hook runs it. Step 6 gives the person the text as soon as it is fixed, so that the wait runs beside the work.
- **Cursor may give a mapped Claude Code entry an input without `cursor_version`** (spec, area of concern 7). Then a hook acts twice in Cursor's editor. Step 16 shows it; the build stops and the spec changes.
- **A change to a hook entry after step 6** makes the person commit a protected file again. Step 3 fixes the entries, and no later step changes `plugins/sdlc/adapters/hooks.json`.
- **A session in this repository may find `templates/base/.claude/skills/` as a nested skills folder** and list each skill a second time under a longer name once it works on files there. Step 15 looks for it. It cannot happen in a generated project, which holds one `.claude/skills/`.
- **A project's own policy sits in `.agents/skills/`, which Cursor also loads,** so Cursor may list that policy and the default. This is so today with the plugin's default. Step 16 notes what Cursor lists.
- **CI does not run `pnpm plugin:check`;** only the `pre-push` hook does, as today. A protected file changed on the host's web editor is checked at the next push.
- **A project that already exists** keeps its plugin copy and its commands: the CLI copies the template once. Each takes this change through its own pull request.
- **The release.** The changeset is `minor`. With no other changeset pending, merging the pull request publishes `@next-friday/create-app` 9.15.0.
- Options not taken:
  - A plugin folder under `.claude/skills/`, which would keep `/sdlc:sdlc-mode`: Claude Code does not use a project `@skills-dir` plugin in a run that never shows the trust dialog, and the product owner decided `/sdlc-mode`.
  - Hooks in the frontmatter of `sdlc-mode`: they start only after a person sends `/sdlc-mode`, and none can run at the start of a session.
  - A second copy of the skills in `.cursor/skills/`: Cursor's page gives no rule for a skill held in two folders.
  - A link from `.claude/skills` to `.agents/skills`: the template ships through an npm package and to Windows checkouts.
  - Hook entries in `.claude/settings.json` alone, left to Cursor's import: a Cursor cloud agent loads project hooks from `.cursor/hooks.json`, and the reply-shape check needs Cursor's `afterAgentResponse`.
  - Telling Cursor from an environment variable: Claude Code started in Cursor's terminal could inherit it.
  - Rewording the text that calls the harness "the plugin", in the skills and in `.agents/review.md`: the spec leaves it as it is.
  - Adding `pnpm plugin:check` to CI: the spec does not ask for it.
  - A `model` field in the subagent or the skill files, for requirement 18: pstack sets none and passes the model on each subagent call (`pstack/skills/poteto-mode/SKILL.md` in https://github.com/cursor/plugins), and a skill's `model` lasts only "for the rest of the current turn" ([Claude Code: Skills](https://code.claude.com/docs/en/skills)).

## Proof

- **1:** `ls .claude/skills templates/base/.claude/skills` lists the six skills in each. `git ls-files "*SKILL.md"` lists no copy outside `.claude/skills/`, `templates/base/.claude/skills/`, `plugins/sdlc/source/`, and `plugins/sdlc/adapters/claude-code/`.
- **2:** `grep -L "disable-model-invocation: true"` over the six rendered `SKILL.md` files lists exactly the four policy skills.
- **3:** `git grep -n "{{" plugins/sdlc/source .claude/skills` finds nothing; `pnpm plugin:check` passes its vendor-name check and its tool-word check; the eval cases that expect the path of the models rule pass in step 12.
- **4:** `.claude/agents/verifier.md` holds `tools:` and `.cursor/agents/verifier.md` holds `readonly:`, in the root and in the template. Step 16 shows `verifier` once in Cursor.
- **5:** `pnpm plugin:check` passes with the entries in place. Its hook cases hold, for each script, the twin case that gives no output, and the two snapshot cases of `check-reply-shape.sh`. Step 16 shows one refusal and one run of the checks.
- **6:** `pnpm plugin:check` passes its protected-file check. `ls templates/base/plugins .claude-plugin .cursor-plugin templates/base/.claude-plugin` finds none of them. A project generated in step 11 holds no `plugins/` folder.
- **7:** `pnpm plugin:check` passes its check that every relative path a rendered skill or playbook names exists. `git grep -n "plugins/sdlc" plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` finds nothing.
- **8:** the `git grep` of step 9. It also proves brand rule 4, which the spec cites as this requirement.
- **9:** `grep -n ".claude/skills/sdlc-mode/SKILL.md" AGENTS.md templates/*/AGENTS.md` finds a line in each of the six files.
- **10:** `pnpm plugin:sync` followed by `git status --short` shows no change. The self-tests of `scripts/sync-plugin.ts` show the check failing on a stale rendered file, on an extra file, on a missing hook entry, and on a marketplace key.
- **11:** step 12 runs the eval cases. `ls plugins/sdlc/adapters` lists no `cursor`. A project generated in step 11 holds no eval cases and no `plugin-evals.yml`.
- **12:** `grep -n "plugin-dir\|/sdlc:" templates/base/.github/workflows/*.yml` finds nothing. Step 13 proves a non-interactive run.
- **13:** `grep -n -i "several repositories\|Claude project\|sessionStart\|read-only\|Third-Party\|another agent tool" templates/base/SETUP.md plugins/sdlc/README.md` finds each limit in both files.
- **14:** `git grep -n "next-friday-plugins\|marketplace" -- AGENTS.md CONTRIBUTING.md intent/README.md plugins/sdlc/README.md templates/base/SETUP.md templates/base/intent/README.md` finds no line on loading the harness. `grep -n "rules:sync" templates/base/SETUP.md` finds no line on a policy skill. `.github/CODEOWNERS` names the three new folders.
- **15:** steps 13, 15, and 16, with their results in the pull request's description.
- **16:** steps 11 and 12.
- **17:** `pnpm changesets:check` passes with one `minor` changeset. The reply that asks for this plan's acceptance names the version.
- **18:** in step 12, `sdlc-mode/verifier-runs-on-the-chosen-model` passes its grader that the reply names haiku, and the `large` budget's effort or the nearest one haiku offers, as the default with no rule. `grep -n "role's default from the table" .claude/skills/sdlc-mode/SKILL.md` finds step 4.
- **19:** `test/setup.test.ts` shows `commitProject` committing on `main` with the message, branching when the repository has a commit, refusing a taken branch, and reporting a commit a hook stops; `test/create.test.ts` shows the message, the branch and title, and the printed commit.
- **20:** `ls .claude/skills/sdlc-mode/playbooks/small.md` finds the route; the self-tests of `check-plan.ts` show a small branch passing and a larger one failing; `ls .claude/skills` lists no `sdlc-help` and no `sdlc-status`; `wc -w AGENTS.md` is under 700; the self-tests of `scripts/sync-plugin.ts` show a stale hook entry failing.
- **Policies:** the spec cites one policy rule, brand rule 4, as requirement 8. Security, compliance, and UX do not apply (spec, Policies).
