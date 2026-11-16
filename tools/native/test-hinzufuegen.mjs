// Seite „Hinzufügen“ nach dem Vorbild der Familienakte (Klaus 16.11.2026, Gerätetest 1.0.52, V3):
// eine Überschrift mit einem ⓘ, eine große Ablagefläche mit den Knöpfen, die Ablage als eine Zeile, darunter
// „Gerade hinzugefügt“ mit dem Zustand je Datei. Läuft gegen das gebaute www/ (npm run build:web).
// Simulation im Browser: Ordner- und Datei-Brücke sind gestellt, kein Gerät.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const toggle=page=>page.locator('#panel-intake [data-pb-help-toggle="import-drop"]'),region=page=>page.locator('[data-pb-help-content="import-drop"]');
const settle=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
// Die Vorgabe „ⓘ anfangs offen/geschlossen“ ist nicht Sache dieser Probe: sie stellt den Zustand selbst her.
async function help(page,open){if((await toggle(page).getAttribute('aria-expanded')==='true')!==open)await toggle(page).click();await settle(page);}
async function language(page,code){
  const target=page.locator(`[data-lang="${code}"]`);
  if(!await target.isVisible())await page.locator('.native-options>summary').click();
  await target.click();await page.waitForFunction(c=>document.documentElement.lang===c,code);
  if(await page.locator('.native-options').evaluate(m=>m.open))await page.keyboard.press('Escape');
  await settle(page);
}
const rows=page=>page.evaluate(()=>[...document.querySelectorAll('#recentList>li')].map(li=>({name:li.querySelector('.ra-name')?.textContent||'',tag:li.querySelector('.ra-tag')?.textContent||'',state:li.dataset.state||'',kern:li.querySelector('.ra-kern')?.textContent||'',button:li.querySelector('.ra-name')?.tagName==='BUTTON'})));
async function open(width,height=900){
  const page=await browser.newPage({viewport:{width,height}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{
    localStorage.setItem('pb_lang','de');localStorage.setItem('pb_fs_ok','1');
    const slow=()=>new Promise(r=>setTimeout(r,window.fixtureSlow||0));let n=0;window.fixtureFail='';window.fixtureSlow=0;
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'fixture'};}},
      ProVault:{async state(){return{configured:false,unlocked:false,attachments:0,attachmentBytes:0};}},
      ProFolders:{async state(){return{enabled:false,name:''};},async chooseLibrary(){return{cancelled:true};},async chooseSource(){return{cancelled:true};},async finishSource(){return{ok:true};},async pause(){return{enabled:false,name:''};},async copyOriginal(){return{copied:false};}},
      ProFiles:{async listOriginals(){return{items:[]};},
        async beginImport(args){if(window.fixtureFail&&String(args?.name||'').includes(window.fixtureFail))throw new Error('Speicher voll (gestellt)');return{ticket:String(++n)};},
        async appendImport(){await slow();return{ok:true};},async finishImport(){return{ok:true};},async abortImport(){return{ok:true};},
        async originalInfo(){return{missing:true};},async readOriginal(){return{data:''};},async open(){return{ok:true};}}}};
    window.tagSeen=[];
    const watch=()=>{const list=document.getElementById('recentList');if(!list)return;
      new MutationObserver(()=>{for(const t of list.querySelectorAll('.ra-tag'))tagSeen.push(t.textContent);}).observe(list,{childList:true,characterData:true,subtree:true});};
    document.addEventListener('DOMContentLoaded',watch);
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBHelp&&window.PBFolders&&window.PBOriginals&&window.PBWorkspace&&typeof signBatch==='function'&&typeof db!=='undefined'&&db);
  await navigateTo(page,'intake');await page.locator('#vaultLine').waitFor({state:'attached'});await settle(page);
  return{page,errors};
}
const add=async(page,files,total)=>{await page.setInputFiles('#fileInput',files.map(([name,body])=>({name,mimeType:'text/plain',buffer:Buffer.from(body)})));await page.waitForFunction(t=>!signing&&document.querySelectorAll('#recentList>li').length>=Math.min(t,30)&&Number(document.getElementById('recentCount').textContent)===t,total,{timeout:30000});await settle(page);};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{page,errors}=await open(1280);
  // 1 · eine Überschrift, ein ⓘ
  ok('One visible heading „Dateien hinzufügen“ names the page and labels the panel',await page.locator('#panel-intake').evaluate(panel=>{
    const shown=[...panel.querySelectorAll('h2,h3')].filter(h=>h.getClientRects().length),h=shown[0];
    return shown.length===1&&h.innerText.trim()==='Dateien hinzufügen'&&panel.getAttribute('aria-labelledby')===h.id;}));
  ok('Exactly one ⓘ on the page, beside that heading; the separate „Deine lokale Ablage“ box is gone',await page.locator('#panel-intake').evaluate(panel=>{
    const all=[...panel.querySelectorAll('[data-pb-help-toggle],[data-pb-help-details]')],b=all[0],h=panel.querySelector('#pb-intake-heading');
    return all.length===1&&b.dataset.pbHelpToggle==='import-drop'&&b.parentElement===h.parentElement&&Math.abs((b.getBoundingClientRect().top+b.getBoundingClientRect().bottom)/2-(h.getBoundingClientRect().top+h.getBoundingClientRect().bottom)/2)<12&&!panel.querySelector('.library-setup')&&!panel.querySelector('.note');}));
  await help(page,false);
  ok('Closed ⓘ: no explanation is on screen, the actions are',await region(page).evaluate(n=>n.hidden)&&await page.locator('#panel-intake').evaluate(p=>!['[data-ws=libraryHelp]','#fsHint','[data-i18n=dropDnd]','[data-i18n=dropP]','.native-import-reassurance'].some(s=>p.querySelector(s)?.getClientRects().length))&&await page.locator('#pickFiles').isVisible());
  await help(page,true);
  ok('Open ⓘ: every former explanation of both boxes stands behind it',await region(page).evaluate(n=>{
    const has=s=>{const e=n.querySelector(s);return Boolean(e&&e.getClientRects().length&&e.textContent.trim());},t=n.textContent;
    return has('[data-ws=libraryHelp]')&&has('#fsHint')&&has('[data-i18n=dropDnd]')&&has('[data-i18n=dropP]')&&['Liest nur','Schlägt vor','Bewegt nichts'].every(w=>t.includes(w));}));
  await help(page,false);
  // 2 · große Ablagefläche
  ok('A large dashed drop area carries the sentence, the kinds and the three buttons, „Dateien wählen“ first as the main button',await page.locator('#dropZone').evaluate(zone=>{
    const style=getComputedStyle(zone),r=zone.getBoundingClientRect(),title=zone.querySelector('.drop-title'),sub=zone.querySelector('.drop-sub'),buttons=[...zone.querySelectorAll('.btnrow>button')].filter(b=>b.getClientRects().length);
    return style.borderTopStyle==='dashed'&&r.height>=110&&r.width>=600&&title.textContent.trim()==='Dateien oder Ordner hierher ziehen'&&Number(getComputedStyle(title).fontWeight)>=600&&sub.textContent.trim()==='PDF, Bild, Text, Mail oder ganze Ordner'&&
      parseFloat(getComputedStyle(sub).fontSize)<parseFloat(getComputedStyle(title).fontSize)&&buttons.map(b=>b.id).join()==='pickFiles,pickDir,pickMail'&&buttons[0].classList.contains('primary')&&!buttons[1].classList.contains('primary')&&
      /Dateien wählen/.test(buttons[0].textContent)&&/Ordner verbinden/.test(buttons[1].textContent)&&/Mails \(\.mbox ?\/ ?\.eml\)/.test(buttons[2].textContent)&&document.getElementById('fileInput').type==='file';}));
  const drag=type=>page.evaluate(type=>{const e=new DragEvent(type,{bubbles:true,cancelable:true,dataTransfer:new DataTransfer()});document.getElementById('dropZone').dispatchEvent(e);},type);
  const calm=await page.locator('#dropZone').evaluate(z=>getComputedStyle(z).backgroundColor+getComputedStyle(z).borderTopColor);
  await drag('dragenter');await drag('dragover');await page.waitForTimeout(350);   // the highlight fades in
  ok('Dragging over the area highlights it and says „Loslassen zum Hinzufügen“',await page.locator('#dropZone .drop-release').isVisible()&&(await page.locator('#dropZone .drop-release').textContent()).trim()==='Loslassen zum Hinzufügen'&&await page.locator('#dropZone').evaluate((z,calm)=>getComputedStyle(z).backgroundColor+getComputedStyle(z).borderTopColor!==calm,calm));
  await drag('dragleave');await page.waitForTimeout(350);
  ok('Leaving the area ends the highlight',await page.locator('#dropZone .drop-release').isHidden()&&await page.locator('#dropZone .drop-title').isVisible());
  const chooser=page.waitForEvent('filechooser');await page.locator('#pickFiles').click();
  ok('„Dateien wählen“ keeps its ID and opens the real file chooser',(await chooser).isMultiple());
  // 3 · Ablage als eine Zeile
  ok('The library is one line under the area: state sentence left, small „Ablageordner wählen“ right, no box and no heading',await page.locator('#libraryRow').evaluate(row=>{
    const status=document.getElementById('libraryStatus'),choose=document.getElementById('chooseLibrary'),zone=document.getElementById('dropZone'),s=status.getBoundingClientRect(),c=choose.getBoundingClientRect(),style=getComputedStyle(row);
    return row.contains(status)&&row.contains(choose)&&!row.querySelector('h2,h3')&&!row.closest('.note')&&style.borderTopWidth==='0px'&&row.getBoundingClientRect().top>=zone.getBoundingClientRect().bottom&&
      status.textContent.trim().startsWith('Ablage:')&&status.getAttribute('role')==='status'&&!status.closest('[data-pb-help-content]')&&c.left>=s.right-1&&c.top<s.bottom&&c.bottom>s.top&&c.height<=34&&!choose.classList.contains('primary');}));
  ok('Storage place and „Einstellungen“ stay reachable, small, in the same line group',await page.locator('#vaultLine').evaluate(line=>{const row=document.getElementById('libraryRow'),b=line.querySelector('button');return row.contains(line)&&line.getClientRects().length>0&&!line.closest('[data-pb-help-content]')&&Boolean(b)&&b.getBoundingClientRect().height<=34&&row.getBoundingClientRect().height<=110;}));
  await page.locator('#vaultLine button').click();
  ok('That small button still leads to the settings',await page.locator('#panel-settings').isVisible());
  await navigateTo(page,'intake');
  // 4 · Gerade hinzugefügt
  ok('„Gerade hinzugefügt“ is absent while nothing was added',await page.locator('#recentAdded').isHidden()&&await page.locator('#recentList>li').count()===0);
  await page.evaluate(()=>{window.fixtureSlow=60;window.fixtureOpened=[];window.openFile=async hash=>{fixtureOpened.push(hash);};});
  await add(page,[['Rechnung Stadtwerke.txt','Rechnung der Stadtwerke über Strom. '.repeat(9000)],['Notiz.txt','Eine kurze Notiz zum Urlaub.']],2);
  let list=await rows(page);
  ok('After adding two files the list appears under the library line with its count',await page.locator('#recentAdded').isVisible()&&(await page.locator('#recentAdded h3').textContent()).replace(/\s+/g,' ').trim()==='Gerade hinzugefügt · 2'&&await page.evaluate(()=>document.getElementById('recentAdded').getBoundingClientRect().top>=document.getElementById('libraryRow').getBoundingClientRect().bottom-1));
  ok('Newest first, each with its name and the badge „eingelesen“',list.length===2&&list[0].name==='Notiz.txt'&&list[1].name==='Rechnung Stadtwerke.txt'&&list.every(r=>r.tag==='eingelesen'&&r.state==='done'));
  ok('While a file was being read its badge said so, with the step the import reported',await page.evaluate(()=>tagSeen.some(t=>/wird gelesen|Kopie wird abgelegt|Text wird gelesen|wird signiert/.test(t))&&tagSeen.some(t=>t.includes('Kopie wird abgelegt'))));
  await page.evaluate(()=>{window.fixtureSlow=0;});
  await page.locator('#recentList>li .ra-name').first().click();
  ok('A tap on the name opens the file like a search hit (openFile with its hash)',await page.evaluate(()=>fixtureOpened.length===1&&fixtureOpened[0]===CATALOG.find(r=>r.name==='Notiz.txt').hash));
  await page.evaluate(()=>{const r=CATALOG.find(x=>x.name==='Rechnung Stadtwerke.txt');r.kern={v:'probe',art:'Rechnung',artSicher:true,bereich:'Energie',bereichSicher:true};window.dispatchEvent(new CustomEvent('pb-kern-geordnet',{detail:{n:1}}));});
  await settle(page);list=await rows(page);
  ok('Kind and area from the sorting core (rec.kern) stand beside the badge once known',list[1].kern==='Rechnung · Energie'&&list[0].kern!=='Rechnung · Energie');
  await add(page,[['Notiz.txt','Eine kurze Notiz zum Urlaub.']],3);list=await rows(page);
  ok('The same content again is listed as „doppelt, schon vorhanden“, nothing new in the catalogue',list.length===3&&list[0].name==='Notiz.txt'&&list[0].tag==='doppelt, schon vorhanden'&&list[0].state==='dup'&&await page.evaluate(()=>CATALOG.length===2));
  await page.evaluate(()=>{window.fixtureFail='Kaputt';});
  await add(page,[['Kaputt.txt','Diese Datei lässt sich nicht ablegen.']],4);list=await rows(page);
  ok('A file the import could not take says „nicht gelesen“ with the reason and is not offered for opening',list[0].name==='Kaputt.txt'&&list[0].state==='fail'&&list[0].tag.startsWith('nicht gelesen: ')&&list[0].tag.length>'nicht gelesen: '.length&&!list[0].button&&await page.evaluate(()=>CATALOG.length===2));
  await page.evaluate(()=>{window.fixtureFail='';});
  // Sprachen
  const words={};
  for(const code of ['en','ru','pl','de']){
    await language(page,code);
    words[code]=await page.evaluate(()=>({head:document.querySelector('#recentAdded h3').textContent.replace(/\s+/g,' ').trim(),tags:[...document.querySelectorAll('#recentList .ra-tag')].map(t=>t.textContent).join('|'),title:document.querySelector('#dropZone .drop-title').textContent.trim(),sub:document.querySelector('#dropZone .drop-sub').textContent.trim(),release:document.querySelector('#dropZone .drop-release').textContent.trim(),status:document.getElementById('libraryStatus').textContent.trim(),heading:document.getElementById('pb-intake-heading').innerText.trim()}));
  }
  for(const key of ['head','tags','title','sub','release','status','heading'])ok(`${key}: German, English, Russian and Polish each have their own wording`,new Set(['de','en','ru','pl'].map(c=>words[c][key])).size===4&&['de','en','ru','pl'].every(c=>words[c][key].length>3));
  ok('English reads as English',words.en.head==='Just added · 4'&&words.en.title==='Drag files or folders here'&&words.en.tags.includes('duplicate, already there')&&words.en.tags.includes('not read: '));
  // höchstens 30
  await add(page,Array.from({length:32},(_,i)=>['Blatt '+String(i+1).padStart(2,'0')+'.txt','Blatt Nummer '+(i+1)+' mit eigenem Inhalt '+'x'.repeat(i+1)]),36);list=await rows(page);
  ok('At most 30 rows are shown, newest first, then „… und N weitere“',list.length===30&&list[0].name==='Blatt 32.txt'&&(await page.locator('#recentMore').textContent()).trim()==='… und 6 weitere'&&await page.locator('#recentMore').isVisible()&&(await page.locator('#recentCount').textContent())==='36');
  // Die vorhandene Meldung „So ist es eingeordnet“ (#pbImportDone, Zeile „Geprüft“ aus native-check.js) gehört nicht zu diesem Umbau und wird hier nicht beurteilt.
  ok('No emoji in the heading, the explanations, the drop area, the library line and the list, also with the ⓘ open',await (async()=>{await help(page,true);const text=await page.locator('#panel-intake').evaluate(panel=>[...panel.querySelectorAll('#drop>.pb-help-heading,[data-pb-help-content="import-drop"],#dropZone,#libraryRow,#recentAdded')].map(n=>n.innerText).join('\n'));await help(page,false);const found=text.match(/.{0,20}\p{Extended_Pictographic}.{0,20}/gu);if(found)console.log(found);return !found;})());
  ok('No runtime errors at 1280 px',errors.length===0||console.log(errors));
  await page.reload();await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db&&CATALOG.length>=30);await navigateTo(page,'intake');await settle(page);
  ok('The list is for this sitting only: after a restart the catalogue is there, the list is not',await page.locator('#recentAdded').isHidden()&&await page.locator('#recentList>li').count()===0);
  await page.close();
  // 360 px
  ({page,errors}=await open(360,780));
  for(const state of [false,true]){
    await help(page,state);
    ok(`360 px, ⓘ ${state?'open':'closed'}: nothing runs out sideways and every control is inside the window`,await page.locator('#panel-intake').evaluate(panel=>{
      const controls=[...panel.querySelectorAll('#pickFiles,#pickDir,#pickMail,#chooseLibrary,#vaultLine button,[data-pb-help-toggle],#dropZone,#libraryStatus,[data-pb-help-content]')].filter(n=>n.getClientRects().length);
      return panel.scrollWidth<=panel.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1&&controls.length>=7&&controls.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+.5;});}));
  }
  await help(page,false);
  await add(page,[['Ein sehr langer Dateiname für eine Rechnung der Stadtwerke aus dem Jahr 2026 Seite 1 von 3.txt','Langer Name, kurzer Inhalt.'],['Kurz.txt','Kurz und gut.']],2);
  ok('360 px: the list rows stay inside the window, long names are shortened, the badge stays readable',await page.locator('#recentAdded').evaluate(box=>{
    const all=[...box.querySelectorAll('li,.ra-name,.ra-tag')];
    return document.getElementById('panel-intake').scrollWidth<=document.getElementById('panel-intake').clientWidth+1&&all.every(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+.5;})&&[...box.querySelectorAll('.ra-tag')].every(t=>t.scrollWidth<=t.clientWidth+1);}));
  ok('No runtime errors at 360 px',errors.length===0||console.log(errors));
  console.log(`${count} „Hinzufügen“ checks passed (real app UI from www/; folder and file bridge simulated, no device).`);
}finally{await browser?.close();server.close();}
