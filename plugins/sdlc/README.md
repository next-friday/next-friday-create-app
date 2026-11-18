# sdlc harness

The `sdlc` harness runs the software development loop: a skill that matches a request to a playbook and takes it to the next human gate, a help skill, a setup skill, a verifier subagent, the default policies, and the hooks of the loop.

## Where it loads from

`pnpm plugin:sync` renders `source/` into the folders Claude Code reads from the repository, in this repository's root and in `templates/base/`, so a project holds the harness and installs nothing:

| Path                         | Holds                                                                                                                                                                      |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/`            | The seven skills. Under `sdlc-loop/`: the playbooks, `tool-words/` with the agent tool's words, and `hooks/` with the hook scripts and `scripts/` with the loop's scripts. |
| `.claude/agents/verifier.md` | The subagent with the fields Claude Code reads.                                                                                                                            |

Claude Code loads `.claude/skills/`. Each entry skill (`sdlc-intent`, `sdlc-spec`, `sdlc-plan`, `sdlc-fix`, and `sdlc-review`) declares the hooks in its frontmatter, so Claude Code registers them when a person types one of its commands and keeps them for the rest of the session ([Claude Code: Hooks in skills and agents](https://code.claude.com/docs/en/hooks.md#hooks-in-skills-and-agents)). A skill's hooks are not kept across a resume, so after a resumed session the person types the command again. `.claude/settings.json` holds no hook of the skill, and `pnpm plugin:check` fails when it does. Another agent tool reads `.claude/skills/sdlc-loop/SKILL.md`, the path `AGENTS.md` names.

Part of the harness does not load in these cases:

- **A Claude Code cloud session with several repositories,** in an Anthropic-hosted environment, runs no hook: it "reads only the `enabledPlugins` and `extraKnownMarketplaces` keys from each repository's `.claude/settings.json`, not permission rules, hooks, `env`, or other keys" ([Claude Code: Settings](https://code.claude.com/docs/en/settings)).
- **A cloud thread in a Claude project** loads neither the skills nor the hooks: "In a project's cloud thread, skills committed to a repository's `.claude/skills/` aren't available" ([Claude Code: Skills](https://code.claude.com/docs/en/skills)), and there "none of a repository's `.claude/settings.json` permission rules, hooks, or `env` apply, however many repositories the project has" ([Claude Code: Settings](https://code.claude.com/docs/en/settings)).
- **Another agent tool** gets the skills by their path, and no subagent and no hooks.

## What this folder holds

| Path                          | Holds                                                                                                                                                                               |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/`                     | The skills, the subagent's text, and, inside `skills/sdlc-loop/`, the hook scripts with their case tables and the scripts `check-plan.ts`, `check-bands.ts`, and `measure-loop.ts`. |
| `adapters/`                   | `agents.json` for the subagent's fields, `tool-words.json` for the words `tool-words/` holds, and `vendor-names.json` for the names `source/` must not hold.                        |
| `adapters/claude-code/`       | The render of `source/` as a plugin, which only `claude plugin eval` loads. `pnpm plugin:sync` writes it.                                                                           |
| `adapters/claude-code/evals/` | The eval cases, authored there.                                                                                                                                                     |

## Hooks

`check-push.sh` runs as a `PreToolUse` hook on `Bash` for Claude Code. Before a `git push`, it runs `node .claude/skills/sdlc-loop/scripts/check-plan.ts` in the project folder, and it blocks the push with the script's output when the script exits non-zero. Any other command passes. The hook needs `jq` and `node` on the `PATH` and does nothing without them. `pnpm plugin:check` runs the hook against the cases in `source/skills/sdlc-loop/hooks/check-push.cases.json`.

`sdlc-status.sh` is a plain command, not a hook: `sdlc-loop/SKILL.md` step 1 runs `sh .claude/skills/sdlc-loop/hooks/sdlc-status.sh` when the request names no change. It lists each `intent/<change>/` whose intent and spec are not `Status: done.`, `Status: rejected.`, or `Status: withdrawn.`, with its stage and who acts next, and leaves out a fix folder, which holds only `plan.md`, once that plan is on `origin`'s default branch. It reads the files and that one Git ref, and prints nothing when there is no such change or no `jq`. `pnpm plugin:check` runs the script against `source/skills/sdlc-loop/hooks/sdlc-status.cases.json`.

`check-reply-shape.sh` is a POSIX `sh` script that reads the hook input with `jq`, run as a `UserPromptSubmit` and a `Stop` hook for Claude Code. It checks only a reply whose first line starts with `**Answer:**`, `**Result:**`, `**Waiting for you:**`, or `**No change:**`, and it blocks that reply once, with a reason that asks for the whole reply again, when the reply:

- names a pull request or an issue by number outside a URL, a fenced block, and a code span that holds more than the bare number;
- does not end with a line that starts with `**Now:**`, unless the reply is a `**No change:**` line alone;
- holds more than one URL on its `**Now:**` line;
- links a list page on its `**Now:**` line: a URL that ends with `/pulls` or `/issues`;
- links, on its `**Now:**` line, a URL that its `**Not yet:**` line names;
- holds more than one `**Not yet:**` line outside a fenced block;
- holds a line that starts with `**Steps` outside a fenced block, because the steps are in the agent tool's task list;
- has no line that starts with `**Checks:**` outside a fenced block, when a file outside `intent/` changed during the turn and the agent ran a tool that can write a file. The script reads that from the transcript the hook input names, so a file the person changed while the agent only read asks for no **Checks**. With no transcript, any change counts.

