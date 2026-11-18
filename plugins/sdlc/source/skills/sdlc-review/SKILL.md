---
name: sdlc-review
description: Drives a pull request to its gate. It reads the review and the checks, fixes what they find, and reports who merges. Run it with /sdlc-review.
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

# Review

Read [`../sdlc-loop/SKILL.md`](../sdlc-loop/SKILL.md) and do its steps in order. In its step 1, follow [`../sdlc-loop/playbooks/review.md`](../sdlc-loop/playbooks/review.md) without matching the table. The one exception is a request that plainly fits another row of the table, such as a question: say so in one line, and follow that row.
