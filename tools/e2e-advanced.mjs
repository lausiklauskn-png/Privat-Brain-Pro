// Proof for: filters/browse, tags, saved searches, multi-computer merge (export->import).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port;
const URLROOT=`http://127.0.0.1:${PORT}/index.html`;

const dir = await mkdtemp(join(tmpdir(),'cba-'));
await writeFile(join(dir,'rechnung_2026.txt'), 'Rechnung 2026 Betrag 500 Euro Montage Kunde Meier.');
await writeFile(join(dir,'vertrag_2026.txt'), 'Mietvertrag Wohnung Laufzeit zwei Jahre Kaltmiete.');
await writeFile(join(dir,'foto_notiz.txt'), 'Einfache Notiz ueber ein Bild.');
const files=['rechnung_2026.txt','vertrag_2026.txt','foto_notiz.txt'].map(f=>join(dir,f));
const dl = await mkdtemp(join(tmpdir(),'cbdl-'));

const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const ctx = await browser.newContext({ acceptDownloads:true });
const page = await ctx.newPage();
page.on('pageerror', e=>console.error('PAGE ERROR:', e.message));
await page.goto(URLROOT, {waitUntil:'load'});
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  '+x:''}`);};

await page.setInputFiles('#fileInput', files);
await page.waitForFunction(()=>document.querySelector('#stFiles')&&document.querySelector('#stFiles').textContent==='3',{timeout:15000});
ok('3 Dateien signiert', (await page.textContent('#stFiles'))==='3');

// --- Stöbern per Kategorie-Filter (leere Suche + Filter) ---
await page.selectOption('#fCat', 'Rechnung');
await page.waitForTimeout(120);
let names = await page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim()));
ok('Filter „Rechnung" zeigt nur Rechnungen im Stöber-Modus', names.length===1 && /rechnung_2026/.test(names[0]||''), `[${names.join(' | ')}]`);
await page.click('#fReset'); await page.waitForTimeout(80);

// --- Tag setzen + danach Tag-Filter ---
await page.fill('#q','vertrag laufzeit'); await page.waitForTimeout(120);
page.once('dialog', d=>d.accept('wichtig'));  // prompt for tag
await page.click('[data-tagadd]'); await page.waitForTimeout(150);
const tagShown = await page.$$eval('#results .tag', els=>els.map(e=>e.textContent));
ok('Tag „wichtig" gesetzt & angezeigt', tagShown.some(t=>/wichtig/.test(t)), `[${tagShown.join(' | ')}]`);
await page.fill('#q',''); await page.selectOption('#fTag','wichtig'); await page.waitForTimeout(120);
names = await page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim()));
ok('Tag-Filter „wichtig" zeigt genau die getaggte Datei', names.length===1 && /vertrag_2026/.test(names[0]||''), `[${names.join(' | ')}]`);
await page.click('#fReset');

// --- Gespeicherte Suche ---
await page.fill('#q','rechnung montage'); await page.waitForTimeout(100);
await page.click('#fSave'); await page.waitForTimeout(80);
const savedCount = await page.$$eval('#savedRow .saved', els=>els.length);
ok('Gespeicherte Suche als Knopf angelegt', savedCount>=1, `(${savedCount})`);
await page.fill('#q',''); await page.waitForTimeout(60);
await page.click('#savedRow .saved'); await page.waitForTimeout(120);
ok('Gespeicherte Suche wiederhergestellt', (await page.inputValue('#q'))==='rechnung montage');

// --- Multi-Rechner: vollständigen Katalog exportieren (im Einstellungen-Tab) ---
await page.click('.tab[data-tab="settings"]');
const [dlEvt] = await Promise.all([ page.waitForEvent('download'), page.click('#btnFullExport') ]);
const savePath = join(dl, 'voll.json');
await dlEvt.saveAs(savePath);
const exported = JSON.parse(await readFile(savePath,'utf8'));
ok('Voll-Export enthält Vektor+tf (mergefähig)', exported.catalog.length===3 && Array.isArray(exported.catalog[0].vector) && exported.catalog[0].tf, `(v${exported.v})`);

// --- Frischer „zweiter Rechner": Katalog leeren, dann Import/Merge ---
page.once('dialog', d=>d.accept());
await page.click('#btnClear'); await page.waitForTimeout(200);
ok('Katalog geleert (zweiter Rechner)', (await page.textContent('#stFiles'))==='0');
await page.setInputFiles('#importInput', savePath);
await page.waitForFunction(()=>document.querySelector('#stFiles')&&document.querySelector('#stFiles').textContent==='3',{timeout:8000});
ok('Zusammenführen bringt 3 Einträge vom anderen Rechner', (await page.textContent('#stFiles'))==='3');
await page.click('.tab[data-tab="search"]');
await page.click('#mode button[data-m="mean"]'); await page.fill('#q','rechnung montage betrag'); await page.waitForTimeout(150);
const merged = await page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim()));
ok('Importierte Einträge sind auffindbar', merged.some(t=>/rechnung_2026/.test(t)), `[${merged.join(' | ')}]`);
const origin = await page.$$eval('#results .origin', els=>els.length);
ok('Importierte Treffer als „anderer Rechner" markiert', origin>=1, `(origin badges=${origin})`);

// --- KI-Modal öffnet (ohne Schlüssel -> Hinweis, keine JS-Fehler) ---
await page.click('#results .kiBtn'); await page.waitForTimeout(150);
const modalOn = await page.$eval('#modalBg', el=>el.classList.contains('on'));
const kiHint = await page.textContent('#modalBox');
ok('KI-Modal öffnet mit Klar-Hinweis „kein Schlüssel"', modalOn && /kein Schl/i.test(kiHint));
await page.click('#modalBox [data-close]'); await page.waitForTimeout(80);
ok('Modal schließt wieder', !(await page.$eval('#modalBg', el=>el.classList.contains('on'))));

// --- Reorg-Vorschau öffnet ohne Fehler ---
await page.click('.tab[data-tab="order"]');
await page.click('#reorgPreview'); await page.waitForTimeout(120);
ok('Neu-Ordnen-Vorschau öffnet', await page.$eval('#modalBg', el=>el.classList.contains('on')));
await page.click('#modalBox [data-close]');

await browser.close(); server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if(fail) process.exit(1);
