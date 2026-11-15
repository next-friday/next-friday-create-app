# sdlc harness

The `sdlc` harness runs the software development loop: a skill that matches a request to a playbook and takes it to the next human gate, a help skill, a setup skill, a verifier subagent, the default policies, and three hooks.

## Where it loads from

`pnpm plugin:sync` renders `source/` into the folders each agent tool reads from the repository, in this repository's root and in `templates/base/`, so a project holds the harness and installs nothing:

| Path                         | Holds                                                                                                                                      |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/`            | The seven skills. Under `sdlc-mode/`: the playbooks, `tool-words/` with each agent tool's words, and `hooks/` with the three hook scripts. |
| `.claude/agents/verifier.md` | The subagent with the fields Claude Code reads.                                                                                            |
| `.cursor/agents/verifier.md` | The subagent with the fields Cursor reads.                                                                                                 |

Claude Code loads `.claude/skills/`, and so does Cursor: "For compatibility, Cursor also loads skills from Claude and Codex directories" ([Cursor: Agent Skills](https://cursor.com/docs/skills)). `.claude/settings.json` runs the hook scripts on the Claude Code events of `adapters/hooks.json`, and `.cursor/hooks.json` runs them on its Cursor events. A person commits both files, and `pnpm plugin:check` fails when one lacks an entry. Cursor also runs the entries of `.claude/settings.json` ([Cursor: Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks)), so a script exits with no output when its input holds `cursor_version` and its argument is one a Claude Code entry passes. Another agent tool reads `.claude/skills/sdlc-mode/SKILL.md`, the path `AGENTS.md` names.

Part of the harness does not load in these cases:

- **A Claude Code cloud session with several repositories,** in an Anthropic-hosted environment, runs no hook: it "reads only the `enabledPlugins` and `extraKnownMarketplaces` keys from each repository's `.claude/settings.json`, not permission rules, hooks, `env`, or other keys" ([Claude Code: Settings](https://code.claude.com/docs/en/settings)).
- **A cloud thread in a Claude project** loads neither the skills nor the hooks: "In a project's cloud thread, skills committed to a repository's `.claude/skills/` aren't available" ([Claude Code: Skills](https://code.claude.com/docs/en/skills)), and there "none of a repository's `.claude/settings.json` permission rules, hooks, or `env` apply, however many repositories the project has" ([Claude Code: Settings](https://code.claude.com/docs/en/settings)).
- **A Cursor cloud agent on Cursor's own machines** runs no `sessionStart` hook, so the status list does not show when it starts: "Deferred while cloud agents can still start in a read-only environment" ([Cursor: Hooks](https://cursor.com/docs/hooks)).
- **A Cursor cloud agent in its early read-only turns** runs no hook: "Hooks do not run during those turns. They start once the agent has a writable environment" (same page).
- **Cursor with Include Third-Party Plugins, Skills, and Other Configs turned off:** "Claude Code hooks load when **Include Third-Party Plugins, Skills, and Other Configs** is enabled" ([Cursor: Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks)), and its name covers skills. Leave it on, as it is by default.
- **Another agent tool** gets the skills by their path, and no subagent and no hooks.

## What this folder holds

| Path                          | Holds                                                                                                                                                                                                        |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/`                     | The skills, the subagent's text, the hook scripts with their case tables, and the scripts behind `plan:check`, `bands:check`, and `loop:measure`.                                                            |
| `adapters/`                   | `agents.json` for each tool's subagent fields, `hooks.json` for each tool's hook events, `tool-words.json` for the words `tool-words/` holds, and `vendor-names.json` for the names `source/` must not hold. |
| `adapters/claude-code/`       | The render of `source/` as a plugin, which only `claude plugin eval` loads. `pnpm plugin:sync` writes it.                                                                                                    |
| `adapters/claude-code/evals/` | The eval cases, authored there.                                                                                                                                                                              |

## Hooks

`sdlc-status.sh` runs as a `SessionStart` hook for Claude Code and a `sessionStart` hook for Cursor. When a session starts, it lists each `intent/<change>/` whose intent and spec are not `Status: done.`, `Status: rejected.`, or `Status: withdrawn.`, with its stage and who acts next, and leaves out a fix folder, which holds only `plan.md`, once that plan is on `origin`'s default branch. It reads the files and that one Git ref, and prints nothing when there is no such change or no `jq`. Claude Code adds the plain text to the session's context; Cursor gets it as `additional_context` from `sdlc-status.sh json`. `pnpm plugin:check` runs the hook against `source/hooks/sdlc-status.cases.json`.

`check-push.sh` runs before a shell command, as a `PreToolUse` hook on `Bash` for Claude Code and a `beforeShellExecution` hook for Cursor. It reads only `git push`, and refuses it when the last commit is not the hash in the file `git rev-parse --git-path sdlc-review` names, which `playbooks/open-pr.md` step 4 writes after the review, or when a commit on the branch changes a file that the branch's one `plan.md` does not name without changing that `plan.md`. The file is written by the agent, so the hook makes a skipped review visible rather than impossible; the review's findings on the pull request are the record a code owner reads.

