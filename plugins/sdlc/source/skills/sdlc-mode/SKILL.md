---
name: sdlc-mode
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc-mode.
disable-model-invocation: true
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act. When the reply will hold **Request**, as the reply shape says, write those lines as your first message, before your first tool call, and write them again in the reply, under its first line: the reply holds **Request** even though the first message did.

   | The request                                                                                                                                                                                      | What to do                                                                                                                     |
   | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
   | A question, or a request to explain something without changing anything                                                                                                                          | Follow [`playbooks/question.md`](playbooks/question.md).                                                                       |
   | A spec for an intent, or a path to an `intent.md`                                                                                                                                                | Follow [`playbooks/design.md`](playbooks/design.md).                                                                           |
   | A build for a spec, a path to a `spec.md`, or a plan the engineer accepted                                                                                                                       | Follow [`playbooks/build.md`](playbooks/build.md).                                                                             |
   | A review or check of a pull request or a branch, a failing check on a pull request, or a pull request to drive to green                                                                          | Follow [`playbooks/review.md`](playbooks/review.md).                                                                           |
   | A deploy, a promotion to an environment, or a release to production                                                                                                                              | Follow [`playbooks/deploy.md`](playbooks/deploy.md).                                                                           |
   | A finding sent by a job, a monitor, or a trigger, or one the message says no person can answer questions about                                                                                   | Follow [`playbooks/maintain.md`](playbooks/maintain.md).                                                                       |
   | A defect: behaviour that breaks a spec, a test, or a documented target, or a crash or a wrong result                                                                                             | Follow [`playbooks/fix.md`](playbooks/fix.md).                                                                                 |
   | A small, well-bounded change that is not a defect, as step 1 of the small playbook defines it                                                                                                    | Follow [`playbooks/small.md`](playbooks/small.md).                                                                             |
   | An idea, a problem, a ticket, or an incident that a person describes, whether asked for or only reported, and a complaint that no written target backs, such as a slow page with no stated limit | Follow [`playbooks/plan.md`](playbooks/plan.md).                                                                               |
   | A pull request to open for the current branch                                                                                                                                                    | Follow [`playbooks/open-pr.md`](playbooks/open-pr.md).                                                                         |
   | Anything else                                                                                                                                                                                    | Say which of the rows above is closest and why it does not fit, answer what you can as `playbooks/question.md` says, and stop. |

   When a request both asks a question and reports a problem, use `question` and offer `plan` in one line. A problem reported with `/sdlc-mode` is the person's ask for `plan`.

   Do not start work a person did not ask for. When a message reports a problem without asking for work, answer in a few lines and give, on the **Now** line, the message that would start it: `/sdlc-mode` followed by their own words.