To know what changed during the turn, the script takes a snapshot when the person sends a message: `check-reply-shape.sh snapshot`. It stores a checksum of the content of every file Git tracks or does not ignore, outside `intent/`, in a file named after the conversation under `${TMPDIR:-/tmp}/sdlc-reply-shape/`. When the agent stops, the script takes the checksum again and compares. A checkout, a pull, a rebase, and a reset change files without writing any, so a different checksum counts only when the uncommitted changes differ too, or when a commit made since the snapshot holds a file outside `intent/`; the script reads those commits from the reflog of `HEAD`. It reads the content through a copy of the Git index and a scratch object store, both under that directory and deleted after each run, so staging and committing change nothing, and the project's index and objects are not written. It reads every file that changed since the copy of the index, and every untracked file each time, so a large untracked file that Git does not ignore can take the hook past its ten seconds; the rule then does not apply to that turn. Outside a Git repository, on the first stop with no stored checksum, and when the session's folder moved to another repository, the rule does not apply. Only `intent/` at the repository's root is left out, and the content of a submodule is not read.

The hook needs `jq` on the `PATH` and does nothing without it. `pnpm plugin:check` runs the hook against the cases in `source/skills/sdlc-loop/hooks/check-reply-shape.cases.json`.

## Checks

Run each from the repository root. Each one runs its self-tests first and exits 1 on a problem or a self-test failure.

| Command                                                 | Checks                                                                                                                                                                                                                                                                                                                                    |
| :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node .claude/skills/sdlc-loop/scripts/check-plan.ts`   | Each `intent/<change>/plan.md` against the plan template and its `spec.md`; a branch that changes code with no `plan.md`, except a `dependabot/` or `changeset-release/` branch; and a fix that edits a test the default branch holds, unless the plan says `Test change accepted by: @<handle>.` `--self-test` runs only its self-tests. |
| `pnpm harness:check <version>`                          | In a generated project, each harness file against the reference project of that create-app version. In this repository, `pnpm harness:check` runs only its self-tests.                                                                                                                                                                    |
| `node .claude/skills/sdlc-loop/scripts/check-bands.ts`  | `bands.yaml` against the rules for control bands.                                                                                                                                                                                                                                                                                         |
| `node .claude/skills/sdlc-loop/scripts/measure-loop.ts` | For each `intent/<change>` folder, the days from intent to spec and the commits after each step.                                                                                                                                                                                                                                          |
| `pnpm plugin:check`                                     | The rendered folders against `source/`; each relative path a rendered skill names; the hook scripts against their cases; `.claude/settings.json`, in the root and in `templates/base/`, for a hook entry of the skill and for the keys that load the harness as a plugin; and the self-tests of `check-plan.ts` and `check-bands.ts`.     |

## Eval cases

The cases run with `claude plugin eval`, which loads the skills as the plugin `sdlc`, so a case's prompt names its skill with the prefix `sdlc:`. A case's tag says which command runs it:

| Command                  | Cases                | Tools granted                                                                                                                          |
| :----------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm evals:run`         | tagged `no-shell`    | `Write` and `Edit`.                                                                                                                    |
| `pnpm evals:run:write`   | tagged `needs-write` | `Write`, `Edit`, and `Bash`. `claude plugin eval` runs `Bash` only under an OS sandbox, which on Linux needs `bubblewrap` and `socat`. |
| `pnpm evals:run:scripts` | tagged `script-only` | The same as `pnpm evals:run:write`. These cases have no `llm` grader, so the run calls no judge.                                       |

An eval run starts one agent session for each run of each case, so a full run costs money and takes minutes. A case has at most one `llm` grader, for the one thing no script can decide, and the two full commands judge it with `--judge-model sonnet`, because a small judge can mark a correct answer wrong ([Test plugins with evals](https://code.claude.com/docs/en/plugin-evals.md)). Spend a run in this order:

1. Read the trace of a failing run before you run anything again. The cause is in the reply and the tool calls of that run.
2. Change one thing, then run only its cases, one run each: `pnpm evals:run:write --case '<name>' --runs 1`. `--case` filters cases by name glob, and `--runs` sets the runs for each case (`claude plugin eval --help`).
3. When that passes, run the same cases at the default three runs.
4. After a change to a skill, run `pnpm evals:run:scripts`.
5. Run `pnpm evals:run` and `pnpm evals:run:write` in full once, before the pull request is ready to merge. Change no skill, hook, or eval file while a run is going.

Set `--max-cost-usd <n>` to stop a run at a budget. Use a `regex`, `tool_used`, or `file_exists` grader wherever a script can decide the result: it costs nothing and gives the same verdict every time. Write an `llm` grader as PASS and FAIL conditions on the last message. An `llm` grader on the trace sees only the first 12 and the last 12 messages of the session. Prove a new grader against a kept session (`--keep-temp`) before you trust its verdict.

A grader that requires no file, commit, or branch passes whatever the skill says unless its case may use the tool it forbids, so each case runs under the command that grants that tool.
