# Deploy phase: take a merged change to the production gate

1. Find the commit. It is the full SHA on the default branch that the request names, or the latest commit there. Read its CI run. When a check failed or is still running, say which one in two lines and stop. When you cannot read the CI run from this session, say so and carry on with the commit marked as not verified.
2. Read how this project deploys. The project ships no deploy workflow. Read the deploy section of `SETUP.md`, and the deploy or release workflow the team added under `.github/workflows/`. When the team added none, say so in two lines and stop. When you cannot tell whether that workflow can run, say so and carry on.
3. Report where the commit is. For each environment, in the order the project promotes them, say whether this commit is deployed there. Give the deployment's link or the output that shows it. Where you cannot read an environment, write "not read" and why.
4. Promote the commit to an environment before production only when the request asks for that environment. Do it the way the team's deploy workflow and the deploy section of `SETUP.md` say, one environment at a time.
   - When a deployment fails, stop. Report the failing step and its log, and promote no further.
   - When the request names production, by any name such as `prod`, go to step 5.
   - When it names an environment the project does not have, say so and list the ones it has.
5. **Gate: the release manager authorizes production.** Never start a production deployment, run a command that names the production environment, or push a release tag. Report the commit's SHA, the environments it has passed, the checks' results, and the exact action the release manager takes to promote it. Then wait.

**Hands off to:** `playbooks/maintain.md`. A job or a person runs it when monitoring or a ticket reports a finding in production.