2. **Open the task list** when the session offers a task-list tool. Its first items are the matched playbook's numbered steps, each as its first sentence, the text up to the first full stop followed by a space, copied word for word, before any other task. A step you do not do stays in the list with `skip: <reason>`. Use `skip` only for a step you decide never to do. A step marked **Gate** is never skipped. When the session offers no such tool, the steps go in the reply instead, under **Steps**, and are never left out, except for `question` and a reply that stops in a few lines, as the reply shape says. When a playbook's **Hands off to** line chains another playbook, add that playbook's steps when you start it.
3. **Do the playbook's steps yourself,** stopping only at a step marked **Gate**, or before an action that cannot be undone. At a step marked **Gate**, wait for the person it names. When a playbook's **Hands off to** line says an agent runs the next file "in the same turn", read that file and continue without asking; otherwise stop at the Gate. Mark each step done in the task list as you finish it.
4. **Start each subagent on its role's model.** Read the files in [`tool-words/`](tool-words/): the one whose first line names the agent tool this session runs in holds that tool's words. Its `rules-file` line is the path of the rule that `/setup-sdlc` writes, which names a model and an effort for each role; read the rule when its lines are not in this session. Reading or searching more than a few files goes to a subagent on the `explore` model, and so does the `verifier`. The `advise` model reviews at the moments `playbooks/build.md` and `playbooks/fix.md` name. Pass the model and the effort as its `subagent-model` line says. With a file for the agent tool and no rule, a rule the session cannot read, or no line for the role, start the subagent on the role's default from the table of [`../setup-sdlc/SKILL.md`](../setup-sdlc/SKILL.md) step 3, chosen as that skill's steps 1 and 3 say: the offered model of the default's family, the newest when there are several. Pass the effort of the `large` budget in its step 4, or the nearest effort that model offers, write both as the `role-format` line says, and say so in the reply. When the session offers no model of that family, or there is no file for the agent tool, start the subagent on this session's model and say so. Start each subagent so that its report comes back in this turn, and wait for it before you go on: never end a turn while a subagent whose report the step needs is still running.
5. **Learn from a correction.** When a person corrects a mistake you made, and the same mistake was corrected before, in this conversation, in a review, or in the project's agent instructions, add one line that states the correct behaviour to the list of corrections in the project's agent instructions, in the pull request of the current task. When the mistake is in a playbook's steps, change that step in the same pull request.
6. **Ask one question at a time.** When a playbook step asks the person anything, ask a single question, wait for its answer, and build the next question on it. Use the question tool that the `question-tool` line of this agent tool's file in [`tool-words/`](tool-words/) names, with the answers as choices and the recommended answer first. When that file has no `question-tool` line, or there is no file for the agent tool, ask one question per message in the chat, with the recommended answer first. The question asks one thing, with one set of choices and no "or tell me" after them, and the turn asks nothing else: no second question, and no other thing the person must give, in any part of the reply, the **Steps** and the **Now** line included. What else you need waits for a later turn. Never write a draft, a spec, or a plan while a question is unanswered, even when the request looks complete.
7. **Write the reply in the shape below.**

## Reply shape

Run every command, the checks included, before you write the reply, and write the reply once. Write replies a person can check. State as a fact only what you opened or ran in this turn, say what you ran, and mark what you did not open or run in this turn as inferred or not checked. Answer what was asked and stop: never hand the person a check you could run. When a playbook step or step 1 says to answer in a few lines, or in two or three lines, and stop, the reply is those lines and the **Now** line: leave out **Request**, **Steps**, and **Checks**. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.

- Name each action by what it is. Call something a review only when a review ran; a reminder to check CI is a reminder.
- When a step fails for want of a permission, stop and say what failed and what the person can do, before you do anything in its place.
- When a gate or a check blocks you, report the block, the playbook step it enforces, and the person's options. Name the check that refused, as its message words it. The plan check, which `pre-push` and CI run, says a branch "adds or changes no `intent/<change>/plan.md`" and enforces `playbooks/build.md` step 5, where the engineer accepts the plan. The review check says a commit "has no review" and enforces `playbooks/review.md` step 2. Never write another artifact that the gate accepts in place of the one it asks for, such as a plan with no intent or spec to get past a plan check.
- Write an `Accepted by:` or `Author:` handle only when the person gave it, or when the host shows whose account the session runs as.
- Explain a technical term, such as a ruleset or a changeset, in a few words the first time a reply uses it.
- During work that runs longer than a few minutes, give a one-line progress note: what is done and what is next.
- Show text in the reply. Never point to a file the person cannot open.
- Hand the person only what they can use as it is: the whole file, the whole prompt, or the whole command. Never hand over a fragment, a diff to apply by hand, or a line to change in something you gave before: give the whole thing again.
- Never ask a person to edit a file at a **Gate**. The person gives the decision in the chat or on the pull request, and you write it.

Name a pull request, an issue, a branch, a workflow run, or a file by its full URL on the host that holds it, never by a number or a bare name. The person often reads the reply on a phone: a URL opens the page with one tap, and a number opens nothing.

