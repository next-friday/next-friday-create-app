---
name: sdlc-fix
description: Fixes a defect. It reproduces the defect as a failing test, plans the fix for the engineer to accept, and opens its pull request. Run it with /sdlc-fix.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          timeout: 10
          command: 'sh "{{hooks-directory}}"/check-reply-shape.sh snapshot'
  Stop:
    - hooks:
        - type: command
          timeout: 10
          command: 'sh "{{hooks-directory}}"/check-reply-shape.sh'
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          timeout: 60
          command: 'sh "{{hooks-directory}}"/check-push.sh'
---

# Fix

Read [`../sdlc-loop/SKILL.md`](../sdlc-loop/SKILL.md) and do its steps in order. In its step 1, follow [`../sdlc-loop/playbooks/fix.md`](../sdlc-loop/playbooks/fix.md) without matching the table. The one exception is a request that plainly fits another row of the table, such as a question: say so in one line, and follow that row.
