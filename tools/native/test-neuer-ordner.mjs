// Seite „Kategorien“: „Neuer Ordner“ als Kachel (Klaus 16.11.2026, Gerätetest 1.0.52, V7).
// Der große Kasten „Neu ordnen — Kopie in einen neuen Ordner“ ist anfangs nicht zu sehen; als letzte Kachel steht
// „+ Neuer Ordner“, ein Tipp klappt darunter eine schmale Leiste auf (Schema, Vorschau, Kopieren, ein ⓘ).
// Läuft gegen das gebaute www/ (npm run build:web). Gestellter Katalog, es wird nichts geschrieben.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_WWW||'www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep))return res.writeHead(403).end();try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const settle=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function open(width,height=800,seed=true){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],origin=`http://127.0.0.1:${server.address().port}/`;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.addInitScript(()=>{localStorage.setItem('pb_lang','de');});
  await page.goto(origin);await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBWorkspace&&window.PBHelp&&window.PBZielordner&&window.PB3D);
  if(seed)await page.evaluate(async()=>{
    const make=(l,name,path,category,extra={})=>{const t=tokens(name);return{hash:l.repeat(64),name,path,size:1000,category,type:'application/pdf',ext:'pdf',date:Date.now(),vector:buildVector(t),tf:termFreq(t),nameTokens:t,snippet:'',summary:'',tags:[],dupes:[],dirId:null,...extra};};
    const recs=[make('a','Rechnung.pdf','Docs/Rechnung.pdf','Rechnung / Verträge'),make('b','Vertrag.pdf','Docs/Vertrag.pdf','Rechnung / Verträge'),make('c','Foto.jpg','Bilder/Foto.jpg','Fotos',{ext:'jpg',type:'image/jpeg'})];
    for(const r of recs){await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);}rebuildIndex();refreshAll();
  });
  await page.locator('button[data-tab="order"]:visible').first().click();
  await page.waitForFunction(seed=>document.getElementById('panel-order').classList.contains('on')&&(!seed||document.querySelectorAll('#groups > .grp.pb-3d').length>=3),seed);await settle(page);
  return{page,errors};
}
const tile=page=>page.locator('#reorgTile'),bar=page=>page.locator('#reorgNote'),info=page=>page.locator('#reorgNote [data-pb-help-toggle="reorg"]'),text=page=>page.locator('#reorgNote [data-pb-help-content="reorg"]');
// Die Vorgabe „ⓘ anfangs offen/geschlossen“ ist nicht Sache dieser Probe: sie stellt den Zustand selbst her.
async function help(page,open){if((await info(page).getAttribute('aria-expanded')==='true')!==open)await info(page).click();await settle(page);}
async function language(page,code){
  const target=page.locator(`[data-lang="${code}"]`);
  if(!await target.isVisible())await page.locator('.native-options>summary').click();
  await target.click();await page.waitForFunction(c=>document.documentElement.lang===c,code);
  if(await page.locator('.native-options').evaluate(m=>m.open))await page.keyboard.press('Escape');
  await settle(page);
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{page,errors}=await open(1000);
  ok('The large box „Neu ordnen — Kopie in einen neuen Ordner“ is not on screen at first',await bar(page).isHidden()&&await page.locator('#reorgScheme').isHidden()&&await page.locator('#reorgPreview').isHidden()&&await page.locator('#reorgStart').isHidden());
  ok('The last tile in the row of category tiles reads „+ Neuer Ordner“ with „Kopie, aufgeräumt“',await page.locator('#groups').evaluate(groups=>{
    const last=groups.lastElementChild,shown=[...groups.children].filter(n=>n.getClientRects().length);
    return last.id==='reorgTile'&&shown[shown.length-1]===last&&shown.length===3&&last.tagName==='BUTTON'&&last.type==='button'&&last.innerText.replace(/\s+/g,' ').trim()==='+ Neuer Ordner Kopie, aufgeräumt';}));
  ok('It has a dashed border and otherwise the size and look of a category tile',await page.locator('#groups').evaluate(groups=>{
    const t=document.getElementById('reorgTile').getBoundingClientRect(),c=groups.firstElementChild.getBoundingClientRect(),style=getComputedStyle(document.getElementById('reorgTile')),other=getComputedStyle(groups.firstElementChild);
    return style.borderTopStyle==='dashed'&&other.borderTopStyle!=='dashed'&&Math.abs(t.height-c.height)<=1&&Math.abs(t.width-c.width)<=1&&Math.abs(t.top-c.top)<=1&&document.getElementById('reorgTile').classList.contains('pb-3d');}));
  ok('The tile announces a collapsed region it controls',await tile(page).getAttribute('aria-expanded')==='false'&&await tile(page).getAttribute('aria-controls')==='reorgNote');
  ok('The category tiles stay the real folder links, also after a catalogue refresh, and the new tile stays last',await (async()=>{
    await page.evaluate(()=>{window.fixtureTile=document.getElementById('reorgTile');refreshAll();window.PBWorkspace.refresh();});await page.waitForTimeout(200);await settle(page);
    return page.evaluate(()=>{const g=document.getElementById('groups');return g.querySelectorAll(':scope>button[data-overview-category]').length===2&&g.lastElementChild===fixtureTile&&g.children.length===3&&fixtureTile.classList.contains('pb-3d');});})());
  await tile(page).click();await settle(page);
  ok('A tap opens a slim bar directly under the tiles and stays on the page',await bar(page).isVisible()&&await tile(page).getAttribute('aria-expanded')==='true'&&await page.locator('#panel-order').isVisible()&&await page.locator('#panel-search').isHidden()&&await page.evaluate(()=>{
    const b=document.getElementById('reorgNote').getBoundingClientRect(),g=document.getElementById('groups').getBoundingClientRect();return b.top>=g.bottom-1&&b.top-g.bottom<40;}));
  await help(page,false);
  ok('The bar holds „Schema“, „Vorschau ansehen“ and the main button „In neuen Ordner kopieren …“ with their IDs, in one slim row',await bar(page).evaluate(note=>{
    const scheme=document.getElementById('reorgScheme'),preview=document.getElementById('reorgPreview'),start=document.getElementById('reorgStart'),label=scheme.closest('label');
    const tops=[scheme,preview,start].map(n=>{const r=n.getBoundingClientRect();return(r.top+r.bottom)/2;});
    return [scheme,preview,start].every(n=>note.contains(n)&&n.getClientRects().length)&&label.innerText.includes('Schema')&&scheme.options.length===4&&/Vorschau ansehen/.test(preview.textContent)&&/In neuen Ordner kopieren\s?…/.test(start.textContent)&&
      start.classList.contains('primary')&&!preview.classList.contains('primary')&&Math.max(...tops)-Math.min(...tops)<=14&&note.getBoundingClientRect().height<=110;}));
  ok('One ⓘ in the bar, closed: the former explanation is not on screen and no heading takes a row',await bar(page).evaluate(note=>note.querySelectorAll('[data-pb-help-toggle],[data-pb-help-details]').length===1)&&await text(page).isHidden()&&await bar(page).evaluate(note=>[...note.querySelectorAll('h2,h3')].every(h=>h.getBoundingClientRect().width<=2&&h.getBoundingClientRect().height<=2)));
  await help(page,true);
  ok('Open ⓘ: the former explanation (fresh empty target folder, originals untouched, only copies) is shown under the bar',await text(page).isVisible()&&await text(page).evaluate(n=>/Zielordner/.test(n.textContent)&&/Originale/.test(n.textContent)&&/Kopien/.test(n.textContent))&&await info(page).evaluate(b=>/Neu ordnen/.test(b.getAttribute('aria-label'))));
  await help(page,false);
  await page.locator('#reorgPreview').click();
  await page.waitForFunction(()=>document.querySelector('[data-pb-zielordner="preview"] .pb-zo-tree'));
  ok('„Vorschau ansehen“ shows the folder tree under the bar as before, not in a window',await page.evaluate(()=>{const b=document.querySelector('.pb-zielordner'),row=document.querySelector('#reorgNote .btnrow');
    return document.getElementById('reorgNote').contains(b)&&b.getBoundingClientRect().top>=row.getBoundingClientRect().bottom&&!document.getElementById('modalBg').classList.contains('on')&&[...b.querySelectorAll('.pb-zo-name')].map(n=>n.textContent).includes('Fotos');}));
  await page.locator('#reorgScheme').selectOption('type');
  ok('Changing „Schema“ still renews the preview',await page.evaluate(()=>![...document.querySelectorAll('.pb-zielordner .pb-zo-name')].map(n=>n.textContent).includes('Fotos')&&document.querySelectorAll('.pb-zielordner .pb-zo-name').length>=1));
  await page.locator('#reorgScheme').selectOption('cat');
  await tile(page).click();await settle(page);
  ok('A second tap closes the bar again',await bar(page).isHidden()&&await tile(page).getAttribute('aria-expanded')==='false'&&await page.locator('#panel-order').isVisible());
  await tile(page).focus();await page.keyboard.press('Enter');await settle(page);
  ok('The tile works from the keyboard and the earlier preview is still there',await bar(page).isVisible()&&await tile(page).getAttribute('aria-expanded')==='true'&&await page.locator('.pb-zielordner .pb-zo-tree').isVisible());
  await page.keyboard.press('Space');await settle(page);
  ok('Space closes it again',await bar(page).isHidden());
  // Sprachen
  await tile(page).click();await settle(page);
  const words={};
  for(const code of ['en','ru','pl','de']){
    await language(page,code);
    words[code]=await page.evaluate(()=>({tile:document.getElementById('reorgTile').innerText.replace(/\s+/g,' ').trim(),scheme:document.getElementById('reorgScheme').closest('label').querySelector('span').textContent.trim(),options:[...document.getElementById('reorgScheme').options].map(o=>o.textContent.trim()).join('|'),preview:document.getElementById('reorgPreview').innerText.trim(),start:document.getElementById('reorgStart').innerText.trim(),help:document.querySelector('#reorgNote [data-pb-help-static="reorg"],#reorgNote [data-pb-help-content="reorg"]').textContent.trim()}));
  }
  for(const key of ['tile','scheme','options','preview','start','help'])ok(`${key}: German, English, Russian and Polish each have their own wording`,new Set(['de','en','ru','pl'].map(c=>words[c][key])).size===4&&['de','en','ru','pl'].every(c=>words[c][key].length>3));
  ok('English reads as English',words.en.tile==='+ New folder Copy, tidied up'&&words.en.scheme==='Scheme'&&words.en.preview==='Show preview');
  ok('No emoji on the page, bar and ⓘ open',await (async()=>{await help(page,true);const shown=await page.locator('#panel-order').innerText();await help(page,false);const found=shown.match(/.{0,20}\p{Extended_Pictographic}.{0,20}/gu);if(found)console.log(found);return !found;})());
  ok('No runtime errors at 1000 px',errors.length===0||console.log(errors));
  await page.close();
  // leerer Katalog
  ({page,errors}=await open(1000,800,false));
  ok('Without any file the tile is still there and opens the bar',await tile(page).isVisible()&&await bar(page).isHidden()&&await (async()=>{await tile(page).click();await settle(page);return bar(page).isVisible();})()&&errors.length===0);
  await page.close();
  // 360 px
  ({page,errors}=await open(360,780));
  ok('360 px, bar closed: the tiles and the new tile stay inside the window',await page.locator('#panel-order').evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('#groups>*')].every(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+.5;})));
  await tile(page).click();await settle(page);
  for(const state of [false,true]){
    await help(page,state);
    ok(`360 px, bar open, ⓘ ${state?'open':'closed'}: nothing runs out sideways and every control is inside the window`,await page.locator('#panel-order').evaluate(panel=>{
      const controls=[...panel.querySelectorAll('#reorgTile,#reorgScheme,#reorgPreview,#reorgStart,#reorgNote [data-pb-help-toggle],#reorgNote [data-pb-help-content],#reorgNote')].filter(n=>n.getClientRects().length);
      return panel.scrollWidth<=panel.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1&&controls.length>=6&&controls.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+.5;});}));
  }
  await help(page,false);await page.locator('#reorgPreview').click();await page.waitForFunction(()=>document.querySelector('[data-pb-zielordner="preview"] .pb-zo-tree'));
  ok('360 px: the preview tree under the bar stays inside the window',await page.locator('.pb-zielordner').evaluate(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+.5&&document.getElementById('panel-order').scrollWidth<=document.getElementById('panel-order').clientWidth+1;}));
  ok('No runtime errors at 360 px',errors.length===0||console.log(errors));
  console.log(`${count} „Neuer Ordner“ checks passed (real app UI from www/; seeded catalogue, nothing written).`);
}finally{await browser?.close();server.close();}
