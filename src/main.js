import './style.scss';

// Vom Skill /update-github-infos erzeugt – fehlt die Datei, bleibt der Platzhalter stehen
const statsModules = import.meta.glob('./data/github-stats.json', { eager: true, import: 'default' });
const stats = Object.values(statsModules)[0];

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover)').matches;

const formatDate = (value) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(value));
const formatDateTime = (value) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Elemente immer über textContent befüllen – Repo-Daten kommen von außen
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// --- Farbmodus ------------------------------------------------------------

function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch { /* privater Modus: Wahl gilt nur für diesen Besuch */ }
}

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
});

// --- Zähler und Einblenden ------------------------------------------------

function countUp(node) {
    const target = Number(node.dataset.count);
    if (reducedMotion || !Number.isFinite(target)) {
        node.textContent = String(node.dataset.count);
        return;
    }
    const start = performance.now();
    const tick = (now) => {
        const t = Math.min(1, (now - start) / 1400);
        node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function revealOnScroll() {
    const tiles = document.querySelectorAll('.pop');
    const show = (node) => {
        node.classList.add('in');
        node.querySelectorAll('[data-count]').forEach(countUp);
    };
    if (!('IntersectionObserver' in window)) {
        tiles.forEach(show);
        return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        show(entry.target);
    }), { threshold: 0.12 });
    tiles.forEach((tile) => observer.observe(tile));
}

// --- Start: wechselnde Zeile und Terminal ---------------------------------

function rotateHeroLine() {
    const target = document.getElementById('swap');
    const lines = ['Ich baue Online-Shops.', 'Ich baue Admin-Panels.', 'Ich baue Business-Apps.', 'Ich baue mit Claude Code.'];
    if (!target || reducedMotion) return;
    let index = 0;
    setInterval(() => {
        index = (index + 1) % lines.length;
        target.replaceChildren(el('span', null, lines[index]));
    }, 2600);
}

async function typeTerminal() {
    const term = document.getElementById('term');
    if (!term || reducedMotion) return;
    const script = [
        ['whoami', 'colin deepe · software engineer'],
        ['cat focus.md', 'laravel · filament · claude code'],
        ['uptime', 'up 10+ years, load: shops, saas, tools'],
    ];
    const prompt = (text, caret) => {
        const line = el('p');
        line.append(el('span', 'p', '❯'), text);
        if (caret) line.append(el('span', 'caret'));
        return line;
    };
    const render = (done, typing) => term.replaceChildren(
        ...done.flatMap(([cmd, out]) => [prompt(cmd), el('p', 'o', out)]),
        prompt(typing, true),
    );
    term.setAttribute('aria-hidden', 'true'); // Animation nicht vorlesen
    for (;;) {
        for (let i = 0; i < script.length; i++) {
            for (let c = 0; c <= script[i][0].length; c++) {
                render(script.slice(0, i), script[i][0].slice(0, c));
                await wait(70);
            }
            await wait(350);
            render(script.slice(0, i + 1), '');
            await wait(900);
        }
        await wait(2600);
    }
}

// --- Skills: Reiter und Laufband ------------------------------------------

