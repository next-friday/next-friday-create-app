# Cursor

- `rules-file`: `~/.cursor/rules/sdlc-models.mdc`
- `rules-header`: Start it with front matter that holds `description: SDLC models per role` and `alwaysApply: true`, so that the agent tool applies it in every session.
- `model-switch`: the model picker of the chat
- `subagent-model`: the `model` of the `Task` call, which takes the model slug the role line names; the effort is part of that slug
- `role-format`: Write each role's model as the model slug the session lists, with the effort the budget gives inside the slug where the model has slugs for each effort; the example in step 5 of `setup-sdlc` shows the shape with short names.