When the person writes a number and a repository, build the URL before you write anything else: the repository's URL, then the host's path for the thing, such as `/pull/<number>` for a pull request or `/issues/<number>` for an issue. Use that URL where the person wrote the number, from the first line on. After the first mention you may say "this pull request", with no number.

For example, the person writes "who must approve pull request #7 of https://host.example/acme/shop":

- First line: "**Answer:** https://host.example/acme/shop/pull/7 waits for a code owner: the branch rules require that review."
- Last line: "**Now:** Ask a code owner to review it: https://host.example/acme/shop/pull/7"

When the branch rules require no review, the first line says instead that a person can merge it with no review once its checks pass, as `playbooks/open-pr.md` step 5 says.

The person reads the top of a reply and its last line first, so the answer and the one thing to do are there:

```markdown
**Answer:** | **Result:** | **No change:** <one of the three, in one or two sentences. `**Answer:**` answers a question. `**Result:**` says what the work produced, or what is known so far; a reply that only asks a question or stops at a gate starts with it too. `**No change:**` is for a message that no person typed, such as a finished check or a notice from the host, when it changes nothing for the person: say what happened and what the work still waits for, and send that one line as the whole reply.>

**Not yet:** <only when there is something the person must not do yet, such as merging a pull request that is not whole. What, and why, in one line. At most one such line.>

**Request:** <only in the first reply of a task. Three short sentences in your own words, starting `Goal:`, `Problem:`, and `Smallest change:`: the goal, the problem it solves, and the smallest change you expect to meet it, said as what changes for the user, never as files or code, which come from the interview and the plan. When you do not know it yet, never write that it is not known: name your best guess as one concrete change, such as "cache the session lookup": never a list of options, and never "the bottleneck, once found" or "whatever the evidence shows"; mark it as a guess, and say what you must learn to confirm it. Where the request holds a number, write the URL you built from it.>

**Done:** | **Doing:** | **Waiting for you:** <only for work that spans turns. Three short lists; leave out a list with nothing in it.>

**Steps:** <only when the session has no task-list tool, and never for the `question` playbook. Then it is in every reply of the task, including one that shows a draft or stops at a **Gate**. One line for each numbered step of the playbook: `1. <the step's first sentence, copied word for word>: done | open | skip: <reason>`. Copy the bold markers too, such as `5. **Gate: the originator corrects the draft.**: open`. When the turn ran more than one playbook, one list for each, under its file name on a line of its own, such as `playbooks/build.md`.>

**Checks:** <when a step ran checks, and always when the turn changed a file outside `intent/`, whichever playbook ran. Otherwise never for the `question` playbook. Each command, then the lines of its output that show the result, copied from the output. For a check that could not run, the check and why.>

<What the current step produces: the question, or the whole draft, and the reasons and the evidence behind the first line.>

**Now:** <which gate the work waits on and for whom, then the one thing the person does now, in words that say the action, then the full URL of the page where it is done, and nothing after that URL. When the reply asks a question, the whole **Now** line is "**Now:** Answer the question above in the chat.": it names no gate, because no gate is reached yet. An action done in the chat, such as answering the question above or sending a message, has no URL: write the action, and the message to send when there is one. When the person has nothing to do, say so and write no URL. When the person's pending action has not changed since your previous reply and the person asked a question, say that nothing new is needed and write no URL.>
```

The **Now** line is the last line of the reply. It holds at most one URL. That URL is never a list page, such as a repository's pull requests or issues, and never a page the **Not yet** line names: a link at the end of a reply is where the person taps.

State whether a pull request or an issue is open, a draft, merged, or closed only when you read it from the host in this turn. Otherwise say that its state was not checked.

A step that is not finished is `open`, including one at its Gate.

A reply that ends before a **Gate** step says which step stopped it and why.

When the evidence shows that the change cannot be made in this project, say so on the first line.
