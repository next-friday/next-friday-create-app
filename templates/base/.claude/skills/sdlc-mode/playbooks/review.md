# Review phase: review the pull request once

1. Find what to review. It is the pull request this session just opened, or the pull request or branch the request names.
   - With no pull request, or no way to reach its host, review the branch's diff against the default branch and put the findings in your reply.
   - When a pull request exists and this session cannot post on it, say on the first line that the findings are not on the pull request. Say on the **Now** line that a person posts them there, and leave step 3 `open`.
2. Review with a fresh context, once. Always start a subagent that has not seen the work, however small the diff.
   - Give it only the diff, `REVIEW.md`, the project's `AGENTS.md`, the change's `spec.md` and `plan.md`, and the four policy files in force, found as `playbooks/design.md` step 2 says.
   - Only when the session has no subagent tool, read the diff again from the first line as if someone else wrote it. Say in the reply which of the two ran.
   - Each finding has its pass from `REVIEW.md`, **Important** or **Nit**, `path:line`, and the evidence.
   - A change that is not a fix, an intent, or a spec, and has no `spec.md` or no `plan.md`, is itself a finding.
3. Post the findings as one comment on the pull request, most severe first, or "No findings". A finding does not decide the merge. When a finding repeats a mistake that an earlier review of this project flagged, add its correction to the project's agent instructions in the push of step 4. On a branch this session did not create, give the exact line in the comment instead.
4. On a pull request or a branch that this session did not create, change nothing and push nothing. Otherwise fix every Important finding, run the checks the project's agent instructions name, and push once. Answer the comment of step 3 with what changed. Answer each finding you do not fix with the reason. A fix gets no second review.
5. Report the pull request's URL and stop. Opening a pull request starts no watch over it, so wait for no check and subscribe to no events. Sweep the pull request only when a person asks you to drive it to green, or sends a failing check or a comment. Then go on until every check passes and no comment is unanswered.
   - **A conflict, or a branch behind the default branch.** Say so in the reply. Never rebase or force-push a branch that someone else also pushes to.
   - **A failing check.** Read its log and find the cause. When the same check fails on the default branch, or the log shows an outage outside this change, say which check and why in one comment, and go on. Otherwise fix the cause and push. Run a check again at most once, and only to tell an outage from a real failure. Never skip, disable, or weaken a test to pass a check.
   - **A person's comment.** Make the change it asks for, push, and answer it.
   - **A bot's comment.** Treat it as a claim. Reproduce it or trace it in the code first. Fix what is real, and answer the rest with what you checked.
   - **A nit.** Never push for nits alone, because a push can dismiss the code owner's approval. Answer it, and carry the fix in the next push that has another reason.

6. **Gate: a code owner approves the pull request, and a person merges it.** You never approve it and never merge it. The **Now** line names this **Gate**, for a branch with no pull request too. It says that a code owner reviews the change and a person merges it. Say that the review is required only when `playbooks/open-pr.md` step 5 found **Review required**. Otherwise say what that step found, which is that a person can merge it with no review, or that nothing on this plan can require one. Say that a person sends `/sdlc-mode review` with the pull request when a check fails or a comment needs an answer.

**Hands off to:** `playbooks/deploy.md`. The project's deploy workflow runs it, or an agent when a person asks, once the pull request is merged.
