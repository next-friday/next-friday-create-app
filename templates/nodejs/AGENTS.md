# Agent guide

TypeScript HTTP service on `node:http`, without a framework, on pnpm and Node.js `>=26.13.0 <27`.

## Commands

| Task                                          | Command                                             | Healthy output                                                                                       |
| :-------------------------------------------- | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| Start with reload                             | `pnpm start:dev`                                    | The only output is `$ node --env-file-if-exists=.env --watch src/main.ts`; `GET /health` answers 200 |
| Run the build                                 | `pnpm start`, which builds first                    | `$ tsc -p tsconfig.build.json`, then nothing                                                         |
| One test                                      | `pnpm vitest run src/port.test.ts -t "<test name>"` | `Tests  1 passed \| 9 skipped (10)`                                                                  |
| Unit tests                                    | `pnpm test`, or `pnpm test:coverage`                | `Tests  15 passed (15)`                                                                              |
| What `pre-push` runs                          | `pnpm check`                                        | exits 0; the last line is `$ tsc -p tsconfig.build.json`                                             |
| Every check                                   | `pnpm verify`                                       | exits 0; the last line is `$ tsc -p tsconfig.build.json`                                             |
| Render rules after a change                   | `pnpm rules:sync`                                   | `Synced 35 agent rule files; 0 updated.`                                                             |
| Compare the harness with a create-app version | `pnpm harness:check <version>`                      | ends with `none differs.`                                                                            |

## Verifying your work

- Build: `pnpm build` (prints nothing after `$ tsc -p tsconfig.build.json`)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

The `verifier` subagent starts the app with `pnpm start:dev`. It exercises the changed behavior and the two nearest neighboring flows.

## Architecture

- `src/main.ts` starts `createAppServer()` from `src/server.ts` on `parsePort(process.env.PORT)`, and on `SIGTERM` or `SIGINT` stops accepting connections and closes any left after 10 seconds.
- `src/server.ts` answers `GET` and `HEAD` `/health` and returns 404 for every other request. Routes go there.

## Conventions

1. **Put tests next to the code as `src/**/*.test.ts`.** Vitest collects only that pattern.
2. **Read configuration from environment variables and fail when one is missing**, as `parsePort` does. Document each variable in `.env.example`; `pnpm start` and `pnpm start:dev` load `.env`.
3. **Work runs through `/sdlc-mode`;** in an agent tool with no such command, read and follow `.claude/skills/sdlc-mode/SKILL.md`. Its playbooks decide how plans, fixes, branches, commits, and pull requests are made.
4. **Run parallel sessions in separate worktrees** (`claude --worktree <name>`), on tasks that touch different files. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Failing tests**: when a test fails, fix the code, not the test. Never skip, delete, or weaken a test to make a check pass.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.
