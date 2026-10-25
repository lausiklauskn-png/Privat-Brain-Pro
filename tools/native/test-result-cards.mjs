// Real bundled result renderer with synthetic records; no original bytes or provider mail fetched.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),origin='https://localhost/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
const hashes={local:'1'.repeat(64),missing:'2'.repeat(64),historical:'3'.repeat(64),mail:'4'.repeat(64)};
const fullPath='Mail-Anhang/Max Muster max.muster@beispiel.example/Projektunterlagen/Basilikum/2026/Sehr-langer-eindeutiger-Dateiname-zum-Wiedererkennen.pdf';
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
async function fixture(touch=false){
  const context=await browser.newContext({viewport:{width:touch?400:1280,height:900},hasTouch:touch,isMobile:touch});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const url=route.request().url();
    if(url.startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))return route.fulfill({status:404,body:''});
    if(!url.startsWith(origin)){external.push(url);return route.fulfill({status:404,body:''});}
    const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));
    if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(({hashes})=>{
    window.fixtureOriginalReads=0;window.fixtureProviderReads=0;
    window.Capacitor={isNativePlatform:()=>true,Plugins:{
      ProDevice:{async getInfo(){return{versionName:'result-fixture'};}},
      ProMail:{async accounts(){return{items:[]};},async message(){fixtureProviderReads++;throw Error('Unexpected provider read');},async messages(){fixtureProviderReads++;throw Error('Unexpected provider read');},async openOriginal(){fixtureProviderReads++;throw Error('Unexpected provider read');}},
      ProFiles:{async listOriginals(){return{items:[hashes.local]};},async beginImport(){throw Error('Fixture does not import');},async originalInfo(){fixtureOriginalReads++;throw Error('Unexpected original read');},async readOriginal(){fixtureOriginalReads++;throw Error('Unexpected original read');},async open(){throw Error('Unexpected handoff');}}
    }};
  },{hashes});
  await page.goto(origin);
  await page.waitForFunction(()=>window.PBResultCards&&window.PBRecordStatus&&window.PBCheck&&window.PBWorkspace&&typeof db!=='undefined'&&db&&PBOriginals.snapshot().ready);
  await page.evaluate(async({hashes,fullPath})=>{
    const when=1700000000000;
    const record=(key,extra={})=>{const name='Result '+key+'.txt';return{hash:hashes[key],name,path:name,type:'text/plain',ext:'txt',date:when,size:25,snippet:'Readable synthetic result text',vector:buildVector(tokens(name)),tf:termFreq(tokens(name)),summary:'Readable synthetic result text',category:'Dokument',nameTokens:tokens(name),dupes:[],tags:[],...extra};};
    const clean={zeit:when,funde:[],angaben:[],hinweise:[],ungeprueft:false};
    const records=[record('local',{pruefung:{...clean,ungeprueft:true}}),record('missing',{name:'Result missing.pdf',path:fullPath,type:'application/pdf',ext:'pdf'}),record('historical',{pruefung:clean}),record('mail',{path:'E-Mails/Max Muster/Result mail.eml',mail:{from:'Max Muster <max@example.invalid>',to:'reader@example.invalid',subject:'Result mail'},mailIndex:1,mailBody:'Stored email body',category:'E-Mails',mailRemotes:[{account:'test-account',folder:'INBOX',validity:'1',uid:1}]})];
    for(const rec of records){await idbPut('catalog',rec);CATALOG.push(rec);HASHSET.add(rec.hash);}rebuildIndex();refreshAll();
  },{hashes,fullPath});
  await navigateTo(page,'search');
  if(await page.locator('#mode [data-m=mean]').getAttribute('aria-pressed')==='true')await page.locator('#mode [data-m=mean]').click();
  await page.locator('#q').fill('Result');
  await page.waitForFunction(()=>document.querySelectorAll('#results > .pb-result-compact').length===4&&document.querySelectorAll('#results .pb-check-badge').length===4);
  await page.waitForFunction(hash=>document.querySelector('#results .card[data-hash="'+hash+'"] .pb-result-path').dataset.original==='missing',hashes.missing);
  return{context,page,errors,external};
}
const card=(page,key)=>page.locator('#results > .card[data-hash="'+hashes[key]+'"]');
const path=(page,key)=>card(page,key).locator('.pb-result-path');
const popup=page=>page.locator('#pb-result-path-popover');
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{context,page,errors,external}=await fixture();
  ok('The real renderer retains four records and their original action handlers',await page.locator('#results .openBtn').count()===4&&await page.locator('#results .kiBtn').count()===4);
  ok('Category, add-tag and source share one metadata row',await card(page,'local').evaluate(card=>{const meta=card.querySelector('.pb-result-meta'),items=[meta.querySelector('.cat'),meta.querySelector('[data-tagadd]'),meta.querySelector('.pb-result-path')];return items.every(Boolean)&&Math.max(...items.map(x=>x.getBoundingClientRect().top))-Math.min(...items.map(x=>x.getBoundingClientRect().top))<7;}));
  ok('A filename-only source becomes a short Path control instead of repeating the filename',await path(page,'local').locator('.pb-result-path-short').textContent()==='Pfad');
  ok('Repeated local-copy labels are hidden while the original availability metadata stays intact',await card(page,'local').locator('.pb-record-availability').isHidden()&&await path(page,'local').getAttribute('data-original')==='local');
  ok('A missing original appears once through the existing check warning',await card(page,'missing').locator('.pb-check-badge').getAttribute('data-check')==='missing'&&await card(page,'missing').locator('.pb-record-availability').isHidden()&&await path(page,'missing').locator('.pb-result-path-state').isHidden());
  ok('A historical clean report still has a visible current missing-original state',await card(page,'historical').locator('.pb-check-badge').getAttribute('data-check')==='clean'&&await path(page,'historical').locator('.pb-result-path-state').isVisible()&&/Original fehlt/.test(await path(page,'historical').textContent()));
  ok('An incomplete local check keeps its real check action',await card(page,'local').locator('.pb-check-badge').getAttribute('data-check')==='partly');
  await path(page,'missing').hover();await popup(page).waitFor({state:'visible'});
  ok('Hover displays the complete path without changing the card height',await popup(page).locator('.pb-result-path-full').textContent()===fullPath);
  const heightBefore=await card(page,'missing').evaluate(e=>e.getBoundingClientRect().height);
  await path(page,'missing').click();await page.mouse.move(3,3);
  ok('Click pins the disclosure after pointer departure',await popup(page).isVisible()&&await path(page,'missing').getAttribute('aria-expanded')==='true');
  ok('The disclosure does not add a line to the result card',await card(page,'missing').evaluate(e=>e.getBoundingClientRect().height)===heightBefore);
  await path(page,'missing').click();await popup(page).waitFor({state:'hidden'});
  ok('A second click closes the disclosure',await path(page,'missing').getAttribute('aria-expanded')==='false');
  await path(page,'local').focus();await popup(page).waitFor({state:'visible'});
  ok('Keyboard focus exposes local-copy details through the source control',/Lokale Kopie/.test(await popup(page).locator('.pb-result-source-state').textContent())&&/Fingerabdruck/.test(await popup(page).locator('.pb-result-source-detail').textContent()));
  await page.keyboard.press('Escape');await popup(page).waitFor({state:'hidden'});
  ok('Escape dismisses the source information',await path(page,'local').getAttribute('aria-expanded')==='false');
  await path(page,'mail').click();await popup(page).waitFor({state:'visible'});
  ok('Provider mail keeps its honest source distinction',/Mailquelle verknüpft/.test(await popup(page).locator('.pb-result-source-state').textContent())&&/nicht als lokale Dateien bestätigt/.test(await popup(page).locator('.pb-result-source-detail').textContent()));
  await page.locator('#q').click();await popup(page).waitFor({state:'hidden'});
  ok('Clicking outside dismisses a pinned disclosure',await path(page,'mail').getAttribute('aria-expanded')==='false');
  for(const width of[600,400]){
    await page.setViewportSize({width,height:900});
    await page.waitForFunction(()=>document.querySelector('#results .pb-result-path-short').getBoundingClientRect().width>0);
    await path(page,'missing').hover();await popup(page).waitFor({state:'visible'});
    ok(width+'px: the shortened path retains its beginning and filename end with a middle ellipsis',await path(page,'missing').locator('.pb-result-path-short').evaluate(e=>e.textContent.startsWith('Mail')&&e.textContent.endsWith('.pdf')&&e.textContent.includes('…')));
    ok(width+'px: cards and full-path disclosure remain inside the viewport',await page.evaluate(()=>{const w=innerWidth;return document.documentElement.scrollWidth<=w+1&&[...document.querySelectorAll('#results > .card,#pb-result-path-popover')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=w+1;});}));
    await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>document.documentElement.lang='ru');
  await page.waitForFunction(hash=>document.querySelector('#results .card[data-hash="'+hash+'"] .pb-result-path').getAttribute('aria-label').startsWith('Путь:'),hashes.local);
  await path(page,'local').focus();await popup(page).waitFor({state:'visible'});
  ok('Russian source detail follows the current UI language',/Локальная копия/.test(await popup(page).locator('.pb-result-source-state').textContent()));
  await page.keyboard.press('Escape');
  ok('Drawing and revealing paths never reads original bytes or provider mail',await page.evaluate(()=>fixtureOriginalReads===0&&fixtureProviderReads===0));
  await page.waitForTimeout(100);
  const writes=await page.evaluate(async()=>{const changes=[],o=new MutationObserver(records=>changes.push(...records));o.observe(document.getElementById('results'),{subtree:true,childList:true,attributes:true});PBResultCards.refresh();PBResultCards.refresh();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));o.disconnect();return changes.length;});
  ok('Repeated unchanged metadata refreshes cause no redundant result mutations',writes===0);
  ok('No runtime error or private/external request was introduced',errors.length===0&&external.length===0);
  await context.close();
  ({context,page,errors,external}=await fixture(true));
  await path(page,'missing').tap();await popup(page).waitFor({state:'visible'});
  ok('Touch can open the same complete path disclosure',await popup(page).locator('.pb-result-path-full').textContent()===fullPath);
  ok('The interactive path keeps the touch target size',await path(page,'missing').evaluate(e=>e.getBoundingClientRect().height>=43));
  await path(page,'missing').tap();await popup(page).waitFor({state:'hidden'});
  ok('Touch can dismiss the disclosure without hover',await path(page,'missing').getAttribute('aria-expanded')==='false');
  ok('Touch fixture has no runtime errors',errors.length===0&&external.length===0);
  await context.close();console.log(`${count} compact result card checks passed.`);
}finally{await browser?.close();}
