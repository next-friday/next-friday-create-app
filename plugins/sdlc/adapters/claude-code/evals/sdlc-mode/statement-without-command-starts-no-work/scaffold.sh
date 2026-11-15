#!/usr/bin/env bash
set -euo pipefail
cat > AGENTS.md << 'EOF'
# Agent guide

## Conventions

1. **Work runs through `/sdlc-mode`.** The `sdlc` plugin holds the skills, playbooks, and checks that say when work starts, where it stops for a person, and how a reply is written.
2. **Do not start work a person did not ask for.** When a message reports a problem without asking for work, answer in a few lines and end with the message that would start it: `/sdlc-mode` followed by their own words.
EOF
