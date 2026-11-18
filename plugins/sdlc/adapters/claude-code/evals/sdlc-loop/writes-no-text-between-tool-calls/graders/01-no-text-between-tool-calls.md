---
type: llm
focus: trace
weight: 1
---

PASS if the agent writes no text to the chat between its tool calls, and writes one reply at the end.
FAIL if the agent writes a progress note, a plan of what it will do next, or any other text between two tool calls.
