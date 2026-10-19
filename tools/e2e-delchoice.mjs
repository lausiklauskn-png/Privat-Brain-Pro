// Beweis: Lösch-WAHL direkt an der Stelle (Klaus 2026-07-17). Der 🗑-Knopf (Suche, Katalog,
// Vollbild) öffnet eine Wahl: "nur aus dem Katalog nehmen" (Original bleibt) ODER "Katalog +
// Original löschen" (nur bei verbundenem Ordner). Sitzungsdatei: nur Katalog-Weg, ehrlicher
// Hinweis. Das Original wird NUR auf ausdrückliche Wahl gelöscht (liest nur · bewegt nichts).
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
const hasHash = (h)=>page.evaluate((hash)=>CATALOG.some(x=>x.hash===hash), h);

// Korpus: verbundener Ordner (Mock-Handle) + Sitzungs-Bild
await page.evaluate(()=>{
  window.__removed=null;
  const mk=(hash,name,path,dirId)=>({hash,name,path,dirId,type:"image/jpeg",ext:"jpg",size:10,date:1700000000000,vector:new Float32Array([0.1]),tf:{a:1},nameTokens:["x"],snippet:"foto",tags:[],dupes:[],category:"Foto/Bild",thumb:"data:image/jpeg;base64,/9j/AA=="});
  const handle={ name:"Fotos", async requestPermission(){ return "granted"; }, async getDirectoryHandle(){ return this; }, async removeEntry(n){ window.__removed=n; } };
  DIR_HANDLES.set("d1", handle);
  CATALOG.push(mk("ord1","haus.jpg","Fotos/haus.jpg","d1"));   // verbundener Ordner
  CATALOG.push(mk("ses1","frei.jpg","frei.jpg",null));         // Sitzungsdatei
  rebuildIndex(); refreshAll();
});

// 1) Wahl-Dialog: verbundener Ordner -> beide Knöpfe (nur Katalog + auch Original)
await page.evaluate(()=>window.PBDelete.choose("ord1"));
await page.waitForTimeout(150);
const m1 = await page.evaluate(()=>({
  open: document.querySelector('#modalBg').classList.contains('on'),
  only: !!document.querySelector('#pbDelOnly'),
  both: !!document.querySelector('#pbDelBoth'),
}));
ok('Verbundener Ordner: Wahl-Dialog mit BEIDEN Optionen', m1.open && m1.only && m1.both);

// 2) "Nur aus dem Katalog nehmen" -> Eintrag weg, Original NICHT angefasst
await page.click('#pbDelOnly'); await page.waitForTimeout(200);
ok('Nur-Katalog: Eintrag entfernt', !(await hasHash("ord1")));
ok('Nur-Katalog: Original NICHT gelöscht (removeEntry nicht aufgerufen)', (await page.evaluate(()=>window.__removed))===null);

// 3) Sitzungsdatei: nur Katalog-Option, ehrlicher Hinweis statt Original-Knopf
await page.evaluate(()=>window.PBDelete.choose("ses1"));
await page.waitForTimeout(150);
const m2 = await page.evaluate(()=>({ only: !!document.querySelector('#pbDelOnly'), both: !!document.querySelector('#pbDelBoth'), hint: /Browser/.test(document.querySelector('#modalBox').textContent) }));
ok('Sitzungsdatei: nur Katalog-Option, kein Original-Knopf + Hinweis', m2.only && !m2.both && m2.hint);
await page.click('#pbDelOnly'); await page.waitForTimeout(150);
ok('Sitzungsdatei: Eintrag entfernt', !(await hasHash("ses1")));

// 4) Auch-Original-Weg: neues verbundenes Bild -> "beide" -> removeEntry am Mock-Handle
await page.evaluate(()=>{
  window.__removed=null;
  const mk=(hash,name,path,dirId)=>({hash,name,path,dirId,type:"image/jpeg",ext:"jpg",size:10,date:1,vector:new Float32Array([0.1]),tf:{a:1},nameTokens:["x"],snippet:"x",tags:[],dupes:[],category:"Foto/Bild"});
  CATALOG.push(mk("ord2","weg.jpg","Fotos/weg.jpg","d1")); rebuildIndex();
});
await page.evaluate(()=>window.PBDelete.choose("ord2"));
await page.waitForTimeout(150);
await page.click('#pbDelBoth'); await page.waitForTimeout(300);
ok('Auch-Original: Datei im Ordner gelöscht (removeEntry mit Dateiname)', (await page.evaluate(()=>window.__removed))==="weg.jpg");
ok('Auch-Original: Katalog-Eintrag ebenfalls weg', !(await hasHash("ord2")));

// 5) Knöpfe sind da, wo Klaus sie braucht: Suche, Katalog-Gruppe, Vollbild
// echtes signiertes Bild (Sitzungsdatei) -> per Namenssuche findbar
const showHash = await page.evaluate(async ()=>{
  const cv=document.createElement("canvas"); cv.width=400; cv.height=300; cv.getContext("2d").fillStyle="#37a"; cv.getContext("2d").fillRect(0,0,400,300);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const res=await signFile(new File([blob],"zeigfoto.jpg",{type:"image/jpeg"}),"zeigfoto.jpg",null);
  rebuildIndex(); refreshAll(); return res.hash;
});
await page.click('.tab[data-tab="search"]').catch(()=>{});
await page.evaluate(()=>{ MODE="name"; }); // Namenssuche -> sicherer Treffer über den Dateinamen
await page.fill('#q','zeigfoto'); await page.waitForTimeout(250);
ok('Suche: 🗑-Knopf an der Karte', await page.evaluate(()=>!!document.querySelector('#results .delBtn')));
const grpDel = await page.evaluate(()=>{ showGroup("Foto/Bild"); return !!document.querySelector('#results .delBtn'); });
ok('Katalog-Gruppe: 🗑-Knopf an der Karte', grpDel===true);
const lbDel = await page.evaluate(async (h)=>{ await openLightbox(h); const b=document.querySelector('#lightboxDel'); return !!b && b.offsetParent!==null; }, showHash);
ok('Vollbild: 🗑-Löschen-Knopf sichtbar', lbDel===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
