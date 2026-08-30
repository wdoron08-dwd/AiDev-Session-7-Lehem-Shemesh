#!/usr/bin/env bash
# status.sh — cold-start state probe for the לחם ושמש task.
#
# WHY: a hand-written "where we are" note rots. This derives state mechanically from git and
# from the files themselves, so a new session never has to trust a sentence written last week.
# Run it as the first action of every session.

set -uo pipefail
cd "$(dirname "$0")"

DOC="CLAUDE.md"
DELIVERABLES=("index.html" "style.css")

echo "=== STATE PROBE ($(date +%Y-%m-%d)) ==="
echo

# 1. SNAPSHOT FRESHNESS
#    No work log here, so the honest comparison is against the last commit: if you committed
#    after you last updated the snapshot, the snapshot is behind the code.
echo "--- SNAPSHOT FRESHNESS ---"
snap=$(grep -m1 -iE 'snapshot.*updated' "$DOC" 2>/dev/null \
       | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}') || snap=""
[ -z "$snap" ] && snap="UNDATED"
last=$(git log -1 --format=%cs 2>/dev/null) || last=""
[ -z "$last" ] && last="?"
echo "  snapshot dated : $snap"
echo "  last commit    : $last"
if [ "$snap" = "UNDATED" ]; then
  echo "  ⚠️  snapshot has no date — you cannot tell if it is stale. Add one."
elif [ "$last" = "?" ]; then
  echo "  (no commits yet)"
elif [[ "$snap" < "$last" ]]; then
  echo "  ⚠️  DRIFT — you have committed since the snapshot was last written."
  echo "      Read the recent commits before trusting the snapshot."
else
  echo "  ✅ in sync"
fi
echo

# 2. DELIVERABLE FILES
echo "--- DELIVERABLE FILES ---"
for f in "${DELIVERABLES[@]}"; do
  [ -f "$f" ] && echo "  ✅ $f" || echo "  ❌ $f MISSING"
done
echo

# 3. GIT — uncommitted work is work at risk; unpushed work is invisible to Vercel.
echo "--- GIT ---"
echo "  branch: $(git branch --show-current 2>/dev/null || echo '?')"

n=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$n" = "0" ]; then
  echo "  ✅ nothing uncommitted"
else
  echo "  ⚠️  $n uncommitted file(s):"
  git status --short | head -8 | sed 's/^/     /'
fi

# The task requires at least 5 commits, so the count is worth seeing every time.
c=$(git rev-list --count HEAD 2>/dev/null) || c=0
if [ "$c" -ge 5 ]; then
  echo "  ✅ $c commits (task needs 5+)"
else
  echo "  ⚠️  $c commit(s) — task needs at least 5, and this cannot be fixed retroactively"
fi

# Committed but not pushed = the live site will not update. The classic silent failure.
if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
  git fetch -q origin 2>/dev/null
  ahead=$(git rev-list --count '@{u}..HEAD' 2>/dev/null) || ahead=0
  if [ "$ahead" = "0" ]; then
    echo "  ✅ pushed — GitHub is up to date"
  else
    echo "  ⚠️  $ahead commit(s) NOT pushed — Vercel cannot see them. Run: git push"
  fi
else
  echo "  ⚠️  no upstream set — run: git push -u origin main"
fi
echo

# 4. LIVE URL — read only from the explicitly labelled line, so example URLs elsewhere in
#    the doc cannot be mistaken for the real one.
echo "--- LIVE ---"
url=$(grep -m1 -E '^LIVE_URL:' "$DOC" 2>/dev/null | sed -E 's/^LIVE_URL:[[:space:]]*//')
if [ -n "${url:-}" ] && [ "${url#(}" = "$url" ]; then
  echo "  vercel: $url"
  case "$url" in
    https://*/) echo "  ⚠️  trailing slash — CORS in n8n must NOT have it" ;;
    https://*)  echo "  ✅ shape looks right for the CORS field" ;;
    *)          echo "  ⚠️  missing https:// — CORS needs the full origin" ;;
  esac
else
  echo "  (no live URL yet — add a line 'LIVE_URL: https://...' to $DOC after deploying)"
fi
