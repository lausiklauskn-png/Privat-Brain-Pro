// The single native Sort menu drives the existing explorer sort and direction,
// including history restoration, content filtering and accessible narrow layouts.
// Browser UI with seeded catalog entries; no original files are written.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.evaluate(async()=>{
    const day=864e5,now=Date.now();
    const add=async(name,age,size,text,extra={})=>{const toks=tokens(name+' '+text);const r={hash:await sha256(new TextEncoder().encode(name).buffer),name,path:'Unterlagen/'+name,type:'application/pdf',ext:'pdf',date:now-age*day,size,snippet:text.slice(0,600),summary:'',vector:buildVector(toks),tf:termFreq(toks),category:'Dokument',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);};
    await add('Gehaltsabrechnung-September.pdf',30,120000,'Bruttolohn 3.200 Euro, Lohnsteuer, Sozialversicherung');
    await add('Arztbrief-Orthopaedie.pdf',200,80000,'Diagnose: Bandscheibenvorfall, Physiotherapie empfohlen');
    await add('Rechnung-Stadtwerke.pdf',5,40000,'Rechnungsbetrag 54,20 Euro, Zählerstand');
    await add('Aldi-Newsletter',1,3000,'Angebote der Woche',{mail:{from:'news@aldi.invalid',subject:'Angebote'},mailBody:'Angebote der Woche',mailIndex:1,path:'Mail/Aldi/Angebote'});
    rebuildIndex();refreshAll();
  });
  await page.locator('[data-tab="explorer"]').click();
  await page.waitForSelector('#pb-explorer-sort>summary');
  const names=()=>page.locator('#explorerFiles .explorer-row strong').allTextContents().then(a=>a.map(x=>x.replace(/^\S+\s/,'')));
  const menu=page.locator('#pb-explorer-sort'),summary=menu.locator(':scope>summary');
  const choose=async selector=>{if(!await menu.evaluate(e=>e.open))await summary.click();await menu.locator(selector).click();};
  const chooseSort=key=>choose(`[data-sort-key="${key}"]`),chooseDirection=reverse=>choose(`[data-sort-reverse="${reverse}"]`);
  ok('Newest file is on top by default',JSON.stringify(await names())===JSON.stringify(['Rechnung-Stadtwerke.pdf','Gehaltsabrechnung-September.pdf','Arztbrief-Orthopaedie.pdf']));
  ok('Mails from "Alle Konten" do not appear in the explorer',!(await names()).some(n=>n.includes('Aldi'))&&!(await page.locator('#explorerTree').textContent()).includes('Mail'));
  ok('The single Sort button describes the actual initial order',(await summary.innerText()).trim()==='Sortieren'&&(await summary.getAttribute('title'))==='Sortieren: Datum · Neueste oben');
  ok('Legacy select and direction remain in the DOM but are hidden',await page.locator('#explorerSort').count()===1&&await page.locator('#explorerOrder').count()===1&&!await page.locator('#explorerSort').isVisible()&&!await page.locator('#explorerOrder').isVisible());
  ok('The new button uses the shared line sort icon',await summary.locator('svg[data-icon-key="sort"]').count()===1);
  ok('A wide mouse workspace uses a flat Sort target',await summary.evaluate(e=>{const rect=e.getBoundingClientRect();return matchMedia('(min-width:1000px) and (orientation:landscape) and (any-pointer:fine)').matches&&rect.height>=32&&rect.height<=34;}));
  await chooseDirection(true);
  ok('The direction choice puts the oldest on top',JSON.stringify(await names())===JSON.stringify(['Arztbrief-Orthopaedie.pdf','Gehaltsabrechnung-September.pdf','Rechnung-Stadtwerke.pdf'])&&(await summary.getAttribute('title')).endsWith('Älteste oben'));
  ok('Choosing a direction closes its menu',!await menu.evaluate(e=>e.open));
  await chooseSort('name');
  ok('Changing the sort starts in its natural order (A → Z)',(await names())[0]==='Arztbrief-Orthopaedie.pdf'&&(await summary.getAttribute('title')).endsWith('A → Z'));
  await chooseDirection(true);
  ok('The same menu reverses names (Z → A)',(await names())[0]==='Rechnung-Stadtwerke.pdf');
  await chooseSort('size');
  ok('Size: largest on top',(await names())[0]==='Gehaltsabrechnung-September.pdf');
  await chooseDirection(true);
  ok('Size also reverses through the same menu',(await names())[0]==='Rechnung-Stadtwerke.pdf');
  await chooseSort('date');
  await page.fill('#explorerFilter','bandscheibe');
  ok('Without the content switch only names are searched',(await names()).length===0);
  await page.locator('#explorerContent').check();
  ok('"auch im Inhalt" finds the doctor\'s letter by its text',JSON.stringify(await names())===JSON.stringify(['Arztbrief-Orthopaedie.pdf']));
  await page.fill('#explorerFilter','lohnsteuer brutto');
  ok('All words must occur in the content',JSON.stringify(await names())===JSON.stringify(['Gehaltsabrechnung-September.pdf']));
  await page.fill('#explorerFilter','zahlerstand');
  ok('Umlauts do not matter',JSON.stringify(await names())===JSON.stringify(['Rechnung-Stadtwerke.pdf']));
  const state=await page.evaluate(()=>PBWorkspace.explorerState());
  ok('Back navigation keeps order and content switch',state.content===true&&state.reverse===false&&state.sort==='date');
  await page.evaluate(()=>PBWorkspace.restoreExplorer({path:'',filter:'',sort:'date',reverse:true,content:false}));
  await page.waitForFunction(()=>document.querySelector('#pb-explorer-sort>summary').title.endsWith('Älteste oben'));
  ok('Restoring a state restores the menu, ordering and content switch',(await names())[0]==='Arztbrief-Orthopaedie.pdf'&&!(await page.locator('#explorerContent').isChecked()));
  await summary.click();
  ok('The menu exposes the actual criterion and reverse state',await menu.locator('[data-sort-key="date"]').getAttribute('aria-current')==='true'&&await menu.locator('[data-sort-reverse="true"]').getAttribute('aria-pressed')==='true'&&await summary.getAttribute('aria-expanded')==='true');
  await menu.locator('[data-sort-reverse="true"]').focus();await page.keyboard.press('Escape');
  ok('Escape closes the menu and returns keyboard focus',!await menu.evaluate(e=>e.open)&&await summary.evaluate(e=>e===document.activeElement));
  await page.evaluate(()=>{document.documentElement.lang='en';PBWorkspace.refresh();});
  ok('English labels',(await summary.innerText()).trim()==='Sort'&&(await summary.getAttribute('title')).endsWith('Oldest first')&&(await page.locator('.explorer-content').textContent()).includes('also in content'));
  await page.locator('[data-tab="dash"]').click();await page.locator('[data-tab="explorer"]').click();
  ok('Navigating away and back preserves reversed date sorting',(await names())[0]==='Arztbrief-Orthopaedie.pdf'&&(await page.evaluate(()=>PBWorkspace.explorerState())).reverse===true);
  await page.evaluate(()=>PBNavigation.back());
  await page.waitForFunction(()=>document.querySelector('#panel-dash').classList.contains('on'));
  await page.evaluate(()=>PBNavigation.forward());
  await page.waitForFunction(()=>document.querySelector('#panel-explorer').classList.contains('on'));
  ok('History restores the same visible sort description',(await summary.getAttribute('title'))==='Sort: Date · Oldest first'&&(await page.evaluate(()=>PBWorkspace.explorerState())).reverse===true);
  await page.setViewportSize({width:360,height:740});
  ok('Toolbar fits a phone without sideways scrolling',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  ok('One compact Sort target is at least 44 px and the content switch stays flat',await page.evaluate(()=>{const rect=document.querySelector('#pb-explorer-sort>summary').getBoundingClientRect(),toolbar=document.querySelector('.explorer-toolbar').getBoundingClientRect(),h=document.querySelector('.explorer-content').getBoundingClientRect().height;return rect.height>=44&&rect.width<toolbar.width*.8&&h>=26&&h<=32;}));
  for(const [lang,label] of [['de','Sortieren'],['en','Sort'],['ru','Сортировка'],['pl','Sortuj']]){
    await page.evaluate(lang=>{document.documentElement.lang=lang;PBWorkspace.refresh();},lang);
    let fits=true;
    for(const width of [320,800,1280])for(const size of [20,24]){
      await page.setViewportSize({width,height:800});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);
      if(!await menu.evaluate(e=>e.open))await summary.click();
      await page.waitForFunction(()=>document.querySelector('#pb-explorer-sort-popup').getBoundingClientRect().width>0);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      fits&&=await page.evaluate(()=>{
        const control=document.querySelector('#pb-explorer-sort>summary'),popup=document.querySelector('#pb-explorer-sort-popup'),rect=popup.getBoundingClientRect();
        const target=matchMedia('(min-width:1000px) and (orientation:landscape) and (any-pointer:fine)').matches?32:44;
        return document.documentElement.scrollWidth<=innerWidth+1&&control.scrollWidth<=control.clientWidth+1&&control.getBoundingClientRect().height>=target&&rect.left>=-1&&rect.right<=innerWidth+1&&popup.scrollWidth<=popup.clientWidth+1&&[...popup.querySelectorAll('button')].every(button=>button.getBoundingClientRect().height>=target);
      });
      await summary.click();
    }
    ok(`${lang}: one-line ${label} and its dropdown fit phone, tablet and DeX at 20/24 px`,fits&&(await summary.innerText()).trim()===label);
  }
  await page.setViewportSize({width:1280,height:420});await summary.click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  ok('The dropdown stays within a short DeX window and scrolls internally',await menu.locator('.pb-explorer-sort-popup').evaluate(e=>{const rect=e.getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight+1&&e.clientHeight<e.scrollHeight;}));
  await summary.click();await page.setViewportSize({width:1280,height:800});
  await page.evaluate(async()=>{
    for(const [name,type,ext] of [['Z-Foto.jpg','image/jpeg','jpg'],['A-Notiz.txt','text/plain','txt']]){
      const toks=tokens(name),r={hash:await sha256(new TextEncoder().encode(name).buffer),name,path:'Unterlagen/'+name,type,ext,date:Date.now(),size:500,snippet:'',summary:'',vector:buildVector(toks),tf:termFreq(toks),category:'Test',dirId:null,nameTokens:toks,dupes:[],tags:[]};
      CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);
    }
    document.documentElement.lang='de';document.documentElement.style.fontSize='20px';rebuildIndex();refreshAll();
  });
  await chooseSort('type');
  const byType=await names();
  ok('Type really orders by extension, independently of name',byType[0]==='Z-Foto.jpg'&&byType.at(-1)==='A-Notiz.txt'&&(await page.evaluate(()=>PBWorkspace.explorerState())).sort==='type');
  ok('Files of the same type use the name as their tiebreak',JSON.stringify(byType.slice(1,-1))===JSON.stringify(['Arztbrief-Orthopaedie.pdf','Gehaltsabrechnung-September.pdf','Rechnung-Stadtwerke.pdf']));
  await chooseDirection(true);
  ok('Type order can be reversed and restored',(await names())[0]==='A-Notiz.txt'&&(await page.evaluate(()=>PBWorkspace.explorerState())).reverse===true);
  await page.evaluate(()=>PBWorkspace.restoreExplorer({...PBWorkspace.explorerState(),sort:'type',reverse:false}));
  await page.waitForFunction(()=>document.querySelector('#pb-explorer-sort>summary').title.includes('Typ'));
  ok('Programmatic type restore keeps the real sort key',(await names())[0]==='Z-Foto.jpg'&&(await summary.getAttribute('title'))==='Sortieren: Typ · A → Z');
  await page.evaluate(async()=>{
    for(const [name,type] of [['Z-extensiononly.csv','application/octet-stream'],['A-extensiononly.xml','application/octet-stream'],['Z-mimeonly','image/jpeg'],['A-mimeonly','text/plain']]){
      const toks=tokens(name),r={hash:await sha256(new TextEncoder().encode(name).buffer),name,path:'Unterlagen/'+name,type,ext:'',date:Date.now(),size:500,snippet:'',summary:'',vector:buildVector(toks),tf:termFreq(toks),category:'Test',dirId:null,nameTokens:toks,dupes:[],tags:[]};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);
    }rebuildIndex();refreshAll();
  });
  await page.fill('#explorerFilter','extensiononly');
  ok('Type falls back to the filename extension when metadata lacks it',JSON.stringify(await names())===JSON.stringify(['Z-extensiononly.csv','A-extensiononly.xml']));
  await page.fill('#explorerFilter','mimeonly');
  ok('Extensionless files use their recorded MIME type',JSON.stringify(await names())===JSON.stringify(['Z-mimeonly','A-mimeonly']));
  await summary.click();await page.locator('#explorerFilter').click();
  ok('A click outside closes the menu',!await menu.evaluate(e=>e.open));
  const touch=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true}),touchPage=await touch.newPage();
  try{
    await touchPage.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
    await touchPage.goto(url);await touchPage.waitForSelector('#pb-explorer-sort>summary',{state:'attached'});await touchPage.locator('[data-tab="explorer"]').click();
    await touchPage.locator('#pb-explorer-sort>summary').click();
    ok('A wide touch-only device retains 44 px Sort and choice targets',await touchPage.evaluate(()=>!matchMedia('(any-pointer:fine)').matches&&[document.querySelector('#pb-explorer-sort>summary'),...document.querySelectorAll('#pb-explorer-sort-popup button')].every(e=>e.getBoundingClientRect().height>=44)));
  }finally{await touch.close();}
  await page.setViewportSize({width:1280,height:1600});
  ok('Portrait keeps the large Sort target even with a mouse',await summary.evaluate(e=>!matchMedia('(orientation:landscape)').matches&&e.getBoundingClientRect().height>=44));
  ok('No runtime errors',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} explorer order checks passed (seeded catalog; no files written).`);
