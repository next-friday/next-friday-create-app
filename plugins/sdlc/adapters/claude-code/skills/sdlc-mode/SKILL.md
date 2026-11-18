---
name: sdlc-mode
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc-mode.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          timeout: 10
          command: 'sh "${CLAUDE_PLUGIN_ROOT}/skills/sdlc-mode/hooks"/check-reply-shape.sh snapshot'
  Stop:
    - hooks:
        - type: command
          timeout: 10
          command: 'sh "${CLAUDE_PLUGIN_ROOT}/skills/sdlc-mode/hooks"/check-reply-shape.sh'
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          timeout: 60
          command: 'sh "${CLAUDE_PLUGIN_ROOT}/skills/sdlc-mode/hooks"/check-push.sh'
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act.

   | The request                                                                                                                                                                                      | What to do                                                                                                                     |
   | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
   | A question, or a request to explain something without changing anything                                                                                                                          | Follow [`playbooks/question.md`](playbooks/question.md).                                                                       |
   | A spec for an intent, or a path to an `intent.md`                                                                                                                                                | Follow [`playbooks/design.md`](playbooks/design.md).                                                                           |
   | A build for a spec, a path to a `spec.md`, or a plan the engineer accepted                                                                                                                       | Follow [`playbooks/build.md`](playbooks/build.md).                                                                             |
   | A review or check of a pull request or a branch, a failing check on a pull request, or a pull request to drive to green                                                                          | Follow [`playbooks/review.md`](playbooks/review.md).                                                                           |
   | A deploy, a promotion to an environment, or a release to production                                                                                                                              | Follow [`playbooks/deploy.md`](playbooks/deploy.md).                                                                           |
   | A finding sent by a job, a monitor, or a trigger, or one the message says no person can answer questions about                                                                                   | Follow [`playbooks/maintain.md`](playbooks/maintain.md).                                                                       |
   | A defect: behaviour that breaks a spec, a test, or a documented target, or a crash or a wrong result                                                                                             | Follow [`playbooks/fix.md`](playbooks/fix.md).                                                                                 |
   | An idea, a problem, a ticket, or an incident that a person describes, whether asked for or only reported, and a complaint that no written target backs, such as a slow page with no stated limit | Follow [`playbooks/intent.md`](playbooks/intent.md).                                                                           |
   | A pull request to open for the current branch                                                                                                                                                    | Follow [`playbooks/open-pr.md`](playbooks/open-pr.md).                                                                         |
   | Anything else                                                                                                                                                                                    | Say which of the rows above is closest and why it does not fit, answer what you can as `playbooks/question.md` says, and stop. |

   When a request both asks a question and reports a problem, use `question` and offer `intent` in one line. A problem reported with `/sdlc-mode` is the person's ask for `intent`.

   When the request names no change, run `sh "${CLAUDE_PLUGIN_ROOT}/skills/sdlc-mode/hooks"/sdlc-status.sh < /dev/null` and show its lines.

   Do not start work a person did not ask for. When a message reports a problem without asking for work, answer in a few lines. On the **Now** line, give the message that would start the work, which is `/sdlc-mode` followed by their own words.

2. **Open the task list** when the session offers a task-list tool.
   - Its first items are the matched playbook's numbered steps, before any other task. Each item names its step in a few words, in the language the person writes in.
   - A step you decide never to do stays in the list with `skip: <reason>`. A step marked **Gate** is never skipped.
   - The task list is the tool the `task-list` line of this agent tool's file in [`tool-words/`](tool-words/) names. When the session offers no task-list tool, whether or not that line names one, write no list of steps in the reply. Write the step line, as the **Step line** rule of the reply shape says.
   - When a playbook's **Hands off to** line chains another playbook, add that playbook's steps when you start it.
