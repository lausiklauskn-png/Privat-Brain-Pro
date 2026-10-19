// Beweis: bessere Bild-Beschreibung per Mistral (EU), opt-in + BYOK (Klaus 2026-07-17:
// lokales Modell beschrieb Wiese/Berg/Häuser nicht). Der Mistral-Endpunkt wird hier
// NACHGESTELLT (Playwright-Route) — geprüft wird die App-Verdrahtung: korrekter Aufruf
// (deutscher Auftrag + Bild als data-URL), deutsche Antwort fließt in Steckbrief + Suche,
// Herkunft "Mistral EU", Default AUS, fail-soft ohne Schlüssel, Neu-beschreiben-Knopf.
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

// Mistral-Endpunkt nachstellen + Anfrage einfangen
let lastReq=null;
await page.route('**/api.mistral.ai/**', async route=>{
  lastReq = JSON.parse(route.request().postData()||'{}');
  await route.fulfill({ status:200, contentType:'application/json',
    body: JSON.stringify({ choices:[{ message:{ content:"Eine sonnige grüne Wiese vor einem bewaldeten Tafelberg mit grauen Felswänden; davor ein kleines Dorf mit Häusern, am Himmel kleine weiße Wolken." } }] }) });
});

await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(400);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// Echtes kleines Bild bauen (Canvas)
const mkImg = async (name)=>page.evaluate(async (nm)=>{
  const cv=document.createElement("canvas"); cv.width=900; cv.height=600;
  const cx=cv.getContext("2d"); cx.fillStyle="#4a2"; cx.fillRect(0,0,900,600); cx.fillStyle="#88a"; cx.fillRect(200,80,420,220);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  return { name:nm };
}, name);

// 1) Default: Schalter AUS -> kein Mistral-Aufruf beim Signieren
const off = await page.evaluate(async ()=>{
  const cv=document.createElement("canvas"); cv.width=600; cv.height=400;
  cv.getContext("2d").fillRect(0,0,600,400);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  await signFile(new File([blob],"ohne-eu.jpg",{type:"image/jpeg"}),"ohne-eu.jpg",null);
  return { euOn: typeof euCaptionOn==="function" ? euCaptionOn() : "fehlt", checked: document.querySelector('#capEU') && document.querySelector('#capEU').checked };
});
ok('EU-Schalter existiert, Default AUS', off.checked===false && off.euOn===false);
ok('Ohne Schalter: kein Mistral-Aufruf', lastReq===null);

// 2) EU an + Schlüssel -> Signieren holt deutsche Beschreibung von "Mistral"
const eu = await page.evaluate(async ()=>{
  AI.key="test-schluessel"; AI.provider="mistral";
  localStorage.setItem("pb_caption_eu","1"); document.querySelector('#capEU').checked=true;
  const cv=document.createElement("canvas"); cv.width=1400; cv.height=900;
  const cx=cv.getContext("2d"); cx.fillStyle="#5b3"; cx.fillRect(0,0,1400,900);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const res=await signFile(new File([blob],"berg-dorf.jpg",{type:"image/jpeg"}),"berg-dorf.jpg",null);
  rebuildIndex();
  const rec=CATALOG.find(x=>x.hash===res.hash);
  return { snippet:rec.snippet, via:rec.via, needsCap:rec.needsCap };
});
ok('Deutsche Beschreibung im Steckbrief (Wiese/Tafelberg/Dorf)', /Wiese/.test(eu.snippet) && /Tafelberg/.test(eu.snippet) && /Dorf/.test(eu.snippet), (eu.snippet||'').slice(0,60));
ok('Herkunft nennt „Mistral EU"', /Mistral EU/.test(eu.via||''), eu.via);
ok('Keine Vormerkung nötig (Beschreibung kam sofort)', eu.needsCap===false);

// 3) Der Aufruf an Mistral war korrekt gebaut (deutscher Auftrag + Bild + Vision-Modell)
ok('Anfrage: echtes SEH-Modell (pixtral) + deutscher Auftrag + Bild als data-URL',
   !!lastReq && /pixtral/.test(lastReq.model||'') &&
   JSON.stringify(lastReq).includes("auf Deutsch") &&
   JSON.stringify(lastReq).includes("data:image/jpeg"), lastReq && lastReq.model);

// 4) Suche findet das Foto über die deutsche Beschreibung
const found = await page.evaluate(()=> search("Dorf am Tafelberg", null).map(h=>h.r.name).some(n=>/berg-dorf/.test(n)) );
ok('Suche „Dorf am Tafelberg" findet das Foto', found===true);

// 5) 🧠 Neu beschreiben (Lightbox-Knopf): altes Foto bekommt die bessere Beschreibung
const redo = await page.evaluate(async ()=>{
  const rec=CATALOG.find(x=>/ohne-eu/.test(x.name));
  const before=rec.snippet||"";
  await redescribe(rec.hash);
  return { changed: rec.snippet!==before && /Wiese|Tafelberg/.test(rec.snippet||''), via: rec.via, btn: !!document.querySelector('#lightboxRedesc') };
});
ok('„Neu beschreiben" holt die bessere Beschreibung nach', redo.changed===true, (redo.via||''));
ok('Knopf im Vollbild vorhanden', redo.btn===true);

// 6) Fail-soft: Mistral-Fehler -> Foto trotzdem signiert, vorgemerkt
await page.unroute('**/api.mistral.ai/**');
await page.route('**/api.mistral.ai/**', route=>route.fulfill({status:500, contentType:'application/json', body:'{}'}));
const soft = await page.evaluate(async ()=>{
  const cv=document.createElement("canvas"); cv.width=500; cv.height=500;
  cv.getContext("2d").fillStyle="#c55"; cv.getContext("2d").fillRect(0,0,500,500);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const res=await signFile(new File([blob],"eu-kaputt.jpg",{type:"image/jpeg"}),"eu-kaputt.jpg",null);
  const rec=CATALOG.find(x=>x.hash===res.hash);
  return { signed: !!rec, needsCap: rec.needsCap };
});
ok('Mistral-Fehler: Foto trotzdem signiert + vorgemerkt (fail-soft)', soft.signed===true && soft.needsCap===true);

// 7) OCR-Müll-Filter: Mistral-OCR-Platzhalter ![img-0.jpeg](img-0.jpeg) landen NICHT im Text
await page.route('**/api.mistral.ai/v1/ocr', route=>route.fulfill({status:200, contentType:'application/json',
  body: JSON.stringify({ pages:[{ markdown:"![img-0.jpeg](img-0.jpeg) YASU" }] }) }));
const ocr = await page.evaluate(async ()=>{
  AI.key="k"; AI.provider="mistral";
  const cv=document.createElement("canvas"); cv.width=300; cv.height=300; cv.getContext("2d").fillRect(0,0,300,300);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const t = await mistralOcr(blob, false);
  return { t };
});
ok('OCR-Text ohne Markdown-Bild-Platzhalter', !/!\[|\]\(/.test(ocr.t) && /YASU/.test(ocr.t), JSON.stringify(ocr.t));

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
