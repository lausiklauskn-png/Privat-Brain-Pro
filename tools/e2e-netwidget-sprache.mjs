// Beweis: das Mycel-Fenster (modules/net-widget.js) spricht Deutsch UND Englisch —
// schlüssellos, byte-gleiches Verfahren wie Modul 15 und 16 (Klaus 2026-09-16:
// „Private Brain soll zweisprachig werden").
//
// ⚠ DIE SCHÄRFSTE ZUSICHERUNG IST DIE VIERTE: `T(de)` FÄLLT NICHT ZURÜCK, es gibt
// den deutschen Satz heraus. Ein fehlender Eintrag ist damit **still** — auf
// Englisch stünde einfach ein deutscher Satz mitten in der Oberfläche, und keine
// Verhaltens-Prüfung könnte das von „so gewollt" unterscheiden. Der Sammler liest
// deshalb JEDEN `T("…")`-Aufruf aus dem Quelltext und besteht darauf, dass er in
// der Tabelle steht. (Dieselbe Lehre wie in Mein Rezeptbuch, 2026-09-16.)
//
// ⚠ UND EINE HALB ÜBERSETZTE TAFEL IST DIE SCHLIMMERE SORTE — sie sieht aus wie
// eine englische Oberfläche und streut deutsche Sätze dazwischen.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2' };

let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// ── A · Die Tafel selbst, am Quelltext gemessen ────────────────────────────
const quelle = await readFile(join(ROOT,'modules/net-widget.js'), 'utf8');

// Nur die Zeichenketten-LITERALE lesen, nie den Erklär-Kommentar: ein Wächter,
// der im Kommentar fündig wird, misst nichts (Mycel-Karte, 2026-09-10).
const tabStart = quelle.indexOf('var TEXTE = { en: {');
const tabEnde  = quelle.indexOf('  } };', tabStart);
ok('Die Tabelle steht im Quelltext', tabStart > 0 && tabEnde > tabStart);
const tabelle = quelle.slice(tabStart, tabEnde);

