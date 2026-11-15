# next-friday-template-turborepo

Turborepo workspace. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on port 3001. The backoffice API is REST at `/api`.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm dev
```

The CLI created `.env` from `.env.example` and set `PAYLOAD_SECRET` to a random secret. Before `pnpm dev`, `pnpm build`, `pnpm check`, or `pnpm verify`, set in `.env`:

- `DATABASE_URL`: a PostgreSQL database.
- `APP_URL`: the URL you open the backoffice at, such as `http://localhost:3001`.
- `PAYLOAD_SECRET`, only if you recreate `.env` from `.env.example`: generate one with `openssl rand -hex 32`.

Then open `http://localhost:3000` for the site and `http://localhost:3001/admin` to create the first user.

**Warning:** until the first user exists, anyone who can reach the backoffice `/admin` can create it. Create the first user in each deployed environment right after its first deploy, before you share the URL.

In development, Payload applies collection changes to the database directly. In production, Payload applies the migrations in `apps/backoffice/src/migrations/` when it first initialises, which the backoffice `/health` triggers, so the first health check after a deploy applies them and fails while the database is unreachable.

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC. In step 1, also replace the `Next.js application` text in `apps/app/app/layout.tsx`, `apps/app/app/page.tsx`, and `apps/app/app/page.test.ts`, and the `Payload application` text in `apps/backoffice/src/app/(frontend)/layout.tsx`, `apps/backoffice/src/app/(frontend)/page.tsx`, and `apps/backoffice/src/app/(frontend)/page.test.ts`.

## Scripts

| Script                    | Purpose                                                                                                |
| :------------------------ | :----------------------------------------------------------------------------------------------------- |
| `pnpm dev`                | Start the Next.js app on port 3000 and the Payload backoffice on port 3001                             |
| `pnpm build`              | Build both apps for production                                                                         |
| `pnpm start`              | Serve both standalone production builds after `pnpm build`                                             |
| `pnpm test`               | Run unit tests in both apps                                                                            |
| `pnpm test:e2e`           | Run Playwright end-to-end tests in both apps. The backoffice uses the database in `DATABASE_URL`       |
| `pnpm generate:types`     | Regenerate `apps/backoffice/src/payload-types.ts` after a collection change                            |
| `pnpm generate:importmap` | Regenerate the admin import map after adding a custom component                                        |
| `pnpm migrate:create`     | Create a migration from collection changes, for example `pnpm migrate:create add-posts`                |
| `pnpm migrate`            | Apply pending migrations to the database in `DATABASE_URL`                                             |
| `pnpm check`              | Run the static checks, the unit tests for changed code, and the production build (the `pre-push` hook) |
| `pnpm verify`             | Run the static checks, all unit tests with coverage, and the production build                          |

CI also runs the build, the end-to-end tests, the container image scans, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL, dependency review, and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`. Pull requests run Turborepo with `--affected` against the base branch, so only packages that changed are typed, tested, built, and scanned. Pushes to `main` run every app. The weekly schedule rebuilds and scans every container image and runs nothing else. Patch coverage runs only for apps that produced a coverage file.

To reuse task output across CI runs, create a Vercel team, add the repository variable `TURBO_TEAM`, and follow [Turborepo on GitHub Actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions) to allow OIDC. The workflow exchanges GitHub OIDC for a short-lived Remote Cache token. If OIDC is unavailable, set the `TURBO_TOKEN` secret instead. Leave both unset to run without a Remote Cache.

## Apps

Root files name the apps through `apps/*`, so adding or removing an app changes no root file except `prettier.config.ts`, whose `tailwindStylesheet` names one stylesheet.

**Add a Next.js app.** Copy `apps/app` with Turborepo's generator, then give the new app its own port in its `dev` script and in its `playwright.config.ts`:

```sh
pnpm exec turbo gen workspace --copy <the package name in apps/app/package.json> --destination apps/<name> --name <a new package name>
pnpm install
```

**Remove the backoffice.** Delete `apps/backoffice`, then remove what only it uses:

- the root `generate:importmap`, `generate:types`, `migrate`, and `migrate:create` scripts in `package.json`;
- `DATABASE_URL`, `PAYLOAD_SECRET`, and `APP_URL` from `turbo.json`, `.env.example`, and `.github/workflows/ci.yml`, and the `postgres` service in that workflow;
- the `apps/backoffice/...` entries in `eslint.config.ts`, `.prettierignore`, `.editorconfig-checker.json`, `.dockerignore`, and `.gitignore`.

Then run `pnpm install` and `pnpm verify`.

## Container

Each app has a Dockerfile. Build each from the workspace root. The images run as the `node` user and listen on `PORT`, or 3000 when it is unset. The backoffice needs `DATABASE_URL`, `PAYLOAD_SECRET`, and `APP_URL`.

```sh
docker build --file apps/app/Dockerfile --tag app .
docker build --file apps/backoffice/Dockerfile --tag backoffice .
docker run --publish 3000:3000 app
docker run --publish 3001:3001 --env PORT=3001 --env DATABASE_URL --env PAYLOAD_SECRET --env APP_URL backoffice
```

Uploaded images, up to 10 MB each, are written to the backoffice container filesystem, which a redeploy discards. Add a Payload storage adapter, for example `@payloadcms/storage-s3`, before storing media in production.

On Vercel, deploy an app without its image. The Next.js preset takes precedence over the Dockerfile.

## Deploy

The project has no deploy step yet. A deploy step needs:

- a workflow under `.github/workflows/` that deploys;
- the `prod` environment under **Settings → Environments**, with the release managers as its required reviewers;
- the image the `Dockerfile` builds.

## Mobile app

To add an Expo app, create it under `apps/mobile`:

1. Create the app from the workspace root with `pnpm create expo-app@latest apps/mobile`, then add `packages/*` workspace packages as you share code. Keep `eas.json` and `credentials.json` inside `apps/mobile` and run the EAS CLI from that directory ([Expo: Build with monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/)).
2. Use `@expo/fingerprint` with `expo-github-action/fingerprint` so a pull request requests a native build only when the native layer changed ([Expo fingerprint](https://docs.expo.dev/versions/latest/sdk/fingerprint/)).
3. Keep a single `react-native` version in the workspace. Duplicate React Native versions in one monorepo are not supported ([Expo: Monorepos](https://docs.expo.dev/guides/monorepos/)).

EAS Build and Submit deploy that app, in place of the project's deploy step. CI `--affected` already includes `apps/*` and `packages/*`, so an Expo app is skipped when it did not change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
