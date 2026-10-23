// Echte IndexedDB: Abbruch NACH erfolgreicher Anfrage darf keinen Erfolg melden.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_TEST_ROOT||'.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const file=resolve(root,'.'+pathname.replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(await readFile(pathname==='/index.html'||pathname==='/' ? process.env.PB_TEST_INDEX||file : file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage();
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.waitForFunction(()=>typeof db!=='undefined'&&db&&typeof importMerge==='function');
 await page.evaluate(()=>{
  window.abortNext=(method)=>{
   const old=IDBObjectStore.prototype[method];
   IDBObjectStore.prototype[method]=function(...args){
    const r=old.apply(this,args);
    if(this.name==='catalog'){
     IDBObjectStore.prototype[method]=old;
     r.addEventListener('success',()=>this.transaction.abort(),{once:true});
    }
    return r;
   };
  };
 });
 const put=await page.evaluate(async()=>{
  abortNext('put');let rejected=false;
  try{await idbPut('catalog',{hash:'aborted',name:'Darf nicht gespeichert sein'});}catch{rejected=true;}
  return{rejected,stored:await idbGet('catalog','aborted')};
 });
 assert.ok(put.rejected,'Abgebrochene Transaktion darf nach erfolgreicher put-Anfrage keinen Erfolg melden');
 assert.equal(put.stored,undefined);
 await page.evaluate(async()=>{
  const rec={hash:'existing',name:'Vorhanden',tags:['original'],dupes:[],vector:buildVector(tokens('Vorhanden')),tf:termFreq(tokens('Vorhanden'))};
  await idbPut('catalog',rec);CATALOG.push(rec);HASHSET.add(rec.hash);
 });
 for(const [method,call] of [['delete','idbDelete'],['clear','idbClear']]){
  const result=await page.evaluate(async({method,call})=>{
   abortNext(method);let rejected=false;
   try{await window[call]('catalog','existing');}catch{rejected=true;}
   return{rejected,stored:!!await idbGet('catalog','existing')};
  },{method,call});
  assert.ok(result.rejected&&result.stored,'Abgebrochenes '+method+' bewahrt den gespeicherten Datensatz und meldet Fehler');
 }
 for(const entry of [{hash:'new',name:'Neu',tags:[]},{hash:'existing',name:'Vorhanden',tags:['uncommitted']}]){
  const result=await page.evaluate(async entry=>{
   abortNext('put');await importMerge(new File([JSON.stringify({catalog:[entry]})],'katalog.json'));
   return{memory:CATALOG.map(r=>({hash:r.hash,tags:r.tags})),stored:await idbGetAll('catalog'),indexed:HASHSET.has('new')};
  },entry);
  assert.deepEqual(result.memory,[{hash:'existing',tags:['original']}],'Fehlgeschlagener Import darf den Arbeitsspeicher nicht verändern');
  assert.equal(result.stored.length,1);assert.equal(result.indexed,false);
 }
 await page.evaluate(async()=>importMerge(new File([JSON.stringify({catalog:[{hash:'new',name:'Neu',tags:['gesichert']}]})],'katalog.json')));
 await page.reload();await page.waitForFunction(()=>typeof CATALOG!=='undefined'&&CATALOG.length===2);
 assert.ok(await page.evaluate(()=>CATALOG.some(r=>r.hash==='new'&&r.tags.includes('gesichert'))),'Wiederholung wird gespeichert und übersteht Neustart');
 console.log('6 Speicher-Gegenproben bestanden: put/delete/clear-Abbruch, neuer Import, Ergänzung, Wiederholung mit Neustart.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
