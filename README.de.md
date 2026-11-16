<h1 align="center">🌐 cooolinho.de</h1>

<p align="center">
  <em>Persönliche Portfolio-Seite von Colin Deepe (cooolinho) — eine Single Page im Bento-Raster mit Hell/Dunkel-Modus und Live-GitHub-Statistiken, gebaut mit Vite und SCSS</em>
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

Der Quellcode für [cooolinho.de](https://cooolinho.de/), ein One-Page-Portfolio als animiertes Bento-Raster mit Hell- und Dunkelmodus. Es zeigt Intro, Fokus, Projekte, Skills und Werdegang sowie live abgerufene GitHub-Aktivität (Contributions, Heatmap, Sprachen, zuletzt aktualisierte Repos), die über einen Claude-Code-Skill geladen wird. Der Build kümmert sich selbst um SEO: strukturierte Daten, eine generierte Sitemap und automatisiertes Deployment bei jedem getaggten Release.

## 🛠️ Tech-Stack

| Technologie | Version | Zweck |
|------------|---------|---------|
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) Vite | 8.x | Frontend-Build-Tool und Dev-Server |
| ![Sass](https://img.shields.io/badge/Sass-CC6699?style=flat-square&logo=sass&logoColor=white) Sass | 1.x | SCSS-Präprozessor für das Bento-Theme |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) GitHub Actions | — | CI: Release-Build, SFTP-Deploy, tägliches Redeploy |

## ✨ Funktionen

- **Bento-Layout** — animierte Kacheln, Hell/Dunkel-Umschalter, Skill-Reiter und aufklappbarer Werdegang in Vanilla JS (`src/main.js`); die Inhalte bleiben auch ohne JS lesbar
- **Live-GitHub-Statistiken** — Contributions, Repos, aktive Tage, Contribution-Heatmap, Sprachverteilung und das Datum der letzten Aktualisierung auf den Projekt-Kacheln, gerendert aus `src/data/github-stats.json`
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

`og-image.png`, `favicon.ico` und `apple-touch-icon.png` werden aus `scripts/og-image/og-image.html` und `public/favicon.svg` gerendert. Nach Designänderungen mit `npx -y -p playwright@1 node scripts/og-image/render.mjs` neu erzeugen und die Bilder committen. Die Schriften liegen lokal in `src/fonts/` – es gehen keine Anfragen an Google Fonts.

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

Die GitHub-Kachel (Repos, Commits, aktive Tage, Heatmap, Sprachen), die Contributions-Kachel, die Zähler in den Fokus-Kacheln und die Datumszeile der Projekt-Kacheln werden aus `src/data/github-stats.json` gerendert. Fehlt die Datei, zeigt die Seite einen Platzhalter. Sie wird **nicht** als verbindliche Datenquelle committet — die eingecheckte Kopie ist nur ein Fallback für die lokale Entwicklung — und vor jedem Deploy automatisch aktualisiert.

Lokal aktualisieren über den Claude-Code-Skill (erfordert `gh auth login` als `cooolinho`):

```
/update-github-infos
```

oder direkt über das Skript: `npm run stats` (mit `-- --dry-run` zur Vorschau ohne Schreiben). Featured Repos, Spracheinstellungen und Fokus-Erkennung werden in `.claude/skills/update-github-infos/config.json` konfiguriert – was `featured` auf der Seite bewirkt, steht im Abschnitt „Projekte verwalten“ weiter unten.

## 🗂️ Projekte verwalten

Es gibt **keine zentrale Projektliste**. Die Kacheln im Bereich „Projekte“ werden an zwei Stellen gepflegt:

| Was | Wo | Wirkung |
|---|---|---|
| Kachel-Inhalt: Titel, Text, Label, Tags, Link, Farbe, Reihenfolge | `index.html`, Block `<!-- Projekte -->` | Genau diese Kacheln erscheinen auf der Seite, in dieser Reihenfolge. |
| Zeile „Sprache · ★ Sterne · aktualisiert am …“ | `featured` in `.claude/skills/update-github-infos/config.json` **und** `data-repo` an der Kachel | Nur Kacheln, deren `data-repo` einem Eintrag in `featured` entspricht, bekommen die Zeile. |
| Aktualität dieser Zeile | automatisch vor jedem Deployment (`npm run stats` in `deploy.yml`, auch beim täglichen Redeploy) | Lokal per `npm run stats` oder `/update-github-infos`. |

Die `featured`-Liste fügt also **keine** Kacheln hinzu. Ein Repo, das nur in `featured` steht, erscheint nicht auf der Seite. Ihre Reihenfolge und das Feld `description` haben keinen Einfluss auf die Seite – der Text kommt immer aus `index.html`.

### Projekt hinzufügen

1. In `index.html` eine Kachel im Block `<!-- Projekte -->` an der gewünschten Stelle einfügen:

   ```html
   <a class="tile proj pop" style="--d:1;--c:var(--sky)" href="https://github.com/cooolinho/mein-repo" target="_blank" rel="noopener" data-repo="mein-repo">
       <span class="icon" aria-hidden="true">M</span><span class="arrow" aria-hidden="true">→</span>
       <span class="label">Open Source</span>
       <h3>mein-repo</h3>
       <p>Ein bis zwei Sätze, worum es geht.</p>
       <span class="tags"><span>Laravel</span><span>Filament</span></span>
   </a>
   ```

   | Stelle | Bedeutung |
   |---|---|
   | `href` | Ziel des Klicks: GitHub-Repo oder Website |
   | `--c` | Farbe des Icons: `var(--lime)`, `var(--coral)`, `var(--lilac)`, `var(--sun)` oder `var(--sky)` |
   | `--d` | Einblend-Verzögerung: `0`, `1`, `2` für die erste, zweite, dritte Kachel einer Reihe (fehlt `--d`, gilt `0`) |
   | `icon` | Ein Buchstabe im farbigen Quadrat |
   | `label` | Kleine Zeile über dem Titel, z. B. „Open Source“, „Beruflich · Firma“, „Ehrenamt · Verein“ |
   | `tags` | Beliebig viele `<span>`-Schlagworte |
   | `data-repo` | Nur bei eigenen **öffentlichen** GitHub-Repos: exakter Repo-Name. Weglassen bei Websites/Kundenprojekten. |

2. Nur bei GitHub-Repos mit `data-repo`: in `.claude/skills/update-github-infos/config.json` unter `featured` einen Eintrag ergänzen:

   ```json
   { "repo": "mein-repo", "description": "Kurzbeschreibung (nur Fallback für die Stats-Datei)" }
   ```

3. Lokal `npm run stats` ausführen (oder bis zum nächsten Deployment warten) und mit `npm run dev` prüfen.

### Projekt entfernen oder umsortieren

- **Entfernen:** Kachel aus `index.html` löschen und den passenden Eintrag aus `featured` entfernen (sonst holt das Skript die Daten unnötig).
- **Umsortieren:** Kacheln in `index.html` verschieben. Danach `--d` je Dreierreihe neu vergeben (0, 1, 2).

### Stolperfallen

- `data-repo` muss genau dem Repo-Namen auf GitHub entsprechen. Groß-/Kleinschreibung ist im Skript egal, für die Zuordnung auf der Seite aber nicht – am besten exakt übernehmen.
- Private, umbenannte oder gelöschte Repos überspringt das Skript mit einer `⚠`-Warnung. Die Kachel bleibt dann ohne Datumszeile.
- Auf dem Desktop stehen drei Kacheln pro Reihe; mit einer durch 3 teilbaren Anzahl bleibt das Raster ohne Lücke.

## 📁 Projektstruktur

```
cooolinho.de/
├── index.html                  # Hauptseite (Bento-Layout, SEO-Meta-Tags, JSON-LD)
├── vite.config.js              # Build-Konfiguration + Sitemap-Plugin
├── .github/workflows/
│   ├── deploy.yml              # Wiederverwendbarer Build+SFTP-Deploy-Job
│   ├── release.yml             # Läuft bei gepushtem Versions-Tag
│   └── daily.yml               # Tägliches Redeploy des aktuellsten Tags (Cron + manuell)
├── scripts/
│   ├── og-image/                # Vorlage + Skript für og-image.png und die Icons
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
│   ├── main.js                  # Animationen, Farbumschalter, Reiter, GitHub-Stats-Rendering
│   ├── style.scss               # Styles (SCSS, Bento-Theme, Hell/Dunkel)
│   ├── _fonts.scss              # @font-face-Regeln der lokalen Schriften
│   ├── fonts/                   # Bricolage Grotesque + JetBrains Mono (woff2, OFL)
│   └── data/github-stats.json   # Generiert von /update-github-infos oder `npm run stats`
└── .claude/skills/update-github-infos/
    ├── SKILL.md                 # Claude-Code-Skill
    ├── config.json               # Featured Repos, Sprachen, Fokus-Erkennung
    └── scripts/fetch-github-stats.mjs
```

## 📚 Dokumentation

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für das vollständige Deployment-Setup und die Referenz.
