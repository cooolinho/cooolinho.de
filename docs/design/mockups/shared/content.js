// Gemeinsame Inhalte der drei Design-Mockups (Stand: index.html + src/data/github-stats.json).
// Nur für die Mockups – die Live-Seite nutzt diese Datei nicht.
window.SITE = {
    name: 'Colin Deepe',
    handle: 'cooolinho',
    role: 'Software Engineer / Fullstack Developer',
    current: 'IT-Consultant · SIMMETH SYSTEM GmbH',
    email: 'karriere@cooolinho.de',
    github: 'https://github.com/cooolinho',
    photo: '../../../../public/foto.png',
    about: [
        'Software Engineer & Fullstack Developer mit über 10 Jahren Praxis in E-Commerce und Webentwicklung. Ich entwickle skalierbare Online-Shops und Business-Anwendungen – von der Konzeption über die Umsetzung bis zum Go-live.',
        'Zu Hause bin ich in Symfony, Laravel und Shopware. Aktuell begleite ich als IT-Consultant SaaS-Implementierungen und baue eigene Anwendungen mit Laravel & Filament – zunehmend KI-gestützt mit Claude Code.',
    ],
    focus: [
        { key: 'laravel', title: 'Laravel', count: 22, text: 'Mein Framework der Wahl für neue Projekte: Laravel 13 mit Docker, Redis und Queues. Bei der VIEROL AG habe ich den Laravel-basierten Online-Shop weiterentwickelt und betreut.' },
        { key: 'filament', title: 'Filament', count: 14, text: 'Admin-Panels und interne Tools in kurzer Zeit: Filament 5 für Ressourcen, Formulare, Tabellen und Dashboards. Basis ist mein Open-Source-Starter laravel-filament-template.' },
        { key: 'claude', title: 'Claude & KI', count: 4, text: 'KI-gestützte Entwicklung im Alltag: Claude Code mit eigenen Skills und Automationen sowie GitHub Copilot CLI und LLM-Frameworks.' },
    ],
    projects: [
        { name: 'laravel-filament-template', kind: 'Open Source', url: 'https://github.com/cooolinho/laravel-filament-template', text: 'Dockerisiertes Starter-Template für Laravel 13 + Filament 5 mit MySQL, Redis und Mailpit.', tags: ['Laravel', 'Filament', 'Docker'] },
        { name: 'discord-bot-v2', kind: 'Open Source', url: 'https://github.com/cooolinho/discord-bot-v2', text: 'Self-hosted Discord-Bot: Node.js empfängt WebSocket-Events, Laravel-Queues verarbeiten sie, Filament dient als Admin-Panel.', tags: ['Node.js', 'Laravel', 'Queues'] },
        { name: 'laravel-filament-foerdertafel', kind: 'Open Source', url: 'https://github.com/cooolinho/laravel-filament-foerdertafel', text: 'Verwaltung vermietbarer Werbeflächen auf Fußballfeldern – Standorte, Spielfeld-Raster, Kunden und Vermietungen.', tags: ['Laravel', 'Filament'] },
        { name: 'laravel-my-media-library', kind: 'Open Source', url: 'https://github.com/cooolinho/laravel-my-media-library', text: 'Laravel-Anwendung mit Filament-5-Admin-Panel zur Verwaltung von Medieninhalten, komplett dockerisiert.', tags: ['Laravel', 'Filament', 'Docker'] },
        { name: 'vierol-shop.de', kind: 'Beruflich · VIEROL AG', url: 'https://vierol-shop.de', text: 'Weiterentwicklung und Betreuung des Laravel-basierten Online-Shops inklusive Code-Reviews und Tests.', tags: ['Laravel', 'Elasticsearch', 'Vue.js'] },
        { name: 'tsv-grossenkneten.de', kind: 'Ehrenamt · TSV Großenkneten', url: 'https://tsv-grossenkneten.de', text: 'Entwicklung und Betreuung des Vereins-Webauftritts, dazu Einführung und Verwaltung von M365.', tags: ['Web', 'M365', 'Content'] },
    ],
    skills: [
        { dir: 'sprachen', title: 'Sprachen', items: ['Java', 'PHP', 'JavaScript', 'TypeScript', 'Python', 'HTML/XML', 'CSS'] },
        { dir: 'frameworks', title: 'Frameworks', items: ['Laravel', 'Filament', 'Symfony', 'Shopware', 'Vue.js', 'React', 'Angular', 'Node.js', 'Spring', 'Ionic', 'Contao'] },
        { dir: 'devops', title: 'DevOps', items: ['Docker', 'Kubernetes', 'Jenkins', 'Gradle', 'SonarQube', 'Grafana', 'Jira'] },
        { dir: 'daten-business', title: 'Daten & Business', items: ['SQL', 'MySQL', 'MariaDB', 'PostgreSQL', 'NoSQL', 'ERP-/CRM-Systeme', 'Kanban', 'Scrum'] },
        { dir: 'apis', title: 'APIs', items: ['REST-API', 'Web-API', 'API-Clients', 'API-Design', 'Automation'] },
        { dir: 'tools-ki', title: 'Tools & KI', items: ['Claude Code', 'GitHub Copilot CLI', 'LLM-Frameworks', 'Git', 'GitLab', 'IntelliJ', 'M365 (Admin)'] },
    ],
    highlight: ['Laravel', 'Filament', 'Claude Code'],
    career: [
        { from: '05.2026', to: 'heute', year: '2026', title: 'IT-Consultant / SaaS Implementation', org: 'SIMMETH SYSTEM GmbH, Burghausen', points: ['Technische Begleitung von SaaS-Implementierungen bis zum erfolgreichen Go-live', 'Konzeption, Konfiguration und Anpassung an kundenspezifische Anforderungen', 'Technischer Ansprechpartner zwischen Kunden, Produktmanagement und Entwicklung'] },
        { from: '06.2023', to: '04.2026', year: '2023', side: true, title: 'Software Engineering Consultant', org: 'Colin Deepe (Web & Applications) · freiberuflich, nebenberuflich', points: ['Entwicklung und Implementierung individueller Softwarelösungen', 'Softwaretests und Identifizierung technischer Probleme', 'Zusammenarbeit mit Projektteams zur Optimierung von Entwicklungsprozessen'] },
        { from: '09.2022', to: '05.2025', year: '2022', title: 'Software Engineer', org: 'VIEROL AG, Oldenburg', points: ['Weiterentwicklung und Betreuung des Laravel-basierten Online-Shops (vierol-shop.de)', 'Code-Reviews zur Sicherstellung der Code-Qualität', 'Softwaretests und Identifizierung technischer Probleme'], stack: 'Laravel · Symfony · Elasticsearch · PHP · SQL · Vue.js · Vite · Jenkins · Jira' },
        { from: '08.2018', to: '04.2022', year: '2018', title: 'Software Engineer', org: 'hmmh multimediahaus AG, Bremen', points: ['Individuelle Entwicklung und Betreuung von Online-Shops auf Basis von Shopware 5/6', 'Code-Reviews und Softwaretests'], stack: 'Shopware 5 & 6 · Symfony · PHP · Vue.js · Twig · Magento · SQL · Vagrant' },
        { from: '01.2015', to: '07.2018', year: '2015', title: 'Webentwickler', org: 'ViCoTec Internetsysteme GmbH & Co. KG, Oldenburg', points: ['Entwicklung interner Systeme, eines Workflow-Management-Systems und mobiler Apps (Ionic)', 'Softwarelösungen für Frontend und Backend, responsive HTML-Prototypen'], stack: 'PHP · Symfony · Contao · Ionic · JavaScript · CSS' },
        { from: '01.2012', to: '01.2015', year: '2012', title: 'Ausbildung zum Fachinformatiker, Anwendungsentwicklung', org: 'Bünting E-Commerce GmbH & Co. KG, Oldenburg', points: ['Entwicklung und Wartung von mytime.de'], stack: 'PHP · CSS · JavaScript · SQL' },
        { from: '2008', to: '2012', year: '2008', title: 'Berufsfachschule Informatik & Fachgymnasium Wirtschaft', org: 'Wildeshausen', points: [] },
    ],
    volunteer: {
        title: 'IT-, Media & Content Manager',
        org: 'TSV Großenkneten + Marktausschuss',
        since: 'seit 01.2018',
        points: ['Anforderungen und Konzepte für den Verein ausarbeiten und umsetzen', 'Einführung und Verwaltung von M365 inkl. Support', 'Entwicklung und Betreuung des Webauftritts (tsv-grossenkneten.de)'],
    },
    stats: {
        contributions: 877, commits: 194, pullRequests: 12, activeDays: 128, longestStreak: 11,
        repos: 97, publicRepos: 37, stars: 99, since: 2013,
        languages: [['PHP', 47], ['Shell', 18], ['Python', 18], ['HTML', 8], ['JavaScript', 3], ['AutoHotkey', 3], ['Andere', 3]],
        heatmap: [[0,0,0,0,0,1,1],[1,2,2,1,2,1,1],[1,1,0,0,1,1,1],[1,2,0,0,0,0,0],[0,1,2,1,1,0,0],[0,0,1,2,2,1,1],[0,0,0,0,1,2,0],[0,0,0,0,0,0,1],[2,1,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,1,0],[0,0,0,0,0,0,0],[0,0,0,0,1,2,1],[2,1,0,0,0,0,0],[0,1,0,0,0,0,0],[2,2,1,2,0,3,0],[0,0,2,0,1,0,0],[0,1,1,1,1,0,0],[0,0,0,1,1,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,1,0,2],[0,0,2,2,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,0,1,0,0,0,0],[0,1,1,0,0,0,0],[0,1,1,0,0,0,0],[0,1,3,1,1,0,0],[0,0,0,0,1,2,1],[1,0,1,0,0,1,1],[1,0,2,2,0,1,1],[1,1,0,0,0,2,1],[1,2,0,0,1,0,0],[0,0,0,1,1,1,0],[0,1,1,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,0,2,2,2,2,1],[0,1,1,1,0,0,0],[1,1,1,1,2,0,2],[3,1,1,1,2,1,0],[0,0,1,0,0,1,1],[1,2,2,1,0,0,3],[4,1,2,0,1,4,4],[3,1,4,4]],
    },
};

