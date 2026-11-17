# Intent phase: write `intent.md`

This playbook writes the intent. The build plan, `intent/<change>/plan.md`, comes later and is not written here.

1. Let the originator describe the problem in their own words. They say what they cannot do today, who is affected, what success looks like, and what is out of scope.
2. Read the code, the docs, and the existing `intent/` folders. Find the rest yourself. The author is the originator's handle on the host. Read it from the host when the session shows whose account it runs as, and ask for it otherwise. Never take it from `git config user.name`, which names the machine's user. The team on the author line comes from the latest intent in the repository by the same author. When the repository holds none, the team is an open question.
3. Make the idea concrete. The intent needs five things: the problem, who is affected, the outcome and what success looks like as the user would see it, the constraints, and what is out of scope.
   - **When the request and the repository already give them, go to step 4 in the same turn and ask nothing.** A request that states its outcome, such as a move, a rename, or a migration with the result it must reach, is concrete. Write what the originator said as theirs and what you filled in as your proposal, and the originator corrects the draft at step 5.
   - **Ask only for what is missing and what no file can tell you,** as `../SKILL.md` step 6 says. Ask what the problem is, why it matters, and what is out of scope as open questions, in plain chat text with no answer offered, and only when the request does not say them.
   - **Ask a choice between ways in a round.** Each round holds every question that needs no open answer, with the answer you recommend first, asked as `../SKILL.md` step 6 says for a choice between ways. A recommended answer is a fact or a choice, such as "Only the checkout page", never an instruction to the person. When you have no answer to recommend, say so and ask plainly.
   - **A "yes" to a recommended answer is the originator's decision for a choice.** It is not their word for the problem or for what is out of scope.
4. Write `intent/<change>/intent.md` from the template below. Use exactly the template's five headings.
   - `<change>` is a short kebab-case name. A later round of the same change may revise the `intent.md` that is there.
   - What is out of scope goes under **Proposed outcome**.
   - Mark each line you filled in yourself as your proposal. Only what the originator said goes in as theirs. Ask no question that the request or the repository answers.
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
