// The import bar moves inside one file (copy in chunks, reading, signing), not only when the file is done.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:360,height:780}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{
    const slow=()=>new Promise(r=>setTimeout(r,120));let n=0;
    window.Capacitor={Plugins:{ProFiles:{
      async listOriginals(){return{items:[]};},async beginImport(){return{ticket:String(++n)};},
      async appendImport(){await slow();return{ok:true};},async finishImport(){return{ok:true};},async abortImport(){return{ok:true};},
      async originalInfo(){return{missing:true};},async readOriginal(){return{data:''};},async open(){return{ok:true};}}}};
    window.barSeen=[];window.stepSeen=[];
    const watch=()=>{const f=document.getElementById('barFill'),c=document.getElementById('progCur');if(!f||!c)return setTimeout(watch,50);
      new MutationObserver(()=>{barSeen.push(parseFloat(f.style.width)||0);stepSeen.push(c.textContent);}).observe(f,{attributes:true,attributeFilter:['style']});
      new MutationObserver(()=>stepSeen.push(c.textContent)).observe(c,{childList:true,characterData:true,subtree:true});};
    document.addEventListener('DOMContentLoaded',watch);
    // Klaus 2026-11-16 (V8): the shared loading line under the header names the import with count and percent, on every page.
    window.lineSeen=[];document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{const r=document.getElementById('pb-activity');if(r&&!r.hidden&&r.textContent&&lineSeen.at(-1)!==r.textContent)lineSeen.push(r.textContent);}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true}));
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBOriginals&&typeof signBatch==='function');
  const text='Ein langer Bericht über die Heizung. '.repeat(40000);   // about 1.4 MB, six chunks of 256 KiB
  await page.setInputFiles('#fileInput',{name:'Heizung.txt',mimeType:'text/plain',buffer:Buffer.from(text)});
  await page.waitForFunction(()=>CATALOG.length===1&&!signing,null,{timeout:30000});
  const seen=await page.evaluate(()=>({bar:barSeen,steps:stepSeen}));
  const between=seen.bar.filter(v=>v>0&&v<100);
  ok('With one file the bar shows several steps between 0 and 100 %',new Set(between.map(v=>Math.round(v))).size>=4||console.log(seen.bar));
  ok('The bar only moves forward',seen.bar.every((v,i)=>i===0||v>=seen.bar[i-1]||v===0)||console.log(seen.bar));
  ok('The bar ends at 100 %',seen.bar[seen.bar.length-1]===100);
  ok('The step is named: copy, reading, signing',['Kopie wird abgelegt','Text wird gelesen','wird signiert'].every(w=>seen.steps.some(s=>s.includes('Heizung.txt · '+w)))||console.log([...new Set(seen.steps)]));
  const lines=await page.evaluate(()=>lineSeen);
  ok('The shared loading line names the import with the count, the file and a rising percentage',lines.some(l=>/0 von 1 Dateien gelesen · Heizung\.txt/.test(l)&&/\d+ %/.test(l))&&new Set(lines.map(l=>(l.match(/(\d+) %/)||[])[1]).filter(Boolean)).size>=3||console.log(lines.slice(0,8)));
  ok('The shared loading line is gone after the import',await page.evaluate(()=>{const r=document.getElementById('pb-activity');return !r||r.hidden;}));
  ok('No step hook is left behind after the import',await page.evaluate(()=>window.PBImportStep===undefined));
  // Generalprüfung 16.11.2026: Dateien, die während eines laufenden Einlesens gewählt werden, verschwanden ohne Meldung.
  // Jetzt warten sie sichtbar („wartet“) und werden nach dem laufenden Lauf eingelesen.
  const big=n=>Buffer.from(('Bericht Nummer '+n+' über das Dach. ').repeat(40000));
  const rows=()=>page.evaluate(()=>[...document.querySelectorAll('#recentList>li')].map(li=>li.querySelector('.ra-name').textContent+'='+li.dataset.state+'='+li.querySelector('.ra-tag').textContent));
  await page.setInputFiles('#fileInput',{name:'lauf-1.txt',mimeType:'text/plain',buffer:big(1)});
  await page.waitForFunction(()=>signing);await page.waitForTimeout(200);
  ok('While one file is being read the file button stays usable',await page.evaluate(()=>signing&&!document.getElementById('pickFiles').disabled));
  await page.setInputFiles('#fileInput',[{name:'spaeter-1.txt',mimeType:'text/plain',buffer:Buffer.from('Notiz eins über den Garten.')},{name:'spaeter-2.txt',mimeType:'text/plain',buffer:Buffer.from('Notiz zwei über den Keller.')}]);
  await page.waitForTimeout(150);
  let list=await rows();
  ok('Files chosen during a running import are listed at once as „wartet“',await page.evaluate(()=>signing)&&list.includes('spaeter-1.txt=wait=wartet')&&list.includes('spaeter-2.txt=wait=wartet')&&list.some(r=>r.startsWith('lauf-1.txt=reading='))||console.log(list));
  await page.waitForFunction(()=>!signing&&CATALOG.length===4,null,{timeout:30000}).catch(()=>{});
  list=await rows();
  ok('After the running import they are read by themselves: all in the catalogue and marked „eingelesen“',await page.evaluate(()=>!signing&&CATALOG.length===4&&['lauf-1.txt','spaeter-1.txt','spaeter-2.txt'].every(n=>CATALOG.some(r=>r.name===n)))
    &&['lauf-1.txt','spaeter-1.txt','spaeter-2.txt'].every(n=>list.includes(n+'=done=eingelesen'))||console.log(list,await page.evaluate(()=>CATALOG.map(r=>r.name))));
  // „Abbrechen“ nimmt auch die wartenden Dateien heraus – und sagt es an der Zeile.
  await page.setInputFiles('#fileInput',[{name:'lauf-2.txt',mimeType:'text/plain',buffer:big(2)},{name:'lauf-3.txt',mimeType:'text/plain',buffer:big(3)}]);
  await page.waitForFunction(()=>signing);await page.waitForTimeout(200);
  await page.setInputFiles('#fileInput',{name:'spaeter-3.txt',mimeType:'text/plain',buffer:Buffer.from('Notiz drei über die Garage.')});
  await page.waitForTimeout(100);await page.evaluate(()=>document.getElementById('cancelSign').click());
  await page.waitForFunction(()=>!signing,null,{timeout:30000});await page.waitForTimeout(300);
  list=await rows();
  ok('„Abbrechen“ stops the waiting files too and the row says so; nothing stays on „wartet“',list.includes('spaeter-3.txt=fail=nicht gelesen: abgebrochen')&&!list.some(r=>/=wait=/.test(r))&&await page.evaluate(()=>!signing&&!CATALOG.some(r=>r.name==='spaeter-3.txt'||r.name==='lauf-3.txt'))||console.log(list));
  await page.setInputFiles('#fileInput',{name:'danach.txt',mimeType:'text/plain',buffer:Buffer.from('Notiz danach über den Zaun.')});
  await page.waitForFunction(()=>!signing&&CATALOG.some(r=>r.name==='danach.txt'),null,{timeout:30000});
  ok('After a cancelled run the next import works as usual',await page.evaluate(()=>window.PBImportStep===undefined));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} import progress checks passed (native copy simulated with delays).`);
}finally{await browser?.close();server.close();}
