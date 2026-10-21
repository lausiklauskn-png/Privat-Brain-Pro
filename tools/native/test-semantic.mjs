// 🧠 Switch for the meaning model: loads on tap with progress, starts the model only when complete,
// not again by itself after a crash, and can be removed (ProSemantic and Modul 03 simulated).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const MB=1048576,TOTAL=155*MB;
// Modul 03 stand-in: counts init() calls, becomes ready.
const stub03=`window.SbkimEmbedding={inits:0,ready:false,async init(){this.inits++;sem.log.push('init');this.ready=true;},isReady(){return this.ready;},getModelSource(){return 'local';},
  async embedPassageBatch(t){return t.map(()=>new Float32Array(384));},async embedPassage(){return new Float32Array(384);},async embedQuery(){return new Float32Array(384);}};`;
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:900}});
  const page=await context.newPage(),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=r.request().url();
    if(u.includes('/modules/03_embedding.js'))return r.fulfill({contentType:'text/javascript',body:stub03});
    return u.startsWith(url)?r.continue():r.abort();});
  await page.addInitScript(TOTAL=>{
    const saved=JSON.parse(localStorage.getItem('semTest')||'{}');
    const st=Object.assign({installed:false,running:false,present:0,total:TOTAL,files:7,crashes:0,lastGone:''},saved.state||{});
    window.sem={log:[],listeners:[],failNext:saved.failNext||'',state:st,save(){localStorage.setItem('semTest',JSON.stringify({state:this.state}));}};
    const copy=()=>({...sem.state});
    window.Capacitor={Plugins:{ProSemantic:{
      async getState(){return copy();},
      async install(){sem.log.push('install');
        if(sem.failNext){const e=new Error('App is offline');e.code=sem.failNext;sem.failNext='';throw e;}
        sem.state.running=true;
        for(const done of [20*1048576,90*1048576,TOTAL]){await new Promise(r=>setTimeout(r,600));for(const [n,fn] of sem.listeners)if(n==='progress')fn({done,total:TOTAL,file:'model/onnx/model_quantized.onnx',source:'family-projekt.de'});}
        sem.state.running=false;sem.state.installed=true;sem.state.present=TOTAL;sem.save();return copy();},
      async cancel(){sem.log.push('cancel');return copy();},
      async remove(){sem.log.push('remove');Object.assign(sem.state,{installed:false,present:0,crashes:0});sem.save();return copy();},
      async markLoading(){sem.log.push('markLoading');return copy();},
      async markLoaded(){sem.log.push('markLoaded');sem.state.crashes=0;sem.save();return copy();},
      async clearCrash(){sem.log.push('clearCrash');sem.state.crashes=0;sem.save();return copy();},
      addListener(name,fn){sem.listeners.push([name,fn]);return{remove(){}};}
    }}};
  },TOTAL);
  await page.goto(url);
  const settings=()=>page.evaluate(()=>{window.PBWorkspace?.navigate?.('settings');if(document.querySelector('.tab.on')?.dataset.tab!=='settings')document.querySelector('[data-tab="settings"]')?.click();});
  const box=page.locator('#pb-semantic');await box.waitFor({state:'attached'});await settings();
  await page.waitForFunction(()=>document.getElementById('pb-semantic')?.dataset.state==='none');
  ok('Modul 03 reads the model from the app address, not from the internet',await page.evaluate(()=>window.SBKIM_MODEL_ROOT==='/models/'));
  ok('Not loaded: the model does not start and the size is named',await page.evaluate(()=>SbkimEmbedding.inits===0)&&(await box.textContent()).includes('155 MB'));
  ok('The keyword search does not wait for a missing model',await page.evaluate(()=>EMBED.tried===true&&EMBED.ready===false));
  const text=()=>box.locator('[data-s="text"]').textContent();
  await box.locator('[data-semantic="load"]').click();
  await page.waitForFunction(()=>/Wird geladen: (20|90) von 155 MB/.test(document.querySelector('#pb-semantic [data-s="text"]').textContent));
  ok('While loading the bar moves and names the source',parseFloat(await box.locator('.pb-semantic-bar>span').evaluate(e=>e.style.width))>0&&(await text()).includes('family-projekt.de'));
  ok('While loading there is a cancel button and no second load button',await box.locator('[data-semantic="cancel"]').isVisible()&&!(await box.locator('[data-semantic="load"]').isVisible()));
  await page.waitForFunction(()=>document.getElementById('pb-semantic').dataset.state==='active');
  ok('When complete the model starts once, marked before and after',await page.evaluate(()=>SbkimEmbedding.inits===1&&sem.log.join(',')==='install,markLoading,init,markLoaded'));
  ok('Then the search understands meaning',(await text()).includes('Aktiv')&&await page.evaluate(()=>EMBED.ready===true));
  // A crash while the model started last time: no automatic start, a way to try again.
  await page.evaluate(()=>{sem.state.crashes=1;sem.save();});
  await page.reload();await box.waitFor({state:'attached'});await settings();
  await page.waitForFunction(()=>document.getElementById('pb-semantic')?.dataset.state==='crashed');
  ok('After a crash the model does not start by itself and says why',await page.evaluate(()=>SbkimEmbedding.inits===0)&&(await text()).includes('zu wenig Speicher'));
  await box.locator('[data-semantic="retry"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-semantic').dataset.state==='active');
  ok('"Erneut starten" starts it on purpose',await page.evaluate(()=>SbkimEmbedding.inits===1&&sem.log.includes('clearCrash')));
  // Removing asks first.
  page.once('dialog',d=>d.dismiss());await box.locator('[data-semantic="remove"]').click();
  ok('Removing asks first; "Abbrechen" keeps the model',await page.evaluate(()=>!sem.log.includes('remove')));
  page.once('dialog',d=>d.accept());await box.locator('[data-semantic="remove"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-semantic').dataset.state==='none');
  ok('After removing the panel offers loading again',await box.locator('[data-semantic="load"]').isVisible());
  // Offline: a clear message, nothing started.
  await page.evaluate(()=>{sem.failNext='APP_OFFLINE';});
  await box.locator('[data-semantic="load"]').click();
  await page.waitForFunction(()=>/Lampe oben/.test(document.querySelector('#pb-semantic [data-s="text"]').textContent));
  ok('With the app offline the panel says how to load',true);
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('#pb-semantic [data-semantic="load"]').textContent==='Load model');
  ok('The panel follows the app language',(await box.locator('b').textContent()).includes('Model for meaning search'));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} meaning-model switch checks passed (ProSemantic and Modul 03 simulated).`);
}finally{await browser?.close();server.close();}