// Einträge aus der Tabelle holen: "deutsch":\n "englisch"
const paare = [...tabelle.matchAll(/"((?:[^"\\]|\\.)*)":\s*\n?\s*"((?:[^"\\]|\\.)*)"/g)]
  .map(m => [JSON.parse('"'+m[1]+'"'), JSON.parse('"'+m[2]+'"')]);
ok('Die Tabelle trägt Einträge', paare.length >= 60, `${paare.length} Einträge`);

// 1 · jeder Eintrag hat eine englische Fassung
ok('1 · Jeder Eintrag hat eine englische Fassung',
   paare.every(([,en]) => typeof en === 'string' && en.length > 0),
   `${paare.length}/${paare.length}`);

// 2 · keine ist WORTGLEICH mit der deutschen
const gleich = paare.filter(([de,en]) => de === en).map(([de]) => de);
ok('2 · Keine Übersetzung ist wortgleich mit dem Deutschen', gleich.length === 0,
   gleich.slice(0,3).join(' | '));

// 3 · die FORM der Bruchstücke bleibt erhalten. Diese Sätze werden
//     zusammengeklebt („Fehler: " + e). Verliert die englische Fassung das
//     abschließende Leerzeichen oder das öffnende Anführungszeichen, klebt der
//     Wert am Wort — und das sieht aus wie ein Fehler in der Anwendung.
const formFehler = paare.filter(([de,en]) => {
  const endeDe = /[\s„“”"]$/.test(de), endeEn = /[\s„“”"]$/.test(en);
  return endeDe !== endeEn;
}).map(([de]) => de);
ok('3 · Bruchstücke behalten ihre Form (Leerzeichen/Anführungszeichen am Ende)',
   formFehler.length === 0, formFehler.slice(0,3).map(s=>JSON.stringify(s)).join(' | '));

// 4 · DER SAMMLER: jeder T("…")-Aufruf steht in der Tabelle.
const rumpf = quelle.slice(quelle.indexOf('  function T(de) {'));
const benutzt = [...new Set([...rumpf.matchAll(/\bT\(\s*"((?:[^"\\]|\\.)*)"/g)]
  .map(m => JSON.parse('"'+m[1]+'"')))];
const kennt = new Set(paare.map(([de]) => de));
const fehlt = benutzt.filter(b => !kennt.has(b));
ok('4 · Jeder T("…")-Aufruf steht in der Tabelle (T fällt NICHT zurück)',
   fehlt.length === 0 && benutzt.length > 20,
   `${benutzt.length} benutzt, ${fehlt.length} fehlen${fehlt.length?': '+fehlt.slice(0,2).map(s=>JSON.stringify(s.slice(0,40))).join(' | '):''}`);

// 5 · Gegenrichtung: keine Übersetzung ohne deutschen Satz im Code
const verwaist = [...kennt].filter(k => !benutzt.includes(k));
ok('5 · Keine Übersetzung ohne deutschen Satz (keine verwaisten Einträge)',
   verwaist.length === 0, verwaist.slice(0,3).map(s=>JSON.stringify(s.slice(0,40))).join(' | '));

// ── B · Im echten Browser: was steht wirklich auf dem Schirm ───────────────
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port;
const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const errors=[];

async function fenster(lang){
  const page = await browser.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
  // Sprache setzen wie Private Brains eigener Wähler es tut, VOR dem Aufbau des Panels
  await page.evaluate(l => { document.documentElement.setAttribute('lang', l); }, lang);
  await page.waitForTimeout(500);
  await page.click('#pbNetBtn');
  await page.waitForTimeout(300);
  const t = await page.evaluate(()=>{
    const p = document.querySelector('#pbNetPanel');
    return p ? p.innerText : '';
  });
  await page.close();
  return t;
}

const de = await fenster('de');
const en = await fenster('en');
const ru = await fenster('ru');

ok('Das Panel baut sich überhaupt auf', de.length > 80, `${de.length} Zeichen`);

// Deutsch: Zeichen für Zeichen unverändert
ok('DE · Das Fenster steht auf Deutsch', /Verbinden & anmelden/.test(de) && /Wer ist im Raum\?/.test(de));

// Englisch: die Sätze sind getauscht
ok('EN · „Connect & sign in" statt „Verbinden & anmelden"',
   /Connect & sign in/.test(en) && !/Verbinden & anmelden/.test(en));
ok('EN · „Who is in the room?" statt „Wer ist im Raum?"',
   /Who is in the room\?/.test(en) && !/Wer ist im Raum\?/.test(en));
ok('EN · Der Gerätename-Block ist übersetzt',
   /Device name/.test(en) && !/Gerätename/.test(en));

// ⚠ DIE HALB ÜBERSETZTE TAFEL: auf Englisch darf KEIN deutscher Satz aus der
// Tabelle stehenbleiben. Das ist die eigentliche Zusicherung — „ein Satz ist
// übersetzt" wäre auch dann grün, wenn zwanzig es nicht sind.
const stehengeblieben = paare
  .map(([d]) => d.trim())
  .filter(d => d.length >= 12 && en.includes(d));
ok('EN · KEIN deutscher Tabellen-Satz bleibt stehen (halb übersetzt wäre schlimmer)',
   stehengeblieben.length === 0, stehengeblieben.slice(0,2).map(s=>JSON.stringify(s.slice(0,45))).join(' | '));

// ⚠ DIE GEGENRICHTUNG. EN → DE muss genauso sauber sein: die geretteten
// Statuszeilen duerfen keinen englischen Satz im deutschen Fenster zuruecklassen.
{
  const page = await browser.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
  await page.evaluate(()=>document.documentElement.setAttribute('lang','en'));
  await page.waitForTimeout(400);
  await page.click('#pbNetBtn'); await page.waitForTimeout(250);
  const enTxt = await page.evaluate(()=>document.querySelector('#pbNetPanel').innerText);
  await page.evaluate(()=>document.documentElement.setAttribute('lang','de'));
  await page.waitForTimeout(400);
  const deTxt = await page.evaluate(()=>document.querySelector('#pbNetPanel').innerText);
  ok('EN→DE · zurueck auf Deutsch, ohne englischen Rest',
     /Verbinden & anmelden/.test(deTxt) && !/Connect & sign in/.test(deTxt),
     `EN ${enTxt.length} → DE ${deTxt.length} Zeichen`);
  const englReste = paare.map(([,en])=>en.trim()).filter(e=>e.length>=12 && deTxt.includes(e));
  ok('EN→DE · KEIN englischer Tabellen-Satz bleibt stehen',
     englReste.length===0, englReste.slice(0,2).map(s=>JSON.stringify(s.slice(0,45))).join(' | '));
  await page.close();
}

// BENANNTE GRENZE, in BEIDE Richtungen gemessen: die App kennt vier Sprachen,
// der Kanon zwei. ru/pl fallen fail-soft auf DEUTSCH zurück — nicht auf Englisch.
ok('RU · fällt fail-soft auf DEUTSCH zurück (benannte Grenze, nicht Englisch)',
   /Verbinden & anmelden/.test(ru) && !/Connect & sign in/.test(ru));

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,180));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
