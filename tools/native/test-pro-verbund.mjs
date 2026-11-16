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
let vaultId='vault-a',open=true,chosen=true,unlocks=0,alerts=[],failRead='',badContract='',corruptRead='',failAck='',failSend=false,switchOnRead=false,backup,backupParts=[],failBegleit=false,sendCalls=0,reachable=true;
const add=(id,name,text,overrides={})=>{const bytes=Buffer.from(text);incoming.set(id,{entryId:id,bytes,vertrag:{vertrag:'familienakte-uebergabe/1',id,quelle:'familienakte',ziel:'private-brain',dokumentId:'doc-'+id,name,mime:'text/plain',groesse:bytes.length,sha256:digest(bytes),...overrides}});};
add('first','Brief.txt','Erfundener Brief zur privaten Ablage');
let browser,page,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('PASS '+name);count++;};
try{
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 page=await browser.newPage({viewport:{width:412,height:850}});const url=`http://127.0.0.1:${server.address().port}/`,errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{alerts.push(d.message());d.accept();});
 await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
 await page.exposeFunction('proFixture',async(method,args={})=>{
  if(method==='state')return{configured:true,unlocked:true,location:'device',reachable:true};
  if(method==='tresorZustand')return{uebergaben:true,gewaehlt:chosen,offen:chosen&&open&&reachable,erreichbar:reachable,kennung:vaultId,ordner:'Erfundener gemeinsamer Ordner',eingezogen:false};
  if(method==='tresorEinziehen'){assert.equal(args.nurVerbinden,true);assert.ok(!('password' in args));open=true;unlocks++;return{offen:true};}
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
    sendCalls++;if(failSend||failBegleit&&m.name==='familienakte-uebergabe.json')throw Error('removed disk');const bytes=saved.get(m.sha256)?.bytes;
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
 // Mail an die Familienakte (Klaus 2026-11-09): die unveränderte .eml mit Anhang über den gemeinsamen Pro-Tresor.
 await page.setViewportSize({width:412,height:850});
 const pdf=Buffer.from('%PDF-1.4\n% Erfundene Rechnung\n%%EOF\n'),eml=Buffer.from('From: Erfundener Absender <absender@example.invalid>\r\nTo: nutzer@example.invalid\r\nSubject: =?UTF-8?Q?Rechnung_M=C3=A4rz?=\r\nMessage-ID: <rechnung@example.invalid>\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="b1"\r\n\r\n--b1\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nAnbei die Rechnung.\r\n--b1\r\nContent-Type: application/pdf; name="Rechnung.pdf"\r\nContent-Disposition: attachment; filename="Rechnung.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\n'+pdf.toString('base64')+'\r\n--b1--\r\n');
 await page.evaluate(b64=>{window.mailDeviceCalls=[];window.PBMailDevice={base:'android:private-brain-pro',text:()=>null,
  async original(args){mailDeviceCalls.push({method:'original',args});return{sourceBase64:window.bigMail||b64,groesse:0};},
  async openOriginal(args){mailDeviceCalls.push({method:'openOriginal',args});return{ok:true};}};},eml.toString('base64'));
 const ref={account:'konto-1',folder:'INBOX',validity:'77',uid:5},calls=()=>page.evaluate(()=>mailDeviceCalls),lastSent=()=>[...sent.values()].at(-1);
 // Vorsortierung (Klaus 16.11.2026): nach jeder Mail folgt ihre Begleitdatei als eigene Übergabe; Zuordnung über „bezug“.
 const mails=()=>[...sent.values()].filter(m=>m.mime==='message/rfc822'),lastMail=()=>mails().at(-1),companions=()=>[...sent.values()].filter(m=>m.name==='familienakte-uebergabe.json');
 const companionOf=m=>{const c=companions().filter(c=>c.bezug===m.id);return c.length===1?{vertrag:c[0],daten:JSON.parse(saved.get(c[0].sha256).bytes.toString())}:null;};
 const before=mails().length;await page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Rechnung März.eml'}),ref);
 ok('Open Pro vault: the raw .eml with its PDF attachment goes to Familienakte through the canonical handover',mails().length===before+1&&lastMail().ziel==='familienakte'&&lastMail().mime==='message/rfc822'&&lastMail().name==='Rechnung März.eml'&&lastMail().sha256===digest(eml)&&saved.get(digest(eml))?.bytes.equals(eml)&&saved.get(digest(eml)).bytes.includes(pdf.toString('base64')));
 ok('The .eml is fetched by account, folder, UIDVALIDITY and UID and nothing is shared outside',(await calls()).some(c=>c.method==='original'&&c.args.uid===5&&c.args.validity==='77')&&!(await calls()).some(c=>c.method==='openOriginal')&&/Familienakte weitergegeben/.test(alerts.at(-1)));
 const first=companionOf(lastMail());
 ok('After the mail its pre-sorting follows as a second handover in the same inbox: exact name, JSON, one entry bound to the .eml by name and SHA-256',Boolean(first)&&first.vertrag.ziel==='familienakte'&&first.vertrag.mime==='application/json'&&first.daten.vertrag==='familienakte-uebergabe/1'&&first.daten.dateien.length===1&&first.daten.dateien[0].name==='Rechnung März.eml'&&first.daten.dateien[0].sha256===digest(eml)&&[...sent.keys()].indexOf(first.vertrag.id)>[...sent.keys()].indexOf(lastMail().id));
 ok('The companion carries the classification of the sort core for this mail, and the message says that it went along',first.daten.dateien[0].vorgang.startsWith('E-Mail')&&Boolean(first.daten.dateien[0].lebensbereich||first.daten.dateien[0].dokumentart||first.daten.dateien[0].hinweis)&&/Vorsortierung/.test(alerts.at(-1)));
 ok('The companion names the handover of its mail in "bezug"',first.vertrag.bezug===lastMail().id&&first.vertrag.bezug!==first.vertrag.id);
 // Absprache mit der Familienakte-Seite (16.11.2026): Name = Manifest-Name der Mail, sha256 = 64 kleine Hex-Zeichen über genau
 // die .eml-Bytes, mindestens ein gefülltes Feld in den Grenzen, eigene Übergabekennung (nicht die der Mail).
 const brauchbar=c=>{const e=c.daten.dateien[0],m=mails().find(m=>m.id===c.vertrag.bezug),felder=['lebensbereich','dokumentart','vorgang','hinweis'].filter(k=>e[k]!==undefined);
  return e.name===m.name&&/^[a-f0-9]{64}$/.test(e.sha256)&&e.sha256===m.sha256&&e.sha256===digest(saved.get(m.sha256).bytes)&&felder.some(k=>e[k].length>0)&&felder.every(k=>typeof e[k]==='string'&&e[k].length<=(k==='hinweis'?1000:100)&&!/[\u0000-\u001f\u007f]/.test(e[k]))&&c.vertrag.id!==m.id&&/^[A-Za-z0-9_.-]{1,160}$/.test(c.vertrag.id)&&!mails().some(x=>x.id===c.vertrag.id);};
 ok('The companion keeps the agreement with Familienakte: manifest name, SHA-256 of exactly the .eml bytes, a filled field within the limits, its own handover identifier',brauchbar(first));
 await page.evaluate(()=>{mailDeviceCalls.length=0;});const other=Buffer.from(eml.toString().replace('Anbei die Rechnung.','Anbei die korrigierte Rechnung.'));
 await page.evaluate(({ref,b64})=>PBProVerbund.mailAnFamilienakte(ref,{name:'Korrektur',sourceBase64:b64}),{ref,b64:other.toString('base64')});
 ok('An already loaded complete source is used without a second download',lastMail().sha256===digest(other)&&lastMail().name==='Korrektur.eml'&&!(await calls()).length);
 chosen=false;await page.evaluate(()=>{mailDeviceCalls.length=0;});let count0=sent.size;await page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Rechnung März.eml'}),ref);
 ok('Without a connected Pro vault one short line says so and the system chooser gets the .eml',sent.size===count0&&/normal geteilt/.test(alerts.at(-1))&&(await calls()).some(c=>c.method==='openOriginal'&&c.args.uid===5&&c.args.name==='Rechnung März.eml'));
 chosen=true;open=false;await page.evaluate(()=>{mailDeviceCalls.length=0;});
 const ask=async wahl=>{const b=page.locator('dialog[open][data-mail-familienakte-frage] [data-wahl='+wahl+']');const asked=await b.waitFor({timeout:5000}).then(()=>true,()=>false);if(asked)await b.click();return asked;};
 let waiting=page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Gesperrt.eml'}),ref);let asked=await ask('teilen');await waiting;
 ok('Locked Pro vault asks first; "share normally" sends nothing through the vault',asked&&sent.size===count0&&!open&&(await calls()).some(c=>c.method==='openOriginal'&&c.args.name==='Gesperrt.eml'));
 open=false;waiting=page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Gesperrt.eml'}),ref);asked=await ask('entsperren');await waiting;
 ok('Locked Pro vault: "unlock and pass on" opens it without a password field and hands the .eml over',asked&&open&&unlocks>0&&lastMail().name==='Gesperrt.eml'&&lastMail().sha256===digest(eml));
 await page.evaluate(()=>{window.bigMail=btoa('x'.repeat(20*1024*1024+1));});count0=sent.size;await page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Riesig.eml'}),ref);
 ok('A mail over 20 MiB is refused with a clear message and nothing is sent',sent.size===count0&&/20 MiB/.test(alerts.at(-1)));
 await page.evaluate(()=>{delete window.bigMail;});
 const variant=word=>Buffer.from(eml.toString().replace('Anbei die Rechnung.','Anbei die '+word+' Rechnung.')),hand=(r,name,bytes,extra={})=>page.evaluate(({r,name,b64,extra})=>PBProVerbund.mailAnFamilienakte(r,{name,sourceBase64:b64,...extra}),{r,name,b64:bytes.toString('base64'),extra});
 failBegleit=true;count0=mails().length;let res=await hand(ref,'Dritte',variant('dritte'));failBegleit=false;
 ok('If only the companion fails the mail still counts as handed over and the message says "Mail übergeben, Vorsortierung nicht"',mails().length===count0+1&&lastMail().sha256===digest(variant('dritte'))&&!companionOf(lastMail())&&res.ergebnis==='uebergeben'&&res.begleit==='nein'&&/Mail übergeben, Vorsortierung nicht/.test(alerts.at(-1)));
 await page.evaluate(()=>{window.realKern=window.PBSortierkern;window.PBSortierkern={felder:()=>({v:'probe',art:'',bereich:'',absender:'',frist:'',person:'',betrag:'',datum:''})};});
 count0=sent.size;res=await hand(ref,'Vierte',variant('vierte'));await page.evaluate(()=>{window.PBSortierkern=realKern;});
 ok('A mail without any classification gets no companion file',sent.size===count0+1&&lastSent().mime==='message/rfc822'&&res.ergebnis==='uebergeben'&&res.begleit==='keine'&&/Familienakte weitergegeben/.test(alerts.at(-1))&&!/Vorsortierung/.test(alerts.at(-1)));
 const ref2={...ref,uid:6};
 await page.evaluate(ref2=>{CATALOG.push({hash:'d'.repeat(64),name:'Abschlag',type:'message/rfc822',ext:'eml',mailBody:'Abschlag',mail:{from:'Stadtwerke <a@example.invalid>',to:'',subject:'Abschlag',date:''},mailRemote:{base:'android:private-brain-pro',...ref2},eigeneKategorie:'Abos',kern:{v:PBSortierkern.fassung,art:'Rechnung',artSicher:true,bereich:'Haus & Wohnung',absender:'Stadtwerke Beispielstadt',frist:'2026-12-01'},tags:[],dupes:[]});},ref2);
 await hand(ref2,'Abschlag',variant('fünfte'));const own=companionOf(lastMail());
 ok('A catalogued mail hands over its stored classification and its own category',Boolean(own)&&lastMail().dokumentId==='d'.repeat(64)&&own.daten.dateien[0].lebensbereich==='Haus & Wohnung'&&own.daten.dateien[0].dokumentart==='Rechnung'&&own.daten.dateien[0].vorgang==='E-Mail › Abos'&&/Frist: 2026-12-01/.test(own.daten.dateien[0].hinweis)&&own.daten.dateien[0].name==='Abschlag.eml');
 // Mail-Liste: ohne Meldungen, nie doppelt, erst nach der Anhang-Prüfung, Tresor einmal fragen.
 await page.evaluate(()=>{window.pruefAufrufe=0;});
 const quiet=(bytes,geprueft)=>page.evaluate(({ref,b64,geprueft})=>PBProVerbund.mailAnFamilienakte(ref,{name:'Sechste',sourceBase64:b64,still:true,pruefen:async()=>{pruefAufrufe++;return geprueft;}}),{ref,b64:bytes.toString('base64'),geprueft});
 let alerts0=alerts.length,sends0=sendCalls;count0=sent.size;res=await quiet(variant('sechste'),false);
 ok('List mode: a mail whose attachments are not checked is not handed over',res.ergebnis==='fehler'&&res.grund==='ungeprueft'&&sendCalls===sends0&&sent.size===count0&&!(await out()).some(r=>r.vertrag.sha256===digest(variant('sechste'))));
 res=await quiet(variant('sechste'),true);
 ok('List mode hands the mail and its companion over without any dialog',res.ergebnis==='uebergeben'&&res.begleit==='ja'&&lastMail().sha256===digest(variant('sechste'))&&Boolean(companionOf(lastMail()))&&alerts.length===alerts0&&await page.evaluate(()=>pruefAufrufe)===2);
 sends0=sendCalls;count0=sent.size;res=await quiet(variant('sechste'),true);
 ok('List mode never sends twice: what the outbox knows as handed over is skipped, reported and not checked again',res.ergebnis==='schon'&&sendCalls===sends0&&sent.size===count0&&await page.evaluate(()=>pruefAufrufe)===2);
 open=false;res=await Promise.race([quiet(variant('siebte'),true),new Promise(r=>setTimeout(()=>r({ergebnis:'wartet'}),5000))]);
 ok('List mode with a locked vault sends nothing and asks nothing per mail',res.ergebnis==='fehler'&&res.grund==='gesperrt'&&sent.size===count0&&await page.locator('dialog[open]').count()===0&&alerts.length===alerts0);
 const tresor=await page.evaluate(()=>PBProVerbund.familienakteTresor());
 waiting=page.evaluate(()=>PBProVerbund.familienakteOeffnen());await page.locator('dialog[open][data-mail-familienakte-frage] [data-wahl=entsperren]').waitFor({timeout:5000});
 const choices=await page.locator('dialog[open][data-mail-familienakte-frage] [data-wahl]').evaluateAll(n=>n.map(b=>b.dataset.wahl));asked=await ask('entsperren');
 ok('For several mails the locked vault is asked once, with unlock or cancel only',tresor.vorhanden===true&&tresor.offen===false&&JSON.stringify(choices)==='["entsperren",""]'&&asked&&await waiting===true&&open);
 chosen=false;const none=await page.evaluate(async()=>({t:await PBProVerbund.familienakteTresor(),o:await PBProVerbund.familienakteOeffnen()}));chosen=true;
 ok('Without a Pro vault the list has nothing to offer and nothing is asked',none.t.vorhanden===false&&none.o===false&&await page.locator('dialog[open]').count()===0);
 // Datei-Fenster: ein katalogisierter Mail-Eintrag zeigt Text, weitergegeben wird an die Familienakte die echte .eml.
 await page.evaluate(ref=>{const r={hash:'c'.repeat(64),name:'Rechnung Mai',type:'message/rfc822',ext:'eml',mailBody:'Anbei die Rechnung.',mail:{from:'absender@example.invalid',to:'',subject:'Rechnung Mai',date:''},mailRemote:{base:'android:private-brain-pro',...ref},tags:[],dupes:[]};CATALOG.push(r);
  PBNavigation.open(new File(['Betreff: Rechnung Mai\n\nAnbei die Rechnung.'],'Rechnung Mai.txt',{type:'text/plain'}),r);},ref);
 await page.waitForFunction(()=>document.querySelector('.native-file-title')?.textContent==='Rechnung Mai');await page.locator('[data-pro-transfer]').click();
 count0=sent.size;await page.locator('dialog[open] select').selectOption('familienakte');await page.locator('dialog[open] button').filter({hasText:'Weitergeben'}).click();
 await page.waitForFunction(()=>document.querySelector('dialog[open] p[role=status]')?.textContent.includes('Weitergegeben'));
 ok('File viewer: "To Pro app" sends a catalogued mail to Familienakte as the raw .eml, not as .txt',sent.size===count0+1&&lastSent().name==='Rechnung Mai.eml'&&lastSent().mime==='message/rfc822'&&lastSent().sha256===digest(eml)&&lastSent().dokumentId==='c'.repeat(64));
 await page.locator('dialog[open] button').filter({hasText:'Schließen'}).click();
 // Generalprüfung 16.11.2026: Tresor gewählt, Ordner gerade nicht erreichbar (z. B. SD-Karte heraus) – richtiger Satz, erst fragen.
 reachable=false;await page.evaluate(()=>{mailDeviceCalls.length=0;});count0=sent.size;let alertsAway=alerts.length;
 const awayDialog=page.locator('dialog[open][data-mail-familienakte-frage=unerreichbar]');
 waiting=page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Karte heraus.eml'}),ref);
 const awayShown=await awayDialog.waitFor({timeout:5000}).then(()=>true,()=>false);
 const away=awayShown?{text:await awayDialog.locator('p').textContent(),choices:await awayDialog.locator('[data-wahl]').evaluateAll(n=>n.map(b=>b.dataset.wahl)),shared:(await calls()).some(c=>c.method==='openOriginal')}:{};
 if(awayShown)await awayDialog.locator('[data-wahl=""]').click();
 let awayResult=await waiting;
 ok('Vault chosen but its folder cannot be reached: the opened mail says "nicht erreichbar", not "Kein Pro-Tresor verbunden"',awayShown&&/gerade nicht erreichbar/.test(away.text)&&/Nichts wurde übergeben/.test(away.text)&&!alerts.slice(alertsAway).some(a=>/Kein Pro-Tresor/.test(a)));
 ok('It asks first with "Normal teilen" or "Abbrechen"; nothing goes to the system chooser without a choice, and cancel shares nothing',JSON.stringify(away.choices)==='["teilen",""]'&&away.shared===false&&awayResult?.abgebrochen===true&&!(await calls()).some(c=>c.method==='openOriginal')&&sent.size===count0&&alerts.length===alertsAway);
 waiting=page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Karte heraus.eml'}),ref);asked=await awayDialog.locator('[data-wahl=teilen]').waitFor({timeout:5000}).then(()=>true,()=>false);if(asked)await awayDialog.locator('[data-wahl=teilen]').click();await waiting;
 ok('"Normal teilen" then hands the .eml to the system chooser as before; nothing goes through the vault',asked&&(await calls()).filter(c=>c.method==='openOriginal'&&c.args.name==='Karte heraus.eml').length===1&&sent.size===count0);
 await page.evaluate(()=>{document.documentElement.lang='en';});
 waiting=page.evaluate(ref=>PBProVerbund.mailAnFamilienakte(ref,{name:'Karte heraus.eml'}),ref);await awayDialog.waitFor({timeout:5000});
 ok('The question follows the language',/cannot be reached right now/.test(await awayDialog.locator('p').textContent()));
 await awayDialog.locator('[data-wahl=""]').click();await waiting;await page.evaluate(()=>{document.documentElement.lang='de';});
 reachable=true;open=true;
 // Generalprüfung 16.11.2026: Liste „Ausgang“ – die Begleitdatei der Vorsortierung ist keine eigene Zeile mehr.
 await page.evaluate(()=>PBProVerbund.render());
 const outbox=()=>page.evaluate(async()=>{await PBProVerbund.render();const rows=[...document.querySelectorAll('#pro-verbund ul li')];const all=(await PBProVerbund.receipts()).filter(r=>r.kind==='ausgang');
  return {rows:rows.map(li=>({text:[...li.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join(''),mit:li.dataset.proMitSortierung||'',buttons:li.querySelectorAll('button').length})),
   receipts:all.length,companions:all.filter(r=>r.vertrag.name==='familienakte-uebergabe.json').length};});
 let box=await outbox();
 ok('The outbox list no longer shows the technical companion file "familienakte-uebergabe.json" as a row of its own',box.companions>=4&&box.rows.length===box.receipts-box.companions&&!box.rows.some(r=>r.text.includes('familienakte-uebergabe.json')));
 ok('Its mail says "mit Vorsortierung" instead – one row per mail',box.rows.filter(r=>r.mit==='1'&&/\.eml \(mit Vorsortierung\) → Familienakte Pro: /.test(r.text)).length===box.companions&&box.rows.filter(r=>!r.mit).every(r=>!r.text.includes('Vorsortierung')));
 ok('Every row that is not yet accepted keeps exactly one "Erneut weitergeben"',box.rows.every(r=>r.buttons<=1)&&box.rows.filter(r=>/Übernahme offen|Noch offen/.test(r.text)).every(r=>r.buttons===1)&&box.rows.some(r=>r.buttons===1));
 const againMail=mails().find(m=>companions().some(c=>c.bezug===m.id)),againName=againMail.name;sends0=sendCalls;const sentLog=[];const realSet=sent.set.bind(sent);sent.set=(k,v)=>{sentLog.push(v.name);return realSet(k,v);};
 await page.evaluate(name=>{[...document.querySelectorAll('#pro-verbund ul li[data-pro-mit-sortierung]')].find(li=>li.textContent.startsWith(name+' ')).querySelector('button').click();},againName);
 await page.waitForFunction(()=>!document.querySelector('#pro-verbund button:disabled'));await new Promise(r=>setTimeout(r,300));sent.set=realSet;
 ok('"Erneut weitergeben" at the mail still works and passes on both: the mail and its pre-sorting',sendCalls===sends0+2&&JSON.stringify(sentLog)===JSON.stringify([againName,'familienakte-uebergabe.json']));
 targetMarks.add('entry-'+againMail.id);await page.evaluate(()=>PBProVerbund.confirm());box=await outbox();
 ok('When the target app has taken the mail but not yet its pre-sorting, "Erneut weitergeben" stays for the pre-sorting alone',await page.evaluate(name=>{const li=[...document.querySelectorAll('#pro-verbund ul li[data-pro-mit-sortierung]')].find(li=>li.textContent.startsWith(name+' '));return li.textContent.includes('Im Eingang der Ziel-App')&&li.querySelectorAll('button').length===1;},againName));
 sends0=sendCalls;sentLog.length=0;sent.set=(k,v)=>{sentLog.push(v.name);return realSet(k,v);};
 await page.evaluate(name=>{[...document.querySelectorAll('#pro-verbund ul li[data-pro-mit-sortierung]')].find(li=>li.textContent.startsWith(name+' ')).querySelector('button').click();},againName);
 await page.waitForFunction(()=>!document.querySelector('#pro-verbund button:disabled'));await new Promise(r=>setTimeout(r,300));sent.set=realSet;
 ok('Then only the pre-sorting is passed on again, not the accepted mail',sendCalls===sends0+1&&JSON.stringify(sentLog)===JSON.stringify(['familienakte-uebergabe.json']));
 await page.evaluate(()=>{document.documentElement.lang='en';});await page.evaluate(()=>PBProVerbund.render());
 ok('The addition follows the language',await page.evaluate(()=>[...document.querySelectorAll('#pro-verbund ul li[data-pro-mit-sortierung]')].every(li=>li.textContent.includes('(with pre-sorting)'))));
 await page.evaluate(()=>{document.documentElement.lang='de';});await page.evaluate(()=>PBProVerbund.render());
 ok('Every companion sent in this run keeps the agreement, and each belongs to exactly one mail',companions().length>=4&&companions().every(c=>mails().filter(m=>m.id===c.bezug).length===1&&brauchbar(companionOf(mails().find(m=>m.id===c.bezug))))&&new Set(companions().map(c=>c.id)).size===companions().length);
 ok('No source is falsely acknowledged or sent before its receipt commits',invalid.length===0);
 ok('No uncaught page errors in common-vault integration',errors.length===0);
 console.log(`${count} common-vault UI checks passed.`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
