// Shared into Private Brain Pro: files from Android's share sheet reach the normal import (ProShare simulated).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const big='x'.repeat(300*1024);   // larger than one 256 KiB chunk
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:360,height:780}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(big=>{
    const enc=s=>btoa(unescape(encodeURIComponent(s)));
    const files={a:{id:'a',name:'Rechnung Zahnarzt.txt',mime:'text/plain',text:'Rechnung vom Zahnarzt über 120 Euro'},
      b:{id:'b',name:'Langer Bericht.txt',mime:'text/plain',text:big},
      c:{id:'c',name:'Riesig.bin',mime:'application/octet-stream',text:'',size:90*1024*1024}};
    window.shareCalls={pending:0,read:[],done:[]};window.shareListeners=[];
    window.shareQueue=[['a','b','c'],0];
    window.Capacitor={Plugins:{ProShare:{
      async pending(){shareCalls.pending++;const [ids,refused]=shareQueue;shareQueue=[[],0];
        return{items:ids.map(id=>{const f=files[id];return{id,name:f.name,mime:f.mime,size:f.size??new TextEncoder().encode(f.text).length};}),refused};},
      async read({id,offset}){shareCalls.read.push([id,offset]);const all=new TextEncoder().encode(files[id].text),part=all.slice(offset,offset+256*1024);
        if(id==='f'&&!window.lateShareRead){window.lateShareRead=true;signing=true;}
        let s='';for(const b of part)s+=String.fromCharCode(b);return{data:btoa(s)};},
      async done({id}){shareCalls.done.push(id);},
      addListener(name,fn){shareListeners.push([name,fn]);return{remove(){}};}
    }}};
    window.shareSecond=()=>{files.d={id:'d',name:'Zweite Freigabe.txt',mime:'text/plain',text:'Zweiter Text aus einer anderen App'};shareQueue=[['d'],1];for(const [n,fn] of shareListeners)if(n==='shared')fn({added:1,refused:1});};
    window.shareBusy=id=>{files[id]={id,name:'Während Import '+id+'.txt',mime:'text/plain',text:'A shared file must wait for the current import '+id};shareQueue=[[id],0];for(const [n,fn]of shareListeners)if(n==='shared')fn({added:1});};
    void enc;
  },big);
  await page.goto(url);
  await page.waitForFunction(()=>typeof CATALOG!=='undefined'&&CATALOG.length===2&&!signing&&shareCalls.done.length===3,null,{timeout:30000});
  ok('Two shared files arrive in the catalog through the normal import',await page.evaluate(()=>CATALOG.map(r=>r.name||r.path).sort().join('|')).then(t=>t.includes('Langer Bericht.txt')&&t.includes('Rechnung Zahnarzt.txt')));
  ok('A file above one chunk is read in several pieces and arrives complete',await page.evaluate(n=>shareCalls.read.filter(([id])=>id==='b').length>=2&&CATALOG.some(r=>(r.name||r.path)==='Langer Bericht.txt'&&r.size===n),big.length));
  ok('A file above 80 MB is not read and not added',await page.evaluate(()=>!shareCalls.read.some(([id])=>id==='c')&&!CATALOG.some(r=>(r.name||r.path)==='Riesig.bin')));
  ok('Every shared file is released from the native inbox afterwards, the refused one too',await page.evaluate(()=>shareCalls.done.slice().sort().join(',')==='a,b,c'));
  ok('The app switches to "Dateien hinzufügen" so the import is visible',await page.evaluate(()=>document.querySelector('.tab.on')?.dataset.tab==='intake'));
  await page.evaluate(()=>{window.toasts=[];new MutationObserver(()=>toasts.push(document.querySelector('#toast').textContent)).observe(document.querySelector('#toast'),{childList:true,characterData:true,subtree:true});shareSecond();});
  await page.waitForFunction(()=>CATALOG.length===3&&!signing&&shareCalls.done.includes('d'));
  ok('A second share while the app is open arrives too',await page.evaluate(()=>CATALOG.some(r=>(r.name||r.path)==='Zweite Freigabe.txt')));
  ok('A share that did not arrive is reported plainly',await page.evaluate(()=>toasts.some(t=>t.includes('1 geteilte Datei(en) eingelesen.')&&t.includes('kam nicht an'))));
  await page.evaluate(()=>{signing=true;shareBusy('e');});await page.waitForTimeout(250);
  ok('A shared file is not discarded while another import is already running',await page.evaluate(()=>!shareCalls.done.includes('e')));
  await page.evaluate(()=>{signing=false;});await page.waitForFunction(()=>shareCalls.done.includes('e')&&!signing);
  ok('The queued file enters the real import after the earlier import ends',await page.evaluate(()=>CATALOG.some(r=>r.name==='Während Import e.txt')));
  await page.evaluate(()=>shareBusy('f'));await page.waitForFunction(()=>window.lateShareRead);await page.waitForTimeout(250);
  ok('Starting another import while shared bytes are read does not discard the incoming file',await page.evaluate(()=>!shareCalls.done.includes('f')));
  await page.evaluate(()=>{signing=false;});await page.waitForFunction(()=>shareCalls.done.includes('f')&&!signing);
  ok('The file read during a busy interval is eventually imported once',await page.evaluate(()=>CATALOG.filter(r=>r.name==='Während Import f.txt').length===1));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} share checks passed (Android share sheet simulated; real apps tested on the device).`);
}finally{await browser?.close();server.close();}
