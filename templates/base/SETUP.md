# Setup

This project runs an AI-native software development loop in Claude Code and Cursor: intent, spec, plan, build, review, deploy, and maintain. Do the steps below in order. Each step says who does it and how to check that it is done.

## How a change flows

Send a request with `/sdlc-mode`. Only a person starts it; nothing routes work into it by itself. `/sdlc-help` says how to keep `/sdlc-mode` on for a session in Claude Code and Cursor, and `/setup-sdlc` chooses the models and reports which steps below are done. `intent/README.md` and the playbooks in `.claude/skills/sdlc-mode/playbooks/` say who acts and who decides at each stage.

| Stage    | Who acts                                                                         | What carries it out                                                                                                  |
| :------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Plan     | The originator; the product owner accepts by merging                             | `/sdlc-mode` with the idea writes `intent/<change>/intent.md`                                                        |
| Design   | The agent; the product owner reviews and merges                                  | `Spec on intent merge`, or `/sdlc-mode` with the intent's path, writes `spec.md`                                     |
| Build    | The engineer accepts the plan in the session; the agent builds                   | `/sdlc-mode build` writes `plan.md` and the code in one pull request; `pnpm plan:check` and the push hook check them |
| Test     | The agent, before it reports done                                                | The `Stop` hook runs `pnpm verify`; the `verifier` subagent runs the app                                             |
| Deploy   | A code owner approves and a person merges; a release manager approves production | `playbooks/review.md` drives the pull request to green; the production gate hook blocks a deploy without approval    |
| Maintain | A service owner triages                                                          | `Control band` and `/sdlc-mode` with a finding write a new `intent.md`                                               |

`/sdlc-status` shows where each change stands, and a session starts with the same list.

