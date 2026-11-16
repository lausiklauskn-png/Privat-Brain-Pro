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
  const open=async(installed,background=true)=>{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],dialogs=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>{dialogs.push(d.message());if(page.answer)d.accept();else d.dismiss();});
    await page.route('**/*',r=>{const u=r.request().url();
      if(u.includes('/modules/03_embedding.js'))return r.fulfill({contentType:'text/javascript',body:stub03});
      return u.startsWith(url)?r.continue():r.abort();});
    await page.addInitScript(({TOTAL,installed,background})=>{
      window.sem={log:[],listeners:[],progress:[],state:{installed,running:false,present:installed?TOTAL:0,total:TOTAL,files:7,crashes:0,lastGone:''}};
      // Playwright gives every evaluate a user gesture; the test sets the gesture state explicitly instead.
      window.gesture=false;Object.defineProperty(Navigator.prototype,'userActivation',{configurable:true,get:()=>({isActive:window.gesture,hasBeenActive:window.gesture})});
      addEventListener('sbkim:embedding-progress',e=>sem.progress.push(Math.round(e.detail.progress)));
      // Stand-in for a background call (a question from the network): runs after load, without any user gesture.
      if(background)addEventListener('load',()=>setTimeout(()=>{window.SbkimEmbedding.init().then(()=>{window.bg='ok';},e=>{window.bg={code:e.code,name:e.name,message:e.message};});},300));
      window.Capacitor={getPlatform:()=>'windows',isNativePlatform:()=>true,Plugins:{ProSemantic:{
        async getState(){return{...sem.state};},
        async install(){sem.log.push('install');sem.state.running=true;
          for(const done of [30*1048576,80*1048576,TOTAL]){await new Promise(r=>setTimeout(r,150));for(const [n,fn] of sem.listeners)if(n==='progress')fn({done,total:TOTAL,file:'model.onnx',source:'family-projekt.de'});}
          sem.state.running=false;sem.state.installed=true;sem.state.present=TOTAL;return{...sem.state};},
        async cancel(){return{...sem.state};},async remove(){return{...sem.state};},
        async markLoading(){return{...sem.state};},async markLoaded(){return{...sem.state};},async clearCrash(){return{...sem.state};},
        addListener(name,fn){sem.listeners.push([name,fn]);return{remove(){}};}
      }}};
    },{TOTAL,installed,background});
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
  await page.close();

  // Klaus 2026-11-16 (Gerätetest 1.0.52, Punkte 1 und 2): beim Öffnen der App lädt nichts von selbst; das Modell startet erst,
  // wenn mit „Bedeutung“ gesucht wird, und die Ladezeile sagt, was lädt.
  const watch=page=>page.evaluate(()=>{window.lines=[];new MutationObserver(()=>{const r=document.getElementById('pb-activity');if(r&&!r.hidden&&r.textContent&&!lines.includes(r.textContent))lines.push(r.textContent);}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});});
  ({page,errors,dialogs}=await open(true,false));
  await watch(page);await page.waitForTimeout(900);
  ok('App opened with the model on the device: nothing starts by itself, no waiting line',await page.evaluate(()=>SbkimEmbedding.inits===0&&lines.length===0));
  await page.fill('#q','auto');await page.waitForFunction(()=>SbkimEmbedding.inits>=1);
  ok('Searching with „Bedeutung“ on starts the model once and the line names it',await page.evaluate(()=>SbkimEmbedding.inits===1&&lines.some(l=>/Modell wird gestartet/.test(l)))&&dialogs.length===0);
  await page.fill('#q','auto haus');await page.waitForTimeout(300);
  ok('Further typing does not start it again',await page.evaluate(()=>SbkimEmbedding.inits===1));
  ok('No unhandled app errors (start on demand)',errors.length===0);
  await page.close();

  ({page,errors,dialogs}=await open(false,false));
  await watch(page);
  const tapMeaning=async()=>{for(let i=0;i<2;i++){await page.locator('#mode [data-m="mean"]').click();await page.waitForTimeout(80);if(await page.evaluate(()=>MODE==='mean'))return;}};
  await page.fill('#q','auto');await page.waitForTimeout(300);
  ok('Model not on the device: typing never offers a download',dialogs.length===0&&await page.evaluate(()=>!sem.log.includes('install')));
  page.answer=false;await tapMeaning();await page.waitForTimeout(200);
  ok('A tap on „Bedeutung“ asks once with the size; "Abbrechen" loads nothing',dialogs.length===1&&/etwa 118 MB/.test(dialogs[0])&&await page.evaluate(()=>!sem.log.includes('install')));
  await tapMeaning();await tapMeaning();await page.waitForTimeout(200);
  ok('It does not ask again in the same app run',dialogs.length===1);
  await page.close();
  ({page,errors,dialogs}=await open(false,false));
  await watch(page);page.answer=true;
  for(let i=0;i<2&&!dialogs.length;i++){await page.locator('#mode [data-m="mean"]').click();await page.waitForTimeout(150);}
  await page.waitForFunction(()=>SbkimEmbedding.inits>=1,null,{timeout:15000});
  ok('"OK" loads with one sentence, the size and a percentage, then starts the model',await page.evaluate(()=>sem.log.filter(x=>x==='install').length===1&&lines.some(l=>/Modell wird geladen, etwa 118 MB/.test(l)&&/\d+ %/.test(l))&&lines.some(l=>/Modell wird gestartet/.test(l))));
  ok('No unhandled app errors (load on demand)',errors.length===0);
  await page.close();

  // Generalprüfung 16.11.2026: (a) das Schild in den Einstellungen nennt den wirklichen Zustand statt dauerhaft „lädt / Rückfall
  // aktiv“; (b) wird das Modell nach dem Tippen bereit, sucht die App einmal von selbst neu (vorher blieb die Wortsuche stehen).
  const schild=page=>page.evaluate(()=>document.getElementById('embFlag').textContent+'|'+document.getElementById('embInfo').textContent);
  ({page,errors,dialogs}=await open(false,false));
  await page.waitForTimeout(400);
  let text=await schild(page);
  ok('Model not on the device: the badge says „nicht geladen“, not „lädt“',/^nicht geladen\|/.test(text)&&!/lädt|Rückfall/.test(text)||console.log(text));
  await page.close();
  ({page,errors,dialogs}=await open(true,false));
  await page.waitForTimeout(400);text=await schild(page);
  ok('Model on the device, not started: the badge says „bereit“ and when it starts',/^bereit\|.*startet, sobald du mit „Bedeutung“ suchst/.test(text)&&!/lädt|Rückfall/.test(text)||console.log(text));
  for(const [lang,word] of [['en','ready'],['ru','готова'],['pl','gotowy']]){
    await page.evaluate(l=>{document.documentElement.lang=l;window.dispatchEvent(new CustomEvent('pblang',{detail:l}));},lang);await page.waitForTimeout(80);text=await schild(page);
    ok(`The badge is translated (${lang})`,text.startsWith(word+'|')&&!/bereit|lädt|Suche/.test(text)||console.log(text));
  }
  await page.evaluate(()=>{document.documentElement.lang='de';window.dispatchEvent(new CustomEvent('pblang',{detail:'de'}));});
  await page.evaluate(()=>{
    CATALOG.push({hash:'a'.repeat(64),name:'Auto Kaufvertrag',ext:'pdf',type:'application/pdf',date:Date.UTC(2026,9,1),size:4096,snippet:'Kaufvertrag Auto',path:'Dokumente/auto.pdf',tags:[],dupes:[],evec:Array.from(new Float32Array(384))});
    for(const r of CATALOG){const tk=tokens(r.name+' '+(r.snippet||''));r.tf=termFreq(tk);r.vector=buildVector(tk);r.nameTokens=tokens(r.name);HASHSET.add(r.hash);}rebuildIndex();
    // the model takes 0.8 s to start; count every drawing of the result list
    const init=SbkimEmbedding.init;SbkimEmbedding.init=async function(){await new Promise(r=>setTimeout(r,800));return init.apply(this,arguments);};
    window.draws=[];const draw=window.renderResults;window.renderResults=function(q){draws.push({q,ready:SbkimEmbedding.inits>0});return draw.apply(this,arguments);};
  });
  await page.fill('#q','auto');await page.waitForTimeout(300);
  text=await page.evaluate(()=>document.getElementById('searchInfo').textContent);
  ok('While the model is still starting the line honestly says „Wortsuche“ and the badge „startet“',/1 Treffer/.test(text)&&/Wortsuche/.test(text)&&!/Bedeutungssuche/.test(text)&&/^startet/.test(await schild(page))||console.log(text,await schild(page)));
  await page.waitForFunction(()=>SbkimEmbedding.inits>=1);await page.waitForTimeout(700);
  ok('When the model becomes ready the same question is searched once more by itself, now as „Bedeutungssuche“',await page.evaluate(()=>draws.some(d=>d.ready&&d.q==='auto')&&/Bedeutungssuche/.test(document.getElementById('searchInfo').textContent))||console.log(await page.evaluate(()=>[draws,document.getElementById('searchInfo').textContent])));
  text=await schild(page);
  ok('After the start the badge says „aktiv“',/^aktiv/.test(text)||console.log(text));
  ok('No unhandled app errors (badge and search again)',errors.length===0||console.log(errors));
  console.log(`${count} model-guard checks passed (ProSemantic and Modul 03 simulated; no real download).`);
}finally{await browser?.close();server.close();}
