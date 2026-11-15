# Agent guide

`@next-friday/create-app` is an ESM TypeScript CLI (`pnpm create @next-friday/app`) that generates a project from a stack in `src/stacks.ts`. It runs on Node.js `>=24.15.0`; this repository uses `.nvmrc` and pnpm. `CONTRIBUTING.md` holds the architecture and how to check a template.

## Commands

| Task                           | Command                                                     |
| :----------------------------- | :---------------------------------------------------------- |
| Every check (pre-push runs it) | `pnpm verify`                                               |
| Tests                          | `pnpm test`, or `pnpm test:coverage`                        |
| One test                       | `pnpm vitest run test/stacks.test.ts -t "<test name>"`      |
| Lint, types, unused code       | `pnpm lint:check`, `pnpm typecheck`, `pnpm knip`            |
| Build `dist/main.mjs`          | `pnpm build`                                                |
| Render agent rules             | `pnpm rules:sync`; `pnpm rules:check` fails on stale copies |
| Render the `sdlc` harness      | `pnpm plugin:sync`; `pnpm plugin:check` fails on stale ones |
| Release note, when one is due  | `pnpm changeset` (see `.changeset/README.md`)               |

## Verifying your work

Run `pnpm build` (its last line starts with `✔ Build complete`), `pnpm test:coverage` (all green; never skip or delete a failing test), and `pnpm lint:check` (prints nothing after the `eslint` line) before reporting a task complete, and paste the output. `pnpm verify` runs all three.

## Conventions

1. **Edit `src/`, `test/`, and `templates/`; never edit `dist/` or a rendered copy.** `pnpm rules:sync` renders `.agents/`, and `pnpm plugin:sync` renders `plugins/sdlc/source/`.
2. **Preserve CLI arguments, prompts, and stack names** unless a major changeset declares the break. `.changeset/README.md` says when a change needs a changeset.
3. **When you change a `base` file that a stack replaces, make the same change in each replacement.** `CONTRIBUTING.md` lists them.
4. **Store `.gitignore` as `_gitignore` and commit no `pnpm-lock.yaml` under `templates/`.**
5. **After a change under `templates/`, run `pnpm verify` in a project generated from each stack in `src/stacks.ts`,** because CI runs all of them.
6. **Work runs through `/sdlc-mode`.** In an agent tool with no command for it, read and follow `.claude/skills/sdlc-mode/SKILL.md`. Its playbooks decide how branches, commits, and pull requests are made, over a skill from another checkout.
7. **Run parallel sessions in separate worktrees** (`claude --worktree <name>`), on tasks that touch different files. Tasks that share files run in one session, one after another. Start with two or three sessions.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Template rule copies**: root `pnpm rules:sync` renders only the root. Render a template's copy in a generated project and copy it back with your file-editing tool; the shell gate blocks `cp` and `rsync` into `.agents`, `.claude/rules`, and `.cursor`.
- **Failing tests**: when a test fails, fix the code, not the test.
- **Commit messages**: commitlint accepts only `Co-Authored-By` trailers.
- **Issues**: open an issue only to hand work to another person. A pull request closes an issue that already exists with `Closes #<issue>`.
- **Testing a skill**: run it with Claude Code in a project generated after `pnpm plugin:sync` and `pnpm build`: `claude -p "/sdlc-mode <request>" --model <small model> --strict-mcp-config`. After you change `AGENTS.md`, a skill, or a hook, run the eval cases of what changed with `--case <name>` (`plugins/sdlc/README.md`), and report their scores. Run `pnpm evals:run` and `pnpm evals:run:write` in full before a release.
- **One change, one pull request**: `plan.md`, the code, and one changeset go in one pull request; the engineer accepts the plan in the session.
- **Accepted is not built**: check each requirement of a spec against the tree before you call a change done.
- **What belongs in the repository**: the change, its reason, and the checks. No date, log, history, mistake count, token figure, or session note.
- **CI-only jobs**: Template, Consumer Smoke, Compatibility, Dependency Audit, and the scorecard, secret-scan, zizmor, and dependency-review workflows run only in CI. Do not report them as local results.
- **npm is production**: a changeset, a new package, and a change to `release.yml` each publish to npm. Before such a pull request, tell the user the package's name and version. Add no package the user did not order.
- **Playbook claims**: add a requirement to an intent, spec, or plan only when the user decided it or a source says it, a review bot's suggestion included. Quote the passage and say where it is; otherwise leave it out and answer the thread with that.
