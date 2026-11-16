# Open the pull request

Branch from the latest `origin/main`, and open the pull request ready for review, never as a draft. Name the branch as the project's contributing guide says. Never merge a pull request: a person merges it with `--squash`, bottom-up for a stack of pull requests.

1. Clean the diff against the default branch. Remove debug output, commented-out code, changes the plan does not name, and comments that add nothing the code does not show.
2. Do what the project's `AGENTS.md` and `CONTRIBUTING.md` require for this kind of change.
3. When step 1 or 2 changed a file, run the checks the project's agent instructions name again, and commit only when they pass.
4. The push hook refuses a push whose commits change a file the change's `plan.md` does not name without changing `plan.md` in the same commit.
5. Push the branch and open the pull request. When the branch already has one, update it. Fill the body from `.github/pull_request_template.md`:
   - what changed and why, with the paths of `intent/<change>/spec.md` and `plan.md` when they exist;
   - `Closes #<issue>` for each issue that already exists and that the change closes; otherwise what the template's own section asks for;
   - each check you ran, with its result copied from the output.

   When the host refuses a file because the token lacks a permission, such as GitHub's `workflow` scope for `.github/workflows/`, say what you cannot push and why, and ask the person which way out they want: they push the branch with their own credentials, they give the token that permission, or you open the pull request without the file and hand the file over in an issue with its checksum. Do what they choose. A pull request that waits for such a file says so on its first line and on the **Not yet** line.

   When you cannot open a pull request from this session, say so, give the pushed branch's name, and go on to step 6.

   Then read what the host requires before a merge, and say which of the three holds. On GitHub, `GET /repos/{owner}/{repo}/rules/branches/{base}` answers:
   - **Review required:** a `pull_request` rule with `require_code_owner_review` true or `required_approving_review_count` of 1 or more. Name the review.
   - **No review required:** no such rule. A person can merge once the required checks pass.
   - **Rules unavailable:** a `403` that says "Upgrade to GitHub Pro or make this repository public". Nothing on this plan can require a review.

   When no workflow run started on the pull request's head, the **Not yet** line says that no CI ran and why.

6. Go on in the same turn, without asking. Follow `playbooks/review.md`.

**Hands off to:** `playbooks/review.md`; an agent; in the same turn, as soon as step 5 is done.
