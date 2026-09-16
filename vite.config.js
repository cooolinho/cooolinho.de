import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig } from 'vite';

const SITE_URL = 'https://cooolinho.de';

// Erzeugt beim Build dist/sitemap.xml aus allen gebauten HTML-Seiten.
// Neue Seiten (z. B. projekte/index.html → /projekte/) landen automatisch darin,
// Seiten mit <meta name="robots" content="noindex"> werden ausgelassen.
function sitemap() {
  let config;

  const htmlFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

  // Datum des letzten Commits der Quelldatei – ohne Git-Historie entfällt <lastmod>
  const lastmod = (file) => {
    try {
      return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: config.root, encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  };

  return {
    name: 'sitemap',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle() {
      const outDir = join(config.root, config.build.outDir);
      const urls = htmlFiles(outDir)
        .filter((file) => !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(readFileSync(file, 'utf8')))
        .map((file) => relative(outDir, file).split('\\').join('/'))
        .sort()
        .map((page) => {
          const loc = `${SITE_URL}/${page.replace(/(^|\/)index\.html$/, '$1')}`;
          const date = lastmod(page);
          return `  <url>\n    <loc>${loc}</loc>\n${date ? `    <lastmod>${date}</lastmod>\n` : ''}  </url>`;
        });

      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      );
    },
  };
}

export default defineConfig({
  plugins: [sitemap()],
  server: {
    host: true,
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
});
