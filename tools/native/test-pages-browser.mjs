// Real service-worker/browser check of the delivered PWA, under a project path.
// Copy the input first: native www and installed app data are never changed.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdtemp,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
import {preparePages} from './prepare-pages.mjs';

const scratch=await mkdtemp(join(tmpdir(),'pb-pages-browser-')),dir=join(scratch,'site');
await cp(resolve(process.argv[2]||'www'),dir,{recursive:true});
if(!(await readFile(join(dir,'index.html'),'utf8')).includes('name="pb-pages-build"'))await preparePages(dir);
const receipt=JSON.parse(await readFile(join(dir,'pwa-build.json'),'utf8'));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://local');if(!url.pathname.startsWith('/pro/')){res.writeHead(404).end();return;}
    const path=resolve(dir,'.'+decodeURIComponent(url.pathname.slice(4)).replace(/\/$/,'/index.html'));
    if(!path.startsWith(dir+sep)){res.writeHead(403).end();return;}
    const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'}).end(bytes);
  }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,url=origin+'/pro/';
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
let release;const held=new Promise(r=>release=r);let arrived;const arrival=new Promise(r=>arrived=r);
try{
  const context=await chromium.launchPersistentContext(join(scratch,'profile'),{executablePath:process.env.CB_CHROMIUM||(process.env.PB_PAGES_BROWSER_CI?chromium.executablePath():'/usr/bin/chromium'),args:['--no-sandbox']});
  browser=context;const page=context.pages()[0]||await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
    const request=route.request().url();if(!request.startsWith(origin+'/')){await route.abort();return;}
    if(new URL(request).pathname==='/pro/native-toolbar.js'){arrived();await held;}
    await route.continue();
  });
  await page.goto(url,{waitUntil:'commit'});
  let timer;
  try{await Promise.race([arrival,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Footer adapter was not reached')),45000))]);}finally{clearTimeout(timer);}
  await page.waitForFunction(()=>document.querySelector('header h1')&&performance.getEntriesByName('first-contentful-paint').length>0);
  const first=await page.evaluate(()=>({version:!!document.getElementById('pbVersion'),theme:document.documentElement.getAttribute('data-pb-theme'),prerender:document.documentElement.getAttribute('data-pb-prerender'),toolbar:!!document.querySelector('.native-toolbar-row'),visible:getComputedStyle(document.querySelector('header h1')).visibility==='visible'}));
  ok('Before the delayed footer adapter the PWA already paints the prepared shell, theme and no native version',!first.version&&first.theme&&first.prerender==='shell'&&first.toolbar&&first.visible);
  release();await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db&&document.querySelector('.pb-pages-status'));
  ok('The browser starts its real shared workspace and exactly one honest capabilities notice',await page.locator('.pb-pages-status').count()===1&&await page.locator('.pb-pages-status').textContent().then(value=>value.includes('Browser-Version'))&&await page.locator('#pbVersion').count()===0);
  await page.evaluate(async()=>{localStorage.setItem('pb_pages_retained_probe','keep');for(const name of['private-brain-v91','pbv3-web-foreign','another-app-cache'])await(await caches.open(name)).put(location.origin+'/foreign-sentinel',new Response(name));});
  let state;
  const deadline=Date.now()+90000;
  do{
    state=await page.evaluate(async build=>{
      const registration=await navigator.serviceWorker.getRegistration(),names=await caches.keys();let complete=false;
      if(registration){const name='pb-pro-pages-v1:'+encodeURIComponent(registration.scope)+':build-'+build;
        if(names.includes(name)){const marker=await(await caches.open(name)).match(new URL('__pb_pages_ready__',registration.scope).href);complete=!!marker&&(await marker.json()).complete===true;}}
      return{scope:registration?.scope,names,controller:navigator.serviceWorker.controller?.scriptURL,complete,active:registration?.active?.state,installing:registration?.installing?.state};
    },receipt.build);
    if(state.controller===url+'sw.js'&&state.complete)break;
    await new Promise(r=>setTimeout(r,100));
  }while(Date.now()<deadline);
  ok('The actual browser installs a complete worker limited to this project path '+JSON.stringify(state),state.scope===url&&state.controller===url+'sw.js'&&state.complete&&state.names.includes('private-brain-v91')&&state.names.includes('pbv3-web-foreign')&&state.names.includes('another-app-cache'));
  const manifest=await page.locator('link[rel="manifest"]').getAttribute('href');
  const actual=await page.evaluate(async href=>JSON.parse(await(await fetch(href)).text()),manifest);
  ok('Installed PWA identity, start URL and scope match the original manifest',!Object.hasOwn(actual,'id')&&actual.start_url==='./index.html'&&actual.scope==='./'&&actual.short_name==='Private Brain');
  const cdp=await context.newCDPSession(page);const installability=await cdp.send('Page.getInstallabilityErrors');
  ok('Chromium reports the prepared browser app as installable '+JSON.stringify(installability.installabilityErrors),installability.installabilityErrors.length===0);
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db);
  const offline=await page.evaluate(()=>({build:document.querySelector('meta[name="pb-pages-build"]').content,retained:localStorage.getItem('pb_pages_retained_probe'),version:!!document.getElementById('pbVersion'),toolbar:!!document.querySelector('.native-toolbar-row')}));
  ok('A real offline reload uses the same complete prepared generation and keeps user preferences',offline.build===receipt.build&&offline.retained==='keep'&&!offline.version&&offline.toolbar);
  const sentinels=await page.evaluate(async()=>{const values=[];for(const name of['private-brain-v91','pbv3-web-foreign','another-app-cache'])values.push(await(await(await caches.open(name)).match(location.origin+'/foreign-sentinel')).text());return values;});
  ok('Offline startup leaves every foreign cache sentinel untouched',sentinels.join('|')==='private-brain-v91|pbv3-web-foreign|another-app-cache');
  await context.setOffline(false);
  const reloaded=page.waitForEvent('domcontentloaded');await page.evaluate(()=>document.getElementById('hardReload').click());await reloaded;
  await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db&&document.querySelector('.pb-pages-status'));
  const afterReload=await page.evaluate(async()=>{const values=[];for(const name of['private-brain-v91','pbv3-web-foreign','another-app-cache'])values.push(await(await(await caches.open(name)).match(location.origin+'/foreign-sentinel')).text());return{values,retained:localStorage.getItem('pb_pages_retained_probe')};});
  ok('Clicking the actual reload control preserves other apps’ caches and the user preference marker',afterReload.values.join('|')==='private-brain-v91|pbv3-web-foreign|another-app-cache'&&afterReload.retained==='keep');
  ok('The online and offline browser paths introduce no uncaught runtime errors',errors.length===0);
  console.log(count+' real Pages browser checks passed.');
}finally{release();await browser?.close();await new Promise(r=>server.close(r));await rm(scratch,{recursive:true,force:true});}
