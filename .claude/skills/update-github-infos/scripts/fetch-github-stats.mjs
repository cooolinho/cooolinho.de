#!/usr/bin/env node
// Holt GitHub-Statistiken per gh CLI und schreibt sie als JSON für cooolinho.de.
// Aufruf: node fetch-github-stats.mjs [--dry-run]

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_DIR = resolve(SKILL_DIR, '../../..');
const config = JSON.parse(readFileSync(resolve(SKILL_DIR, 'config.json'), 'utf8'));
const outputPath = resolve(PROJECT_DIR, config.output);
const dryRun = process.argv.includes('--dry-run');

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

function fail(message) {
    console.error(`✖ ${message}`);
    process.exit(1);
}

function gh(args) {
    try {
        return execFileSync('gh', args, {
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
            timeout: 120_000,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            fail('gh CLI nicht gefunden – Installation: https://cli.github.com');
        }
        fail(`gh ${args.slice(0, 2).join(' ')} fehlgeschlagen:\n${error.stderr?.trim() || error.message}`);
    }
}

// --- 1. Preflight ---------------------------------------------------------

try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
} catch (error) {
    fail(error.code === 'ENOENT'
        ? 'gh CLI nicht gefunden – Installation: https://cli.github.com'
        : 'gh ist nicht eingeloggt – bitte `gh auth login` ausführen.');
}

const viewer = gh(['api', 'user', '--jq', '.login']).trim();
if (viewer.toLowerCase() !== config.login.toLowerCase()) {
    fail(`gh ist als "${viewer}" eingeloggt, erwartet wird "${config.login}" (private Summen wären sonst falsch).`);
}

// --- 2. Daten abfragen ----------------------------------------------------

const profile = JSON.parse(gh([
    'api', 'graphql', '-F', `login=${config.login}`, '-f', `query=
    query($login: String!) {
        user(login: $login) {
            createdAt
            url
            contributionsCollection {
                totalCommitContributions
                totalPullRequestContributions
                restrictedContributionsCount
                contributionCalendar {
                    totalContributions
                    weeks { contributionDays { date contributionCount contributionLevel } }
                }
            }
        }
    }`,
])).data.user;

const { composerPaths, packages, claudePaths } = config.focus;
const fileField = (alias, path, withText) =>
    `${alias}: object(expression: ${JSON.stringify(`HEAD:${path}`)}) { ${withText ? '... on Blob { text }' : 'id'} }`;

const pages = JSON.parse(gh([
    'api', 'graphql', '--paginate', '--slurp', '-f', `query=
    query($endCursor: String) {
        viewer {
            repositories(ownerAffiliations: OWNER, first: 50, after: $endCursor) {
                pageInfo { hasNextPage endCursor }
                nodes {
                    name description url isPrivate isFork stargazerCount pushedAt
                    primaryLanguage { name }
                    repositoryTopics(first: 10) { nodes { topic { name } } }
                    ${composerPaths.map((path, i) => fileField(`composer${i}`, path, true)).join('\n')}
                    ${claudePaths.map((path, i) => fileField(`claude${i}`, path, false)).join('\n')}
                }
            }
        }
    }`,
]));
const repos = pages.flatMap((page) => page.data.viewer.repositories.nodes);
const sources = repos.filter((repo) => !repo.isFork);

// --- 3. Aggregieren -------------------------------------------------------

// Contributions + Streaks
const collection = profile.contributionsCollection;
const days = collection.contributionCalendar.weeks.flatMap((week) => week.contributionDays);

let longestStreak = 0;
let run = 0;
for (const day of days) {
    run = day.contributionCount > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
}
// Heute zählt erst, wenn schon etwas passiert ist – sonst ab gestern rückwärts zählen.
let currentStreak = 0;
const lastIndex = days.at(-1)?.contributionCount > 0 ? days.length - 1 : days.length - 2;
for (let i = lastIndex; i >= 0 && days[i].contributionCount > 0; i--) {
    currentStreak++;
}

