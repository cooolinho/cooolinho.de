#!/usr/bin/env bash
# Uploads the built site (dist/) to the production server via SFTP.
#
# Used both by CI (.github/workflows/deploy.yml) and locally:
#   npm run build
#   cp .env.deploy.example .env.deploy && edit it
#   DRY_RUN=1 npm run deploy
#
# See docs/DEPLOYMENT.md for the full variable reference and setup steps.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# --- Configuration -----------------------------------------------------------

if [ -f .env.deploy ]; then
  # shellcheck disable=SC1091
  source .env.deploy
fi

SFTP_HOST="${SFTP_HOST:-}"
SFTP_USER="${SFTP_USER:-}"
SFTP_PORT="${SFTP_PORT:-22}"
SFTP_REMOTE_PATH="${SFTP_REMOTE_PATH:-}"
SFTP_PRIVATE_KEY="${SFTP_PRIVATE_KEY:-}"
SFTP_PASSWORD="${SFTP_PASSWORD:-}"
SFTP_KNOWN_HOSTS="${SFTP_KNOWN_HOSTS:-}"
SFTP_EXCLUDE="${SFTP_EXCLUDE:-}"
DEPLOY_DIR="${DEPLOY_DIR:-dist}"
DRY_RUN="${DRY_RUN:-0}"

fail() {
  echo "✖ $1" >&2
  exit 1
}

# --- Guards -------------------------------------------------------------------

command -v lftp >/dev/null 2>&1 || fail "lftp is not installed (Debian/Ubuntu: sudo apt-get install lftp)"

[ -n "$SFTP_HOST" ] || fail "SFTP_HOST is not set"
[ -n "$SFTP_USER" ] || fail "SFTP_USER is not set"
[ -n "$SFTP_REMOTE_PATH" ] || fail "SFTP_REMOTE_PATH is not set"

case "$SFTP_REMOTE_PATH" in
"" | "/" | "." | "~")
  fail "SFTP_REMOTE_PATH ('$SFTP_REMOTE_PATH') looks unsafe to mirror --delete into. Point it at the site's document root, not a filesystem root or home directory."
  ;;
esac

if [ -z "$SFTP_PRIVATE_KEY" ] && [ -z "$SFTP_PASSWORD" ]; then
  fail "Set either SFTP_PRIVATE_KEY or SFTP_PASSWORD"
fi

[ -f "$DEPLOY_DIR/index.html" ] || fail "$DEPLOY_DIR/index.html not found — run 'npm run build' first"

# --- Temp workspace (key file, known_hosts, lftp script) --------------------
# Everything that can contain a secret is written to files under a private
# temp dir instead of being passed on the command line, so it never shows up
# in `ps` output.

WORKDIR="$(mktemp -d)"
chmod 700 "$WORKDIR"
trap 'rm -rf "$WORKDIR"' EXIT

KNOWN_HOSTS_FILE="$WORKDIR/known_hosts"
if [ -n "$SFTP_KNOWN_HOSTS" ]; then
  printf '%s\n' "$SFTP_KNOWN_HOSTS" >"$KNOWN_HOSTS_FILE"
else
  echo "::warning::SFTP_KNOWN_HOSTS is not set — trusting the host key on first connect (ssh-keyscan). Set SFTP_KNOWN_HOSTS to pin it instead." >&2
  ssh-keyscan -p "$SFTP_PORT" "$SFTP_HOST" >"$KNOWN_HOSTS_FILE" 2>/dev/null \
    || fail "ssh-keyscan could not reach $SFTP_HOST:$SFTP_PORT"
fi

CONNECT_PROGRAM="ssh -a -x -o UserKnownHostsFile=$KNOWN_HOSTS_FILE -o StrictHostKeyChecking=yes -p $SFTP_PORT"

# lftp:open takes "user,password" (key auth: trailing comma, empty password —
# the ssh connect-program below then does the real authentication).
LFTP_USER_ARG="$SFTP_USER,"
if [ -n "$SFTP_PRIVATE_KEY" ]; then
  KEY_FILE="$WORKDIR/deploy_key"
  printf '%s\n' "$SFTP_PRIVATE_KEY" >"$KEY_FILE"
  chmod 600 "$KEY_FILE"
  CONNECT_PROGRAM+=" -i $KEY_FILE -o IdentitiesOnly=yes -o BatchMode=yes"
else
  # No key: let ssh prompt for a password. lftp allocates a pty for the
  # connect-program and answers that prompt with the password given to
  # `open -u`, so the password below is what actually gets used.
  LFTP_USER_ARG="$SFTP_USER,$SFTP_PASSWORD"
fi

# --- Build the lftp script ---------------------------------------------------

MIRROR_OPTS="--reverse --no-perms --parallel=4"
EXCLUDES="--exclude-glob .htaccess --exclude-glob .well-known"
for pattern in $SFTP_EXCLUDE; do
  EXCLUDES+=" --exclude-glob $pattern"
done

if [ "$DRY_RUN" = "1" ]; then
  MIRROR_OPTS+=" --dry-run"
  echo "→ DRY RUN — no files will be transferred or deleted."
fi

# Escape backslash and double-quote so a password (or path) containing either
# can't break out of the double-quoted lftp argument it's placed in below —
# a raw `"` in SFTP_PASSWORD would otherwise let arbitrary lftp commands be
# injected into the generated script.
lftp_dquote() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

SCRIPT_FILE="$WORKDIR/deploy.lftp"
cat >"$SCRIPT_FILE" <<EOF
set cmd:fail-exit yes
set net:max-retries 3
set net:timeout 30
set sftp:connect-program $CONNECT_PROGRAM
open -u "$(lftp_dquote "$LFTP_USER_ARG")" sftp://$SFTP_HOST
mirror $MIRROR_OPTS --exclude-glob *.html $EXCLUDES "$(lftp_dquote "$DEPLOY_DIR")" "$(lftp_dquote "$SFTP_REMOTE_PATH")"
mirror $MIRROR_OPTS --delete $EXCLUDES "$(lftp_dquote "$DEPLOY_DIR")" "$(lftp_dquote "$SFTP_REMOTE_PATH")"
bye
EOF
chmod 600 "$SCRIPT_FILE"

# --- Run ----------------------------------------------------------------------
# Two mirror passes: first upload everything except *.html (new hashed assets
# land before anything references them), then a full pass with --delete that
# switches the HTML over and removes files the new build no longer has. This
# ordering means visitors are never served HTML that points at a since-removed
# asset, and outdated assets from the previous build still get cleaned up.

echo "→ Uploading $DEPLOY_DIR/ to $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH"
lftp -f "$SCRIPT_FILE"
echo "✔ Deploy finished."
