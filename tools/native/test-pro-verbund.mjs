// Built UI + ordinary import + real IndexedDB. OS dialogs/storage are fixtures;
// canonical encrypted files and Windows service are tested separately in engine/test.mjs.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_PRO_TEST_ROOT||'www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{if(req.url==='/seed'){res.setHeader('content-type','text/html');res.end('<!doctype html><html><body>Migration fixture</body></html>');return;}const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const body=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const digest=x=>createHash('sha256').update(x).digest('hex'),incoming=new Map(),saved=new Map(),pending=new Map(),sent=new Map(),targetMarks=new Set(),ack=[],invalid=[];
let vaultId='vault-a',open=true,failRead='',badContract='',corruptRead='',failAck='',failSend=false,switchOnRead=false,backup,backupParts=[];
const add=(id,name,text,overrides={})=>{const bytes=Buffer.from(text);incoming.set(id,{entryId:id,bytes,vertrag:{vertrag:'familienakte-uebergabe/1',id,quelle:'familienakte',ziel:'private-brain',dokumentId:'doc-'+id,name,mime:'text/plain',groesse:bytes.length,sha256:digest(bytes),...overrides}});};
add('first','Brief.txt','Erfundener Brief zur privaten Ablage');
let browser,page,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('PASS '+name);count++;};
try{
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 page=await browser.newPage({viewport:{width:412,height:850}});const url=`http://127.0.0.1:${server.address().port}/`,errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
 await page.exposeFunction('proFixture',async(method,args={})=>{
  if(method==='state')return{configured:true,unlocked:true,location:'device',reachable:true};
  if(method==='tresorZustand')return{uebergaben:true,gewaehlt:true,offen:open,erreichbar:true,kennung:vaultId,ordner:'Erfundener gemeinsamer Ordner',eingezogen:false};
  if(method==='tresorEinziehen'){assert.equal(args.nurVerbinden,true);assert.ok(!('password' in args));open=true;return{offen:true};}
  if(method==='tresorSperren'){open=false;return{};}
  if(method==='attachments')return{items:[]};
  if(method==='catalogBegin'){backupParts=[];return{ticket:'backup'};}
  if(method==='catalogAppend'){backupParts.push(Buffer.from(args.data,'base64'));return{};}
  if(method==='catalogFinish'){backup=Buffer.concat(backupParts);return{};}
  if(method==='catalogAbort')return{};
  if(method==='catalogInfo')return backup?{exists:true,size:backup.length,version:'backup'}:{exists:false};
  if(method==='catalogRead')return{data:backup.subarray(args.offset,args.offset+262144).toString('base64')};
  if(method==='tresorUebergabe'){
   if(args.vaultId!==vaultId||!open)throw Error('TRESOR_UEBERGABE_FREMD');
   if(args.aktion==='eingang')return{items:[...incoming.values()].map(({bytes,...rest})=>structuredClone(rest))};
   if(args.aktion==='lesen'){
    if(args.entryId===failRead)throw Error('TRESOR_NICHT_VERFUEGBAR');const item=incoming.get(args.entryId),m=item.vertrag;
    saved.set(m.sha256,{meta:{hash:m.sha256,size:m.groesse,name:m.name,mime:m.mime},bytes:item.bytes});
    if(switchOnRead){vaultId='vault-b';switchOnRead=false;}
    return{entryId:item.entryId,originalHash:m.sha256,vertrag:{...m,...(args.entryId===badContract?{name:'fremd.txt'}:{})}};
   }
   if(args.aktion==='quittieren'){
    if(args.entryId===failAck)throw Error('ack disk full');const item=incoming.get(args.entryId),m=item.vertrag;
    const proof=await page.evaluate(async m=>({catalog:(await idbGetAll('catalog')).some(r=>r.hash===m.sha256||r.localSource?.originalHash===m.sha256),receipt:(await idbGetAll('proUebergaben')).some(r=>r.kind==='eingang'&&r.vertrag.id===m.id&&r.stand==='gespeichert')}),m);
    if(!proof.catalog||!proof.receipt||!saved.get(m.sha256)?.bytes.equals(item.bytes))invalid.push(args.entryId);
    ack.push(args.entryId);incoming.delete(args.entryId);return{stand:'im-eingang'}; // never hide a premature ack
   }
   if(args.aktion==='senden'){
    const m=args.vertrag;
    const receipt=await page.evaluate(async id=>(await idbGetAll('proUebergaben')).find(r=>r.kind==='ausgang'&&r.vertrag.id===id),m.id);
    if(!receipt)invalid.push('send-'+m.id);
    if(failSend)throw Error('removed disk');const bytes=saved.get(m.sha256)?.bytes;
    assert.ok(bytes&&digest(bytes)===m.sha256&&bytes.length===m.groesse);
    sent.set(m.id,structuredClone(m));return{id:'entry-'+m.id,name:m.name,art:m.mime,groesse:m.groesse,sha256:m.sha256,schreiber:m.quelle};
   }
   if(args.aktion==='stand')return{bestaetigt:targetMarks.has(args.entryId)};
  }
  throw Error('Unknown ProVault '+method+' '+args.aktion);
 });
 await page.exposeFunction('filesFixture',async(method,args={})=>{
  if(method==='listOriginals')return{items:[...saved.keys()]};
  if(method==='beginImport'){if(saved.has(args.hash))return{stored:true};const ticket=crypto.randomUUID();pending.set(ticket,{meta:args,parts:[]});return{ticket};}
  if(method==='appendImport'){pending.get(args.ticket).parts.push(Buffer.from(args.data,'base64'));return{};}
  if(method==='finishImport'){const item=pending.get(args.ticket),bytes=Buffer.concat(item.parts);assert.equal(digest(bytes),item.meta.hash);saved.set(item.meta.hash,{meta:item.meta,bytes});pending.delete(args.ticket);return{};}
  if(method==='abortImport'){pending.delete(args.ticket);return{};}
  if(method==='originalInfo')return saved.get(args.hash)?.meta||{missing:true};
  if(method==='readOriginal'){const item=saved.get(args.hash);if(!item)throw Error('ORIGINAL_MISSING');const bytes=Buffer.from(item.bytes.subarray(args.offset,args.offset+262144));if(item.meta.name===corruptRead&&bytes.length)bytes[0]^=1;return{data:bytes.toString('base64')};}
  throw Error('Unknown ProFiles '+method);
 });
 await page.addInitScript(()=>{
  delete window.showDirectoryPicker;
  const vault=['state','attachments','catalogBegin','catalogAppend','catalogFinish','catalogAbort','catalogInfo','catalogRead','tresorZustand','tresorEinziehen','tresorSperren','tresorUebergabe'];
  const files=['listOriginals','beginImport','appendImport','finishImport','abortImport','originalInfo','readOriginal'];
  window.Capacitor={Plugins:{ProVault:Object.fromEntries(vault.map(m=>[m,a=>proFixture(m,a)])),ProFiles:Object.fromEntries(files.map(m=>[m,a=>filesFixture(m,a)]))}};
 });
 await page.goto(url+'seed');await page.evaluate(async()=>{await new Promise((resolve,reject)=>{const r=indexedDB.open('company_brain',1);r.onupgradeneeded=()=>{r.result.createObjectStore('catalog',{keyPath:'hash'}).put({hash:'f'.repeat(64),name:'Vorhanden.txt',size:3,type:'text/plain',tags:[],dupes:[],snippet:'Vorhanden',vector:Array(256).fill(0),tf:{}});r.result.createObjectStore('dirs',{keyPath:'id'}).put({id:'old-directory',name:'Erhaltener Ordner'});};r.onsuccess=()=>{r.result.close();resolve();};r.onerror=()=>reject(r.error);});});
 const ready=()=>page.waitForFunction(()=>window.PBProVerbund&&window.PBVault&&typeof db!=='undefined'&&db&&document.querySelector('#pro-verbund button'));
 await page.goto(url);await ready();
 ok('Version-one catalog and directory survive the receipt-store upgrade',await page.evaluate(async()=>db.version===2&&CATALOG.some(r=>r.name==='Vorhanden.txt')&&(await idbGet('dirs','old-directory')).name==='Erhaltener Ordner'));
 const receive=()=>page.evaluate(()=>PBProVerbund.receive()),out=()=>page.evaluate(async()=>(await idbGetAll('proUebergaben')).filter(r=>r.kind==='ausgang'));
 await receive();ok('Canonical input uses the normal catalog and only then acknowledges',ack.includes('first')&&await page.evaluate(()=>CATALOG.some(r=>r.name==='Brief.txt'))&&invalid.length===0);
 add('first','Brief.txt','Erfundener Brief zur privaten Ablage');await receive();ok('Same identifier and bytes do not create another catalog entry',await page.evaluate(()=>CATALOG.filter(r=>r.name==='Brief.txt').length===1));
 add('first','Brief.txt','Andere Bytes');await receive();ok('Reused identifier with changed bytes remains pending',incoming.has('first')&&ack.filter(x=>x==='first').length===2);incoming.delete('first');
 add('permission','Freigabe.txt','Erfunden');await page.evaluate(()=>{window.oldPrepare=PBWorkspace.prepareImport;PBWorkspace.prepareImport=async()=>false;});await receive();ok('Declined normal import cannot acknowledge the common inbox',incoming.has('permission'));await page.evaluate(()=>{PBWorkspace.prepareImport=oldPrepare;});await receive();
 add('abort','Abbruch.txt','Erfundener Transaktionsabbruch');await page.evaluate(()=>{window.oldPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...rest){const request=oldPut.call(this,value,...rest);if(this.name==='proUebergaben'&&value.vertrag?.id==='abort'&&value.stand==='gespeichert')request.addEventListener('success',()=>request.transaction.abort());return request;};});await receive();ok('Receipt transaction abort leaves an imported original unacknowledged',incoming.has('abort')&&await page.evaluate(()=>CATALOG.some(r=>r.name==='Abbruch.txt')));await page.evaluate(()=>{IDBObjectStore.prototype.put=oldPut;});await receive();ok('Retry after receipt abort completes without duplicate catalog entry',!incoming.has('abort')&&await page.evaluate(()=>CATALOG.filter(r=>r.name==='Abbruch.txt').length===1));
 add('read','Lesefehler.txt','Bleibt im gemeinsamen Eingang');failRead='read';await receive();ok('Removed storage keeps the incoming contract pending',incoming.has('read'));failRead='';await receive();
 add('corrupt','Korrupte Kopie.txt','Nur echte Originalbytes');await page.evaluate(()=>signBatch([{file:new File(['Nur echte Originalbytes'],'Korrupte Kopie.txt',{type:'text/plain'}),path:'Korrupte Kopie.txt',dirId:null}],{durable:true}));corruptRead='Korrupte Kopie.txt';await receive();ok('A corrupt stored original never gets a receiver mark',incoming.has('corrupt'));corruptRead='';await receive();
 add('contract','Vertrag.txt','Korrekte Herkunft');badContract='contract';await receive();ok('Changed native description cannot acknowledge another file',incoming.has('contract'));badContract='';await receive();
 add('foreign','Ziel.txt','Bleibt beim falschen Ziel',{ziel:'bookledgerpro'});add('oversized','Gross.txt','Bleibt bei falscher Größe',{groesse:21*1024*1024});await receive();ok('Wrong target and oversized descriptions are not read or accepted',incoming.has('foreign')&&incoming.has('oversized'));incoming.delete('foreign');incoming.delete('oversized');
 add('restart','Neustart.txt','Gleicher Eingang nach Neustart');failAck='restart';await receive();ok('Failed native mark keeps the durable receiver receipt',incoming.has('restart'));failAck='';await page.reload();await ready();await receive();ok('Cold page restart safely repeats the same pending transfer',!incoming.has('restart')&&await page.evaluate(()=>CATALOG.filter(r=>r.name==='Neustart.txt').length===1));
 add('switch','Tresorwechsel.txt','Keine Bestätigung im falschen Tresor');switchOnRead=true;await receive();ok('Vault switch during import prevents acknowledgment through the new connection',incoming.has('switch'));vaultId='vault-a';await receive();
 const send=(text='Erfundene bearbeitete Fassung',target='familienakte')=>page.evaluate(async({text,target})=>{const r=CATALOG.find(r=>r.name==='Brief.txt');return PBProVerbund.send(new File([text],'Antwort.txt',{type:'text/plain'}),r.hash,target);},{text,target});
 failSend=true;await send().catch(()=>{});const reserved=await out();ok('Outbox identity is committed before a failing native send',reserved.length===1&&reserved[0].stand==='offen'&&sent.size===0);
 await page.reload();await ready();failSend=false;await page.evaluate(()=>PBWorkspace.navigate('settings'));await page.evaluate(()=>PBProVerbund.render());await page.locator('#pro-verbund li button').click();await page.waitForFunction(()=>/Weitergegeben|Im Eingang/.test(document.querySelector('#pro-verbund li')?.textContent||'')&&document.querySelector('#pro-verbund .btnrow button')?.disabled===false);
 ok('Retry from the visible outbox survives restart and keeps the identifier',sent.has(reserved[0].vertrag.id)&&sent.size===1);
 await send();ok('Repeated send is idempotent and retains the original relation',sent.size===1&&[...sent.values()][0].bezug==='first');
 await page.evaluate(()=>PBProVerbund.confirm());ok('Transport delivery is still awaiting the real target mark',(await out())[0].stand==='weitergegeben');
 targetMarks.add((await out())[0].entryId);await page.evaluate(()=>PBProVerbund.confirm());ok('Only the target mark changes the outgoing state to accepted',(await out())[0].stand==='im-eingang');
 await send('Noch einmal bearbeitete Fassung');ok('Edited return gets a new identity with the original relation',sent.size===2&&[...sent.values()].every(m=>m.bezug==='first'));
 await send('Nicht als Text nach Workflow','workflow-pdf-pro').then(()=>{throw Error('unexpected acceptance');},()=>{});ok('Unsupported target file type is rejected before native transfer',sent.size===2);
 const expected=await page.evaluate(()=>idbGetAll('proUebergaben'));await page.evaluate(()=>PBVault.backup());const snapshot=JSON.parse(backup);ok('Encrypted catalog snapshot also contains the stable transfer receipts',snapshot.proUebergaben.length===expected.length&&snapshot.proUebergaben.some(r=>r.vertrag.bezug==='first'));
 await page.evaluate(async()=>{await idbClear('proUebergaben');});await page.evaluate(rows=>PBProVerbund.restore(rows),snapshot.proUebergaben);ok('Restoring receipt metadata preserves outgoing identities and source relations',JSON.stringify(await page.evaluate(()=>idbGetAll('proUebergaben')))===JSON.stringify(expected));
 const conflict=structuredClone(snapshot.proUebergaben);conflict[0].vertrag.name='Anderer Name';const rejectedConflict=await page.evaluate(rows=>PBProVerbund.restore(rows),conflict).then(()=>false,()=>true);ok('Conflicting restoration never overwrites existing receipt metadata',rejectedConflict&&JSON.stringify(await page.evaluate(()=>idbGetAll('proUebergaben')))===JSON.stringify(expected));
 const malformed=structuredClone(snapshot.proUebergaben);malformed[0].id='invalid';await page.evaluate(rows=>PBProVerbund.restore(rows),malformed).then(()=>{throw Error('unexpected acceptance');},()=>{});ok('Forged restore identifiers are rejected without changing local receipts',JSON.stringify(await page.evaluate(()=>idbGetAll('proUebergaben')))===JSON.stringify(expected));
 for(const lang of ['en','ru','pl']){await page.evaluate(async lang=>{document.documentElement.lang=lang;await PBProVerbund.render();},lang);await page.waitForFunction(lang=>document.querySelector('#pro-verbund h4')?.textContent===({en:'Work with Pro apps',ru:'Совместная работа Pro-приложений',pl:'Współpraca aplikacji Pro'})[lang],lang);ok('Common-vault controls are localized: '+lang,!(await page.locator('#pro-verbund').innerText()).includes('Zusammenarbeit'));}
 await page.evaluate(async()=>{document.documentElement.lang='de';await PBProVerbund.render();PBNavigation.open(new File(['Erste Ansicht'],'Erste.txt',{type:'text/plain'}),{hash:'a'.repeat(64)});});await page.waitForFunction(()=>document.querySelector('.native-file-title').textContent==='Erste.txt');
 await page.evaluate(()=>PBNavigation.open(new File(['Zweite Ansicht'],'Zweite.txt',{type:'text/plain'}),{hash:'b'.repeat(64)}));await page.waitForFunction(()=>document.querySelector('.native-file-title').textContent==='Zweite.txt');await page.evaluate(()=>PBNavigation.back());await page.waitForFunction(()=>document.querySelector('.native-file-title').textContent==='Erste.txt');await page.locator('[data-pro-transfer]').click();
 ok('Back navigation offers the file actually displayed, not the last opened file',(await page.locator('dialog[open]').innerText()).includes('Erste.txt'));
 await page.evaluate(()=>{const api=Capacitor.Plugins.ProVault;window.previousState=api.tresorZustand;api.tresorZustand=async args=>{await new Promise(r=>window.continueTransfer=r);return previousState(args);};});
 await page.locator('dialog[open] button').filter({hasText:'Weitergeben'}).click();await page.waitForFunction(()=>window.continueTransfer);await page.keyboard.press('Escape');
 ok('In-flight transfer freezes its target and cannot dismiss the dialog',await page.locator('dialog[open] select').isDisabled()&&await page.locator('dialog[open] button').filter({hasText:'Abbrechen'}).isDisabled());
 await page.evaluate(()=>{document.querySelector('dialog select').value='workflow-pdf-pro';Capacitor.Plugins.ProVault.tresorZustand=previousState;continueTransfer();});
 await page.waitForFunction(()=>document.querySelector('dialog[open] p[role=status]')?.textContent.includes('Weitergegeben'));
 ok('Visible transfer uses the currently displayed file and offers Close',[...sent.values()].at(-1).name==='Erste.txt'&&[...sent.values()].at(-1).ziel==='familienakte'&&await page.locator('dialog[open] button').filter({hasText:'Schließen'}).count()===1);
 await page.locator('dialog[open] button').filter({hasText:'Schließen'}).click();
 await page.setViewportSize({width:320,height:800});
 ok('Pro transfer remains reachable in the narrow file viewer without page overflow',await page.locator('[data-pro-transfer]').isVisible()&&await page.evaluate(()=>{const r=document.querySelector('[data-pro-transfer]').getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&r.left>=0&&r.right<=innerWidth;}));
 ok('No source is falsely acknowledged or sent before its receipt commits',invalid.length===0);
 ok('No uncaught page errors in common-vault integration',errors.length===0);
 console.log(`${count} common-vault UI checks passed.`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