// Heatmap: Wochen mit Level 0–4, erste Woche vorne mit null auf 7 Tage aufgefüllt (So = 0)
const heatmap = collection.contributionCalendar.weeks.map((week) =>
    week.contributionDays.map((day) => LEVELS[day.contributionLevel] ?? 0));
const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
heatmap[0] = [...Array(firstWeekday).fill(null), ...heatmap[0]];

// Sprachen: Primärsprache je aktivem Repo (robust gegen eingecheckten Vendor-Code)
const cutoff = new Date();
cutoff.setFullYear(cutoff.getFullYear() - config.languages.activeYears);
const excludedLanguages = new Set(config.languages.exclude ?? []);
const languageCounts = new Map();
for (const repo of sources) {
    if (repo.primaryLanguage && !excludedLanguages.has(repo.primaryLanguage.name) && new Date(repo.pushedAt) >= cutoff) {
        const name = repo.primaryLanguage.name;
        languageCounts.set(name, (languageCounts.get(name) ?? 0) + 1);
    }
}
const activeRepoCount = [...languageCounts.values()].reduce((sum, count) => sum + count, 0);
const sortedLanguages = [...languageCounts].sort((a, b) => b[1] - a[1]);
const toLanguage = (name, count) => ({ name, repos: count, percent: Math.round((count / activeRepoCount) * 100) });
const languages = sortedLanguages.slice(0, config.languages.top).map(([name, count]) => toLanguage(name, count));
const otherCount = sortedLanguages.slice(config.languages.top).reduce((sum, [, count]) => sum + count, 0);
if (otherCount > 0) {
    languages.push(toLanguage('Andere', otherCount));
}

// Fokus: echte Abhängigkeiten in composer.json bzw. vorhandene Claude-Dateien
function composerRequires(repo) {
    const required = new Set();
    composerPaths.forEach((_, i) => {
        const text = repo[`composer${i}`]?.text;
        if (!text) return;
        try {
            const composer = JSON.parse(text);
            Object.keys({ ...composer.require, ...composer['require-dev'] }).forEach((pkg) => required.add(pkg));
        } catch {
            // Ungültige composer.json ignorieren
        }
    });
    return required;
}

const focus = {};
const countFocus = (key, matches) => {
    const hits = sources.filter(matches);
    focus[key] = { total: hits.length, public: hits.filter((repo) => !repo.isPrivate).length };
};
for (const [key, pkg] of Object.entries(packages)) {
    countFocus(key, (repo) => composerRequires(repo).has(pkg));
}
countFocus('claude', (repo) => claudePaths.some((_, i) => repo[`claude${i}`]));

// Featured: nur öffentliche Repos, GitHub-Beschreibung vor Fallback
const featured = [];
for (const entry of config.featured) {
    const repo = repos.find((candidate) => candidate.name.toLowerCase() === entry.repo.toLowerCase());
    if (!repo) {
        console.warn(`⚠ Featured-Repo "${entry.repo}" nicht gefunden (umbenannt oder gelöscht?) – übersprungen.`);
        continue;
    }
    if (repo.isPrivate) {
        console.warn(`⚠ Featured-Repo "${entry.repo}" ist privat – übersprungen.`);
        continue;
    }
    featured.push({
        name: repo.name,
        url: repo.url,
        description: repo.description || entry.description || '',
        language: repo.primaryLanguage?.name ?? null,
        stars: repo.stargazerCount,
        pushedAt: repo.pushedAt.slice(0, 10),
        topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
    });
}

