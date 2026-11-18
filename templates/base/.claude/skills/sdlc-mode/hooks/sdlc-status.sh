#!/bin/sh
command -v jq > /dev/null || exit 0
input=
[ -t 0 ] || input=$(cat)
project=$(printf '%s' "$input" | jq -r '.cwd // ""')
[ -n "$project" ] || project=$PWD
[ -d "$project/intent" ] || exit 0

read_status() {
  [ -f "$1" ] || return 0
  sed -n 's/.*Status: \([a-z][a-z ]*\)\..*/\1/p' "$1" | head -n 1
}

default_ref=$(git -C "$project" rev-parse --verify --quiet --abbrev-ref origin/HEAD 2> /dev/null) || default_ref=
if [ -z "$default_ref" ] && git -C "$project" rev-parse --verify --quiet refs/remotes/origin/main > /dev/null 2>&1; then
  default_ref=origin/main
fi

lines=""
for folder in "$project"/intent/*/; do
  [ -d "$folder" ] || continue
  change=$(basename "$folder")
  intent_status=$(read_status "$folder/intent.md")
  spec_status=$(read_status "$folder/spec.md")
  case " $intent_status $spec_status " in
    *" done "* | *" rejected "* | *" withdrawn "* | *" replaced "*) continue ;;
  esac
  if [ -f "$folder/plan.md" ] && [ ! -f "$folder/intent.md" ] && [ ! -f "$folder/spec.md" ] && [ -n "$default_ref" ] \
    && git -C "$project" cat-file -e "$default_ref:intent/$change/plan.md" 2> /dev/null; then
    continue
  fi
  if [ -f "$folder/plan.md" ]; then
    stage="plan accepted; the engineer builds it, then a code owner reviews the pull request"
  elif [ -f "$folder/spec.md" ]; then
    stage="spec $spec_status; the engineer writes and accepts the plan"
  elif [ -f "$folder/intent.md" ]; then
    stage="intent $intent_status; the spec is written next"
  else
    continue
  fi
  lines="$lines- intent/$change: $stage
"
done

[ -n "$lines" ] || exit 0
summary="Changes in intent/ that are not done (send /sdlc-mode to work on one):
$lines"

printf '%s' "$summary"
