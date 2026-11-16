# Open the pull request

Branch from the latest `origin/main`, and open the pull request ready for review, never as a draft. Name the branch as the project's contributing guide says. Never merge a pull request. A person merges it with `--squash`, bottom-up for a stack of pull requests.

1. Clean the diff against the default branch. Remove debug output, commented-out code, changes the plan does not name, and comments that add nothing the code does not show.
2. Do what the project's `AGENTS.md` and `CONTRIBUTING.md` require for this kind of change.
3. When step 1 or 2 changed a file, run the checks of the files it changed again, and commit only when they pass.
4. Check that the change's `plan.md` names each file of the diff, or change `plan.md` in the same commit. The push hook refuses a push whose commits change a file the plan does not name without changing `plan.md` in the same commit.
5. Push the branch and open the pull request. When the branch already has one, update it. Fill the body from `.github/pull_request_template.md` with these three things.
   - Say what changed and why, with the paths of `intent/<change>/spec.md` and `plan.md` when they exist.
   - Write `Closes #<issue>` for each issue that already exists and that the change closes. Otherwise write what the template's own section asks for.
   - Give each check you ran, with its result copied from the output, and the output of the `pre-push` hook from the push.

   **A file the token cannot push.** The host can refuse a file because the token lacks a permission, such as GitHub's `workflow` scope for `.github/workflows/`. Say what you cannot push and why. When the request already names the way out, take it. Otherwise ask the person which way out they want. They can push the branch with their own credentials. They can give the token that permission. Or you open the pull request without the file and hand the file over in an issue with its checksum. Do what they choose. A pull request that waits for such a file says so on its first line and on the **Not yet** line.

   **No pull request from this session.** Say so, give the pushed branch's name, and go on to step 6.

   **What the host requires before a merge.** Read it, and say which of the three cases holds. On GitHub, `GET /repos/{owner}/{repo}/rules/branches/{base}` answers.
   - **Review required.** A `pull_request` rule has `require_code_owner_review` true or `required_approving_review_count` of 1 or more. Name the review.
   - **No review required.** There is no such rule. A person can merge once the required checks pass.
   - **Rules unavailable.** The answer is a `403` that says "Upgrade to GitHub Pro or make this repository public". Nothing on this plan can require a review.

   When no workflow run started on the pull request's head, the **Not yet** line says that no CI ran and why.

6. Go on in the same turn, without asking. Follow `playbooks/review.md`, whose step 1 says which pull request gets no agent review.

**Hands off to:** `playbooks/review.md`. An agent runs it in the same turn, as soon as step 5 is done.
