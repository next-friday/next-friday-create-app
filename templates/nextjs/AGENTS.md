# Agent guide

Next.js App Router web app with React and Tailwind CSS, in TypeScript on pnpm and Node.js `>=26.13.0 <27`.

## Commands

| Task                                          | Command                                                     | Healthy output                                                               |
| :-------------------------------------------- | :---------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Start with reload                             | `pnpm dev`                                                  | `✓ Ready in 301ms`                                                           |
| One test                                      | `pnpm vitest run app/health/route.test.ts -t "<test name>"` | `Tests  1 passed (1)`                                                        |
| Unit tests                                    | `pnpm test`, or `pnpm test:coverage`                        | `Tests  2 passed (2)`                                                        |
| End-to-end tests, which CI runs after a merge | `pnpm test:e2e`                                             | `1 passed (5.6s)`                                                            |
| What `pre-commit` runs after gitleaks | `pnpm exec lint-staged` | `✔ Done running tasks for staged files!` |
| What `pre-push` runs for a push of code       | `pnpm check`                                                | exits 0; the last output is the route table of `next build` with `ƒ /health` |
| Every check except `pnpm test:e2e`, which a pull request runs in CI | `pnpm verify`                                               | exits 0; the last output is the route table of `next build` with `ƒ /health` |
| Render rules after a change                   | `pnpm rules:sync`                                           | `Synced 37 agent rule files; 0 updated.`                                     |
| Compare the harness with a create-app version | `pnpm harness:check <version>`                              | ends with `none differs.`                                                    |

## Verifying your work

The hooks run these checks: `pre-commit` runs gitleaks and lint-staged on the staged files, and `pre-push` runs `pnpm check`. Run none of them yourself.

- Build: `pnpm build` (prints the `Route (app)` table)
- Test: `pnpm test:coverage` (all green, then the coverage summary)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

The `pre-push` hook runs `pnpm check` once, at the push, and the reply's **Checks** quotes the hook's output from the push. For a push that changes only documents, the hook runs `pnpm rules:check` and `pnpm plan:check` instead. `pnpm check` runs the tests related to the change; `pnpm test:coverage` runs in `pnpm verify`.

The `verifier` subagent starts the app with `pnpm dev`. It exercises the changed behavior and the two nearest neighboring flows.

For a change to a page, the visual check uses the `playwright` MCP server from `.mcp.json`.

## Architecture

- Routes live in `app/`. `app/health/route.ts` serves `/health`.
- `next.config.ts` builds `output: "standalone"`, enables Cache Components, and sets the security headers. `pnpm start` copies the static assets into `.next/standalone` and serves it.

## Conventions

1. **Put unit tests next to the code as `app/**/*.test.{ts,tsx}` and Playwright end-to-end tests in `test/` as `*.e2e.test.ts`.** Vitest collects only the first pattern.
2. **Component tests need a DOM test environment, and Vitest runs in Node.js.** Add that environment with the first component test.
3. **Read configuration from environment variables and fail when one is missing.** Document each variable in `.env.example`.
4. **Work runs through `/sdlc-mode`;** in an agent tool with no such command, read and follow `.claude/skills/sdlc-mode/SKILL.md`. Its playbooks decide how plans, fixes, branches, commits, and pull requests are made.
5. **Run parallel sessions in separate worktrees** (`claude --worktree <name>`), on tasks that touch different files. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.
6. **Name a branch `<type>/<short-description>`,** where `<type>` is a commit type that `.commitlintrc.json` allows, for example `feat/add-contact-page`.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Failing tests**: when a test fails, fix the code, not the test. Never skip, delete, or weaken a test to make a check pass.
- **First end-to-end run**: run `pnpm exec playwright install chromium` once. `pnpm test:e2e` starts the development server unless one is already running.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
