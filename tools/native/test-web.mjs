import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, firefox, webkit } from 'playwright-core';
async function clickControl(page,selector) {
  const control=page.locator(selector);
  if(!await control.isVisible())await control.locator('xpath=ancestor::details[1]').locator(':scope>summary').click();
  await control.click();
}
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
  const engine=process.env.PB_BROWSER_ENGINE||'chromium';
  assert.ok(['chromium','firefox','webkit'].includes(engine),'Known browser engine');
  browser=await ({chromium,firefox,webkit})[engine].launch(engine==='chromium'?{executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']}:{});
  const url=`http://127.0.0.1:${server.address().port}/`;
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db);
  ok('Native bundle starts on search',await page.locator('#q').isVisible() && (await page.locator('.brand h1').textContent()).trim()==='Private Brain Pro' && (await page.title()).startsWith('Private Brain Pro —'));
  ok('Native limitations visible in settings',await page.locator('.native-status').textContent().then(s=>s.includes('Private Brain Pro') && s.includes('Direkte Mailverbindung')));
  // Search starts with its controls; no welcome copy returns after clearing,
  // dictating, restoring a saved query or returning through navigation.
  const searchTop=await page.locator('.searchbox').evaluate(node=>node.offsetTop);
  ok('Empty search has no welcome heading or explanatory paragraph',await page.locator('.search-welcome,[data-ws="find"],[data-ws="findHelp"]').count()===0);
  await page.fill('#q','Radstand');
  ok('Typing a query keeps the already compact search controls in place',await page.locator('.search-welcome').count()===0&&await page.locator('.searchbox').evaluate((node,top)=>node.offsetTop===top,searchTop));
  await page.fill('#q','   ');
  ok('Clearing the query never restores a welcome block',await page.locator('.search-welcome').count()===0&&await page.locator('.searchbox').evaluate((node,top)=>node.offsetTop===top,searchTop));
  await page.evaluate(async()=>{document.getElementById('q').value='Gespeicherte Suche';await renderResults(document.getElementById('q').value);});
  ok('Programmatic search text works without an input event or welcome block',await page.locator('#q').inputValue()==='Gespeicherte Suche'&&await page.locator('.search-welcome').count()===0);
  await page.locator('#fSave').click();
  await page.fill('#q','');
  await page.locator('#savedRow [data-saved="0"]').click();
  ok('Restoring a saved query keeps the introduction absent',await page.locator('#q').inputValue()==='Gespeicherte Suche'&&await page.locator('.search-welcome').count()===0);
  await clickControl(page,'.main-pages [data-tab="intake"]');
  await page.evaluate(()=>PBNavigation.back());
  await page.locator('#q').waitFor({state:'visible'});
  ok('Returning to search retains its query and compact result layout',await page.locator('#q').inputValue()==='Gespeicherte Suche'&&await page.locator('.search-welcome').count()===0);
  const enabled=await page.locator('#mode [data-m="mean"]').getAttribute('aria-pressed');
  await page.locator('#mode [data-m="mean"]').click();
  const toggled=await page.evaluate(()=>({mode:MODE,pressed:document.querySelector('#mode [data-m="mean"]').getAttribute('aria-pressed'),active:document.querySelector('#mode [data-m="mean"]').classList.contains('on')}));
  await page.locator('#mode [data-m="mean"]').click();
  const returned=await page.evaluate(()=>({mode:MODE,pressed:document.querySelector('#mode [data-m="mean"]').getAttribute('aria-pressed'),active:document.querySelector('#mode [data-m="mean"]').classList.contains('on')}));
  ok('The single meaning switch turns its visible active state on and off',await page.locator('#mode button').count()===1&&await page.locator('#mode [data-m="name"]').count()===0&&toggled.pressed!==enabled&&toggled.pressed===String(toggled.mode==='mean')&&toggled.active===(toggled.mode==='mean')&&returned.pressed===enabled&&returned.pressed===String(returned.mode==='mean')&&returned.active===(returned.mode==='mean'));
  // Restore the fresh default for the existing native layout/import checks.
  await page.evaluate(()=>{MODE='mean';setToggle();document.getElementById('q').value='';renderResults('');localStorage.removeItem('cb_saved');renderSaved();});
  const largeSearch=[];
  for(const [width,height,font]of[[320,720,20],[390,844,24],[800,1280,24],[1280,800,20],[1280,800,24]]){
    await page.setViewportSize({width,height});await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);
    const fit=await page.evaluate(()=>{const button=document.querySelector('#mode [data-m="mean"]'),caption=button.querySelector('[data-i18n="modeMeaningShort"]'),icon=button.querySelector('svg.pb-search-mode-icon'),r=button.getBoundingClientRect(),range=document.createRange();if(!caption||!icon)return false;range.selectNodeContents(caption);const text=range.getBoundingClientRect(),lines=[...range.getClientRects()].filter(rect=>rect.width>0),ir=icon.getBoundingClientRect(),panel=document.getElementById('panel-search');return caption.textContent==='Bedeutung'&&button.getAttribute('aria-label')==='Bedeutungssuche'&&lines.length>0&&lines.every(rect=>Math.abs(rect.top-lines[0].top)<1)&&text.top>=r.top-1&&text.bottom<=r.bottom+1&&text.width<=button.clientWidth+1&&text.left>=r.left-1&&text.right<=r.right+1&&ir.left>=text.right&&ir.right<=r.right+1&&button.scrollWidth<=button.clientWidth+1&&panel.scrollWidth<=panel.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1;});
    largeSearch.push({width,height,font,fit});
  }
  ok('Phone, tablet portrait and DeX keep the short meaning label and trailing magnifier on one line at larger fonts: '+JSON.stringify(largeSearch),largeSearch.every(sample=>sample.fit));
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.setViewportSize({width:1280,height:900});
  ok('The desktop search uses the compact mouse target while touch keeps its larger target',await page.evaluate(()=>{const mouse=matchMedia('(any-pointer:fine)').matches,minimum=mouse?32:44,height=document.getElementById('q').getBoundingClientRect().height;return document.querySelector('.searchbox').getBoundingClientRect().height<=(mouse?40:52)&&height>=minimum&&height<=minimum+2;}));
  for(const width of [280,320,390,650,768,1000,1280,1920]) {
    await page.setViewportSize({width,height:900});
    for(const tab of ['search','intake','explorer','mail','dash','order','dupes','settings']) {
      await clickControl(page,`.tab[data-tab="${tab}"]`);
      ok(`${width}px: ${tab} fills available window without clipped panel content`,await page.evaluate(expected=>{const panel=document.querySelector('.panel.on'),r=panel.getBoundingClientRect();return panel.id==='panel-'+expected&&r.width>=innerWidth-40&&r.height>150&&r.bottom<=innerHeight&&panel.scrollWidth<=panel.clientWidth+1&&Math.abs(document.querySelector('.wrap').getBoundingClientRect().top)<2&&document.body.scrollTop===0&&document.documentElement.scrollWidth<=innerWidth;},tab));
      if(tab==='search')ok(`${width}px: the complete meaning switch and filters fit`,await page.locator('.searchbox,.searchbox .toggle,.searchbox .toggle button,.filterbar,.filterbar select').evaluateAll(nodes=>nodes.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth+1;})));
      if(process.env.PB_CAPTURE_DESIGN==='1'&&['search','explorer'].includes(tab)){await page.mouse.move(width-2,898);await mkdir('docs/design/compact16',{recursive:true});await page.screenshot({path:`docs/design/compact16/${tab}-${width}.png`});}
    }
  }
  // Follow the visible import workflow: finish importing on Files, then return
  // to Search through navigation before exercising the search field.
  await clickControl(page,'.main-pages [data-tab="intake"]');
  await page.setInputFiles('#fileInput',{name:'android-smoke.txt',mimeType:'text/plain',buffer:Buffer.from('Fahrzeug Radstand 2820 Millimeter')});
  await page.waitForFunction(()=>!signing && document.querySelector('#stFiles')?.textContent==='1');
  await clickControl(page,'.main-pages [data-tab="search"]');
  try { await page.locator('#q').waitFor({state:'visible'}); }
  catch(error) {
    console.error('Browser runtime errors before failed navigation',errors);
    console.error('Search navigation state',await page.evaluate(()=>({panel:document.querySelector('.panel.on')?.id,hash:location.hash,tab:document.querySelector('.main-pages [data-tab="search"]')?.className,focus:document.activeElement?.tagName})));
    throw error;
  }
  ok('Search is visible after completing import and returning through navigation',await page.locator('#q').isVisible());
  await page.fill('#q','Radstand');
  await page.waitForFunction(()=>document.querySelector('#results')?.textContent.includes('android-smoke.txt'));
  ok('Imported document is searchable in native bundle',true);
  await page.reload();await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db);
  ok('Catalog survives reload',await page.locator('#stFiles').textContent()==='1');
  const before=await page.locator('html').getAttribute('data-theme');await clickControl(page,'#themeToggle');
  ok('Existing theme toggle works',await page.locator('html').getAttribute('data-theme')!==before);
  for(const lang of ['en','ru','pl','de']) {
    await clickControl(page,`[data-lang="${lang}"]`);
    ok(`${lang}: native notice follows existing language selector`,await page.locator('.native-status').textContent().then(s=>s.includes('Private Brain Pro') && s.includes({de:'Direkte Mailverbindung',en:'Direct mail',ru:'Прямая почта',pl:'Bezpośrednia poczta'}[lang])));
    await page.setViewportSize({width:320,height:640});
    await page.evaluate(()=>document.documentElement.style.fontSize='20px');
    const mainTargets=['search','intake','explorer','mail','dash','order','dupes'],mainReachability=[];
    for(const tab of mainTargets){
      const control=page.locator(`.main-pages .tab[data-tab="${tab}"]`);
      await control.scrollIntoViewIfNeeded();await control.click();
      await page.waitForFunction(tab=>document.getElementById('panel-'+tab).classList.contains('on'),tab);
      await control.scrollIntoViewIfNeeded();
      mainReachability.push(await control.evaluate(e=>{
        const r=e.getBoundingClientRect(),strip=e.parentElement.getBoundingClientRect(),icon=e.querySelector('.compact-icon'),caption=e.querySelector('.compact-caption');
        const target=matchMedia('(any-pointer:fine)').matches?32:44;const fits=r.left>=Math.max(0,strip.left)-1&&r.right<=Math.min(innerWidth,strip.right)+1&&r.width>=target&&r.height>=target;
        let readable=Boolean(icon&&e.title.trim());
        if(e.classList.contains('compact-icon-only'))readable=readable&&!caption&&e.dataset.tab==='search';
        else if(caption&&icon){const cr=caption.getBoundingClientRect(),ir=icon.getBoundingClientRect();readable=readable&&Boolean(caption.textContent.trim())&&cr.left>=ir.right&&Math.abs(cr.top+cr.height/2-ir.top-ir.height/2)<2&&caption.scrollWidth<=caption.clientWidth+1;}
        else readable=false;
        return {tab:e.dataset.tab,fits,readable,active:document.getElementById('panel-'+e.dataset.tab).classList.contains('on'),noPageOverflow:document.documentElement.scrollWidth<=innerWidth+1};
      }));
    }
    ok(`${lang}: all seven main views remain readable and directly reachable in the narrow navigation strip: `+JSON.stringify(mainReachability),await page.locator('.main-pages .tab').count()===7&&mainReachability.every(item=>item.fits&&item.readable&&item.active&&item.noPageOverflow));
    await page.locator('.native-options>summary').click();
    ok(`${lang}: the app menu has no duplicate view tabs`,await page.locator('.native-options-panel .tab').count()===0);
    await page.keyboard.press('Escape');
    const settingsName={en:'Settings',ru:'Настройки',pl:'Ustawienia',de:'Einstellungen'}[lang];
    ok(`${lang}: the pinned settings gear and palette stay visible with accessible names and pointer-appropriate targets`,await page.locator('.native-toolbar-quick .tab[data-tab="settings"],#pb-palette-button').evaluateAll((nodes,name)=>nodes.length===2&&nodes.every(e=>{const r=e.getBoundingClientRect(),target=matchMedia('(any-pointer:fine)').matches?32:44;return r.width>=target&&r.height>=target&&r.left>=0&&r.right<=innerWidth&&Boolean(e.querySelector('svg'))&&Boolean(e.title.trim())&&e.title===e.getAttribute('aria-label')&&(e.dataset.tab!=='settings'||e.getAttribute('aria-label')===name);}),settingsName));
    await clickControl(page,'.native-toolbar-quick .tab[data-tab="settings"]');
    await page.locator('#panel-settings').waitFor({state:'visible'});
    ok(`${lang}: the pinned gear opens the original settings view`,!await page.locator('.native-options').evaluate(menu=>menu.open));
    await page.evaluate(()=>document.documentElement.style.fontSize='');
  }
  // Klaus 2026-10-22: the diagnosis stays in the app but hidden; seven taps on the version line show it.
  const diagHidden=()=>page.evaluate(()=>document.getElementById('diagLog').closest('.note').hidden);
  ok('The diagnosis box is hidden by default',await diagHidden());
  await page.evaluate(()=>{const s=document.querySelector('.native-status');for(let i=0;i<7;i++)s.click();});
  ok('Seven taps on the version line show it again',!(await diagHidden()));
  await page.evaluate(()=>{const s=document.querySelector('.native-status');for(let i=0;i<7;i++)s.click();});
  ok('Seven more taps hide it again',await diagHidden());
  // Name the errors: the WebKit job otherwise fails without saying why.
  ok('No runtime errors'+(errors.length?': '+errors.join(' | '):''),errors.length===0);
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
  await clickControl(updatePage,'[data-tab="settings"]');
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
    await clickControl(updatePage,`[data-lang="${lang}"]`);
    ok(`${lang}: update failure is translated`,await updatePage.locator('.native-updates').textContent().then(s=>s.includes({de:'nicht möglich',en:'Unable to check',ru:'Не удалось',pl:'Nie można'}[lang])));
  }
  await updatePage.evaluate(()=>window.updateMode='current');
  await updatePage.locator('#native-update-check').click();
  await updatePage.waitForFunction(()=>document.querySelector('#native-update-check').disabled===false);
  ok('Current app has no download offer',await updatePage.locator('#native-update-download').isHidden() && await updatePage.locator('.native-updates').textContent().then(t=>t.includes('aktuelle')));
  ok('No update UI runtime errors'+(errors.length?': '+errors.join(' | '):''),errors.length===0);
} finally {await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} native web checks passed`);
