// Missing originals (Klaus 2026-10-22: "woher soll der Nutzer wissen, welches die Originaldatei war?"):
// first from the mail-attachment folder by fingerprint, then one folder search for all missing ones.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0,failWrite=false,readCalls=0,sourceReads=[];const saved=new Map(),pending=new Map(),ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
let folder=[];
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
  if(method==='chooseSource')return {items:folder.map(({id,name,type,size,path})=>({id,name,type,size,path}))};
  if(method==='readSource'){sourceReads.push(args.id);const f=folder.find(x=>x.id===args.id);return{data:f.bytes.subarray(args.offset,args.offset+256*1024).toString('base64')};}
  if(method==='finishSource'||method==='state')return {ok:true,enabled:false,name:''};
  throw new Error('unknown native operation');
 });
 await page.addInitScript(()=>{const api={},fold={};for(const method of ['listOriginals','beginImport','appendImport','finishImport','abortImport','originalInfo','readOriginal','open'])api[method]=args=>window.nativeOriginal(method,args);for(const method of ['chooseSource','readSource','finishSource','state','chooseLibrary','pause','copyOriginal'])fold[method]=args=>window.nativeOriginal(method,args);window.Capacitor={Plugins:{ProFiles:api,ProFolders:fold}};});
 await page.goto(url);await page.waitForFunction(()=>window.PBOriginals&&window.PBNavigation&&typeof db!=='undefined'&&db);
 const A=Buffer.from('Rechnung Stadtwerke, 54,20 Euro, Zaehlerstand 1234'),B=Buffer.from('Einkaufsliste: Milch, Brot, Butter, Kaese'),C=Buffer.from('Angebot fuer neue Bremsscheiben vorne und hinten');
 await page.evaluate(async([a,b,c])=>{
   const add=async(name,path,text)=>{const bytes=new TextEncoder().encode(text);const r={hash:await sha256(bytes.buffer),name,path,type:'text/plain',ext:'txt',date:Date.now(),size:bytes.length,snippet:text,via:'test',vector:buildVector(tokens(text)),tf:termFreq(tokens(text)),summary:'',category:'',dirId:null,nameTokens:tokens(name),dupes:[],tags:[]};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);};
   await add('Stadtwerke.txt','Stadtwerke.txt',a);await add('Einkauf.txt','Einkauf.txt',b);await add('Angebot.txt','Mail-Anhang/Max Muster/Angebot.txt',c);
 },[A.toString(),B.toString(),C.toString()]);
 await page.reload();await page.waitForFunction(()=>window.PBOriginals&&CATALOG.length===3);
 // The attachment folder of the storage location holds Angebot.txt with the same fingerprint.
 await page.evaluate(c=>{const bytes=new TextEncoder().encode(c);window.PBVault=Object.assign(window.PBVault||{},{async findByHash(h){return h===CATALOG.find(r=>r.name==='Angebot.txt').hash?{name:'Angebot.txt',type:'text/plain',size:bytes.length}:null;},async bytes(){return bytes;}});},C.toString());
 await page.evaluate(()=>openFile(CATALOG.find(r=>r.name==='Angebot.txt').hash));
 await page.locator('.native-file-viewer').waitFor();
 ok('A missing original that is also a kept mail attachment comes back by itself, no question asked',saved.has(digest(C))&&await page.locator('.native-original-reconnect').count()===0);
 await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
 await page.evaluate(()=>openFile(CATALOG.find(r=>r.name==='Stadtwerke.txt').hash));
 const dlg=page.locator('.native-original-reconnect');await dlg.waitFor();
 ok('Otherwise the dialog names the file and where it came from',(await dlg.textContent()).includes('„Stadtwerke.txt“ ist im Katalog')&&(await dlg.textContent()).includes('Woher: Stadtwerke.txt'));
 ok('It offers to search a whole folder',await dlg.getByRole('button',{name:'📁 Ordner durchsuchen'}).isVisible());
 folder=[{id:'1',name:'Stadtwerke-Kopie.txt',type:'text/plain',size:A.length,path:'Download/Stadtwerke-Kopie.txt',bytes:A},{id:'2',name:'Einkauf.txt',type:'text/plain',size:B.length,path:'Download/Einkauf.txt',bytes:B},{id:'3',name:'Urlaub.jpg',type:'image/jpeg',size:999999,path:'Download/Urlaub.jpg',bytes:Buffer.alloc(10)}];
 await dlg.getByRole('button',{name:'📁 Ordner durchsuchen'}).click();
 await page.locator('.native-file-viewer').waitFor();
 ok('One folder search brings back every missing original found there, matched by fingerprint (also under another name)',saved.has(digest(A))&&saved.has(digest(B)));
 ok('Only files of a matching size are read',!sourceReads.includes('3'));
 ok('Then the file that was asked for opens',await page.locator('.native-file-viewer').isVisible());
 ok('Nothing else in the catalog changes',await page.evaluate(()=>CATALOG.length===3));
 await page.keyboard.press('Escape');
 await page.evaluate(()=>openFile(CATALOG.find(r=>r.name==='Einkauf.txt').hash));
 await page.locator('.native-file-viewer').waitFor();
 ok('The other found original opens without asking',await page.locator('.native-original-reconnect').count()===0);
 ok('No runtime errors',errors.length===0||console.log(errors));
 console.log(`${count} missing-original checks passed (simulated native storage and folder).`);
}finally{await browser?.close();server.close();}
