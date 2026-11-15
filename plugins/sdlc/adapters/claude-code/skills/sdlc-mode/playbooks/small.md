# Small change: one pull request through the review gate

This playbook takes a small, well-bounded change to a pull request. It writes no intent, no spec, and no plan: the code owner's review of the pull request is its gate.

1. Decide that the request qualifies. It qualifies only when a person asks for it, it changes at most five files, none of them under `intent/`, it adds no dependency, it changes no schema and no public interface, and no decision it needs is left to a person. When a condition fails, say which one in two lines and follow `playbooks/fix.md` for a defect, or `playbooks/plan.md` otherwise.
2. Create a branch named `small/<type>-<short-description>` from the latest `origin/main`. The plan check lets a `small/` branch through with no plan while it changes at most five files.
3. Make the change. For a defect, first add a test that fails for the reason the request gives, then make it pass without editing the test.
4. Run every check the project's agent instructions name and keep the output.
5. Open the pull request as `playbooks/open-pr.md` says. Its description says why the change is small, by the conditions of step 1.
6. **Gate: a code owner approves the pull request, and a person merges it.** You never approve it and never merge it.

**Hands off to:** `playbooks/review.md`; an agent; in the same turn, as soon as the pull request is open.
