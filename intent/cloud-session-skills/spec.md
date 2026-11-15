# Spec: The `sdlc` harness loads from the project's own folders, in every agent tool

From `intent/cloud-session-skills/intent.md`. Status: done.

Request: "เขียน spec ของ intent/cloud-session-skills/intent.md". Skills at 51fc7a0.

## Requirements

In this spec, "a project" is this repository's root or a project generated from any stack in `src/stacks.ts`. A requirement holds in both unless it names one.

1. **One copy of the skills.** A project holds the seven skills at `.claude/skills/<skill>/`, with the playbooks of `sdlc-mode` beside its `SKILL.md`. Claude Code loads that folder, and so does Cursor: "For compatibility, Cursor also loads skills from Claude and Codex directories: `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, and `~/.codex/skills/`" ([Cursor: Agent Skills](https://cursor.com/docs/skills)). The change ships no second copy in a folder a session loads skills from.
2. **The commands.** `sdlc-mode`, `sdlc-help`, and `setup-sdlc` keep `disable-model-invocation: true`, so a person starts each by typing `/<name>`. The four policy skills do not set it, so the agent loads each when the work touches its area. Both tools read the field: in Cursor, "When `true`, the skill is only included when explicitly invoked via `/skill-name`" (same page).
3. **One text for every tool.** A skill's text is the same whichever tool reads it. The six tool words of `plugins/sdlc/adapters/tool-words.json` are rendered into one file for each tool, `.claude/skills/sdlc-mode/tool-words/<tool>.md`. Each file's first line names its tool. `sdlc-mode` and `setup-sdlc` tell the agent to read the file whose first line names the agent tool the session runs in, and say what to do when there is none. The eval cases that expect the path of the models rule still pass. `plugins/sdlc/source/` still names no agent tool, and `pnpm plugin:check` still fails when it does.
4. **The subagent.** A project holds `.claude/agents/verifier.md` with the fields Claude Code reads, and `.cursor/agents/verifier.md` with the fields Cursor reads. Cursor uses its own: "When multiple locations contain subagents with the same name, `.cursor/` takes precedence over `.claude/` or `.codex/`" ([Cursor: Subagents](https://cursor.com/docs/subagents)).
5. **The hooks.** The three hook scripts are in a project once, at `.claude/skills/sdlc-mode/hooks/`. `.claude/settings.json` runs them on the Claude Code events that `plugins/sdlc/adapters/hooks.json` lists, and `.cursor/hooks.json` runs them on the Cursor events it lists. Each entry runs its script through `sh`, as the plugin's entries do today, with the matcher, the argument, the timeout, and the loop limit that file gives. Each hook acts once in a session:
   - Cursor also runs the entries of `.claude/settings.json`: "Claude Code hooks load when **Include Third-Party Plugins, Skills, and Other Configs** is enabled", "The setting is on by default", and "All matching hooks from every source run" ([Cursor: Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks)).
   - So when Cursor runs a script, the script acts only for an entry of `.cursor/hooks.json`:
     - it knows that Cursor runs it from `cursor_version` in its input. Cursor's page lists that field in the table under "All hooks receive a base set of fields" ([Cursor: Hooks](https://cursor.com/docs/hooks), "Common schema"). The script reads no environment variable for this, so Claude Code acts as today when a person starts it in Cursor's terminal;
     - it knows the entry from its argument. In `plugins/sdlc/adapters/hooks.json`, no Cursor entry shares an argument with a Claude Code entry: the one both pass today, `snapshot`, becomes another word for Cursor.
   - A hook case of each script proves both: Cursor's input with a Claude Code entry's argument does nothing, and Claude Code's input acts as today. In Cursor, an issue shows it when it does not hold (area of concern 7).
6. **Nothing loads the harness as a plugin.** After the change:
   - `.claude/settings.json` holds no `extraKnownMarketplaces` and no `enabledPlugins`;
   - `.cursor/hooks.json` holds no `workspaceOpen` hook, and `.cursor/hooks/load-project-plugins.sh` is gone;
   - `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json` are gone;
   - a generated project holds no `plugins/sdlc/` folder.

   So no session loads a skill or the subagent twice. Requirement 5 covers the hooks.

7. **Every reference resolves.** Each relative path a skill or a playbook names resolves in the rendered folders, such as `../../<area>-policy/SKILL.md`, `../../../agents/verifier.md`, and `../sdlc-mode/SKILL.md`. A project's own policy at `.agents/skills/<area>-policy/SKILL.md` is still read before the default. `playbooks/design.md` takes the `Skills at` hash from `.claude/skills/`, which every project holds, in place of `plugins/sdlc`.
8. **The command names.** `git grep -n "/sdlc:"` finds a match only under `intent/`, in `CHANGELOG.md`, in the changeset of requirement 17, and in the eval cases of requirement 11. Everywhere else the text names `/<skill>`.
9. **Another agent tool.** The root `AGENTS.md` and each stack's `AGENTS.md` name `.claude/skills/sdlc-mode/SKILL.md` as the file an agent reads and follows when its tool has no command for the skill.
10. **One source, checked.** `plugins/sdlc/source/` stays the only authored copy. `pnpm plugin:sync` renders the folders of requirements 1, 3, 4, and 5 in the root and in `templates/base/`. `pnpm plugin:check` fails:
    - on a rendered file that is stale, missing, or not in the source;
    - when `.claude/settings.json` or `.cursor/hooks.json`, in the root or in `templates/base/`, lacks a hook entry of requirement 5 or holds an entry requirement 6 removes. The message names the file and the entry, and says that a person commits it.
11. **The eval cases.** `pnpm evals:run` and `pnpm evals:run:write` still run, against `plugins/sdlc/adapters/claude-code/`, which this repository keeps as the rendered plugin the eval tool needs: "Target is a path, a plugin name, or a `plugin@marketplace` id" (`claude plugin eval --help`). The cases send `/sdlc:<skill>`, because that tool loads the skills as the plugin `sdlc`; the text they expect in a reply names `/<skill>`. `plugins/sdlc/adapters/cursor/` is gone. A generated project holds no eval cases and no `Plugin evals` workflow (area of concern 2).
12. **The CI jobs of a generated project.** `Spec on intent merge` and `Control band` send `/sdlc-mode` and pass no `--plugin-dir`. A non-interactive run loads the project's skills: "Include `/skill-name` in the prompt string and Claude Code expands it before running" ([Claude Code: Run Claude Code programmatically](https://code.claude.com/docs/en/headless.md)).
13. **The limits are written down.** `templates/base/SETUP.md` and `plugins/sdlc/README.md` state each case in which part of the harness does not load, with its source:
    - a Claude Code cloud session with several repositories, in an Anthropic-hosted environment: no hooks;
    - a cloud thread in a Claude project: no skills and no hooks;
    - a Cursor cloud agent on Cursor's own machines: no `sessionStart` hook, so the status list does not show when it starts. Cursor's page says of that hook: "Deferred while cloud agents can still start in a read-only environment" ([Cursor: Hooks](https://cursor.com/docs/hooks));
    - a Cursor cloud agent in its early read-only turns: no hook. "Hooks do not run during those turns. They start once the agent has a writable environment" (same page, "Cloud agent support");
    - Cursor with **Include Third-Party Plugins, Skills, and Other Configs** turned off: Cursor's page names that setting for the Claude Code hooks it loads, and its name covers skills, so `SETUP.md` says to leave it on;
    - another agent tool: the skills by their path, and no subagent and no hooks.
14. **The documents.** These say how the harness loads after the change, and name no marketplace and no plugin folder of a generated project: `AGENTS.md`, `CONTRIBUTING.md`, `plugins/sdlc/README.md`, and `intent/README.md` in the root; `SETUP.md` and `intent/README.md` in `templates/base/`. The policies paragraph of `SETUP.md` no longer says that `pnpm rules:sync` renders a project's own policy skill: `scripts/sync-agent-rules.ts` renders no skill. `.github/CODEOWNERS` names the owners of the new folders.
15. **Proof in real sessions.** Before a code owner approves the build's pull request, its description holds the result of each of these. When one fails, the build stops and this spec changes before the code does.
    - **Claude Code, a cloud session with one repository,** started on the pull request's branch: the session lists the three typed commands and the `verifier` subagent, and refuses a `git push` of a commit that has no review.
    - **Claude Code, a non-interactive run** in a project generated from one stack: `claude -p "/sdlc-mode how do I start new work"` answers from the skill.
    - **Cursor:** not run before the merge. A person on the team who finds that the harness does not work in Cursor opens an issue (area of concern 3).
16. **The checks.** `pnpm verify` passes at the root and in a generated project of each stack. The pull request reports the scores of `pnpm evals:run` and `pnpm evals:run:write`.
17. **The release.** The pull request has one changeset of type `minor` for `@next-friday/create-app`: a generated project gets commands under new names, and "A template change is therefore `patch` or `minor`, never `major`" (`.changeset/README.md`). Before it opens, the user is told the version it publishes.
18. **A subagent's model with no rule.** With a tool-words file for the agent tool and no models rule, a rule the session cannot read, or no line for a role, `sdlc-mode` starts that role's subagent on the role's default model from the table of `setup-sdlc` step 3, `haiku` for `explore` and `opus` for `advise`, in place of the session's model, and says so in the reply. It picks the offered model of that family as `setup-sdlc` steps 1 and 3 do, the newest when there are several, and passes the effort of the `large` budget, which `setup-sdlc` step 4 says "matches the defaults", or the nearest effort that model offers. It starts the subagent on the session's model only when the session offers no model of that family, or when there is no tool-words file for the agent tool. The product owner decided this. It is how pstack chooses a subagent's model: "A role with no line in the rule keeps the skill's default" (`pstack/docs/guide/01-setup.md` in https://github.com/cursor/plugins).
19. **The first commit names where the project came from.** After `pnpm install` succeeds in a repository the CLI created or found at the project root, the CLI commits every file of the project with the project's own Git hooks, with this message:

    ```text
    build(repo): bootstrap <stack> workspace

    Generated by @next-friday/create-app <version>.

    Command: pnpm create @next-friday/app <name> --stack <stack> --deploy <deploy>
    Stack: <stack> (<the stack's hint in src/stacks.ts>)
    ```

    The command is built from the options the run used, the prompted ones included. When the `Command:` line would pass the 100 characters the project's commitlint allows on a body line, it breaks before the name and before `--stack`, each break a shell line continuation. When the repository already has a commit, which the project's `pre-commit` hook would refuse on `main`, the CLI first creates the branch `build/bootstrap-workspace`, and the next steps name that branch and the subject as the pull request title. When the branch exists, a Git hook stops the commit, or the run used `--skip-git`, `--skip-install`, or a parent repository, the CLI makes no commit and the next steps print `git add --all` and a `git commit` with one `-m` for each line of the message. `templates/base/SETUP.md` step 1 and the README's **What the CLI does** say so. Today a person types `git commit -m "chore(repo): start from template"`, which records nothing a later reader can use, and squash merges keep it as the last commit of every file nobody edits. The product owner decided this.

20. **What the playbook says not to do.** The product owner decided to remove these, each where the playbook advises against it:
    - **A small change skips intent and spec.** "A small, well-bounded fix arrives as a PR through the review gate, and anything larger is written up as `intent.md`" (playbook p. 52). `playbooks/small.md` takes a change of at most five files, none under `intent/`, with no new dependency, no schema or public interface change, and no decision left to a person, from a `small/` branch to one pull request; `pnpm plan:check` lets a `small/` branch of at most five changed files through with no plan.
    - **`AGENTS.md` fits on a page.** "Keep it under a page, because Claude reads all of it at the start of a session and anything stale is taking up context for no benefit" (p. 23). The root `AGENTS.md` keeps the commands, the conventions, and "the things Claude keeps getting wrong" (p. 23, step 2); the architecture and the template procedures move to `CONTRIBUTING.md`. Each stack's `AGENTS.md` points to the playbooks for plans, fixes, branches, commits, and pull requests in place of restating them.
    - **No skill for what a file or a hook already says.** "don't write a skill for components that belong in `CLAUDE.md` or a prompt" (p. 25). `sdlc-status` is removed; the `SessionStart` hook still lists where each change stands. `sdlc-help` stays: the product owner decided that a person needs one command that explains the workflow and starts no work.
    - **No full check at the end of every turn.** "build-phase hooks should be fast and scoped to the file that changed. Heavier checks such as the full test suite belong at the commit or the PR" (p. 27). `check-verify.sh` and its hook entries are removed; `pre-push` and CI run the checks. `pnpm plugin:check` fails while a protected file still holds a harness hook entry that `plugins/sdlc/adapters/hooks.json` no longer names.
    - **Evals of what changed, and the whole suite on a cadence.** "some teams may prefer to run these evals offline on a set cadence rather than on every change" (p. 34). After a change, the cases of what changed run with `--case`; both suites run in full before a release.

## Design

The rendered folders keep the plugin's own layout, `skills/` beside `agents/`, so the relative paths of requirement 7 resolve with no change to the text that names them.

| File                                                                                                        | Afterwards                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :---------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`, `plugins/sdlc/source/skills/setup-sdlc/SKILL.md`           | Hold no tool word. Each sentence that held one tells the agent to read `tool-words/<tool>.md` of `sdlc-mode` for the agent tool it runs in. With no rule or no line for a role, `sdlc-mode` starts the subagent on the role's default model (requirement 18). With no file for that tool, `sdlc-mode` starts each subagent on the session's model and says so, and `setup-sdlc` says that it has no words for that tool.    |
| The other files under `plugins/sdlc/source/`                                                                | Name `/<skill>` wherever they named `/sdlc:<skill>`: the skills, the playbooks, `hooks/sdlc-status.sh`, the hook cases, and `scripts/check-plan.ts`. Each hook script exits when Cursor started it from a Claude Code entry, as requirement 5 says. `playbooks/design.md` reads the hash from `.claude/skills/`. Text that calls the harness "the plugin" stays: it names each file by a relative path that still resolves. |
| `plugins/sdlc/adapters/tool-words.json`, `plugins/sdlc/adapters/hooks.json`                                 | The first holds the same data, and is rendered into the tool-words files. The second holds the same events; the Cursor entry of `check-reply-shape.sh` that passes `snapshot` passes another word, so that the two tools share no argument (requirement 5). It is what `pnpm plugin:check` compares the two protected files with.                                                                                           |
| `plugins/sdlc/adapters/claude-code/`                                                                        | The rendered plugin that only the eval tool loads, with the authored eval cases.                                                                                                                                                                                                                                                                                                                                            |
| `plugins/sdlc/adapters/cursor/`, `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`       | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `scripts/sync-plugin.ts`                                                                                    | Renders `.claude/skills/`, `.claude/agents/verifier.md`, and `.cursor/agents/verifier.md` in the root and in `templates/base/`, and the eval plugin in the root. Checks the two protected files as requirement 10 says. Renders no plugin copy and no marketplace file into `templates/base/`.                                                                                                                              |
| `.claude/skills/`, `.claude/agents/verifier.md`, `.cursor/agents/verifier.md`, in the root and the template | New, rendered. The hook scripts and the tool-words files are under `.claude/skills/sdlc-mode/`.                                                                                                                                                                                                                                                                                                                             |
| `.claude/settings.json`, in the root and the template                                                       | Holds the Claude Code hook entries. Each is `sh "$CLAUDE_PROJECT_DIR"/.claude/skills/sdlc-mode/hooks/<script>` with its argument and its timeout; the gates in that file already name their scripts by that variable. Holds no marketplace key. A person commits it.                                                                                                                                                        |
| `.cursor/hooks.json`, in the root and the template                                                          | Holds the Cursor hook entries. Each is `sh .claude/skills/sdlc-mode/hooks/<script>` with its argument and its loop limit, a path from the project root: "Project hooks run from the **project root**" ([Cursor: Hooks](https://cursor.com/docs/hooks)). Holds no `workspaceOpen` hook. A person commits it.                                                                                                                 |
| `templates/base/.cursor/hooks/load-project-plugins.sh`, `templates/base/plugins/sdlc/`                      | Deleted. A person deletes the first.                                                                                                                                                                                                                                                                                                                                                                                        |
| `templates/base/.github/workflows/spec-on-intent-merge.yml`, `control-band.yml`                             | Send `/sdlc-mode` and pass no `--plugin-dir`.                                                                                                                                                                                                                                                                                                                                                                               |
| `templates/base/.github/zizmor.yml`                                                                         | Holds no `adhoc-packages` rule and no comment for `plugin-evals.yml`.                                                                                                                                                                                                                                                                                                                                                       |
| `templates/base/.github/workflows/plugin-evals.yml`                                                         | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `templates/base/scripts/check-plan.ts`                                                                      | Rendered from the source, as today; its message names `/sdlc-mode`.                                                                                                                                                                                                                                                                                                                                                         |
| `templates/<stack>/AGENTS.md`, `templates/<stack>/_gitignore`, for each stack                               | `AGENTS.md` names `/sdlc-mode` and the path of requirement 9. `_gitignore` no longer names the eval results folder of the plugin copy.                                                                                                                                                                                                                                                                                      |
| `AGENTS.md`, `CONTRIBUTING.md`, `plugins/sdlc/README.md`, `intent/README.md`, `.github/CODEOWNERS`          | As requirements 9, 13, and 14 say. `AGENTS.md` tests a skill in a generated project with `claude -p "/sdlc-mode <request>"`. `.github/CODEOWNERS` names the owners of `.claude/skills/`, `.claude/agents/`, and `.cursor/agents/`.                                                                                                                                                                                          |
| `templates/base/SETUP.md`, `templates/base/intent/README.md`                                                | As requirements 13 and 14 say. The `CODEOWNERS` lines of `SETUP.md` name `.claude/skills/` in place of `plugins/sdlc/`, and `SETUP.md` no longer tells a person to add a marketplace to `strictKnownMarketplaces`.                                                                                                                                                                                                          |
| `.changeset/<name>.md`                                                                                      | New: the `minor` changeset.                                                                                                                                                                                                                                                                                                                                                                                                 |

The CI file filters need no change: `.github/file-filters.yml` already counts a Markdown file under `.claude/` as `agent_docs` and any other file there as `ci_policy`.

`intent/sdlc-plugin/` stays as written. It is the record of the earlier decision, which requirement 6 replaces.

## Policies

- **Brand:** Rule 4, one name for one thing: requirement 8 gives each command one name everywhere. The text the change rewords holds no other brand value (brand rules 2 and 3).
- **Security:** Does not apply. The change moves where an agent tool finds its instructions and hook scripts, not the application, so no ASVS chapter applies (security rule 1). It adds no secret (security rule 6).
- **Compliance:** Does not apply. The change handles no personal data (compliance rule 1).
- **UX:** Does not apply. The change adds no user interface (UX rule 1).

## Areas of concern

1. **Five changes are to files an agent may not edit** (a constitution rule; no policy).
   - `.claude/settings.json` denies an agent's edit to itself, to `.cursor/hooks.json`, and to `.cursor/hooks/`.
   - `.agents/rules/constitution-changes.md`: "write the exact new text and the files it goes in on the pull request; a person commits it to that branch."
   - The five are `.claude/settings.json` and `.cursor/hooks.json` in the root, the same two in `templates/base/`, and the deletion of `templates/base/.cursor/hooks/load-project-plugins.sh`.

   Decision: the build puts the exact text of each file on the pull request, and the product owner commits the four files and deletes the fifth on that branch from the host's web editor.

2. **A generated project loses its eval cases** (a decision the files do not settle; no policy).
   - Today a generated project holds the plugin copy with its eval cases, and `Plugin evals` scores them on a pull request that changes `plugins/sdlc/` or `.agents/`.
   - The eval tool takes a plugin as its target (requirement 11), and a generated project keeps none (requirement 6).

   Decision: a generated project holds no eval cases and no `Plugin evals` workflow. This repository scores the skills before each release.

3. **No check in this repository runs Cursor** (a decision the files do not settle; no policy).

   Decision: the product owner decided that no Cursor run blocks the merge. A person on the team who finds that the harness does not work in Cursor opens an issue.

4. **What another agent tool gets** (the intent's proposal; no policy).
   - The product owner has not named the tools the other 10% of the team use.

   Decision: requirement 9 as written. The build checks it in no other tool.

5. **The hook scripts stay outside the constitution** (a decision the files do not settle; no policy).
   - `.agents/rules/constitution-changes.md` counts hooks among the constitution, which is "the set of files that agent settings deny to agents".
   - The three hook scripts are not in that set today: they live under `plugins/sdlc/`, which the settings do not deny.

   Decision: they stay outside it, at `.claude/skills/sdlc-mode/hooks/`, under the code owners of that skill. The two files that run them stay inside it.

6. **Two limits in Cursor that the intent does not name** (a departure from the intent's outcome; no policy).
   - The intent says that in Cursor the hooks run, the one that shows the status among them, and that "The only exceptions are the two limits of Claude Code".
   - A Cursor cloud agent on Cursor's own machines runs no `sessionStart` hook (requirement 13), so no status list shows when it starts.
   - Cursor reads `.claude/skills/` under a setting that a person can turn off (requirement 13), so "nothing to set up" holds for Cursor's default settings.

   Decision: accept both as limits, and `SETUP.md` says to leave the setting on.

7. **How a script knows that Cursor runs it** (a decision the files do not settle; no policy).
   - Cursor's page says that it maps and runs the Claude Code hook entries. It does not show the input it gives a script for such an entry.
   - Requirement 5 relies on that input holding `cursor_version`, as the input of Cursor's own hooks does.

   Decision: requirement 5 as written. An issue that shows a hook acting twice in Cursor starts a change to requirement 5.

## Open questions

Each open question of the intent, in its order.

1. **The three claims about Cursor:** answered. Each is on Cursor's own page.
   - `workspaceOpen`: "This is an IDE lifecycle hook and doesn't apply to cloud agents" ([Cursor: Hooks](https://cursor.com/docs/hooks), "Hooks not available in cloud agents"). So a Cursor cloud agent has no plugin today.
   - Skill folders: the page lists `.agents/skills/` and `.cursor/skills/`, and the passage in requirement 1 adds `.claude/skills/`.
   - Hooks in a cloud agent: "If you have hooks defined in `.cursor/hooks.json` at the root of your project, cloud agents pick them up and run them during their work" (same page, "Cloud agent support").
2. **One copy for every tool, and a skill shown twice:** answered by requirements 1 and 3. Cursor's page gives a rule for a subagent held in two folders and none for a skill, so the change ships one copy. A person who sees Cursor list it twice opens an issue (area of concern 3). Cursor would run a hook twice, and requirement 5 says how each acts once.
3. **Who confirms the outcome in Cursor:** carried to area of concern 3.
4. **The tools of the other 10%:** carried forward. Area of concern 4 says what the build does without the answer.
5. **Hooks from `.claude/settings.json` in a cloud session with one repository:** answered from two pages, and proved by requirement 15.
   - "Your repo's `.claude/settings.json` hooks and permission rules" are available "Yes, in a session with one repository" ([Claude Code: Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md)).
   - Under "`claude -p` or the SDK, folder never trusted", hooks in settings files are "Used", and `extraKnownMarketplaces` entries from the repository are "Not used" ([Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions.md), "What runs before you trust a folder").
6. **The `verifier` subagent from `.claude/agents/` in a cloud session:** answered. "Your repo's `.claude/skills/`, `.claude/agents/`, `.claude/commands/`" are available: "Yes", "Part of the clone" ([Claude Code: Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md)). Requirement 15 proves it.
7. **The policy skills loading by themselves from a project folder:** answered. In Claude Code a skill loads by itself unless it sets the field that stops it: "Set to `true` to prevent Claude from automatically loading this skill" ([Claude Code: Skills](https://code.claude.com/docs/en/skills.md)). In Cursor, "By default, skills are automatically applied when the agent determines they are relevant" ([Cursor: Agent Skills](https://cursor.com/docs/skills)).
8. **The hook scripts without the plugin's root variable:** answered. No file under `plugins/sdlc/source/` reads `CLAUDE_PLUGIN_ROOT` or `CURSOR_PLUGIN_ROOT`; only the rendered hook entries do. The Design section gives the form of the new entries.
9. **The CI jobs in a non-interactive run:** answered by requirement 12. The same page says that such a run "discovers and loads them as an interactive session would, including anything configured in the working directory", and that it "runs the hooks in a project's `.claude/settings.json`".
10. **Whether the eval tool still needs a plugin directory:** answered. It does (requirement 11).