// Hell/Dunkel: Systemeinstellung als Start, Umschalter über [data-theme-toggle]
(function () {
    const root = document.documentElement;
    root.dataset.theme = new URLSearchParams(location.search).get('theme')
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.classList.add('js');
    window.toggleTheme = () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; };
    document.addEventListener('click', (e) => { if (e.target.closest('[data-theme-toggle]')) window.toggleTheme(); });
    window.REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Blendet Elemente ein, sobald sie in den Sichtbereich kommen (.in), und ruft optional cb auf
    window.onReveal = (selector, cb) => {
        const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            io.unobserve(entry.target);
            if (cb) cb(entry.target);
        }), { threshold: 0.12 });
        document.querySelectorAll(selector).forEach((node) => io.observe(node));
    };
    window.heatmapHTML = (weeks) => `<div class="heat" role="img" aria-label="Contribution-Heatmap der letzten 12 Monate">${
        weeks.map((week, w) => week.map((level) => `<i class="l${level}" style="--w:${w}"></i>`).join('')
            + '<i class="none"></i>'.repeat(7 - week.length)).join('')}</div>`;
    window.countUp = (node) => {
        const target = Number(node.dataset.count);
        if (window.REDUCED) { node.textContent = target; return; }
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / 1400);
            node.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
})();
