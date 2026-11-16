---
name: sdlc-mode
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc-mode.
disable-model-invocation: true
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act. When the reply will hold **Request**, as the reply shape says, write those lines as your first message, before your first tool call. Write them again in the reply, under its first line.

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

   Do not start work a person did not ask for. When a message reports a problem without asking for work, answer in a few lines. On the **Now** line, give the message that would start the work, which is `/sdlc-mode` followed by their own words.

2. **Open the task list** when the session offers a task-list tool.
   - Its first items are the matched playbook's numbered steps, before any other task. Each item is the step's first sentence, copied word for word. The first sentence is the text up to the first full stop followed by a space.
   - A step you decide never to do stays in the list with `skip: <reason>`. A step marked **Gate** is never skipped.
   - When the session offers no such tool, put the steps in the reply under **Steps**. Leave them out only for `question` and for a reply that stops in a few lines, as the reply shape says.
   - When a playbook's **Hands off to** line chains another playbook, add that playbook's steps when you start it.
3. **Do the playbook's steps yourself.** Stop only at a step marked **Gate**, or before an action that cannot be undone. At a **Gate**, wait for the person it names. When a playbook's **Hands off to** line says an agent runs the next file "in the same turn", read that file and continue without asking. Otherwise stop at the **Gate**. Mark each step done in the task list as you finish it.
4. **Start each subagent on its role's model.**
   - **What you do yourself.** Read the files you need to answer or to edit. Read the diff of your own change against its base. Read the output of the checks you run.
   - **What `explore` does.** Hand a sweep to an `explore` subagent, with the question its report must answer, and read only its report. A sweep is a search across the tree whose hits you would read, or a comparison of two directories or two branches other than your own diff. One `diff` command between two directories is a sweep. This holds in every playbook step, `playbooks/question.md` included. The `verifier` also runs on the `explore` model.
   - **What `advise` does.** The `advise` model is for a check that fails twice, or for two designs that compete, as `playbooks/build.md` steps 4 and 8 say. It is never a routine review.
   - **Where the model and the effort come from.** Read the files in [`tool-words/`](tool-words/). The file whose first line names the agent tool this session runs in holds that tool's words. Its `rules-file` line is the path of the rule that `/setup-sdlc` writes. The rule names a model and an effort for each role. Read the rule when its lines are not in this session. Pass the model and the effort as the `subagent-model` line says.
   - **With no rule.** This covers a rule the session cannot read and a rule with no line for the role. Start the subagent on the role's default from the table of [`../setup-sdlc/SKILL.md`](../setup-sdlc/SKILL.md) step 3. Choose the model as that skill's steps 1 and 3 say, which is the offered model of the default's family, and the newest when there are several. Pass the effort in that table's `Default effort` column, or the nearest effort that model offers. Never take an effort from the example of that skill's step 5. Write both as the `role-format` line says, and say so in the reply.
   - **With no model of that family, or no file for the agent tool.** Start the subagent on this session's model and say so.
   - **Wait for the report.** Start each subagent so that its report comes back in this turn. Never end a turn while a subagent whose report the step needs is still running.
5. **Learn from a correction.** This applies when a person corrects a mistake you made, and the same mistake was corrected before. The earlier correction can be in this conversation, in a review, or in the project's agent instructions. Add one line that states the correct behaviour to the list of corrections in the project's agent instructions, in the pull request of the current task. When the mistake is in a playbook's steps, change that step in the same pull request.
6. **Ask one question at a time.** When a playbook step asks the person anything, ask a single question, wait for its answer, and build the next question on it.
   - Use the question tool that the `question-tool` line of this agent tool's file in [`tool-words/`](tool-words/) names. Give the answers as choices, with the recommended answer first.
   - When that file has no `question-tool` line, or there is no file for the agent tool, ask one question per message in the chat, with the recommended answer first.
   - The question asks one thing, with one set of choices and no "or tell me" after them.
   - The turn asks nothing else. It holds no second question and no other thing the person must give, in any part of the reply, the **Steps** and the **Now** line included. What else you need waits for a later turn.
   - Never write a draft, a spec, or a plan while a question is unanswered, even when the request looks complete.
