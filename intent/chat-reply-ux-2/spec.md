# Spec: Make the chat light to read, and move process state into the tool's interface

From `intent/chat-reply-ux-2/intent.md`. Status: done.

Request: "Start" (translated from Thai), the product owner's answer after the merge of the intent's pull request, when told that the spec starts on their word. Later, on the setup skill: "Then fix it together with the chat UX matter, at the same time" (translated from Thai). Skills at `31e5f34`.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review. Outcome numbers are those of the intent's **Proposed outcome** section. The plugin's paths are under `plugins/sdlc/`.

## Requirements

The first line:

1. A reply that asks the person a question, or stops at a **Gate**, starts with `**Waiting for you:**` and says what the person does, in at most two sentences. **Proposal:** this is the label, and it takes the place of the list of the same name. Outcome 1.
2. No reply that asks a question starts with `**Result:** Not done:`. `**Result:**` with `Done.` or `Not done:` stays for a reply that reports work and asks nothing. Outcome 1.

Process state:

3. While the agent works, it writes no text to the chat between tool calls. The rule that asks for a progress note during long work is removed. Outcome 1.
4. When the session offers a task-list tool, each step of the playbook is an item of that list, as today, and the agent marks each one as it finishes it. Outcome 1.
5. No reply holds a **Steps** section. When the session offers no task-list tool, a reply on a task holds one line that gives the number of the current step and how many steps are left, and no wording of a playbook. Outcome 1.
6. A commit id, a version number, and a command's output appear only under **Checks**. Outcome 1.

Questions and plans:

7. A choice between ways is asked through the question picker that the `question-picker` word of the agent tool's file in `tool-words/` names. When that word names none, the choice is asked as a numbered round in plain chat text, as today. Outcome 3.
8. An open question, which asks what the problem is, why it matters, or what is out of scope, stays plain chat text with no answer offered. Outcome 3.
9. A plan is accepted through the plan approval that the `plan-mode` word names. When that word names none, the engineer accepts it in the chat, as today. Outcome 8.

Evidence:

10. **Checks** holds one line that names the checks that passed and counts them, such as "3 of 4 passed". Each check that did not pass, could not run, or was skipped follows in full: its command and the lines of its output that show the result. Outcome 4.
11. What a merge publishes stays in the reply, as today. Outcome 4.

Reading:

12. Every sentence of a reply is in the language the person writes in. No rule fixes a sentence in English: the line "Answer the question above in the chat." is removed, and the **Now** line of a question says the same in the person's language. Outcome 5.
13. A reply uses one numbered list at most, for what the person does or answers. Everything else is a list with no numbers. Outcome 6.
14. A sentence that raises a risk says, in the same sentence or the next, whether the person waits for it or goes on. Outcome 7.
15. A message that no person typed, and that changes nothing for the person, gets `**No change:**` and one sentence, once. Outcome 9. What a repeat of that message gets is area of concern 4.

Enforcement and delivery:

16. `check-reply-shape.sh` reads `**Waiting for you:**` as a first-line label, and blocks a reply once when a line of it starts with `**Steps`. Each of the two gains a case that blocks and a case that passes in `check-reply-shape.cases.json`. **Proposal:** these two are what a script can read with certainty; the other requirements are rules of `SKILL.md`.
17. `adapters/tool-words.json` gains the words `question-picker` and `task-list` for each agent tool. A word with no verified source says "not verified" and names none, as the `plan-mode` word of Cursor does today.
18. Every playbook, the `sdlc-help` skill, the plugin's `README.md`, and the eval cases state the rules of this spec, and none still says that every question is asked in plain chat text or that a reply holds **Steps**.
19. The eval cases gain one case for each of requirements 1, 3, 5, 7, and 10, and `pnpm evals:run` and `pnpm evals:run:write` are run and their scores reported, as `AGENTS.md` says for a change to a skill or a hook.
20. `pnpm plugin:sync` renders each changed file into `plugins/sdlc/adapters/` and `templates/base/`, and `pnpm plugin:check` passes.
21. `pnpm verify` passes in the root and in a generated project of each stack of `src/stacks.ts`.
22. The change is one pull request with one changeset for `@next-friday/create-app`. **Proposal:** `minor`, because a generated project's replies change shape. Merging its release pull request publishes that version to npm.

