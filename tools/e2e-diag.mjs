// Beweis: Analyse-Werkzeug (Klaus 2026-07-17) + Absturz-Wächter + Bild-Runterrechnen.
// (1) Jeder Import-Schritt landet mit Uhrzeit im Diagnose-Verlauf (localStorage, überlebt
//     Reload/Absturz). (2) Fehler werden gefangen und protokolliert. (3) Blieb das
//     "Modell startet"-Flag stehen (Absturz), pausiert der Auto-Start; Klaus' Knopf
//     startet ihn bewusst neu. (4) Große Bilder werden fürs Verstehen runtergerechnet.
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
await page.waitForTimeout(500);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

const log = ()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pb_diag_log')||'[]').map(e=>e.msg).join('\n'));

// 1) App-Start protokolliert; Import einer Datei erzeugt Schritte im Verlauf
await page.evaluate(async ()=>{ await signBatch([{file:new File(["Notiz über Pilze im Wald"],"diag-test.txt",{type:"text/plain"}), path:"diag-test.txt", dirId:null}]); });
await page.waitForTimeout(300);
let L = await log();
ok('App-Start steht im Verlauf', /App-Start/.test(L));
ok('Import-Schritte protokolliert (Import: … / Import fertig)', /Import: diag-test\.txt/.test(L) && /Import fertig: 1 neu/.test(L));

// 2) Bild-Import: Verstehen-Schritte + „signiert + gespeichert"
const JPG = [0xFF,0xD8,0xFF,0xD9];
await page.evaluate(async (arr)=>{ const u8=new Uint8Array(arr); await signFile(new File([u8],"diagbild.jpg",{type:"image/jpeg"}), "diagbild.jpg", null); }, JPG);
L = await log();
ok('Bild-Schritte protokolliert (EXIF/OCR/verstanden)', /Bild verstehen: diagbild\.jpg — EXIF/.test(L) && /Bild verstanden: diagbild\.jpg/.test(L));
ok('Bild gespeichert protokolliert', /✓ signiert \+ gespeichert: diagbild\.jpg/.test(L));

// 3) Fehler-Haken: geworfener Fehler landet im Verlauf
await page.evaluate(()=>{ setTimeout(()=>{ throw new Error("Diag-Testfehler-42"); }, 10); });
await page.waitForTimeout(300);
L = await log();
ok('Fehler wird gefangen und protokolliert', /FEHLER: .*Diag-Testfehler-42/.test(L));

// 4) Runterrechnen: großes Canvas-JPEG (2000×1500) -> shrinkImage verkleinert auf 1024
const shrink = await page.evaluate(async ()=>{
  const cv=document.createElement("canvas"); cv.width=2000; cv.height=1500;
  const cx=cv.getContext("2d"); cx.fillStyle="#3a7"; cx.fillRect(0,0,2000,1500); cx.fillStyle="#fff"; cx.fillRect(100,100,800,600);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const f=new File([blob],"gross.jpg",{type:"image/jpeg"});
  const small=await shrinkImage(f);
  const bmp=await createImageBitmap(small);
  return { origSize:f.size, smallSize:small.size, w:bmp.width, h:bmp.height, shrunk: small!==f };
});
ok('Großes Bild wird runtergerechnet (max 1024 px)', shrink.shrunk && Math.max(shrink.w,shrink.h)===1024, shrink.w+'×'+shrink.h);
ok('Arbeitskopie ist kleiner als das Original', shrink.smallSize < shrink.origSize, (shrink.origSize/1024|0)+' -> '+(shrink.smallSize/1024|0)+' KB');
L = await log();
ok('Runterrechnen protokolliert', /Bild runtergerechnet: 2000×1500 → 1024×768/.test(L));

// 5) Absturz-Wächter: Flag bleibt stehen -> Reload -> Auto-Start pausiert + Hinweis sichtbar
await page.evaluate(()=>{ localStorage.setItem("pb_model_starting","1"); localStorage.setItem("pb_caption_on","1"); });
await page.reload({waitUntil:'load'}); await page.waitForTimeout(800);
const guard = await page.evaluate(()=>({
  crashed: localStorage.getItem("pb_model_crashed"),
  starting: localStorage.getItem("pb_model_starting"),
  hintVisible: document.querySelector('#capCrashHint') && document.querySelector('#capCrashHint').style.display !== 'none',
}));
L = await log();
ok('Wächter erkennt abgebrochenen Modell-Start (Flag -> crashed)', guard.crashed==='1' && guard.starting===null);
ok('Wächter-Meldung im Verlauf (überlebte den Reload)', /NICHT abgeschlossen/.test(L) && /App-Start/.test(L));
ok('⚠️-Hinweis mit Erneut-Knopf sichtbar', guard.hintVisible===true);

