// Beweis Stufe 3b (Einbau-Weg, ohne das echte 200-MB-Modell): der Bild-Beschreiber-
// Steckplatz PB_CAPTION wird von describeImage() genutzt; eine Beschreibung fließt in den
// Steckbrief UND macht das Foto per Bedeutung auffindbar (z. B. „Palmen"). Fail-soft ohne
// Modell. Der Schalter/Persistenz in den Einstellungen ist verdrahtet. Der ECHTE Modell-Lauf
// (pb-caption.js) ist am Tablet zu prüfen — hier mit einem Mock bewiesen.
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

// Minimales JPEG (nur FFD8…FFD9, kein EXIF) — soll NUR über die Bild-Beschreibung findbar werden
const JPG = new Uint8Array([0xFF,0xD8,0xFF,0xD9]);

// 1) Ohne Beschreiber: Foto ohne Text/EXIF ist NICHT über „Palmen" findbar
const before = await page.evaluate(async (arr)=>{
  const u8=new Uint8Array(arr); const f=new File([u8],"strandbild.jpg",{type:"image/jpeg"});
  const r=await describeImage(f, u8.buffer);
  return { capDefined: typeof window.PB_CAPTION, via:r.via, text:r.text };
}, [...JPG]);
ok('Standard: kein Bild-Beschreiber verdrahtet (fail-soft)', before.capDefined==='undefined', 'PB_CAPTION='+before.capDefined);

// 2) Mock-Beschreiber setzen (wie es pb-caption.js täte) -> Beschreibung fließt in den Text
const withCap = await page.evaluate(async (arr)=>{
  window.PB_CAPTION = async ()=> "ein Strand mit Palmen und Meer bei Sonnenuntergang";
  const u8=new Uint8Array(arr); const f=new File([u8],"strandbild.jpg",{type:"image/jpeg"});
  const r=await describeImage(f, u8.buffer);
  return { via:r.via, text:r.text };
}, [...JPG]);
ok('Mit Beschreiber: Beschreibung steht im Steckbrief-Text', /Palmen/.test(withCap.text) && /Strand/.test(withCap.text), withCap.text.slice(0,60));
ok('Herkunft nennt „Bild-Beschreibung"', /Bild-Beschreibung/.test(withCap.via), withCap.via);

// 3) Signieren + suchen: Foto ist über die BESCHRIEBENEN Dinge auffindbar (Palmen)
const found = await page.evaluate(async (arr)=>{
  window.PB_CAPTION = async ()=> "ein Strand mit Palmen und Meer bei Sonnenuntergang";
  const u8=new Uint8Array(arr); const f=new File([u8],"strandbild.jpg",{type:"image/jpeg"});
  await signFile(f, "strandbild.jpg", null); rebuildIndex();
  const hits = search("Palmen am Strand", null).map(h=>h.r.name);
  return { hasPhoto: hits.some(n=>/strandbild/.test(n)), hits };
}, [...JPG]);
ok('Suche „Palmen am Strand" findet das Foto (über die Beschreibung)', found.hasPhoto===true, (found.hits||[]).join(', '));

// 4) Einstellungen: Schalter da, Default aus, Persistenz greift
await page.click('.tab[data-tab="settings"]').catch(()=>{});
await page.waitForTimeout(120);
const uiOff = await page.evaluate(()=>({
  hasSwitch: !!document.querySelector('#capEnable'),
  checked: document.querySelector('#capEnable') && document.querySelector('#capEnable').checked,
  model: (document.querySelector('#capModel')||{}).value,
}));
ok('Einstellungen: Schalter „Bild-Beschreiber" vorhanden, Default AUS', uiOff.hasSwitch && uiOff.checked===false, 'checked='+uiOff.checked);
ok('Einstellungen: Modell-Feld vorbelegt', /vit-gpt2/.test(uiOff.model||''), uiOff.model);

const persisted = await page.evaluate(async ()=>{
  document.querySelector('#capEnable').checked=true;
  document.querySelector('#capServer').value='https://dein-server.de/pb-models/';
  await applyCaptionSetting();
  return { on: localStorage.getItem('pb_caption_on'), model: localStorage.getItem('pb_caption_model'),
           base: localStorage.getItem('pb_caption_baseurl'),
           cfgBase: window.PBCaption && window.PBCaption._cfg.baseUrl };
});
ok('Aktivieren wird gemerkt (localStorage pb_caption_on=1)', persisted.on==='1' && /vit-gpt2/.test(persisted.model||''), persisted.on+' / '+persisted.model);
ok('Server-Adresse (Hetzner) wird gemerkt + an das Modell durchgereicht', persisted.base==='https://dein-server.de/pb-models/' && persisted.cfgBase==='https://dein-server.de/pb-models/', persisted.base+' | cfg='+persisted.cfgBase);