const stats = {
    generatedAt: new Date().toISOString(),
    profile: {
        login: config.login,
        url: profile.url,
        memberSince: profile.createdAt.slice(0, 10),
    },
    contributions: {
        total: collection.contributionCalendar.totalContributions,
        commits: collection.totalCommitContributions,
        pullRequests: collection.totalPullRequestContributions,
        private: collection.restrictedContributionsCount,
        activeDays: days.filter((day) => day.contributionCount > 0).length,
        currentStreak,
        longestStreak,
    },
    repos: {
        total: repos.length,
        public: repos.filter((repo) => !repo.isPrivate).length,
        sources: sources.length,
        publicSources: sources.filter((repo) => !repo.isPrivate).length,
        stars: sources.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    },
    focus,
    languages,
    featured,
    heatmap: { start: days[0].date, end: days.at(-1).date, weeks: heatmap },
};

// --- 4. Datenschutz-Guard -------------------------------------------------

const privateNames = repos.filter((repo) => repo.isPrivate).map((repo) => repo.name);
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const privatePattern = privateNames.length
    ? new RegExp(`(?<![\\w.-])(${privateNames.map(escape).join('|')})(?![\\w.-])`, 'i')
    : null;

function collectStrings(value) {
    if (typeof value === 'string') return [value];
    if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
    return [];
}

const leak = privatePattern && collectStrings(stats).find((text) => privatePattern.test(text));
if (leak) {
    fail(`Datenschutz-Guard: Ausgabe enthält den Namen eines privaten Repos ("${leak.match(privatePattern)[0]}") – nichts geschrieben.`);
}

// --- 5. Vergleich + Ausgabe -----------------------------------------------

// Zahlen-Arrays (Heatmap-Wochen) einzeilig halten → kompakte, diff-freundliche Datei
const json = `${JSON.stringify(stats, null, 2)
    .replace(/\[\s+((?:(?:-?\d+|null),\s+)*(?:-?\d+|null))\s+\]/g, (_, items) => `[${items.split(/,\s+/).join(', ')}]`)}\n`;

const previous = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf8')) : null;
const metrics = [
    ['Contributions (12 Monate)', (s) => s.contributions.total],
    ['  davon Commits', (s) => s.contributions.commits],
    ['  davon Pull Requests', (s) => s.contributions.pullRequests],
    ['  davon privat', (s) => s.contributions.private],
    ['Aktive Tage', (s) => s.contributions.activeDays],
    ['Aktuelle Streak', (s) => s.contributions.currentStreak, { streak: true }],
    ['Längste Streak', (s) => s.contributions.longestStreak, { streak: true }],
    ['Eigene Repos (ohne Forks)', (s) => s.repos.sources],
    ['  davon öffentlich', (s) => s.repos.publicSources],
    ['Stars', (s) => s.repos.stars],
    ['Laravel-Projekte', (s) => s.focus.laravel?.total],
    ['Filament-Projekte', (s) => s.focus.filament?.total],
    ['Claude-Projekte', (s) => s.focus.claude?.total],
    ['Featured-Repos', (s) => s.featured.length],
];

const rows = metrics.map(([label, pick, options = {}]) => {
    const now = pick(stats);
    const before = previous ? pick(previous) : undefined;
    const delta = before === undefined ? '' : now - before === 0 ? '±0' : `${now - before > 0 ? '+' : ''}${now - before}`;
    const dropped = !options.streak && before > 0 && now < before * 0.8;
    return `${label.padEnd(28)}${String(before ?? '–').padStart(6)}${String(now).padStart(6)}  ${delta}${dropped ? '  ⚠ starker Rückgang' : ''}`;
});

console.log(`${'Kennzahl'.padEnd(28)}${'alt'.padStart(6)}${'neu'.padStart(6)}  Δ`);
console.log(rows.join('\n'));
console.log(`\nTop-Sprachen: ${languages.map((l) => `${l.name} ${l.percent}%`).join(', ')}`);

if (dryRun) {
    console.log('\n--dry-run: keine Datei geschrieben. Ergebnis:\n');
    console.log(json);
} else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, json);
    console.log(`\n✔ ${relative(PROJECT_DIR, outputPath)} geschrieben.`);
}
