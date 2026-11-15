# Plan: subagent role models and new intent folders (fix)

Accepted by: @joetakara.

## Files that change

- `plugins/sdlc/adapters/agents.json` (changed): the `verifier` gains `"model": "haiku"`, the `explore` default of `setup-sdlc` step 3.
- `scripts/sync-plugin.ts` (changed): `AgentConfig` gains `model?: string`; `findClaudeAgentFields` renders `tools`, then `model` when the subagent sets one, and its doc comment says so; a self-test case "a Claude Code subagent renders its model" proves it.
- `.claude/agents/verifier.md`, `templates/base/.claude/agents/verifier.md`, and `plugins/sdlc/adapters/claude-code/agents/verifier.md` (changed, rendered by `pnpm plugin:sync`): the frontmatter holds `model: haiku`. The Cursor copies do not change.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/plan.md` (changed): step 4 writes the intent in a folder that does not exist yet, and a later round of the same work gets its own folder.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` (changed): step 1, when `spec.md` already exists, says that new work starts from an intent in a new folder.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): the reply shape forbids deleting or rewriting a merged intent, spec, or plan, except its `Status:` line; and, from the `small/` branch this one replaces, the agent hands over only what a person can use as it is.
- The rendered copies of those three skill files in `.claude/skills/`, `templates/base/.claude/skills/`, and `plugins/sdlc/adapters/claude-code/skills/` (changed, by `pnpm plugin:sync`).
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/new-round-gets-a-new-intent-folder/` (new): `case.yaml`, `prompt.md`, `scaffold.sh`, and one grader. A done intent folder says one folder holds every sync and that its earlier spec and plan were removed, and the person asks for the next round.
- `.changeset/ready-to-use-handoff.md` (new, from the `small/` branch): `minor`. `.changeset/subagent-role-models.md` (new): `patch`.

## Order of work

The causes:

- **Verifier model:** `sdlc-mode/SKILL.md` step 4 tells the session to pass the role's model on each subagent call, but nothing in the subagent definition names the `explore` default. `grep -c model` prints 0 for `agents.json`, `.claude/agents/verifier.md`, and `templates/base/.claude/agents/verifier.md`. A call that carries no `model`, such as one made outside `sdlc-mode` step 4, starts the `verifier` on the session's model. No such call was observed in this session.
- **Intent folder:** `plan.md` step 4 says only that `<change>` is a short kebab-case name, and no playbook reads `intent/README.md`, which says each change has its own folder. When a merged intent says one folder holds every round and that its earlier spec and plan were removed, the agent follows it: the new eval case fails 4 runs of 6 today, rewriting `intent.md` and deleting `spec.md` and `plan.md`. `design.md` step 1 then stops at the existing `spec.md` with no next step, and https://github.com/soddee/soddee-b2b-platform/pull/26 deleted the done spec and plan to get past it.

1. Add the self-test case to `scripts/sync-plugin.ts` and run `pnpm plugin:check`: it fails, because the renderer drops `model`.
2. Render `model`, add it to `agents.json`, and run `pnpm plugin:sync` then `pnpm plugin:check` and `pnpm typecheck`: both pass, and each Claude Code `verifier.md` holds `model: haiku`.
3. Change `plan.md` step 4, `design.md` step 1, and the reply shape, then `pnpm plugin:sync`. Run `--case new-round-gets-a-new-intent-folder` three times: 9 of 9.
4. Run `pnpm verify`, `pnpm evals:run`, and `pnpm evals:run:write`, and report their scores. Generate a project of each stack in `src/stacks.ts` and run its `pnpm verify`.

## Risks

- The frontmatter `model` is a fallback. Claude Code picks a subagent's model from the call's `model`, then the definition's `model`, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the session's model (https://code.claude.com/docs/en/sub-agents.md, "Choose a model"). A role model that `/setup-sdlc` wrote and the session passes still wins. A person who sets `CLAUDE_CODE_SUBAGENT_MODEL` without `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` will see the `verifier` start on `haiku` instead.
- Cursor's `verifier.md` gets no model: its subagent fields were not checked against Cursor's documentation in this session.
- The new folder rule changes how a project that keeps every round in one folder, as https://github.com/soddee/soddee-b2b-platform does, writes its next round. Its earlier rounds stay as they are.
- This branch carries the reply-shape rule of https://github.com/next-friday/next-friday-create-app/pull/268, which the product owner moved here, so the release is minor: **@next-friday/create-app 10.1.0**.
- Options not taken: an eval case for the call's `model` input, because the frontmatter does not change that input, and `verifier-runs-on-the-chosen-model` already covers what step 4 says.

## Proof

- The self-test "a Claude Code subagent renders its model" fails today and passes after step 2: `pnpm plugin:check`.
- The eval case `new-round-gets-a-new-intent-folder` fails 4 of 6 today and passes 9 of 9 after step 3: `claude plugin eval plugins/sdlc/adapters/claude-code --scaffold --allow-tools Write Edit Bash --case new-round-gets-a-new-intent-folder -j 3 --trust-plugin --ablation none`.
