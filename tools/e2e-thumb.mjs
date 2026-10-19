// Beweis: Bild-Vorschau + Vollbild (Klaus 2026-07-17, Muster Mein-Rezeptbuch).
// Beim Signieren eines Bildes entsteht ein kleines Raster-Bild (320 px) + eine
// komprimierte 1024er-Vorschau (JPEG 82 %, MR-Rezept) für Sitzungs-Dateien. Die
// Trefferkarte zeigt die Vorschau, Antippen öffnet das Vollbild (Original, wenn
// erreichbar). Kaputte Bilder: fail-soft, keine Vorschau, kein Crash.
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

// 1) Echtes Bild (Canvas 1600×1200) signieren -> thumb (320) + preview (1024, MR-Rezept)
const r1 = await page.evaluate(async ()=>{
  const cv=document.createElement("canvas"); cv.width=1600; cv.height=1200;
  const cx=cv.getContext("2d"); cx.fillStyle="#2a6"; cx.fillRect(0,0,1600,1200);
  cx.fillStyle="#fda"; cx.beginPath(); cx.arc(800,400,250,0,7); cx.fill();
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const f=new File([blob],"berg-wiese.jpg",{type:"image/jpeg"});
  const res=await signFile(f,"berg-wiese.jpg",null); rebuildIndex();
  const rec=CATALOG.find(x=>x.hash===res.hash);
  const dim = await new Promise(done=>{ const im=new Image(); im.onload=()=>done({w:im.width,h:im.height}); im.src=rec.thumb; });
  const dimP = await new Promise(done=>{ const im=new Image(); im.onload=()=>done({w:im.width,h:im.height}); im.src=rec.preview; });
  return { hasThumb: /^data:image\/jpeg/.test(rec.thumb||''), thumbKB: (rec.thumb||'').length/1024|0,
           hasPrev: /^data:image\/jpeg/.test(rec.preview||''), prevKB: (rec.preview||'').length/1024|0,
           tw:dim.w, th:dim.h, pw:dimP.w, ph:dimP.h };
});
ok('Raster-Bild erzeugt (max 320 px, klein)', r1.hasThumb && Math.max(r1.tw,r1.th)===320 && r1.thumbKB<80, r1.tw+'×'+r1.th+' · '+r1.thumbKB+' KB');
ok('1024er-Vorschau erzeugt (MR-Rezept, komprimiert)', r1.hasPrev && Math.max(r1.pw,r1.ph)===1024, r1.pw+'×'+r1.ph+' · '+r1.prevKB+' KB');

// 2) Trefferkarte zeigt die Vorschau
await page.click('.tab[data-tab="search"]').catch(()=>{});
await page.fill('#q','berg'); await page.waitForTimeout(250);
const card = await page.evaluate(()=>{ const t=document.querySelector('#results .thumbimg'); return { has: !!t, src: t? t.src.slice(0,20):'' }; });
ok('Trefferkarte zeigt Vorschaubild', card.has && /^data:image\/jpeg/.test(card.src), card.src);

// 3) Antippen -> Vollbild (Lightbox) öffnet; Original erreichbar (Session) -> "Original"
await page.click('#results .thumbimg'); await page.waitForTimeout(350);
const lb = await page.evaluate(()=>({
  on: document.querySelector('#lightboxBg').classList.contains('on'),
  src: (document.querySelector('#lightboxImg').src||'').slice(0,5),
  cap: document.querySelector('#lightboxCap').textContent,
}));
ok('Vollbild öffnet sich beim Antippen', lb.on===true);
ok('Vollbild zeigt das Original (Session-Datei erreichbar)', /Original/.test(lb.cap), lb.cap);
await page.click('#lightboxClose'); await page.waitForTimeout(150);
const lbClosed = await page.evaluate(()=>!document.querySelector('#lightboxBg').classList.contains('on'));
ok('Vollbild schließt wieder', lbClosed===true);