3. **Do the playbook's steps yourself.** Stop only at a step marked **Gate**, or before an action that cannot be undone. At a **Gate**, wait for the person it names. When a playbook's **Hands off to** line says an agent runs the next file "in the same turn", read that file and continue without asking. Otherwise stop at the **Gate**. Mark each step done in the task list as you finish it. Write a file before you create its branch, so that the file stands when a git command fails.
   - **Files.** Change files with the fewest steps and the least text you write yourself. Reach first for a shell command or a script, such as `sed`, a formatter, or a generator the project has, and write by hand only what no command can produce. A change that repeats in many places, such as a rename across files, goes through one command or one script, and never through one edit for each place. Keep a script you write for it in the scratch folder, and commit none. After a shell command changes files, read the diff before the next step. A shell command never writes a file that the project's rules or agent settings reserve for a person.
   - **The machine.** End only the processes you started, by process id. Ask the person before you install or start anything outside the project, and before you write a file outside the project and its scratch folder. The one exception is the models rule, which `/setup-sdlc` writes and which step 4 writes when none exists.
4. **Start each subagent on its role's model.**
   - **What you do yourself.** Read the files you need to answer or to edit. Read the diff of your own change against its base. Read the output of the checks you run.
   - **What `explore` does.** Hand a sweep to an `explore` subagent, with the question its report must answer, and read only its report. A sweep is a search across the tree whose hits you would read, or a comparison of two directories or two branches other than your own diff. A question that one command answers, such as one `diff` or one search whose output you read whole, is not a sweep: run it yourself. This holds in every playbook step, `playbooks/question.md` included. The `verifier` also runs on the `explore` model.
   - **What `review` does.** The `review` model is for the subagent that reviews a pull request's diff with a fresh context, as `playbooks/review.md` step 2 says.
   - **What `advise` does.** The `advise` model is for the same check failing a second time for the same reason after a change to the code, or for two designs that compete, as `playbooks/build.md` steps 4 and 8 say. A failure of the machine, such as a missing database, a port in use, or a tool that is not installed, is a check that cannot run, and it never goes to `advise`. It is never a routine review.
   - **Where the model and the effort come from.** Read the files in [`tool-words/`](tool-words/). The file whose first line names the agent tool this session runs in holds that tool's words. Its `rules-file` line is the path of the rule that `/setup-sdlc` writes. The rule names a model and an effort for each role. Read the rule when its lines are not in this session. Pass the model and the effort as the `subagent-model` line says.
   - **With a file for the agent tool and no rule.** A machine that is new for each session, such as a cloud session's, holds no rule. Write the rule at the path of the `rules-file` line, with the budget `balanced` and each role's default. Take three things from [`../setup-sdlc/SKILL.md`](../setup-sdlc/SKILL.md) and nothing else: the list of offered models from its step 1, each role's default from the table of its step 3, and the shape of the file from its step 5. Ask nothing, show nothing of the rule in the reply, and then use the rule. Do not say in the reply that the rule was missing or written. A role whose default has no offered model of its family runs on this session's model: write that model on its line, and say in the reply which role it is. When the session can list no model, write no rule and follow the next rule.
   - **With a rule the session cannot read or write, or a rule with no line for the role.** A rule you cannot read never stops the work or the answer. Start the subagent on the role's default from the table of [`../setup-sdlc/SKILL.md`](../setup-sdlc/SKILL.md) step 3. Choose the model as that skill's steps 1 and 3 say, which is the offered model of the default's family, and the newest when there are several. Pass the effort in that table's `Default effort` column, or the nearest effort that model offers. Never take an effort from the example of that skill's step 5. Write both as the `role-format` line says.
   - **With no model of that family, or no file for the agent tool.** Start the subagent on this session's model and say so.
   - **Wait for the report.** Ask the agent tool to wait for the subagent's report, as the `wait-for-subagent` line of its file in [`tool-words/`](tool-words/) says, so that one call returns the report. When the tool cannot wait, go on with work that does not need the report, and when none is left, end the reply naming the report it waits for. While a subagent runs, do not poll for it, do not sleep for a fixed time, and do not message it to ask how it is doing. Write no file and no reply from a report before it arrives, and credit no source you did not use.
