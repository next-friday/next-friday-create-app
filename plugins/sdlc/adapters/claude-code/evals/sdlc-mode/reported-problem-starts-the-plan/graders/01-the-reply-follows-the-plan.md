---
type: llm
focus: trace
weight: 1
---

PASS if the turn follows the intent playbook and asks its questions: open questions in plain chat text, or one round of choices.
FAIL if the turn asks no question, asks an open question through the agent tool's question picker, or the final reply lists the playbook's steps.
