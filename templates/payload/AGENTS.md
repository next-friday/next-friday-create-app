# Agent guide

Payload CMS on Next.js App Router and PostgreSQL, in TypeScript on pnpm and Node.js `>=26.13.0 <27`. The API is REST at `/api`.

## Commands

| Task                                          | Command                                                    | Healthy output                                                                                                               |
| :-------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Start with reload                             | `pnpm dev`                                                 | `✓ Ready in 251ms`                                                                                                           |
| One test                                      | `pnpm vitest run src/environment.test.ts -t "<test name>"` | `Tests  1 passed \| 2 skipped (3)`                                                                                           |
| Unit tests                                    | `pnpm test`, or `pnpm test:coverage`                       | `Tests  13 passed (13)`                                                                                                      |
| End-to-end tests                              | `pnpm test:e2e`                                            | `2 passed (9.4s)`, with `DATABASE_URL` pointing at a running database                                                        |
| Regenerate after a collection                 | `pnpm generate:types`, `pnpm generate:importmap`           | `INFO: Compiling TS types for Collections and Globals...`, then nothing; `No new imports found, skipping writing import map` |
| Create a migration                            | `pnpm migrate:create <name>`                               | `INFO: Migration created at` the new file under `migrations/`, then `INFO: Done.`                                            |
| What `pre-push` runs                          | `pnpm check`                                               | exits 0; the last output is the route table of `next build` with `ƒ /health`                                                 |
| Every check except `pnpm test:e2e`            | `pnpm verify`                                              | exits 0; the last output is the route table of `next build` with `ƒ /health`                                                 |
| Render rules after a change                   | `pnpm rules:sync`                                          | `Synced 37 agent rule files; 0 updated.`                                                                                     |
| Compare the harness with a create-app version | `pnpm harness:check <version>`                             | ends with `none differs.`                                                                                                    |

## Verifying your work

- Build: `pnpm build` (prints the `Route (app)` table)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

The `verifier` subagent starts the app with `pnpm dev` and exercises the changed behavior and the two nearest neighboring flows.

For a change to a page, the visual check uses the `playwright` MCP server from `.mcp.json`.

## Architecture

`src/payload.config.ts` wires the collections in `src/collections/` to PostgreSQL; the site lives in `src/app/(frontend)/`. `CONTRIBUTING.md` describes the build and how migrations apply.

## Conventions

1. **Change the schema only through collections, then regenerate and commit.** Payload generates `src/payload-types.ts`, `src/migrations/`, and `src/app/(payload)/admin/importMap.ts` with the commands above; never edit them by hand.
2. **Put unit tests next to the code as `src/**/*.test.{ts,tsx}`, which Vitest collects, and Playwright end-to-end tests in `test/` as `*.e2e.test.ts`.**
3. **Component tests need a DOM test environment, and Vitest runs in Node.js.** Add that environment with the first component test.
4. **Read configuration through `requireEnvironment` in `src/environment.ts`,** and document each variable in `.env.example`.
5. **Work runs through `/sdlc-mode`;** in an agent tool with no such command, read and follow `.claude/skills/sdlc-mode/SKILL.md`. Its playbooks decide how plans, fixes, branches, commits, and pull requests are made.
6. **Run parallel sessions in separate worktrees** (`claude --worktree <name>`), on tasks that touch different files. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Failing tests**: when a test fails, fix the code, not the test. Never skip, delete, or weaken a test to make a check pass.
- **Database for `pnpm dev` and end-to-end tests**: both need a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`. `CONTRIBUTING.md` says how to run end-to-end tests.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
