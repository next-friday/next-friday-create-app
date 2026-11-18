---
name: sdlc-intent
description: Turns an idea, a problem, or a finding into an intent and opens its pull request for the product owner. Run it with /sdlc-intent.
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

# Intent

Read [`../sdlc-loop/SKILL.md`](../sdlc-loop/SKILL.md) and do its steps in order. In its step 1, follow [`../sdlc-loop/playbooks/intent.md`](../sdlc-loop/playbooks/intent.md) without matching the table. The one exception is a request that plainly fits another row of the table, such as a question: say so in one line, and follow that row.
