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

// „Mit dem Knotennetz verbinden" ist seit 2026-10-21 das Mycel-Fenster des Kanons (Modul 23-UI),
// angedockt in der Kopfleiste. Fenster öffnen, Knöpfe da?
await page.evaluate(()=>window.SbkimRendezvousUI.show());
await page.waitForTimeout(200);
const netUi = await page.evaluate(()=>{
  const panel=document.querySelector('#sbkim-rdv-panel'); const t=panel?panel.textContent:'';
  return {
    open: !!(window.SbkimRendezvousUI && window.SbkimRendezvousUI.isOpen()),
    btns: /Mit dem Knotennetz verbinden/.test(t) && /Wer ist im Raum/.test(t) && /Antworten: (an|aus)/.test(t),
    out: !!document.querySelector('#sbkim-rdv-out'),
    noTab: !document.querySelector('.tab[data-tab="net"]') && !document.querySelector('#pbNetTabMount'),
    docked: !!document.querySelector('header.top [data-sbkim-mycel-platz] #sbkim-rdv-btn'),
    noOld: !window.PBNetWidget && !document.querySelector('#pbNetBtn'),
  };
});
ok('Mycel-Fenster (Modul 23-UI) zeigt das Werkzeug (Knöpfe + Ausgabe)', netUi.open && netUi.btns && netUi.out);
ok('Kein fester Netz-Tab', netUi.noTab===true);
ok('🌐-Pille in der Kopfleiste angedockt, altes app-eigenes Fenster weg', netUi.docked && netUi.noOld);

const button = text => page.evaluate(text => { const b=[...document.querySelectorAll('#sbkim-rdv-panel button')].find(x=>x.textContent.trim()===text); if(b) b.click(); return !!b; }, text);
// „Wer ist im Raum?" offline -> saubere Degradierung, kein Crash
ok('„👥 Wer ist im Raum?" vorhanden', await button('👥 Wer ist im Raum?'));
await page.waitForTimeout(2500);
const out1 = await page.$eval('#sbkim-rdv-out', el=>el.textContent);
ok('„Wer ist im Raum?" degradiert sauber (kein Crash offline)', /Raum|Relais|Knoten|niemand|Suche|Netz/i.test(out1||''), `("${(out1||'').slice(0,70)}")`);

// „Verbinden" offline -> fail-soft Meldung (Modell/Relais unerreichbar), kein Crash
ok('„🌐 Mit dem Knotennetz verbinden" vorhanden', await button('🌐 Mit dem Knotennetz verbinden'));
await page.waitForTimeout(2500);
const out2 = await page.$eval('#sbkim-rdv-out', el=>el.textContent);
ok('„Verbinden" fail-soft offline (kein Crash)', out2 && out2.length>0);

ok('Keine unbehandelten Seiten-Fehler', errors.length===0, errors.slice(0,3).join(' | '));

await browser.close(); server.close();
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
if(fail) process.exit(1);
