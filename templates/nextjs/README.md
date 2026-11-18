# next-friday-template-nextjs

Next.js application.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm dev
```

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC. In step 1, also replace the `Next.js application` text in `app/layout.tsx`, `app/page.tsx`, and `app/page.test.ts`.

## Scripts

| Script          | Purpose                                                                                                           |
| :-------------- | :---------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`      | Start the development server                                                                                      |
| `pnpm build`    | Build for production                                                                                              |
| `pnpm start`    | Serve the standalone production build after `pnpm build`. The build copies `.env`, so rebuild after you change it |
| `pnpm test`     | Run unit tests                                                                                                    |
| `pnpm test:e2e` | Run Playwright end-to-end tests (`test/**/*.e2e.test.ts`)                                                         |
| `pnpm check`    | Run the static checks other than the format check, and the unit tests for changed code (the `pre-push` hook)      |
| `pnpm verify`   | Run the static checks, all unit tests with coverage, and the production build                                     |

`pnpm build` copies `.env` into `.next/standalone`, where every secret sits in plain text. Keep that folder out of images and archives.

CI also runs the build, the container image scan, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL, dependency review, and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`.

A commit runs gitleaks, lint-staged, and commitlint. A push runs `pnpm check`. A pull request runs the static checks, the unit tests with coverage, the build, patch coverage, and the scans above. A push to `main`, after the merge, also runs the end-to-end tests.

## Container

The `Dockerfile` builds a standalone production image that runs as the `node` user for a container platform. The server listens on `PORT`, or 3000 when it is unset.

```sh
docker build -t app .
docker run --publish 3000:3000 app
```

On Vercel, deploy without the image; the Next.js preset takes precedence over the `Dockerfile`.

## Deploy

The project has no deploy step yet. A deploy step needs:

- a workflow under `.github/workflows/` that deploys;
- the `prod` environment under **Settings → Environments**, with the release managers as its required reviewers;
- the image the `Dockerfile` builds.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
