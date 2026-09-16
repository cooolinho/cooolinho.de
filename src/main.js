import './style.scss';

// Vom Skill /update-github-infos erzeugt – fehlt die Datei, bleibt der Platzhalter stehen
const statsModules = import.meta.glob('./data/github-stats.json', { eager: true, import: 'default' });
const stats = Object.values(statsModules)[0];

const textToType = "whoami";
const typingElement = document.getElementById('typing-text');
const heroOutput = document.getElementById('hero-output');

let index = 0;

function typeWriter() {
    if (index < textToType.length) {
        typingElement.textContent += textToType.charAt(index);
        index++;
        setTimeout(typeWriter, 120); // Geschwindigkeit
    } else {
        heroOutput.classList.add('visible');
    }
}

// --- GitHub-Statistiken ---------------------------------------------------

const formatDate = (value) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(value));
const formatDateTime = (value) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

// Elemente immer über textContent befüllen – Repo-Beschreibungen kommen von außen
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function statLine(key, parts) {
    const line = el('p', 'stat-line');
    line.append(el('span', 'stat-key', key));
    parts.forEach(([value, label], i) => {
        if (i > 0) line.append(el('span', 'muted', ' · '));
        line.append(el('span', 'stat-value', String(value)), ` ${label}`);
    });
    return line;
}

function renderHeatmap({ start, end, weeks }) {
    const heatmap = el('div', 'heatmap');
    const grid = el('div', 'heatmap-grid');
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', `Contribution-Heatmap vom ${formatDate(start)} bis ${formatDate(end)}`);
    weeks.flat().forEach((level) => {
        grid.append(el('span', level === null ? 'cell empty' : `cell level-${level}`));
    });

    const legend = el('p', 'heatmap-legend');
    legend.append(`${formatDate(start)} – ${formatDate(end)}`, el('span', 'legend-scale', 'weniger '));
    [0, 1, 2, 3, 4].forEach((level) => legend.lastChild.append(el('span', `cell level-${level}`)));
    legend.lastChild.append(' mehr');

    heatmap.append(grid, legend);
    return heatmap;
}

function renderLanguages(languages) {
    const list = el('ul', 'lang-list');
    const width = Math.max(...languages.map((language) => language.name.length));
    languages.forEach(({ name, percent }) => {
        const filled = Math.round(percent / 5);
        const item = el('li');
        item.append(
            el('span', 'lang-name', name.padEnd(width)),
            el('span', 'bar', ` ${'█'.repeat(filled)}${'░'.repeat(20 - filled)} `),
            `${percent}%`,
        );
        list.append(item);
    });
    return list;
}

function renderFeatured(featured) {
    const list = el('ul', 'repo-list');
    featured.forEach((repo) => {
        const link = el('a', null, repo.name);
        link.href = repo.url;
        link.target = '_blank';
        link.rel = 'noopener';

        const meta = [repo.language, `★ ${repo.stars}`, `aktualisiert ${formatDate(repo.pushedAt)}`].filter(Boolean).join(' · ');
        const head = el('p', 'repo-head');
        head.append(el('span', 'perm', '-rw-r--r--'), link, el('span', 'repo-meta', meta));

        const item = el('li', 'repo');
        item.append(head);
        if (repo.description) item.append(el('p', 'repo-desc', repo.description));
        if (repo.topics.length) item.append(el('p', 'repo-topics', repo.topics.map((topic) => `#${topic}`).join(' ')));
        list.append(item);
    });
    return list;
}

function renderGithubStats(container, { contributions, repos, profile, languages, featured, heatmap, generatedAt }) {
    const heading = (text) => el('p', 'stats-heading', `# ${text}`);

    const updated = el('p', 'stats-updated', `zuletzt aktualisiert: ${formatDateTime(generatedAt)} · `);
    const profileLink = el('a', null, 'Profil ansehen');
    profileLink.href = profile.url;
    profileLink.target = '_blank';
    profileLink.rel = 'noopener';
    updated.append(profileLink);

    container.replaceChildren(
        heading('Contributions – letzte 12 Monate'),
        statLine('contributions', [[contributions.total, 'gesamt'], [contributions.commits, 'Commits'], [contributions.pullRequests, 'Pull Requests'], [contributions.private, 'privat']]),
        statLine('streak', [[contributions.currentStreak, 'Tage aktuell'], [contributions.longestStreak, 'Tage längste'], [contributions.activeDays, 'aktive Tage']]),
        renderHeatmap(heatmap),
        heading('Repositories'),
        statLine('repos', [[repos.sources, 'eigene'], [repos.publicSources, 'öffentlich'], [repos.stars, 'Stars']]),
        statLine('seit', [[new Date(profile.memberSince).getFullYear(), 'auf GitHub']]),
        heading('Sprachen – Primärsprache aktiver Repos'),
        renderLanguages(languages),
        heading('Featured'),
        renderFeatured(featured),
        updated,
    );
}

function renderFocusCounts(focus) {
    document.querySelectorAll('[data-focus]').forEach((node) => {
        const total = focus[node.dataset.focus]?.total;
        if (!total) return;
        node.textContent = `› ${total} ${total === 1 ? 'Projekt' : 'Projekte'} auf GitHub`;
        node.hidden = false;
    });
}

if (stats) {
    renderGithubStats(document.getElementById('github-stats'), stats);
    renderFocusCounts(stats.focus);
}

window.addEventListener('load', () => {
    typeWriter();

    // Einfacher Smooth Scroll für Anker-Links (falls vorhanden)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
