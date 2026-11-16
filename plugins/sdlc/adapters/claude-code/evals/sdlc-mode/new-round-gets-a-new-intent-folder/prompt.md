---
tags: [needs-write]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/sdlc:sdlc-mode write an intent for the next round of the export sync: the export service now also needs the 2.0 report format

My answers: the problem is that the 12 people of the accounting team cannot open 2.0 reports from the export, so they rebuild them by hand at every month end, about 20 minutes each (the figure is from the head of accounting). The outcome I want is that the export gives 2.0 reports that open in their tool. The constraint is that 1.0 exports keep working. Out of scope is the PDF export. I am Joe from the Developer Productivity team, and my account on the host is @joe-acct. No open questions.
