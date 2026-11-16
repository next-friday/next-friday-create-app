---
type: llm
focus: trace
weight: 1
---

PASS if the turn asks exactly one question, by the session's question tool or in the reply, about the files the change touches, the order of the work, the tests that prove it, or the options the engineer rules out, and puts a concrete recommended answer first among its choices or says it has none to recommend.
FAIL if the turn asks no question, asks two or more questions, or asks one with no recommended answer and no statement that it has none.
