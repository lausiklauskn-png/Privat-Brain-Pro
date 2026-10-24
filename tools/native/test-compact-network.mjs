import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),origin='https://localhost/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:320,height:640},hasTouch:true,isMobile:true}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const url=route.request().url();
    /* Modul 03's library address is answered by the app itself (MainActivity/BundledLibrary), never by the internet. */
    if(url.startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))return route.fulfill({status:404,body:''});
    if(!url.startsWith(origin)){requests.push(url);return route.fulfill({status:200,contentType:'text/plain',body:'remote fixture'});}
    const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));
    if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(()=>{
    window.networkChanges=[];window.socketCount=0;window.socketCloses=0;window.streamAborted=0;window.mailCalls=[];
    const nativeFetch=window.fetch;
    window.fetch=(url,options)=>{
      if(String(url)==='https://stream.example.invalid/held')return Promise.resolve(new Response(new ReadableStream({start(stream){options.signal.addEventListener('abort',()=>{window.streamAborted++;stream.error(new DOMException('Aborted','AbortError'));});}})));
      return nativeFetch(url,options);
    };
    window.WebSocket=class extends EventTarget {static OPEN=1;static CLOSED=3;readyState=1;constructor(){super();window.socketCount++;}close(){this.readyState=3;window.socketCloses++;this.dispatchEvent(new Event('close'));}};
    const account={id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.invalid',provider:'telekom'};
    window.Capacitor={isNativePlatform:()=>true,Plugins:{
      ProNetwork:{async getState(){return{offline:localStorage.getItem('fixture-offline')==='true'};},async setOffline({offline}){networkChanges.push(offline);localStorage.setItem('fixture-offline',String(offline));return{offline};}},
      ProDevice:{async getInfo(){return{versionName:'fixture',nativeMail:true};}},
      ProMail:{async accounts(){return{items:[account]};},async folders(){return{items:[{path:'INBOX',name:'INBOX',specialUse:'\\Inbox'},{path:'Sent',name:'Sent',specialUse:'\\Sent'}]};},async messages(){return{items:[{uid:7,subject:'Compact message',from:'fixture@example.invalid',flags:[],size:100}],validity:'123',total:1,next:null};},async message(){if(window.holdMail)await new Promise(resolve=>window.releaseMail=resolve);return{subject:'Compact message',from:'fixture@example.invalid',to:account.email,text:'Original message',html:'<h1>Original newsletter</h1><p>More room for the message.</p>',attachments:[]};},async action(args){mailCalls.push(args);return{ok:true};},async saved(){return{items:[]};},async addAccount(){return account;}}
    }};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBNetwork?.ready&&window.PBWorkspace&&typeof db!=='undefined'&&db&&document.querySelector('.native-toolbar-row'));
  await page.click('[data-tab=mail]');await page.locator('#mailWorkspace [data-live-text=connect]').click();await page.locator('[data-live-uid="7"]').click();
  await page.locator('.live-mail .mail-html').waitFor();
  ok('320px touch: Pro name with version fits and the green offline information is removed',await page.locator('.brand h1').evaluate(e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim())==='Private Brain Pro'&&await page.locator('#pbVersion').isVisible()&&await page.locator('.badge-off').count()===0&&await page.locator('.brand h1').evaluate(e=>e.getBoundingClientRect().right<=document.querySelector('header .tools').getBoundingClientRect().left));
  // Klaus 2026-10-21: only the round Siegel floats (lamps not shown); tools/native/test-mycel.mjs covers drag, snap, ✕.
  ok('The round Siegel is mounted at the actual app origin and floats outside the toolbar',await page.locator('#sbkim-widget-slot-siegel').isVisible()&&await page.locator('.native-toolbar-row #sbkim-widget').count()===0&&await page.locator('#sbkim-widget').evaluate(w=>getComputedStyle(w).position==='fixed'));
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:width<650?640:900});await page.evaluate(()=>document.fonts.ready);
    const layout=await page.evaluate(()=>{
      const row=document.querySelector('.native-toolbar-row').getBoundingClientRect(),head=document.querySelector('.live-mail>.mail-head').getBoundingClientRect(),reader=document.querySelector('.live-mail .mail-reader').getBoundingClientRect(),tabs=[...document.querySelectorAll('.main-pages .tab')].map(button=>button.getBoundingClientRect()),mids=tabs.map(r=>r.top+r.height/2),minimum=matchMedia('(min-width:1000px) and (orientation:landscape) and (any-pointer:fine)').matches?32:44;
      return {oneRow:tabs.length===7&&tabs.every(r=>r.width>=minimum&&r.height>=minimum&&r.height<=minimum+2)&&Math.max(...mids)-Math.min(...mids)<2&&row.height<=Math.max(...tabs.map(r=>r.height))+24,
        squareSearch:[...document.querySelectorAll('.native-toolbar-row .tab.compact-icon-only')].every(b=>{const q=b.getBoundingClientRect();return q.width>=minimum&&q.width<=minimum+2&&Math.abs(q.width-q.height)<=2;}),
        fullCaptions:[...document.querySelectorAll('.native-toolbar-row .tab:not(.compact-icon-only)')].every(button=>{const icon=button.querySelector('.compact-icon').getBoundingClientRect(),caption=button.querySelector('.compact-caption').getBoundingClientRect();return caption.left>=icon.right&&caption.width>=button.querySelector('.compact-caption').scrollWidth-1&&Math.abs(caption.top+caption.height/2-icon.top-icon.height/2)<2;}),
        targetHeight:minimum,rowHeight:row.height,headHeight:head.height,readerHeight:reader.height,noOverflow:document.documentElement.scrollWidth<=innerWidth,contentGap:document.querySelector('#mailWorkspace').getBoundingClientRect().top-document.querySelector('header.top').getBoundingClientRect().bottom-row.height};
    });
    ok(`${width}px: navigation stays flat, account actions stay on one row and message has at least 300px; `+JSON.stringify(layout),layout.oneRow&&layout.squareSearch&&layout.fullCaptions&&layout.headHeight<=layout.targetHeight+9&&layout.readerHeight>=300&&layout.noOverflow&&layout.contentGap>=-1&&layout.contentGap<=12);
    if(process.env.PB_CAPTURE_DESIGN==='1'){
      await page.mouse.move(width-2,width<650?638:898);
      await mkdir('docs/design/compact16',{recursive:true});await page.screenshot({path:`docs/design/compact16/mail-${width}.png`});
    }
  }
  await page.setViewportSize({width:320,height:640});
  ok('Phone keeps seven main targets in one scrollable row, with pinned settings and palette and no menu view tabs',await page.evaluate(()=>document.querySelectorAll('.main-pages .tab').length===7&&document.querySelectorAll('.native-options-panel .tab').length===0&&document.querySelectorAll('.native-toolbar-quick .tab[data-tab="settings"]').length===1&&Boolean(document.getElementById('pb-palette-button'))));
  for(const tab of ['dash','order','dupes']){const button=page.locator(`.main-pages [data-tab="${tab}"]`);await button.scrollIntoViewIfNeeded();await button.click();await page.waitForFunction(tab=>document.getElementById('panel-'+tab).classList.contains('on'),tab);ok(`${tab}: the primary navigation directly opens its named original view`,await button.locator('.compact-caption').textContent().then(t=>Boolean(t.trim()))&&!await page.locator('.native-options').evaluate(e=>e.open));}
  const settings=page.locator('.native-toolbar-quick [data-tab="settings"]');
  ok('The pinned settings gear remains a named, visible 44px target beside the palette',await settings.isVisible()&&await settings.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&e.title==='Einstellungen'&&e.getAttribute('aria-label')===e.title&&Boolean(e.querySelector('svg'));}));
  await settings.click();await page.locator('#panel-settings').waitFor({state:'visible'});
  ok('Selecting the pinned gear opens the original settings view',!await page.locator('.native-options').evaluate(e=>e.open));
  await page.click('[data-tab=mail]');
  await page.locator('.native-options>summary').click();await page.keyboard.press('Escape');ok('App menu closes with keyboard Escape and restores focus',await page.locator('.native-options>summary').evaluate(e=>document.activeElement===e)&&!await page.locator('.native-options').evaluate(e=>e.open));
  for(const [lang,word]of [['en','App menu'],['ru','Меню приложения'],['pl','Menu aplikacji'],['de','App-Menü']]){
    await page.locator('.native-options>summary').click();await page.locator(`[data-lang=${lang}]`).click();
    ok(`${lang}: app menu tooltip and accessible name follow the selected language`,await page.locator('.native-options>summary').getAttribute('title')===word&&await page.locator('.native-options>summary').getAttribute('aria-label')===word);
  }
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const view=page.locator('[data-native-tool=view]'),images=page.locator('[data-native-tool=images]');
  for(const [control,label]of [[view,'Textansicht'],[images,'Externe Bilder ausblenden']]){
    await control.hover();await page.locator('.native-tooltip').waitFor();ok(label+': mail symbol explains its action in a visible tooltip',await page.locator('.native-tooltip').textContent()===label);
  }
  await images.click();await images.hover();await page.waitForFunction(()=>document.querySelector('.native-tooltip').textContent==='Externe Bilder laden');
  ok('Image tooltip changes to loading after external images are hidden',await images.getAttribute('aria-label')==='Externe Bilder laden');
  await view.click();await view.hover();await page.waitForFunction(()=>document.querySelector('.native-tooltip').textContent==='Originalansicht');
  ok('View tooltip changes to original view after switching to plain text',await view.getAttribute('aria-label')==='Originalansicht');
  await view.click();await page.mouse.move(1270,890);await page.setViewportSize({width:320,height:640});
  ok('Icon actions retain usable touch areas and meaningful hover labels',await page.locator('.main-pages .tab,.native-navigation button,.live-mail>.mail-head .compact-tool').evaluateAll(nodes=>nodes.every(e=>{const r=e.getBoundingClientRect();return r.height>=28&&r.width>=28&&e.title.trim()&&e.getAttribute('aria-label')===e.title;})));
  await page.evaluate(()=>{window.holdMail=true;window.loadPhases=[];const progress=PBMailDevice.progress;PBMailDevice.progress=stage=>{loadPhases.push(stage);progress(stage);};});
  await page.locator('.live-mail .mail-back').click();await page.waitForFunction(()=>document.querySelector('.live-mail').getAttribute('aria-busy')!=='true');await page.evaluate(()=>{window.loadPhases=[];});await page.locator('[data-live-uid="7"]').click();
  await page.waitForFunction(()=>typeof window.releaseMail==='function');
  ok('Slow provider download displays a real loading phase before claiming content checks',await page.locator('.native-mail-progress [role=status]').textContent()==='E-Mail wird vom Anbieter geladen …'&&await page.evaluate(()=>loadPhases.join(',')==='download'));
  await page.locator('.native-mail-progress summary').click();
  ok('Loading explanation names rule checks and explicitly states the antivirus boundary',await page.locator('.native-mail-progress details p').textContent().then(t=>t.includes('anhand von Regeln')&&t.includes('kein vollständiger Virenscanner')));
  await page.evaluate(()=>{window.holdMail=false;window.releaseMail();});await page.waitForFunction(()=>document.querySelector('.live-mail').getAttribute('aria-busy')!=='true');
  ok('Actual download, display preparation and rule checks run in order; progress closes on completion',await page.evaluate(()=>loadPhases.join(',')==='download,prepare,checking,idle')&&await page.locator('.native-mail-progress').isHidden());
  await page.evaluate(()=>{window.fixtureSocket=new WebSocket('wss://socket.example.invalid');fetch('https://stream.example.invalid/held').then(r=>r.text()).catch(e=>{window.streamError=e.name;window.streamErrorMessage=e.message;});});
  await page.waitForTimeout(30);
  ok('Streaming fetch body remains pending before the switch',await page.evaluate(()=>streamAborted===0&&typeof window.streamError==='undefined'));
  const lamp=page.locator('header .tools>.native-net-lamp');
  ok('A small green internet lamp sits in the top bar with the tooltip "App vom Internet trennen"',await lamp.isVisible()&&await lamp.getAttribute('data-state')==='on'&&await lamp.getAttribute('aria-label')==='App vom Internet trennen'&&await lamp.getAttribute('title')==='App vom Internet trennen'&&await lamp.evaluate(e=>{const r=e.getBoundingClientRect(),h=document.querySelector('header.top').getBoundingClientRect();return getComputedStyle(e.firstElementChild).backgroundColor==='rgb(47, 179, 68)'&&r.top>=h.top&&r.bottom<=h.bottom&&r.height<=28;}));
  await lamp.hover();ok('Hovering the lamp shows the tooltip text',await page.locator('#native-control-tooltip').isVisible()&&await page.locator('#native-control-tooltip').textContent()==='App vom Internet trennen');
  await lamp.click();
  await page.waitForFunction(()=>PBNetwork.offline&&window.streamAborted===1&&window.socketCloses===1&&typeof window.streamError==='string');
  ok('Offline switch closes a running socket and a fetch whose body is still streaming',await page.evaluate(()=>['AbortError','TypeError'].includes(streamError)&&fixtureSocket.readyState===WebSocket.CLOSED));
  ok('The lamp turns red and offers "Internetzugriff wieder erlauben"; the menu switch shows the same state',await lamp.getAttribute('data-state')==='off'&&await lamp.getAttribute('aria-label')==='Internetzugriff wieder erlauben'&&await lamp.evaluate(e=>getComputedStyle(e.firstElementChild).backgroundColor==='rgb(214, 57, 57)')&&await page.locator('.native-offline-switch').getAttribute('aria-checked')==='true');
  const before=requests.length;
  ok('Offline blocks fetch, XHR, WebSocket and beacon before their transport is invoked',await page.evaluate(async()=>{
    const rejected=await fetch('https://network.example.invalid/blocked').then(()=>false,e=>e.message==='APP_OFFLINE');let xhr=false,socket=false;
    try{const r=new XMLHttpRequest();r.open('GET','https://network.example.invalid/xhr');r.send();}catch(e){xhr=e.message==='APP_OFFLINE';}
    try{new WebSocket('wss://socket.example.invalid/blocked');}catch(e){socket=e.message==='APP_OFFLINE';}
    return rejected&&xhr&&socket&&navigator.sendBeacon('https://network.example.invalid/beacon','x')===false&&socketCount===1;
  })&&requests.length===before);
  ok('Offline leaves local bundled assets, catalog and mailbox state available',await page.evaluate(async()=>{localStorage.setItem('layout-sentinel','kept');return(await fetch('native.css')).ok&&Array.isArray(await PBMailDevice.accounts())&&document.querySelector('.live-mail .mail-reader h3').textContent==='Compact message';}));
  await page.reload();await page.waitForFunction(()=>window.PBNetwork?.ready&&PBNetwork.offline&&window.PBWorkspace);
  ok('Offline state and local data survive a restart without a logout',await page.evaluate(()=>localStorage.getItem('layout-sentinel')==='kept'&&networkChanges.length===0));
  ok('After the restart the lamp is still red',await page.locator('header .tools>.native-net-lamp').getAttribute('data-state')==='off');
  await page.locator('.native-options>summary').click();await page.locator('.native-offline-switch').click();await page.waitForFunction(()=>!PBNetwork.offline);
  ok('The menu switch restores internet access and the lamp turns green again',await page.locator('header .tools>.native-net-lamp').getAttribute('data-state')==='on');
  ok('The same switch restores internet access without sending queued mail',await page.evaluate(async()=>(await fetch('https://network.example.invalid/resumed')).ok&&networkChanges.join(',')==='false'&&mailCalls.length===0)&&requests.some(url=>url.endsWith('/resumed')));
  ok('Compact menus and app-only internet switching have no unhandled runtime errors',errors.length===0);
}finally{await browser?.close();}
console.log(`${count} compact toolbar and app-only network checks passed (native transport tested on Android).`);
