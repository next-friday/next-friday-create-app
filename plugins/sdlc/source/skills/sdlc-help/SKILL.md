---
name: sdlc-help
description: Explains how this project's workflow runs and how to use /sdlc-mode. It answers and starts no work. Run it with /sdlc-help.
disable-model-invocation: true
---

# SDLC help

1. When the message asks for work rather than how, open no project file. The whole reply is two lines: this command starts no work; and, on the **Now** line, the message to send instead, which is `/sdlc-mode` followed by their own words.
2. When the topic is unclear, ask one question with these choices: how the workflow runs and starting work, keeping `/sdlc-mode` on for a session, a small change, fixing a defect in behaviour that already exists, who decides at each gate, a mistake the agent repeats, or company policy.
3. Read the files the topic points to before you answer. When a file disagrees with the map below, the file is right.
4. When the person asks about a playbook, a command, or a file that this project does not have, the whole reply is three lines: it does not exist; what exists instead, as one file path; and, on the **Now** line, one message they can send next. Stop there. Do not explain the topic from other files.
5. Otherwise answer, then list the files the answer came from, then give, on the **Now** line, one message the person can send as is: the word `Send` and then the whole message in a code span, with real words from their question, no blanks to fill in, and nothing the person must add.
6. Write the reply by the reply rules in `../sdlc-mode/SKILL.md`.

## Map

- **How the workflow runs, and starting work.** The table in `../sdlc-mode/SKILL.md`.
- **Keeping `/sdlc-mode` on for a session.** A person starts it; nothing routes work into it. How long an invoked skill's text stays in the conversation depends on the agent tool: a person sends `/sdlc-mode` again to restore the full text, or uses the agent tool's own way to keep a command active for a session.
- **A small change.** `../sdlc-mode/playbooks/small.md` takes a change that is not a defect, of at most five files, none under `intent/`, with no new dependency, no schema or public interface change, and no decision left to a person, from a `small/` branch to one pull request with no intent, spec, or plan.
- **Fixing a defect in behaviour that already exists.** `../sdlc-mode/playbooks/fix.md` is the path with no intent and no spec, for a person's request: a plan an engineer accepts, then a failing test, the fix, and a pull request. Every defect takes this path, never the small one; a complaint that no written target backs, such as a slow page with no stated limit, is not a defect and starts at intent. A defect takes this path even when the fix needs a new dependency, a schema change, or a public-interface change: the plan names it under Risks. A finding from a job always starts at intent. Every other change that is not small runs intent, spec, plan, then build.
- **Who decides.** The steps marked **Gate** in the playbooks.
- **A mistake the agent repeats.** The project's agent instructions.
- **Company policy.** The policy files, each the project's `.agents/skills/<area>-policy/SKILL.md` when it exists and the harness default at `../<area>-policy/SKILL.md` otherwise.