// 6) Auto-Start ist blockiert; Klaus' Knopf startet bewusst neu und beschreibt nach
const retry = await page.evaluate(async (arr)=>{
  const u8=new Uint8Array([...arr,0x11,0x22]); // eigene Bytes (kein Dedupe)
  await signFile(new File([u8],"nach-crash.jpg",{type:"image/jpeg"}), "nach-crash.jpg", null);
  window.PBCaption = { isReady:()=>true, warmup:async()=>{}, configure(){}, _cfg:{} };
  window.PB_CAPTION = async ()=> "ein Boot auf einem See";
  await captionBackfill(); // muss blockiert sein (crashed-Flag)
  const rBlocked = CATALOG.find(x=>/nach-crash/.test(x.name));
  const blocked = rBlocked && rBlocked.needsCap===true;
  document.querySelector('#capRetry').click();
  await new Promise(r=>setTimeout(r,600));
  const r2 = CATALOG.find(x=>/nach-crash/.test(x.name));
  return { blocked, captioned: r2 && /Boot auf einem See/.test(r2.snippet||''), needsCap: r2&&r2.needsCap, crashedAfter: localStorage.getItem("pb_model_crashed") };
}, JPG);
ok('Auto-Start bleibt nach Absturz blockiert (Foto nur vorgemerkt)', retry.blocked===true);
ok('Klaus\' Erneut-Knopf: Flag weg + Foto nachbeschrieben', retry.crashedAfter===null && retry.captioned===true && retry.needsCap===false);

// 6b) Fehl-Zähler: scheitert der Modell-Start 2× ("Can't create a session"),
// pausiert der Auto-Start — kein Wiederhol-Kreisel bei jedem App-Start mehr.
const failguard = await page.evaluate(async (arr)=>{
  localStorage.removeItem("pb_model_crashed"); localStorage.removeItem("pb_model_failcount");
  // kaputten Beschreiber VOR dem Signieren setzen (isReady false -> Foto wird vorgemerkt)
  window.PBCaption = { isReady:()=>false, warmup:async()=>{ throw new Error("Can't create a session"); }, configure(){}, _cfg:{} };
  window.PB_CAPTION = async ()=> "nie erreicht";
  const u8=new Uint8Array([...arr,0x33,0x44]);
  await signFile(new File([u8],"fail-test.jpg",{type:"image/jpeg"}), "fail-test.jpg", null);
  await captionBackfill(); const after1=localStorage.getItem("pb_model_crashed");
  await captionBackfill(); const after2=localStorage.getItem("pb_model_crashed");
  const blocked = await (async()=>{ await captionBackfill(); return true; })(); // dritter Lauf: sofortige Pause, kein Throw
  const hint = document.querySelector('#capCrashHint').style.display !== 'none';
  localStorage.removeItem("pb_model_crashed"); localStorage.removeItem("pb_model_failcount");
  return { after1, after2, blocked, hint, fails: localStorage.getItem("pb_model_failcount") };
}, JPG);
ok('1. Fehlschlag: noch kein Stopp', failguard.after1===null);
ok('2. Fehlschlag: Auto-Start pausiert + Hinweis sichtbar', failguard.after2==='1' && failguard.hint===true);

// 7) Verlauf-Knöpfe vorhanden; Leeren funktioniert
const btns = await page.evaluate(()=>{ const c=!!document.querySelector('#diagCopy'), x=!!document.querySelector('#diagClear');
  document.querySelector('#diagClear').click(); return { c, x, after: JSON.parse(localStorage.getItem('pb_diag_log')||'[]').length }; });
ok('Kopieren-/Leeren-Knöpfe da; Leeren leert den Verlauf', btns.c && btns.x && btns.after<=1, 'n='+btns.after);

ok('Keine Seiten-Fehler (außer dem absichtlichen Testfehler)', errors.filter(e=>!/Diag-Testfehler/.test(e)).length===0, errors.join('; ').slice(0,120));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
