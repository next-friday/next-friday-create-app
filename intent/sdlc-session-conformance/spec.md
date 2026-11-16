# Spec: Make an sdlc-mode session follow its playbook and claim only what it proved

From `intent/sdlc-session-conformance/intent.md`. Status: done.

Request: "Write the spec", translated from the originator's Thai. Skills at `9827ef2`.

## Requirements

The change ships in three parts, each in its own pull request, in this order. The originator decided the three parts, and the answers marked "decided" below, in the session that wrote this spec.

Part A: waiting, and checks that run once.

1. `SKILL.md` step 4 says what a session does for a subagent's report: it asks the agent tool to wait for the report, and when the tool cannot wait, it goes on with work that does not need the report and otherwise ends its reply naming the report it waits for. The sentence "Never end a turn while a subagent whose report the step needs is still running" is gone.
2. The same step says that while a subagent runs, the session does not poll for it, does not sleep for a fixed time, and does not message it to ask how it is doing (decided).
3. The same step says that a session writes no file and no reply from a report before the report arrives, and credits no source it did not use.
4. `plugins/sdlc/adapters/tool-words.json` holds, for each agent tool, a line that says how that tool waits for a subagent, and `pnpm plugin:sync` renders it into the `tool-words/` files. For Claude Code the line names the setting of requirement 5.
5. `templates/base/.claude/settings.json` and the root `.claude/settings.json` set `env.CLAUDE_CODE_FORK_SUBAGENT` to `"0"`, which lets a session wait for a subagent.
6. `agents/verifier.md` says that the verifier starts the app, exercises the changed behavior and the two nearest neighboring flows, and reports. It runs no static check, test suite, or build that its brief lists as already run. `playbooks/build.md` step 9 gives the verifier that list.
7. `playbooks/review.md` step 2 says that the reviewer reads the diff and does not run a suite again. It runs one focused test only for a doubt it names in its report. The step gives the reviewer the inputs it lists and no points of focus.
8. `setup-sdlc/SKILL.md` has a fourth role, `review`, with the default `sonnet` at `high` (decided). `SKILL.md` step 4 names it, and `playbooks/review.md` step 2 starts the reviewer on it.
9. `playbooks/open-pr.md`, `playbooks/intent.md`, and `playbooks/design.md` agree: a pull request that changes only files under `intent/` gets no agent review, and the session stops at its gate (decided). `playbooks/review.md` runs for a pull request that changes a file outside `intent/`.
10. `playbooks/build.md` step 9 and the "Verifying your work" section of each stack's `AGENTS.md` say that while it works the agent runs the checks of the files it changed, and that the full set runs once, in the `pre-push` hook. The reply's **Checks** quotes the hook's output from the push (decided).
11. `templates/base/.husky/pre-push` and the root `.husky/pre-push` run by what the push changes (decided). A push whose changed files are all documents runs the plan and record check and the format check, and no lint, type check, test, or build. Any other push runs the full set.
12. One file holds the rule that says which changes are documents. The `pre-push` hook and the CI job "Detect Changes" both read it.
13. In the `turborepo` stack, the `pre-push` hook and the commands `AGENTS.md` gives the agent pass `--affected` to Turborepo with the default branch as the base, as CI does. `AGENTS.md` shows that form for the build, the tests, and the type check.
14. `pnpm rules:check` runs in one Git hook, not two.
15. The last lines of `pnpm verify` and of `pnpm check`, in the root and in each stack, name every step with its result, and mark a step that Turborepo answered from its cache.

Part B: `Done.`, and the shape of a reply.

