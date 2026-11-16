---
type: llm
focus: trace
weight: 1
---

PASS if the turn asks, in plain chat text, one round of numbered questions about the files the change touches, the order of the work, the tests that prove it, or the options the engineer rules out, with a concrete recommended answer beside each question or a statement that it has none to recommend.
FAIL if the turn asks no question, uses the agent tool's question picker, or asks a question with no recommended answer and no statement that it has none.
