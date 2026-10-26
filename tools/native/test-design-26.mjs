// Klaus 2026-10-26, Sitzung 1: Zählerzeile (1), Mail-Ordnerleiste (4), Doppelte kurz (8), Zustand mit Speicher (9c).
// Läuft gegen den gebauten Webteil (www/), den Android, Windows und die PWA gemeinsam verwenden.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_WWW||'www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep))return res.writeHead(403).end();try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
async function open(width,height){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],origin=`http://127.0.0.1:${server.address().port}/`;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(origin);await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBWorkspace);
  await page.evaluate(async()=>{
    const make=(l,name,path,category,extra={})=>{const t=tokens(name);return{hash:l.repeat(64),name,path,size:1000,category,type:'application/pdf',ext:'pdf',date:Date.now(),vector:buildVector(t),tf:termFreq(t),nameTokens:t,snippet:'',summary:'',tags:[],dupes:[],dirId:null,pruefung:{zeit:1,funde:[],angaben:[],hinweise:[],ungeprueft:false},...extra};};
    const recs=[make('a','Rechnung.pdf','Docs/Rechnung.pdf','Rechnung / Verträge',{dupes:[{path:'Alt/Rechnung.pdf',dirId:null}]}),make('b','Vertrag.pdf','Docs/Vertrag.pdf','Rechnung / Verträge',{dupes:[{path:'Alt/Vertrag.pdf',dirId:null},{path:'Kopie/Vertrag.pdf',dirId:null}]}),make('c','Re Test','Mail/Re Test','E-Mail',{mail:{from:'a@example.invalid'}})];
    for(const r of recs){await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);}rebuildIndex();refreshAll();
  });
  return {page,errors};
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  // Punkt 1
  let {page,errors}=await open(1000,800);
  const row=await page.evaluate(()=>{const m=document.querySelector('#panel-search .searchmeta');const ids=[...m.querySelectorAll('.pb-meta-count')].map(s=>s.id);const b=m.querySelector('.pb-check-all-button');const tops=[...m.querySelectorAll('.pb-meta-count:not(:empty)'),b].filter(Boolean).map(e=>Math.round(e.getBoundingClientRect().top+e.getBoundingClientRect().height/2));return {ids,old:document.querySelectorAll('.search-totals').length,boxed:getComputedStyle(m.querySelector('#searchMailCount')).borderTopStyle,spread:Math.max(...tops)-Math.min(...tops),mail:m.querySelector('#searchMailCount').textContent,parent:document.getElementById('corpusInfo').parentElement===m};});
  ok('Point 1: e-mails, files, local and catalogue counts sit in the catalogue row',row.ids.join()==='searchMailCount,searchDocCount,searchLocalCount,corpusInfo'&&row.old===0&&row.parent&&/1/.test(row.mail));
  ok('Point 1: counts are plain text without boxes and share one line with the Prüfstand at 1000 px',row.boxed==='none'&&row.spread<=6);
  // Punkt 8
  await page.locator('button[data-tab="dupes"]:visible').first().click();
  await page.evaluate(()=>{const d=document.getElementById('pbDuplicateCatalog');if(d)d.open=true;});
  ok('Point 8: only „Alle“, „Auswahl“ and „Entfernen“ are visible; „Auswahl leeren“ is gone',await page.evaluate(()=>{const v=e=>e&&e.getClientRects().length>0;return v(document.getElementById('dupAll'))&&document.getElementById('dupSelectExtra').textContent.trim()==='Auswahl'&&document.getElementById('dupRemove').textContent.trim()==='Entfernen'&&!v(document.getElementById('dupClearSel'));}));
  await page.locator('#dupAll').check();
  ok('Point 8: „Alle“ selects every location',await page.evaluate(()=>[...document.querySelectorAll('.dupChk')].every(c=>c.checked)&&dupSel.size===5));
  await page.locator('#dupAll').uncheck();
  ok('Point 8: a second tap on „Alle“ selects none',await page.evaluate(()=>dupSel.size===0&&[...document.querySelectorAll('.dupChk')].every(c=>!c.checked)));
  await page.locator('#dupSelectExtra').click();
  ok('Point 8: „Auswahl“ keeps one of each and shows „Alle“ as partly selected',await page.evaluate(()=>dupSel.size===3&&document.getElementById('dupAll').indeterminate));
  page.once('dialog',d=>d.dismiss());
  await page.locator('#dupAll').check();await page.locator('#dupRemove').click();
  ok('Point 8: removing every reference of a file asks first and a refusal removes nothing',await page.evaluate(()=>CATALOG.length===3&&dupSel.size===5));
  // Punkt 9c
  await page.locator('button[data-tab="settings"]:visible').first().click();
  await page.waitForFunction(()=>document.querySelector('.pb-state-detail')?.textContent.includes('Katalog'));
  const st=await page.evaluate(()=>{const b=document.querySelector('.pb-state');return {h:b.querySelector('h3').textContent,key:document.querySelector('.pb-state-storage').previousElementSibling.textContent,meter:!!b.querySelector('.pb-state-meter[role=meter]'),detail:b.querySelector('.pb-state-detail').textContent,id:!!document.getElementById('stSize')};});
  ok('Point 9c: „Zustand“ without „ehrlich“, „Speicher“ with a meter and the catalogue size',st.h==='Zustand'&&st.key==='Speicher'&&st.meter&&/Katalog .*KB/.test(st.detail)&&st.id);
  ok('Point 1/8/9c: no runtime errors',errors.length===0);
  await page.close();
  // Punkt 4: hohes, schmales Fenster (geteilter Bildschirm)
  ({page,errors}=await open(1000,1300));
  await page.locator('button[data-tab="mail"]:visible').first().click();
  await page.evaluate(()=>{const f=document.querySelector('#mailWorkspace .mail-folders');const b=document.createElement('button');b.className='mail-button mail-more-folders';b.textContent='▸ Weitere Ordner (3)';f.insertBefore(b,f.lastElementChild);});
  const strip=await page.evaluate(()=>{const f=document.querySelector('#mailWorkspace .mail-folders'),r=f.getBoundingClientRect(),kids=[...f.children].filter(k=>k.getClientRects().length).map(k=>k.getBoundingClientRect());let overlap=false;for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){const a=kids[i],b=kids[j];if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)overlap=true;}return {overlap,inside:kids.every(k=>k.left>=r.left-1&&k.right<=r.right+1&&k.bottom<=r.bottom+1),one:[...f.children].filter(k=>k.getClientRects().length).every(b=>b.getBoundingClientRect().height<40&&b.scrollWidth<=b.clientWidth+1)};});
  ok('Point 4: folder buttons, „Weitere Ordner“ and „Neuer Ordner“ never overlap in a tall split window',!strip.overlap);
  ok('Point 4: every folder is fully visible, nothing cut off at the edge',strip.inside);
  ok('Point 4: every button keeps its words on one line and inside its own box',strip.one);
  ok('Point 4: no runtime errors',errors.length===0);
  console.log(`${count} checks passed`);
}finally{await browser?.close();server.close();}