// 4b) ENTKOPPLUNG (Klaus-Befund Tab-Absturz/0-0-Hänger): Modul geladen, Modell NICHT bereit
// -> Signieren wartet NICHT, Foto wird vorgemerkt (needsCap) und später nachbeschrieben.
const dec = await page.evaluate(async (arr)=>{
  // reales Modul ist durch applyCaptionSetting geladen; Modell nicht bereit (isReady=false).
  // PB_CAPTION absichtlich "hängend" — dürfte NIE aufgerufen werden:
  window.PB_CAPTION = ()=> new Promise(()=>{});
  // eigene Bytes (sonst Dedupe mit dem ersten Testbild — gleicher Hash)
  const u8=new Uint8Array([...arr, 0x20, 0x77]); const f=new File([u8],"haengt-nicht.jpg",{type:"image/jpeg"});
  const t0=performance.now();
  const res=await signFile(f, "haengt-nicht.jpg", null);
  const ms=performance.now()-t0;
  const rec=CATALOG.find(x=>x.hash===res.hash);
  return { ms, needsCap: rec&&rec.needsCap, ready: window.PBCaption && window.PBCaption.isReady && window.PBCaption.isReady() };
}, [...JPG]);
ok('Signieren wartet NICHT aufs Modell (schnell fertig)', dec.ms < 3000, dec.ms.toFixed(0)+' ms');
ok('Foto ist für den Nachbeschreiber vorgemerkt (needsCap)', dec.needsCap===true, 'ready='+dec.ready);

// 4c) Nachbeschreiber: Modell wird „bereit" -> captionBackfill beschreibt das Foto im Hintergrund
const bf = await page.evaluate(async ()=>{
  window.PBCaption = { isReady:()=>true, warmup:async()=>{}, configure(){}, _cfg:{} };
  window.PB_CAPTION = async ()=> "ein Hund im Garten vor einem Zaun";
  await captionBackfill();
  const rec=CATALOG.find(x=>/haengt-nicht/.test(x.name));
  const hits=search("Hund im Garten", null).map(h=>h.r.name);
  return { snippet:rec&&rec.snippet, needsCap:rec&&rec.needsCap, via:rec&&rec.via, found:hits.some(n=>/haengt-nicht/.test(n)) };
});
ok('Nachbeschreiber trägt die Beschreibung nach', /Hund im Garten/.test(bf.snippet||''), (bf.snippet||'').slice(0,50));
ok('Vormerkung erledigt (needsCap false) + via nennt Bild-Beschreibung', bf.needsCap===false && /Bild-Beschreibung/.test(bf.via||''), bf.via);
ok('Nachbeschriebenes Foto ist per Suche findbar', bf.found===true);

// 5) Vollbreiter Ladebalken: Fortschritts-Ereignisse zeigen Balken + Datei/%/MB, „ready" blendet aus
const prog = await page.evaluate(async ()=>{
  window.dispatchEvent(new CustomEvent("pb:caption-progress",{detail:{status:"progress",file:"onnx/encoder_model_quantized.onnx",progress:43.2,loaded:36*1048576,total:84*1048576}}));
  const wrap=document.querySelector('#capProgWrap');
  const midOn = wrap.classList.contains('on');
  const width = document.querySelector('#capProgFill').style.width;
  const text = document.querySelector('#capProgText').textContent;
  const fullWidth = Math.abs(wrap.getBoundingClientRect().width - wrap.parentElement.getBoundingClientRect().width) < 40;
  window.dispatchEvent(new CustomEvent("pb:caption-progress",{detail:{status:"ready"}}));
  const readyText = document.querySelector('#capProgText').textContent;
  await new Promise(r=>setTimeout(r,1700));
  const offAfter = !wrap.classList.contains('on');
  return { midOn, width, text, fullWidth, readyText, offAfter };
});
ok('Ladebalken erscheint bei Fortschritt (voller Breite)', prog.midOn && prog.fullWidth, 'breit='+prog.fullWidth);
ok('Ladebalken zeigt Datei · Prozent · MB', /encoder/.test(prog.text) && /43\s?%/.test(prog.text) && /36\.0 \/ 84\.0 MB/.test(prog.text), prog.text);
ok('Balkenfüllung folgt dem Prozentwert', prog.width==='43.2%', prog.width);
ok('„bereit" -> Häkchen + Balken blendet aus', /bereit ✓/.test(prog.readyText) && prog.offAfter===true);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
