#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
cat > AGENTS.md << 'MD'
# Agent guide

## Conventions

1. **Work runs through `/sdlc-intent`.** The `sdlc` plugin holds the skills, playbooks, and checks that say when work starts, where it stops for a person, and how a reply is written.
MD
mkdir -p src intent
printf '# Intent\n\nEach change has its own folder, `intent/<change>/`.\n' > intent/README.md
printf 'export function reportPage(): string {\n  return "report";\n}\n' > src/report.ts
git add -A
git commit -q -m "chore: add project"
git checkout -q -b feat/csv-export
printf 'export function csvButton(): string {\n  return "Download CSV";\n}\n' > src/csv-export.ts
git add -A
git commit -q -m "feat(reports): add csv export button"