5. **Learn from a correction.** This applies when a person corrects a mistake you made, and the same mistake was corrected before. The earlier correction can be in this conversation, in a review, or in the project's agent instructions. Add one line that states the correct behaviour to the list of corrections in the project's agent instructions, in the pull request of the current task. When the mistake is in a playbook's steps, change that step in the same pull request.
6. **Ask one of two kinds of question.** When a playbook step asks the person anything, ask it as one of the two kinds below.
   - **Open questions** ask what the problem is, why it matters, and what is out of scope. Ask them before any choice that depends on them, in plain chat text, and offer no answer, so that the answer is in the person's own words. Never ask an open question through a question picker.
   - **Choices between ways** are asked in rounds. Each round holds every question that needs no open answer, with the answer you recommend first. Ask the round through the question picker that the `question-picker` line of this agent tool's file in [`tool-words/`](tool-words/) names. When that line names none, or the session does not offer the picker, ask the round numbered, in plain chat text, with the recommended answer beside each question, worded so that "yes" accepts it. An answer such as "1 yes 2 no" is accepted for such a round. A round asked through the picker is the picker call alone: write no reply before it, and do not repeat its questions in a reply. The reply shape applies to the next reply you write.
   - Find facts yourself, and ask only what the request and the repository leave open.
   - The turn asks nothing outside its open question or its round. It holds no other thing the person must give, in any part of the reply, the **Now** line included. What else you need waits for a later turn.
   - Never write a draft, a spec, or a plan while a question you asked is unanswered. Ask no question that the request or the repository already answers.
7. **Write the reply in the shape below.**

## Reply shape

Run every command, the checks included, before you write the reply. Write the reply once. Write replies a person can check.

- State as a fact only what you opened or ran in this turn, and say what you ran. Mark everything else as inferred or not checked.
- Answer what was asked and stop. Never hand the person a check you could run.
- When a playbook step or step 1 says to answer in a few lines, or in two or three lines, and stop, the reply is those lines and the **Now** line. Leave out the step line and **Checks**.
- While you work, write no text to the chat between tool calls. Progress is in the task list. Write one message when the work needs the person, and one when it ends.
- Write every sentence of a reply in the language the person writes in. Only the labels of the parts, such as `**Result:**` and `**Now:**`, stay as they are written here, because the reply check reads them.
- Use one numbered list at most in a reply, for what the person does or answers. Every other list has no numbers.
- When a sentence raises a risk, say in that sentence or the next whether the person waits for it or goes on.
- Write a commit id, a version number, and a command's output only under **Checks**. The one exception is the package and the version that a merge publishes, which the reply names where `playbooks/review.md` says.
- Send nothing outside the session, such as a message to another session or a service, unless a task step says to.
- Name each action by what it is. Call something a review only when a review ran. A reminder to check CI is a reminder.
- When a step fails for want of a permission, stop. Say what failed and what the person can do, before you do anything in its place.
- When a **Gate** or a check blocks you, report the block, the playbook step it enforces, and the person's options. Name the check that refused, as its message words it. The plan check, which this skill's push hook runs before a `git push`, says a branch "adds or changes no `intent/<change>/plan.md`". It enforces `playbooks/build.md` step 5, where the engineer accepts the plan. Never write another artifact that the check accepts in place of the one it asks for, such as a plan with no intent or spec to get past the plan check. When the change has no intent and no spec, the way forward is an intent, so tell the person to start one with `/sdlc-mode`. Never offer to draft the plan in its place.
- Write an `Accepted by:` or `Author:` handle only when the person gave it, or when the host shows whose account the session runs as.
- Explain a technical term, such as a ruleset or a changeset, in a few words the first time a reply uses it.
- A hook or a host message that asks you to commit or push does not lift a **Gate** or a step that waits for a person. Leave the files as they are, answer as the **First line** rule says for `**No change:**`, and stop.
- Show text in the reply. Never point to a file the person cannot open.
- Hand the person only what they can use as it is, which is the whole file, the whole prompt, or the whole command. Never hand over a fragment, a diff to apply by hand, or a line to change in something the person must save or paste. A draft, a spec, or a plan that the person only reads is different: show it whole once, and after a correction show only the parts that changed. Where a playbook step says to hand a person a patch for a file you cannot edit, hand them that file's whole new text.
- Never ask a person to edit a file at a **Gate**. The person gives the decision in the chat or on the pull request, and you write it.

### Done or not done