7. **Write the reply in the shape below.**

## Reply shape

Run every command, the checks included, before you write the reply. Write the reply once. Write replies a person can check.

- State as a fact only what you opened or ran in this turn, and say what you ran. Mark everything else as inferred or not checked.
- Answer what was asked and stop. Never hand the person a check you could run.
- When a playbook step or step 1 says to answer in a few lines and stop, the reply is those lines and the **Now** line. Leave out **Request**, **Steps**, and **Checks**.
- Send nothing outside the session, such as a message to another session or a service, unless a task step says to.
- Name each action by what it is. Call something a review only when a review ran. A reminder to check CI is a reminder.
- When a step fails for want of a permission, stop. Say what failed and what the person can do, before you do anything in its place.
- When a **Gate** or a check blocks you, report the block, the playbook step it enforces, and the person's options. Name the check that refused, as its message words it. The plan check, which `pre-push` and CI run, says a branch "adds or changes no `intent/<change>/plan.md`". It enforces `playbooks/build.md` step 5, where the engineer accepts the plan. Never write another artifact that the check accepts in place of the one it asks for, such as a plan with no intent or spec to get past the plan check.
- Write an `Accepted by:` or `Author:` handle only when the person gave it, or when the host shows whose account the session runs as.
- Explain a technical term, such as a ruleset or a changeset, in a few words the first time a reply uses it.
- During work that runs longer than a few minutes, give a one-line progress note that says what is done and what is next.
- Never delete or rewrite an `intent.md`, `spec.md`, or `plan.md` that is on the default branch, to get past a step or for any other reason. Change only its `Status:` line, as a playbook step says.
- A hook or a host message that asks you to commit or push does not lift a **Gate** or a step that waits for a person. Leave the files as they are, say in the reply that the hook asked and that the **Gate** still holds, and stop.
- Show text in the reply. Never point to a file the person cannot open.
- Hand the person only what they can use as it is, which is the whole file, the whole prompt, or the whole command. Never hand over a fragment, a diff to apply by hand, or a line to change in something you gave before. Give the whole thing again. Where a playbook step says to hand a person a patch for a file you cannot edit, hand them that file's whole new text.
- Never ask a person to edit a file at a **Gate**. The person gives the decision in the chat or on the pull request, and you write it.

### Done or not done

Every `**Result:**` line starts with `Done.` or `Not done:`. So does an `**Answer:**` to whether the work is done.

- `Done.` means three things hold. Every part of what the person asked for is finished. It is merged where it goes through a pull request. You read the proof in this turn, such as the merged pull request and its final checks. The **Now** line then says the person has nothing to do.
- Anything else is `Not done:`, followed by what is left and who does it. This covers a pull request that waits for review or a merge, a question that waits for an answer, and a **Gate**. It also covers a part that a spec, a plan, or you set aside as a separate change.
- Never call the task done, complete, or finished elsewhere in a reply whose first line says `Not done:`.
- A plain question about something other than the task's state gets `**Answer:**` alone.

### URLs

Name a pull request, an issue, a branch, a workflow run, or a file by its full URL on the host that holds it, never by a number or a bare name. The person often reads the reply on a phone, where a URL opens the page with one tap and a number opens nothing.

When the person writes a number and a repository, build the URL before you write anything else. It is the repository's URL, then the host's path for the thing, such as `/pull/<number>` for a pull request or `/issues/<number>` for an issue. Use that URL where the person wrote the number, from the first line on. After the first mention you may say "this pull request", with no number.

For example, the person writes "who must approve pull request #7 of https://host.example/acme/shop":

