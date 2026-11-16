# Schriften

Lokal eingebunden statt über Google Fonts, damit beim Seitenaufruf keine Anfragen an Dritte gehen. Die `@font-face`-Regeln stehen in `src/_fonts.scss`; Vite versieht die Dateien beim Build mit einem Hash.

| Datei | Familie | Zeichensatz | Achsen |
|---|---|---|---|
| `bricolage-grotesque-latin.woff2` | Bricolage Grotesque (v9) | latin | `wght` 400–800, `opsz` 12–96 |
| `bricolage-grotesque-latin-ext.woff2` | Bricolage Grotesque (v9) | latin-ext | wie oben |
| `jetbrains-mono-latin.woff2` | JetBrains Mono (v24) | latin | `wght` 400–700 |
| `jetbrains-mono-latin-ext.woff2` | JetBrains Mono (v24) | latin-ext | wie oben |

Quelle: Google Fonts (woff2, Stand 16.11.2026). Beide Schriften stehen unter der SIL Open Font License 1.1, siehe `OFL-BricolageGrotesque.txt` und `OFL-JetBrainsMono.txt`.

**Aktualisieren:** Die CSS-Datei von `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=JetBrains+Mono:wght@400;700&display=swap` mit einem aktuellen Browser-User-Agent abrufen, die `latin`- und `latin-ext`-Dateien herunterladen und hier unter denselben Namen ablegen. Ändert sich ein `unicode-range`, ihn in `src/_fonts.scss` nachziehen.
