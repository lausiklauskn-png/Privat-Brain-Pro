// End-to-end proof: launch the REAL app in Chromium, sign real files, search.
// Verifies the "Bedeutung schlägt Name" claim + dedupe + PDF text + speed.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html', '.json':'application/json', '.js':'text/javascript', '.png':'image/png' };

// tiny static server
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const buf = await readFile(join(ROOT, p));
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const URLROOT = `http://127.0.0.1:${PORT}/index.html`;

// --- make real test files (a "signing corpus") ---
const dir = await mkdtemp(join(tmpdir(), 'cb-'));
// image-like filename, but content is a car spec — name search for "auto" must MISS this
await writeFile(join(dir, 'IMG_4821.txt'),
  'Fahrzeug-Aufnahme: schwarzes Auto, frisch lackiert. Radstand 2820 mm. Marke Mueller. Bearbeitet am 2026-07-10.');
await writeFile(join(dir, 'notiz.txt'),
  'Einkaufsliste: Milch, Brot, Kaffee. Nichts mit Fahrzeugen.');
await writeFile(join(dir, 'Auto-Werbung.txt'),
  'Prospekt Text ueber ein rotes Cabrio.'); // has "auto" in NAME only
// a minimal uncompressed PDF with a text object (tests the PDF extractor path)
const pdf = [
  '%PDF-1.4',
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R>>endobj',
  '4 0 obj<</Length 74>>',
  'stream',
  'BT /F1 12 Tf 72 800 Td (Rechnung Nr 2024-88 Betrag 499 EUR Mueller GmbH) Tj ET',
  'endstream endobj',
  'trailer<</Root 1 0 R>>',
  '%%EOF'
].join('\n');
await writeFile(join(dir, 'scan_0007.pdf'), pdf);

const files = ['IMG_4821.txt','notiz.txt','Auto-Werbung.txt','scan_0007.pdf'].map(f => join(dir, f));

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(m.text()));
page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); });
await page.goto(URLROOT, { waitUntil: 'load' });

let pass = 0, fail = 0;
const ok = (name, cond, extra='') => { (cond?pass++:fail++); console.log(`${cond?'✅':'❌'} ${name}${extra?'  '+extra:''}`); };

// 1) sign the files via the real file input
await page.setInputFiles('#fileInput', files);
await page.waitForFunction(() => window.CATALOG === undefined ? false : true, { timeout: 3000 }).catch(()=>{});
// wait until signing done: CATALOG length 4 (access via closure isn't global — read DOM/toast instead)
await page.waitForFunction(() => document.querySelector('#stFiles') && document.querySelector('#stFiles').textContent === '4', { timeout: 15000 });
const nFiles = await page.textContent('#stFiles');
ok('4 Dateien signiert', nFiles === '4', `(stFiles=${nFiles})`);

// helper to run a search and read results
async function doSearch(mode, query) {
  await page.click(`#mode button[data-m="${mode}"]`);
  await page.fill('#q', query);
  await page.waitForTimeout(120);
  return page.$$eval('#results .card .fname', els => els.map(e => e.textContent.trim()));
}

// 2) NAME search "auto" -> only "Auto-Werbung.txt" (name contains auto); must MISS IMG_4821
const nameHits = await doSearch('name', 'auto');
ok('Namenssuche "auto" findet nur Datei mit auto im Namen',
   nameHits.some(t=>/Auto-Werbung/.test(t)) && !nameHits.some(t=>/IMG_4821/.test(t)),
   `[${nameHits.join(' | ')}]`);

// 3) MEANING search "schwarzes fahrzeug wheelbase" -> finds IMG_4821 (content+synonyms), not notiz
const meanHits = await doSearch('mean', 'schwarzes fahrzeug wheelbase');
ok('Bedeutungssuche findet Inhalts-Treffer, den der Name verbirgt',
   meanHits.some(t=>/IMG_4821/.test(t)),
   `[${meanHits.join(' | ')}]`);
ok('Bedeutungssuche filtert Unpassendes (notiz nicht ganz oben)',
   meanHits[0] && /IMG_4821/.test(meanHits[0]),
   `top=${meanHits[0]||'—'}`);

// 4) PDF text extracted -> meaning search for invoice terms finds the scanned PDF
const pdfHits = await doSearch('mean', 'rechnung betrag mueller');
ok('PDF-Text extrahiert & auffindbar', pdfHits.some(t=>/scan_0007\.pdf/.test(t)), `[${pdfHits.join(' | ')}]`);

// 5) search speed < 1s (info line reports ms)
await doSearch('mean', 'schwarzes auto radstand');
const info = await page.textContent('#searchInfo');
const ms = parseFloat((info.match(/([\d.]+)\s*ms/)||[])[1] || '9999');
ok('Suche < 1000 ms', ms < 1000, `(${ms} ms)`);

// 6) dedupe: re-sign same files -> stays 4
await page.setInputFiles('#fileInput', files);
await page.waitForTimeout(1500);
const nAfter = await page.textContent('#stFiles');
ok('Zweiter Lauf: bereits signierte übersprungen (bleibt 4)', nAfter === '4', `(stFiles=${nAfter})`);

// 7) category suggestion produced groups
await page.click('.tab[data-tab="order"]');
const groups = await page.$$eval('#groups .grp .n', els => els.map(e=>e.textContent.trim()));
ok('Ordnung: Kategorien vorgeschlagen', groups.length >= 2, `[${groups.join(', ')}]`);

await browser.close();
server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if (fail) { if (logs.length) console.log('--- console ---\n'+logs.slice(-20).join('\n')); process.exit(1); }
