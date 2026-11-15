---
"@next-friday/create-app": major
---

The CLI no longer has the `--deploy` option, and it no longer ships the Railway deploy files: `railway.json`, `.github/workflows/deploy.yml`, `runbooks/rollback-deploy.md`, and the `deploy-dev` job in `ci.yml`. `pnpm create @next-friday/app my-app --deploy railway` and `--deploy none` now fail with `Unknown option '--deploy'`. The first commit's `Command:` line no longer names a deploy target.

Every generated project now has no deploy workflow. Its `SETUP.md` has a **Deploy** section that says what a deploy step needs: your own workflow, a `prod` environment with the release managers as required reviewers, and the image the `Dockerfile` builds.

To migrate, drop `--deploy` from the command. A project generated with `--deploy railway` keeps working: keep its `deploy.yml`, `railway.json`, and runbook as your own deploy setup, and maintain them in that project.
