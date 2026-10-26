// Klaus 2026-10-26, Sitzung 1: Zählerzeile (1), Mail-Ordnerleiste (4), Doppelte kurz (8), Zustand mit Speicher (9c).
// Sitzung 2: Explorer-Werkzeugzeile (3) und Anordnungs-Knopf in Explorer, Postfach und Kategorien (2).
// Sitzung 3: ⓘ-Klapper überall, anfangs offen und gemerkt (7, 9a), Schutz (9b), Tresor-Inhalt im Tresor (9d).
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
