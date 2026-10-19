// Beweis: Private Brain hat ein EIGENES, theme-anpassendes schwebendes Netz-Widget
// (Klaus 2026-07-18) — kein fest-dunkles Fremd-Panel. Schwebender 🌐-Knopf öffnet ein
// Panel (Private-Brain-CSS-Variablen → hell/dunkel) mit Verbinden · Wer ist im Raum? ·
// Antwortrecht · Briefkasten (späte Antworten) · Aufräumen. Direkt an Modul 23 verdrahtet.
// Live-Cross-Knoten = nur am Tablet beweisbar; headless prüft Mount/Öffnen/Funktionen/Theme.
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
await page.waitForTimeout(700);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// 1) Schwebender Knopf gemountet, native API da
const meta = await page.evaluate(()=>({
  btn: !!document.querySelector('#pbNetBtn'),
  api: !!(window.PBNetWidget && window.PBNetWidget._meta),
  native: !!(window.PBNetWidget && window.PBNetWidget._meta && window.PBNetWidget._meta.native),
  themed: !!(window.PBNetWidget && window.PBNetWidget._meta && window.PBNetWidget._meta.themed),
  label: (document.querySelector('#pbNetBtn')||{}).textContent||'',
  aria: (document.querySelector('#pbNetBtn')||{}).getAttribute ? document.querySelector('#pbNetBtn').getAttribute('aria-label')||'' : '',
  head: (function(){var h=document.querySelector('#pbNetHead strong'); return h?h.textContent:'';})(),
}));
ok('Schwebender 🌐-Knopf gemountet', meta.btn===true);
ok('Native Widget-API vorhanden (PBNetWidget)', meta.api===true);
ok('Als nativ + theme-anpassend markiert', meta.native===true && meta.themed===true);
// Öffner-Knopf trägt den VOLLEN Titel „Mit dem Knotennetz verbinden" (Klaus 2026-07-19,
// wie die Sage-Referenz). Keine Doppelung, weil die Blase verschwindet, sobald das Panel
// offen ist (Öffner und Panel sind nie gleichzeitig sichtbar).
ok('Knopf trägt vollen Titel „🌐 Mit dem Knotennetz verbinden"', /Mit dem Knotennetz verbinden/.test(meta.label));
ok('Barrierefreier Name + Panel-Titel = „Mit dem Knotennetz verbinden"', /Mit dem Knotennetz verbinden/.test(meta.aria) && /Mit dem Knotennetz verbinden/.test(meta.head));

// 2) Theme-Anpassung: das Panel (DIV mit var(--card)) folgt Hell/Dunkel
//    (Knöpfe messen headless ihren var-Hintergrund nicht zuverlässig — daher das Panel prüfen)
await page.evaluate(()=>window.PBNetWidget.open()); await page.waitForTimeout(120);
const themed = await page.evaluate(()=>{
  const p=document.querySelector('#pbNetPanel');
  const root=document.documentElement;
  root.removeAttribute('data-theme');               // hell (Standard)
  const lightBg=getComputedStyle(p).backgroundColor;
  root.setAttribute('data-theme','dunkel');         // dunkel
  const darkBg=getComputedStyle(p).backgroundColor;
  root.removeAttribute('data-theme');
  return { lightBg, darkBg, changed: lightBg!==darkBg };
});
ok('Widget-Panel passt sich Hell/Dunkel an (Farbe folgt dem Thema)', themed.changed===true, `${themed.lightBg} → ${themed.darkBg}`);

