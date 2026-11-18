# next-friday-template-payload

Payload CMS application on Next.js and PostgreSQL. The API is REST at `/api`.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm dev
```

The CLI created `.env` from `.env.example` and set `PAYLOAD_SECRET` to a random secret. Before `pnpm dev`, `pnpm build`, `pnpm check`, or `pnpm verify`, set in `.env`:

- `DATABASE_URL`: a PostgreSQL database.
- `APP_URL`: the URL you open the app at, such as `http://localhost:3000`.
- `PAYLOAD_SECRET`, only if you recreate `.env` from `.env.example`: generate one with `openssl rand -hex 32`.

Then open `http://localhost:3000/admin` to create the first user.

**Warning:** until the first user exists, anyone who can reach `/admin` can create it. Create the first user in each deployed environment right after its first deploy, before you share the URL.

In development, Payload applies collection changes to the database directly. In production, Payload applies the migrations in `src/migrations/` when it first initialises, which `/health` triggers, so the first health check after a deploy applies them and fails while the database is unreachable.

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC. In step 1, also replace the `Payload application` text in `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx`, and `src/app/(frontend)/page.test.ts`.

## Scripts

| Script                    | Purpose                                                                                                           |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                | Start the development server                                                                                      |
| `pnpm build`              | Build for production                                                                                              |
| `pnpm start`              | Serve the standalone production build after `pnpm build`. The build copies `.env`, so rebuild after you change it |
| `pnpm test`               | Run unit tests                                                                                                    |
| `pnpm test:e2e`           | Run Playwright end-to-end tests (`test/**/*.e2e.test.ts`) against the database in `DATABASE_URL`                  |
| `pnpm generate:types`     | Regenerate `src/payload-types.ts` after a collection change                                                       |
| `pnpm generate:importmap` | Regenerate the admin import map after adding a custom component                                                   |
| `pnpm migrate:create`     | Create a migration from collection changes, for example `pnpm migrate:create add-posts`                           |
| `pnpm migrate`            | Apply pending migrations to the database in `DATABASE_URL`                                                        |
| `pnpm check`              | Run the static checks other than the format check, and the unit tests for changed code (the `pre-push` hook)      |
| `pnpm verify`             | Run the static checks, all unit tests with coverage, and the production build                                     |

`pnpm build` copies `.env` into `.next/standalone`, where every secret sits in plain text. Keep that folder out of images and archives.

CI also runs the build, the container image scan, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL, dependency review, and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`.

A commit runs gitleaks, lint-staged, and commitlint. A push runs `pnpm check`. A pull request runs the static checks, the unit tests with coverage, the build, patch coverage, and the scans above. A push to `main`, after the merge, also runs the end-to-end tests.

## Container

The `Dockerfile` builds a standalone production image that runs as the `node` user for a container platform. The server listens on `PORT`, or 3000 when it is unset, and needs `DATABASE_URL`, `PAYLOAD_SECRET`, and `APP_URL`, the public URL that Payload accepts cookie-authenticated and cross-origin requests from.

```sh
docker build -t app .
docker run --publish 3000:3000 --env DATABASE_URL --env PAYLOAD_SECRET --env APP_URL app
```

Uploaded images, up to 10 MB each, are written to the container filesystem, which a redeploy discards. Add a Payload storage adapter, for example `@payloadcms/storage-s3`, before storing media in production.

The config sets no `email` adapter, so Payload writes every email, including password-reset links, to the server log. Set `email` in `src/payload.config.ts` before production.

On Vercel, deploy without the image; the Next.js preset takes precedence over the `Dockerfile`.

## Deploy

The project has no deploy step yet. A deploy step needs:

- a workflow under `.github/workflows/` that deploys;
- the `prod` environment under **Settings → Environments**, with the release managers as its required reviewers;
- the image the `Dockerfile` builds.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