The setup skill, which the product owner asked to fix in the same change (area of concern 6):

23. `/setup-sdlc` sets the models and the efforts and stops: it does steps 1 to 5 of the skill, reads no `SETUP.md`, and edits no file of the project. **Proposal:** the steps that read `SETUP.md` and edit the project's files run only when the person sends `/setup-sdlc project`.
24. When a session that runs `sdlc-mode` finds no models rule at the path of the `rules-file` word, it writes the rule with the `balanced` budget and each role's default, as steps 1, 3, and 5 of `setup-sdlc` say, and asks nothing. This covers a cloud session, whose machine is new each time and holds no rule.
25. The reply does not mention that the rule was missing or written, unless a role's default has no offered model of its family.

## Design

**Proposal:** the change is not higher risk. It changes the text of rules and one hook, and no CLI argument, prompt, or stack name.

- `source/skills/sdlc-mode/SKILL.md`:
  - Step 2 keeps the task list and loses the sentence that puts the steps in the reply.
  - Step 6, "Ask in plain chat text", becomes two rules: an open question in plain chat text, and a choice through the picker of requirement 7.
  - "Reply shape" loses the progress-note rule and gains requirements 3, 6, 12, 13, and 14.
  - "Done or not done" covers `**Result:**` only, and a question or a **Gate** moves to requirement 1.
  - "The parts of a reply": the template block gains `**Waiting for you:**` as a first line, loses the **Steps** part and the list `**Waiting for you:**`, and gains the step line of requirement 5. The **Checks** rule becomes requirement 10. The **Now** rule loses its fixed English sentence.
- `source/skills/sdlc-mode/playbooks/intent.md`, `build.md`, and `design.md`: each sentence that names the **Steps** section, the question picker, or plain chat text for a round follows the rules above. `build.md` step 5 names the plan approval of requirement 9.
- `source/hooks/check-reply-shape.sh` and `check-reply-shape.cases.json`: requirement 16.
- `adapters/tool-words.json`: requirement 17. For Claude Code the words name the `AskUserQuestion` tool and the task tools. For Cursor both say "not verified".
- `source/skills/sdlc-help/SKILL.md` and `plugins/sdlc/README.md`: the description of a reply.
- `adapters/claude-code/evals/sdlc-mode/`: the cases that expect a numbered round in plain text for a choice, or a **Steps** section, change to the rules above, and the cases of requirement 19 are added.
- `source/skills/setup-sdlc/SKILL.md`: steps 6 to 8 move under the word `project`, and the description says so. `source/skills/sdlc-mode/SKILL.md` step 4: "With a file for the agent tool and no rule" writes the rule of requirement 24 in place of starting each subagent on a default and saying so. Requirements 23 to 25.
- `.changeset/<name>.md`: requirement 22. It names both matters.

Sources read at their pages for this spec:

- Nielsen Norman Group, "Less chat, more answer", <https://www.nngroup.com/articles/less-chat-more-answer/>: "In a recent study, 9 people with varying levels of digital and AI literacy interacted with 8 different site-specific AI chatbots." "A longer answer was not a better answer." "it's even more crucial to adhere to web-writing best practices, since the chat viewport is much smaller, so even a small paragraph can look like a wall of text." "Given the nature of the requests, the responses were often long. However, participants did not seem to mind because the responses were well formatted." These support requirements 1, 10, and 13.
- Catalan, Dizon, Monderin, and Kuang, "'I'm Not Reading All of That': Understanding Software Engineers' Level of Cognitive Engagement with Agentic Coding Assistants", CHI 2026 Workshop on Tools for Thought, <https://arxiv.org/abs/2603.14225>, abstract: "cognitive engagement consistently declines as tasks progress, and that current ACA designs provide limited affordances for reflection, verification, and meaning-making."
- Friedman and others, "Not Too Short, Not Too Long: How LLM Response Length Shapes People's Critical Thinking in Error Detection", <https://arxiv.org/abs/2603.06878>, abstract, 24 participants: "when the LLM output was incorrect, medium-length explanations were associated with higher participant accuracy than either shorter or longer explanations".
- Claude Code, Best practices, <https://code.claude.com/docs/en/best-practices>: "Claude comes back with multiple-choice questions about the parts you haven't pinned down". This supports requirement 7.
- Cursor, Plan Mode, <https://cursor.com/docs/agent/plan-mode>: "Agent researches your codebase, asks clarifying questions, and generates a reviewable plan you can edit before building." and "Click to build the plan when ready".

