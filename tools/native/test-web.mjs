import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';
const root = resolve('www');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.json':'application/json', '.woff2':'font/woff2' };
const server = createServer(async (req, res) => {
  const path = resolve(root, '.' + new URL(req.url, 'http://local').pathname.replace(/\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) {res.writeHead(403).end();return;}
  try { const body = await readFile(path);res.writeHead(200, {'content-type':types[extname(path)] || 'application/octet-stream'}).end(body); }
  catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0, '127.0.0.1', r));
let browser;
let count=0;
function ok(name,value) {assert.ok(value,name);console.log('✓ '+name);count++;}
try {
  const names=await readdir(root);
  ok('Only public runtime inputs packaged', !names.some(n=>['.git','mail-service','node_modules','package.json','sw.js'].includes(n)));
  const html=await readFile(root+'/index.html','utf8');
  ok('No PWA installation script or service-worker registration in native build', !html.includes('src="assets/installieren.js') && !html.includes('navigator.serviceWorker.register('));
  ok('Light Pro icon matches the bundled asset', (await readFile('icon-512.png')).equals(await readFile(root+'/icon-512.png')));
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const url=`http://127.0.0.1:${server.address().port}/`;
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db);
  ok('Native bundle starts on search',await page.locator('#q').isVisible());
  ok('Native limitations visible in settings',await page.locator('.native-status').textContent().then(s=>s.includes('Android-Testversion')));
  for(const width of [320,768,1280]) {
    await page.setViewportSize({width,height:900});
    for(const tab of ['search','intake','explorer','mail']) {
      await page.click(`.main-pages [data-tab="${tab}"]`);
      ok(`${width}px: ${tab} reachable without page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
  }
  await page.click('.main-pages [data-tab="search"]');
  await page.setInputFiles('#fileInput',{name:'android-smoke.txt',mimeType:'text/plain',buffer:Buffer.from('Fahrzeug Radstand 2820 Millimeter')});
  await page.waitForFunction(()=>document.querySelector('#stFiles')?.textContent==='1');
  await page.fill('#q','Radstand');
  await page.waitForFunction(()=>document.querySelector('#results')?.textContent.includes('android-smoke.txt'));
  ok('Imported document is searchable in native bundle',true);
  await page.reload();await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db);
  ok('Catalog survives reload',await page.locator('#stFiles').textContent()==='1');
  const before=await page.locator('html').getAttribute('data-theme');await page.click('#themeToggle');
  ok('Existing theme toggle works',await page.locator('html').getAttribute('data-theme')!==before);
  for(const lang of ['en','ru','pl','de']) {
    await page.locator(`[data-lang="${lang}"]`).click();
    ok(`${lang}: native notice follows existing language selector`,await page.locator('.native-status').textContent().then(s=>s.includes({de:'Android-Testversion',en:'Android test version',ru:'Тестовая версия',pl:'Wersja testowa'}[lang])));
  }
  ok('No runtime errors',errors.length===0);
  ok('No service worker registered',await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length===0));
} finally {await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} native web checks passed`);
