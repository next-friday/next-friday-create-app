# Cursor

- `rules-file`: `~/.cursor/rules/sdlc-models.mdc`
- `rules-header`: Start it with front matter that holds `description: SDLC models per role` and `alwaysApply: true`, so that the agent tool applies it in every session.
- `model-switch`: the model picker of the chat
- `subagent-model`: the `model` of the `Task` call, which takes the model slug the role line names; the effort is part of that slug
- `role-format`: Write each role's model as the model slug the session lists, with the effort the budget gives inside the slug where the model has slugs for each effort; the example in step 5 of `setup-sdlc` shows the shape with short names.
- `wait-for-subagent`: not verified: no file of this repository says how the `Task` call waits for a subagent's report, so treat the tool as one that cannot wait
- `plan-mode`: not verified: no file of this repository names a tool that enters plan mode, so enter plan mode only when the person has already put the session in it
- `question-picker`: not verified: no file of this repository names a tool that asks the person a question with choices, so ask a round in plain chat text
- `task-list`: not verified: no file of this repository names a task-list tool, so use one only when the session offers it
