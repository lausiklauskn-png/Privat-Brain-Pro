// Beweis Stufe 4: kombinierende Mehrschritt-Suche. „Urlaub am Meer" findet zuerst das
// Urlaubsfoto (Mallorca). Über dessen Bedeutung bringt die Box im 2. Schritt die
// Reisebüro-Angebots-Mail — die das Wort „Urlaub" NICHT enthält. Ein unbezogenes
// Dokument (Stromrechnung) bleibt draußen. Jeder Verwandten-Treffer nennt seine Herkunft.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port;
const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const page = await browser.newPage();
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(400);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// Kleines Korpus dropen: Foto (mit Ort/Bedeutung), Angebots-Mail (ohne „Urlaub"), Fremd-Doc.
// Absicht: die Suchwörter (ferien/erholung/entspannung) stehen NUR im Foto. Das Angebot
// teilt mit dem Foto nur die Sach-Wörter (mallorca/strand/sonne/palmen) — NICHT die Suchwörter.
// So ist das Angebot KEIN direkter Treffer, kommt aber über die Bedeutung des Fotos (Multi-Hop).
const FILES = [
  {name:"urlaubsfoto_mallorca.txt", body:"Ferien und Erholung, endlich entspannen. Aufgenommen auf Mallorca: Strand, Sonne, Palmen, Baden im Mittelmeer."},
  {name:"reisebuero_angebot.txt",  body:"Reisebuero Angebot Mallorca: Flug und Hotel, Palma, Halbpension, Sonderpreis. Strand, Sonne, Palmen, Mittelmeer. Jetzt buchbar."},
  {name:"stromrechnung_januar.txt", body:"Stromrechnung Januar. Zaehlerstand abgelesen, Abschlag ueberwiesen, Kilowattstunden verbraucht, Netzentgelt und Grundgebuehr."},
];
const QUERY = "Ferien Erholung entspannen";
await page.evaluate(async (files)=>{
  for(const f of files){ const file=new File([f.body], f.name, {type:"text/plain"}); await signFile(file, f.name, null); }
  rebuildIndex();
}, FILES);

// 1) multiHopSearch: direkte Treffer + Verwandte
const r = await page.evaluate((q)=>{
  const res = multiHopSearch(q, null);
  return {
    directNames: res.direct.map(h=>h.r.name),
    relatedNames: res.related.map(h=>h.r.name),
    relatedVia: res.related.map(h=>h.why.viaName),
  };
}, QUERY);
ok('Direkt: Urlaubsfoto ist unter den ersten Treffern', r.directNames.some(n=>/urlaubsfoto_mallorca/.test(n)), r.directNames.join(', '));
ok('Verwandt: Reisebüro-Angebot wird mitgefunden (ohne Wort „Urlaub")', r.relatedNames.some(n=>/reisebuero_angebot/.test(n)), r.relatedNames.join(', '));
ok('Verwandt: Stromrechnung bleibt DRAUSSEN (kein Bezug)', !r.relatedNames.some(n=>/stromrechnung/.test(n)), r.relatedNames.join(', '));
ok('Herkunfts-Kette: Verwandter nennt, worüber er kam', r.relatedVia.some(v=>/urlaubsfoto_mallorca/.test(v||'')), (r.relatedVia||[]).join(', '));

// 2) Ohne den Schalter zeigt die normale Suche das Angebot NICHT (Beweis, dass Multi-Hop den Unterschied macht)
const base = await page.evaluate((q)=> search(q, null).map(h=>h.r.name), QUERY );
ok('Normale Suche allein bringt das Angebot NICHT (Wort fehlt)', !base.some(n=>/reisebuero_angebot/.test(n)), base.join(', '));

// 3) UI: Schalter an -> Verwandten-Gruppe erscheint im Ergebnis-Bereich
await page.click('.tab[data-tab="search"]').catch(()=>{});
await page.fill('#q', QUERY); await page.waitForTimeout(200);
await page.check('#combine'); await page.waitForTimeout(300);
const ui = await page.evaluate(()=>({
  relhead: !!document.querySelector('#results .relhead'),
  relatedCard: !![...document.querySelectorAll('#results .card.related .fname')].find(e=>/reisebuero_angebot/.test(e.textContent)),
  viahop: !!document.querySelector('#results .viahop'),
}));
ok('UI: Verwandten-Überschrift erscheint bei Schalter „an"', ui.relhead===true);
ok('UI: Reisebüro-Angebot steht in der Verwandten-Gruppe', ui.relatedCard===true);
ok('UI: Herkunfts-Zeile „gefunden über …" sichtbar', ui.viahop===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
