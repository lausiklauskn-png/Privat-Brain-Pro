import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0,failWrite=false,readCalls=0;const saved=new Map(),pending=new Map(),ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
try{
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage(),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
 await page.exposeFunction('nativeOriginal',async(method,args={})=>{
  if(method==='listOriginals')return {items:[...saved.keys()]};
  if(method==='beginImport'){if(failWrite)throw new Error('disk full');if(saved.has(args.hash))return {stored:true};const ticket=String(pending.size+1);pending.set(ticket,{meta:args,parts:[]});return {ticket};}
  if(method==='appendImport'){pending.get(args.ticket).parts.push(Buffer.from(args.data,'base64'));return {ok:true};}
  if(method==='finishImport'){const item=pending.get(args.ticket),bytes=Buffer.concat(item.parts);assert.equal(digest(bytes),item.meta.hash);saved.set(item.meta.hash,{meta:item.meta,bytes});pending.delete(args.ticket);return{ok:true};}
  if(method==='abortImport'){pending.delete(args.ticket);return{ok:true};}
  if(method==='originalInfo')return saved.get(args.hash)?.meta||{missing:true};
  if(method==='readOriginal'){readCalls++;return{data:saved.get(args.hash).bytes.subarray(args.offset,args.offset+256*1024).toString('base64')};}
  if(method==='open')return {ok:true};
  throw new Error('unknown native operation');
 });
 await page.addInitScript(()=>{const api={};for(const method of ['listOriginals','beginImport','appendImport','finishImport','abortImport','originalInfo','readOriginal','open'])api[method]=args=>window.nativeOriginal(method,args);window.Capacitor={Plugins:{ProFiles:api}};});
 await page.goto(url);await page.waitForFunction(()=>window.PBOriginals&&window.PBNavigation&&typeof db!=='undefined'&&db);
 const png=Buffer.from(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const context=canvas.getContext('2d');context.fillStyle='#604199';context.fillRect(0,0,96,64);context.fillStyle='#ffcc44';context.fillRect(10,10,30,30);return canvas.toDataURL('image/png').split(',')[1];}),'base64');
 const source={name:'original-persistence.png',mimeType:'image/png',buffer:png},hash=digest(png);
 await page.setInputFiles('#fileInput',source);await page.waitForFunction(()=>CATALOG.length===1&&!signing);
 ok('Successful import retains exact original bytes in native storage',saved.get(hash)?.bytes.equals(png));
 ok('Native import does not require desktop folder API',await page.locator('#libraryStatus').textContent().then(t=>t.includes('Dauerhafte Originalkopien')));
 await page.reload();await page.waitForFunction(()=>window.PBOriginals&&CATALOG.length===1);
 ok('Session memory is empty after restart',await page.evaluate(()=>SESSION_FILES.size===0));
 await page.click('[data-tab=explorer]');await page.locator('#explorerFiles .explorer-row > button').first().click();await page.locator('.native-file-image').waitFor();
 ok('Catalog original opens after restart, read from native storage',readCalls>0&&await page.locator('.native-file-image').evaluate(e=>e.complete&&e.naturalWidth===96));
 ok('Restored file hash and bytes match the imported original',await page.evaluate(async()=>{const f=await resolveFile(CATALOG[0]);return await sha256(await f.arrayBuffer())===CATALOG[0].hash&&f.size===CATALOG[0].size&&f.pbOriginalHash===CATALOG[0].hash;}));
 await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
 saved.delete(hash);await page.reload();await page.waitForFunction(()=>window.PBOriginals&&CATALOG.length===1);
 await page.evaluate(()=>openLightbox(CATALOG[0].hash));await page.locator('#lightboxBg.on').waitFor();
 ok('Legacy missing original still retains its preview',await page.locator('#lightboxImg').evaluate(e=>Boolean(e.src)));
 await page.click('#lightboxOpen');await page.locator('.native-original-reconnect').waitFor();
 ok('Missing original offers reconnect instead of pretending preview is original',await page.locator('.native-original-reconnect').textContent().then(t=>t.includes('ist im Katalog, aber die Datei selbst')));
 ok('Reconnect shows exactly one "Datei auswählen" (the file field itself stays hidden)',await page.evaluate(()=>{const d=document.querySelector('.native-original-reconnect');const f=d.querySelector('input[type=file]');return getComputedStyle(f).display==='none'&&[...d.querySelectorAll('button')].filter(b=>b.textContent==='Datei auswählen').length===1;}));
 await page.setInputFiles('.native-original-reconnect input[type=file]',{name:'wrong.txt',mimeType:'text/plain',buffer:Buffer.from('unrelated')});await page.getByText('Diese Datei passt nicht zum Original.',{exact:false}).waitFor();
 ok('Wrong replacement cannot overwrite catalog or publish a copy',saved.size===0&&await page.evaluate(()=>CATALOG.length===1));
 await page.setInputFiles('.native-original-reconnect input[type=file]',source);await page.locator('.native-file-image').waitFor();
 ok('Same original reattaches by hash without duplicate catalog entry',saved.get(hash)?.bytes.equals(png)&&await page.evaluate(()=>CATALOG.length===1));
 await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});await page.keyboard.press('Escape');
 await page.reload();await page.waitForFunction(()=>window.PBOriginals&&CATALOG.length===1);await page.evaluate(()=>openFile(CATALOG[0].hash));await page.locator('.native-file-image').waitFor();
 ok('Reattached original survives another restart',true);await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
 failWrite=true;await page.setInputFiles('#fileInput',{name:'failed-copy.txt',mimeType:'text/plain',buffer:Buffer.from('must not enter catalog without copy')});await page.waitForFunction(()=>!signing);
 ok('Storage failure does not create a misleading durable catalog entry',await page.evaluate(()=>CATALOG.length===1)&&saved.get(hash)?.bytes.equals(png));failWrite=false;
 const broken=Buffer.from(png);broken[20]^=1;saved.get(hash).bytes=broken;await page.reload();await page.waitForFunction(()=>window.PBOriginals&&CATALOG.length===1);await page.evaluate(()=>openFile(CATALOG[0].hash));await page.locator('.native-original-reconnect').waitFor();
 ok('Corrupted original cannot silently replace verified image bytes',await page.locator('.native-file-viewer').isHidden());await page.keyboard.press('Escape');
 await page.locator('.native-original-reconnect').waitFor({state:'detached'});
 ok('Reconnect cancellation leaves catalog and app intact',await page.evaluate(()=>CATALOG.length===1)&&await page.locator('.native-original-reconnect').count()===0);
 ok('No runtime errors',errors.length===0);
 console.log(`${count} original persistence checks passed (simulated native bridge; physical storage tested on Android).`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
