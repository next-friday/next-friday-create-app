# Claude Code

- `rules-file`: `~/.claude/rules/sdlc-models.md`. When the session sets `CLAUDE_CONFIG_DIR`, that folder stands in place of `~/.claude`, so the rule is `$CLAUDE_CONFIG_DIR/rules/sdlc-models.md`
- `rules-header`: Write no front matter: the agent tool loads every Markdown file of that folder into each new session.
- `model-switch`: the `/model` command, such as `/model sonnet`
- `subagent-model`: the `model` and `effort` fields of the subagent call; `model` takes `opus`, `sonnet`, `haiku`, or `fable`, so write a role's model in that form
- `advisor`: This agent tool also has an advisor tool: `/advisor opus` lets the session ask Opus by itself at the same moments, on the Anthropic API and Claude Platform on AWS only, and it is experimental. Say so in the reply.
- `role-format`: Write each role's model as `opus`, `sonnet`, `haiku`, or `fable`, then its effort.
- `question-tool`: the `AskUserQuestion` tool: one question per call, with two to four options, the recommended answer first and its label ending in "(Recommended)"
