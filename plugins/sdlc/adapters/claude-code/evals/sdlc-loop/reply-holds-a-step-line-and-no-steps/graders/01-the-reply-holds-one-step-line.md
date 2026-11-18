---
type: llm
focus: last_message
weight: 1
---

PASS if the final reply holds one line that gives the number of the current step of the playbook and how many steps are left, such as "Step 3 of 7, 4 left".
FAIL if the final reply holds no such line, or lists the playbook's steps one by one.
