// Beweis Stufe D: Private Brain ist ein VOLLER SBKIM-Knoten — Status-Lampen (Modul 17) +
// Membran (15, Fremd-KI-Wächter) + Selbst-Siegel (16, Bronze nach 7 Pflicht-Modulen) +
// Apoptose (07). Im Siegel-Modal steckt das Andock-Werkzeug (🔑 Identität/Spore-Wizard ·
// ✍ Semantik neu signieren · 🛡 Schutz + sicherheit.html-Overlay). Modul 16 unangetastet
// (byte-1:1, Drift-Guard); der Inhalt wird host-seitig injiziert. Live-Handshake/Gold =
// nur am Tablet beweisbar; headless prüft Mount/Bronze/Modal/Injektion/Fremd-Wächter.
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
await page.waitForTimeout(2000); // Widget(17)→Membran(15)→Siegel(16) booten lassen
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// 1) Alle Schutz-Module geladen + inited
const mods = await page.evaluate(()=>({
  widget: !!(window.SbkimWidget && window.SbkimWidget.init),
  membrane: !!(window.SbkimMembrane && window.SbkimMembrane.init),
  siegel: !!(window.SbkimSiegel && window.SbkimSiegel.init),
  apoptose: !!(window.SbkimApoptose && window.SbkimApoptose.init),
}));
ok('Modul 17 (Status-Widget) geladen', mods.widget===true);
ok('Modul 15 (Membran/Fremd-Wächter) geladen', mods.membrane===true);
ok('Modul 16 (Siegel) geladen', mods.siegel===true);
ok('Modul 07 (Apoptose) geladen', mods.apoptose===true);

// 2) Selbst-Siegel: Bronze nach 7 Pflicht-Modulen + graviertes Band „Private Brain"
const sg = await page.evaluate(()=>{
  const S=window.SbkimSiegel; if(!S) return {no:true};
  return { certified: !!S.isCertified(), stufe: (S._meta||{}).siegelStufe, ribbon: (S._meta||{}).ribbonText,
    badgeMounted: (S._meta||{}).badgeMounted, modalId: (S._meta||{}).modalId,
    certN: (typeof S.getCertifiedModules==='function') ? (S.getCertifiedModules()||[]).length : 0 };
});
ok('Siegel zertifiziert (Bronze, 7 Pflicht-Module erfüllt)', sg.certified===true, 'module='+sg.certN);
ok('Siegel-Stufe = bronze (Gold erst nach Handshake)', sg.stufe==='bronze', 'stufe='+sg.stufe);
ok('Wappen-Band graviert „Private Brain" (ribbonText)', sg.ribbon==='Private Brain', 'ribbon='+sg.ribbon);
ok('Siegel-Badge gemountet', sg.badgeMounted===true);

// 3) Badge klicken → Modal öffnet + das Andock-Werkzeug ist injiziert (host-seitig)
await page.evaluate(()=>{
  const b=document.getElementById('sbkim-siegel-badge'); if(!b) return;
  const t=b.querySelector('*')||b; // Badge ist ein SVG → dispatchEvent statt .click()
  t.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
});
await page.waitForTimeout(500);
/* ⚠ DIE KENNUNGEN SIND SEIT A18 (#87, 2026-09-14) DIE DES KANONS: `sbkim-si-*`.
   #87 hat nur das Praefix der vier Schritte (sbwiz-) nachgezogen; die fuenf
   Element-Kennungen standen weiter auf `pb-*`, und diese Probe war seitdem
   4x rot. Weil `npm test` an && haengt, liefen die drei Pinnwand-Proben
   dahinter einen Monat lang nicht (gemessen 2026-10-13). */
const modal = await page.evaluate(()=>{
  const m=document.getElementById('sbkim-siegel-modal');
  return { present: !!m,
    identOpen: !!document.getElementById('sbkim-si-open'),
    semantik: !!document.getElementById('sbkim-si-semantik-block'),
    schutz: !!document.getElementById('sbkim-si-schutz-block'),
    resign: !!document.getElementById('sbkim-si-semantik-resign') };
});
ok('Siegel-Modal öffnet sich beim Klick', modal.present===true);
ok('🔑 Andock-Wizard-Knopf ins Modal injiziert', modal.identOpen===true);
ok('✍ Semantik-Beschreibung-Block injiziert (Spore neu signieren)', modal.semantik===true && modal.resign===true);
ok('🛡 Schutz-Block injiziert', modal.schutz===true);

// 4) Der 🔑-Andock-Wizard (eigenes Dialog-Modul) mit den 4 Schritten ist gebaut
const wiz = await page.evaluate(()=>{
  const d=document.getElementById('sbkim-si-wizard');
  if(!d) return {no:true};
  return { present:true,
    /* ⚠ DAS PRAEFIX IST SEIT A18 (2026-09-14) NETZWEIT EINS. Vorher stand hier
       `pbwiz-` — ein eigenes Praefix je App, das ausser dieser Datei nirgends
       jemand las und keinen Zusammenstoss verhinderte (gemessen: selbst PWA
       Toolpoint mit ZWEI Knoten auf einer Adresse benutzt dasselbe). */
    s1:!!d.querySelector('#sbwiz-s1'), s2:!!d.querySelector('#sbwiz-s2'),
    s3:!!d.querySelector('#sbwiz-s3'), s4:!!d.querySelector('#sbwiz-s4') };
});
ok('Andock-Wizard-Dialog vorhanden (Identität/Spore/Backup/Wiederherstellen)',
  !wiz.no && wiz.s1 && wiz.s2 && wiz.s3 && wiz.s4);

// 5) Membran läuft (Fremd-KI-Wächter) — kein Crash, FREMD-Lampe-Proxy da
const mem = await page.evaluate(()=>({
  lampFremd: !!document.getElementById('lamp-fremd'),
  membraneMeta: !!(window.SbkimMembrane && window.SbkimMembrane._meta),
}));
ok('Membran-Wächter aktiv (FREMD-Lampe-Proxy im DOM)', mem.lampFremd===true);

// 6) sicherheit.html (Schutz-Overlay-Ziel) ist ausgeliefert
const sec = await page.evaluate(async ()=>{ try{ const r=await fetch('sicherheit.html'); return r.ok; }catch(e){ return false; } });
ok('sicherheit.html vorhanden (Schutz-Erklär-Overlay)', sec===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,200));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
