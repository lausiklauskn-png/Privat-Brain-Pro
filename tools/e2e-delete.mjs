// Beweis Stufe 1b-3: Datei an Ort und Stelle löschen. Verbundener Ordner (Mock-Handle,
// das removeEntry mitschreibt) -> nach Bestätigung wirklich geloescht + Katalog-Eintrag raus.
// Sitzungsdatei (kein Handle) -> ehrliche Verweigerung. Abbrechen -> nichts passiert.
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

// prepare: a connected-folder entry (mock handle) + a session entry
await page.evaluate(()=>{
  window.__removed=null;
  const mkEntry=(hash,name,path,dirId)=>({hash,name,path,dirId,type:"text/plain",size:10,date:1700000000000,vector:new Float32Array([0.1]),tf:{a:1},tokens:["x"],snippet:"text",tags:[],dupes:[],category:"Text/Notiz"});
  const handle={ name:"MeinOrdner", async requestPermission(){ return "granted"; }, async getDirectoryHandle(n){ return this; }, async removeEntry(n){ window.__removed=n; } };
  DIR_HANDLES.set("d1", handle);
  CATALOG.push(mkEntry("del1","muell.txt","MeinOrdner/muell.txt","d1"));   // connected -> deletable
  CATALOG.push(mkEntry("del2","noch.txt","MeinOrdner/noch.txt","d1"));     // for cancel test
  CATALOG.push(mkEntry("sess1","gewaehlt.txt","gewaehlt.txt",null));       // session -> not deletable
});

// 1) session file -> refuses, entry stays
await page.evaluate(()=>{ window.confirm=()=>true; });
await page.evaluate(async ()=>{ await window.PBDelete.deleteFile("sess1"); });
await page.waitForTimeout(200);
ok('Sitzungsdatei: nicht loeschbar, Eintrag bleibt', await hasHash("sess1"));
ok('Sitzungsdatei: removeEntry NICHT aufgerufen', (await page.evaluate(()=>window.__removed))===null);

// 2) Abbrechen im Wahl-Dialog -> nichts passiert (die Bestätigung liegt jetzt in der
//    Lösch-WAHL: choose() öffnet den Dialog, "Abbrechen" lässt Datei + Eintrag unberührt).
await page.evaluate(()=>window.PBDelete.choose("del2"));
await page.waitForTimeout(150);
await page.click('#pbDelCancel'); await page.waitForTimeout(150);
ok('Abbrechen: Datei NICHT geloescht, Eintrag bleibt', await hasHash("del2") && (await page.evaluate(()=>window.__removed))===null);

// 3) deleteFile (= der bestätigte "auch Original"-Weg) -> physical delete + catalog entry removed
await page.evaluate(async ()=>{ await window.PBDelete.deleteFile("del1"); });
await page.waitForTimeout(300);
ok('Verbundener Ordner: removeEntry("muell.txt") aufgerufen', (await page.evaluate(()=>window.__removed))==="muell.txt", await page.evaluate(()=>window.__removed));
ok('Katalog-Eintrag nach Loeschen entfernt', !(await hasHash("del1")));

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
