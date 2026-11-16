# Fix phase: repair a defect with a plan and a failing test

This playbook takes a defect in behaviour that already exists to a pull request. It has no intent and no spec. Its plan is the only file it adds under `intent/`.

1. Decide that the request qualifies. It qualifies when the request is a defect in behaviour that already exists.
   - A defect breaks what a spec, a test, or a documented target says, or it crashes or returns a wrong result.
   - Every such defect takes this playbook, even when the fix needs a new dependency, a schema change, or a public-interface change. The plan then names that under **Risks**.
   - A request that adds new behaviour is not a defect. Neither is a complaint that no written target backs, such as a slow page with no stated limit. Say so in two lines and follow `playbooks/intent.md` instead.
   - When `intent/<short-description>/plan.md` for this defect is on a branch with an `Accepted by:` line naming a handle, the engineer accepted it. Check out that branch and go to step 8.
2. Reproduce the defect yourself by running the code, and keep the output. Ask the person only when you can name the specific reason you cannot reach it, such as a credential or a service this session cannot use. Ask as `../SKILL.md` step 6 says.
3. Read the four policies, found as `playbooks/design.md` step 2 says. Read `lessons/` for an earlier incident of the same class. Then find the cause from what running the code shows. List the candidate causes and rule each out with a command or an observation. Show that list in the reply, with what ruled each candidate out. Never guess. Name the one cause the evidence leaves. When it leaves none, or more than one, say so and ask for what is missing, as `../SKILL.md` step 6 says.
4. Write the plan from the template in `playbooks/build.md`. The title is `# Plan: <title> (fix)`. Use exactly the template's four headings, and keep the plan short. Name the file `intent/<short-description>/plan.md`. The folder holds only this file.
   - **Files that change.** List every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work.** Give the cause and the evidence for it, then numbered steps. Each step ends with the check that proves it.
   - **Risks.** Say what the fix could break. Name any new dependency, schema change, or public-interface change it needs. Name each option you chose not to take, and why.
   - **Proof.** Give the test that fails today and passes once the cause is fixed, and the command that runs it.

   Show the whole plan, with the line `File: intent/<short-description>/plan.md` above it, where `<short-description>` is the name you chose. In plan mode you cannot write the file, so show the plan as the plan.

5. **Gate: the engineer accepts the plan.** Stop after showing it, as `playbooks/build.md` step 5 says. Write no file before the acceptance.
6. Create the branch `fix/<short-description>` as `playbooks/open-pr.md` says. `pnpm plan:check` accepts a plan with no intent and no spec only with the "(fix)" title on a `fix/` branch. In its first commit, write `intent/<short-description>/plan.md` with the `Accepted by:` line set to the handle of the engineer who accepted it, as `playbooks/build.md` step 6 says.
7. The plan, the failing test, and the fix go in one pull request, as `playbooks/build.md` step 7 says.
8. Reproduce the defect as a test. Run it and check that it fails for the reason the cause gives. Commit the failing test before any fix.
9. Make the test pass without editing it, or any other test the default branch holds. `pnpm plan:check` refuses a fix that edits one, unless a code owner who accepts the change writes `Test change accepted by: @<handle>.` in the plan. When the test fails a second time after a fix, start a subagent on the `advise` model as `playbooks/build.md` step 8 says.
10. Run every check the project's agent instructions name. Keep the output. When one fails, fix the code, as `playbooks/build.md` step 9 says. Then run the `verifier` subagent once, as `playbooks/build.md` step 9 says, and fix what it reports. For UI work, also do the visual check of that step. When a check cannot run in this session, say which one and why, and never report it as passed.
11. Go on in the same turn, without asking. Follow `playbooks/open-pr.md`, and then `playbooks/review.md`.

**Hands off to:** `playbooks/open-pr.md`. An agent runs it in the same turn, as soon as step 10 passes.