// 3) Panel offen mit allen Kern-Funktionen
const panel = await page.evaluate(()=>{
  const p=document.querySelector('#pbNetPanel');
  const vis=p && getComputedStyle(p).display!=='none';
  const t=p?p.textContent:'';
  return { open: !!(vis || (window.PBNetWidget&&window.PBNetWidget.isOpen())),
    connect:/Verbinden & anmelden/.test(t), who:/Wer ist im Raum/.test(t),
    answer:/Antworten: (an|aus)/.test(t), mail:/Antworten abholen/.test(t), repair:/Aufräumen & neu anmelden/.test(t),
    tool: !!p.querySelector('.pbnet-tool') };
});
ok('Panel öffnet sich beim 🌐-Knopf', panel.open===true);
ok('Kern-Funktionen im Panel (Verbinden/im Raum/Antworten-Toggle/Aufräumen)', panel.connect&&panel.who&&panel.answer&&panel.repair);
ok('Briefkasten (📬 abholen) im Panel vorhanden', panel.mail===true);
ok('Werkzeug-Körper (.pbnet-tool) im Panel montiert', panel.tool===true);

// 4) Briefkasten-Speicher wirkt (pendingCount)
const mailbox = await page.evaluate(()=>{
  localStorage.setItem('sbkim_rdv_pending_privatbrain', JSON.stringify([{qid:'q1',q:'Test?',target:'Freund',ts:1,answered:false}]));
  return { count: window.PBNetWidget.pendingCount() };
});
ok('Briefkasten-Speicher lesbar (pendingCount)', mailbox.count===1, 'n='+mailbox.count);

// 5) „Wer ist im Raum?" offline degradiert sauber (kein Crash) — Modul 23 verdrahtet
await page.click('#pbNetPanel .pbnet-tool >> text=👥 Wer ist im Raum?');
await page.waitForTimeout(1500);
const out1 = await page.$eval('#pbNetPanel .pbnet-tool pre', el=>el.textContent);
ok('„Wer ist im Raum?" verdrahtet + fail-soft (kein Crash)', /Raum|Relais|Suche|niemand/i.test(out1||''), `("${(out1||'').slice(0,60)}")`);

// 6) KEIN fester Netz-Tab/-Panel mehr (Klaus 2026-07-19: „alter Netz-Button weg, nur der Flieger")
const noTab = await page.evaluate(()=>({ tab: !!document.querySelector('.tab[data-tab="net"]'),
  tabMount: !!document.querySelector('#pbNetTabMount'), panel: !!document.querySelector('#panel-net') }));
ok('Kein fester Netz-Tab/-Panel/-Mount mehr (nur der Flieger)', noTab.tab===false && noTab.tabMount===false && noTab.panel===false);

// 6b) Gerätename-Feld lebt jetzt IM Flieger und speichert beim Tippen
const gn = await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  const inp=fly && [...fly.querySelectorAll('input')].find(i=>/Klaus-Handy|frei wählbar/.test(i.placeholder||''));
  if(!inp) return { has:false };
  inp.value='Klaus Tablet'; inp.dispatchEvent(new Event('input'));
  return { has:true, stored: localStorage.getItem('sbkim_geraetename') };
});
ok('🏷️ Gerätename-Feld im Flieger vorhanden', gn.has===true);
ok('🏷️ Gerätename tippen speichert (sbkim_geraetename)', gn.stored==='Klaus Tablet', 'v='+gn.stored);

// 6c) EIN Ding zur Zeit: Panel offen → Öffner-Blase versteckt; Panel zu → nur die Blase
const oneAtATime = await page.evaluate(()=>{
  window.PBNetWidget.open();
  const btnOpen = getComputedStyle(document.querySelector('#pbNetBtn')).display;
  window.PBNetWidget.close();
  const btnClosed = getComputedStyle(document.querySelector('#pbNetBtn')).display;
  const panelClosed = getComputedStyle(document.querySelector('#pbNetPanel')).display;
  window.PBNetWidget.open(); // für die folgenden Kopf-Tests wieder öffnen
  return { btnOpen, btnClosed, panelClosed };
});
ok('Panel offen → Öffner-Blase versteckt (kein doppeltes Netz)', oneAtATime.btnOpen==='none');
ok('Panel zu → nur die Blase (Panel weg, Blase sichtbar)', oneAtATime.panelClosed==='none' && oneAtATime.btnClosed!=='none');

