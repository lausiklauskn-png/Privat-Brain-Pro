// Beweis Stufe A: die byte-1:1 aus Sage geholten Module 20 (Schlüssel-Safe) und
// 21 (Spracheingabe) laden fehlerfrei und registrieren ihre öffentliche Fläche auf
// window — Grundlage für den KI-Schlüssel-Tresor (Stufe C) + Mikrofon (Stufe B).
// Der Drift-Guard (npm test, Schritt 1) belegt separat die byte-Gleichheit.
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
await page.waitForTimeout(700);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};

// 1) Modul 20 (Schlüssel-Safe) registriert seine Fläche
const m20 = await page.evaluate(()=>{
  const S=window.SbkimSafe; if(!S) return {present:false};
  return { present:true,
    fns: ['init','open','hasVault','isUnlocked','createVault','unlock','lock','recoverPassword'].every(f=>typeof S[f]==='function'),
    meta: !!S._meta };
});
ok('Modul 20 SbkimSafe geladen', m20.present===true);
ok('Modul 20 Funktionen vollständig (init/open/createVault/unlock/lock/recoverPassword…)', m20.fns===true);

// 2) Modul 21 (Spracheingabe) registriert seine Fläche
const m21 = await page.evaluate(()=>{
  const S=window.SbkimSpeech; if(!S) return {present:false};
  return { present:true,
    fns: ['getLanguages','availableEngines','pickEngine','makeBrowserRecognizer','startRecording','recognizeEU'].every(f=>typeof S[f]==='function'),
    langs: (typeof S.getLanguages==='function') ? (S.getLanguages()||[]).length : 0 };
});
ok('Modul 21 SbkimSpeech geladen', m21.present===true);
ok('Modul 21 Funktionen vollständig (pickEngine/makeBrowserRecognizer/startRecording/recognizeEU…)', m21.fns===true);
ok('Modul 21 kennt Sprachen (DE/EN/RU…)', m21.langs>=2, 'n='+m21.langs);

// 3) fail-soft: hasVault() ohne eingerichteten Safe wirft nicht + liefert false
const soft = await page.evaluate(async ()=>{
  try { const has = await window.SbkimSafe.hasVault(); return { ok:true, has: !!has }; }
  catch(e){ return { ok:false, err:String(e&&e.message||e) }; }
});
ok('Modul 20 hasVault() fail-soft (kein Throw ohne Safe)', soft.ok===true, soft.err||('has='+soft.has));

ok('Keine Seiten-Fehler beim Laden der neuen Module', errors.length===0, errors.join('; ').slice(0,180));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
