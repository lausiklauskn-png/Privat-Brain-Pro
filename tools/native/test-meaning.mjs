// Zweites Bedeutungs-Modell nur für die Suche in der App (Pro-Umbau 5, Klaus 2026-10-28). Läuft gegen den gebauten Webteil (www/).
// Gestellt sind nur die Brücken (ProMeaning, ProSemantic, ProDevice, ProHintergrund) und die Rechnung beider Modelle:
// Modul 03 (384 Werte) ordnet die Probefrage absichtlich dem FALSCHEN Text zu, das zweite Modell (768/1024) dem richtigen –
// so zeigt die Reihenfolge der Treffer, welches Modell die Suche gerade nutzt. Seite, Ablage, Einordnen und Suche sind echt.
// Das echte e5-base/e5-large läuft hier nicht (kein Netz im Behälter; gemessen nur im Lernlauf 40758382311).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_WWW||'www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const pins=JSON.parse(await readFile(resolve(root,'meaning-models.json'),'utf8'));
const bytes=s=>Object.values(pins.models[s].sizes).reduce((a,b)=>a+b,0)+Object.values(pins.library.sizes).reduce((a,b)=>a+b,0);
const MITTEL=bytes('mittel'),GROSS=bytes('gross'),MB=n=>String(Math.round(n/1048576));
// One concept per text: 1 = teeth, 2 = rent, others by position. Modul 03 maps the question to "rent" on purpose.
// The two models use different value layouts (as real models do): a 768/1024 question compared with a 384 vector is noise.
const embedSrc=`(text,dim,frage)=>{const v=new Float32Array(dim);const s=String(text),o=dim===384?5:1;
  let k=/Gebiss/.test(s)?frage:/Zahn/.test(s)?o:/Miet/.test(s)?o+1:8+(s.length%(dim-9));v[k]=1;return v;}`;
const stub03=`window.SbkimEmbedding={ready:false,async init(){this.ready=true;},isReady(){return this.ready;},getModelSource(){return 'local';},
  async embedPassageBatch(t){return t.map(x=>(${embedSrc})(x,384,6));},async embedPassage(x){return (${embedSrc})(x,384,6);},async embedQuery(x){return (${embedSrc})(x,384,6);}};`;