function initSkillTabs() {
    const box = document.querySelector('.skills');
    const tabList = box?.querySelector('.tabs');
    if (!tabList) return;
    const groups = [...box.querySelectorAll('.skill-group')];

    const select = (index, focus = false) => {
        groups.forEach((group, i) => { group.hidden = i !== index; });
        tabList.querySelectorAll('button').forEach((tab, i) => {
            tab.setAttribute('aria-selected', String(i === index));
            tab.tabIndex = i === index ? 0 : -1;
            if (i === index && focus) tab.focus();
        });
        // Chips neu animieren
        groups[index].querySelectorAll('li').forEach((chip, i) => {
            chip.style.setProperty('--i', i);
            chip.style.animation = 'none';
            void chip.offsetWidth;
            chip.style.animation = '';
        });
    };

    groups.forEach((group, i) => {
        group.id = `skills-${i}`;
        group.setAttribute('role', 'tabpanel');
        group.setAttribute('aria-labelledby', `skills-tab-${i}`);
        const tab = el('button', null, group.dataset.tabTitle);
        tab.type = 'button';
        tab.id = `skills-tab-${i}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', group.id);
        tab.addEventListener('click', () => select(i));
        tabList.append(tab);
    });

    tabList.addEventListener('keydown', (event) => {
        const current = groups.findIndex((group) => !group.hidden);
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        select((current + step + groups.length) % groups.length, true);
    });

    tabList.hidden = false;
    box.classList.add('tabbed');
    select(Math.max(0, groups.findIndex((group) => 'default' in group.dataset)));
}

function buildTicker() {
    const ticker = document.getElementById('ticker');
    if (!ticker) return;
    const skills = [...document.querySelectorAll('.skills .chips li')];
    const half = Math.ceil(skills.length / 2);
    [skills.slice(0, half), skills.slice(half)].forEach((items) => {
        const row = el('div');
        // zweimal hintereinander, damit das Laufband nahtlos schleift
        [...items, ...items].forEach((item) => row.append(el('span', `chip${item.classList.contains('hl') ? ' hl' : ''}`, item.textContent)));
        ticker.append(row);
    });
}

// --- Werdegang ------------------------------------------------------------

function initCareerToggle() {
    const button = document.getElementById('career-toggle');
    const items = [...document.querySelectorAll('.career details')];
    if (!button) return;
    const update = () => {
        button.textContent = items.every((item) => item.open) ? 'Alle zuklappen' : 'Alle aufklappen';
    };
    button.addEventListener('click', () => {
        const open = !items.every((item) => item.open);
        items.forEach((item) => { item.open = open; });
        update();
    });
    items.forEach((item) => item.addEventListener('toggle', update));
}

// --- GitHub-Statistiken ---------------------------------------------------

const LANGUAGE_COLORS = ['var(--violet)', 'var(--coral)', 'var(--lime)', 'var(--sun)', 'var(--sky)', '#ff9ecb', 'var(--muted)'];

function renderHeatmap({ start, end, weeks }) {
    const grid = el('div', 'heat');
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', `Contribution-Heatmap vom ${formatDate(start)} bis ${formatDate(end)}`);
    weeks.forEach((week, w) => {
        week.forEach((level) => {
            const cell = el('i', level === null ? 'none' : `l${level}`);
            cell.style.setProperty('--w', w);
            grid.append(cell);
        });
        for (let i = week.length; i < 7; i++) grid.append(el('i', 'none'));
    });
    return grid;
}

function renderLanguages(languages) {
    const bar = el('div', 'lang-stack');
    const legend = el('ul', 'lang-legend');
    bar.setAttribute('aria-hidden', 'true');
    languages.forEach(({ name, percent }, i) => {
        const color = LANGUAGE_COLORS[i % LANGUAGE_COLORS.length];
        const part = el('i');
        part.style.setProperty('--p', `${percent}%`);
        part.style.setProperty('--c', color);
        bar.append(part);

        const dot = el('i');
        dot.style.setProperty('--c', color);
        const item = el('li');
        item.append(dot, `${name} ${percent} %`);
        legend.append(item);
    });
    return [bar, legend];
}

function renderGithubStats(container, { contributions, repos, profile, languages, heatmap, generatedAt }) {
    const row = el('div', 'gh-row');
    [[repos.sources, 'eigene Repos'], [contributions.commits, 'Commits'], [contributions.activeDays, 'aktive Tage']].forEach(([value, label]) => {
        const cell = el('div');
        const number = el('b', null, String(value));
        number.dataset.count = value;
        cell.append(number, el('span', null, label));
        row.append(cell);
    });

    const updated = el('p', 'updated', `Stand: ${formatDateTime(generatedAt)} · `);
    const profileLink = el('a', null, 'Profil ansehen');
    profileLink.href = profile.url;
    profileLink.target = '_blank';
    profileLink.rel = 'noopener';
    updated.append(profileLink);

    container.replaceChildren(row, renderHeatmap(heatmap), ...renderLanguages(languages), updated);
}

function renderContributionTile(contributions) {
    const tile = document.getElementById('num-github');
    if (!tile) return;
    const value = el('p', 'value', String(contributions.total));
    value.dataset.count = contributions.total;
    tile.replaceChildren(el('p', 'label', 'GitHub'), value, el('p', null, 'Contributions in 12 Monaten'));
}

function renderFocusCounts(focus) {
    document.querySelectorAll('[data-focus]').forEach((node) => {
        const total = focus[node.dataset.focus]?.total;
        if (!total) return;
        node.textContent = `${total} ${total === 1 ? 'Projekt' : 'Projekte'} auf GitHub`;
        node.hidden = false;
    });
}

// Projekt-Kacheln mit „zuletzt aktualisiert“ aus den Featured-Repos ergänzen
function renderProjectMeta(featured) {
    featured.forEach((repo) => {
        const tile = document.querySelector(`[data-repo="${CSS.escape(repo.name)}"]`);
        if (!tile) return;
        const meta = [repo.language, repo.stars ? `★ ${repo.stars}` : null, `aktualisiert ${formatDate(repo.pushedAt)}`].filter(Boolean).join(' · ');
        tile.querySelector('p')?.after(el('p', 'meta', meta));
    });
}

// --- Kontakt --------------------------------------------------------------

function initCopyMail() {
    const button = document.getElementById('copy-mail');
    if (!button || !navigator.clipboard) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(button.dataset.mail);
            button.textContent = 'Kopiert ✓';
        } catch {
            button.textContent = button.dataset.mail;
        }
        setTimeout(() => { button.textContent = 'Adresse kopieren'; }, 1800);
    });
}

// --- Kacheln kippen zur Maus ----------------------------------------------

function initTilt() {
    if (!canHover || reducedMotion) return;
    document.querySelectorAll('.tile').forEach((tile) => {
        tile.addEventListener('pointermove', (event) => {
            const box = tile.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width;
            const y = (event.clientY - box.top) / box.height;
            const max = Math.min(5, 1800 / box.width); // breite Kacheln kippen weniger
            tile.style.setProperty('--mx', `${x * 100}%`);
            tile.style.setProperty('--my', `${y * 100}%`);
            tile.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
            tile.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
        });
        tile.addEventListener('pointerleave', () => {
            tile.style.setProperty('--rx', '0deg');
            tile.style.setProperty('--ry', '0deg');
        });
    });
}

// --- Start ----------------------------------------------------------------

if (stats) {
    renderGithubStats(document.getElementById('github-stats'), stats);
    renderContributionTile(stats.contributions);
    renderFocusCounts(stats.focus);
    renderProjectMeta(stats.featured);
}

document.getElementById('year').textContent = String(new Date().getFullYear());
initSkillTabs();
buildTicker();
initCareerToggle();
initCopyMail();
initTilt();
revealOnScroll();
rotateHeroLine();
typeTerminal();
