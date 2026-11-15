# Agent guide

Turborepo workspace in TypeScript on pnpm and Node.js `>=26.13.0 <27`. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on PostgreSQL on port 3001, with a REST API at `/api`.

## Commands

| Task                               | Command                                                                                    | Healthy output                                                                                                               |
| :--------------------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Start both apps with reload        | `pnpm dev`                                                                                 | `✓ Ready in 300ms` from each app                                                                                             |
| One test                           | `pnpm --filter ./apps/backoffice exec vitest run src/environment.test.ts -t "<test name>"` | `Tests  1 passed \| 4 skipped (5)`                                                                                           |
| Tests in one app                   | `TURBO_FILTER=--filter=./apps/app pnpm test`                                               | `Tasks:    1 successful, 1 total`                                                                                            |
| Unit tests                         | `pnpm test`, or `pnpm test:coverage`                                                       | `Tasks:    2 successful, 2 total`                                                                                            |
| End-to-end tests                   | `pnpm test:e2e`                                                                            | `Tasks:    4 successful, 4 total`, with `DATABASE_URL` pointing at a running database                                        |
| Regenerate after a collection      | `pnpm generate:types`, `pnpm generate:importmap`                                           | `INFO: Compiling TS types for Collections and Globals...`, then nothing; `No new imports found, skipping writing import map` |
| Create a migration                 | `pnpm migrate:create <name>`                                                               | `INFO: Migration created at` the new file under `migrations/`, then `INFO: Done.`                                            |
| What `pre-push` runs               | `pnpm check`                                                                               | exits 0; the output ends with the summary `Tasks:    2 successful, 2 total`                                                  |
| Every check except `pnpm test:e2e` | `pnpm verify`                                                                              | exits 0; the output ends with the summary `Tasks:    2 successful, 2 total`                                                  |
| Render rules after a change        | `pnpm rules:sync`                                                                          | `Synced 37 agent rule files; 0 updated.`                                                                                     |

## Verifying your work

- Build: `pnpm build` (prints `Tasks:    2 successful, 2 total`)
- Test: `pnpm test:coverage` (all green, and prints `Tasks:    2 successful, 2 total`; never skip or delete a failing test)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

The `verifier` subagent starts the app with `pnpm dev`, which needs a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`. It exercises the changed behavior and the two nearest neighboring flows.

After a change to a page, open that page with the `playwright` MCP server from `.mcp.json`, take a screenshot, look at it, and compare it with the approved mock when there is one; repeat until it matches.

## Architecture

- Root scripts run lint, format, Knip, and the agent checks once for the workspace, and hand `build`, `test`, `typecheck`, and `depcruise` to Turborepo for each app. `TURBO_FILTER` narrows them; the default is every app.
- The site lives in `apps/app/app/`. The backoffice site lives in `apps/backoffice/src/app/(frontend)/`, its collections in `apps/backoffice/src/collections/`, and its config in `apps/backoffice/src/payload.config.ts`. The root `generate:*` and `migrate*` scripts run in the backoffice.
- In development, Payload applies collection changes to the database directly. In production, the backoffice applies the migrations in `apps/backoffice/src/migrations/` when Payload first initialises, which `/health` triggers, so the first health check after a deploy applies them, not when the server starts.

## Conventions

1. **Change the backoffice schema only through collections, then regenerate and commit.** Payload generates `apps/backoffice/src/payload-types.ts`, `apps/backoffice/src/migrations/`, and `apps/backoffice/src/app/(payload)/admin/importMap.ts`; run `pnpm generate:types`, `pnpm generate:importmap`, and `pnpm migrate:create <name>`. Do not edit those files by hand.
2. **Put unit tests next to the code and Playwright end-to-end tests in `apps/app/test/` and `apps/backoffice/test/` as `*.e2e.test.ts`.** Vitest collects `apps/app/app/**/*.test.{ts,tsx}` and `apps/backoffice/src/**/*.test.{ts,tsx}`.
3. **Component tests need a DOM test environment, and Vitest runs in Node.js.** Add that environment with the first component test.
4. **Read backoffice configuration through `requireEnvironment` in `apps/backoffice/src/environment.ts`.** Document each variable in `.env.example`.
5. **Work runs through `/sdlc-mode`;** in an agent tool with no such command, read and follow `.claude/skills/sdlc-mode/SKILL.md`. Its playbooks decide how plans, fixes, branches, commits, and pull requests are made.
6. **Run parallel sessions in separate worktrees** (`claude --worktree <name>`), on tasks that touch different files. Tasks that share files run in one session, one after another. Start with two or three sessions.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Failing tests**: when a test fails, fix the code, not the test. Never skip, delete, or weaken a test to make a check pass.
- **Next.js docs live per app**: this Next.js version differs from your training data. Read the guide in `apps/app/node_modules/next/dist/docs/` or `apps/backoffice/node_modules/next/dist/docs/` before writing Next.js code; the workspace root has no `next` package.
- **Database for `pnpm dev` and end-to-end tests**: the backoffice needs a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`; the README lists every variable. Run `pnpm --filter ./apps/app exec playwright install chromium` once before the first `pnpm test:e2e`.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.
