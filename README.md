<h1 align="center">🌐 cooolinho.de</h1>

<p align="center">
  <em>Personal portfolio site for Colin Deepe (cooolinho) — a terminal-styled single page with live GitHub stats, built with Vite and SCSS</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="Sass">
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

<p align="center">
  <a href="README.de.md">🇩🇪 Deutsche Version</a>
</p>

---

## 📖 About

The source for [cooolinho.de](https://cooolinho.de/), a one-page portfolio styled as a terminal session. It presents a typed `whoami` intro plus live GitHub activity (contributions, streaks, heatmap, languages, featured repos) rendered from data fetched via a Claude Code skill. The build handles its own SEO: structured data, a generated sitemap, and automated deployment on every tagged release.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) Vite | 8.x | Frontend build tool and dev server |
| ![Sass](https://img.shields.io/badge/Sass-CC6699?style=flat-square&logo=sass&logoColor=white) Sass | 1.x | SCSS preprocessor for the terminal theme |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) GitHub Actions | — | CI: release build, SFTP deploy, daily redeploy |

## ✨ Features

- **Terminal-styled hero** — a `whoami` typing animation built in vanilla JS (`src/main.js`)
- **Live GitHub stats** — contributions, streaks, a contribution heatmap, language breakdown and featured repos, rendered from `src/data/github-stats.json`
- **Self-generating sitemap** — a custom Vite plugin scans `dist` after build, skips `noindex` pages, and stamps each URL with its last commit date
- **Tag-triggered deployment** — pushing a version tag builds the site and uploads it via SFTP; a daily cron job redeploys the latest tag after refreshing GitHub stats

## 🚀 Getting Started

### Prerequisites

- Node.js 22 (see `.nvmrc`) and npm
- Optional: [GitHub CLI](https://cli.github.com) (`gh`), logged in as `cooolinho` — only needed to refresh the GitHub stats locally

### Installation

```bash
git clone https://github.com/cooolinho/cooolinho.de.git
cd cooolinho.de
npm install
```

## 📋 Usage

```bash
npm run dev       # start the dev server (default: http://localhost:5173)
npm run build     # build the site into /dist, incl. sitemap.xml
npm run preview   # preview the production build (serves /dist)
npm run stats     # refresh src/data/github-stats.json
npm run release   # tag and push the next version, triggering a deploy
npm run deploy    # upload /dist via SFTP (used by CI, requires .env.deploy)
```

## 🚢 Deployment

Deployment is automatic: pushing a version tag (`npm run release`) builds and uploads the site via SFTP, and a daily job redeploys the latest tag after refreshing the GitHub stats. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full setup — SFTP credentials, GitHub secrets, versioning scheme — and day-to-day usage.

The host must redirect `http://` and `www.cooolinho.de` with **301** to `https://cooolinho.de/` to match the canonical URL.

## 🔍 SEO

### Meta tags & structured data

Everything lives in the `<head>` of `index.html`: `title`, `description`, `robots`, canonical URL, favicons, Open Graph / X card tags, and a JSON-LD `@graph` with `WebSite`, `ProfilePage` and `Person`. When content changes, keep these in sync with the visible page. If you replace an image, keep its dimensions or update `og:image:width`/`og:image:height` and `Person.image`.

### robots.txt

`public/robots.txt` is a static file copied unchanged to `dist/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://cooolinho.de/sitemap.xml
```

`robots.txt` only controls crawling, not indexing — to keep a page out of Google use `<meta name="robots" content="noindex">` on that page instead, and don't block it in `robots.txt`, or Google never sees the `noindex`.

### sitemap.xml

There is **no** `sitemap.xml` in the repository — it's generated on every `npm run build` by the `sitemap()` plugin in `vite.config.js` and written to `dist/sitemap.xml`:

1. After the build (`closeBundle`) it scans `/dist` for all `.html` files.
2. Pages containing `<meta name="robots" content="noindex">` are skipped.
3. File paths are turned into URLs based on `SITE_URL`.
4. `<lastmod>` is the date of the last commit that touched the source HTML file (`git log -1 --format=%cs`) — uncommitted changes aren't reflected, and CI needs `fetch-depth: 0` or every page gets the latest commit's date.

Check the result with `npm run build && cat dist/sitemap.xml`, or `npm run preview` and open `http://localhost:4173/sitemap.xml` (the sitemap isn't available in the dev server).

### Adding a new page

1. Create `<name>/index.html` for a clean URL like `/projekte/`.
2. Register it as a build input in `vite.config.js` (Vite 8 uses `rolldownOptions`, not the deprecated `rollupOptions`) — otherwise Vite only builds `index.html`.
3. Give the page its own SEO `<head>`: `title`, `description`, canonical link, `og:url` and matching Open Graph tags.
4. Commit, then `npm run build` — the page appears in `dist/sitemap.xml` automatically.
5. After deployment, request indexing of the new URL in Google Search Console.

### Changing the domain

Update `SITE_URL` in `vite.config.js`, the `Sitemap:` line in `public/robots.txt`, and the canonical link / `og:url` / `og:image` / JSON-LD `@id` and `url` values in `index.html`.

### Google Search Console

Add a domain property for `cooolinho.de` (DNS TXT verification), submit `https://cooolinho.de/sitemap.xml` under *Sitemaps*, and use *URL inspection* to confirm Google treats `https://cooolinho.de/` as canonical. Useful post-deploy checks: [Rich Results Test](https://search.google.com/test/rich-results), [Schema Markup Validator](https://validator.schema.org/), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

## 📊 GitHub Stats

The `gh stats cooolinho` section and the project counters are rendered from `src/data/github-stats.json`. If the file is missing, the page shows a placeholder. It's **not** committed as authoritative data — the checked-in copy is only a fallback for local dev — and is refreshed automatically before every deploy.

To update it locally, use the Claude Code skill (requires `gh auth login` as `cooolinho`):

```
/update-github-infos
```

or run the script directly: `npm run stats` (add `-- --dry-run` to preview without writing). Featured repos, language settings and focus detection are configured in `.claude/skills/update-github-infos/config.json`.

## 📁 Project Structure

```
cooolinho.de/
├── index.html                  # Main page (terminal layout, SEO meta tags, JSON-LD)
├── vite.config.js              # Build config + sitemap plugin
├── .github/workflows/
│   ├── deploy.yml              # Reusable build+SFTP-deploy job
│   ├── release.yml             # Runs on a pushed version tag
│   └── daily.yml               # Daily redeploy of the latest tag (cron + manual)
├── scripts/
│   ├── deploy.sh                # SFTP upload (used by CI and `npm run deploy`)
│   └── release.sh               # Tags & pushes the next version (`npm run release`)
├── docs/
│   └── DEPLOYMENT.md            # Full deployment setup & reference
├── public/                     # Copied 1:1 into /dist
│   ├── robots.txt
│   ├── favicon.ico / favicon.svg / apple-touch-icon.png
│   ├── og-image.png             # 1200×630, social media preview
│   └── foto.png                 # Portrait, used in JSON-LD (Person.image)
├── src/
│   ├── main.js                  # Typing animation, GitHub stats rendering, smooth scroll
│   ├── style.scss               # Styles (SCSS, terminal theme)
│   └── data/github-stats.json   # Generated by /update-github-infos or `npm run stats`
└── .claude/skills/update-github-infos/
    ├── SKILL.md                 # Claude Code skill
    ├── config.json              # Featured repos, languages, focus detection
    └── scripts/fetch-github-stats.mjs
```

## 📚 Documentation

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment setup and reference.
