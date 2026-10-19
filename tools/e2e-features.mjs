// Proof for the new features: duplicate detection (opt-in removal) + mic button + EU toggle.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
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

const dir = await mkdtemp(join(tmpdir(),'cbf-'));
const SAME = 'Rechnung 2024-77 Betrag 1200 Euro Firma Beispiel GmbH Leistung Montage.';
await writeFile(join(dir,'rechnung_arbeitsplatz_A.txt'), SAME);         // primary
await writeFile(join(dir,'kopie_von_rechnung_B.txt'), SAME);            // identical bytes -> duplicate
await writeFile(join(dir,'einzelstueck.txt'), 'Notiz ohne Doppelgaenger.');

const files = ['rechnung_arbeitsplatz_A.txt','kopie_von_rechnung_B.txt','einzelstueck.txt'].map(f=>join(dir,f));

const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const page = await browser.newPage();
page.on('pageerror', e=>console.error('PAGE ERROR:', e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  '+x:''}`);};

await page.setInputFiles('#fileInput', files);
// 3 Dateien, aber identischer Inhalt -> 2 Katalog-Einträge (eine als Doppelte vermerkt)
await page.waitForFunction(()=>document.querySelector('#stFiles')&&document.querySelector('#stFiles').textContent==='2',{timeout:15000});
ok('Doppelter Inhalt: 2 Einträge statt 3 (eine als Doppelte vermerkt)', (await page.textContent('#stFiles'))==='2');
ok('Mikrofon-Knopf vorhanden', await page.$('#mic')!==null);
ok('Nur-EU-Schalter vorhanden', await page.$('#euOnly')!==null);
ok('Google-Vision-EU-Option vorhanden', (await page.$$eval('#aiProvider option', o=>o.map(x=>x.value))).includes('google'));

// Doppelte-Tab
await page.click('.tab[data-tab="dupes"]');
const dupCards = await page.$$eval('#dupeList .card', els=>els.length);
ok('Doppelte-Ansicht zeigt die Gruppe', dupCards===1, `(cards=${dupCards})`);
const locs = await page.$$eval('#dupeList .dupChk', els=>els.length);
ok('Gruppe listet beide Fundstellen', locs===2, `(locs=${locs})`);

// "Alle außer je einer ankreuzen" -> genau 1 Haken
await page.click('#dupSelectExtra');
const checked = await page.$$eval('#dupeList .dupChk', els=>els.filter(e=>e.checked).length);
ok('„Alle außer je einer“ kreuzt genau 1 an', checked===1, `(checked=${checked})`);

// entfernen -> Gruppe verschwindet, Katalog bleibt 2 (nur der Extra-Pfad ist weg)
await page.click('#dupRemove');
await page.waitForTimeout(300);
const emptyShown = await page.$eval('#dupeEmpty', el=>getComputedStyle(el).display!=='none');
ok('Nach Entfernen: keine Doppelten mehr', emptyShown);
ok('Katalog unverändert bei 2 (keine Datei gelöscht)', (await page.textContent('#stFiles'))==='2');

// Bedeutungssuche findet die verbliebene Rechnung weiterhin
await page.click('.tab[data-tab="search"]');
await page.click('#mode button[data-m="mean"]'); await page.fill('#q','rechnung montage betrag'); await page.waitForTimeout(120);
const hits = await page.$$eval('#results .card .fname', els=>els.map(e=>e.textContent.trim()));
ok('Verbliebene Rechnung weiter auffindbar', hits.some(t=>/rechnung_arbeitsplatz_A/.test(t)), `[${hits.join(' | ')}]`);

await browser.close(); server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if(fail) process.exit(1);
