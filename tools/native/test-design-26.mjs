// Klaus 2026-10-26, Sitzung 1: Zählerzeile (1), Mail-Ordnerleiste (4), Doppelte kurz (8), Zustand mit Speicher (9c).
// Sitzung 2: Explorer-Werkzeugzeile (3) und Anordnungs-Knopf in Explorer, Postfach und Kategorien (2).
// Sitzung 3: ⓘ-Klapper überall, anfangs offen und gemerkt (7, 9a), Schutz (9b), Tresor-Inhalt im Tresor (9d).
// Sitzung 5: 3D-Knöpfe in Übersicht und Kategorien (5), Vorschau und Zielordner als Baum unter den Knöpfen (6a).
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
  // ---------- Sitzung 2 – Punkt 3: Explorer-Werkzeugzeile ----------
  ({page,errors}=await open(1000,800));
  const tab=async name=>{await page.locator(`button[data-tab="${name}"]:visible`).first().click();await page.waitForTimeout(150);};
  const pick=async path=>{await page.locator('#pb-explorer-view>summary').click();await page.locator(`#pb-explorer-view [data-view-path="${path}"]`).click();await page.waitForTimeout(100);};
  await tab('explorer');
  const bar=await page.evaluate(()=>{const b=document.querySelector('#panel-explorer .explorer-toolbar'),shown=[...b.children].filter(c=>c.getClientRects().length);const id=c=>c.id||(c.querySelector('#explorerFilter')?'explorerFilter':c.classList.contains('explorer-order')?'content':c.classList.contains('pb-check-all-button')?'check':c.classList.contains('pb-arrange')?'arrange':c.className);
    const hidden=['explorerUp','explorerHome','explorerTreeToggle','explorerSort'].every(i=>!document.getElementById(i).getClientRects().length);
    const tops=shown.map(c=>Math.round(c.getBoundingClientRect().top));return {order:shown.map(id),hidden,oneRow:Math.max(...tops)-Math.min(...tops)<=4,emoji:/\p{Extended_Pictographic}/u.test(shown.map(c=>c.innerText).join(" "))};});
  ok('Point 3: toolbar order is choice · layout · search · sort · also in content · Prüfstand',bar.order.join()==='pb-explorer-view,arrange,explorerFilter,pb-explorer-sort,content,check');
  ok('Point 3: the small ↑, the old ⌂/◨ buttons and the long sort field are no longer shown',bar.hidden);
  ok('Point 3: at 1000 px the toolbar is one flat row without emojis',bar.oneRow&&!bar.emoji);
  const field=await page.evaluate(()=>{const f=document.getElementById('explorerFilter'),cs=getComputedStyle(f);return {ph:f.placeholder,icon:cs.backgroundImage.includes('svg'),label:!!f.closest('.explorer-toolbar').querySelector('label[for=explorerFilter]')};});
  ok('Point 3: the filter is a search icon and a field, at most a pale „Suche“',field.ph==='Suche'&&field.icon&&!field.label);
  const sortText=()=>page.locator('#pb-explorer-sort>summary').innerText().then(s=>s.trim());
  ok('Point 3: sorting shows its choice on the button, „D ↓“ = newest on top, with the meaning in the tooltip',await sortText()==='D ↓'&&(await page.locator('#pb-explorer-sort>summary').getAttribute('title')).includes('D Datum · N Name · G Größe · T Typ'));
  await page.locator('#pb-explorer-sort>summary').click();await page.locator('#pb-explorer-sort [data-sort-key="name"]').click();
  ok('Point 3: choosing Name shows „N ↑“ (A on top)',await sortText()==='N ↑'&&(await page.evaluate(()=>PBWorkspace.explorerState().sort))==='name');
  await page.locator('#pb-explorer-sort>summary').click();await page.locator('#pb-explorer-sort [data-sort-key="type"]').click();
  ok('Point 3: Typ is offered and shows „T ↑“',await sortText()==='T ↑'&&(await page.evaluate(()=>PBWorkspace.explorerState().sort))==='type');
  const viewLabel=()=>page.locator('#pb-explorer-view .pb-view-label').innerText().then(s=>s.trim());
  ok('Point 3: the choice shows what is shown, „Alle Dateien“ at the top, without repeating it in the path',await viewLabel()==='Alle Dateien'&&await page.locator('#explorerPath').isHidden());
  await page.locator('#pb-explorer-view>summary').click();await page.waitForSelector('#pb-explorer-view [data-view-path="kind:doc"]');
  const offered=await page.locator('#pb-explorer-view [data-view-path]').evaluateAll(b=>b.map(x=>x.dataset.viewPath));
  ok('Point 3: the choice offers Alle Dateien, E-Mails, PDF and Dokumente',['','kind:mail','type:pdf','kind:doc'].every(p=>offered.includes(p)));
  await page.keyboard.press('Escape');
  await pick('type:pdf');
  ok('Point 3: „PDF“ shows only PDF files and says so on the choice',await viewLabel()==='PDF'&&(await page.locator('#explorerFiles .explorer-row').count())===2);
  ok('Point 3: the path is the way back („Alle Dateien › PDF“)',await page.locator('#explorerPath').isVisible()&&(await page.locator('#explorerPath .explorer-crumb-here').innerText()).trim()==='PDF');
  await page.locator('#explorerPath .explorer-crumb').first().click();await page.waitForTimeout(100);
  ok('Point 3: a tap on „Alle Dateien“ in the path goes back',(await page.evaluate(()=>PBWorkspace.explorerState().path))===''&&await viewLabel()==='Alle Dateien');
  await pick('kind:mail');
  ok('Point 3: „E-Mails“ is shown on the choice, also one level deeper',await viewLabel()==='E-Mails'&&(await page.evaluate(()=>{const n=document.querySelector('#explorerFiles .explorer-dir');n?.click();return true;}),await page.waitForTimeout(100),await viewLabel())==='E-Mails');
  ok('Point 3: no runtime errors',errors.length===0);
  await page.close();
  // ---------- Sitzung 2 – Punkt 2: Anordnung in jeder Fenstergröße ----------
  for(const [w,h] of [[1000,800],[1000,1300],[412,900]]){
    ({page,errors}=await open(w,h));
    const seen=[];
    for(const view of ['explorer','mail','order']){
      await page.locator(`button[data-tab="${view}"]:visible`).first().click().catch(()=>page.evaluate(v=>PBWorkspace.navigate(v),view));await page.waitForTimeout(150);
      seen.push(await page.evaluate(v=>{const b=[...document.querySelectorAll(`.pb-arrange[data-arrange-view="${v}"]>summary`)].find(s=>s.getClientRects().length);if(!b)return false;const r=b.getBoundingClientRect();return r.width>=24&&r.right<=innerWidth+1&&!/\p{Extended_Pictographic}/u.test(b.textContent);},view));
    }
    ok(`Point 2: ${w}x${h}: the layout button is there in Explorer, Postfach and Kategorien`,seen.every(Boolean));
    await page.close();
  }
  ({page,errors}=await open(1000,1300));
  const arrange=async(view,key)=>{const s=page.locator(`.pb-arrange[data-arrange-view="${view}"]>summary:visible`).first();await s.click();await page.locator(`.pb-arrange[data-arrange-view="${view}"][open] [data-arrange="${key}"]`).click();await page.waitForTimeout(200);};
  const geo=()=>page.evaluate(()=>{const t=document.getElementById('explorerTree'),f=document.getElementById('explorerFiles');if(!t.getClientRects().length)return {tree:false};const a=t.getBoundingClientRect(),b=f.getBoundingClientRect();return {tree:true,side:a.right<=b.left+2&&a.width>100,stack:a.bottom<=b.top+2&&a.width>b.width*.8};});
  await tab('explorer');
  await arrange('explorer','side');
  ok('Point 2: tall split window: „nebeneinander“ puts the folder tree beside the files',(await geo()).side);
  await arrange('explorer','stack');
  ok('Point 2: „übereinander“ puts the folder tree above the files',(await geo()).stack);
  ok('Point 2: before: the main folders of the tree are open',await page.locator('#explorerTree [data-toggle^="kind:"][aria-expanded="true"]').count()>0);
  await arrange('explorer','collapse');
  ok('Point 2: „alle Ordner einklappen“ closes the whole tree',await page.evaluate(()=>[...document.querySelectorAll('#explorerTree [data-toggle]')].every(t=>t.getAttribute('aria-expanded')==='false'||t.dataset.toggle==='')));
  await arrange('explorer','tree');
  ok('Point 2: the folder tree can be switched off',!(await geo()).tree);
  await tab('mail');
  await arrange('mail','side');
  const mailSide=await page.evaluate(()=>{const l=[...document.querySelectorAll('#mailWorkspace .mail-layout')].find(x=>x.getClientRects().length),f=l.querySelector('.mail-folders').getBoundingClientRect(),li=l.querySelector('.mail-list').getBoundingClientRect(),r=l.querySelector('.mail-reader').getBoundingClientRect();return f.right<=li.left+2&&li.right<=r.left+2&&r.width>200;});
  ok('Point 2: the mailbox can show folders, list and message side by side in a tall window',mailSide);
  await tab('order');
  await arrange('order','tree');
  ok('Point 2: Kategorien can show its categories as a folder tree',await page.locator('#panel-order .pb-order-tree .pb-order-folder').count()>=2&&await page.locator('#panel-order .pb-order-tree').isVisible());
  await page.reload();await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBArrange);
  const kept=await page.evaluate(()=>({e:PBArrange.state('explorer').chosen,m:PBArrange.state('mail').chosen,o:PBArrange.state('order').chosen}));
  ok('Point 2: the choice is kept after a restart, for each view on its own',kept.e.mode==='stack'&&kept.e.tree===false&&kept.m.mode==='side'&&kept.m.tree===true&&kept.o.tree===true);
  await tab('explorer');
  ok('Point 2: after the restart the explorer still has its tree switched off',!(await geo()).tree);
  ok('Point 2: no runtime errors',errors.length===0);
  await page.close();
  // ---------- Sitzung 3 – Punkt 7, 9a, 9b, 9d: ⓘ-Klapper (anfangs offen, gemerkt), Schutz und Tresor ----------
  ({page,errors}=await open(1000,800));
  const tabTo=async name=>{await page.locator(`button[data-tab="${name}"]:visible`).first().click();await page.waitForTimeout(200);};
  const help=key=>page.locator(`[data-pb-help-toggle="${key}"]`);
  await tabTo('settings');
  const fresh=await page.evaluate(()=>['tresor','offline','catalog','attachments'].map(k=>{const b=document.querySelector(`[data-pb-help-toggle="${k}"]`),c=b&&document.getElementById(b.getAttribute('aria-controls'));return !!b&&b.getAttribute('aria-expanded')==='true'&&!!c&&!c.hidden&&!/\p{Extended_Pictographic}/u.test(b.textContent);}));
  ok('Point 7/9a: in the settings every explanation has an ⓘ and is open the first time',fresh.every(Boolean));
  await help('catalog').click();
  ok('Point 7: one tap on ⓘ closes the explanation',await help('catalog').getAttribute('aria-expanded')==='false');
  const tresorBox=await page.evaluate(()=>{const t=document.getElementById('tresorNote'),l=document.getElementById('vaultList'),n=document.getElementById('vaultNote');return !!t&&!!l&&t.contains(l)&&(!n||n.hidden||!n.getClientRects().length);});
  ok('Point 9d: the vault contents stand in the vault block right under its buttons, no separate box below',tresorBox);
  await page.reload();await page.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBHelp);
  await tabTo('settings');await page.waitForSelector('[data-pb-help-toggle="catalog"]');
  ok('Point 7: after a restart closed stays closed and open stays open',await help('catalog').getAttribute('aria-expanded')==='false'&&await help('tresor').getAttribute('aria-expanded')==='true');
  await help('catalog').click();
  ok('Point 7: a second tap opens it again',await help('catalog').getAttribute('aria-expanded')==='true');
  await tabTo('order');await page.waitForSelector('[data-pb-help-toggle="reorg"]');
  ok('Point 7: „Neu ordnen“ in the categories has its ⓘ, open at first',await help('reorg').getAttribute('aria-expanded')==='true'&&await page.locator('#reorgNote [data-pb-help-content="reorg"]').isVisible());
  ok('Point 7/9: no runtime errors',errors.length===0);
  await page.close();
  // ---------- Klaus 2026-10-26: keine Emojis, Strichgrafiken („kein Bilderbuch“) ----------
  ({page,errors}=await open(1000,900));
  await page.evaluate(async()=>{const t=tokens('Urlaub');for(const [l,name,type,category] of [['d','Urlaub.jpg','image/jpeg','Foto/Bild'],['e','Notiz.txt','text/plain','Text/Notiz']]){const r={hash:l.repeat(64),name,path:'Ablage/'+name,size:1000,category,type,ext:name.split('.').pop(),date:Date.now(),vector:buildVector(t),tf:termFreq(t),nameTokens:t,snippet:'',summary:'',tags:[],dupes:[],dirId:null,pruefung:{zeit:1,funde:[],angaben:[],hinweise:[],ungeprueft:false}};await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);}rebuildIndex();refreshAll();});
  // Visible text with a pictographic sign; ↗ and © are plain signs, the canon Siegel/Mycel modules (byte-1:1) are not ours.
  const shownEmojis=()=>page.evaluate(()=>{const found=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=walk.nextNode())){const v=n.nodeValue.replace(/[↗©™®↔↕↺↻]/g,'');if(!/\p{Extended_Pictographic}/u.test(v))continue;const e=n.parentElement;
      if(!e||e.closest('[id^="sbkim-"],[class^="sbkim-"],.pb-icon-fallback,[hidden],script,style'))continue;const r=document.createRange();r.selectNodeContents(n);const b=r.getBoundingClientRect(),cs=getComputedStyle(e);
      const own=e.getBoundingClientRect();if(b.width<1||b.height<1||own.width<=1||own.height<=1||/inset\(50%\)/.test(cs.clipPath)||cs.visibility==='hidden'||parseFloat(cs.opacity)===0)continue;found.push(v.trim().slice(0,30));}
    const tips=[...document.querySelectorAll('[title],[aria-label]')].filter(e=>e.getClientRects().length&&!e.closest('[id^="sbkim-"]')).map(e=>(e.title||'')+' '+(e.getAttribute('aria-label')||'')).filter(s=>/\p{Extended_Pictographic}/u.test(s.replace(/[↗©™®↔↕↺↻]/g,'')));
    return [...found,...tips.map(s=>'tip: '+s.trim().slice(0,30))];});
  const emojiViews={};
  for(const tab of ['search','intake','explorer','mail','overview','order','dupes','settings']){
    await page.evaluate(t=>{window.PBWorkspace.navigate(t);document.querySelectorAll('#panel-'+t+' details').forEach(d=>d.open=true);},tab);await page.waitForTimeout(250);
    emojiViews[tab]=await shownEmojis();
  }
  await page.evaluate(()=>{window.PBWorkspace.navigate('search');const d=document.querySelector('details.native-options');if(d)d.open=true;});await page.waitForTimeout(250);
  emojiViews.menu=await shownEmojis();
  const emojiLeft=Object.entries(emojiViews).filter(([,v])=>v.length).map(([k,v])=>k+': '+v.join(' | '));
  ok('No emojis on screen: bar, ☰ menu and every view use line icons'+(emojiLeft.length?' — still: '+emojiLeft.join(' ; '):''),emojiLeft.length===0);
  ok('Line icons stand where emojis were (menu lock, catalog tiles)',await page.locator('.pb-tools-lock svg').count()>0);
  ok('No emojis: no runtime errors',errors.length===0);
  // ---------- Sitzung 4 – Punkte 12–14: Bildbeschreibung (eigene Worte, Filter), flach und ohne Emoji ----------
  await page.evaluate(()=>{window.PBWorkspace.navigate('search');const q=document.getElementById('q');q.value='Urlaub';q.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForSelector('#results > .card[data-hash="'+'d'.repeat(64)+'"] .pb-bild textarea.pb-bild-own');
  const bild=await page.evaluate(()=>{const img=document.querySelector('#results > .card[data-hash="'+'d'.repeat(64)+'"]'),note=document.querySelector('#results > .card[data-hash="'+'e'.repeat(64)+'"]'),f=document.getElementById('pb-bild-filter');const own=img.querySelector('.pb-bild-own'),r=own.getBoundingClientRect();return {label:img.querySelector('.pb-bild-label-text').textContent,note:!!note&&!note.querySelector('.pb-bild'),flat:r.height<=34&&getComputedStyle(own).boxShadow==='none',filter:!!f&&f.textContent.trim()==='Bildbeschreibung'&&getComputedStyle(f).boxShadow==='none'&&f.getBoundingClientRect().height<=46,emoji:/\p{Extended_Pictographic}/u.test(img.querySelector('.pb-bild').innerText+f.textContent+f.title)};});
  ok('Point 13: every image gets a flat field „Bildbeschreibung“, a note does not; no emoji',bild.label==='Bildbeschreibung'&&bild.note&&bild.flat&&!bild.emoji);
  ok('Point 14: a flat switch „Bildbeschreibung“ stands in the search',bild.filter);
  await page.evaluate(()=>window.PBBild.setOwn('d'.repeat(64),'Strand mit Palmen'));
  ok('Point 13: own words are searched (name search with the switch on finds „Palmen“)',await page.evaluate(()=>{window.PBBild.filter(true);MODE='name';const hits=search('Palmen',null).map(h=>h.r.name);window.PBBild.filter(false);MODE='mean';return hits.includes('Urlaub.jpg');}));
  ok('Sitzung 4: no runtime errors',errors.length===0);
  await page.close();
  // ---------- Sitzung 5 – Punkt 5 und 6a: 3D-Knöpfe (Übersicht, Kategorien), Vorschau und Zielordner als Baum ----------
  ({page,errors}=await open(1280,820));
  await page.evaluate(()=>window.PBWorkspace.navigate('dash'));
  await page.waitForFunction(()=>document.querySelectorAll('#panel-dash .tile.pb-3d').length===4,null,{timeout:8000}).catch(()=>{});
  const measure=()=>page.evaluate(()=>{
    const probe=document.createElement('span');probe.style.color='var(--acc)';document.body.append(probe);const acc=getComputedStyle(probe).color;probe.remove();
    // Chromium meldet color-mix() als color(srgb r g b) mit Anteilen 0–1; eine unlesbare Farbe wird NaN, nie still Schwarz.
    const rgb=s=>{let m=/rgba?\(([^)]+)\)/.exec(s);if(m)return m[1].split(/[\s,\/]+/).slice(0,3).map(Number);m=/color\(srgb ([^)]+)\)/.exec(s);if(m)return m[1].split(/[\s\/]+/).slice(0,3).map(x=>Math.round(Number(x)*255));return [NaN,NaN,NaN];};
    const lum=([r,g,b])=>{const f=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
    const contrast=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
    const list=[...document.querySelectorAll('#panel-dash .tile')];
    return list.map(t=>{const cs=getComputedStyle(t),before=getComputedStyle(t,'::before'),r=t.getBoundingClientRect();
      const tint=parseFloat(before.opacity)||0,card=rgb(cs.backgroundColor),mix=rgb(acc).map((c,i)=>Math.round(card[i]+(c-card[i])*tint));
      const col=sel=>rgb(getComputedStyle(t.querySelector(sel)).color);
      return {pb:t.classList.contains('pb-3d'),stripe:parseFloat(before.width)<=6,tinted:before.backgroundImage.includes(acc.replace(/\s/g,''))||before.backgroundImage.includes(acc),height:r.height,
        shadow:cs.boxShadow!=='none'&&/inset/.test(cs.boxShadow),k:contrast(col('.k'),mix),v:contrast(col('.v'),mix),u:contrast(col('.u'),mix),emoji:/\p{Extended_Pictographic}/u.test(t.textContent)};});
  });
  const tiles=await measure();
  ok('Point 5: all four overview tiles are 3D buttons without the coloured stripe on the left',tiles.length===4&&tiles.every(t=>t.pb&&!t.stripe));
  ok('Point 5: the gradient comes from the chosen theme (var(--acc)) and the buttons carry an inner bevel',tiles.every(t=>t.tinted&&t.shadow));
  ok('Point 5: the tiles are smaller than before (≤ 92 px at 1280 px) and carry no emoji',tiles.every(t=>t.height<=92&&!t.emoji));
  // Zahl in Textfarbe ≥ 4,5; die grüne und rote Zahl sind groß und fett (≥ 3 nach WCAG für große Schrift, hier ≥ 4 verlangt); Nebentexte ≥ 4,5.
  ok(`Point 5: text stays readable on the tint – ink number ≥ 4.5, coloured numbers ≥ 4, title and note ≥ 4.5 (measured ${tiles.map(t=>[t.v,t.k,t.u].map(x=>x.toFixed(1)).join('/')).join(' · ')})`,tiles.every((t,i)=>(i===1||i===3?t.v>=4:t.v>=4.5)&&t.k>=4.5&&t.u>=4.5));
  // Alle Themen: Verlauf aus dem jeweiligen Akzent, Text lesbar (Attribute am <html> wie native-theme.js/themes.js sie setzen).
  const THEMES=[['klarblau',{'data-pb-theme':'klarblau'}],['graphit',{'data-pb-theme':'graphit'}],['petrol',{'data-pb-theme':'petrol'}],['nachtblau',{'data-pb-theme':'nachtblau','data-theme':'dunkel'}]];
  const before=await page.evaluate(()=>['data-pb-theme','data-look','data-theme'].map(a=>[a,document.documentElement.getAttribute(a)]));
  const perTheme=[];
  for(const [name,attrs] of THEMES){
    await page.evaluate(attrs=>{for(const a of ['data-pb-theme','data-look','data-theme'])document.documentElement.removeAttribute(a);for(const [a,v] of Object.entries(attrs))document.documentElement.setAttribute(a,v);},attrs);
    await page.waitForTimeout(80);
    const t=await measure();
    perTheme.push({name,ok:t.length===4&&t.every((x,i)=>x.tinted&&x.shadow&&(i===1||i===3?x.v>=4:x.v>=4.5)&&x.k>=4.5&&x.u>=4.5),text:t.map(x=>[x.v,x.k,x.u].map(n=>n.toFixed(1)).join('/')).join(' · ')});
  }
  await page.evaluate(before=>{for(const [a,v] of before){if(v==null)document.documentElement.removeAttribute(a);else document.documentElement.setAttribute(a,v);}},before);
  ok(`Point 5: in every theme the tint comes from that theme's accent and the text stays readable (${perTheme.map(p=>p.name+': '+p.text).join(' | ')})`,perTheme.every(p=>p.ok));
  const second=page.locator('#panel-dash .tile').nth(1),box=await second.boundingBox();
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await page.waitForTimeout(250);
  const moved=await page.evaluate(()=>{const t=document.querySelectorAll('#panel-dash .tile')[1];return {rx:t.style.getPropertyValue('--pb-rx'),transform:getComputedStyle(t).transform,tilt:window.PB3D?.maxTilt};});
  ok('Point 5: a small tilt follows the pointer (at most 3°) and the glossy highlight moves with it',/deg/.test(moved.rx)&&Math.abs(parseFloat(moved.rx))<=3&&moved.transform!=='none'&&moved.tilt===3);
  await page.mouse.move(5,400);await page.waitForTimeout(250);
  // In Ruhe trägt jeder Knopf dieselbe Matrix (Perspektive ohne Drehung); „zurückgesetzt“ heißt: wie der unberührte Nachbar.
  ok('Point 5: leaving the button resets the tilt',await page.evaluate(()=>{const [a,t]=document.querySelectorAll('#panel-dash .tile');return t.style.getPropertyValue('--pb-rx')===''&&getComputedStyle(t).transform===getComputedStyle(a).transform;}));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await page.waitForTimeout(250);
  ok('Point 5: with „weniger Bewegung“ nothing tilts or presses',await page.evaluate(()=>{const t=document.querySelectorAll('#panel-dash .tile')[1];return t.style.getPropertyValue('--pb-rx')===''&&getComputedStyle(t).transform==='none';}));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(5,400);
  // 6a
  await page.evaluate(()=>window.PBWorkspace.navigate('order'));
  await page.waitForFunction(()=>document.querySelectorAll('#groups > .grp.pb-3d').length>=2&&document.querySelector('.pb-cats-why')?.textContent.includes('Explorer'),null,{timeout:8000}).catch(()=>{});
  const cats=await page.evaluate(()=>{const g=[...document.querySelectorAll('#groups > .grp')];const why=document.querySelector('.pb-cats-why');return {n:g.length,pb:g.every(x=>x.classList.contains('pb-3d')&&/inset/.test(getComputedStyle(x).boxShadow)),why:why?.textContent||'',inHelp:!!why?.closest('[data-pb-help-static="categories-intro"]'),toggle:!!document.querySelector('#panel-order [data-pb-help-toggle="categories-intro"]')};});
  ok('Point 6a: the category tiles are the same 3D buttons',cats.n>=2&&cats.pb);
  ok('Point 6a: one sentence behind ⓘ tells Übersicht, Explorer and Kategorien apart',/Übersicht/.test(cats.why)&&/Explorer/.test(cats.why)&&/Kategorien/.test(cats.why)&&cats.inHelp&&cats.toggle);
  await page.locator('#reorgPreview').click();
  await page.waitForFunction(()=>document.querySelector('[data-pb-zielordner="preview"] .pb-zo-tree'),null,{timeout:8000}).catch(()=>{});
  const prev=await page.evaluate(()=>{const b=document.querySelector('.pb-zielordner'),row=document.querySelector('#reorgNote .btnrow'),tree=b?.querySelector('.pb-zo-tree');
    return {kind:b?.dataset.pbZielordner,modal:document.getElementById('modalBg')?.classList.contains('on'),below:!!b&&!!row&&b.getBoundingClientRect().top>=row.getBoundingClientRect().bottom,inside:!!b&&!!document.getElementById('reorgNote').contains(b),folders:tree?[...tree.querySelectorAll(':scope>li>.pb-zo-node>.pb-zo-name')].map(n=>n.textContent):[],counts:tree?[...tree.querySelectorAll(':scope>li>.pb-zo-node>.pb-zo-count')].map(n=>n.textContent):[],title:b?.querySelector('.pb-zo-title')?.textContent||''};});
  ok('Point 6a: „Vorschau ansehen“ shows the future folders as a tree directly below the buttons, not in a window',prev.kind==='preview'&&!prev.modal&&prev.below&&prev.inside&&/Vorschau/.test(prev.title));
  ok('Point 6a: the tree names every planned folder with its file count',prev.folders.length===2&&prev.folders.includes('Rechnung - Verträge')&&prev.folders.includes('E-Mail')&&prev.counts.some(c=>/^2 /.test(c))&&prev.counts.some(c=>/^1 /.test(c)));
  await page.evaluate(()=>{
    // Ein gestellter Zielordner: der vorhandene Kopierweg wählt ihn, danach wird er gelesen.
    const file=name=>({kind:'file',name});const dir=(name,entries)=>({kind:'directory',name,async *values(){for(const e of entries)yield e;},async *keys(){},async getFileHandle(){return {async createWritable(){return {async write(){},async close(){}};}};},async getDirectoryHandle(n){return dir(n,[]);}});
    window.showDirectoryPicker=async()=>dir('Neu geordnet',[dir('Rechnung - Verträge',[file('Rechnung.pdf'),file('Vertrag.pdf')]),dir('E-Mail',[file('Re Test.eml')]),file('company-brain-neuordnung.json')]);
  });
  await page.locator('#reorgStart').click();
  await page.waitForFunction(()=>document.querySelector('[data-pb-zielordner="done"] .pb-zo-tree'),null,{timeout:8000}).catch(()=>{});
  const done=await page.evaluate(()=>{const b=document.querySelector('.pb-zielordner'),tree=b?.querySelector('.pb-zo-tree');return {kind:b?.dataset.pbZielordner,title:b?.querySelector('.pb-zo-title')?.textContent||'',folders:tree?[...tree.querySelectorAll(':scope>li.pb-zo-folder>.pb-zo-node>.pb-zo-name')].map(n=>n.textContent):[],files:tree?[...tree.querySelectorAll('.pb-zo-file .pb-zo-name')].map(n=>n.textContent):[],modal:document.getElementById('modalBg')?.classList.contains('on')};});
  ok('Point 6a: after copying the same place shows the real target folder as a tree (what was actually written)',done.kind==='done'&&/Neu geordnet/.test(done.title)&&done.folders.slice().sort().join()==='E-Mail,Rechnung - Verträge'&&done.files.includes('Rechnung.pdf')&&done.files.includes('Re Test.eml')&&!done.modal);
  ok('Sitzung 5: no runtime errors',errors.length===0);
  await page.close();
  // Ohne Ordnerzugriff (Android-WebView) sagt dieselbe Stelle ehrlich, was fehlt.
  {
    const p3=await browser.newPage({viewport:{width:1000,height:800}}),origin=`http://127.0.0.1:${server.address().port}/`;
    await p3.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    await p3.addInitScript(()=>{delete window.showDirectoryPicker;});
    await p3.goto(origin);await p3.waitForFunction(()=>typeof db!=='undefined'&&db&&window.PBWorkspace&&window.PBZielordner);
    await p3.evaluate(()=>window.PBWorkspace.navigate('order'));await p3.locator('#reorgStart').click();
    await p3.waitForFunction(()=>document.querySelector('[data-pb-zielordner="note"]'),null,{timeout:8000}).catch(()=>{});
    ok('Point 6a: without folder access the note says what is missing instead of staying silent',await p3.evaluate(()=>/Ordnerzugriff/.test(document.querySelector('[data-pb-zielordner="note"]')?.textContent||'')));
    await p3.close();
  }
  // 9b needs the protection card, which only the apps show: a minimal stand-in for the device side.
  {
    const p2=await browser.newPage({viewport:{width:1000,height:1400}}),e2=[],origin=`http://127.0.0.1:${server.address().port}/`;
    p2.on('pageerror',e=>e2.push(e.message));
    await p2.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    await p2.addInitScript(()=>{const state={configured:true,unlocked:true,auto:true,folder:'Schutzlisten',files:[{name:'liste.pbv'}],malware:{updated:Date.now(),count:5},links:{updated:Date.now(),count:7,servers:2},keys:{}};
      window.Capacitor={Plugins:{ProProtect:{state:async()=>state,update:async()=>state,setAuto:async()=>state,setKey:async()=>state,checkHashes:async()=>({items:[]}),checkUrls:async()=>({items:[]}),virusTotal:async()=>({})}}};});
    await p2.goto(origin);await p2.waitForFunction(()=>window.PBSchutz&&document.querySelector('#schutzPlace [data-pb-help-toggle="protection"]'));
    await p2.locator('button[data-tab="settings"]:visible').first().click();await p2.waitForTimeout(300);
    const prot=await p2.evaluate(()=>{const card=document.getElementById('schutzPlace'),c=card.querySelector('[data-pb-help-content="protection"]');const kids=[...c.children];
      const words=s=>[...card.childNodes].filter(n=>!n.contains?.(c)&&!(n.closest&&n.closest('[data-pb-help-content]'))).map(n=>n.textContent).join(' ');
      return {order:kids.map(k=>k.tagName+'.'+k.className),outside:words(),inside:c.textContent,buttons:card.querySelectorAll(':scope>.btnrow button').length};});
    ok('Point 9b: „Abgelegt in“ and „kein vollständiger Virenscanner“ are only behind ⓘ, the controls stay visible',!/Abgelegt in|kein vollständiger Virenscanner|Kein vollständiger Virenscanner/.test(prot.outside)&&/Abgelegt in/.test(prot.inside)&&/Kein vollständiger Virenscanner/.test(prot.inside)&&prot.buttons>=3);
    ok('Point 9b: inside ⓘ the important things come first, „Abgelegt in“ last',/^P/.test(prot.order[0])&&/^UL/.test(prot.order[1])&&/Abgelegt in/.test(await p2.evaluate(()=>document.querySelector('[data-pb-help-content="protection"]').lastElementChild.textContent)));
    await p2.close();
  }
  console.log(`${count} checks passed`);
}finally{await browser?.close();server.close();}
