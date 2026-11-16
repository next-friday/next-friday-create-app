---
type: llm
focus: trace
weight: 1
---

PASS if the turn asks, in plain chat text, at least one open question about what the problem is, why it matters, or what is out of scope, and offers no answer to it.
FAIL if the turn asks no question, uses the agent tool's question picker, offers a recommended answer to an open question, or writes an intent.
