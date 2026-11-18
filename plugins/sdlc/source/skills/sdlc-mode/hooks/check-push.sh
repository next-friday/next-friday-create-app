#!/bin/sh
command -v jq > /dev/null || exit 0
command -v node > /dev/null || exit 0
input=$(cat)

command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' | sed 's/"[^"]*"/""/g')
printf '%s' "$command" | grep -Eq "(^|[;&|('])[[:space:]]*git([[:space:]]+(-c|-C)[[:space:]]+[^[:space:]]+|[[:space:]]+--[a-z-]+(=[^[:space:]]+)?)*[[:space:]]+push([[:space:];&|)']|$)" || exit 0

script_directory=$(cd "$(dirname "$0")/../scripts" && pwd)
project=$(printf '%s' "$input" | jq -r '.cwd // ""')
[ -n "$project" ] && cd "$project" 2> /dev/null || exit 0

report=$(node "$script_directory/check-plan.ts" 2>&1) && exit 0
message="The push is blocked:
$report"
jq -n --arg message "$message" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $message}}'
