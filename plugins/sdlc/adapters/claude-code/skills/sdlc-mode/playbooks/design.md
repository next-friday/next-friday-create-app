# Design phase: write `spec.md`

This playbook turns a merged intent into the requirements and design spec.

1. Find the intent. It is the `intent/<change>/intent.md` the request names. It must be on the default branch. When the folder already holds a `spec.md`, revise that file from the intent in step 3, and do not start a new one. In each case below, say only that, in two or three lines, and stop. The reply is those lines and the **Now** line. It holds no step line and no **Checks**. Write no file and add no review of the intent.
   - **No intent is named, or the file does not exist on any branch.** List each `intent/*/intent.md` on the default branch that has no `spec.md`, or say that there is none.
   - **The file exists only on another branch.** Say that the intent is not merged yet, and name that branch.
2. Read the four policies, every time, before you write. The four are `brand`, `security`, `compliance`, and `ux`. For each, read the project's `.agents/skills/<area>-policy/SKILL.md` when it exists. Otherwise read the default at `../../<area>-policy/SKILL.md`, relative to this playbook. The default is a sibling of the `sdlc-mode` folder: when this playbook is at `<skills>/sdlc-mode/playbooks/design.md`, the security default is at `<skills>/security-policy/SKILL.md`. Open each of the four files with your file-reading tool, and name in the reply the four paths you opened. Then read the code and the docs the change touches.
3. Write `intent/<change>/spec.md` from the template below. Use exactly the template's headings.
   - **Request.** Under the status line, quote the words of the request that started this spec, in the language of the project's files. When the person wrote in another language, mark the quote as translated, as in `translated from Thai`. End the line with `Skills at <hash>.`, the short hash of the last commit that changed the skills in this repository. The command is `git log -1 --format=%h -- <folder> .agents/skills`. `<folder>` is the folder that holds every skill, `../..` from this playbook's folder, and `.agents/skills` holds the project's own policies. When that folder is not in this repository, write `Skills at unknown.`
   - **Requirements.** Number them. Each one states a result a test or a reader can check.
   - **Design.** Say how the change fits the existing code. Name the files that change, and what each one does afterwards.
   - **Policies.** Write one line for each of the four policies. State which rules of that policy the change must meet, each as a requirement number, or write "Does not apply" and why.
   - **Areas of concern.** An area of concern is a policy rule the change cannot meet, two policies that contradict, or a decision the files do not settle. Give each one a number and the policy it comes from. Under each, on a line of its own, write `Decision: <the decision you propose>.` Write "None" only when there are none.
   - **Open questions.** Answer each open question from `intent.md` with its evidence, or carry it forward. Write "None" only when the intent has none.
4. Commit `spec.md` on a new branch. Push the branch and open a pull request ready for review, as the opening paragraph of `playbooks/open-pr.md` says for branches and pull requests. When you cannot open a pull request from this session, say so and give the pushed branch's name.
5. **Gate: the product owner reviews the spec.** The product owner decides each area of concern with its policy owner. They give you each corrected `Decision:` in the chat or on the pull request, and you write it and push. The spec says `Status: accepted.` from its first commit, so their merge is what accepts it and those decisions. To reject it, they ask you to write the reason on a line of its own and to set the status line to end with `Status: rejected.`, and they merge that. For a change the spec classes as higher risk, the product owner consults a tech lead first. You never decide, merge, or reject for them. Report the pull request's URL and stop, as `playbooks/review.md` step 5 says.

**Hands off to:** `playbooks/build.md`. An engineer with an agent runs it when the product owner has merged the spec's pull request and the engineer sends `/sdlc-mode build` with the spec's path.

## Template

```markdown
# Spec: <title>

From `intent/<change>/intent.md`. Status: accepted.

Request: "<the words of the request that started this spec>".

## Requirements

## Design

## Policies

## Areas of concern

## Open questions
```
