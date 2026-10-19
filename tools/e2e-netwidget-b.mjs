// Beweis Stufe B: das Netz-Werkzeug hat die vollen Funktionen des Referenz-Widgets
// (Sage/family) — netzweite Frage nach Bedeutung + 🎤, Raum-Aktionen (Andocken/gezielt
// fragen/App öffnen/nur verwandte), Antworten-Toggle, voller Briefkasten — in Private-
// Brain-Optik, an BEIDEN Orten (schwebender Knopf + fester Tab). Live-Cross-Knoten ist
// nur am Tablet beweisbar; headless prüft Aufbau/Verdrahtung/Theme/fail-soft.
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

await page.evaluate(()=>window.PBNetWidget.open()); await page.waitForTimeout(150);

// 1) Netzweite Frage-Zeile: Textfeld + 🔎 Antwort holen + 🎤 (in beiden Mounts)
const feat = await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  const has=(root,txt)=>!!root && root.textContent.includes(txt);
  const field=root=>!!(root && root.querySelector('input.pbnet-field'));
  return {
    flyQuery: field(fly),
    flyAsk: has(fly,'Antwort holen'),
    flyMic: !!(fly && [...fly.querySelectorAll('button')].some(b=>b.textContent.trim()==='🎤')),
    flyAnnounce: has(fly,'Nur neu anmelden'),
    flyReask: has(fly,'offene nochmal fragen'), flyClear: has(fly,'leeren'),
    flyRel: has(fly,'nur verwandte'),
    flyGeraet: !!(fly && [...fly.querySelectorAll('input')].some(i=>/Klaus-Handy|frei wählbar/.test(i.placeholder||''))),
    noTab: !document.querySelector('#pbNetTabMount'),
    mini: !!document.querySelector('.pbnet-mini'),
  };
});
ok('Frage-nach-Bedeutung-Feld im Flieger', feat.flyQuery);
ok('🔎 Antwort holen im Flieger', feat.flyAsk);
ok('🎤 Mikrofon-Knopf im Flieger', feat.flyMic);
ok('🙋 Nur neu anmelden im Flieger', feat.flyAnnounce);
ok('Briefkasten voll (💬 offene nochmal fragen + 🗑 leeren)', feat.flyReask&&feat.flyClear);
ok('🧬 nur-verwandte-Filter im Flieger', feat.flyRel);
ok('🏷️ Gerätename-Feld im Flieger', feat.flyGeraet===true);
ok('Nur der Flieger (kein fester Tab-Mount mehr)', feat.noTab===true);
ok('Schlanke Knopf-Klasse (.pbnet-mini) aktiv', feat.mini===true);

// 2) 🧬 nur-verwandte Umschalter kippt sichtbar + persistiert
const relTog = await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  const btn=[...fly.querySelectorAll('button')].find(b=>/nur verwandte/.test(b.textContent));
  const before=btn.textContent; btn.click(); const after=btn.textContent;
  const stored=localStorage.getItem('pb_net_related_only_privatbrain');
  return { before, after, changed: before!==after, stored };
});
ok('🧬 nur-verwandte kippt an/aus', relTog.changed===true, `${relTog.before.trim()} → ${relTog.after.trim()}`);
ok('🧬-Wahl persistiert (localStorage)', relTog.stored==='1'||relTog.stored==='0', 'v='+relTog.stored);

