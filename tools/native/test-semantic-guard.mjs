// Klaus 2026-10-27 (Windows test): Mycel connect and seal identity called Modul 03 without the
// downloaded model and failed ("Modell … konnte nicht geladen werden", yellow lamp). Now a step the user
// started asks once, loads with progress and continues; background calls get a clear message, no dialog.
// ProSemantic and Modul 03 are simulated; the page, the guard and the dialogs are real.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const MB=1048576,TOTAL=118*MB;
const stub03=`window.SbkimEmbedding={inits:0,async init(){this.inits++;},isReady(){return this.inits>0;},async embedPassage(){await this.init();return new Float32Array(384);},async embedQuery(){return new Float32Array(384);}};`;
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const url=`http://127.0.0.1:${server.address().port}/`;
  const open=async installed=>{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],dialogs=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>{dialogs.push(d.message());if(page.answer)d.accept();else d.dismiss();});
    await page.route('**/*',r=>{const u=r.request().url();
      if(u.includes('/modules/03_embedding.js'))return r.fulfill({contentType:'text/javascript',body:stub03});
      return u.startsWith(url)?r.continue():r.abort();});
    await page.addInitScript(({TOTAL,installed})=>{
      window.sem={log:[],listeners:[],progress:[],state:{installed,running:false,present:installed?TOTAL:0,total:TOTAL,files:7,crashes:0,lastGone:''}};
      // Playwright gives every evaluate a user gesture; the test sets the gesture state explicitly instead.
      window.gesture=false;Object.defineProperty(Navigator.prototype,'userActivation',{configurable:true,get:()=>({isActive:window.gesture,hasBeenActive:window.gesture})});
      addEventListener('sbkim:embedding-progress',e=>sem.progress.push(Math.round(e.detail.progress)));
      // Stand-in for a background call (a question from the network): runs after load, without any user gesture.
      addEventListener('load',()=>setTimeout(()=>{window.SbkimEmbedding.init().then(()=>{window.bg='ok';},e=>{window.bg={code:e.code,name:e.name,message:e.message};});},300));
      window.Capacitor={getPlatform:()=>'windows',isNativePlatform:()=>true,Plugins:{ProSemantic:{
        async getState(){return{...sem.state};},
        async install(){sem.log.push('install');sem.state.running=true;
          for(const done of [30*1048576,80*1048576,TOTAL]){await new Promise(r=>setTimeout(r,150));for(const [n,fn] of sem.listeners)if(n==='progress')fn({done,total:TOTAL,file:'model.onnx',source:'family-projekt.de'});}
          sem.state.running=false;sem.state.installed=true;sem.state.present=TOTAL;return{...sem.state};},
        async cancel(){return{...sem.state};},async remove(){return{...sem.state};},
        async markLoading(){return{...sem.state};},async markLoaded(){return{...sem.state};},async clearCrash(){return{...sem.state};},
        addListener(name,fn){sem.listeners.push([name,fn]);return{remove(){}};}
      }}};
    },{TOTAL,installed});
    await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&window.SbkimEmbedding&&window.PBSemantic);
    // A button that stands for "Mit dem Knotennetz verbinden" / "Identität erzeugen": a real user click.
    await page.evaluate(()=>{const b=document.createElement('button');b.id='probe-step';b.textContent='Schritt';b.style.cssText='position:fixed;top:4px;left:4px;z-index:99999';
      b.onclick=()=>{window.gesture=true;setTimeout(()=>{window.gesture=false;},0);window.result=null;SbkimEmbedding.embedPassage('Private Brain').then(()=>{window.result='ok';},e=>{window.result=e.code||e.message;});};document.body.append(b);});
    return {page,errors,dialogs};
  };
  const done=page=>page.waitForFunction(()=>window.result!==null&&window.result!==undefined,null,{timeout:15000});

  let {page,errors,dialogs}=await open(false);
  ok('The guard wraps Modul 03 as it loads (same object, marked)',await page.evaluate(()=>SbkimEmbedding.pbModelGuard===true&&typeof SbkimEmbedding.isReady==='function'));
  await page.waitForFunction(()=>window.bg!==undefined);const background=await page.evaluate(()=>window.bg);
  ok('A background call without the model gets a clear message, no dialog and no download',background.code==='MODEL_NOT_LOADED'&&background.name==='ModelLoadError'&&/Einstellungen/.test(background.message)&&dialogs.length===0&&await page.evaluate(()=>!sem.log.includes('install')&&SbkimEmbedding.inits===0));
  page.answer=false;await page.click('#probe-step');await done(page);
  ok('A started step asks once; "Abbrechen" loads nothing and says what is missing',dialogs.length===1&&/etwa 118 MB/.test(dialogs[0])&&await page.evaluate(()=>window.result==='MODEL_NOT_LOADED'&&!sem.log.includes('install')));
  page.answer=true;await page.click('#probe-step');await done(page);
  ok('"OK" loads the model, then the step continues by itself',await page.evaluate(()=>window.result==='ok'&&sem.log.filter(x=>x==='install').length===1&&SbkimEmbedding.inits>=1));
  ok('The Mycel progress bar receives the download progress',await page.evaluate(()=>sem.progress.length>=3&&sem.progress.at(-1)===100));
  const before=dialogs.length;await page.click('#probe-step');await done(page);
  ok('Once loaded, further steps run without asking again',dialogs.length===before&&await page.evaluate(()=>window.result==='ok'&&sem.log.filter(x=>x==='install').length===1));
  ok('No unhandled app errors (model missing at first)',errors.length===0);
  await page.close();

  ({page,errors,dialogs}=await open(true));
  page.answer=true;await page.click('#probe-step');await done(page);
  ok('With the model already loaded nothing changes: no dialog, no download',dialogs.length===0&&await page.evaluate(()=>window.result==='ok'&&!sem.log.includes('install')));
  await page.waitForFunction(()=>window.bg!==undefined);
  ok('A background call with the model present runs normally',await page.evaluate(()=>window.bg==='ok'));
  ok('No unhandled app errors (model present)',errors.length===0);
  console.log(`${count} model-guard checks passed (ProSemantic and Modul 03 simulated; no real download).`);
}finally{await browser?.close();server.close();}
