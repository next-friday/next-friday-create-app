# next-friday-template-nestjs

NestJS HTTP API.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm start:dev
```

The server listens on the port set by `PORT` in `.env`, which the CLI created from `.env.example`.

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC.

## Scripts

| Script             | Purpose                                                                                                |
| :----------------- | :----------------------------------------------------------------------------------------------------- |
| `pnpm start`       | Start once, without watch mode; loads `.env` when present                                              |
| `pnpm start:dev`   | Start in watch mode; loads `.env` when present                                                         |
| `pnpm start:debug` | Start in watch mode with the Node.js inspector; loads `.env` when present                              |
| `pnpm build`       | Compile to `dist/`                                                                                     |
| `pnpm start:prod`  | Run `dist/main.js`; the environment sets `PORT`                                                        |
| `pnpm test`        | Run unit tests (`src/**/*.test.ts`)                                                                    |
| `pnpm test:e2e`    | Run end-to-end tests (`test/**/*.e2e.test.ts`)                                                         |
| `pnpm check`       | Run the static checks, the unit tests for changed code, and the production build (the `pre-push` hook) |
| `pnpm verify`      | Run the static checks, all unit tests with coverage, the end-to-end tests, and the production build    |

CI also runs the build, the end-to-end tests, the container image scan, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL, dependency review, and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`.

## Container

The `Dockerfile` builds a production image that runs as a non-root user (UID 1000). The platform must set `PORT`. The build needs `pnpm-lock.yaml`, so run `pnpm install` once before the first `docker build`.

```sh
docker build -t app .
docker run --env PORT=3000 --publish 3000:3000 app
```

## Deploy

The project has no deploy step yet. A deploy step needs:

- a workflow under `.github/workflows/` that deploys;
- the `prod` environment under **Settings → Environments**, with the release managers as its required reviewers;
- the image the `Dockerfile` builds.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