`check-reply-shape.sh` is a POSIX `sh` script that reads the hook input with `jq`, run as a `UserPromptSubmit` and a `Stop` hook for Claude Code and as three hooks for Cursor. It checks only a reply whose first line starts with `**Answer:**`, `**Result:**`, or `**No change:**`, and it blocks that reply once, with a reason that asks for the whole reply again, when the reply:

- names a pull request or an issue by number outside a URL, a fenced block, and a code span that holds more than the bare number;
- does not end with a line that starts with `**Now:**`, unless the reply is a `**No change:**` line alone;
- holds more than one URL on its `**Now:**` line;
- links a list page on its `**Now:**` line: a URL that ends with `/pulls` or `/issues`;
- links, on its `**Now:**` line, a URL that its `**Not yet:**` line names;
- holds more than one `**Not yet:**` line outside a fenced block;
- has no line that starts with `**Checks:**` outside a fenced block, when a file outside `intent/` changed during the turn.

To know what changed during the turn, the script takes a snapshot when the person sends a message: `check-reply-shape.sh snapshot` in Claude Code, `check-reply-shape.sh submit` in Cursor. It stores a checksum of the content of every file Git tracks or does not ignore, outside `intent/`, in a file named after the conversation under `${TMPDIR:-/tmp}/sdlc-reply-shape/`. When the agent stops, the script takes the checksum again and compares. It reads the content through a copy of the Git index and a scratch object store, both under that directory and deleted after each run, so staging and committing change nothing, and the project's index and objects are not written. It reads every file that changed since the copy of the index, and every untracked file each time, so a large untracked file that Git does not ignore can take the hook past its ten seconds; the rule then does not apply to that turn. Outside a Git repository, on the first stop with no stored checksum, and when the session's folder moved to another repository, the rule does not apply. Only `intent/` at the repository's root is left out, and the content of a submodule is not read.

Cursor's `stop` hook gets no reply text, so `.cursor/hooks.json` runs the script from three hooks:

- `beforeSubmitPrompt` runs `check-reply-shape.sh submit`;
- `afterAgentResponse` runs `check-reply-shape.sh save`, which writes the reply text to a file named after the conversation under `${TMPDIR:-/tmp}/sdlc-reply-shape/` and prints nothing;
- `stop` runs `check-reply-shape.sh followup` with `loop_limit` 1. It reads that file and deletes it, and after a completed run with `loop_count` 0 it runs the same checks, and prints a `followup_message` with the same reason, which Cursor sends as the next message. Cursor therefore sends at most one follow-up.

The hook needs `jq` on the `PATH` and does nothing without it. `pnpm plugin:check` runs the hook against the cases in `source/hooks/check-reply-shape.cases.json`.

## Checks

Run each from the repository root. Each one runs its self-tests first and exits 1 on a problem or a self-test failure.

| Command             | Checks                                                                                                                                                                                                                                                                                            |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm plan:check`   | Each `intent/<change>/plan.md` against the plan template and its `spec.md`; a branch that changes code with no `plan.md`, except a `dependabot/` or `changeset-release/` branch; and a fix that edits a test the default branch holds, unless the plan says `Test change accepted by: @<handle>.` |
| `pnpm bands:check`  | `bands.yaml` against the rules for control bands.                                                                                                                                                                                                                                                 |
| `pnpm loop:measure` | For each `intent/<change>` folder, the days from intent to spec and the commits after each step.                                                                                                                                                                                                  |
| `pnpm plugin:check` | The rendered folders against `source/`; each relative path a rendered skill names; and the hook entries and the keys of `.claude/settings.json` and `.cursor/hooks.json`, in the root and in `templates/base/`.                                                                                   |

## Eval cases

The cases run with `claude plugin eval`, which loads the skills as the plugin `sdlc`, so a case's prompt names its skill with the prefix `sdlc:`. A case's tag says which command runs it:

| Command                | Cases                | Tools granted                                                                                                                          |
| :--------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm evals:run`       | tagged `no-shell`    | `Write` and `Edit`.                                                                                                                    |
| `pnpm evals:run:write` | tagged `needs-write` | `Write`, `Edit`, and `Bash`. `claude plugin eval` runs `Bash` only under an OS sandbox, which on Linux needs `bubblewrap` and `socat`. |

For a change, run only the cases of what changed: add `--case <glob>` to the command, for example `pnpm evals:run:write --case 'deploy-*'`; `--case` filters cases by name glob (`claude plugin eval --help`). Run both commands in full before a release.

A grader that requires no file, commit, or branch passes whatever the skill says unless its case may use the tool it forbids, so each case runs under the command that grants that tool.
