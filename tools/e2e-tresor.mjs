// Krypto-Beweis für Stufe 1a: der byte-1:1 aus Mein-Tresor übernommene JasonLib-Kern
// (modules/jasonlib.js) läuft in Private Brain mit echter Browser-WebCrypto.
// Prüft: AES-256-GCM Verschlüsseln→Entschlüsseln (Roundtrip), falsches Passwort scheitert,
// Shamir 3-von-5 Wiederherstellung. Real, headless — kein Stub.
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

ok('JasonLib-Kern geladen (window.JasonLib)', await page.evaluate(()=>!!(window.JasonLib&&window.JasonLib.encryptTresor)));

// 1) Roundtrip Verschlüsseln -> Entschlüsseln
const rt = await page.evaluate(async ()=>{
  const J=window.JasonLib;
  const secret={ note:"Mein privater Text — geheim 🔐", zahl:42 };
  const blob=await J.encryptTresor(secret, "korrekt-horse-battery");
  const back=await J.decryptTresor(blob, "korrekt-horse-battery");
  return { isTresor: J.isTresor(blob), match: JSON.stringify(back)===JSON.stringify(secret), cipherHasNoPlain: !JSON.stringify(blob).includes("geheim") };
});
ok('Blob ist ein Tresor-Umschlag (jason-tresor)', rt.isTresor);
ok('Entschlüsselt = Original (Roundtrip)', rt.match);
ok('Klartext nicht im verschlüsselten Blob', rt.cipherHasNoPlain);

// 2) Falsches Passwort scheitert
const wrong = await page.evaluate(async ()=>{
  const J=window.JasonLib;
  const blob=await J.encryptTresor({x:1}, "richtig-passwort");
  try{ await J.decryptTresor(blob, "falsches-passwort"); return "ENTSCHLUESSELT_TROTZDEM"; }
  catch(e){ return "abgelehnt"; }
});
ok('Falsches Passwort wird abgelehnt', wrong==='abgelehnt', wrong);

// 3) Shamir 3-von-5 Wiederherstellung
const sh = await page.evaluate(async ()=>{
  const J=window.JasonLib;
  const pw="mein-tresor-passwort-2026";
  const split=await J.splitSecret(pw);
  const shares=split.shares;
  // nur k von n benutzen (die ersten k)
  const recovered=await J.combineShares(shares.slice(0, split.k));
  // zu wenige (k-1) müssen scheitern ODER etwas Falsches liefern
  let tooFew="ok";
  try{ const r=await J.combineShares(shares.slice(0, split.k-1)); tooFew=(r===pw)?"FALSCH_WIEDERHERGESTELLT":"ok"; }catch(e){ tooFew="ok"; }
  return { n:shares.length, k:split.k, recovered:recovered===pw, tooFew };
});
ok(`Shamir liefert ${sh.n} Anteile (${sh.k}-von-${sh.n})`, sh.n===5 && sh.k===3, `${sh.k}/${sh.n}`);
ok('Shamir: k Anteile stellen das Passwort wieder her', sh.recovered);
ok('Shamir: k-1 Anteile reichen NICHT', sh.tooFew==='ok', sh.tooFew);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,140));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
