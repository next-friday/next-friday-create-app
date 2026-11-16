---
name: setup-sdlc
description: Sets the model and reasoning effort for the main work, for exploring, for review, and for advice, from a budget, and reports which steps of SETUP.md are done. Run it with /setup-sdlc.
disable-model-invocation: true
---

# Set up the SDLC

Do these steps in order. Run again with the same answers, the skill writes the same file and redoes no step that is done.

1. **List the models the session offers.** They are the models it can run or start a subagent on, spelled as the session spells them. When it can list none, ask the person to paste the names and wait. Write no model the session does not offer.
2. **Read the rule** when it exists: the rule in the person's home directory that the agent tool loads in every session. Its path is the `rules-file` line of this agent tool's words: read the files in [`../sdlc-mode/tool-words/`](../sdlc-mode/tool-words/), and take the one whose first line names the agent tool this session runs in. With no file for the agent tool, say that this skill has no words for it, write no rule, and go to step 6. The rule's `budget:` line is the current budget, and a role line whose model is on the list keeps that model. A line for a role that is not in step 3 is from an older version: drop it. When the session cannot read the rule, take the lines the request gives as its content, and otherwise start from the defaults.
3. **Choose each role's model.** A role without a kept model gets its default. A default the session does not offer becomes the offered model of the same family, the newest when there are several. When the family has none, ask about that role in the question of step 4.

   | Role      | Default  | Default effort | Does                                                                                    |
   | :-------- | :------- | :------------- | :-------------------------------------------------------------------------------------- |
   | `main`    | `sonnet` | `high`         | The model of the session itself, which does the work.                                   |
   | `explore` | `haiku`  | `xhigh`        | A subagent that reads and searches files and runs the checks, including the `verifier`. |
   | `review`  | `sonnet` | `high`         | A subagent that reviews a pull request's diff with a fresh context.                     |
   | `advise`  | `opus`   | `medium`       | A subagent that advises on a check that failed twice, or on two designs that compete.   |

4. **Fix the budget,** which sets the reasoning effort of the roles. When the request names one of the five labels, that is the budget and you ask nothing about it. Otherwise ask one question in plain chat text, as `../sdlc-mode/SKILL.md` step 6 says, with these choices numbered, `balanced` as the recommended one, adding the roles of step 3 that have no model. Name the current budget when the rule records one; with no rule, say that `balanced` matches the defaults.

   | Label       | Effort                                 |
   | :---------- | :------------------------------------- |
   | `balanced`  | each role's default effort from step 3 |
   | `unlimited` | `max`                                  |
   | `large`     | `xhigh`                                |
   | `medium`    | `high`                                 |
   | `small`     | `medium`                               |

5. **Write the rule** at the path of the `rules-file` line, as the whole file, overwriting it, with a newline after the last line, and never in the project: each person's sessions offer different models. Start it as the `rules-header` line says. Then write these lines and no others, each role's model as the `role-format` line says. For the budget `balanced`, write `budget: balanced (per role)`, and give each role line its role's default effort from step 3: `main: sonnet high`, `explore: haiku xhigh`, `review: sonnet high`, `advise: opus medium`. For the budget `medium` in a session that offers `sonnet`, `haiku`, and `opus`:

   ```markdown
   # SDLC models

   budget: medium (high)
   main: sonnet high
   explore: haiku high
   review: sonnet high
   advise: opus high
   ```

   When the session cannot write the rule, show the whole rule and its path in the reply, and say that the person saves it there; write it nowhere else.

   A session cannot change its own model, so say how to choose the `main` model for the next session: the `model-switch` line gives it. When the words hold an `advisor` line, do what it says too.

6. **Read `SETUP.md`** at the project root. When there is none, say "This project has no `SETUP.md`" and go to step 9. Otherwise decide for each step whether it is done by checking the repository: run the step's **Check** when it only reads files or local git state, and read the files the step names. Report each step as `done`, `not done`, or `a person checks this` when the repository cannot show it, such as a setting on a website, an account, or someone's decision. For example:

   - `1. Project description: done. package.json holds a description.`
   - `2. Owners: not done. .github/CODEOWNERS still holds the placeholder.`
   - `3. Repository settings: a person checks this. They live on the host, not in the repository.`

   Report code owners, the ruleset of the default branch, and the OpenTelemetry export each on a line of its own, with what `SETUP.md` says the step needs, such as `Ruleset of main: a person checks this. It needs a repository admin, and in a private repository GitHub Pro, Team, or Enterprise.` A step that is not done fails no check.

7. **Do the `not done` steps an agent can do.** Such a step is one whose whole work is editing a file of the repository with values the repository or the request already gives. Do not redo a `done` step. Do not edit a file the project's rules or agent settings reserve for a person, such as rules, hooks, lint, format, and commit configuration, and the agent settings themselves; list it with the exact new text and the file it goes in. Commit nothing. After each step, run its **Check** again and report the result.
8. **List the steps a person does outside the repository,** each with who does it, from `SETUP.md`, and the full URL of the page where it is done when `SETUP.md` or the repository names one.
9. **Write the reply** by the reply rules in `../sdlc-mode/SKILL.md`. Between the first line and the **Now** line, in this order: the budget line and the four role lines as written; each step of `SETUP.md` with its state; what you did; what a person does. The **Now** line names the first step a person does, with its URL when step 8 found one.