// 3) Raum-Aktionen: renderRoom baut Andocken/fragen/App-Knöpfe je Karte (Mock-Karten)
const room = await page.evaluate(()=>{
  // relatednessForCards existiert; wir prüfen die reine Render-Logik über eine
  // simulierte discover-Antwort, indem wir renderRoom über die öffentliche
  // Klick-Kette nicht erreichen — daher direkt das Modul-23 discover mocken:
  const orig = window.SbkimRendezvous.discover;
  window.SbkimRendezvous.discover = async()=>({ ok:true, cards:[
    { nodeName:'Kochfreund', nodeId:'n1', ageSec:5, relatedness:0.42, isRelated:true, spore:{ endpoint:'https://example.org/koch/', embeddingSource:'description' }, meaning:{ status:'passt', score:1 } },
    { nodeName:'Fremd', nodeId:'n2', ageSec:9, relatedness:0.05, isRelated:false, spore:{ embeddingSource:'description' }, meaning:{ status:'passt-nicht', score:0.5 } },
  ]});
  return window.SbkimRendezvous.discover; // marker
}).then(()=>page.evaluate(()=>{ localStorage.setItem('pb_net_related_only_privatbrain','0'); }));
// S2: der Filter „nur verwandte" muss AUS sein, sonst fehlt die nicht verwandte Karte
await page.evaluate(()=>{ const b=[...document.querySelectorAll('#pbNetPanel .pbnet-tool button')].find(x=>/nur verwandte/.test(x.textContent)); if(b && /an$/.test(b.textContent.trim())) b.click(); });
await page.click('#pbNetPanel .pbnet-tool >> text=👥 Wer ist im Raum?');
await page.waitForTimeout(400);
const roomR = await page.evaluate(()=>{
  const r=document.querySelector('#pbfly-a-0')? true:false; // answer slot exists
  const dock=[...document.querySelectorAll('#pbNetPanel .pbnet-tool button')].some(b=>/Andocken/.test(b.textContent));
  const ask=[...document.querySelectorAll('#pbNetPanel .pbnet-tool button')].some(b=>/fragen/.test(b.textContent));
  const open=[...document.querySelectorAll('#pbNetPanel .pbnet-tool button')].some(b=>/↗ App/.test(b.textContent));
  const badge=/verwandt|verbunden/.test(document.querySelector('#pbNetPanel .pbnet-tool').textContent);
  const names=/Kochfreund/.test(document.querySelector('#pbNetPanel .pbnet-tool').textContent);
  // S2 (Sage 2026-10-15): die Karte zeigt das Ergebnis der Bedeutungs-Prüfung aus Modul 23
  const meaning=[...document.querySelectorAll('#pbNetPanel [data-sbkim-meaning]')].map(e=>e.getAttribute('data-sbkim-meaning')+'|'+e.textContent);
  return { r, dock, ask, open, badge, names, meaning };
});
ok('Raum-Karten mit 🤝 Andocken je Knoten', roomR.dock===true);
ok('Raum-Karten mit ❓ gezielt fragen je Knoten', roomR.ask===true);
ok('Raum-Karten mit ↗ App öffnen (nur mit Endpoint)', roomR.open===true);
ok('Verwandt-Score-Badge je Karte', roomR.badge===true);
ok('Knoten-Namen gerendert', roomR.names===true);
ok('S2: jede Karte zeigt ihre Bedeutungs-Prüfung (passt · passt nicht)',
  JSON.stringify(roomR.meaning)===JSON.stringify(['passt|✓ Bedeutung passt zur Beschreibung','passt-nicht|⚠ Bedeutung passt nicht zur Beschreibung — kein Vorrang']), JSON.stringify(roomR.meaning));

// 4) 🧬 nur-verwandte blendet Fremde aus (Filter wirkt auf gerenderte Karten)
const filtered = await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  const btn=[...fly.querySelectorAll('button')].find(b=>/nur verwandte/.test(b.textContent));
  if(!/an$/.test(btn.textContent.trim())) btn.click(); // auf „an"
  return { txt: fly.querySelector('#pbfly-a-0')? 'has-room':'', showsKoch:/Kochfreund/.test(fly.textContent), showsFremd:/Fremd/.test(fly.textContent) };
});
ok('🧬-Filter: Verwandter bleibt sichtbar', filtered.showsKoch===true);
ok('🧬-Filter: Nicht-Verwandter ausgeblendet', filtered.showsFremd===false);

// 5) Netzweite Frage fail-soft: leeres Feld → freundlicher Hinweis, kein Crash
const emptyAsk = await page.evaluate(async()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  fly.querySelector('input.pbnet-field').value='';
  [...fly.querySelectorAll('button')].find(b=>/Antwort holen/.test(b.textContent)).click();
  await new Promise(r=>setTimeout(r,200));
  return fly.querySelector('pre').textContent;
});
ok('Leere Frage → Hinweis (kein Crash)', /eintippen|Frage/i.test(emptyAsk), `("${(emptyAsk||'').slice(0,50)}")`);

