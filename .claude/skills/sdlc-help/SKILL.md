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
- **A small change.** `../sdlc-mode/playbooks/small.md`. Its step 1 lists the conditions a change must meet.
- **Fixing a defect in behaviour that already exists.** `../sdlc-mode/playbooks/fix.md`. Its step 1 says what a defect is, and what starts at an intent instead.
- **What a reply looks like.** "Reply shape" in `../sdlc-mode/SKILL.md`. A reply that needs the person starts with `**Waiting for you:**`, and the steps are in the agent tool's task list.
- **Models, and the project's setup steps.** `../setup-sdlc/SKILL.md`. `/setup-sdlc` sets the models and edits no file of the project. `/setup-sdlc project` reports the steps of `SETUP.md` and does the ones an agent can do.
- **Who decides.** The steps marked **Gate** in the playbooks.
- **A mistake the agent repeats.** The project's agent instructions.
- **Company policy.** The four policy files, found as `../sdlc-mode/playbooks/design.md` step 2 says.
