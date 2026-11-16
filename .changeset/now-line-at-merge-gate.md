---
"@next-friday/create-app": patch
---

A session no longer tells a person to merge a change that is not proved. When a requirement of the change has no result, the reply holds a **Not yet** line that names it, and the **Now** line asks the person to decide between getting the result first and accepting the change without it. The reply-shape hook blocks a reply that says a check was not run and tells the person to merge. When a pull request adds a changeset, the session says that the merge opens a release pull request, and names the package and the version it publishes.
