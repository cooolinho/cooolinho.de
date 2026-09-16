<h1 align="center">🌐 cooolinho.de</h1>

<p align="center">
  <em>Persönliche Portfolio-Seite von Colin Deepe (cooolinho) — eine Terminal-gestylte Single Page mit Live-GitHub-Statistiken, gebaut mit Vite und SCSS</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="Sass">
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

<p align="center">
  <a href="README.md">🇬🇧 English version</a>
</p>

---

## 📖 Über das Projekt

Der Quellcode für [cooolinho.de](https://cooolinho.de/), ein One-Page-Portfolio im Terminal-Look. Es zeigt eine getippte `whoami`-Intro sowie live abgerufene GitHub-Aktivität (Contributions, Streaks, Heatmap, Sprachen, Featured Repos), die über einen Claude-Code-Skill geladen wird. Der Build kümmert sich selbst um SEO: strukturierte Daten, eine generierte Sitemap und automatisiertes Deployment bei jedem getaggten Release.

## 🛠️ Tech-Stack

| Technologie | Version | Zweck |
|------------|---------|---------|
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) Vite | 8.x | Frontend-Build-Tool und Dev-Server |
| ![Sass](https://img.shields.io/badge/Sass-CC6699?style=flat-square&logo=sass&logoColor=white) Sass | 1.x | SCSS-Präprozessor für das Terminal-Theme |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) GitHub Actions | — | CI: Release-Build, SFTP-Deploy, tägliches Redeploy |

## ✨ Funktionen

- **Terminal-gestylter Hero** — eine `whoami`-Tippanimation in Vanilla JS (`src/main.js`)
- **Live-GitHub-Statistiken** — Contributions, Streaks, Contribution-Heatmap, Sprachverteilung und Featured Repos, gerendert aus `src/data/github-stats.json`
- **Selbstgenerierende Sitemap** — ein eigenes Vite-Plugin scannt `dist` nach dem Build, überspringt `noindex`-Seiten und versieht jede URL mit dem Datum ihres letzten Commits
- **Tag-getriggertes Deployment** — ein gepushter Versions-Tag baut die Seite und lädt sie per SFTP hoch; ein täglicher Cron-Job deployt das aktuellste Tag erneut, nachdem die GitHub-Statistiken aktualisiert wurden

## 🚀 Erste Schritte

### Voraussetzungen

- Node.js 22 (siehe `.nvmrc`) und npm
- Optional: [GitHub CLI](https://cli.github.com) (`gh`), eingeloggt als `cooolinho` — nur nötig, um die GitHub-Statistiken lokal zu aktualisieren

### Installation

```bash
git clone https://github.com/cooolinho/cooolinho.de.git
cd cooolinho.de
npm install
```

## 📋 Verwendung

```bash
npm run dev       # Dev-Server starten (Standard: http://localhost:5173)
npm run build     # Seite nach /dist bauen, inkl. sitemap.xml
npm run preview   # Produktions-Build lokal ansehen (bedient /dist)
npm run stats     # src/data/github-stats.json aktualisieren
npm run release   # nächste Version taggen & pushen, triggert ein Deploy
npm run deploy    # /dist per SFTP hochladen (von CI genutzt, benötigt .env.deploy)
```

## 🚢 Deployment

Das Deployment läuft automatisch: Ein gepushter Versions-Tag (`npm run release`) baut die Seite und lädt sie per SFTP hoch; ein täglicher Job deployt das aktuellste Tag erneut, nachdem die GitHub-Statistiken aktualisiert wurden. Das vollständige Setup — SFTP-Zugangsdaten, GitHub-Secrets, Versionierungsschema — sowie die alltägliche Nutzung stehen in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Der Hoster muss `http://` sowie `www.cooolinho.de` mit **301** auf `https://cooolinho.de/` weiterleiten, damit es zur kanonischen URL passt.

## 🔍 SEO

### Meta-Tags & strukturierte Daten

Alles befindet sich im `<head>` von `index.html`: `title`, `description`, `robots`, kanonische URL, Favicons, Open-Graph- / X-Card-Tags sowie ein JSON-LD-`@graph` mit `WebSite`, `ProfilePage` und `Person`. Bei Inhaltsänderungen müssen diese Angaben mit der sichtbaren Seite synchron bleiben. Wird ein Bild ausgetauscht, entweder die Abmessungen beibehalten oder `og:image:width`/`og:image:height` sowie `Person.image` anpassen.

### robots.txt

`public/robots.txt` ist eine statische Datei, die unverändert nach `dist/robots.txt` kopiert wird:

```
User-agent: *
Allow: /

Sitemap: https://cooolinho.de/sitemap.xml
```

`robots.txt` steuert nur das Crawling, nicht die Indexierung — um eine Seite aus Google fernzuhalten, `<meta name="robots" content="noindex">` auf dieser Seite setzen und sie **nicht** in `robots.txt` blockieren, sonst sieht Google das `noindex` nie.

### sitemap.xml

Im Repository liegt **keine** `sitemap.xml` — sie wird bei jedem `npm run build` vom `sitemap()`-Plugin in `vite.config.js` generiert und nach `dist/sitemap.xml` geschrieben:

1. Nach dem Build (`closeBundle`) werden alle `.html`-Dateien in `/dist` gescannt.
2. Seiten mit `<meta name="robots" content="noindex">` werden übersprungen.
3. Dateipfade werden anhand von `SITE_URL` in URLs umgewandelt.
4. `<lastmod>` ist das Datum des letzten Commits, der die Quell-HTML-Datei geändert hat (`git log -1 --format=%cs`) — uncommittete Änderungen werden nicht berücksichtigt, und CI braucht `fetch-depth: 0`, sonst bekommt jede Seite das Datum des letzten Commits.

Ergebnis prüfen mit `npm run build && cat dist/sitemap.xml`, oder `npm run preview` und `http://localhost:4173/sitemap.xml` öffnen (die Sitemap steht im Dev-Server nicht zur Verfügung).

### Neue Seite hinzufügen

1. `<name>/index.html` anlegen für eine saubere URL wie `/projekte/`.
2. Als Build-Input in `vite.config.js` registrieren (Vite 8 nutzt `rolldownOptions`, nicht das veraltete `rollupOptions`) — sonst baut Vite nur `index.html`.
3. Der Seite einen eigenen SEO-`<head>` geben: `title`, `description`, kanonischer Link, `og:url` und passende Open-Graph-Tags.
4. Committen, dann `npm run build` — die Seite erscheint automatisch in `dist/sitemap.xml`.
5. Nach dem Deployment die Indexierung der neuen URL in der Google Search Console anfordern.

### Domain ändern

`SITE_URL` in `vite.config.js`, die `Sitemap:`-Zeile in `public/robots.txt` sowie kanonischer Link / `og:url` / `og:image` / JSON-LD `@id`- und `url`-Werte in `index.html` aktualisieren.

### Google Search Console

Eine Domain-Property für `cooolinho.de` anlegen (Verifizierung per DNS-TXT-Eintrag), `https://cooolinho.de/sitemap.xml` unter *Sitemaps* einreichen und mit *URL-Prüfung* bestätigen, dass Google `https://cooolinho.de/` als kanonisch behandelt. Nützliche Checks nach dem Deployment: [Rich Results Test](https://search.google.com/test/rich-results), [Schema Markup Validator](https://validator.schema.org/), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

## 📊 GitHub-Statistiken

Der Abschnitt `gh stats cooolinho` und die Projektzähler werden aus `src/data/github-stats.json` gerendert. Fehlt die Datei, zeigt die Seite einen Platzhalter. Sie wird **nicht** als verbindliche Datenquelle committet — die eingecheckte Kopie ist nur ein Fallback für die lokale Entwicklung — und vor jedem Deploy automatisch aktualisiert.

Lokal aktualisieren über den Claude-Code-Skill (erfordert `gh auth login` als `cooolinho`):

```
/update-github-infos
```

oder direkt über das Skript: `npm run stats` (mit `-- --dry-run` zur Vorschau ohne Schreiben). Featured Repos, Spracheinstellungen und Fokus-Erkennung werden in `.claude/skills/update-github-infos/config.json` konfiguriert.

## 📁 Projektstruktur

```
cooolinho.de/
├── index.html                  # Hauptseite (Terminal-Layout, SEO-Meta-Tags, JSON-LD)
├── vite.config.js              # Build-Konfiguration + Sitemap-Plugin
├── .github/workflows/
│   ├── deploy.yml              # Wiederverwendbarer Build+SFTP-Deploy-Job
│   ├── release.yml             # Läuft bei gepushtem Versions-Tag
│   └── daily.yml               # Tägliches Redeploy des aktuellsten Tags (Cron + manuell)
├── scripts/
│   ├── deploy.sh                # SFTP-Upload (von CI und `npm run deploy` genutzt)
│   └── release.sh               # Taggt & pusht die nächste Version (`npm run release`)
├── docs/
│   └── DEPLOYMENT.md            # Vollständiges Deployment-Setup & Referenz
├── public/                     # 1:1 nach /dist kopiert
│   ├── robots.txt
│   ├── favicon.ico / favicon.svg / apple-touch-icon.png
│   ├── og-image.png             # 1200×630, Social-Media-Vorschau
│   └── foto.png                 # Porträt, genutzt in JSON-LD (Person.image)
├── src/
│   ├── main.js                  # Tippanimation, GitHub-Stats-Rendering, Smooth Scroll
│   ├── style.scss               # Styles (SCSS, Terminal-Theme)
│   └── data/github-stats.json   # Generiert von /update-github-infos oder `npm run stats`
└── .claude/skills/update-github-infos/
    ├── SKILL.md                 # Claude-Code-Skill
    ├── config.json               # Featured Repos, Sprachen, Fokus-Erkennung
    └── scripts/fetch-github-stats.mjs
```

## 📚 Dokumentation

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für das vollständige Deployment-Setup und die Referenz.
