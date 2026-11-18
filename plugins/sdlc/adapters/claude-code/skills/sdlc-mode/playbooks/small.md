# Small change: one pull request through the review gate

This playbook takes a small, well-bounded change, a small defect included, to a pull request. It writes no intent, no spec, and no plan. The code owner's review of the pull request is its **Gate**.

1. Decide that the request qualifies. It qualifies only when every condition below holds. When one fails, say which one in two lines. Then follow `playbooks/fix.md` for a defect, which always starts with a failing test, or `playbooks/intent.md` otherwise.
   - A person asks for it.
   - It is not a complaint that no written target backs, such as a slow page with no stated limit.
   - It changes at most five files, none of them under `intent/`.
   - It adds no dependency, and it changes no schema and no public interface.
   - No decision it needs is left to a person.
2. Create a branch named `small/<type>-<short-description>` from the latest `origin/main`. A defect takes `small/fix-<short-description>`. The plan check lets a `small/` branch through with no plan while it changes at most five files, and refuses a `small/fix-` branch that edits a test the default branch holds.
3. Read each of the four policies whose description covers what the change touches, found as `playbooks/design.md` step 2 says. A change that touches none of them reads none. Read the code the change touches. Make the change so that it meets them.
   - **A defect.** Reproduce it by running the code, and keep the output. Commit only a test that fails for the defect, and check that it fails for that reason. Then fix the code in a later commit that edits no test. Once the test is committed, the test-edit hook blocks a change to a test on this branch.
4. Verify the work as `playbooks/build.md` step 9 says: run no check that the `pre-commit` or `pre-push` hook runs, and quote the hooks' output. Then run the `verifier` subagent once, as `playbooks/build.md` step 9 says, and fix what it reports. For UI work, also do the visual check of that step.
5. Open the pull request as `playbooks/open-pr.md` says. Its description says why the change is small, by the conditions of step 1.
6. **Gate: a code owner approves the pull request, and a person merges it.** You never approve it and never merge it.

**Hands off to:** `playbooks/review.md`. An agent runs it in the same turn, as soon as the pull request is open.
