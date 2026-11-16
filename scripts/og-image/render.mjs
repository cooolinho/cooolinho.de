// Erzeugt public/og-image.png aus og-image.html sowie
// public/apple-touch-icon.png und public/favicon.ico aus public/favicon.svg.
//
// Nur bei Designänderungen nötig – die Bilder sind eingecheckt, Build und
// Deployment brauchen dieses Skript nicht. Playwright ist deshalb bewusst keine
// Abhängigkeit in package.json. Aufruf (lädt Playwright bei Bedarf temporär):
//
//   npx -y -p playwright@1 node scripts/og-image/render.mjs
//
// Falls noch kein Browser installiert ist: npx -y playwright@1 install chromium

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const publicDir = join(root, 'public');

// Playwright aus dem aktuellen Verzeichnis oder global (npx -p) auflösen
const require = createRequire(join(process.cwd(), 'noop.js'));
let chromium;
try {
    ({ chromium } = require('playwright'));
} catch {
    console.error('✖ Playwright nicht gefunden. Aufruf: npx -y -p playwright@1 node scripts/og-image/render.mjs');
    process.exit(1);
}

// ICO-Container mit eingebetteten PNGs (von allen aktuellen Browsern unterstützt)
function buildIco(pngs) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(pngs.length, 4);
    let offset = 6 + pngs.length * 16;
    const entries = pngs.map(({ size, data }) => {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size >= 256 ? 0 : size, 0);
        entry.writeUInt8(size >= 256 ? 0 : size, 1);
        entry.writeUInt16LE(1, 4); // Farbebenen
        entry.writeUInt16LE(32, 6); // Bit pro Pixel
        entry.writeUInt32LE(data.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += data.length;
        return entry;
    });
    return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]);
}

const browser = await chromium.launch();
try {
    // OG-Bild
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await og.goto(pathToFileURL(join(here, 'og-image.html')).href, { waitUntil: 'networkidle' });
    await og.evaluate(() => document.fonts.ready);
    await og.screenshot({ path: join(publicDir, 'og-image.png') });
    console.log('✔ public/og-image.png');

    // Icons aus favicon.svg rendern
    const svg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8');
    const render = async (size, square) => {
        const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
        // Apple-Touch-Icon ohne eigene Rundung: iOS schneidet selbst zu
        const markup = square ? svg.replace(/rx="[\d.]+"/, 'rx="0"') : svg;
        await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
        const data = await page.screenshot({ omitBackground: !square });
        await page.close();
        return data;
    };

    writeFileSync(join(publicDir, 'apple-touch-icon.png'), await render(180, true));
    console.log('✔ public/apple-touch-icon.png');

    writeFileSync(join(publicDir, 'favicon.ico'), buildIco([
        { size: 16, data: await render(16, false) },
        { size: 32, data: await render(32, false) },
        { size: 48, data: await render(48, false) },
    ]));
    console.log('✔ public/favicon.ico');
} finally {
    await browser.close();
}
