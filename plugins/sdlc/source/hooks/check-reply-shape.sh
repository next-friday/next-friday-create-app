#!/bin/sh
command -v jq > /dev/null || exit 0
mode=${1:-}
input=$(cat)
# An agent tool that also runs the other tool's hook entries names itself in `cursor_version`; its own entries pass another argument.
case $mode in
  '' | snapshot) printf '%s' "$input" | jq -e 'has("cursor_version")' > /dev/null 2>&1 && exit 0 ;;
esac
state_directory=${TMPDIR:-/tmp}/sdlc-reply-shape
conversation=$(printf '%s' "$input" | jq -r '.conversation_id // .session_id // ""')
conversation=${conversation:+$(printf '%s' "$conversation" | cksum | tr ' ' '-')}
project=$(printf '%s' "$input" | jq -r '.cwd // .workspace_roots[0] // ""')
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
    git -C "$project" ls-files -s -- . ':(exclude)intent' | cksum
  )
  rm -rf "$scratch"
  printf '%s|%s' "$repository" "$content"
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
  [ "${previous%|*}" = "${current%|*}" ] && [ "$previous" != "$current" ]
}

case $mode in
  snapshot | submit)
    changed_since_snapshot
    exit 0
    ;;
  save)
    text=$(printf '%s' "$input" | jq -r '.text // ""')
    [ -n "$text" ] && [ -n "$conversation" ] || exit 0
    mkdir -p "$state_directory" && printf '%s' "$text" > "$state_directory/$conversation"
    exit 0
    ;;
  followup)
    changed=false
    changed_since_snapshot && changed=true
    [ -n "$conversation" ] && [ -f "$state_directory/$conversation" ] || exit 0
    reply=$(cat "$state_directory/$conversation")
    rm -f "$state_directory/$conversation"
    [ "$(printf '%s' "$input" | jq -r '"\(.status // "") \(.loop_count // "")"')" = 'completed 0' ] || exit 0
    ;;
  *)
    changed=false
    changed_since_snapshot && agent_could_write && changed=true
    [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = true ] && exit 0
    reply=$(printf '%s' "$input" | jq -r '.last_assistant_message // ""')
    ;;
esac
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
  problems="${problems}A file outside intent/ changed in this turn and the reply has no **Checks:** section. Add **Checks:** with the lines of the pre-commit or pre-push hook output that show the result, or with each check that has no result yet and why; do not run the hooks' checks yourself. "
fi

if [ -z "$not_yet" ] && printf '%s\n' "$last" | tr 'A-Z' 'a-z' | grep -Eq '(^|[^[:alpha:]])merge([^[:alpha:]]|$)' \
  && printf '%s\n' "$outside_fences" | tr 'A-Z' 'a-z' | grep -Eq 'not run|not verified|unverified|not proved|unproved|not checked|not tested|skipped|no result' \
  && ! printf '%s\n' "$outside_fences" | tr 'A-Z' 'a-z' | grep -q 'accepted without a result'; then
  problems="${problems}The reply says a check has no result, and the **Now:** line tells the person to merge. Add a **Not yet:** line that names what has no result, and ask on the **Now:** line whether to get the result first or to accept the change without it. "
fi

[ -z "$problems" ] && exit 0
jq -n --arg mode "$mode" --arg reason "${problems}Send the whole reply again." \
  'if $mode == "followup" then {followup_message:$reason} else {decision:"block",reason:$reason} end'