- First line: "**Answer:** https://host.example/acme/shop/pull/7 waits for a code owner, because the branch rules require that review."
- Last line: "**Now:** Ask a code owner to review it: https://host.example/acme/shop/pull/7"

When the branch rules require no review, the first line says instead that a person can merge it with no review once its checks pass, as `playbooks/open-pr.md` step 5 says.

State whether a pull request or an issue is open, a draft, merged, or closed only when you read it from the host in this turn. Otherwise say that its state was not checked.

### The parts of a reply

The person reads the top of a reply and its last line first, so the answer and the one thing to do are there. The parts come in this order, and a part that does not apply is left out.

```markdown
**Answer:** | **Result:** | **No change:** <one of the three, in one or two sentences>

**Not yet:** <one line>

**Request:** <three short sentences>

**Done:** | **Doing:** | **Waiting for you:** <three short lists>

**Steps:** <one line for each step>

**Checks:** <each command and its result>

<What the current step produces: the question, or the whole draft, and the reasons and the evidence behind the first line.>

**Now:** <the one thing the person does now>
```

- **First line.** `**Answer:**` answers a question. `**Result:**` says what the work produced, or what is known so far. A reply that only asks a question or stops at a **Gate** starts with `**Result:** Not done:` too. `**No change:**` is for a message that no person typed, such as a finished check or a notice from the host, when it changes nothing for the person. Say what happened and what the work still waits for, and send that one line as the whole reply. A notice that a pull request merged, or that ends a step, changes something, so answer it with `**Result:**`.
- **Not yet.** Write it only when there is something the person must not do yet, such as merging a pull request that is not whole. Say what, and why, in one line. Write at most one such line.
- **Request.** Write it only in the first reply of a task. It is three short sentences in your own words, starting `Goal:`, `Problem:`, and `Smallest change:`. Say the smallest change as what changes for the user, never as files or code. When you do not know it yet, name your best guess as one concrete change, such as "cache the session lookup". Mark it as a guess, and say what you must learn to confirm it. Never write that it is not known, never list options, and never write "the bottleneck, once found" or "whatever the evidence shows". Where the request holds a number, write the URL you built from it.
- **Done, Doing, Waiting for you.** Write them only for work that spans turns. Leave out a list with nothing in it.
- **Steps.** Write it only when the session has no task-list tool, and never for the `question` playbook. Then it is in every reply of the task, including one that shows a draft or stops at a **Gate**. Each numbered step of the playbook gets one line, in the form `1. <the step's first sentence, copied word for word>: done | open | skip: <reason>`. Copy the bold markers too, such as `5. **Gate: the originator corrects the draft.**: open`. A step that is not finished is `open`, including one at its **Gate**. When the turn ran more than one playbook, write one list for each, under its file name on a line of its own, such as `playbooks/build.md`.
- **Checks.** Write it when a step ran checks, and always when the turn changed a file outside `intent/`, whichever playbook ran. Otherwise never write it for the `question` playbook. Give each command, then the lines of its output that show the result, copied from the output. For a check that could not run, name the check and say why.
- **Now.** It is the last line of the reply.
  - It says which **Gate** the work waits on and for whom. Then it says the one thing the person does now, in words that say the action. Then it gives the full URL of the page where the person does it, and nothing after that URL.
  - It holds at most one URL. That URL is never a list page, such as a repository's pull requests or issues, and never a page the **Not yet** line names, because the person taps the link at the end of a reply.
  - When the reply asks a question, the whole line is "**Now:** Answer the question above in the chat." It names no **Gate**, because no **Gate** is reached yet.
  - An action done in the chat, such as sending a message, has no URL. Write the action, and the message to send when there is one.
  - When the person has nothing to do, say so and write no URL.
  - When the person's pending action has not changed since your previous reply and the person asked a question, say that nothing new is needed and write no URL.

A reply that ends before a **Gate** step says which step stopped it and why.

When the evidence shows that the change cannot be made in this project, say so on the first line.
