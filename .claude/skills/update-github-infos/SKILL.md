---
name: update-github-infos
description: Aktualisiert die GitHub-Statistiken von cooolinho.de (Contributions, Sprachen, Featured-Repos) per gh CLI und schreibt src/data/github-stats.json.
argument-hint: "[--dry-run]"
disable-model-invocation: true
effort: low
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/fetch-github-stats.mjs) Bash(node ${CLAUDE_SKILL_DIR}/scripts/fetch-github-stats.mjs *) Bash(npm run build) Read
---

# GitHub-Infos aktualisieren

Aktualisiert `src/data/github-stats.json`. Daraus rendert die Website den Abschnitt `gh stats cooolinho` und die Zähler in den Fokus-Karten. Die gesamte Datenlogik steckt im Script – Abfragen **nicht** selbst per `gh api` nachbauen.

## Ablauf

1. **Script ausführen** (dauert ca. 20 Sekunden):
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/fetch-github-stats.mjs $ARGUMENTS
   ```
   Einziges gültiges Argument ist `--dry-run`. Andere Argumente weglassen und den Nutzer darauf hinweisen.

2. **Bei Exit-Code ≠ 0 abbrechen.** Die `✖`-Zeile wörtlich zeigen und die passende Lösung aus [Fehlerbehebung](#fehlerbehebung) nennen. Keine Workarounds – vor allem `github-stats.json` nie von Hand schreiben.

3. **Ausgabe prüfen.** `⚠`-Zeilen (übersprungene Featured-Repos, starker Rückgang) hervorheben und kurz einordnen. Bei `--dry-run` hier mit einer kurzen Zusammenfassung enden – kein Build.

4. **Build prüfen:** `npm run build`. Bei Fehlern die relevante Meldung zeigen.

5. **Bericht** (kurz, auf Deutsch):
   - Tabelle der geänderten Kennzahlen (alt → neu, Δ) aus der Script-Ausgabe; beim ersten Lauf alle
   - Top-Sprachen
   - Warnungen
   - Build-Status
   - Hinweis, dass nichts committet wurde, mit Vorschlag:
     `git add src/data/github-stats.json && git commit -m "chore: GitHub-Stats aktualisieren"`

Niemals selbst committen oder pushen.

## Anpassen

Alles Konfigurierbare steht in [config.json](config.json):

- `featured` – Reihenfolge und Auswahl der Projekte, `description` ist Fallback, wenn das Repo auf GitHub keine Beschreibung hat
- `languages` – Zeitraum aktiver Repos (`activeYears`), Anzahl (`top`), Ausschlüsse (`exclude`)
- `focus` – Pfade zu `composer.json`/`CLAUDE.md` und Pakete für die Laravel-/Filament-/Claude-Erkennung

Änderungswünsche dort umsetzen und anschließend mit `--dry-run` testen.

## Fehlerbehebung

| Meldung | Lösung |
|---|---|
| `gh CLI nicht gefunden` | gh installieren: https://cli.github.com |
| `gh ist nicht eingeloggt` | Nutzer führt `gh auth login` selbst aus (interaktiv) |
| `gh ist als "…" eingeloggt, erwartet wird "cooolinho"` | `gh auth switch --user cooolinho` |
| `API rate limit exceeded` oder Timeout | Einige Minuten warten und erneut ausführen |
| `Featured-Repo … nicht gefunden` | Repo umbenannt/gelöscht – Eintrag in `config.json` anpassen |
| `Featured-Repo … ist privat` | Repo veröffentlichen oder aus `config.json` entfernen |
| `Datenschutz-Guard` | Eine Beschreibung (GitHub oder `config.json`) nennt ein privates Repo – Text ändern. Den Guard nie umgehen. |
