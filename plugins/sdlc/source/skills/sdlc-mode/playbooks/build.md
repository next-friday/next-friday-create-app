# Build phase: plan, then implement

This playbook turns a merged spec into a plan the engineer accepts, and then into working code. You own the work. Plan it, do it, and verify it yourself.

1. Find the change. It is the `intent/<change>/` folder whose `spec.md` or `plan.md` the request names. Its `spec.md` must be on the default branch beside its `intent.md`. In each case below, say only that, in two or three lines, and stop. Write no file.
   - **No change is named, or the folder has no `spec.md` on any branch.** List each `intent/*/` on the default branch that has a `spec.md` and no `plan.md`, or say that there is none.
   - **The spec exists only on another branch.** Say that the spec is not merged yet, and name that branch.
   - **`plan.md` is on the default branch and `spec.md` says `Status: done.`** Say that the change is built, and name both files.

   A bug fix with no spec follows `playbooks/fix.md` instead.

2. When `intent/<change>/plan.md` is on a branch with an `Accepted by:` line naming a handle, the engineer accepted it. Check out that branch and go to step 8. When the request accepts a `plan.md` that already exists, that is the acceptance of step 5, so go to step 6.
3. Read `intent.md`, `spec.md`, the four policies, found as `playbooks/design.md` step 2 says, and the code the change touches. Use the agent tool's plan mode when it has one. Then interview the engineer until they have said four things. The four are the files the change touches, the order of the work, the tests that prove it, and each option they rule out.
   - **When the engineer has already said all four in this conversation, go to step 4 in the same turn.** What the spec or the code suggests does not count. The engineer says it, or you ask.
   - **When one is missing, ask one question and stop,** as `../SKILL.md` step 6 says, with the answer you recommend first. Write no plan until all four are said. Settle the files before you ask about the order and the tests.
4. Write the plan from the template below, with exactly its headings. An engineer who has never seen this conversation must be able to implement the change from the plan alone.
   - **Files that change.** List every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work.** Write numbered steps. Each step ends with the check that proves it.
   - **Risks.** Say what the change could break and which step is the riskiest. Name each option you chose not to take, and why.
   - **Proof.** Give the tests and commands that show every requirement of the spec is met, by requirement number. Give the test or review step for each policy requirement the spec cites.

   Only when two designs compete and the files do not settle which one, start a subagent on the `advise` model, as `../SKILL.md` step 4 says. Give it the plan and `spec.md`, and say in the reply what it advised.

   Show the whole plan and name the file only as `intent/<change>/plan.md`. In plan mode you cannot write the file, so show the plan as the plan.

5. **Gate: the engineer accepts the plan.** Stop after showing it. The engineer accepts it in this conversation, in words such as "accepted" or "go", or corrects it. After a correction, revise and show the whole plan again. When the spec classes the change as higher risk, say that a tech lead or an architect accepts it. Write no file before the acceptance. In plan mode, the engineer's approval of the plan is the acceptance.
6. Create a branch as `playbooks/open-pr.md` says. In its first commit, write `intent/<change>/plan.md` with the `Accepted by:` line set to the handle of the engineer who accepted it. Take the handle as the engineer gives it, or as the host shows whose account the session runs as. Ask for it only when neither holds. Every area of concern of the spec must have a `Decision:` line on the default branch before the build starts. When one has none, say so in two or three lines and stop, because the product owner decides it in a pull request to the spec. Never propose or write a decision during the build.
7. The plan and the code go in one pull request. When the project has a `.changeset/` folder, write one changeset for the whole change. Otherwise write none. Keep every step of the plan on this branch, and open no second pull request for the same change.
8. Implement the plan in its order. After each step, run the check that proves it and fix what fails.
   - When the same check fails a second time after a fix, start a subagent on the `advise` model with the failure, the change, and the log. Act on its advice or say why not.
   - For a bug fix, follow `playbooks/fix.md` steps 8 and 9.
   - When the work departs from the plan, change `plan.md` in the same commit.
   - Before the branch is first pushed, set `Status: done.` in `intent.md` and `spec.md`. `pnpm plan:check` fails the push without it.
   - When a requirement of `spec.md` stays unmet, name it in the pull request description.
9. Verify the work yourself. Run every check the project's agent instructions name and keep the output. Every check must pass. Fix the code, and never skip, delete, or weaken a test.
   - Then run the `verifier` subagent once, on the `explore` model, as `../SKILL.md` step 4 says, and fix what it reports. When you cannot start a subagent, do what `../../../agents/verifier.md`, relative to this playbook, says yourself.
   - For UI work, when the session has a browser tool, also compare a screenshot of the page with the mock the spec or the request names. Adjust until it matches.
   - When a check cannot run in this session, say which one and why, and never report it as passed.
   - Before you push, run each check CI runs on the changed files that this session can run. Say which ones it cannot run.
10. Go on in the same turn, without asking. Follow `playbooks/open-pr.md`, and then `playbooks/review.md`. Pushing the branch and opening the pull request are part of this task.

**Hands off to:** `playbooks/open-pr.md`. An agent runs it in the same turn, as soon as step 9 passes.

## Template

```markdown
# Plan: <title>

Accepted by: @<engineer>.

## Files that change

## Order of work

## Risks

## Proof
```
