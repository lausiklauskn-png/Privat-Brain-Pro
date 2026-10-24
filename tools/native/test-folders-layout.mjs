import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),origin='https://localhost/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const saved=new Map(),pending=new Map(),copies=new Map();let destination='',sourceIndex=0,chooseCalls=0,cancelNext=false,failCopy=false;
try{
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=route.request().url();if(!url.startsWith(origin))return route.abort();const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}});
 await page.exposeFunction('folderFixture',async(method,args={})=>{
  if(method==='state')return{enabled:Boolean(destination),name:destination};
  if(method==='pause'){destination='';return{enabled:false,name:''};}
  if(method==='chooseLibrary'){chooseCalls++;if(cancelNext){cancelNext=false;return{cancelled:true};}destination='Library '+chooseCalls;copies.set(destination,[]);return{enabled:true,name:destination};}
  if(method==='chooseSource'){chooseCalls++;if(cancelNext){cancelNext=false;return{cancelled:true};}sourceIndex++;const bytes=Buffer.from('Read-only source '+sourceIndex);return{name:'Source '+sourceIndex,items:[{id:'selected',name:'source-'+sourceIndex+'.txt',path:'Source '+sourceIndex+'/source.txt',type:'text/plain',size:bytes.length}]};}
  if(method==='readSource')return{data:Buffer.from('Read-only source '+sourceIndex).subarray(args.offset,args.offset+262144).toString('base64')};
  if(method==='finishSource')return{ok:true};
  if(method==='copyOriginal'){if(failCopy)throw new Error('permission revoked');if(destination)copies.get(destination).push({name:args.name,bytes:saved.get(args.hash)?.bytes});return{copied:Boolean(destination)};}
  if(method==='listOriginals')return{items:[...saved.keys()]};
  if(method==='beginImport'){if(saved.has(args.hash))return{stored:true};const ticket=String(pending.size+1);pending.set(ticket,{meta:args,parts:[]});return{ticket};}
  if(method==='appendImport'){pending.get(args.ticket).parts.push(Buffer.from(args.data,'base64'));return{ok:true};}
  if(method==='finishImport'){const item=pending.get(args.ticket),bytes=Buffer.concat(item.parts);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.meta.hash);saved.set(item.meta.hash,{meta:item.meta,bytes});pending.delete(args.ticket);return{ok:true};}
  if(method==='abortImport'){pending.delete(args.ticket);return{ok:true};}
  if(method==='originalInfo')return saved.get(args.hash)?.meta||{missing:true};
  if(method==='readOriginal')return{data:saved.get(args.hash).bytes.subarray(args.offset,args.offset+262144).toString('base64')};
  throw new Error('Unknown fixture method '+method);
 });
 await page.addInitScript(()=>{delete window.showDirectoryPicker;const methods=['state','pause','chooseLibrary','chooseSource','readSource','finishSource','copyOriginal'],originals=['listOriginals','beginImport','appendImport','finishImport','abortImport','originalInfo','readOriginal'];const api=list=>Object.fromEntries(list.map(method=>[method,args=>window.folderFixture(method,args)]));window.Capacitor={Plugins:{ProFolders:api(methods),ProFiles:api(originals)}};});
 await page.goto(origin);await page.waitForFunction(()=>window.PBFolders&&typeof db!=='undefined'&&db);
 for(const [lang,labels,settingsName]of [
  ['de',['Finden','Hinzufügen','Dateien','Mail','Übersicht','Kategorien','Doppelte'],'Einstellungen'],
  ['en',['Find','Add','Files','Mail','Overview','Categories','Duplicates'],'Settings'],
  ['ru',['Поиск','Добавить','Файлы','Почта','Обзор','Категории','Дубликаты'],'Настройки'],
  ['pl',['Szukaj','Dodaj','Pliki','Poczta','Pulpit','Kategorie','Duplikaty'],'Ustawienia']
 ]){
  await page.locator('.native-options>summary').click();await page.locator(`[data-lang=${lang}]`).click();
  ok(`${lang}: seven main paths show their translated names beside symbols, with an accessible search icon`,await page.locator('.main-pages .tab').evaluateAll((nodes,labels)=>{const minimum=matchMedia('(min-width:1000px) and (orientation:landscape) and (any-pointer:fine)').matches?32:44;return nodes.length===7&&nodes.every((e,i)=>{const r=e.getBoundingClientRect(),caption=e.querySelector('.compact-caption');return e.dataset.tab===['search','intake','explorer','mail','dash','order','dupes'][i]&&e.getAttribute('aria-label')===labels[i]&&Boolean(e.querySelector('.compact-icon'))&&(e.dataset.tab==='search'?!caption:caption?.textContent===labels[i])&&r.width>=minimum&&r.height>=minimum;});},labels));
  for(const tab of ['dash','order','dupes']){await navigateTo(page,tab);ok(`${lang}: ${tab} is reached directly through its primary navigation tab`,await page.locator('#panel-'+tab).isVisible()&&await page.locator('.main-pages [data-tab="'+tab+'"]').count()===1&&!await page.locator('.native-options').evaluate(menu=>menu.open));}
  await page.locator('.native-options>summary').click();
  ok(`${lang}: the app menu has no duplicate view tabs`,await page.locator('.native-options-panel .tab').count()===0);
  await page.keyboard.press('Escape');
  ok(`${lang}: the pinned gear retains its translated name and the appropriate mouse or touch target`,await page.locator('.native-toolbar-quick .tab[data-tab="settings"]').evaluate((e,name)=>{const r=e.getBoundingClientRect(),minimum=matchMedia('(min-width:1000px) and (orientation:landscape) and (any-pointer:fine)').matches?32:44;return e.getAttribute('aria-label')===name&&e.title===name&&Boolean(e.querySelector('.compact-icon'))&&!e.querySelector('.compact-caption')&&r.width>=minimum&&r.width<=minimum+2&&r.height>=minimum&&r.height<=minimum+2&&r.left>=0&&r.right<=innerWidth;},settingsName));
  await navigateTo(page,'settings');ok(`${lang}: settings is reached by a real pinned-gear click`,await page.locator('#panel-settings').isVisible()&&!await page.locator('.native-options').evaluate(menu=>menu.open));
  const button=page.locator('[data-tab=explorer]');await button.hover();await page.locator('.native-tooltip').waitFor();ok(`${lang}: pointer hover shows an actual visible explanatory tooltip`,(await page.locator('.native-tooltip').textContent())===(await button.getAttribute('aria-label')));await page.mouse.move(1270,890);
  await button.focus();await page.locator('.native-tooltip').waitFor();ok(`${lang}: keyboard focus shows the same tooltip and Escape dismisses it`,await button.getAttribute('aria-describedby')==='native-control-tooltip');await page.keyboard.press('Escape');await page.locator('.native-tooltip').waitFor({state:'hidden'});
 }
 await page.locator('.native-options>summary').click();await page.locator('[data-lang=de]').click();
 await navigateTo(page,'dash');
 ok('Compact dashboard buttons open all catalog files, categories and duplicate contents',await page.locator('#panel-dash .native-dashboard-link').count()===3);
 for(const [id,target]of [['kpiFiles','explorer'],['kpiCats','order'],['kpiDupes','dupes']]){await navigateTo(page,'dash');await page.locator('#'+id).click();ok(`${id}: metric activates the actual ${target} view`,await page.locator('#panel-'+target).evaluate(e=>e.classList.contains('on')));}
 await page.click('[data-tab=intake]');
 await page.evaluate(()=>renderFsHint());
 ok('Android folder actions remain visible after the browser fallback runs without showDirectoryPicker',await page.locator('#pickDir').isVisible()&&await page.locator('#chooseLibrary').isVisible()&&await page.evaluate(()=>!('showDirectoryPicker' in window)));
 ok('Import explanations retain their original text behind the closed information button without an extra title row',await page.locator('#panel-intake .pillars').count()===0&&await page.locator('.native-import-reassurance').textContent().then(t=>t.includes('Liest nur')&&t.includes('Schlägt vor')&&t.includes('Bewegt nichts'))&&await page.locator('.native-import-reassurance').evaluate(e=>e.closest('[data-pb-help-content="import-drop"]')?.hidden===true)&&await page.locator('#pb-intake-heading').evaluate(e=>e.hidden&&e.parentElement.getAttribute('aria-labelledby')===e.id));
 const importInfo=page.locator('[data-pb-help-toggle="import-drop"]');
 await importInfo.click();ok('The information button reveals the retained explanation while import actions stay available',await importInfo.getAttribute('aria-expanded')==='true'&&await page.locator('.native-import-reassurance').isVisible()&&await page.locator('#pickDir').isVisible()&&await page.locator('#chooseLibrary').isVisible());
 await importInfo.click();ok('The information button closes its explanation and releases the import space again',await importInfo.getAttribute('aria-expanded')==='false'&&await page.locator('.native-import-reassurance').isHidden());
 await page.click('#pickDir');await page.locator('.native-folder-consent').waitFor();await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#pickDir').disabled);
 ok('Cancelling the explanation leaves both folder actions usable',chooseCalls===0&&await page.locator('#chooseLibrary').isEnabled()&&await page.locator('#pickDir').isEnabled());
 await page.click('#pickDir');await page.check('#fsNoShow');await page.click('#fsGo');await page.waitForFunction(()=>CATALOG.length===1&&!signing&&!document.querySelector('#pickDir').disabled);
 ok('First folder choice imports exact bytes after hiding only the explanation',chooseCalls===1&&saved.size===1&&[...saved.values()][0].bytes.equals(Buffer.from('Read-only source 1')));
 await page.click('#pickDir');await page.waitForFunction(()=>CATALOG.length===2&&!signing&&!document.querySelector('#pickDir').disabled);
 ok('Do not show again still opens another source folder without another hint',chooseCalls===2&&await page.locator('.native-folder-consent').count()===0);
 await page.click('#chooseLibrary');await page.waitForFunction(()=>document.querySelector('#pauseLibrary').disabled===false);const firstDestination=destination;
 ok('Library selection is independently usable after dismissing the folder explanation',chooseCalls===3&&Boolean(firstDestination));
 await page.click('#pickDir');await page.waitForFunction(()=>CATALOG.length===3&&!signing&&!document.querySelector('#pickDir').disabled);
 ok('New import makes a verified original and an additional selected-folder copy',copies.get(firstDestination).length===1&&copies.get(firstDestination)[0].bytes.equals(Buffer.from('Read-only source 3')));
 cancelNext=true;await page.click('#chooseLibrary');await page.waitForFunction(()=>document.querySelector('#chooseLibrary').disabled===false);
 ok('Cancelling a later folder choice preserves the working destination',destination===firstDestination&&await page.locator('#libraryStatus').textContent().then(t=>t.includes(firstDestination)));
 await page.click('#chooseLibrary');await page.waitForFunction(()=>document.querySelector('#libraryStatus').textContent.includes('Library 6'));const secondDestination=destination;
 await page.click('#pickDir');await page.waitForFunction(()=>CATALOG.length===4&&!signing&&!document.querySelector('#pickDir').disabled);
 ok('Changing the library writes future copies there and preserves earlier copies/catalog',copies.get(firstDestination).length===1&&copies.get(secondDestination).length===1&&saved.size===4);
 await page.reload();await page.waitForFunction(()=>window.PBFolders&&CATALOG.length===4&&document.querySelector('#libraryStatus').textContent.includes('Library 6'));
 await page.click('[data-tab=intake]');await page.click('#pickDir');await page.waitForFunction(()=>CATALOG.length===5&&!signing&&!document.querySelector('#pickDir').disabled);
 ok('Folder actions remain usable after restart with saved hint and library choices',chooseCalls===8&&copies.get(secondDestination).length===2);
 failCopy=true;await page.click('#pickDir');await page.waitForFunction(()=>!signing&&!document.querySelector('#pickDir').disabled&&document.querySelector('#libraryStatus').textContent.includes('Freigabe prüfen'));
 ok('Revoked destination permission does not add an apparently successful catalog item',await page.evaluate(()=>CATALOG.length===5)&&copies.get(secondDestination).length===2);failCopy=false;
 await page.click('#pauseLibrary');await page.waitForFunction(()=>document.querySelector('#pauseLibrary').disabled);
 await page.click('#pickDir');await page.waitForFunction(()=>CATALOG.length===6&&!signing&&!document.querySelector('#pickDir').disabled);
 ok('Stopping additional copies still keeps durable internal originals and allows folder imports',saved.size===7&&copies.get(secondDestination).length===2);
 await page.waitForFunction(()=>!document.querySelector("#toast").classList.contains("on"));
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:width<650?640:900});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  ok(`${width}px: named navigation uses flat rows and import page has no horizontal overflow`,await page.locator('.native-toolbar-row').evaluate(e=>{const tabs=[...e.querySelectorAll('.main-pages .tab')].map(button=>button.getBoundingClientRect()),mids=tabs.map(r=>r.top+r.height/2),minimum=matchMedia('(min-width:1000px) and (orientation:landscape) and (any-pointer:fine)').matches?32:44;return tabs.length===7&&tabs.every(r=>r.width>=minimum&&r.height>=minimum)&&Math.max(...mids)-Math.min(...mids)<2&&e.getBoundingClientRect().height<=Math.max(...tabs.map(r=>r.height))+24&&document.querySelector('.panel.on').scrollWidth<=document.querySelector('.panel.on').clientWidth+1;}));
  if(process.env.PB_CAPTURE_DESIGN==='1'){await page.mouse.move(width-2,width<650?638:898);await mkdir('docs/design/compact16',{recursive:true});await page.screenshot({path:`docs/design/compact16/import-${width}.png`});}
  await navigateTo(page,'dash');
  ok(`${width}px: dashboard tiles stay compact and contain real keyboard buttons`,await page.locator('#panel-dash .tile').evaluateAll(nodes=>nodes.every(e=>e.getBoundingClientRect().height<=140))&&await page.locator('#kpiCats').evaluate(e=>e.closest('button').type==='button'));
  if(process.env.PB_CAPTURE_DESIGN==='1')await page.screenshot({path:`docs/design/compact16/dashboard-${width}.png`});
  await page.click('[data-tab=intake]');
 }
 ok('No runtime errors in folder and layout flows',errors.length===0);
 console.log(`${count} folder-selection and labelled-layout checks passed (simulated bridge; SAF separately tested on Android).`);
}finally{await browser?.close();}