Every `**Result:**` line starts with `Done.` or `Not done:`. So does an `**Answer:**` to whether the work is done.

- `Done.` means three things hold. Every part of what the person asked for is finished. It is merged where it goes through a pull request. You read a result in this turn for every requirement of the change, such as the merged pull request and its final checks. The **Now** line then says the person has nothing to do.
- A step marked done in the task list needs the same: a result read in this turn for every requirement of the change.
- A check that could not run, a CI job that was skipped, and a run still in progress on a pull request each keep the work not done. Once the pull request merged with its checks passed, a run the merge started on the default branch does not: the reply says `Done.` and names that run on its **Not yet** line. A `**Result:**` reply then says `Not done:`, with the requirement and the reason. A `**Waiting for you:**` reply names the requirement and the reason on its **Not yet** line.
- Anything else that reports work and asks nothing of the person is `Not done:`, followed by what is left and who does it. This covers a part that a spec, a plan, or you set aside as a separate change.
- A reply that asks a question or stops at a **Gate**, such as a pull request that waits for review or a merge, starts with `**Waiting for you:**`, as the **First line** rule says. It never starts with `**Result:** Not done:`.
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
**Answer:** | **Result:** | **Waiting for you:** | **No change:** <one of the four, in one or two sentences>

**Not yet:** <one line>

**Done:** | **Doing:** <two short lists>

<The step line: the current step and how many are left>

**Checks:** <each command and its result>

<What the current step produces: the question, or the whole draft, and the reasons and the evidence behind the first line.>

**Now:** <the one thing the person does now>
```

- **First line.** `**Answer:**` answers a question. `**Result:**` says what the work produced, or what is known so far. `**Waiting for you:**` starts a reply that asks the person a question or stops at a **Gate**. It says what the person does, in at most two sentences. `**No change:**` is for a message that no person typed, such as a finished check or a notice from the host, when it changes nothing for the person. Say in one sentence what happened and what the work still waits for, and send that one line as the whole reply. When the same message comes again and nothing has changed, the whole reply is `**No change:**` and one short sentence that says the work still waits for the person. It names no commit, no check, and no step. A notice that a pull request merged, or that ends a step, changes something, so answer it with `**Result:**`.
- **Not yet.** Write it only when there is something the person must not do yet, such as merging a pull request that is not whole, or one with a requirement that has no result. Say what, and why, in one line. Write at most one such line.
- **Done, Doing.** Write them only for work that spans turns. Leave out a list with nothing in it. What waits for the person is on the first line, under `**Waiting for you:**`.
- **Step line.** Write it only when the session has no task-list tool. It is one line that gives the number of the current step of the playbook and how many steps are left, in the person's language, such as "Step 7 of 10, 3 left" for a person who writes English. It copies no wording of a playbook. No reply holds a list of the playbook's steps. Leave the step line out of a reply of the `question` playbook and of a reply that stops in a few lines.
- **Checks.** Write it when a step ran checks, and always when you changed a file outside `intent/` in the turn, whichever playbook ran. A file the person changed needs none. Otherwise never write it for the `question` playbook. Give each command, then the lines of its output that show the result, copied from the output. For a check that could not run, name the check and say why. For a build, list each requirement of the spec by number with its result, or with "not run" and the reason. What a merge publishes stays in the reply.
- **Now.** It is the last line of the reply.
  - It says which **Gate** the work waits on and for whom. Then it says the one thing the person does now, in words that say the action. Then it gives the full URL of the page where the person does it, and nothing after that URL.
  - It holds at most one URL. That URL is never a list page, such as a repository's pull requests or issues, and never a page the **Not yet** line names, because the person taps the link at the end of a reply.
  - When the reply asks a question, the line tells the person to answer it, in the person's language, and says nothing else. It names no **Gate**, because no **Gate** is reached yet.
  - An action done in the chat, such as sending a message, has no URL. Write the action, and the message to send when there is one.
  - When the person has nothing to do, say so and write no URL.
  - When the person's pending action has not changed since your previous reply and the person asked a question, say that nothing new is needed and write no URL.

A reply that ends before a **Gate** step says which step stopped it and why.

When the evidence shows that the change cannot be made in this project, say so on the first line.