// 7) Kopf hat 💬 (Erklärung) + – (Zuklappen) + ✕ (Schließen). EIN Klick öffnet VOLL,
//    – ODER ✕ schließt (Blase kommt zurück) — kein Minimier-Zwischenzustand mehr,
//    kein 2-3-Klick-Tanz (Klaus 2026-07-19).
await page.evaluate(()=>window.PBNetWidget.open()); await page.waitForTimeout(80);
const bodySel = '#pbNetPanel .pbnet-tool';
const head = await page.evaluate((bodySel)=>{
  const h=document.querySelector('#pbNetHead');
  const btns=h?[...h.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.textContent.trim()):[];
  return { tip: btns.some(b=>/Erklärung/.test(b)), min: btns.includes('Zuklappen'), close: btns.includes('Schließen'),
    bodyVisible: getComputedStyle(document.querySelector(bodySel)).display!=='none' };
}, bodySel);
ok('Kopf hat 💬 (Erklärung ein/aus)', head.tip===true);
ok('Kopf hat – (Zuklappen) UND ✕ (Schließen)', head.min===true && head.close===true);
ok('Öffnen zeigt SOFORT das volle Werkzeug (kein Minimier-Zwischenzustand)', head.bodyVisible===true);

// – (Zuklappen): EIN Tipp schließt das Panel ganz, die Blase kommt zurück
await page.click('#pbNetHead button[aria-label="Zuklappen"]');
await page.waitForTimeout(80);
const afterMin = await page.evaluate(()=>({
  open: window.PBNetWidget.isOpen(),
  btnBack: getComputedStyle(document.querySelector('#pbNetBtn')).display!=='none',
  apiAlive: !!window.SbkimRendezvous }));
ok('– schließt in EINEM Tipp (Panel zu, Blase zurück, Verbindung bleibt)',
  afterMin.open===false && afterMin.btnBack===true && afterMin.apiAlive===true);

// EIN Klick auf die Blase → Panel wieder VOLL offen (kein zweiter Klick nötig)
await page.click('#pbNetBtn');
await page.waitForTimeout(80);
const reopened = await page.evaluate((bodySel)=>({ open: window.PBNetWidget.isOpen(),
  bodyVisible: getComputedStyle(document.querySelector(bodySel)).display!=='none',
  btnHidden: getComputedStyle(document.querySelector('#pbNetBtn')).display==='none' }), bodySel);
ok('EIN Klick auf die Blase → Panel wieder VOLL offen', reopened.open===true && reopened.bodyVisible===true && reopened.btnHidden===true);

// 💬 blendet die Erklärung aus/ein
const introTgl = await page.evaluate(()=>{
  const intro=[...document.querySelectorAll('#pbNetPanel p')].find(e=>/Server-los/.test(e.textContent));
  const before=intro?getComputedStyle(intro).display:'?';
  document.querySelector('#pbNetHead button[aria-label="Erklärung ein-/ausblenden"]').click();
  const after=intro?getComputedStyle(intro).display:'?';
  return { before, after, changed: before!==after };
});
ok('💬 blendet die Erklärung um (auf/zu)', introTgl.changed===true, `${introTgl.before} → ${introTgl.after}`);

// ✕: schließt ebenfalls ganz
await page.click('#pbNetHead button[aria-label="Schließen"]');
await page.waitForTimeout(80);
const afterClose = await page.evaluate(()=>({ open: window.PBNetWidget.isOpen(), apiAlive: !!(window.PBNetWidget && window.SbkimRendezvous), btnStill: !!document.querySelector('#pbNetBtn') }));
ok('✕ schließt ganz (Panel zu, Netz-Modul + 🌐-Knopf bleiben — keine Trennung)',
  afterClose.open===false && afterClose.apiAlive===true && afterClose.btnStill===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,180));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