// 4) Kaputtes Bild: fail-soft — keine Vorschau, kein Crash
const broken = await page.evaluate(async ()=>{
  const u8=new Uint8Array([0xFF,0xD8,0xFF,0xD9,0x01]);
  const res=await signFile(new File([u8],"kaputt-vorschau.jpg",{type:"image/jpeg"}),"kaputt-vorschau.jpg",null);
  const rec=CATALOG.find(x=>x.hash===res.hash);
  return { signed: !!rec, thumb: rec&&rec.thumb };
});
ok('Kaputtes Bild: signiert, aber ohne Vorschau (fail-soft)', broken.signed===true && !broken.thumb);

// 5) Text-Datei bekommt KEINE Vorschau
const txt = await page.evaluate(async ()=>{
  const res=await signFile(new File(["nur text"],"keine-vorschau.txt",{type:"text/plain"}),"keine-vorschau.txt",null);
  const rec=CATALOG.find(x=>x.hash===res.hash); return !rec.thumb;
});
ok('Text-Datei ohne Vorschau', txt===true);

// 6) Vorschau-Nachzieher: thumb entfernen -> thumbBackfill stellt sie wieder her
const bf = await page.evaluate(async ()=>{
  const rec=CATALOG.find(x=>/berg-wiese/.test(x.name));
  rec.thumb=null; rec.preview=null; await idbPut("catalog", rec);
  await thumbBackfill();
  return { thumb: /^data:image\/jpeg/.test(rec.thumb||''), preview: /^data:image\/jpeg/.test(rec.preview||'') };
});
ok('Nachzieher stellt Vorschau wieder her', bf.thumb===true && bf.preview===true);

// 7) WIEDERSEHEN heilt (Klaus-Befund): altes Foto ohne Vorschau + Original nicht mehr
// greifbar (wie nach Neuladen) -> dasselbe Foto NOCHMAL einwerfen -> "schon bekannt",
// aber Vorschau wird ergänzt und das Original ist wieder greifbar (Vollbild).
const again = await page.evaluate(async ()=>{
  const rec=CATALOG.find(x=>/berg-wiese/.test(x.name));
  // Zustand "nach Neuladen" nachstellen: keine Vorschau, Original weg
  rec.thumb=null; rec.preview=null; await idbPut("catalog", rec);
  SESSION_FILES.delete(rec.hash);
  // dieselben Bytes erneut bauen und einwerfen
  const cv=document.createElement("canvas"); cv.width=1600; cv.height=1200;
  const cx=cv.getContext("2d"); cx.fillStyle="#2a6"; cx.fillRect(0,0,1600,1200);
  cx.fillStyle="#fda"; cx.beginPath(); cx.arc(800,400,250,0,7); cx.fill();
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const f=new File([blob],"berg-wiese.jpg",{type:"image/jpeg"});
  const res=await signFile(f,"berg-wiese.jpg",null);
  return { skipped:res.skipped, thumb:/^data:image\/jpeg/.test(rec.thumb||''), preview:/^data:image\/jpeg/.test(rec.preview||''), sess: SESSION_FILES.has(rec.hash) };
});
ok('Wiedersehen: "schon bekannt", aber Vorschau ergänzt', again.skipped===true && again.thumb===true && again.preview===true);
ok('Wiedersehen: Original wieder greifbar (Vollbild/Neu-beschreiben)', again.sess===true);

// 8) Katalog-Gruppen-Ansicht (showGroup) zeigt jetzt AUCH das Vorschaubild (Klaus-Befund:
// in dieser Ansicht fehlte die Vorschau).
const grp = await page.evaluate(()=>{
  const rec=CATALOG.find(x=>/berg-wiese/.test(x.name));
  showGroup(rec.category);
  const img=[...document.querySelectorAll('#results .thumbimg')].find(t=>t.dataset.hash===rec.hash);
  return { has: !!img, src: img? img.src.slice(0,20):'' };
});
ok('Katalog-Gruppe zeigt Vorschaubild', grp.has && /^data:image\/jpeg/.test(grp.src), grp.src);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
