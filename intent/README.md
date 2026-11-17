# Intent

This folder is the intent home. Every change starts here as an `intent.md`. Git history keeps the author, the time, and every revision of each file.

- Each change has its own folder, `intent/<change>/`, where `<change>` is a short kebab-case name. The folder holds `intent.md` (Plan), then `spec.md` (Design), then `plan.md` (Build).
- **Plan.** An idea, a ticket, or an incident becomes `intent.md`, written by sending the idea with `/sdlc-mode`, which interviews the originator. The originator corrects the draft before it is committed, and the product owner reviews it in its pull request. Merging its pull request accepts it. Merging it with `Status: rejected.` and a one-line reason rejects it, so the decision stays in the history; no pull request is closed by hand. No person edits the status line: the file says `Status: accepted.` from its first commit, so the line is true the moment the pull request merges.
- **Design.** Sending the intent's path with `/sdlc-mode` turns the accepted `intent.md` into `spec.md`, committed alongside it. The product owner reviews the spec against the idea, decides each area of concern with its policy owner, and gives the agent each corrected `Decision:` line to write. The spec says `Status: accepted.` from its first commit, and merging its pull request accepts it and starts the build.
- **Build.** The engineer sends `/sdlc-mode build` with the spec's path, and starts in plan mode with `intent.md` and `spec.md`. The engineer accepts the plan in the session; `plan.md` and the code go in one pull request, with one changeset for the whole change. When implementation departs from the plan, `plan.md` changes in the same commit.
- **Done.** A change is `done` when the tree meets every numbered requirement of its `spec.md`. The agent sets `Status: done.` in `intent.md` and `spec.md` in the pull request that meets the last requirement, and the code owner's approval of that pull request accepts it.

## Reading the records

A record is history. The code in the tree and `AGENTS.md` say what is true now. The `Status:` line of `intent.md` and `spec.md` holds one of five words:

- `accepted`: merged, and the work is still open.
- `done`: the tree met every numbered requirement of the spec when the build merged.
- `rejected`: the product owner decided against it.
- `withdrawn`: given up after it merged.
- `replaced`: a later change replaced what it describes.

List the changes that are still open with `grep -rLE "Status: (done|rejected|withdrawn|replaced)\." --include=intent.md intent`.

## Which file holds what

The bullets above say who writes and who decides each file. What each file answers:

| File        | Answers                                                                                                    |
| :---------- | :--------------------------------------------------------------------------------------------------------- |
| `intent.md` | The problem, the outcome wanted, the users and systems it affects, its constraints, and its open questions |
| `spec.md`   | What to build and how it is designed: requirements, design, and areas of concern                           |
| `plan.md`   | How to make the change: the files that change, the order of the work, and the tests that prove it          |

## Where a technology choice goes

- **A choice already made**, such as a required framework or service, goes into the intent's **Constraints**. The spec designs within it.
- **A choice to weigh**, such as two libraries or two approaches, goes into the intent's **Proposed outcome** as a proposal or into its **Open questions**. The spec compares the options in its design, with sources, and the product owner accepts or corrects the choice in review.