const EMOJI=/\p{Extended_Pictographic}/u;
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1000,height:900}});
  const page=await context.newPage(),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  const dialoge=[];let antwort='accept';page.on('dialog',d=>{dialoge.push(d.message());antwort==='accept'?d.accept():d.dismiss();});
  await page.route('**/*',r=>{const u=r.request().url();
    if(u.includes('/modules/03_embedding.js'))return r.fulfill({contentType:'text/javascript',body:stub03});
    return u.startsWith(url)?r.continue():r.abort();});
  await page.addInitScript(({MITTEL,GROSS,embedSrc})=>{
    const saved=JSON.parse(localStorage.getItem('meanTest')||'{}');
    const blank=total=>({installed:false,running:false,present:0,total,files:7,crashes:0,lastGone:''});
    window.mean={log:[],texts:[],listeners:[],bg:[],bgListeners:[],failNext:'',delay:0,
      stages:Object.assign({mittel:blank(MITTEL),gross:blank(GROSS)},saved.stages||{}),save(){localStorage.setItem('meanTest',JSON.stringify({stages:this.stages}));}};
    const state=()=>({stages:JSON.parse(JSON.stringify(mean.stages)),running:Object.keys(mean.stages).find(s=>mean.stages[s].running)||''});
    const embed=new Function('return '+embedSrc)();
    window.__PB_MEANING_STUB__={async init(stage){mean.log.push('init:'+stage);},
      async embed(texts,stage){mean.texts.push(...texts);if(mean.delay)await new Promise(r=>setTimeout(r,mean.delay));return texts.map(s=>embed(s,stage==='gross'?1024:768,1));}};
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{
      ProSemantic:{async getState(){return{installed:true,running:false,present:1,total:1,files:7,crashes:0,lastGone:''};},async markLoading(){return this.getState();},async markLoaded(){return this.getState();},addListener(){return{remove(){}};}},
      ProDevice:{async getInfo(){return{platform:'android'};},async measure(){return{platform:'android',ramBytes:16*1073741824,cores:8,cpu:'Probe',gpu:[],freeBytes:64*1073741824};}},
      ProHintergrund:{async aufraeumen(){},async erlauben(){},async beginnen(o){mean.bg.push(['beginnen',o]);return{geschuetzt:true};},async stand(o){mean.bg.push(['stand',o]);},async ende(o){mean.bg.push(['ende',o]);},
        addListener(n,fn){mean.bgListeners.push([n,fn]);return{remove(){}};}},
      ProMeaning:{
        async getState(){return state();},
        async install({stage}){mean.log.push('install:'+stage);
          if(mean.failNext){const e=new Error('App is offline');e.code=mean.failNext;mean.failNext='';throw e;}
          const s=mean.stages[stage];s.running=true;
          for(const f of [0.2,0.6,1]){await new Promise(r=>setTimeout(r,350));for(const [n,fn] of mean.listeners)if(n==='progress')fn({stage,done:Math.round(s.total*f),total:s.total,file:'model/onnx/model_quantized.onnx',source:'family-projekt.de'});}
          s.running=false;s.installed=true;s.present=s.total;mean.save();return state();},
        async cancel({stage}){mean.log.push('cancel:'+stage);return state();},
        async remove({stage}){mean.log.push('remove:'+stage);Object.assign(mean.stages[stage],{installed:false,present:0,crashes:0});mean.save();return state();},
        async markLoading({stage}){mean.log.push('markLoading:'+stage);return state();},
        async markLoaded({stage}){mean.log.push('markLoaded:'+stage);mean.stages[stage].crashes=0;mean.save();return state();},
        async clearCrash({stage}){mean.log.push('clearCrash:'+stage);mean.stages[stage].crashes=0;mean.save();return state();},
        addListener(name,fn){mean.listeners.push([name,fn]);return{remove(){}};}
      }}};
  },{MITTEL,GROSS,embedSrc});
  await page.goto(url);
  await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBWorkspace&&window.PBMeaning&&EMBED.ready);
  const A='a'.repeat(64),B='b'.repeat(64);
  await page.evaluate(async({A,B})=>{
    const make=(h,name,snippet)=>{const t=tokens(name+' '+snippet);return{hash:h,name,path:'Docs/'+name,size:1000,category:'Rechnung / Verträge',type:'text/plain',ext:'txt',date:Date.now(),vector:buildVector(t),tf:termFreq(t),nameTokens:tokens(name),snippet,summary:'',tags:[],dupes:[],dirId:null,pruefung:{zeit:1,funde:[],angaben:[],hinweise:[],ungeprueft:false}};};
    for(const r of [make(A,'Praxis.txt','Rechnung der Zahnarztpraxis: Reinigung und eine Füllung'),make(B,'Wohnung.txt','Mietvertrag für die Wohnung im zweiten Stock')]){await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);}
    rebuildIndex();refreshAll();await embedBackfill();
  },{A,B});
  const settings=()=>page.evaluate(()=>window.PBWorkspace.navigate('settings'));
  const first=async q=>{await page.evaluate(()=>window.PBWorkspace.navigate('search'));return page.evaluate(async q=>{const el=document.getElementById('q');el.value=q;await renderResults(q);return document.querySelector('#results > .card')?.dataset.hash||'';},q);};
  ok('Modul 03 is ready and its vectors at the entries have 384 values (Mycel/seal model unchanged)',await page.evaluate(()=>CATALOG.every(r=>r.evec&&r.evec.length===384)));
  ok('Without the second model the search uses Modul 03 (here deliberately the rent contract first)',await first('Gebiss Preis')===B);
  // ---------- the box ----------
  await settings();
  const box=page.locator('#pb-meaning');await box.waitFor({state:'visible'});
  const lay=await page.evaluate(()=>{const b=document.getElementById('pb-meaning'),s=document.getElementById('pb-semantic');const bs=[...b.querySelectorAll('button')].filter(x=>!x.hidden&&x.offsetParent);return{after:s&&s.nextElementSibling===b,title:b.querySelector('[data-m="title"]').textContent,emoji:/\p{Extended_Pictographic}/u.test(b.innerText+b.querySelector('[data-m="info"]').textContent),maxH:Math.max(...bs.map(x=>x.getBoundingClientRect().height)),shadow:bs.every(x=>!/rgba?\(0, 0, 0/.test(getComputedStyle(x).boxShadow)||getComputedStyle(x).boxShadow.includes('inset')),info:b.querySelector('[data-pro-info]'),infoHidden:b.querySelector('[data-m="info"]').hidden,infoText:b.querySelector('[data-m="info"]').textContent,choices:[...b.querySelectorAll('[data-stufe]')].map(x=>x.textContent),checked:b.querySelector('[aria-checked="true"]')?.dataset.stufe,geraet:b.querySelector('[data-m="geraet"]').textContent,state:b.dataset.state};});
  ok('Settings: the box stands right under the model for Mycel/seal and is titled as the larger model for the app search',lay.after&&lay.title==='Größeres Modell für die Suche in der App');
  ok('Flat buttons up to 32 px, no emoji',lay.maxH<=32.5&&!lay.emoji);
  ok('The explanation sits behind ⓘ, closed at first, and names both sizes and that the benefit is not measured',!!lay.info&&lay.infoHidden&&lay.infoText.includes(MB(MITTEL)+' MB')&&lay.infoText.includes(MB(GROSS)+' MB')&&/nicht gemessen/.test(lay.infoText)&&/Mycel/.test(lay.infoText));
  ok('Off by default; three choices with the device check: Groß recommended on this (simulated) 16 GB device',lay.checked===''&&lay.state==='aus'&&lay.choices.length===3&&/Groß · passt · empfohlen/.test(lay.choices[2])&&/Mittel · passt/.test(lay.choices[1])&&/16 GB/.test(lay.geraet));
  // ---------- choose Mittel, load ----------
  await box.locator('[data-stufe="mittel"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='none');
  const haupt=()=>page.evaluate(()=>[...document.querySelectorAll('#pb-meaning .pro-knopf[data-pro-haupt]')].filter(b=>!b.hidden).map(b=>b.dataset.meaning));
  ok('Choosing only selects: nothing is loaded, the size is named, „Modell laden“ is the one coloured next step',await page.evaluate(()=>!mean.log.some(x=>x.startsWith('install')))&&(await box.locator('[data-m="text"]').textContent()).includes(MB(MITTEL)+' MB')&&JSON.stringify(await haupt())==='["load"]');
  ok('The choice survives in this browser',await page.evaluate(()=>localStorage.getItem('pb_meaning_stufe_v1')==='mittel'));
  await box.locator('[data-meaning="load"]').click();
  await page.waitForFunction(()=>/Wird geladen: \d+ von \d+ MB \([1-9]\d* %\) · family-projekt\.de/.test(document.querySelector('#pb-meaning [data-m="text"]').textContent));
  const prog=await page.evaluate(()=>({text:document.querySelector('#pb-meaning [data-m="text"]').textContent,w:parseFloat(document.querySelector('#pb-meaning .pb-semantic-bar>span').style.width),cancel:!document.querySelector('#pb-meaning [data-meaning="cancel"]').hidden}));
  ok('Loading shows a bar, MB, percent and the source; „Abbrechen“ is offered',prog.w>0&&prog.text.includes('family-projekt.de')&&prog.cancel);
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='bereit');
  ok('After loading nothing starts by itself: no indexing, no background task, the model not even started',await page.evaluate(()=>!mean.texts.length&&!mean.bg.some(x=>x[0]==='beginnen'&&/größeres Modell/.test(x[1].titel))&&!mean.log.includes('init:mittel')));
  ok('Loaded but not indexed: the search stays on Modul 03',await first('Gebiss Preis')===B&&await page.evaluate(async()=>(await PBMeaning.frage('Gebiss'))===null));
  // ---------- Einordnen ----------
  await settings();
  ok('„Einordnen (2)“ is now the one coloured next step',JSON.stringify(await haupt())==='["einordnen"]'&&(await box.locator('[data-meaning="einordnen"]').textContent())==='Einordnen (2)');
  await page.evaluate(()=>{mean.bg=[];});
  await box.locator('[data-meaning="einordnen"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='aktiv');
  const done=await page.evaluate(async()=>{const d=await new Promise(r=>{const q=indexedDB.open('pb_meaning_v1');q.onsuccess=()=>r(q.result);});const rows=await new Promise(r=>{const g=d.transaction('mittel').objectStore('mittel').getAll();g.onsuccess=()=>r(g.result);});
    return{texts:mean.texts.slice(),bg:mean.bg.map(x=>x[0]),bgArt:String(mean.bg[0]?.[1]?.id||'').split('-')[0],bgTitel:mean.bg[0]?.[1]?.titel,rows:rows.map(x=>({h:x.h,len:x.v.length,m:x.m})),evec:CATALOG.map(r=>r.evec.length),fields:CATALOG.map(r=>Object.keys(r).filter(k=>/mvec|meaning/i.test(k)).length),started:mean.log.includes('markLoading:mittel')&&mean.log.indexOf('markLoading:mittel')<mean.log.indexOf('markLoaded:mittel')};});
  ok('Einordnen runs as a background task (art „einordnen“, stand, ende) and starts the model with the crash guard',done.bg[0]==='beginnen'&&done.bg.includes('stand')&&done.bg.at(-1)==='ende'&&done.bgArt==='einordnen'&&done.bgTitel==='Einordnen (größeres Modell)'&&done.started);
  ok('Every text goes to the second model with the e5 role „passage: “',done.texts.filter(s=>s.startsWith('passage: ')).length===2&&done.texts.every(s=>s.startsWith('passage: ')||s.startsWith('query: ')));
  ok('768 values per file in their own table, with the pinned model revision',done.rows.length===2&&done.rows.every(r=>r.len===768&&r.m===pins.models.mittel.revision));
  ok('Never mixed: the entries keep their 384 values and get no second-model field',done.evec.every(n=>n===384)&&done.fields.every(n=>n===0));
  ok('All indexed: the search uses the second model (the dental bill first)',await first('Gebiss Preis')===A);
  const eco=await page.evaluate(async({A,B})=>{const qe=await PBMeaning.frage('Gebiss Preis');const h=search('Gebiss Preis',qe);return{len:qe.length,a:h.find(x=>x.r.hash===A)?.eco,b:h.find(x=>x.r.hash===B)?.eco??0};},{A,B});
  ok('The score compares the 768-value question only with 768-value file vectors (never with the 384 ones)',eco.len===768&&eco.a>0.99&&eco.b<0.01);
  ok('The question goes to the second model with „query: “',await page.evaluate(()=>mean.texts.some(s=>s==='query: Gebiss Preis')));
  // ---------- incomplete → back to Modul 03 ----------
  await page.evaluate(async A=>{const r=CATALOG.find(x=>x.hash===A);r.snippet+=' (geändert)';await idbPut('catalog',r);},A);
  ok('A changed text makes the index incomplete: the search goes back to Modul 03 until „Einordnen“',await first('Gebiss Preis')===B);
  await settings();
  ok('… and „Einordnen (1)“ offers only the changed file (counted again when Settings come into view)',await page.waitForFunction(()=>document.querySelector('#pb-meaning [data-meaning="einordnen"]').textContent==='Einordnen (1)',null,{timeout:5000}).then(()=>true,()=>false));
  await box.locator('[data-meaning="einordnen"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='aktiv');
  ok('Re-indexed: the second model again',await first('Gebiss Preis')===A);
  // ---------- abort from the notification ----------
  await page.evaluate(async()=>{for(let i=0;i<24;i++){const t=tokens('Notiz '+i);const r={hash:String(i).padStart(2,'0').repeat(32),name:'Notiz'+i+'.txt',path:'N/'+i,size:10,category:'Notiz',type:'text/plain',ext:'txt',date:Date.now(),vector:buildVector(t),tf:termFreq(t),nameTokens:t,snippet:'Einkaufsliste Nummer '+i,summary:'',tags:[],dupes:[],dirId:null,pruefung:{zeit:1,funde:[],angaben:[],hinweise:[],ungeprueft:false}};await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);}rebuildIndex();mean.delay=60;mean.bg=[];});
  await settings();
  await box.locator('[data-meaning="einordnen"]').click();
  await page.waitForFunction(()=>window.PBMeaning.job&&window.PBMeaning.job.i>=8);
  await page.evaluate(()=>{const id=mean.bg.find(x=>x[0]==='beginnen')[1].id;for(const [n,fn] of mean.bgListeners)if(n==='abbruch')fn({id,grund:'mitteilung'});});
  await page.waitForFunction(()=>!window.PBMeaning.job&&/angehalten/.test(document.querySelector('#pb-meaning [data-m="text"]').textContent));
  const halt=await page.evaluate(()=>({text:document.querySelector('#pb-meaning [data-m="text"]').textContent,st:PBMeaning.stand(),ende:mean.bg.at(-1)[0]}));
  ok('„Abbrechen“ in the notification stops after the running batch, says so and ends the task',halt.st.n<halt.st.m&&halt.st.n>=10&&halt.ende==='ende'&&/Einordnen angehalten/.test(halt.text));
  ok('Partly indexed: the search stays on Modul 03',await first('Gebiss Preis')===B);
  const vorher=await page.evaluate(()=>{mean.delay=0;return mean.texts.filter(s=>s.startsWith('passage: ')).length;});await settings();
  await box.locator('[data-meaning="einordnen"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='aktiv');
  ok('„Einordnen“ continues where it stopped (only the rest)',await page.evaluate(()=>mean.texts.filter(s=>s.startsWith('passage: ')).length)-vorher===halt.st.m-halt.st.n);
  // ---------- other stage, restart ----------
  await box.locator('[data-stufe="gross"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='none');
  ok('Switching to Groß: not loaded, the search falls back to Modul 03, Mittel keeps its files and values',await first('Gebiss Preis')===B&&await page.evaluate(async()=>{const d=await new Promise(r=>{const q=indexedDB.open('pb_meaning_v1');q.onsuccess=()=>r(q.result);});return new Promise(r=>{const g=d.transaction('mittel').objectStore('mittel').count();g.onsuccess=()=>r(g.result===CATALOG.length);});})&&await page.evaluate(()=>mean.stages.mittel.installed));
  // Device check before loading: on a (simulated) 4 GB device Groß is „nicht empfohlen“ and the app asks first.
  await page.evaluate(()=>localStorage.setItem('pro_geraet_v1',JSON.stringify({fassung:1,zeit:Date.now(),quelle:'android',ramGB:4,kerne:4,gpu:[],freiGB:50,probeMs:100,stufe:'klein'})));
  antwort='dismiss';dialoge.length=0;await settings();await box.locator('[data-meaning="load"]').click();
  await page.waitForTimeout(300);antwort='accept';
  ok('Before loading the device check runs: on a weak device „nicht empfohlen“, and „Abbrechen“ loads nothing',dialoge.some(m=>/nicht empfohlen/.test(m)&&/Trotzdem laden/.test(m))&&await page.evaluate(()=>!mean.log.includes('install:gross')));
  await page.evaluate(()=>localStorage.removeItem('pro_geraet_v1'));
  await settings();await box.locator('[data-stufe="mittel"]').click();
  await page.reload();
  await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBMeaning&&CATALOG.length===26&&EMBED.ready);
  await page.waitForFunction(()=>document.getElementById('pb-meaning')?.dataset.state==='aktiv');
  ok('After a restart the choice and the values are back, and the model is NOT started at app start',await page.evaluate(()=>PBMeaning.wahl==='mittel'&&!mean.log.includes('init:mittel')));
  await first('Gebiss Preis');
  await page.waitForFunction(()=>mean.log.includes('markLoaded:mittel'));
  ok('The first meaning search starts the model (guarded) and then uses it',await first('Gebiss Preis')===A&&await page.evaluate(()=>mean.log.indexOf('markLoading:mittel')<mean.log.indexOf('markLoaded:mittel')));
  // ---------- crash guard ----------
  await page.evaluate(()=>{mean.stages.mittel.crashes=1;mean.save();});
  await page.reload();await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBMeaning&&CATALOG.length===26&&EMBED.ready);
  await settings();await page.waitForFunction(()=>document.getElementById('pb-meaning')?.dataset.state==='crashed');
  ok('After a crash the second model does not start by itself, the search uses Modul 03, „Erneut starten“ is offered',await first('Gebiss Preis')===B&&!(await page.evaluate(()=>mean.log.includes('init:mittel')))&&await page.evaluate(()=>!document.querySelector('#pb-meaning [data-meaning="retry"]').hidden));
  await settings();await box.locator('[data-meaning="retry"]').click();
  await page.waitForFunction(()=>mean.log.includes('clearCrash:mittel'));
  // ---------- remove ----------
  await settings();await box.locator('[data-meaning="remove"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-meaning').dataset.state==='none');
  ok('Removing (after asking) deletes the files and the indexed values; the search uses Modul 03',await page.evaluate(()=>mean.log.includes('remove:mittel'))&&await page.evaluate(async()=>{const d=await new Promise(r=>{const q=indexedDB.open('pb_meaning_v1');q.onsuccess=()=>r(q.result);});return new Promise(r=>{const g=d.transaction('mittel').objectStore('mittel').count();g.onsuccess=()=>r(g.result===0);});})&&await first('Gebiss Preis')===B);
  await settings();await page.evaluate(()=>{mean.failNext='APP_OFFLINE';});await box.locator('[data-meaning="load"]').click();
  await page.waitForFunction(()=>/Lampe oben/.test(document.querySelector('#pb-meaning [data-m="text"]').textContent));
  ok('With the app offline the box says how to load',true);
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('#pb-meaning [data-m="title"]').textContent==='Larger model for the search in the app');
  ok('The box follows the app language',await page.evaluate(()=>document.querySelector('#pb-meaning [data-meaning="load"]').textContent==='Load model'));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} checks of the second meaning model passed (bridges and both models simulated).`);
}finally{await browser?.close();server.close();}
