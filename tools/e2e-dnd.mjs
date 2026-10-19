// Beweis: Drag & Drop direkt auf die Knöpfe. Zieht man eine Datei/Mail über einen Knopf,
// „geht der Knopf auf" (CSS-Klasse dropopen), und beim Loslassen wird die Datei eingelesen —
// für 📁 Ordner, 📄 Dateien und 📧 Mails. Der bestehende #drop-Bereich bleibt funktional.
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

// Helfer im Browser: DragEvent mit echter DataTransfer + Datei auf einen Selektor feuern.
async function fire(sel, kind, files){
  return page.evaluate(({sel,kind,files})=>{
    const el=document.querySelector(sel);
    const dt=new DataTransfer();
    (files||[]).forEach(f=>dt.items.add(new File([f.body], f.name, {type:f.type||"text/plain"})));
    el.dispatchEvent(new DragEvent(kind,{bubbles:true,cancelable:true,dataTransfer:dt}));
    return el.classList.contains("dropopen") || el.classList.contains("hot");
  }, {sel,kind,files});
}

// 1) Über den 📧-Mail-Knopf ziehen -> Knopf geht auf
const openedMail = await fire("#pickMail","dragover",[]);
ok('📧-Knopf geht bei Drüberziehen auf (dropopen)', openedMail===true);
// dragleave -> Knopf geht wieder zu
const stillOpen = await page.evaluate(()=>{ const el=document.querySelector("#pickMail");
  el.dispatchEvent(new DragEvent("dragleave",{bubbles:true,cancelable:true,dataTransfer:new DataTransfer()}));
  return el.classList.contains("dropopen"); });
ok('📧-Knopf geht bei Verlassen wieder zu', stillOpen===false);

// 2) Eine .eml-Mail auf den 📧-Knopf fallen lassen -> wird als Mail eingelesen
const EML = ['From: A <a@x.de>','Subject: Drag-Test Pilze','Date: Mon, 3 Jun 2019 10:00:00 +0200',
  'Content-Type: text/plain; charset=utf-8','','Hallo, Drag-and-Drop Nachricht ueber Pilze.'].join('\n');
await fire("#pickMail","drop",[{name:"drag.eml", body:EML, type:"message/rfc822"}]);
await page.waitForTimeout(400);
const mailIn = await page.evaluate(()=>({
  open: document.querySelector("#pickMail").classList.contains("dropopen"),
  mail: CATALOG.some(r=>r.category==='E-Mail' && /Drag-Test Pilze/.test(r.name||'')),
}));
ok('📧-Knopf geht nach dem Loslassen wieder zu', mailIn.open===false);
ok('Gedroppte .eml wurde als E-Mail eingelesen', mailIn.mail===true);

// 3) Eine Textdatei auf den 📄-Dateien-Knopf fallen lassen -> im Katalog
const beforeN = await page.evaluate(()=>CATALOG.length);
await fire("#pickFiles","drop",[{name:"notiz-dnd.txt", body:"Eine Notiz ueber Urlaub am Meer und Sonne.", type:"text/plain"}]);
await page.waitForTimeout(400);
const fileIn = await page.evaluate((b)=>({
  grew: CATALOG.length>b,
  has: CATALOG.some(r=>/notiz-dnd/.test(r.name||'')),
}), beforeN);
ok('Gedroppte Datei auf 📄-Knopf landet im Katalog', fileIn.grew && fileIn.has);

// 4) Regression: der große #drop-Bereich nimmt weiterhin Dateien an
const beforeN2 = await page.evaluate(()=>CATALOG.length);
await fire("#drop","drop",[{name:"gross-drop.txt", body:"Noch ein Text zum Testen des Drop-Bereichs.", type:"text/plain"}]);
await page.waitForTimeout(400);
const dropIn = await page.evaluate((b)=>CATALOG.length>b && CATALOG.some(r=>/gross-drop/.test(r.name||'')), beforeN2);
ok('#drop-Bereich funktioniert weiterhin (Regression)', dropIn===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
