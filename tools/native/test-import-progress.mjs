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
  ok('No step hook is left behind after the import',await page.evaluate(()=>window.PBImportStep===undefined));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} import progress checks passed (native copy simulated with delays).`);
}finally{await browser?.close();server.close();}
