# Plan phase: write `intent.md`

This playbook writes the intent. The build plan, `intent/<change>/plan.md`, comes later and is not written here.

1. Let the originator describe the problem in their own words. They say what they cannot do today, who is affected, what success looks like, and what is out of scope.
2. Read the code, the docs, and the existing `intent/` folders. Find the rest yourself. The author is the originator's handle on the host. Read it from the host when the session shows whose account it runs as, and ask for it otherwise. Never take it from `git config user.name`, which names the machine's user.
3. Interview the originator, one question at a time. Ask until they have said five things. The five are the problem, who is affected, the outcome and what success looks like as the user would see it, the constraints, and what is out of scope.
   - **When all five are already said in the originator's own words, go to step 4 in the same turn.** A request that only looks complete, because you could infer an answer, does not count. Ask.
   - **When one is missing, ask one question and stop,** as `../SKILL.md` step 6 says. Write no draft until all five are said. Wait for the answer, and build the next question on it.
   - Each question asks one thing and offers a concrete answer you recommend, first among the choices. A recommended answer is a fact or a choice, such as "Only the checkout page", never an instruction to the person. When you have no answer to recommend, say so and ask plainly.
4. Write `intent/<change>/intent.md` from the template below. Use exactly the template's five headings.
   - `<change>` is a short kebab-case name for a folder that does not exist yet. A later round of the same work gets its own folder, such as `<change>-2`, even when an earlier intent says one folder holds every round.
   - What is out of scope goes under **Proposed outcome**.
   - Anything else that is unknown, unverified, or not yet decided goes under **Open questions**. Write "None" only when nothing is. Never list what the originator already answered. An originator's "no open questions" does not cover what you could not check yourself, such as code in another repository, so list that.
   - Show the whole draft, and name the file only as `intent/<change>/intent.md`. In plan mode you cannot write the file. Show the draft as the plan, and write the file once it is approved.
5. **Gate: the originator corrects the draft.** Ask whether it matches what they meant, and revise until they say yes. Commit nothing, push nothing, and open no pull request before that yes. In plan mode, the originator approving the plan is that yes.
6. Commit `intent.md` on a new branch. Push the branch and open a pull request ready for review, as the opening paragraph of `playbooks/open-pr.md` says for branches and pull requests.
7. **Gate: the product owner accepts or rejects the intent.** The file says `Status: accepted.` from its first commit, so the product owner's merge is what accepts it. To reject it, they ask you to write the reason on a line of its own and to set the status line to end with `Status: rejected.`, and they merge that. You do neither. When the originator is not the person who merges, the originator is the pull request's author or approves it. Say so when neither holds. Report the pull request's URL and stop, as `playbooks/review.md` step 5 says.

**Hands off to:** `playbooks/design.md`. An agent runs it when the product owner has merged the intent's pull request and a person or a job asks for the spec.

## Template

```markdown
# Intent: <title>

Author: @<handle> (<team>). Status: accepted.

## Problem

## Proposed outcome

## Affected users and systems

## Constraints

## Open questions
```