## Policies

- Brand: rule 4, one name for one thing and the same words for the same action. Requirements 1 and 16 give the first-line labels as fixed words. Area of concern 1 holds the conflict with requirement 12.
- Security: Does not apply. The change touches no chapter of the standard: it changes the wording of replies and one hook that reads a reply's text.
- Compliance: Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- UX: Does not apply. The plugin renders no page, screen, or form; the agent tool renders the chat, the task list, and the picker.

## Areas of concern

1. Brand rule 4 and outcome 5. The labels, such as `**Result:**` and `**Now:**`, are English words that `check-reply-shape.sh` reads, and outcome 5 puts a whole message in the person's language, its labels included.

   Decision: the labels stay the fixed English words, because the hook reads only what it can read with certainty, and every other word of a reply is in the person's language.

2. No policy; open question 2 of the intent. With no task-list tool and no text while the agent works, the person sees nothing from the plugin until the reply.

   Decision: nothing is written while the agent works, and the reply holds the step line of requirement 5. The agent tool's own interface shows the tool calls.

3. No policy; open question 1 of the intent. Requirement 7 reverses item 41 of `intent/sdlc-session-conformance/intent.md`, which refuses the picker for every question.

   Decision: the picker is used for a choice between ways only. An open question keeps item 41.

4. No policy. Outcome 9 gives a repeat of a host message no reply. A hook of the host that blocks the end of a turn makes the agent write something.

   Decision: a repeat gets `**No change:**` and one short sentence that says the work still waits for the person, and names no commit, check, or step.

5. No policy. The sources name the problem behind requirements 3 and 10 and do not test the remedy. Catalan and others find that engagement falls and ask for more support for reflection, not for silence. Friedman and others find an advantage for medium length, not for totals.

   Decision: requirements 3 and 10 stand on the originator's decision, and the spec cites those two sources for the problem only.

6. No policy. The intent does not hold the setup skill. The product owner raised it after the intent merged: a cloud session has no models rule, and `/setup-sdlc` also edits the project's files, so a session cannot run it at every start. An intent on the default branch is not rewritten.

   Decision: requirements 23 to 25 are part of this spec and of its one pull request, on the product owner's word, with no second intent.

7. No policy. Requirement 24 chooses the `balanced` budget for a person who was not asked.

   Decision: `balanced` is written without a question, because it matches the defaults the session uses today when the rule is missing. A person changes it with `/setup-sdlc`.

## Open questions

1. Answered by area of concern 3.
2. Answered by area of concern 2.
3. Three of the four sources were read at their pages and are quoted under **Design**. The fourth was not: its host sends the reader to `pmc.ncbi.nlm.nih.gov`, which the session's network refused. The search summary also gave its finding to a different study than the linked page. Requirement 12 therefore cites no source and stands on the originator's decision.
4. Carried forward. No source tests a coding agent's chat with a product owner, and none tests Thai. The count of four engineers that the intent gives for the first study is not in the abstract and was not read at the source.
5. Cursor's Plan Mode page says that the agent asks clarifying questions and that the person clicks to build the plan. No page read names a task-list tool or a picker tool of Cursor, so requirement 17 writes both as "not verified".
6. Answered by area of concern 1.
7. **Proposal:** no second reading before the spec. The eval cases of requirement 19 test the new shape, and their cost is told to the product owner before they run.