// 6) Mehrfachauswahl (Klaus 2026-07-18): Alle/keine/einzelne + „Ausgewählte fragen"
//    an mehrere Knoten auf einmal. Filter aus + neu entdecken, damit beide Karten da sind.
await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  const rel=[...fly.querySelectorAll('button')].find(b=>/nur verwandte/.test(b.textContent));
  if(/an$/.test(rel.textContent.trim())) rel.click(); // Filter AUS
});
await page.click('#pbNetPanel .pbnet-tool >> text=👥 Wer ist im Raum?');
await page.waitForTimeout(300);
const msUi = await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  return {
    selAll: !!fly.querySelector('#pbfly-selall'),
    perCard: fly.querySelectorAll('.pbfly-sel').length,
    askMany: !!fly.querySelector('#pbfly-askmany'),
    count0: (fly.querySelector('#pbfly-selcount')||{}).textContent||'',
  };
});
ok('Mehrfachauswahl: „Alle"-Häkchen vorhanden', msUi.selAll===true);
ok('Mehrfachauswahl: Häkchen je Knoten (2)', msUi.perCard===2, 'n='+msUi.perCard);
ok('Mehrfachauswahl: „Ausgewählte fragen"-Knopf vorhanden', msUi.askMany===true);
ok('Mehrfachauswahl: Startzähler „keine ausgewählt"', /keine/.test(msUi.count0));

// „Alle" anhaken → beide gewählt, Zähler 2; dann ein einzelnes abwählen → 1
const msSel = await page.evaluate(()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  const all=fly.querySelector('#pbfly-selall'); all.checked=true; all.dispatchEvent(new Event('change'));
  const c2=(fly.querySelector('#pbfly-selcount')||{}).textContent||'';
  const boxes=[...fly.querySelectorAll('.pbfly-sel')]; boxes[0].checked=false; boxes[0].dispatchEvent(new Event('change'));
  const c1=(fly.querySelector('#pbfly-selcount')||{}).textContent||'';
  return { c2, c1 };
});
ok('„Alle" wählt alle (2 ausgewählt)', /2 ausgew/.test(msSel.c2), msSel.c2);
ok('Einzelnes abwählen → 1 ausgewählt', /1 ausgew/.test(msSel.c1), msSel.c1);

// „Ausgewählte fragen" ohne Frage → Hinweis; mit Frage → askNode je gewähltem Knoten
const msEmpty = await page.evaluate(async()=>{
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  fly.querySelector('input.pbnet-field').value='';
  fly.querySelector('#pbfly-askmany').click();
  await new Promise(r=>setTimeout(r,150));
  return fly.querySelector('pre').textContent;
});
ok('Ausgewählte fragen ohne Frage → Hinweis (kein Crash)', /eintippen|ausgewählt/i.test(msEmpty), `("${(msEmpty||'').slice(0,40)}")`);

const msAsk = await page.evaluate(async()=>{
  // askNode mocken: sofortige Antwort, damit der Multi-Ask messbar ist
  window.SbkimRendezvous.askNode = async(card)=>({ ok:true, results:[{label:'Antwort von '+(card.nodeName||'?'), score:0.9}] });
  const fly=document.querySelector('#pbNetPanel .pbnet-tool');
  // beide wählen
  const all=fly.querySelector('#pbfly-selall'); all.checked=true; all.dispatchEvent(new Event('change'));
  fly.querySelector('input.pbnet-field').value='Wer hat ein leichtes Sommeressen?';
  fly.querySelector('#pbfly-askmany').click();
  await new Promise(r=>setTimeout(r,400));
  const slots=[...fly.querySelectorAll('[id^="pbfly-a-"]')].filter(s=>getComputedStyle(s).display!=='none' && /Antwort von/.test(s.textContent));
  return { answered: slots.length, out: fly.querySelector('pre').textContent };
});
ok('Ausgewählte fragen → Frage geht an mehrere Knoten (Antworten je Knoten)', msAsk.answered>=2, 'slots='+msAsk.answered);
ok('Ausgewählte fragen → Sammel-Meldung', /Fertig an 2/.test(msAsk.out||''), `("${(msAsk.out||'').slice(-60)}")`);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,180));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
