#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
mkdir -p intent/export-sync
cat > AGENTS.md << 'AGENTS'
# Agent guide

## Verifying your work

- Test: `pnpm test`
AGENTS
cat > intent/export-sync/intent.md << 'INTENT'
# Intent: keep the export in sync with the report service

Author: @joe-acct (Developer Productivity). Status: done.

## Problem

- The export gives only 0.9 reports, and the report service moved to 1.0.
- One folder holds every sync with the report service, so the record of how the export follows it lives in one place.

## Proposed outcome

- The export gives 1.0 reports.
- This folder's `spec.md` and `plan.md`, written for 0.9, are removed with this intent, so the spec for 1.0 is written in this folder; git keeps the earlier ones.

## Affected users and systems

The accounting team and the export service.

## Constraints

None.

## Open questions

None.
INTENT
cat > intent/export-sync/spec.md << 'SPEC'
# Spec: keep the export in sync with the report service

From `intent/export-sync/intent.md`. Status: done.

## Requirements

1. The export gives 1.0 reports.
SPEC
cat > intent/export-sync/plan.md << 'PLAN'
# Plan: keep the export in sync with the report service

Accepted by: @joe-acct.

## Files that change

- `src/export.ts` (changed): writes 1.0 reports.

## Order of work

1. Change the writer. Check: `pnpm test`.

## Risks

None.

## Proof

`pnpm test`.
PLAN
git add -A
git commit -q -m "chore: add project"
