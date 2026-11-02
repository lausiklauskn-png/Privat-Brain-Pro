// Real built UI, ordinary import and IndexedDB. Native OS/file APIs are explicit in-memory fixtures.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_SHARE_TEST_ROOT||'www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('PASS '+name);count++;};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const incoming=new Map(),saved=new Map(),pending=new Map(),calls={done:[],read:[],invalid:[]};
let failRead='',failWrite='',corruptRead='',failDone='',refused=0,allowDiscard='';
const add=(id,name,text,size)=>incoming.set(id,{id,name,mime:name.endsWith('.eml')?'message/rfc822':'text/plain',bytes:Buffer.from(text),size:size??Buffer.byteLength(text)});
add('a','Rechnung Zahnarzt.txt','Erfundene Rechnung vom Zahnarzt über 120 Euro');
add('b','Langer Bericht.txt','x'.repeat(300*1024));
add('c','Riesig.bin','',90*1024*1024);
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:360,height:780}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.exposeFunction('shareNative',async(method,args={})=>{
    if(method==='pending'){const result={items:[...incoming.values()].map(({id,name,mime,size})=>({id,name,mime,size})),refused};refused=0;return result;}
    if(method==='read'){calls.read.push([args.id,args.offset]);if(args.id===failRead)throw Error('read unavailable');return{data:incoming.get(args.id).bytes.subarray(args.offset,args.offset+256*1024).toString('base64')};}
    if(method==='done'){
      if(args.id===failDone)throw Error('ack write failed');
      const item=incoming.get(args.id);if(!item)return{};
      if(args.id!==allowDiscard){
        const hash=digest(item.bytes),original=saved.get(hash);
        const originalMatches=original?.bytes.equals(item.bytes);
        const durable=await page.evaluate(async hash=>(await idbGetAll('catalog')).some(r=>r.hash===hash||r.localSource?.originalHash===hash),hash);
        if(!originalMatches||!durable)calls.invalid.push(args.id);
      }
      calls.done.push(args.id);incoming.delete(args.id);return{};
    }
    throw Error('unknown share method');
  });
  await page.exposeFunction('filesNative',async(method,args={})=>{
    if(method==='listOriginals')return{items:[...saved.keys()]};
    if(method==='beginImport'){if(args.name===failWrite)throw Error('disk full');if(saved.has(args.hash))return{stored:true};const ticket=crypto.randomUUID();pending.set(ticket,{meta:args,parts:[],size:0});return{ticket};}
    if(method==='appendImport'){const item=pending.get(args.ticket),bytes=Buffer.from(args.data,'base64');assert.equal(args.offset,item.size);item.parts.push(bytes);item.size+=bytes.length;return{};}
    if(method==='finishImport'){const item=pending.get(args.ticket),bytes=Buffer.concat(item.parts);assert.equal(bytes.length,item.meta.size);assert.equal(digest(bytes),item.meta.hash);saved.set(item.meta.hash,{meta:item.meta,bytes});pending.delete(args.ticket);return{};}
    if(method==='abortImport'){pending.delete(args.ticket);return{};}
    if(method==='originalInfo')return saved.get(args.hash)?.meta||{missing:true};
    if(method==='readOriginal'){const item=saved.get(args.hash),bytes=Buffer.from(item.bytes.subarray(args.offset,args.offset+256*1024));if(item.meta.name===corruptRead&&bytes.length)bytes[0]^=1;return{data:bytes.toString('base64')};}
    throw Error('unknown files method');
  });
  await page.addInitScript(()=>{
    const share={},files={};for(const m of ['pending','read','done'])share[m]=a=>window.shareNative(m,a);
    share.addListener=(name,fn)=>{window.shareEvent=fn;return{remove(){}};};
    for(const m of ['listOriginals','beginImport','appendImport','finishImport','abortImport','originalInfo','readOriginal'])files[m]=a=>window.filesNative(m,a);
    window.Capacitor={Plugins:{ProShare:share,ProFiles:files}};
  });
  const settled=()=>page.waitForFunction(()=>window.PBShare&&typeof signing!=='undefined'&&!signing&&document.querySelector('#native-share-pending button')?.disabled===false);
  const collect=()=>page.evaluate(()=>PBShare.collect());
  await page.goto(url);await settled();
  ok('Two shared files reach the real catalog and persistent original store',calls.done.join(',')==='a,b'&&saved.size===2&&await page.evaluate(()=>CATALOG.length===2));
  ok('Several chunks preserve the complete original',calls.read.filter(([id])=>id==='b').length>=3&&[...saved.values()].some(x=>x.bytes.length===300*1024));
  ok('Oversized file stays pending without being read or acknowledged',incoming.has('c')&&!calls.read.some(([id])=>id==='c'));
  ok('Retry and explicit removal are visible in the ordinary intake',await page.locator('#native-share-pending').innerText().then(t=>t.includes('Riesig.bin')&&t.includes('Erneut versuchen')&&t.includes('Aus Eingang entfernen')));
  ok('The import is visible on the intake page',await page.evaluate(()=>document.querySelector('.tab.on')?.dataset.tab==='intake'));
  add('d','Zweite Freigabe.txt','Erfundener zweiter Text');refused=1;await collect();
  ok('A second share while the app is open is durably accepted',calls.done.includes('d'));
  ok('Read/import problems are reported with retained pending files',await page.locator('#toast').innerText().then(t=>t.includes('dauerhaft gespeichert')&&t.includes('nicht gelesen oder gespeichert')&&t.includes('bleiben im Eingang')));
  add('busy','Wartet.txt','Erfundener wartender Import');await page.evaluate(()=>{signing=true;void PBShare.collect();});await page.waitForTimeout(250);
  ok('Concurrent import cannot acknowledge or discard incoming data',!calls.done.includes('busy')&&incoming.has('busy'));
  await page.evaluate(()=>{signing=false;});await settled();ok('Waiting import is accepted after the earlier import ends',calls.done.includes('busy'));
  add('read','Lesefehler.txt','Bleibt bei Lesefehler');failRead='read';await collect();
  ok('Read failure retains the same incoming identifier',incoming.has('read')&&!calls.done.includes('read'));
  failRead='';await collect();ok('Read retry imports the retained source once',calls.done.filter(id=>id==='read').length===1);
  add('permission','Freigabe.txt','Nicht ohne Freigabe');await page.evaluate(()=>{window.oldPrepare=PBWorkspace.prepareImport;PBWorkspace.prepareImport=async()=>false;});await collect();
  ok('Declined folder permission does not acknowledge a file',incoming.has('permission')&&!calls.done.includes('permission'));
  await page.evaluate(()=>{PBWorkspace.prepareImport=window.oldPrepare;});await collect();ok('The same file can be accepted after granting permission',calls.done.includes('permission'));
  add('storage','Speicherfehler.txt','Quelle trotz vollem Speicher');failWrite='Speicherfehler.txt';await collect();
  ok('Native storage failure is not reported as acceptance',incoming.has('storage')&&!calls.done.includes('storage')&&await page.evaluate(()=>!CATALOG.some(r=>r.name==='Speicherfehler.txt')));
  failWrite='';await collect();ok('Native storage retry completes normally',calls.done.includes('storage'));
  add('abort','Transaktionsabbruch.txt','Erfundene abgebrochene Transaktion');
  await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...rest){const req=originalPut.call(this,value,...rest);if(this.name==='catalog'&&value.name==='Transaktionsabbruch.txt')req.addEventListener('success',()=>req.transaction.abort(),{once:true});return req;};});await collect();
  ok('Request success followed by transaction abort leaves the source pending',incoming.has('abort')&&!calls.done.includes('abort')&&await page.evaluate(()=>!CATALOG.some(r=>r.name==='Transaktionsabbruch.txt')));
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.originalPut;});await collect();ok('Transaction retry produces exactly one accepted file',calls.done.filter(id=>id==='abort').length===1);
  const mail='From: erfunden@example.invalid\r\nTo: test@example.invalid\r\nSubject: Mail-Transaktionsabbruch\r\nDate: Mon, 2 Nov 2026 08:00:00 +0000\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nErfundene E-Mail bleibt bei Speicherfehler erhalten.\r\n';
  add('mail','Probe.eml',mail);
  await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...rest){const req=originalPut.call(this,value,...rest);if(this.name==='catalog'&&value.mail?.subject==='Mail-Transaktionsabbruch')req.addEventListener('success',()=>req.transaction.abort(),{once:true});return req;};});await collect();
  ok('Mail transaction failure cannot be swallowed into a false success',incoming.has('mail')&&!calls.done.includes('mail')&&await page.evaluate(()=>!CATALOG.some(r=>r.mail?.subject==='Mail-Transaktionsabbruch')));
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.originalPut;});await collect();ok('Mail retry saves raw original and catalog before acknowledgment',calls.done.includes('mail'));
  add('corrupt','Kaputte Kopie.txt','Original muss frisch nachgelesen werden');corruptRead='Kaputte Kopie.txt';await collect();
  ok('A corrupt native copy is rejected even with the good File still in session memory',incoming.has('corrupt')&&!calls.done.includes('corrupt'));
  corruptRead='';await collect();ok('Corrected native read allows retry without duplicate catalog entry',calls.done.includes('corrupt')&&await page.evaluate(()=>CATALOG.filter(r=>r.name==='Kaputte Kopie.txt').length===1));
  add('restart','Neustart.txt','Original vor ausgebliebener Quittung');failDone='restart';await collect();
  ok('A failed acknowledgment leaves the already stored file retryable',incoming.has('restart')&&await page.evaluate(()=>CATALOG.filter(r=>r.name==='Neustart.txt').length===1));
  failDone='';await page.reload();await settled();
  ok('Cold page restart accepts the pending identifier without a second catalog entry',calls.done.filter(id=>id==='restart').length===1&&await page.evaluate(()=>CATALOG.filter(r=>r.name==='Neustart.txt').length===1));
  ok('Shared email raw bytes remain available after restart',await page.evaluate(async()=>{const r=CATALOG.find(r=>r.mail?.subject==='Mail-Transaktionsabbruch');return(await PBMail.getRaw(r.hash))?.includes('Erfundene E-Mail bleibt');}));
  for(const lang of ['en','ru','pl']){await page.evaluate(lang=>{document.documentElement.lang=lang;},lang);await page.waitForTimeout(50);ok('Pending files have localized controls: '+lang,!(await page.locator('#native-share-pending').innerText()).includes('Erneut versuchen'));}
  await page.evaluate(()=>{document.documentElement.lang='de';});await page.waitForTimeout(50);
  page.once('dialog',d=>d.dismiss());await page.locator('#native-share-pending li button').click();ok('Cancelling explicit discard retains the source',incoming.has('c'));
  allowDiscard='c';page.once('dialog',d=>d.accept());await page.locator('#native-share-pending li button').click();await page.locator('#native-share-pending').waitFor({state:'hidden'});
  ok('Only explicit confirmed discard removes an unaccepted oversized source',!incoming.has('c')&&calls.done.filter(id=>id==='c').length===1);
  ok('Every acknowledgment independently matches stored bytes and committed catalog',calls.invalid.length===0);
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} share checks passed; native bridge simulated, no physical-device claim.`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
