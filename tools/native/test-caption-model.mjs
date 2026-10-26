// Bildbeschreibung (Sitzung 4, Klaus 2026-10-26): eigene Worte an jedem Bild, getrennt gespeichert und mitgesucht;
// Modell-Beschreibung als eigenes Feld; Schalter „Bildbeschreibung“ in der Suche; in den Apps der Schalter für das
// Bildmodell (ProCaption gestellt, wie ProSemantic in test-semantic.mjs). Läuft gegen den gebauten Webteil (www/).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_WWW||'www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const MB=1048576,TOTAL=268302883;
const EMOJI=/\p{Extended_Pictographic}/u;
// A 1×1 JPEG (valid bytes) for a photo in the catalogue and for the lightbox thumbnail.
const JPG='/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1000,height:900}});
  const page=await context.newPage(),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(TOTAL=>{
    const saved=JSON.parse(localStorage.getItem('capTest')||'{}');
    const st=Object.assign({installed:false,running:false,present:0,total:TOTAL,files:10,crashes:0,lastGone:''},saved.state||{});
    window.cap={log:[],listeners:[],failNext:saved.failNext||'',state:st,save(){localStorage.setItem('capTest',JSON.stringify({state:this.state}));}};
    const copy=()=>({...cap.state});
    window.Capacitor={getPlatform:()=>'android',isNativePlatform:()=>true,Plugins:{ProCaption:{
      async getState(){return copy();},
      async install(){cap.log.push('install');
        if(cap.failNext){const e=new Error('App is offline');e.code=cap.failNext;cap.failNext='';throw e;}
        cap.state.running=true;
        for(const done of [40*1048576,180*1048576,TOTAL]){await new Promise(r=>setTimeout(r,400));for(const [n,fn] of cap.listeners)if(n==='progress')fn({done,total:TOTAL,file:'model/onnx/decoder_model_merged_quantized.onnx',source:'family-projekt.de'});}
        cap.state.running=false;cap.state.installed=true;cap.state.present=TOTAL;cap.save();return copy();},
      async cancel(){cap.log.push('cancel');return copy();},
      async remove(){cap.log.push('remove');Object.assign(cap.state,{installed:false,present:0,crashes:0});cap.save();return copy();},
      async markLoading(){cap.log.push('markLoading');return copy();},
      async markLoaded(){cap.log.push('markLoaded');cap.state.crashes=0;cap.save();return copy();},
      async clearCrash(){cap.log.push('clearCrash');cap.state.crashes=0;cap.save();return copy();},
      addListener(name,fn){cap.listeners.push([name,fn]);return{remove(){}};}
    }}};
  },TOTAL);
  await page.goto(url);
  await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBWorkspace&&window.PBBild);
  // Two records: a photo (no text, no description yet) and a PDF.
  await page.evaluate(async JPG=>{
    const bytes=Uint8Array.from(atob(JPG),c=>c.charCodeAt(0));
    const make=(l,name,path,category,type,ext,extra={})=>{const t=tokens(name);return{hash:l.repeat(64),name,path,size:1000,category,type,ext,date:Date.now(),vector:buildVector(t),tf:termFreq(t),nameTokens:t,snippet:'',summary:'',tags:[],dupes:[],dirId:null,pruefung:{zeit:1,funde:[],angaben:[],hinweise:[],ungeprueft:false},...extra};};
    const recs=[make('a','Urlaub.jpg','Fotos/Urlaub.jpg','Foto/Bild','image/jpeg','jpg',{thumb:'data:image/jpeg;base64,'+JPG}),make('b','Urlaub.pdf','Docs/Urlaub.pdf','Rechnung / Verträge','application/pdf','pdf')];
    for(const r of recs){await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);}
    SESSION_FILES.set('a'.repeat(64),new File([bytes],'Urlaub.jpg',{type:'image/jpeg'}));
    rebuildIndex();refreshAll();
  },JPG);
  const settings=()=>page.evaluate(()=>{window.PBWorkspace.navigate('settings');});
  const A='a'.repeat(64),B='b'.repeat(64);
  // ---------- settings block ----------
  await settings();
  const box=page.locator('#pb-bild-model');await box.waitFor({state:'attached'});
  await page.waitForFunction(()=>document.getElementById('pb-bild-model')?.dataset.state==='none');
  const head=await page.evaluate(()=>{const b=document.getElementById('capEnable').closest('.note');return {h:b.querySelector('h3').textContent.trim(),p:b.querySelector('[data-i18n="capP"]').textContent,label:b.querySelector('label[for="capEnable"]').textContent.trim(),model:getComputedStyle(document.getElementById('capModel').closest('label')).display,server:getComputedStyle(document.getElementById('capServer').closest('label')).display,emoji:/\p{Extended_Pictographic}/u.test(b.innerText)};});
  ok('Settings: the block is called „Bildbeschreibung“ and the switch names what the model does',head.h==='Bildbeschreibung'&&head.label==='Fotos vom Modell beschreiben lassen');
  ok('Settings: the explanation names the download size and the measured memory, honestly „am Tablet nicht gemessen“',/256 MB/.test(head.p)&&/1217 MB/.test(head.p)&&/nicht gemessen/.test(head.p));
  ok('Settings (app): model and server fields are hidden, no emoji in the block',head.model==='none'&&head.server==='none'&&!head.emoji);
  const text=()=>box.locator('[data-s="text"]').textContent();
  ok('Model switch: not loaded, size named, load button offered',/256 MB/.test(await text())&&await box.locator('[data-caption="load"]').isVisible());
  // Gate: the photo waits for a description, but without the model nothing starts and nothing crashes.
  await page.evaluate(async A=>{localStorage.setItem('pb_caption_on','1');const r=CATALOG.find(x=>x.hash===A);r.needsCap=true;await idbPut('catalog',r);window.PBCaption={isReady:()=>true,warmup:async()=>{window.cap.log.push('warmup');},configure(){},_cfg:{}};window.PB_CAPTION=async()=>'ein roter Oldtimer vor einer Scheune';await captionBackfill();},A);
  ok('Without the model the page does not start describing (no warmup, no crash counter)',await page.evaluate(()=>!cap.log.includes('warmup')&&!cap.log.includes('markLoading')&&localStorage.getItem('pb_model_crashed')!=='1'));
  // Load: progress with source, then ready.
  await box.locator('[data-caption="load"]').click();
  await page.waitForFunction(()=>/Wird geladen: (40|180) von 256 MB/.test(document.querySelector('#pb-bild-model [data-s="text"]').textContent));
  ok('Loading shows the bar, the MB and the source',parseFloat(await box.locator('.pb-semantic-bar>span').evaluate(e=>e.style.width))>0&&(await text()).includes('family-projekt.de'));
  await page.waitForFunction(()=>document.getElementById('pb-bild-model').dataset.state==='ready');
  ok('Loaded and checked: remove is offered, load is not',await box.locator('[data-caption="remove"]').isVisible()&&!(await box.locator('[data-caption="load"]').isVisible()));
  // After loading, the waiting photo is described; the model's words become r.caption, separate from own words.
  await page.waitForFunction(A=>CATALOG.find(x=>x.hash===A)?.caption==='ein roter Oldtimer vor einer Scheune',A,{timeout:15000});
  const described=await page.evaluate(A=>{const r=CATALOG.find(x=>x.hash===A);return {caption:r.caption,inSnippet:/Oldtimer/.test(r.snippet),needsCap:r.needsCap,guarded:cap.log.includes('markLoading')&&cap.log.includes('markLoaded')&&cap.log.indexOf('markLoading')<cap.log.indexOf('markLoaded')};},A);
  ok('The model’s description is stored as its own field and still in the search text',described.caption==='ein roter Oldtimer vor einer Scheune'&&described.inSnippet&&described.needsCap===false);
  ok('The model start is guarded: markLoading before, markLoaded after (crash counter of the app)',described.guarded);
  // ---------- the field at the image ----------
  await page.evaluate(()=>{window.PBWorkspace.navigate('search');const q=document.getElementById('q');q.value='Urlaub';q.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForSelector(`#results > .card[data-hash="${A}"] .pb-bild textarea.pb-bild-own`);
  const cards=await page.evaluate(({A,B})=>({img:!!document.querySelector(`#results > .card[data-hash="${A}"] .pb-bild`),pdf:!!document.querySelector(`#results > .card[data-hash="${B}"] .pb-bild`),label:document.querySelector(`#results > .card[data-hash="${A}"] .pb-bild-label-text`).textContent,model:document.querySelector(`#results > .card[data-hash="${A}"] .pb-bild-model`).textContent,emoji:/\p{Extended_Pictographic}/u.test(document.querySelector(`#results > .card[data-hash="${A}"] .pb-bild`).innerText),icon:!!document.querySelector(`#results > .card[data-hash="${A}"] .pb-bild-label svg`)}),{A,B});
  ok('Search result: the photo gets the field „Bildbeschreibung“, the PDF does not',cards.img&&!cards.pdf&&cards.label==='Bildbeschreibung');
  ok('The model’s words stand next to the field, marked „Vom Modell“, as line icon without emoji',/^Vom Modell: ein roter Oldtimer/.test(cards.model)&&!cards.emoji&&cards.icon);
  const own=page.locator(`#results > .card[data-hash="${A}"] textarea.pb-bild-own`);
  await own.fill('Opas Traktor hinter dem Haus');await own.press('Enter');
  await page.waitForFunction(A=>CATALOG.find(x=>x.hash===A)?.userCaption==='Opas Traktor hinter dem Haus',A);
  const saved=await page.evaluate(async A=>{const r=CATALOG.find(x=>x.hash===A);const db=await idbGet('catalog',A);return {own:r.userCaption,caption:r.caption,stored:db&&db.userCaption,tf:!!r.tf.traktor,evec:r.evec};},A);
  ok('Own words are saved as their own field, apart from the model’s words, and persisted',saved.own==='Opas Traktor hinter dem Haus'&&saved.caption==='ein roter Oldtimer vor einer Scheune'&&saved.stored==='Opas Traktor hinter dem Haus');
  ok('Own words are in the search index (and the meaning vector is renewed)',saved.tf&&saved.evec===null);
  ok('Meaning search finds the photo by the own words',await page.evaluate(A=>search('Traktor',null).some(h=>h.r.hash===A),A));
  ok('Meaning search finds the photo by the model’s words',await page.evaluate(A=>search('Oldtimer Scheune',null).some(h=>h.r.hash===A),A));
  ok('The meaning model would embed the own words with the image',await page.evaluate(A=>/Opas Traktor/.test(passageText(CATALOG.find(x=>x.hash===A))),A));
  // ---------- the switch in the search ----------
  const filter=page.locator('#pb-bild-filter');
  const place=await page.evaluate(()=>{const f=document.getElementById('pb-bild-filter'),row=document.getElementById('pb-bild-row'),box=document.querySelector('#panel-search .searchbox');const r=f.getBoundingClientRect();return {next:box.nextElementSibling===row&&row.firstElementChild===f&&!box.querySelector('.pb-bild-filter,.pb-bild-help,.pb-bild-help-toggle')&&box.getBoundingClientRect().height<=56,text:f.textContent.trim(),emoji:/\p{Extended_Pictographic}/u.test(f.textContent+f.title),h:r.height,shadow:getComputedStyle(f).boxShadow,pressed:f.getAttribute('aria-pressed'),help:document.getElementById('pb-bild-filter-help'),helpOpen:!document.getElementById('pb-bild-filter-help').hidden,helpText:document.getElementById('pb-bild-filter-help').textContent};});
  ok('A flat switch „Bildbeschreibung“ stands in its own row right under the search box (which keeps its height), off at first, without emoji or shadow',place.next&&place.text==='Bildbeschreibung'&&!place.emoji&&place.h<=46&&place.shadow==='none'&&place.pressed==='false');
  ok('Its ⓘ explanation is open the first time and says what is searched',place.helpOpen&&/eigenen Worten/.test(place.helpText));
  await page.evaluate(()=>{const q=document.getElementById('q');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));});
  await filter.click();
  await page.waitForFunction(A=>document.querySelector(`#results > .card[data-hash="${A}"]`)&&document.querySelectorAll('#results > .card').length===1,A,{timeout:8000}).catch(()=>{});
  ok('Switch on without a search word: only described images are listed',await page.evaluate(({A,B})=>!!document.querySelector(`#results > .card[data-hash="${A}"]`)&&!document.querySelector(`#results > .card[data-hash="${B}"]`),{A,B}));
  await page.evaluate(()=>{MODE='name';setToggle();const q=document.getElementById('q');q.value='Traktor';q.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(A=>!!document.querySelector(`#results > .card[data-hash="${A}"]`),A,{timeout:8000}).catch(()=>{});
  ok('Switch on in name search: the own words count like the name („Traktor“ finds Urlaub.jpg)',await page.evaluate(({A,B})=>!!document.querySelector(`#results > .card[data-hash="${A}"]`)&&!document.querySelector(`#results > .card[data-hash="${B}"]`),{A,B}));
  await page.evaluate(()=>{const q=document.getElementById('q');q.value='Urlaub';q.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>document.querySelectorAll('#results > .card').length===1);
  ok('Switch on: „Urlaub“ shows only the described image, not the PDF of the same name',await page.evaluate(B=>!document.querySelector(`#results > .card[data-hash="${B}"]`),B));
  await filter.click();
  await page.waitForFunction(()=>document.querySelectorAll('#results > .card').length===2);
  ok('Switch off: the PDF is back',true);
  await page.locator('[data-pb-help-toggle="bild-filter"]').click();
  ok('A tap on ⓘ closes the explanation',await page.evaluate(()=>document.getElementById('pb-bild-filter-help').hidden));
  // ---------- explorer and lightbox ----------
  await page.evaluate(()=>window.PBWorkspace.navigate('explorer'));
  await page.waitForSelector(`#explorerFiles .explorer-row[data-hash="${A}"] .pb-bild-own`,{timeout:10000});
  ok('Explorer: the photo row carries the field with the saved words',await page.evaluate(({A,B})=>document.querySelector(`#explorerFiles .explorer-row[data-hash="${A}"] .pb-bild-own`).value==='Opas Traktor hinter dem Haus'&&!document.querySelector(`#explorerFiles .explorer-row[data-hash="${B}"] .pb-bild`),{A,B}));
  await page.evaluate(A=>openLightbox(A),A);
  await page.waitForSelector('#lightboxBg.on > .pb-bild textarea');
  ok('Full-screen view: the field stands under the picture',await page.evaluate(()=>document.querySelector('#lightboxBg.on > .pb-bild textarea').value==='Opas Traktor hinter dem Haus'));
  await page.locator('#lightboxBg.on > .pb-bild textarea').click();
  ok('A tap into the field does not close the picture',await page.evaluate(()=>document.getElementById('lightboxBg').classList.contains('on')));
  await page.evaluate(()=>closeLightbox());
  // ---------- restart: words, switch state, help state ----------
  await page.evaluate(()=>{window.PBBild.filter(true);});
  await page.reload();await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBBild&&CATALOG.length===2);
  await page.evaluate(()=>{window.PBWorkspace.navigate('search');});
  await page.waitForSelector('#pb-bild-filter');
  const after=await page.evaluate(A=>({own:CATALOG.find(x=>x.hash===A).userCaption,on:window.PBBild.filterOn,pressed:document.getElementById('pb-bild-filter').getAttribute('aria-pressed'),helpHidden:document.getElementById('pb-bild-filter-help').hidden}),A);
  ok('After a restart the own words, the switch and the closed ⓘ are remembered',after.own==='Opas Traktor hinter dem Haus'&&after.on&&after.pressed==='true'&&after.helpHidden);
  // ---------- crash guard and removal ----------
  await page.evaluate(()=>{cap.state.crashes=1;cap.save();});
  await page.reload();await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBBild);await settings();
  await page.waitForFunction(()=>document.getElementById('pb-bild-model')?.dataset.state==='crashed');
  ok('After a crash the model does not start by itself and says why',(await text()).includes('zu wenig Speicher')&&await box.locator('[data-caption="retry"]').isVisible());
  await box.locator('[data-caption="retry"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-bild-model').dataset.state==='ready');
  ok('„Erneut starten“ clears the guard on purpose',await page.evaluate(()=>cap.log.includes('clearCrash')));
  page.once('dialog',d=>d.dismiss());await box.locator('[data-caption="remove"]').click();
  ok('Removing asks first; „Abbrechen“ keeps the model',await page.evaluate(()=>!cap.log.includes('remove')));
  page.once('dialog',d=>d.accept());await box.locator('[data-caption="remove"]').click();
  await page.waitForFunction(()=>document.getElementById('pb-bild-model').dataset.state==='none');
  ok('After removing, the own words stay and loading is offered again',await page.evaluate(A=>CATALOG.find(x=>x.hash===A).userCaption==='Opas Traktor hinter dem Haus',A)&&await box.locator('[data-caption="load"]').isVisible());
  await page.evaluate(()=>{cap.failNext='APP_OFFLINE';});await box.locator('[data-caption="load"]').click();
  await page.waitForFunction(()=>/Lampe oben/.test(document.querySelector('#pb-bild-model [data-s="text"]').textContent));
  ok('With the app offline the switch says how to load',true);
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('#pb-bild-model [data-caption="load"]').textContent==='Load model');
  ok('The block follows the app language',await page.evaluate(()=>document.getElementById('capEnable').closest('.note').querySelector('h3').textContent==='Image description'));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} image-description checks passed (ProCaption and the model simulated).`);
}finally{await browser?.close();server.close();}
