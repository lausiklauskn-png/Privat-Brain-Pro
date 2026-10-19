// Beweis: Vertrauens-Erklärung vor Chromes Ordner-Erlaubnis-Dialog. In-App-Fenster
// (ohne github.io-Beschriftung) sagt klar, dass NICHTS zu GitHub/ins Netz geht.
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
const modalOn = ()=>page.evaluate(()=>document.getElementById('modalBg').classList.contains('on'));

// 1) Erklärfenster erscheint (DE) und sagt „nichts zu GitHub"
await page.evaluate(()=>{ localStorage.removeItem('pb_fs_ok'); localStorage.setItem('pb_lang','de'); pickDirGuarded(); });
await page.waitForTimeout(150);
ok('Erklärfenster erscheint statt direkter Browser-Dialog', await modalOn());
const html = await page.$eval('#modalBox', e=>e.innerHTML);
ok('Text: „nichts ins Internet und nichts zu GitHub"', /GitHub/.test(html) && /Internet/.test(html));
ok('Text: „github.io ist nur die Adresse"', /Adresse/.test(html));
ok('Knopf „Lieber einzelne Dateien" vorhanden', /fsFiles/.test(html));

// 2) „Dateien wählen" schließt das Fenster
await page.click('#fsFiles'); await page.waitForTimeout(120);
ok('„Dateien wählen" schließt das Erklärfenster', !(await modalOn()));

// 3) Sprache EN
await page.evaluate(()=>{ localStorage.setItem('pb_lang','en'); pickDirGuarded(); });
await page.waitForTimeout(120);
const en = await page.$eval('#modalBox', e=>e.innerHTML);
ok('EN: Text nennt GitHub + „Understood"', /GitHub/.test(en) && /Understood/.test(en), '');
await page.evaluate(()=>document.getElementById('modalBg').classList.remove('on'));

// 4) „Nicht mehr zeigen" -> kein Fenster mehr
await page.evaluate(()=>{ localStorage.setItem('pb_fs_ok','1'); try{ pickDirGuarded(); }catch(e){} });
await page.waitForTimeout(120);
ok('„Nicht mehr zeigen": kein Erklärfenster mehr', !(await modalOn()));

ok('Keine Seiten-Fehler', errors.length===0, errors.join('; ').slice(0,140));
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
await browser.close(); server.close(); process.exit(fail?1:0);
