---
"@next-friday/create-app": patch
---

`scripts/changed-documents.ts` in a generated project no longer builds a regular expression from each pattern of `.github/file-filters.yml`. It matches a path against a pattern segment by segment, so the `Semgrep (OWASP)` job no longer reports the script. The script gives the same answers as before.
