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
  for(const width of [320,768,1280,1920]) {
    await page.setViewportSize({width,height:900});
    for(const tab of ['search','intake','explorer','mail','dash','order','dupes','settings']) {
      await page.click(`.tab[data-tab="${tab}"]`);
      ok(`${width}px: ${tab} fills available window without global page overflow`,await page.evaluate(()=>{const r=document.querySelector('.panel.on').getBoundingClientRect();return r.width>=innerWidth-40&&r.height>150&&r.bottom<=innerHeight&&Math.abs(document.querySelector('.wrap').getBoundingClientRect().top)<2&&document.body.scrollTop===0&&document.documentElement.scrollWidth<=innerWidth;}));
      if(process.env.PB_CAPTURE_DESIGN==='1'&&width===1280&&['search','explorer'].includes(tab))await page.screenshot({path:`docs/design/mail-preview5/nachher-${tab}-1280.png`});
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
  const updatePage = await browser.newPage();
  await updatePage.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  updatePage.on('pageerror',e=>errors.push(e.message));
  await updatePage.addInitScript(() => {
    window.updateCalls = 0;
    window.downloadCalls = 0;
    window.updateMode = 'available';
    window.holdUpdate = true;
    window.Capacitor = {Plugins:{ProUpdates:{
      async check() {
        window.updateCalls++;
        if (window.holdUpdate) await new Promise(resolve=>window.finishUpdate=resolve);
        if (window.updateMode === 'error') throw new Error('offline');
        return {status:window.updateMode, version:'0.1.0-preview.10'};
      },
      async openDownload() { window.downloadCalls++; }
    }}};
  });
  await updatePage.goto(url);
  await updatePage.waitForSelector('#native-update-check',{state:'attached'});
  ok('Update checks never run automatically',await updatePage.evaluate(()=>window.updateCalls===0));
  await updatePage.locator('[data-tab="settings"]').click();
  await updatePage.locator('#native-update-check').click();
  ok('Check prevents duplicate requests while pending',await updatePage.locator('#native-update-check').isDisabled());
  await updatePage.waitForFunction(()=>typeof window.finishUpdate==='function');
  await updatePage.evaluate(()=>{window.holdUpdate=false;window.finishUpdate();});
  await updatePage.locator('#native-update-download').waitFor({state:'visible'});
  ok('New version notice shown without opening download automatically',await updatePage.locator('.native-updates').textContent().then(t=>t.includes('0.1.0-preview.10')) && await updatePage.evaluate(()=>window.downloadCalls===0));
  await updatePage.locator('#native-update-download').click();
  ok('Explicit download invokes the checked native target',await updatePage.evaluate(()=>window.downloadCalls===1));
  await updatePage.evaluate(()=>window.updateMode='error');
  await updatePage.locator('#native-update-check').click();
  await updatePage.waitForFunction(()=>document.querySelector('#native-update-check').disabled===false);
  ok('Failed recheck removes stale download offer',await updatePage.locator('#native-update-download').isHidden());
  for (const lang of ['en','ru','pl','de']) {
    await updatePage.locator(`[data-lang="${lang}"]`).click();
    ok(`${lang}: update failure is translated`,await updatePage.locator('.native-updates').textContent().then(s=>s.includes({de:'nicht möglich',en:'Unable to check',ru:'Не удалось',pl:'Nie można'}[lang])));
  }
  await updatePage.evaluate(()=>window.updateMode='current');
  await updatePage.locator('#native-update-check').click();
  await updatePage.waitForFunction(()=>document.querySelector('#native-update-check').disabled===false);
  ok('Current app has no download offer',await updatePage.locator('#native-update-download').isHidden() && await updatePage.locator('.native-updates').textContent().then(t=>t.includes('aktuelle')));
  ok('No update UI runtime errors',errors.length===0);
} finally {await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} native web checks passed`);
