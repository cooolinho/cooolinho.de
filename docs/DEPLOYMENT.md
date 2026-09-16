# Deployment

cooolinho.de deploys automatically via GitHub Actions and SFTP. This document
covers the versioning scheme, one-time setup, day-to-day usage, and
troubleshooting.

## Overview

Two workflows share one reusable deploy job:

```
release.yml   (push tag 2026.9.16.1) ── validate ──┐
                                                    ├──► deploy.yml ──► GitHub Release
daily.yml     (cron 03:17 UTC, or manual) ── resolve ──┘         (release.yml only)
```

`deploy.yml` ([.github/workflows/deploy.yml](../.github/workflows/deploy.yml))
does the actual work, in this order, every time:

1. Check out the tag being deployed (full git history — the sitemap needs it).
2. Install dependencies (`npm ci`).
3. **Refresh the GitHub stats** (`npm run stats`) — always, even on a release,
   so a release never ships stats that are older than the code.
4. Build the site (`npm run build`).
5. Write `dist/version.json` (version, commit, trigger, timestamps).
6. Upload `dist/` to the server via SFTP ([scripts/deploy.sh](../scripts/deploy.sh)).
7. Smoke-test the live site against `version.json`.

Both `release.yml` and `daily.yml` call this same job, so a release and the
daily redeploy behave identically — the only difference is which tag they
pass in and whether a GitHub Release gets published afterwards.

## Versioning

Releases are tagged `YYYY.M.D.x`:

- `YYYY` — full year
- `M`, `D` — month and day, **no leading zeros** (`9`, not `09`)
- `x` — a counter starting at `1`, incremented if you release more than once
  on the same calendar day (Europe/Berlin)

Examples: `2026.9.16.1`, `2026.9.16.2` (a second release the same day),
`2026.12.3.1`.

This isn't semver — there's no meaning attached to "major"/"minor"/"patch"
here, it's simply "when was this built". Tags sort correctly with git's
version sort (`git tag -l --sort=-v:refname`) because each segment increases
in place value the same way numerically, even without padding.

The version is **not** stored in `package.json` — a four-segment number
isn't valid semver, and `package.json`'s version isn't used for anything in
this project's build.

## One-time setup

### 1. Server access

You need either an SSH key or a password for the SFTP account, plus the
remote document root path.

**SSH key (recommended):**

```bash
ssh-keygen -t ed25519 -N "" -f deploy_key -C "cooolinho.de-ci"
```

Add `deploy_key.pub` to the server (via your hosting control panel, or
`ssh-copy-id`/`~/.ssh/authorized_keys` if you have shell access). Keep
`deploy_key` (no `.pub`) for the `SFTP_PRIVATE_KEY` secret below, then
delete the local copy.

**Password:** just use the existing SFTP account's password — no extra setup.

**Remote path:** connect once to find the document root:

```bash
sftp -P <port> <user>@<host>
sftp> pwd
```

**Host key:** pin it instead of trusting it on first connect:

```bash
ssh-keyscan -p <port> <host> > known_hosts_snippet
ssh-keygen -lf known_hosts_snippet   # compare this fingerprint with what your host publishes
cat known_hosts_snippet              # this whole file is the SFTP_KNOWN_HOSTS secret
```

If you skip this, the deploy script falls back to trust-on-first-connect
(`ssh-keyscan` at deploy time) and prints a warning — it works, but doesn't
protect the very first connection.

### 2. GitHub stats token

The daily/release job needs to read your GitHub profile as **you**
(`cooolinho`) — the same requirement the local `/update-github-infos` skill
has (see [.claude/skills/update-github-infos/SKILL.md](../.claude/skills/update-github-infos/SKILL.md)).

Create a **fine-grained personal access token**:

- Resource owner: your account
- Repository access: *All repositories* (needed to see all your repos'
  languages/composer files, including private ones)
- Permissions: *Contents* — Read-only, *Metadata* — Read-only
- Set an expiration and put a reminder in your calendar to rotate it —
  the workflow will start failing on `npm run stats` once it expires, with a
  clear `gh` error in the Action log.

If some numbers don't match what you see locally (e.g. contribution counts
that depend on `read:user`), fall back to a classic PAT with `repo` and
`read:user` scopes instead. Verify locally before trusting it in CI:

```bash
GH_TOKEN=<token> npm run stats -- --dry-run
```

### 3. GitHub environment & secrets

Create a **production** environment (repo → Settings → Environments):

- Deployment branches and tags: restrict to branch `master` and tag pattern
  `[0-9]*.*.*.*` — this is what shows the deploy history under
  Actions/Environments and stops the workflow from deploying an arbitrary ref.

Add as environment **secrets**:

| Secret | Notes |
| --- | --- |
| `SFTP_HOST` | hostname only |
| `SFTP_USER` | |
| `SFTP_PRIVATE_KEY` | contents of the private key file; leave unset if using a password |
| `SFTP_PASSWORD` | leave unset if using a key |
| `SFTP_KNOWN_HOSTS` | contents of the `known_hosts` snippet from step 1; optional but recommended |
| `GH_STATS_TOKEN` | the token from step 2 |

Add as environment **variables** (Settings → Environments → production →
Variables — not secret, but configurable without editing the workflow):

| Variable | Default if unset | Notes |
| --- | --- | --- |
| `SFTP_PORT` | `22` | |
| `SFTP_REMOTE_PATH` | *(required)* | document root from step 1 |
| `SFTP_EXCLUDE` | *(none)* | space-separated extra glob patterns to never touch |
| `SITE_URL` | `https://cooolinho.de` | used for the environment link and the smoke test |

### 4. First test

Do these in order, cheapest first:

1. Locally: `.env.deploy` from the example file, `DRY_RUN=1 npm run deploy`
   (see [Deploy script reference](#deploy-script-reference)).
2. Push the three workflow files to `master`.
3. `npm run release` for the first real release.
4. Run **Daily deploy** manually once with `dry_run: true`, then once
   without, to confirm the schedule path works independently of a release.

## Creating a release

```bash
npm run release
```

This computes the next `YYYY.M.D.x` tag, shows you the tag and commit,
confirms, then creates and pushes an annotated tag. That push triggers
`release.yml`, which validates the tag, deploys it, and publishes a GitHub
Release with generated notes.

Equivalent by hand:

```bash
git tag -a 2026.9.16.1 -m "Release 2026.9.16.1"
git push origin 2026.9.16.1
```

**Gotchas:**

- The tag must point at a commit that's on `master` — `release.yml` checks
  this and fails the run otherwise (a tag on a feature branch won't deploy).
- GitHub only runs workflows for the first 3 tags pushed in a single `git
  push`. Push (and let each deploy finish) one tag at a time.

## Daily deployment

Runs on a schedule (03:17 UTC) with no input: resolve the newest existing
version tag, refresh the GitHub stats, redeploy. If there's no tag yet
(before the first release), it exits cleanly without deploying anything.

Since the stats change constantly, this is what keeps `gh stats cooolinho`
on the live site from going stale between releases. The stats are **not**
committed back to the repo — the daily job fetches them fresh into the build
every time and nothing is written back to git.

Scheduled workflows can run a few minutes late under GitHub-wide load; that's
normal and not something to act on. What *does* need action: **on a public
repo, GitHub disables a schedule after 60 days with no repository
activity.** Any push, merge, or a manual "Run workflow" re-enables it — the
Actions tab shows a banner if a schedule is currently disabled.

## Manual deploy & rollback

Run **Daily deploy** from the Actions tab with `workflow_dispatch`:

- Leave `tag` empty → same as the scheduled run (latest tag + fresh stats).
- Set `tag` to an older version → redeploys exactly that tag (a rollback).
- Set `dry_run: true` → runs the whole pipeline including the SFTP script's
  `--dry-run` mode, so nothing is actually transferred.

A rollback done this way is **temporary**: the next scheduled daily run will
deploy the latest tag again, undoing it. For a rollback that sticks, either
delete the bad tag (`git push origin :refs/tags/<tag>`) or fix `master` and
cut a new release — don't rely on the daily job to keep an old version live.

## Deploy script reference

[scripts/deploy.sh](../scripts/deploy.sh) uploads a built `dist/` via `lftp`
over SFTP. It reads these variables from the environment, or from a local
`.env.deploy` file (copy [.env.deploy.example](../.env.deploy.example) and
fill it in — this file is gitignored):

| Variable | Required | Notes |
| --- | --- | --- |
| `SFTP_HOST` | yes | |
| `SFTP_USER` | yes | |
| `SFTP_REMOTE_PATH` | yes | rejected if empty, `/`, `.` or `~` — see below |
| `SFTP_PRIVATE_KEY` or `SFTP_PASSWORD` | one of the two | key wins if both are set |
| `SFTP_PORT` | no (default `22`) | |
| `SFTP_KNOWN_HOSTS` | no | omit to trust-on-first-connect (with a warning) |
| `SFTP_EXCLUDE` | no | space-separated glob patterns, e.g. `stats.php uploads/*` |
| `DEPLOY_DIR` | no (default `dist`) | |
| `DRY_RUN` | no (default `0`) | `1` runs `lftp mirror --dry-run` |

It uploads in two passes so the live site is never caught serving HTML that
references an asset that isn't there yet:

1. everything except `*.html` (new hashed assets, images, `robots.txt`, …),
   without deleting anything
2. everything including HTML, **with** `--delete` — this is what removes
   files the new build no longer produces

`.htaccess` and `.well-known/` are always excluded from both the upload and
the delete pass, on top of whatever you list in `SFTP_EXCLUDE`.

Local usage:

```bash
sudo apt-get install lftp
cp .env.deploy.example .env.deploy   # fill in your values
DRY_RUN=1 npm run deploy             # check what would happen
npm run deploy                       # actually deploy
```

## Verification

After any deploy:

```bash
curl -s https://cooolinho.de/version.json | jq .
```

`version` should be the tag you just deployed, `commit` its commit SHA. The
workflow's own smoke test step already checks this automatically and fails
the run if the live site doesn't match — this is mostly for a manual sanity
check.

Also useful:

- The job summary of any workflow run shows the `npm run stats` output table.
- Repo → Environments → production lists every deploy with its commit/tag.

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `Host key verification failed` | `SFTP_KNOWN_HOSTS` doesn't match the server's current host key, or the server's key rotated. Re-run `ssh-keyscan` and update the secret. |
| `Permission denied (publickey,password)` | Wrong key/password, or the public key isn't installed on the server for that user. |
| Upload connects but nothing is written / `Permission denied` on write | The SFTP account doesn't have write access to `SFTP_REMOTE_PATH`. Verify with a manual `sftp` session. |
| `npm run stats` fails with `Bad credentials` | `GH_STATS_TOKEN` expired or was revoked — issue a new one (see setup step 2). |
| `npm run stats` fails with `gh ist als "…" eingeloggt, erwartet wird "cooolinho"` | The token belongs to the wrong account. |
| `Datenschutz-Guard` failure in the stats step | A description (from GitHub or `config.json`) mentions a private repo's name. Fix the text — the guard exists so nothing about a private repo leaks into a public deploy log; do not bypass it. |
| Smoke test fails / live `version.json` doesn't match | Often just CDN/proxy caching — retry `curl` with `?bust=$RANDOM`. If it persists, check that `SFTP_REMOTE_PATH` really is the web root the domain serves. |
| Pushing a tag doesn't trigger `release.yml` | Tag doesn't match `[0-9][0-9][0-9][0-9].*.*.*`, or more than 3 tags were pushed in one `git push` (GitHub only triggers workflows for the first 3). |
| Daily deploy stopped running | Public repo + 60 days without any repository activity disables schedules. Push anything, or run it manually once, to re-enable it. |

## Security notes

- This repository is **public** — workflow logs are public too. The stats
  script's privacy guard (see its `SKILL.md`) is adjusted for CI to never
  print a private repo's name in a log; don't remove that.
- `GH_STATS_TOKEN` is scoped to read-only Contents/Metadata — it can't modify
  or delete anything if it leaks.
- The deploy uses its own SSH key (or password), separate from your personal
  one — easy to revoke without affecting your own access.
- Prefer pinning `SFTP_KNOWN_HOSTS` over trust-on-first-connect; it's the
  only thing standing between this workflow and a MITM'd SFTP session.
- `mirror --delete` will remove anything on the server, under
  `SFTP_REMOTE_PATH`, that isn't part of `dist/` — that's why `deploy.sh`
  refuses to run against an empty/root-ish path, and why anything you keep
  on the server outside the build (e.g. `.htaccess`) needs to be in the
  exclude list.