The project holds the `sdlc` harness itself, so there is nothing to install. The skills are in `.claude/skills/`, which Claude Code loads, and which Cursor loads too: "For compatibility, Cursor also loads skills from Claude and Codex directories" ([Cursor: Agent Skills](https://cursor.com/docs/skills)). The `verifier` subagent is in `.claude/agents/` for Claude Code and in `.cursor/agents/` for Cursor. The hook scripts are in `.claude/skills/sdlc-mode/hooks/`: `.claude/settings.json` runs them in Claude Code, and `.cursor/hooks.json` runs them in Cursor. Another agent tool reads `.claude/skills/sdlc-mode/SKILL.md`, the path `AGENTS.md` names.

Part of the harness does not load in these cases. The checks of `pre-push` and of CI still apply to every person, whichever tool they use.

- **A Claude Code cloud session with several repositories,** in an Anthropic-hosted environment, runs no hook: it "reads only the `enabledPlugins` and `extraKnownMarketplaces` keys from each repository's `.claude/settings.json`, not permission rules, hooks, `env`, or other keys" ([Claude Code: Settings](https://code.claude.com/docs/en/settings)).
- **A cloud thread in a Claude project** loads neither the skills nor the hooks: "In a project's cloud thread, skills committed to a repository's `.claude/skills/` aren't available" ([Claude Code: Skills](https://code.claude.com/docs/en/skills)), and there "none of a repository's `.claude/settings.json` permission rules, hooks, or `env` apply, however many repositories the project has" ([Claude Code: Settings](https://code.claude.com/docs/en/settings)).
- **A Cursor cloud agent on Cursor's own machines** runs no `sessionStart` hook, so the status list does not show when it starts: "Deferred while cloud agents can still start in a read-only environment" ([Cursor: Hooks](https://cursor.com/docs/hooks)).
- **A Cursor cloud agent in its early read-only turns** runs no hook: "Hooks do not run during those turns. They start once the agent has a writable environment" (same page).
- **Cursor with Include Third-Party Plugins, Skills, and Other Configs turned off:** "Claude Code hooks load when **Include Third-Party Plugins, Skills, and Other Configs** is enabled" ([Cursor: Third Party Hooks](https://cursor.com/docs/reference/third-party-hooks)), and its name covers skills. Leave it on, as it is by default.
- **Another agent tool** gets the skills by their path, and no subagent and no hooks.

## 1. First commit and push

**Who:** an engineer.

1. Install gitleaks and jq (see [CONTRIBUTING.md](CONTRIBUTING.md)).
2. Replace the template's description and owner: `package.json#description`, `repository.url`, and `author`, and any template text that `README.md` → **After creating a project from this template** lists. Change `license` from `UNLICENSED` if the project is open source.
3. Create an empty repository on GitHub. If the project is not a Git repository yet, run `git init --initial-branch=main`. Make the first commit on `main` and push it there. The Git hooks allow only this first commit and push on `main`; work on branches after that.

   ```sh
   git add --all
   git commit -m "chore(repo): start from template"
   git remote add origin https://github.com/OWNER/REPOSITORY.git
   git push --set-upstream origin main
   ```

   When the GitHub repository already has a commit, such as a README, push the import to a branch and open a pull request instead. `pnpm plan:check` lets this first import through without a plan while `main` has no `package.json`. `-X theirs` keeps the template's copy of a file, such as `README.md`, that both commits add.

   ```sh
   git branch -m chore/start-from-template
   git remote add origin https://github.com/OWNER/REPOSITORY.git
   git fetch origin main
   git rebase -X theirs origin/main
   git push --set-upstream origin chore/start-from-template
   ```

**Check:** `git log --oneline origin/main` prints one commit, or the import's pull request is open.

## 2. Owners

**Who:** an engineer, with the product owner, a lead, and each policy owner.

In `.github/CODEOWNERS`, add these lines in this order. GitHub uses the last matching line for each file ([code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)), so the line for every file comes first:

```text
* @your-org/your-team
/intent/ @the-product-owner
/.claude/skills/ @the-lead-who-signs-off-the-intent-template
/.claude/agents/ @the-lead-who-signs-off-the-intent-template
/.cursor/agents/ @the-lead-who-signs-off-the-intent-template
/.agents/skills/brand-policy/ @the-brand-policy-owner
/.agents/skills/security-policy/ @the-security-policy-owner
/.agents/skills/compliance-policy/ @the-compliance-policy-owner
/.agents/skills/ux-policy/ @the-ux-policy-owner
```

Replace every owner above with a GitHub user or team that has write access to the repository. Also replace the owner placeholder in `.github/zizmor.yml`.

Code owners need: write access to the repository for each owner; for a team, a visible team that itself has write access; and, in a private repository, GitHub Pro, Team, or Enterprise (**paid:** in a private repository; **free alternative:** make the repository public) ([code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)). Until the ruleset of step 3 requires their review, a code owner is asked for a review and a pull request merges without it.

Replace `security@example.com` in `SECURITY.md` with the contact the security policy owner names, such as the security email of the company or of the client.

**Check:** on GitHub, open `.github/CODEOWNERS`; GitHub shows no errors in the file. `grep example.com SECURITY.md` prints nothing.

## 3. GitHub repository settings

**Who:** a repository admin.

- **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**. Every workflow requests the extra permissions it needs.
- **General → Pull Requests:** select **Automatically delete head branches**, so a branch is deleted when its pull request merges.
- **General → Pull Requests → Allow squash merging:** set the default commit message to the pull request title alone ([configure commit squashing](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)). Each commit on `main` is then the pull request title and number, with only co-author trailers in the body; the pull request description holds the why.
- **Advanced Security:** enable Dependabot alerts and Dependabot security updates. If the organization has [GitHub Secret Protection](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security), also enable secret scanning and push protection; a private repository needs it for both, and it needs a GitHub Team or GitHub Enterprise plan (**paid:** in a private repository; **free alternative:** gitleaks and TruffleHog scan for secrets in CI either way).
- **Rules → Rulesets:** protect `main` with:
  - squash merges only, a linear history, and no force pushes or deletion;
  - the required checks `All Checks` and `Validate pull request title`;
  - a pull request before merging, with at least one approval, review from Code Owners, and stale approvals dismissed when new commits are pushed. Claude Code Review follows the severity, exclusion, and nit-cap rules in `REVIEW.md` only on a default branch protected this way ([customize Code Review](https://code.claude.com/docs/en/code-review-customize)).

  Rulesets in a private repository need GitHub Pro, Team, or Enterprise (**paid:** in a private repository; **free alternative:** make the repository public). Without a ruleset, a person can merge a pull request with no review, and the agent says so on each pull request.

- **Secrets and variables → Actions → Variables:** in a private repository, set `CODE_SCANNING` to `true` to run CodeQL, Scorecard, and Dependency Review, which need GitHub Code Security there (**paid:** in a private repository; **free alternative:** public repositories run them without it). Set `CONTAINER_IMAGE` to `false` to skip the job that builds and scans the container image, for a project that ships no image.
<!-- deploy:railway -->
- **Secrets and variables → Actions → Variables:** set `DEPLOY_ENABLED` to `true` when each push to `main` that passes CI should deploy to `dev`; the README's deploy section sets up the environments.
<!-- deploy:end -->
- Create the `needs triage` label, which the issue forms apply: `gh label create "needs triage"`.

**Check:** a test pull request shows the two required checks and asks for a code owner's review.

## 4. Claude

**Who:** an Owner of the Claude organization, with an owner of the GitHub organization.

- **Code Review:** in [**Admin settings → Claude Code**](https://claude.ai/admin-settings/claude-code#code-review), turn on **Allow code review**, install the Claude GitHub App, and add this repository ([set up Code Review](https://code.claude.com/docs/en/code-review-setup)). It needs a Team or Enterprise plan ([availability](https://code.claude.com/docs/en/code-review#availability)) (**paid:** a Claude Team or Enterprise plan; **free alternative:** the review playbook of `/sdlc-mode` reviews each pull request from the agent session). Keep **Review runs** at **After every push**, the default, so every push to a pull request gets a review. Reviews run on Anthropic's infrastructure, so the repository has no review workflow. Anyone with write access can also comment `@claude review` on a pull request to start a review ([comment commands](https://code.claude.com/docs/en/code-review-pull-requests#comment-commands)).
- **Managed settings:** deploy the non-negotiable settings and hooks as [managed settings](https://code.claude.com/docs/en/settings), tailored from the example in `.claude/managed-settings.example.json`. Engineers cannot override them.
- **Advisor (optional):** on the Anthropic API or Claude Platform on AWS, `/advisor opus` lets a Sonnet session ask Opus at a plan, a recurring error, and before it reports work done ([advisor tool](https://code.claude.com/docs/en/advisor)). It is experimental. The harness asks for the same advice through an `advise` subagent in every agent tool, with the models `/setup-sdlc` sets.
- **Monitoring:** turn on the [OpenTelemetry export](https://code.claude.com/docs/en/monitoring-usage). It needs an OpenTelemetry collector or backend that the organization runs, and its endpoint. Set `CLAUDE_CODE_ENABLE_TELEMETRY`, the exporters, and `OTEL_EXPORTER_OTLP_ENDPOINT` in managed settings, or each engineer sets them in a shell or in `~/.claude/settings.json`: Claude Code ignores these variables in the repository's `.claude/settings.json`, so the project cannot turn the export on.

**Check:** the test pull request gets a **Claude Code Review** check run within a few minutes.

## 5. Cursor

**Who:** a Cursor team admin.

- **Sandbox:** set the team's sandbox policy ([Cursor sandbox](https://cursor.com/docs/reference/sandbox)), which repository and user settings cannot weaken.

**Check:** the team's settings in Cursor show the sandbox policy.

## 6. Team decisions

**Who:** the people named in each item.

- **Sources of truth (engineering lead):** for each artifact, name one system as the source of truth: this repository, an existing tool such as Jira, or, as the minimum, a link both ways (the record id in the file and the commit SHA in the record).
- **Higher risk (engineering lead):** decide which changes count as higher risk. A tech lead or architect approves their specs and plans.
- **Policies (each policy owner, with an engineer):** the harness ships a default for each area, `.claude/skills/<area>-policy/SKILL.md` (security: OWASP ASVS 5.0.0 Level 1; UX: WCAG 2.2 Level AA; compliance: the OECD privacy principles; brand: one declared source for every brand value). Review it. To replace a default, add the organization's own rules in `.agents/skills/<area>-policy/SKILL.md` in the project: the playbooks read that file in place of the default, and the `CODEOWNERS` line of step 2 for that area makes the policy owner its code owner. Do not edit the default. Test it: ask for a spec that touches the area, and confirm that the reply names `.agents/skills/<area>-policy/SKILL.md` among the policies it read.
- **Production gate (engineering leadership, with change management and compliance):** name the release managers and add them as required reviewers on the `prod` environment, as the README's deploy section describes. `.agents/hooks/agent-production-gate.sh` blocks an agent's shell commands that dispatch a `prod`
  <!-- deploy:railway -->
  deploy, run a Railway command with `prod` as its environment,
  <!-- deploy:end -->
  <!-- deploy:none -->
  deploy
  <!-- deploy:end -->
  or push a release tag. It does not read MCP tools. A release manager whose own agent session must do one of these starts the agent with `RELEASE_APPROVAL` set to the approval record, for example `RELEASE_APPROVAL=CHG-123 claude`. The value lifts the gate only when it matches the extended regular expression on the first line of `.agents/release-approval-form`, shipped as `^[A-Z]+-[0-9]+$`; set that line to the form of your organization's approval records. Each gate hook appends its decisions to `.agents/logs/gate-decisions.jsonl`, which git ignores: the time, the hook, the decision, the session, and the reason for a block, and, when the production gate is lifted, the approval value and the Git user name. A record holds no command text and no path.
- **Review (tech lead):** `.agents/review.md` names this stack's generated files to skip; add a path when the project gains a generated file, then run `pnpm rules:sync`, which renders it to `REVIEW.md` for Claude Code Review. Once a month, rate the review findings and tune `.agents/review.md`.
- **People without Git experience:** connect GitHub to Claude (claude.ai or Cowork), so Claude commits `intent.md` for them.

## 7. Later, as the guardrails mature

- Send the intent's path with `/sdlc-mode` by hand first. Then turn on `Spec on intent merge` (step 8).
- Make auto mode the default for routine work: a tight `spec.md`, a small blast radius, and code the tests already cover.
- Set the metric in `bands.yaml`, then turn on `Control band` (step 8).

## 8. Claude in CI

**Who:** a repository admin.

Each workflow below stays off until the repository variable `CLAUDE_CI_ENABLED` is `true`; until then nothing runs, on a schedule or otherwise, and nothing calls a model. When it is on, each needs one secret: `CLAUDE_CODE_OAUTH_TOKEN`, a Claude subscription token from `claude setup-token`, or `ANTHROPIC_API_KEY`, an API key. Either works; with neither set the job fails and says so. The jobs run the small model with a turn cap. Jobs that write install the Claude GitHub App from step 4 on the repository, and every change they make arrives as a pull request.

- **`Spec on intent merge`:** when an `intent.md` reaches `main` with `Status: draft.` or `Status: accepted.` and no `spec.md` beside it, which is how the product owner accepts it, runs `/sdlc-mode intent/<change>/intent.md`, so that `spec.md` arrives as a pull request for the product owner.
- **`Claude fix loop`:** when a person with write access comments `@claude` on a line of a pull request from this repository, Claude addresses the comment and pushes to that branch. It cannot approve or merge.
- **`triage` job of `Verify`:** when a pull request from this repository fails a check, reads the failed logs with the `Read` tool only and posts a three-line summary.
- **`Control band`:** every day, runs the command in the repository variable `CONTROL_BAND_METRIC_COMMAND`, which writes `metric-values.json` as `{"baseline": [...], "recent": [...]}`, then `pnpm bands:check metric-values.json`. A tier whose action is `diagnose` or `propose` runs `/sdlc-mode` with the finding, and the `pull_request` route opens an intent pull request. It never acts on production.

On a machine, `pnpm loop:measure` reports the loop's measures. It is not part of `pnpm verify`.

**Check:** with `CLAUDE_CI_ENABLED` unset, **Actions** shows these jobs as skipped.

## References

- [Set up Claude Code for your organization](https://code.claude.com/docs/en/admin-setup)
- [Settings reference and precedence](https://code.claude.com/docs/en/settings)
- [Server-managed settings](https://code.claude.com/docs/en/server-managed-settings)
- [Permissions](https://code.claude.com/docs/en/permissions)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing)
- [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Skills](https://code.claude.com/docs/en/skills)
- [Plugins and private marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Managed MCP](https://code.claude.com/docs/en/managed-mcp)
- [Enterprise deployment overview](https://code.claude.com/docs/en/third-party-integrations)
- [Enterprise network configuration](https://code.claude.com/docs/en/network-config)
- [Monitoring with OpenTelemetry](https://code.claude.com/docs/en/monitoring-usage)
- [Analytics dashboard](https://code.claude.com/docs/en/analytics)
- [Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api)
- [Security model](https://code.claude.com/docs/en/security)
