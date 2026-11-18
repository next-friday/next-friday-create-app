---
"@next-friday/create-app": minor
---

A session of the `sdlc-mode` skill now directs the work, and the `main` model of the models rule writes the code and the tests of a build or a fix in a subagent, whichever model the session runs on. The session reads the diff, runs the checks, and commits. A role's line in the models rule may say `inherit` to run that role on the session's model.
