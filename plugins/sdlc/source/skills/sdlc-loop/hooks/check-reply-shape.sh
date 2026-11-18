#!/bin/sh
command -v jq > /dev/null || exit 0
mode=${1:-}
input=$(cat)
state_directory=${TMPDIR:-/tmp}/sdlc-reply-shape
conversation=$(printf '%s' "$input" | jq -r '.session_id // ""')
conversation=${conversation:+$(printf '%s' "$conversation" | cksum | tr ' ' '-')}
project=$(printf '%s' "$input" | jq -r '.cwd // ""')
snapshot_file=$state_directory/$conversation.files

# A copy of the index and a scratch object store keep the project's own Git data unwritten.
snapshot() {
  [ -n "$project" ] && [ -n "$conversation" ] || return 1
  repository=$(git -C "$project" rev-parse --show-toplevel 2> /dev/null) || return 1
  index=$(git -C "$repository" rev-parse --git-path index) || return 1
  objects=$(git -C "$repository" rev-parse --git-path objects) || return 1
  case $index in /*) ;; *) index=$repository/$index ;; esac
  case $objects in /*) ;; *) objects=$repository/$objects ;; esac
  scratch=$state_directory/$conversation.git
  rm -rf "$scratch"
  mkdir -p "$scratch/objects" || return 1
  cp "$index" "$scratch/index" 2> /dev/null
  content=$(
    export GIT_INDEX_FILE="$scratch/index" GIT_OBJECT_DIRECTORY="$scratch/objects" GIT_ALTERNATE_OBJECT_DIRECTORIES="$objects"
    git -C "$project" add -A -- . ':(exclude)intent' 2> /dev/null
    files=$(git -C "$project" ls-files -s -- . ':(exclude)intent' | cksum)
    uncommitted=$(git -C "$project" diff-index --cached HEAD -- . ':(exclude)intent' 2> /dev/null | cksum)
    printf '%s|%s' "$files" "$uncommitted"
  )
  rm -rf "$scratch"
  printf '%s|%s|%s' "$repository" "$content" "$(git -C "$repository" reflog show HEAD 2> /dev/null | grep -c .)"
}

field() {
  printf '%s' "$2" | cut -d '|' -f "$1"
}

# A checkout, a pull, a rebase, and a reset move HEAD and change files without writing any. Only a commit made since the snapshot counts, and only when it holds a file outside intent/.
committed_since_snapshot() {
  entries_before=$(field 4 "$previous")
  entries_now=$(field 4 "$current")
  case $entries_before in '' | *[!0-9]*) return 0 ;; esac
  case $entries_now in '' | *[!0-9]*) return 0 ;; esac
  [ "$entries_now" -ge "$entries_before" ] || return 0
  for commit in $(git -C "$repository" log -g -n "$((entries_now - entries_before))" --format='%H %gs' HEAD 2> /dev/null | sed -n -E 's/^([0-9a-f]+) (commit|cherry-pick|revert).*/\1/p'); do
    [ -z "$(git -C "$project" diff-tree --no-commit-id --name-only -r -m --root "$commit" -- . ':(exclude)intent' 2> /dev/null)" ] || return 0
  done
  return 1
}

