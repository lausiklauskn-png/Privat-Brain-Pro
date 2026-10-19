// Beweis Stufe 1b-2: Datei-Tresor. Datei verschlüsselt ablegen (pb_vault, eigene DB),
// Inhalt-Liste, Wiederherstell-Roundtrip (entschlüsselt = Original), Entfernen; gesperrt verweigert.
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
const HASH="pbtesthash-1";
const listLen = ()=>page.evaluate(async()=>(await window.PBVault.list()).length);

// set up tresor (unlocked)
await page.click('.tab[data-tab="settings"]'); await page.waitForTimeout(120);
await page.click('#tresorSetup'); await page.waitForTimeout(120);
await page.fill('#tzPw', PW); await page.fill('#tzPw2', PW);
await page.click('#tzMk'); await page.waitForTimeout(250);
await page.check('#tzSaved'); await page.waitForTimeout(60);
await page.click('#tzFinish'); await page.waitForTimeout(900);
ok('Tresor eingerichtet + entsperrt', await page.evaluate(()=>window.PBTresor.isUnlocked()));

// inject a catalog entry + a session file (5 bytes -> base64 "AQIDBAU=")
await page.evaluate((hash)=>{
  const f=new File([new Uint8Array([1,2,3,4,5])], "geheim.txt", {type:"text/plain"});
  CATALOG.push({hash, name:"geheim.txt", path:"geheim.txt", type:"text/plain", size:5, vector:new Float32Array([0]), snippet:"", dupes:[], tags:[], category:"Notiz"});
  SESSION_FILES.set(hash, f);
}, HASH);

// lock, then try store while LOCKED -> refuses (opens unlock modal)
await page.click('#tresorLock'); await page.waitForTimeout(150);
await page.evaluate(async (h)=>{ try{ await window.PBVault.store(h); }catch(e){} }, HASH);
await page.waitForTimeout(300);
ok('Gesperrt: Datei wird NICHT abgelegt', (await listLen())===0);

// unlock via the now-open modal
await page.fill('#tuPw', PW); await page.click('#tuGo'); await page.waitForTimeout(900);
ok('Wieder entsperrt', await page.evaluate(()=>window.PBTresor.isUnlocked()));

// store while UNLOCKED
await page.evaluate(async (h)=>{ await window.PBVault.store(h); }, HASH);
await page.waitForTimeout(500);
const after = await page.evaluate(async ()=>{ const items=await window.PBVault.list(); const it=items[0]; const plain=it?await window.PBTresor.decrypt(it.enc):null; return { n:items.length, name:plain&&plain.name, b64:plain&&plain.dataB64, encHasPlain: it?JSON.stringify(it.enc).includes("AQIDBAU="):false }; });
ok('Datei liegt verschlüsselt im Tresor (1 Eintrag)', after.n===1, 'n='+after.n);
ok('Wiederherstellung entschlüsselt = Original (5 Bytes)', after.b64==='AQIDBAU=' && after.name==='geheim.txt', after.b64);
ok('Klartext-Bytes NICHT im verschlüsselten Eintrag', after.encHasPlain===false);

// second store of same hash -> dedupe (still 1)
await page.evaluate(async (h)=>{ await window.PBVault.store(h); }, HASH);
await page.waitForTimeout(300);
ok('Doppelt ablegen wird verhindert (bleibt 1)', (await listLen())===1);

// vault list rendered in the Daten panel
ok('Tresor-Inhalt-Liste zeigt den Eintrag', (await page.$eval('#vaultList', e=>e.innerHTML)).includes('geheim.txt'));

// remove
const id = await page.evaluate(async ()=>{ const items=await window.PBVault.list(); return items[0].id; });
await page.evaluate(async (rid)=>{ await window.PBVault.remove(rid); }, id);
await page.waitForTimeout(300);
ok('Aus Tresor entfernt -> leer', (await listLen())===0);

// lock hides contents
await page.click('#tresorLock'); await page.waitForTimeout(200);
ok('Gesperrt: Inhalt-Liste ohne Aktions-Knöpfe', !(await page.$eval('#vaultList', e=>e.innerHTML)).includes('data-vrestore'));

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,160));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
