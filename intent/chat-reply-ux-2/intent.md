# Intent: Make the chat light to read, and move process state into the tool's interface

Author: @joetakara (Developer Productivity). Status: done.

## Problem

The originator's words: the chat of a session that runs the plugin is confusing and very hard to read, work through it is very slow, a person should not tire from reading it, and it should use the tool's interface as much as it can.

Evidence. A reader with a fresh context, in the role of a product owner on a phone, read eight messages of one build session. The reader found the one thing to do, was 75% sure of it, and needed 30 to 40 seconds in one long message. The reader's three causes, in order:

1. Process state fills the chat: the **Steps** list in English, messages about a hook, a push and plan mode, and commit ids.
2. Four numberings overlap in one reply, and the reply names an accepted plan the reader never saw.
3. Messages disagree on who does a step, and raise a risk without saying whether the person waits.

A later turn of the same session sent twelve status messages, then one long reply, then a `**No change:**` message, to ask the person for two things.

The rules behind them, in `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`:

- Line 34 puts every playbook step in every reply when the session has no task-list tool.
- Line 123 starts a reply that only asks a question with `**Result:** Not done:`.
- Line 132 fixes the **Now** line of a question as an English sentence.
- Line 123 answers each host message with a `**No change:**` line; a hook that fires every turn makes one such message every turn.
- Line 49 forbids the question picker for every question.
- The reply shape asks for a one-line progress note during work that runs longer than a few minutes.

## Proposed outcome

The originator took outcomes 1 to 5 on the agent's recommendation. Outcomes 6 to 9 are the agent's proposal.

1. While the agent works, it sends no message to the chat. Progress is in the tool's task list. One message is sent when the work needs the person, and one when it ends. Source: Catalan et al., "I'm Not Reading All of That", a CHI 2026 workshop study of four software engineers, <https://arxiv.org/abs/2603.14225>: engagement falls as a task goes on.
2. The first line of a message is what the person does, in at most two sentences. Source: Nielsen Norman Group, "Less chat, more answer", <https://www.nngroup.com/articles/less-chat-more-answer/>, a study of 9 people and 8 chatbots: long answers with no formatting were the complaint.
3. A choice between ways is asked through the tool's question picker where the tool offers one. An open question stays plain chat text. Source: Claude Code, Best practices, <https://code.claude.com/docs/en/best-practices>: "Claude comes back with multiple-choice questions about the parts you haven't pinned down".
4. Evidence is a total, such as three of four checks passed. Only a check that did not pass is shown in full. Source: "Not Too Short, Not Too Long", <https://arxiv.org/abs/2603.06878>: explanations of medium length helped people find errors more than very short or very long ones.
5. A whole message is in one language, the one the person writes in, its labels and fixed sentences included. Source: a Spanish and English reading study found through <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4543796/>: regions that switch language are read more slowly.
6. A message uses one numbering.
7. A risk the message raises says whether the person must wait.
8. A plan is accepted through the tool's plan approval where the tool offers one.
9. A host message that changes nothing gets one sentence, once. While the state stays the same, a repeat of that message gets no reply.

Out of scope (proposal): the text the agent tool's own interface writes, and the playbooks' steps.

## Affected users and systems

- A product owner, an engineer and a reviewer who read a reply on a phone.
- The plugin: `sdlc-mode/SKILL.md`, `check-reply-shape.sh` with its cases, the eval cases, and the files in `tool-words/`.
- A generated project, which holds the plugin's copy.
- `@next-friday/create-app` on npm: the change needs a new version.

## Constraints

- The shape works in both agent tools the plugin is rendered for, and in a session with no task list and no picker.
- A message keeps the evidence it must hold: each check that did not pass, and what a merge publishes.
- The problem and what is out of scope stay in the person's own words.
- No human gate is added or removed.

## Open questions

1. Outcome 3 reverses item 41 of `sdlc-session-conformance` for choices between ways. Does the originator confirm it?
2. Outcome 1 removes the progress note the reply shape asks for today. With no task-list tool, what does the person see while the agent works? No proposal.
3. The sources of outcomes 1, 2, 4 and 5 were read only as search summaries, because the session could not reach their hosts. Each must be read at the source and quoted before the spec.
4. No source tests a coding agent's chat with a product owner, and none tests Thai. The two studies with people have 4 and 9 participants.
5. Which interface parts does the second agent tool offer? Not checked.
6. Outcome 5 sets a rule on language, which `chat-reply-ux` left out of scope.
7. The evidence is one reader and one session. Is a second reading wanted before the spec?
