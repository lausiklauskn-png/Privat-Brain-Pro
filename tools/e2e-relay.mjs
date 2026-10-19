// Fail-soft proof for Teil B ("Mit Kollegen verbinden"). The live relay is wss://
// and NOT reachable in this sandbox (like the whole SBKIM ecosystem) — so this proves
// the WIRING is present and degrades gracefully offline, never crashing the app.
// The real cross-computer handshake is verified by Klaus on two devices in a browser.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const EXEC = process.env.CB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.json':'application/json','.js':'text/javascript','.png':'image/png' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const b=await readFile(join(ROOT,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);
} catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(0,r));
const PORT=server.address().port;

const browser = await chromium.launch({executablePath:EXEC, args:['--no-sandbox']});
const page = await browser.newPage();
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(500); // let module scripts + Modus A run
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  '+x:''}`);};

// modules loaded (globals present)
const globals = await page.evaluate(()=>({
  storage: !!window.SbkimStorage, spore: !!window.SbkimSpore, ana: !!window.SbkimAnastomose,
  relay: !!window.SbkimNostrRelay, rdv: !!window.SbkimRendezvous, emb: !!window.SbkimEmbedding, match: !!window.SbkimMatch,
  suffix: (window.SbkimRendezvous && window.SbkimRendezvous._meta && window.SbkimRendezvous._meta.dbSuffix) || null,
}));
ok('Relais-Stack geladen (Storage/Spore/Anastomose/Relay/Rendezvous)', globals.storage&&globals.spore&&globals.ana&&globals.relay&&globals.rdv, JSON.stringify(globals));
ok('Modul 03/04 geladen (Modell + Match)', globals.emb&&globals.match);
ok('Modus A: eigene Schublade dbSuffix="privatbrain"', globals.suffix==='privatbrain', `(${globals.suffix})`);

// „Mit dem Knotennetz verbinden" lebt jetzt AUSSCHLIESSLICH im schwebenden Flieger
// (Klaus 2026-07-19: alter Netz-Tab weg). Flieger öffnen, Knöpfe da?
await page.evaluate(()=>window.PBNetWidget.open());
await page.waitForTimeout(200);
const netUi = await page.evaluate(()=>{
  const tool=document.querySelector('#pbNetPanel .pbnet-tool'); const t=tool?tool.textContent:'';
  return {
    open: !!(window.PBNetWidget && window.PBNetWidget.isOpen()),
    tool: !!tool,
    btns: /Verbinden & anmelden/.test(t) && /Wer ist im Raum/.test(t) && /Antworten: (an|aus)/.test(t) && /Aufräumen & neu anmelden/.test(t),
    out: !!(tool && tool.querySelector('pre')),
    noTab: !document.querySelector('.tab[data-tab="net"]') && !document.querySelector('#pbNetTabMount'),
    noForeign: !document.querySelector('#sbkim-rdv-btn') && !window.SbkimRendezvousUI,
  };
});
ok('Flieger „🌐 Netz" zeigt das Werkzeug (alle Knöpfe + Ausgabe)', netUi.open && netUi.tool && netUi.btns && netUi.out);
ok('Kein fester Netz-Tab mehr (nur der Flieger)', netUi.noTab===true);
ok('Kein fremdes Modul-23-UI (eigenes natives Werkzeug)', netUi.noForeign===true);

// „Wer ist im Raum?" offline -> saubere Degradierung, kein Crash
await page.click('#pbNetPanel .pbnet-tool >> text=👥 Wer ist im Raum?');
await page.waitForTimeout(2500);
const out1 = await page.$eval('#pbNetPanel .pbnet-tool pre', el=>el.textContent);
ok('„Wer ist im Raum?" degradiert sauber (kein Crash offline)', /Raum|Relais|Kollege|niemand|Suche/i.test(out1||''), `("${(out1||'').slice(0,70)}")`);

// „Verbinden" offline -> fail-soft Meldung (Modell/Relais unerreichbar), kein Crash
await page.click('#pbNetPanel .pbnet-tool >> text=🌐 Verbinden & anmelden');
await page.waitForTimeout(2500);
const out2 = await page.$eval('#pbNetPanel .pbnet-tool pre', el=>el.textContent);
ok('„Verbinden" fail-soft offline (kein Crash)', out2 && out2.length>0);

ok('Keine unbehandelten Seiten-Fehler', errors.length===0, errors.slice(0,3).join(' | '));

await browser.close(); server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if(fail) process.exit(1);
