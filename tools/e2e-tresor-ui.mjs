// Bedien-Beweis für Stufe 1b: der Tresor im „Daten"-Bereich (Einrichten mit Shamir-Sicherung,
// Entsperren/Sperren, falsches Passwort, Wiederherstellung). Echte Browser-WebCrypto.
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
const page = await browser.newPage({ acceptDownloads:true });
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, {waitUntil:'load'});
await page.waitForTimeout(400);
let pass=0, fail=0; const ok=(n,c,x='')=>{(c?pass++:fail++);console.log(`${c?'✅':'❌'} ${n}${x?'  ('+x+')':''}`);};
const PW="geheimes-tresor-passwort-2026";
const stateText = ()=>page.$eval('#tresorState', e=>e.textContent);

// open Daten tab
await page.click('.tab[data-tab="settings"]'); await page.waitForTimeout(120);
ok('Tresor-Block sichtbar, Status "nicht eingerichtet"', (await stateText()).includes('nicht eingerichtet'), await stateText());

// setup
await page.click('#tresorSetup'); await page.waitForTimeout(120);
await page.fill('#tzPw', PW); await page.fill('#tzPw2', PW);
await page.click('#tzMk'); await page.waitForTimeout(200);
ok('Ersatzschlüssel-Sicherung erscheint', await page.isVisible('#tzSaveWrap'));
await page.check('#tzSaved'); await page.waitForTimeout(60);
await page.click('#tzFinish'); await page.waitForTimeout(900);
ok('Nach Einrichten: entsperrt', (await stateText())==='entsperrt', await stateText());
ok('Verifier im localStorage (Chiffre, kein Klartext-Passwort)', await page.evaluate((pw)=>{ const v=localStorage.getItem('pb_tresor_verify'); return !!v && !v.includes(pw); }, PW));
ok('PBTresor entsperrt + Roundtrip', await page.evaluate(async ()=>{ const b=await window.PBTresor.encrypt({x:7}); const r=await window.PBTresor.decrypt(b); return window.PBTresor.isUnlocked() && r.x===7; }));

// lock
await page.click('#tresorLock'); await page.waitForTimeout(120);
ok('Sperren -> gesperrt', (await stateText()).includes('gesperrt'), await stateText());
ok('PBTresor gesperrt', await page.evaluate(()=>!window.PBTresor.isUnlocked()));

// wrong password
await page.click('#tresorUnlock'); await page.waitForTimeout(120);
await page.fill('#tuPw', 'falsches-passwort'); await page.click('#tuGo'); await page.waitForTimeout(800);
ok('Falsches Passwort abgelehnt (bleibt Modal offen, Fehler)', await page.isVisible('#tuErr') && (await page.$eval('#tuErr',e=>e.textContent)).length>0 && await page.evaluate(()=>!window.PBTresor.isUnlocked()));
// correct password
await page.fill('#tuPw', PW); await page.click('#tuGo'); await page.waitForTimeout(900);
ok('Richtiges Passwort entsperrt', (await stateText())==='entsperrt', await stateText());

// recovery: lock, then combine 3 shares generated from the same pw
await page.click('#tresorLock'); await page.waitForTimeout(100);
const shares = await page.evaluate(async (pw)=>{ const sp=await window.JasonLib.splitSecret(pw); return sp.shares; }, PW);
await page.click('#tresorRecover'); await page.waitForTimeout(120);
await page.fill('#trShares', shares.slice(0,3).join('\n'));
await page.click('#trGo'); await page.waitForTimeout(1000);
ok('Wiederherstellung mit 3 Ersatzschlüsseln -> entsperrt', (await stateText())==='entsperrt', await stateText());

// language switch reflects on state label
await page.click('#langsw button[data-lang="en"]'); await page.waitForTimeout(150);
ok('Status-Text folgt der Sprache (EN "unlocked")', (await stateText())==='unlocked', await stateText());
await page.click('#langsw button[data-lang="de"]'); await page.waitForTimeout(100);

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
