---
name: sdlc-plan
description: Writes the build plan of a merged spec for the engineer to accept, then builds it in one pull request. Run it with /sdlc-plan.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          timeout: 10
          command: 'sh "${CLAUDE_PROJECT_DIR}/.claude/skills/sdlc-loop/hooks"/check-reply-shape.sh snapshot'
  Stop:
    - hooks:
        - type: command
          timeout: 10
          command: 'sh "${CLAUDE_PROJECT_DIR}/.claude/skills/sdlc-loop/hooks"/check-reply-shape.sh'
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          timeout: 60
          command: 'sh "${CLAUDE_PROJECT_DIR}/.claude/skills/sdlc-loop/hooks"/check-push.sh'
---

# Plan

Read [`../sdlc-loop/SKILL.md`](../sdlc-loop/SKILL.md) and do its steps in order. In its step 1, follow [`../sdlc-loop/playbooks/build.md`](../sdlc-loop/playbooks/build.md) without matching the table. The one exception is a request that plainly fits another row of the table, such as a question: say so in one line, and follow that row.