# The transcript shows whether the agent ran a tool that can write, since the last message a person typed: one whose input holds a command, new text for a file, or a prompt for another agent, or a tool of an outside server. With no transcript, the answer is yes.
agent_could_write() {
  transcript=$(printf '%s' "$input" | jq -r '.transcript_path // ""')
  [ -n "$transcript" ] && [ -f "$transcript" ] || return 0
  jq -s -e '
    (map(.type == "user" and ((.message.content | type) == "string" or ((.message.content | type) == "array" and any(.message.content[]; .type == "text")))) | rindex(true) // 0) as $start
    | [.[$start:][] | select(.type == "assistant") | .message.content[]? | select(.type == "tool_use") | {name: (.name // ""), input: (.input // {})}]
    | any(.[]; (.input | has("command") or has("content") or has("new_string") or has("edits") or has("new_source") or has("prompt")) or (.name | startswith("mcp__")))
  ' "$transcript" > /dev/null 2>&1
  [ $? -ne 1 ]
}

changed_since_snapshot() {
  current=$(snapshot) || return 1
  previous=$(cat "$snapshot_file" 2> /dev/null)
  printf '%s' "$current" > "$snapshot_file"
  repository=$(field 1 "$current")
  [ "$(field 1 "$previous")" = "$repository" ] || return 1
  [ "$(field 2 "$previous")" != "$(field 2 "$current")" ] || return 1
  [ "$(field 3 "$previous")" = "$(field 3 "$current")" ] || return 0
  committed_since_snapshot
}

if [ "$mode" = snapshot ]; then
  changed_since_snapshot
  exit 0
fi
changed=false
changed_since_snapshot && agent_could_write && changed=true
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = true ] && exit 0
reply=$(printf '%s' "$input" | jq -r '.last_assistant_message // ""')
first=$(printf '%s\n' "$reply" | awk 'NF{print; exit}')
case $first in '**Answer:**'* | '**Result:**'* | '**Waiting for you:**'* | '**No change:**'*) ;; *) exit 0 ;; esac

last=$(printf '%s\n' "$reply" | awk 'NF{l=$0} END{print l}')
outside_fences=$(printf '%s\n' "$reply" | awk '/^[[:space:]]*(```|~~~)/{f=!f; next} !f')
outside_urls=$(printf '%s\n' "$outside_fences" | sed -E 's#https?://[^][:space:])>]*# #g')
outside_code=$(printf '%s\n' "$outside_urls" | tr 'A-Z' 'a-z' \
  | sed -E 's/`((#|(pr|pull request|issue)s?[[:space:]]+#?)[0-9]+)`/ \1 /g; s/`[^`]*`/ /g' \
  | sed -E 's/(step|item|number|requirement|rule|point|option|case|line)s?[[:space:]]+#[0-9]+/ /g; s/#[0-9]{6,}/ /g')

number=$(printf '%s\n' "$outside_code" \
  | grep -Eo '(^|[^[:alnum:]_&#/])#[0-9]+([^[:alnum:]_]|$)|(^|[^[:alnum:]_])(pr|pull request|issue)s?[[:space:]]+#?[0-9]+([^[:alnum:]_.]|\.[^0-9]|\.?$)(of[[:space:]]+(the|this|that|a|an|my|our|your|these|those)[[:space:]])?' \
  | grep -Ev '[[:space:]]of[[:space:]]' | head -1 | sed -E 's/^[^#[:alnum:]]//; s/[^[:alnum:]]$//')
problems=
[ -n "$number" ] && problems="Replace \"$number\" with the full URL of that pull request or issue, or with \"this pull request\". "
only_line=$(printf '%s\n' "$reply" | awk 'NF{n++} END{print n+0}')
not_yet=$(printf '%s\n' "$outside_fences" | grep -E '^[[:space:]]*([-*+][[:space:]]+)?\*\*Not yet:\*\*')
page_urls() {
  grep -Eo 'https?://[^][:space:]()<>]+' \
    | sed -E 's#[`*_"'"'"'!?.,;:]+$##; s#[?\#].*$##; s#/+$##' \
    | tr 'A-Z' 'a-z' | sort -u
}
case $last in
  '**Now:**'*)
    now_urls=$(printf '%s\n' "$last" | page_urls)
    now_url=$(printf '%s\n' "$now_urls" | head -1)
    if [ "$(printf '%s\n' "$now_urls" | grep -c .)" -gt 1 ]; then
      problems="${problems}The **Now:** line holds more than one URL. Name one thing for the person to do, with one URL. "
    fi
    if printf '%s' "$now_url" | grep -Eq '^https?://[^/]+/[^/]+/[^/]+/(.*/)?(pulls|issues)$'; then
      problems="${problems}The **Now:** line links a list page. Link the one page where the person acts, or write no URL when the person has nothing to do. "
    fi
    if [ -n "$now_url" ] && printf '%s\n' "$not_yet" | page_urls | grep -Fxq "$now_url"; then
      problems="${problems}The **Now:** line links the page the **Not yet:** line names. Write no URL there until the person may act on that page. "
    fi
    ;;
  '**No change:**'*)
    [ "$only_line" -eq 1 ] || problems="${problems}End the reply with a line that starts with **Now:**; nothing may follow it. "
    ;;
  *) problems="${problems}End the reply with a line that starts with **Now:**; nothing may follow it. " ;;
esac
if [ "$(printf '%s\n' "$not_yet" | grep -c .)" -gt 1 ]; then
  problems="${problems}The reply holds more than one **Not yet:** line. Keep one. "
fi
if printf '%s\n' "$outside_fences" | grep -q '^\*\*Steps'; then
  problems="${problems}The reply holds a **Steps** section. Keep the steps in the task list, or write one line that gives the number of the current step and how many are left. "
fi

if [ "$changed" = true ] && ! printf '%s\n' "$outside_fences" | grep -q '^\*\*Checks:\*\*'; then
  problems="${problems}A file outside intent/ changed in this turn and the reply has no **Checks:** section. Run the checks the project names and add **Checks:** with each command and the lines of its output that show the result, or with each check that could not run and why. "
fi

if [ -z "$not_yet" ] && printf '%s\n' "$last" | tr 'A-Z' 'a-z' | grep -Eq '(^|[^[:alpha:]])merge([^[:alpha:]]|$)' \
  && printf '%s\n' "$outside_fences" | tr 'A-Z' 'a-z' | grep -Eq 'not run|not verified|unverified|not proved|unproved|not checked|not tested|skipped|no result' \
  && ! printf '%s\n' "$outside_fences" | tr 'A-Z' 'a-z' | grep -q 'accepted without a result'; then
  problems="${problems}The reply says a check has no result, and the **Now:** line tells the person to merge. Add a **Not yet:** line that names what has no result, and ask on the **Now:** line whether to get the result first or to accept the change without it. "
fi

[ -z "$problems" ] && exit 0
jq -n --arg reason "${problems}Send the whole reply again." '{decision:"block",reason:$reason}'