16. `SKILL.md` says that `Done.` and a `done` step need a result read in that turn for every requirement of the change. A check that could not run, a job CI skipped, and a run still in progress each keep the reply at `Not done:`, with the requirement and the reason (decided).
17. For a build, **Checks** lists each requirement of the spec by number with its result, or with "not run" and the reason.
18. `SKILL.md` and `playbooks/review.md` step 5 agree on CI: after it opens a pull request the session waits for no check, and after a person says the pull request merged it reads the checks once and reports a run still in progress as `Not done:`.
19. The first sentence of every playbook step states what the session does in that step, so that the sentence copied into **Steps** means the same alone. `playbooks/review.md` step 4 is rewritten to meet this.
20. `SKILL.md` gives one rule for **Request** and one for **Steps**: **Request** is written once, as the first message of a task, and **Steps** is in every reply of a task except a reply that reports the result of a gate.
21. `playbooks/review.md` step 6 writes the **Now** line from the case `playbooks/open-pr.md` step 5 found: it names a code owner's review only when the host requires one.
22. `playbooks/build.md` step 8 says which failures send a session to `advise`: the same check failing a second time for the same reason after a change to the code. A failure of the machine, such as a missing database, a port in use, or a tool that is not installed, is reported as a check that cannot run.
23. `SKILL.md` step 3 says that a generator the project's `README.md` names, and `git mv`, may write files, and that every other file is written with the file-editing tool.
24. `SKILL.md` says that a session ends only the processes it started, by process id, and asks the person before it installs or starts anything outside the project or writes a file outside the project and its scratch folder. The models rule that `/setup-sdlc` writes is the one exception.
25. `hooks/check-reply-shape.cases.json` has a case in which a session writes a file outside the project and changes none inside it, and the hook asks for no **Checks**.
26. `playbooks/build.md` step 3 says how the session enters plan mode when the agent tool has one, through a `tool-words/` line, and the reply that shows the plan says whether plan mode was used.

Part C: the interview, and the `turborepo` stack.

27. `SKILL.md` step 6 and `playbooks/intent.md` step 3 describe two kinds of question (decided). What the problem is, why it matters, and what is out of scope are asked open, in plain chat text, with no answer offered. A choice between ways is asked in rounds: each round holds every question that needs no open answer, numbered, in plain chat text, with the answer the session recommends beside each. Neither kind uses the agent tool's question picker, and `SKILL.md` step 6 no longer sends a question to the tool that the `question-tool` line names.
28. `playbooks/intent.md` step 3 says that a "yes" to a recommended answer is the person's decision for a choice, and that the problem and what is out of scope are written only from words the person typed (decided).
29. `playbooks/intent.md` step 4 says that a line the session filled in is marked as the session's proposal, and that the session asks no question the request or the repository answers.
30. `playbooks/build.md` step 3 asks its four things in rounds, as requirement 27 says.
31. `playbooks/intent.md` says where the team on the author line comes from: the latest intent in the repository by the same author, and an open question when there is none.
32. `playbooks/design.md` step 3 says that the request is quoted in the language of the project's files, and marked as translated when the person wrote in another language.
33. Each stack's `CONTRIBUTING.md` gives the form of a branch name, `<type>/<short-description>`.
34. `playbooks/build.md` step 4 says that the plan marks each file it changes that the agent's settings deny to the agent, and that the engineer commits those files at the gate of step 5, before step 8 begins.
35. In the `turborepo` stack, `pnpm dev` starts every app after a fourth app is added, with no edit to a root file that `README.md` does not name. `README.md` names every root file that adding an app changes, and says which of them a person commits.
36. `templates/turborepo/AGENTS.md` gives no count of tasks in a healthy output; it says what the last line holds.
37. `playbooks/review.md` step 5 names what a session runs when a person asks it to watch a pull request (decided): `gh pr checks <pull request> --watch`, then one read of the unresolved review threads and of whether the host can merge. For a pull request that changes only documents it reads the status once.

Every part.

38. `pnpm plugin:sync` renders the changes into both adapters, `.claude/skills/`, and `templates/base/`, and `pnpm plugin:check` passes with the hook cases this spec adds.
39. `pnpm verify` passes in the root and in a generated project of each stack in `src/stacks.ts`.
40. Each new eval case uses script graders only. No eval run is part of a pull request's proof unless the product owner orders it.
41. Each part's pull request holds one changeset for `@next-friday/create-app`, of the type `.changeset/README.md` gives for a change under `templates/`.

## Design

