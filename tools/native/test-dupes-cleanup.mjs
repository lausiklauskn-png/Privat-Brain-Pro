// Browser UX with an explicit fake bridge; physical SAF deletion is verified by NativeDuplicateCleanupTest.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);count++;console.log('✓ '+name);};
const url=`http://127.0.0.1:${server.address().port}/`;
async function app(native=true){
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(native=>{
    const scan=()=>({session:'current-folder-session',scannedFiles:4,scannedBytes:12288,skippedFiles:0,partial:false,errors:[],groups:[{hash:'a'.repeat(64),size:4096,copies:[{id:'keep',name:'Behalten.txt',path:'Ordner/Behalten.txt',size:4096,deletable:true},{id:'delete-a',name:'<img src=x onerror=alert(1)>.txt',path:'Ordner/Kopie A.txt',size:4096,deletable:true},{id:'delete-b',name:'Kopie B.txt',path:'Ordner/Kopie B.txt',size:4096,deletable:true}]}]});
    window.dupFixture={mode:'normal',chooses:0,deletes:[],cancels:0,scan};
    window.Capacitor={getPlatform:()=>native?'android':'windows',Plugins:native?{ProDuplicates:{
      async chooseFolder(){dupFixture.chooses++;if(dupFixture.mode==='slow')return new Promise(resolve=>dupFixture.resolve=resolve);if(dupFixture.mode==='partial')return {...scan(),partial:true,skippedFiles:2,errors:[{path:'restricted',message:'READ_FAILED'}]};if(dupFixture.mode==='pickerCancel')return {cancelled:true};return scan();},
      async progress(){return {running:true,phase:'scan',scannedFiles:2,scannedBytes:8192};},
      async cancel(){dupFixture.cancels++;dupFixture.resolve?.({...scan(),groups:[],cancelled:true,partial:true});return {ok:true};},
      async deleteSelected(value){dupFixture.deletes.push(value);if(dupFixture.mode==='deleteError')throw new Error('changed');return {deleted:[{id:value.ids[0]}],deletedBytes:4096,failures:value.ids.slice(1).map(id=>({id,message:'CHANGED'})),cancelled:false};}
    }}:{}};
  },native);
  await page.goto(url);await page.waitForFunction(()=>window.PBDuplicates&&typeof db!=='undefined'&&db);
  await page.locator('.main-pages [data-tab="dupes"]').click();return {page,errors};
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const {page,errors}=await app();
  ok('Physical folder cleanup is the primary action and catalog cleanup is separate',await page.locator('#pbDupChoose').isVisible()&&await page.locator('#pbDuplicateCleanup').evaluate(e=>e.nextElementSibling.id==='pbDuplicateCatalog')&&await page.locator('#pbDuplicateCatalog summary').textContent()==='Katalogverweise');
  await page.locator('#pbDupChoose').click();await page.waitForFunction(()=>document.querySelectorAll('#pbDupGroups input').length===3);
  ok('A real folder scan result starts with no selected copy and no enabled delete action',await page.locator('#pbDupGroups input:checked').count()===0&&await page.locator('#pbDupDelete').isDisabled());
  ok('File names are text, never HTML',await page.locator('#pbDupGroups img').count()===0&&(await page.locator('#pbDupGroups').textContent()).includes('<img src=x onerror=alert(1)>.txt'));
  await page.locator('#pbDupExtra').click();
  ok('Explicit select-extras preserves one unchecked copy and prevents selecting the last copy',await page.locator('#pbDupGroups input:checked').count()===2&&await page.locator('#pbDupGroups input:not(:checked)').isDisabled());
  await page.locator('#pbDupDelete').click();
  ok('Review lists actual paths, file count and bytes before any native deletion',await page.locator('#pbDupReview').isVisible()&&(await page.locator('#pbDupReview').textContent()).includes('Ordner/Kopie A.txt')&&(await page.locator('#pbDupReview strong').textContent()).includes('2 Dateien · 8.0 KiB')&&await page.evaluate(()=>dupFixture.deletes.length)===0);
  await page.locator('#pbDupReview button',{hasText:'Abbrechen'}).click();
  ok('Cancelling review never calls physical deletion',await page.evaluate(()=>dupFixture.deletes.length)===0);
  await page.locator('#pbDupDelete').click();await page.locator('#pbDupConfirm').click();await page.waitForFunction(()=>dupFixture.deletes.length===1&&!document.getElementById('pbDupChoose').disabled);
  const call=await page.evaluate(()=>dupFixture.deletes[0]);
  ok('Confirmation sends only selected current opaque IDs and explicit confirmation',JSON.stringify(call.ids)==='["delete-a","delete-b"]'&&call.session==='current-folder-session'&&call.confirmed===true&&!('path' in call)&&!('uri' in call));
  ok('Partial deletion removes only reported IDs and accurately reports failure and bytes',await page.locator('#pbDupGroups input').count()===2&&(await page.locator('#pbDupStatus').textContent()).includes('Dateien entfernt: 1 · 4.0 KiB · Löschung nicht bestätigt: 1')&&await page.locator('#pbDupGroups input:checked').count()===0);
  await page.waitForTimeout(550);
  ok('A failed physical deletion is never silently retried',await page.evaluate(()=>dupFixture.deletes.length)===1);
  await page.evaluate(()=>dupFixture.mode='partial');await page.locator('#pbDupChoose').click();await page.waitForFunction(()=>!document.getElementById('pbDupChoose').disabled);
  ok('Incomplete scans disclose skipped files instead of claiming complete coverage',(await page.locator('#pbDupStatus').textContent()).includes('Prüfung unvollständig')&&(await page.locator('#pbDupStatus').textContent()).includes('2 übersprungen'));
  await page.evaluate(()=>dupFixture.mode='deleteError');await page.locator('#pbDupExtra').click();await page.locator('#pbDupDelete').click();await page.locator('#pbDupConfirm').click();await page.waitForFunction(()=>dupFixture.deletes.length===2&&!document.getElementById('pbDupChoose').disabled);
  ok('Bridge rejection leaves all source-copy rows present and makes no success claim',await page.locator('#pbDupGroups input').count()===3&&(await page.locator('#pbDupStatus').textContent()).includes('konnte nicht')&&!(await page.locator('#pbDupStatus').textContent()).includes('Dateien entfernt'));
  await page.evaluate(()=>dupFixture.mode='slow');await page.locator('#pbDupChoose').click();await page.waitForFunction(()=>Boolean(dupFixture.resolve));
  ok('Slow scan immediately shows activity and a working cancel action',await page.locator('#pbDupStatus').evaluate(e=>e.classList.contains('pb-dup-waiting'))&&await page.locator('#pbDupCancel').isVisible());
  await page.locator('#pbDupCancel').click();await page.waitForFunction(()=>!document.getElementById('pbDupChoose').disabled);
  ok('Cancellation reaches the bridge during the scan and reports incomplete coverage',await page.evaluate(()=>dupFixture.cancels)===1&&(await page.locator('#pbDupStatus').textContent()).includes('Abgebrochen · Prüfung unvollständig'));
  await page.evaluate(()=>dupFixture.mode='normal');await page.locator('#pbDupChoose').click();await page.waitForFunction(()=>document.querySelectorAll('#pbDupGroups input').length===3);
  for(const width of [320,390,800,1280]){
    await page.setViewportSize({width,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='20px');
    ok(`${width}px portrait/DeX cleanup keeps actions and paths inside the viewport`,await page.locator('#pbDuplicateCleanup').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth));
  }
  for(const [lang,label]of [['en','Duplicate files'],['ru','Дубликаты файлов'],['pl','Duplikaty plików'],['de','Doppelte Dateien']]){
    await page.evaluate(lang=>document.documentElement.lang=lang,lang);await page.waitForFunction(label=>document.querySelector('#pbDuplicateCleanup h2').textContent===label,label);
    ok(`${lang}: physical and catalog cleanup labels follow the app language`,await page.locator('#pbDuplicateCleanup h2').textContent()===label);
  }
  ok('Cleanup runtime has no browser errors',errors.length===0||console.log(errors));await page.close();
  const fallback=await app(false);await fallback.page.locator('#pbDuplicateCatalog summary').click();
  ok('Unsupported hosts explain availability while retaining the catalog-only action',await fallback.page.locator('#pbDupChoose').isHidden()&&(await fallback.page.locator('#pbDupStatus').textContent()).includes('nicht verfügbar')&&await fallback.page.locator('#dupRemove').isVisible()&&(await fallback.page.locator('#pbDuplicateCatalog').textContent()).includes('keine Dateien'));
  ok('Unsupported-host runtime has no browser errors',fallback.errors.length===0||console.log(fallback.errors));await fallback.page.close();
  console.log(`${count} duplicate-cleanup browser checks passed (fake bridge; no user files).`);
}finally{await browser?.close();server.close();}
