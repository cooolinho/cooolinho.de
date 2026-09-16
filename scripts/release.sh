#!/usr/bin/env bash
# Creates and pushes the next version tag (YYYY.M.D.x), which triggers
# .github/workflows/release.yml to build and deploy it.
#
# Usage:
#   npm run release              # confirm and push
#   npm run release -- --yes     # skip the confirmation prompt
#   npm run release -- --dry-run # only print the next tag, don't create it
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

fail() {
  echo "✖ $1" >&2
  exit 1
}

DRY_RUN=0
ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
  --dry-run) DRY_RUN=1 ;;
  --yes | -y) ASSUME_YES=1 ;;
  *) fail "Unknown argument: $arg" ;;
  esac
done

command -v git >/dev/null 2>&1 || fail "git is not installed"

if [ -n "$(git status --porcelain)" ]; then
  fail "Working tree is not clean. Commit or stash your changes first."
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "master" ]; then
  fail "You're on branch '$BRANCH'. Releases are cut from 'master'."
fi

if [ "$DRY_RUN" = "0" ]; then
  echo "→ Fetching origin/master and tags..."
  git fetch origin master --tags --quiet
  LOCAL_HEAD="$(git rev-parse HEAD)"
  REMOTE_HEAD="$(git rev-parse origin/master)"
  if [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
    fail "Local master ($LOCAL_HEAD) is not in sync with origin/master ($REMOTE_HEAD). Push or pull first."
  fi
fi

EXISTING_TAG="$(git tag --points-at HEAD | grep -E '^[0-9]{4}\.[0-9]+\.[0-9]+\.[0-9]+$' || true)"
if [ -n "$EXISTING_TAG" ]; then
  fail "HEAD already has version tag '$EXISTING_TAG'. To redeploy it, run the 'Daily deploy' workflow manually with that tag instead of creating a new one."
fi

# --- Compute the next tag: YYYY.M.D.x, x starting at 1 per calendar day -----
# Uses Europe/Berlin so the date matches "today" for the site's audience,
# regardless of the timezone the command happens to run in.

DATE="$(TZ=Europe/Berlin date +%Y.%-m.%-d)"

MAX_X=0
while IFS= read -r tag; do
  [ -z "$tag" ] && continue
  x="${tag##*.}"
  [ "$x" -gt "$MAX_X" ] && MAX_X="$x"
done < <(git tag -l "${DATE}.*")

NEXT_X=$((MAX_X + 1))
TAG="${DATE}.${NEXT_X}"

echo "→ Next release tag: $TAG"

if [ "$DRY_RUN" = "1" ]; then
  exit 0
fi

COMMIT="$(git rev-parse --short HEAD)"
SUBJECT="$(git log -1 --format=%s)"
echo "  Commit: $COMMIT ($SUBJECT)"

if [ "$ASSUME_YES" = "0" ]; then
  read -r -p "Create and push tag '$TAG'? [y/N] " reply
  case "$reply" in
  [yY] | [yY][eE][sS]) ;;
  *)
    echo "Aborted."
    exit 1
    ;;
  esac
fi

git tag -a "$TAG" -m "Release $TAG"
git push origin "refs/tags/$TAG"

REMOTE_URL="$(git remote get-url origin | sed -E 's#^git@github\.com:#https://github.com/#; s#\.git$##')"
echo "✔ Pushed $TAG"
echo "  Track the deploy: $REMOTE_URL/actions/workflows/release.yml"