- **Where the text lives.** The skill, the playbooks, the hooks, and the verifier's text are in `plugins/sdlc/source/`. `pnpm plugin:sync` renders them into `plugins/sdlc/adapters/`, `.claude/skills/`, and `templates/base/`. Every requirement on a playbook is an edit of the source.
- **Waiting.** Claude Code's documentation says that in an interactive session a subagent starts in the background, that "Background subagents" results "reach Claude as a completion notification in a later turn", and that "to let Claude wait for a subagent" a project turns off fork mode with `CLAUDE_CODE_FORK_SUBAGENT` set to `0` ([Create custom subagents](https://code.claude.com/docs/en/sub-agents.md)). The same page says that `claude -p` can wait without the setting. Requirement 5 makes the wait possible, and requirement 1 covers a tool that still cannot wait. The wording per tool goes in `plugins/sdlc/adapters/tool-words.json`, where the other tool-specific lines are; `pnpm plugin:sync` renders it into `tool-words/`.
- **One owner for each check.** After the change the edit hook formats the file it touched, `pre-commit` scans for secrets and lints the staged files, `pre-push` runs the full set or the document set, and CI runs the full set again on the pull request. The agent's own runs are the narrow ones.
- **What counts as a document.** CI reads `.github/file-filters.yml` through `dorny/paths-filter`. The rule moves to, or is read from, one file that a shell script can also read, and `pre-push` calls that script. The plan chooses the file's form.
- **The summary of `pnpm verify`.** Today `verify` is a chain joined by `&&`, which stops at the first failure and prints only the last step's lines. A runner script under `scripts/` runs the steps, keeps going where a later step does not depend on the failed one, and prints the summary. Each stack's `package.json` calls it.
- **The reviewer's role.** `setup-sdlc/SKILL.md` step 3 holds the role table. A fourth row adds `review`. A rule file written before this change has no `review` line, and `SKILL.md` step 4 already sends a role with no line to that table's default.
- **Proof without eval runs.** Hook cases in `hooks/*.cases.json` prove requirements 11, 12, 14, and 25. `pnpm verify` in a generated project proves 13, 15, 35, and 36. A reading of the rendered text proves the playbook requirements. Eval cases are written for requirements 1, 2, 16, 17, 27, and 28, and they run when the product owner orders a run.
- **Files a person commits.** `.husky/**`, `.claude/settings.json`, `.agents/hooks/**`, and `scripts/sync-agent-rules.ts` are committed by a person, and a session's GitHub token cannot push `.github/workflows/*`. The plan marks each such file, as requirement 34 says the playbook will ask of every plan.
- **One plan, three pull requests.** `intent/sdlc-session-conformance/plan.md` names the three parts and the files of each. It goes in the first pull request and is updated in the next two.

## Policies

- **Brand:** Does not apply. The change edits playbook text, hooks, scripts, and a template's documents; it shows no brand text, colour, typeface, logo, or message (brand rule 1).
- **Security:** Does not apply. The change touches development tooling and no chapter of the standard (security rule 1). The secret scan in `pre-commit` and in CI stays as it is, and requirement 11 removes no check from a push that changes code.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, or deletes no data about a person (compliance rule 1).
- **UX:** Does not apply. The change has no user interface (UX rule 1).

## Areas of concern

1. **The setting of requirement 5 changes how every session in a generated project runs subagents** (no policy; a decision the files do not settle). With fork mode off, a session waits for each subagent and the person cannot type to it meanwhile unless they move the wait to the background.
   Decision: set it in the template and in the root, and say in `SETUP.md` what it does and how a person removes it.
2. **Requirement 10 departs from the AI-native SDLC Playbook**, which says "Run all three before reporting any task complete, and paste the output" (page 32). The hook's run is that run, made once at the push.
   Decision: keep requirement 10, by the originator's decision, and quote the hook's output under **Checks** so the evidence is still attached.
3. **The root repository's `pre-push` is not in the intent's list of affected files.** It runs `pnpm verify` on every push, and six pushes of one Markdown file ran it in the session that wrote this spec.
   Decision: apply requirement 11 to the root hook as well.
4. **A requirement that only a job the project turned off can prove** stays unproved, and requirement 16 then keeps the reply at `Not done:`. A project with `CONTAINER_IMAGE` set to `false` builds no image in CI.
   Decision: the session starts no container runtime to prove it. It reports the requirement as not proved, and the pull request says so; a person accepts that by merging, or turns the job on.
5. **A step answered from Turborepo's cache** is a result of an earlier run on the same inputs.
   Decision: it counts as run, and the summary of requirement 15 marks it. The verifier forces no fresh run of a check.
