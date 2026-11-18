#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
mkdir -p .github/workflows
cat > AGENTS.md << 'AGENTS'
# Agent guide

## Verifying your work

- Test: `pnpm test`
AGENTS
cat > package.json << 'PACKAGE'
{
  "name": "eval-project",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
PACKAGE
cat > SETUP.md << 'SETUP'
# Setup

## Deploy

The project ships no deploy workflow; the team set up its own in `.github/workflows/release.yml`.
It deploys to `staging`, then to `prod`, where a release manager approves the run.
SETUP
cat > .github/workflows/release.yml << 'WORKFLOW'
name: Release
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, prod]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - run: echo "deploy to ${{ inputs.environment }}"
WORKFLOW
git add -A
git commit -q -m "chore: add project"
remote="$(mktemp -d)/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"
git push -q origin --all
