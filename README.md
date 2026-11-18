# @next-friday/create-app

Create a Next Friday project with the company's tooling, Git hooks, CI, and agent rules already in place.

```sh
pnpm create @next-friday/app
```

Answer the prompts for a project name and a stack, or press Enter at each for `my-app` and Next.js. To skip the prompts and take those defaults, pass `--yes`. To skip them with your own choices, pass both:

```sh
pnpm create @next-friday/app my-api --stack nestjs
```

Without a terminal, as in CI or an agent, pass `--yes`, or the name and `--stack`. Pass `.` as the name to create the project in the current directory, for example in a fresh clone.

## Stacks

| `--stack`   | Starts with                                                       |
| :---------- | :---------------------------------------------------------------- |
| `nodejs`    | A TypeScript HTTP server on `node:http` with a `/health` endpoint |
| `nestjs`    | A NestJS app with a Terminus `/health` endpoint                   |
| `nextjs`    | A Next.js App Router app with React and Tailwind CSS              |
| `payload`   | Payload CMS on Next.js with PostgreSQL                            |
| `turborepo` | A Turborepo workspace with a Next.js app and a Payload backoffice |

Every stack is built from [`templates/base`](templates/base), which holds the shared company setup, plus its own directory under [`templates/`](templates), which holds the stack-specific files.

## What every project includes

- **Code quality:** TypeScript, ESLint and Prettier with the Next Friday configs, Vitest with coverage, fast-check, Knip, dependency-cruiser, editorconfig-checker, and sort-package-json.
- **Git hooks:** Husky runs gitleaks, `pnpm rules:check`, and lint-staged before each commit, commitlint on each message, and `pnpm check` before each push. After the first commit, commits to `main` are blocked, and local merges into `main` always are; pushes to `main` are blocked once it exists on the remote.
- **CI:** GitHub Actions run the static checks, tests with patch coverage, the build, end-to-end tests for Next.js and Payload, a container build and vulnerability scan, Semgrep, OSV-Scanner, CodeQL, dependency review, OpenSSF Scorecard, gitleaks, TruffleHog, zizmor, and pull request title validation. Dependabot keeps dependencies current.
- **Deployment:** a `Dockerfile` that runs as the `node` user. The project ships no deploy workflow: add your own, as the generated `SETUP.md` says.
- **Agent rules:** `CLAUDE.md` imports `AGENTS.md`. Shared rules live in `.agents/rules`, with hooks that enforce them in Claude Code.
- **SDLC loop:** the `/sdlc-mode` skill in `.claude/skills/` runs the loop. Its hooks and checks, such as the plan check before a `git push`, run only in a session where a person typed `/sdlc-mode`; after a resumed session, type it again.

## Requirements

- Node.js 26.13.0, the version in the generated `.nvmrc`. The CLI itself runs on the range in [`package.json#engines`](package.json).
- pnpm, through Corepack: `npm install --global corepack`, because Node.js 25 and later no longer ship it, then `corepack enable`. The generated project pins its pnpm version in `package.json#packageManager`.
- Git 2.28 or later.
- gitleaks 8.21 or later and jq, which the generated project's Git hooks need for the first commit.

## Options

```text
pnpm create @next-friday/app [name] [--stack nodejs|nestjs|nextjs|payload|turborepo] [--yes]
```

| Option           | Description                                                                   |
| :--------------- | :---------------------------------------------------------------------------- |
| `name`           | Project directory and package name. Asked when left out.                      |
| `--stack`        | `nodejs`, `nestjs`, `nextjs`, `payload`, or `turborepo`. Asked when left out. |
| `-y, --yes`      | Ask nothing: the name `my-app` and the stack `nextjs`, unless given.          |
| `--skip-git`     | Do not run `git init`.                                                        |
| `--skip-install` | Do not run `pnpm install`.                                                    |
| `-v, --version`  | Print the version.                                                            |
| `-h, --help`     | Print the usage.                                                              |

The name must:

- use lowercase letters, digits, `.`, `_`, or `-`, and start with a letter or digit;
- not end in `.`, and not be `node_modules`, `favicon.ico`, or a name that Windows reserves, such as `con`;
- be at most 214 characters long;
- point to a directory that does not exist or is empty, apart from `.git`.

## What the CLI does

1. Copies the template into the project directory and replaces the template's package name with the project name.
2. Writes `.env` from `.env.example`. For Payload and Turborepo, it sets `PAYLOAD_SECRET` to a random secret.
3. Runs `git init --initial-branch=main`, unless the directory is already in a Git repository.
4. Runs `pnpm install`, which also installs the Git hooks.
5. Makes the first commit, `build(repo): bootstrap <stack> workspace`, whose body names the CLI's version, the command, and the stack. The commit runs the project's Git hooks. In a repository that already has a commit, it commits on the branch `build/bootstrap-workspace` and prints the subject as the pull request title. When a hook stops the commit, or with `--skip-git` or `--skip-install`, it prints the commit to run instead.
6. Prints the next steps, for example:

   ```sh
   cd my-api
   pnpm start:dev
   ```

   The development script is `pnpm dev` for Next.js, Payload, and Turborepo, and `pnpm start:dev` for Node.js and NestJS.

Then follow **After creating a project from this template** in the project's `README.md` to push the first commit and set up the repository.

## Troubleshooting

- **`pnpm install` fails:** the CLI keeps the project and exits with 1. Fix the printed error, such as a Node.js version outside the project's `package.json#engines`, then run `pnpm install` in the project.
- **`--skip-git`:** run `git init --initial-branch=main` before `pnpm install`, so the install can set up the Git hooks.
- **`--skip-install`:** the Git hooks are not set up until you run `pnpm install`.
- **Cancelling:** Ctrl+C, SIGTERM, and SIGHUP exit with 130. During the copy, they also remove the partly copied project.
- **Payload:** set `DATABASE_URL` in `.env` to a PostgreSQL database before you start the app.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