6. **`"concurrency": "3"` in `templates/turborepo/turbo.json`** has no recorded reason, and Turborepo refuses a fourth persistent task under it.
   Decision: the plan finds why it was set. If no reason is found, the line is removed, and the default applies.
7. **`prettier.config.ts` is denied to the agent, and adding an app needs its edit.**
   Decision: it stays denied. Requirements 34 and 35 make the plan and the `README.md` say that a person commits it.
8. **Part C changes how every interview reads on a phone**: plain text takes typing where the picker took a tap.
   Decision: keep requirement 27, by the originator's decision. An answer of the form "1 yes 2 no" is accepted for a round.
9. **The cause of the reply-shape hook's false report is not known** (intent item 25). The hook's input in that session was not kept.
   Decision: requirement 25 adds the case. If the case passes on the current hook, the plan records that the cause was not reproduced and changes nothing in the hook.

## Open questions

1. Whether a "yes" to a recommended answer counts as the originator's own words. Answered by the originator: it counts for a choice between ways, and the problem and what is out of scope must be typed (requirement 28).
2. Whether the intent and the spec pull requests get an agent review. Answered by the originator: no (requirement 9).
3. What a session does instead of polling and sleeping. Answered in part by Claude Code's documentation, quoted under Design: a session waits when fork mode is off, and otherwise receives a completion notice in a later turn. Carried forward: no session has run with the setting, and the documentation gives no time limit for a subagent other than `maxTurns`.
4. Which checks the `verifier` runs when the session has run some, and whether a cached check counts. Answered by requirement 6 and area of concern 5.
5. Whether a skipped CI job, a check the machine cannot run, and a run in progress each block `Done.`. Answered by the originator: each does (requirement 16).
6. Whether a generator is an exception to the file-editing rule, and whether a generator that fails twice goes to `advise`. Answered by requirements 23 and 22: it is an exception, and it does not.
7. What `turbo.json` sets for `concurrency`, and whether `prettier.config.ts` stays denied. Areas of concern 6 and 7.
8. Whether `eslint --fix` in the edit hook causes the slow edits. Carried forward: the hook has not been timed, and this spec changes nothing in it. The plan times one edit of a `.ts` file with and without the line.
9. Which requirements a hook or a script can check. Answered under Design, "Proof without eval runs".
10. Whether the figures hold. Carried forward: each comes from a session's reading of its own transcript, and no requirement here depends on a figure.
11. Which layer owns each check. Answered by the originator and under Design, "One owner for each check". The `check` scripts of the four other stacks were not read; the plan reads them.
12. How the push hook learns what changed without disagreeing with CI. Answered by requirement 12; the file's form is left to the plan.
13. Whether the agent still runs the whole of `pnpm verify` before a push. Answered by the originator: no (requirement 10).
14. Why the reply-shape hook fired when the project's tree was unchanged. Carried forward as area of concern 9.
15. What the last lines of `pnpm verify` print. Answered by requirement 15.
16. Whether the push hook keeps any check. Answered by the originator: it does, by what the push changes (requirement 11).
17. Whether a failure of the machine counts toward `advise`. Answered by requirement 22: no.
18. Where the team on the author line comes from, and what a spec quotes when the request is in another language. Answered by requirements 31 and 32, as proposals the product owner can correct.
19. Whether a requirement that only a container image proves is checked on the machine. Area of concern 4.
20. What watches a pull request. Answered by the originator (requirement 37). `gh pr checks --watch` has not been run in this repository.
21. Which model the reviewer's role names. Answered by the originator: `sonnet` at `high` (requirement 8). No run has compared two models on one diff.
22. How the machine scopes a check to the affected apps. Answered in part by the documentation bundled with Turborepo 2.11.10, the version the stack pins: `--affected` "is equivalent to `--filter=...[main...HEAD]`", `TURBO_SCM_BASE` overrides the base, and "If the checkout is too shallow, then all packages will be considered changed" (`docs/reference/run.mdx`). Carried forward: that page does not say whether a change to a root file or the lockfile marks every package, and the saving has not been measured. ESLint, Prettier, Knip, and `sort-package-json` stay workspace-wide.
