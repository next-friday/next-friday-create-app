---
"@next-friday/create-app": minor
---

A session of the `sdlc-mode` skill that runs on a model other than the `main` model of the models rule now directs the work: it hands the code and the tests of a build or a fix to a subagent on the `main` model and effort, then reads the diff, runs the checks, and commits itself.
