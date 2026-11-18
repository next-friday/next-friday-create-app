# Agent guide

Turborepo workspace in TypeScript on pnpm and Node.js `>=26.13.0 <27`. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on PostgreSQL on port 3001, with a REST API at `/api`.

## Commands

| Task                                          | Command                                                                                    | Healthy output                                                                                                                                   |
| :-------------------------------------------- | :----------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| Start both apps with reload                   | `pnpm dev`                                                                                 | `✓ Ready in 300ms` from each app                                                                                                                 |
| One test                                      | `pnpm --filter ./apps/backoffice exec vitest run src/environment.test.ts -t "<test name>"` | `Tests  1 passed \| 4 skipped (5)`                                                                                                               |
| Tests in one app                              | `TURBO_FILTER=--filter=./apps/app pnpm test`                                               | Turborepo's summary line, `Tasks:` with every task successful                                                                                    |
| Build the changed apps                        | `TURBO_FILTER=--affected TURBO_SCM_BASE=origin/main pnpm build`                            | Turborepo's summary line, `Tasks:` with every task successful                                                                                    |
| Test the changed apps                         | `TURBO_FILTER=--affected TURBO_SCM_BASE=origin/main pnpm test`                             | Turborepo's summary line, `Tasks:` with every task successful                                                                                    |
| Type-check the changed apps                   | `TURBO_FILTER=--affected TURBO_SCM_BASE=origin/main pnpm typecheck`                        | Turborepo's summary line, `Tasks:` with every task successful                                                                                    |
| Unit tests                                    | `pnpm test`, or `pnpm test:coverage`                                                       | Turborepo's summary line, `Tasks:` with every task successful                                                                                    |
| End-to-end tests, which CI runs after a merge | `pnpm test:e2e`                                                                            | Turborepo's summary line, `Tasks:` with every task successful, with `DATABASE_URL` pointing at a running database                                |
| Regenerate after a collection                 | `pnpm generate:types`, `pnpm generate:importmap`                                           | `INFO: Compiling TS types for Collections and Globals...`, then nothing; `No new imports found, skipping writing import map`                     |
| Create a migration                            | `pnpm migrate:create <name>`                                                               | `INFO: Migration created at` the new file under `migrations/`, then `INFO: Done.`                                                                |
| What `pre-commit` runs after gitleaks | `pnpm exec lint-staged` | `✔ Done running tasks for staged files!` |
| What `pre-push` runs for a push of code       | `pnpm check`                                                                               | exits 0; the last lines list every step with its result, a failed step names its exit code, and a step Turborepo answered from its cache says so |
| Every check except `pnpm test:e2e`, which a pull request runs in CI | `pnpm verify`                                                                              | exits 0; the last lines list every step with its result, a failed step names its exit code, and a step Turborepo answered from its cache says so |
| Render rules after a change                   | `pnpm rules:sync`                                                                          | `Synced 37 agent rule files; 0 updated.`                                                                                                         |
| Compare the harness with a create-app version | `pnpm harness:check <version>`                                                             | ends with `none differs.`                                                                                                                        |

Lint, format, Knip, and `package.json` ordering run over the whole workspace whatever the filter says.

## Verifying your work

The hooks run these checks: `pre-commit` runs gitleaks and lint-staged on the staged files, and `pre-push` runs `pnpm check`. Run none of them yourself.

- Build: `pnpm build` (the last line is Turborepo's `Tasks:` summary with every task successful)
- Test: `pnpm test:coverage` (all green, and the last line is Turborepo's `Tasks:` summary with every task successful)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

The `pre-push` hook runs `pnpm check` for the affected apps once, at the push, and the reply's **Checks** quotes the hook's output from the push. For a push that changes only documents, the hook runs `pnpm rules:check` and `pnpm plan:check` instead. `pnpm check` runs the tests related to the change; `pnpm test:coverage` runs in `pnpm verify`.

The `verifier` subagent starts the apps with `pnpm dev`. It exercises the changed behavior and the two nearest neighboring flows.

For a change to a page, the visual check uses the `playwright` MCP server from `.mcp.json`.

## Architecture

Root scripts run the workspace checks once and hand `build`, `test`, `typecheck`, and `depcruise` to Turborepo for each app; `TURBO_FILTER` narrows them. The root `generate:*` and `migrate*` scripts run in the backoffice. The site lives in `apps/app/app/`. The backoffice site lives in `apps/backoffice/src/app/(frontend)/`, its collections in `apps/backoffice/src/collections/`, and its config in `apps/backoffice/src/payload.config.ts`. In production, the backoffice applies the migrations in `apps/backoffice/src/migrations/` when Payload first initialises, which `/health` triggers.

## Conventions

1. **Change the backoffice schema only through collections, then regenerate and commit.** Payload generates `apps/backoffice/src/payload-types.ts`, `apps/backoffice/src/migrations/`, and `apps/backoffice/src/app/(payload)/admin/importMap.ts` with the commands above; never edit them by hand.
2. **Put unit tests next to the code as `*.test.{ts,tsx}`, which Vitest collects, and Playwright end-to-end tests in each app's `test/` as `*.e2e.test.ts`.**
3. **Component tests need a DOM test environment, and Vitest runs in Node.js.** Add that environment with the first component test.
4. **Read backoffice configuration through `requireEnvironment` in `apps/backoffice/src/environment.ts`,** and document each variable in `.env.example`.
5. **Work runs through `/sdlc-mode`;** in an agent tool with no such command, read and follow `.claude/skills/sdlc-mode/SKILL.md`. Its playbooks decide how plans, fixes, branches, commits, and pull requests are made.
6. **Run parallel sessions in separate worktrees** (`claude --worktree <name>`), on tasks that touch different files. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.
7. **Name a branch `<type>/<short-description>`,** where `<type>` is a commit type that `.commitlintrc.json` allows, for example `feat/add-contact-page`.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Failing tests**: when a test fails, fix the code, not the test. Never skip, delete, or weaken a test to make a check pass.
- **Next.js docs live per app**: this Next.js version differs from your training data. Read the guide in `apps/app/node_modules/next/dist/docs/` or `apps/backoffice/node_modules/next/dist/docs/` before writing Next.js code; the workspace root has no `next` package.
- **Database for `pnpm dev` and end-to-end tests**: the backoffice needs a PostgreSQL database in `DATABASE_URL`, and `PAYLOAD_SECRET` and `APP_URL`, in `.env`. `pnpm build`, `pnpm check`, and `pnpm verify` need the three variables too. Run `pnpm --filter ./apps/app exec playwright install chromium` once before the first `pnpm test:e2e`.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.
