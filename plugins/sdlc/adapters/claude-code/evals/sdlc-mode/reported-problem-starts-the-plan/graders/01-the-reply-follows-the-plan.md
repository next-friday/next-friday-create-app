---
type: llm
focus: trace
weight: 1
---

PASS if the final reply has a Steps block that lists the intent playbook's steps, and the turn asks its questions in plain chat text, as open questions or as one numbered round.
FAIL if the final reply has no Steps block, the turn asks no question, or the turn asks through the agent tool's question picker.
