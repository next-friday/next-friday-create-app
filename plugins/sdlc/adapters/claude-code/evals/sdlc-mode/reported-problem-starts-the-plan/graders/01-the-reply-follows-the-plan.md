---
type: llm
focus: trace
weight: 1
---

PASS if the final reply has a Steps block that lists the intent playbook's steps, and the turn asks exactly one question, by the session's question tool or in the reply.
FAIL if the final reply has no Steps block, or the turn asks no question or more than one.
