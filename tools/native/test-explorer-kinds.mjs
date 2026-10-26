// Explorer by type and readable folders, and the note after "Dateien hinzufügen" (Klaus 2026-10-22:
// "nicht eindeutig zugeordnet" · "er sagt nicht, wo er die hingeladen hat"). Seeded catalog plus one real import.
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
    const add=async(name,path,extra={})=>{const toks=tokens(name);const r={hash:await sha256(new TextEncoder().encode(path).buffer),name,path,type:'',ext:name.split('.').pop(),date:Date.now(),size:1000,snippet:'',via:'test',vector:buildVector(toks),tf:termFreq(toks),summary:'',category:'',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);return r;};
    await add('Bremsscheiben','Mail/klaus@example.invalid/Bremsscheiben',{mail:{from:'klaus@example.invalid',subject:'Bremsscheiben'},mailBody:'Link'});
    await add('Ohne Absender','Mail/?/Ohne Absender',{mail:{from:'',subject:'Ohne Absender'},mailBody:'x'});
    const offer=await add('Angebot März','Mail/Max Mustermann  max@example.invalid/Angebot März',{mail:{from:'Max Mustermann <max@example.invalid>',subject:'Angebot März'},mailBody:'Anbei'});
    await add('Angebot.pdf','Mail-Anhang/Max Mustermann  max@example.invalid/Angebot.pdf');
    await add('Preisliste.pdf','Mail-Anhang/Max Mustermann  max@example.invalid/Preisliste.pdf',{fromMail:offer.hash});
    await add('Foto.jpg','Mail-Anhang/Erika  erika@example.invalid/Foto.jpg',{type:'image/jpeg'});
    await add('Mietvertrag.pdf','Unterlagen/Mietvertrag.pdf');
    await add('Urlaub.jpg','Urlaub.jpg',{type:'image/jpeg'});
    rebuildIndex();refreshAll();
  });
  await page.locator('[data-tab="explorer"]').click();
  const tree=page.locator('#explorerTree');
  const kind=k=>tree.locator(`[data-kind="${k}"]`);
  const node=p=>tree.locator(`button.explorer-folder[data-path="${p}"]`);
  const rows=page.locator('#explorerFiles .explorer-row'), dirs=page.locator('#explorerFiles .explorer-dir');
  ok('The tree starts with "Alle Dateien" and below it E-Mails, Dokumente, Fotos (each file counted once)',(await node('').textContent())==='📁 Alle Dateien'&&(await kind('mail').textContent())==='✉️ E-Mails (6)'&&(await kind('doc').textContent())==='📄 Dokumente (1)'&&(await kind('photo').textContent())==='🖼️ Fotos und Bilder (1)'&&await kind('note').count()===0);
  ok('There is only one place for attachments: no second "Anhänge aus E-Mails" and no "Gespeicherte E-Mails"',!(await tree.textContent()).includes('Anhänge aus E-Mails')&&!(await tree.textContent()).includes('Gespeicherte E-Mails'));
  ok('"Alle Dateien" shows the folders and then every file',await dirs.count()===3&&await rows.count()===8);
  ok('The main folders start open: the senders appear under E-Mails',(await node('mail:max mustermann max@example.invalid').textContent())==='👤 Max Mustermann max@example.invalid (3)'&&(await node('mail:').textContent())==='👤 Absender unbekannt (1)');
  ok('Sub folders are indented under their parent',await node('mail:').evaluate(b=>getComputedStyle(b.parentElement).getPropertyValue('--depth').trim()==='2'));
  await node('mail:max mustermann max@example.invalid').click();
  ok('A sender holds his mails; a mail with attachments is a folder',(await dirs.allTextContents()).some(t=>t.startsWith('✉️ Angebot März'))&&(await dirs.first().locator('.explorer-meta').textContent()).startsWith('3 Dateien'));
  await node('msg:'+await page.evaluate(()=>CATALOG.find(r=>r.name==='Angebot März').hash)).click();
  ok('Inside the mail: the mail itself first, then its attachments (also an old attachment of the only mail of this sender)',await rows.locator('strong').allTextContents().then(a=>a[0]==='✉️ Angebot März'&&JSON.stringify(a.slice(1).sort())===JSON.stringify(['📎 Angebot.pdf','📎 Preisliste.pdf'])));
  ok('The path line says where you are and every step can be tapped',(await page.locator('#explorerPath').textContent())==='📁 Alle Dateien › ✉️ E-Mails › 👤 Max Mustermann max@example.invalid › ✉️ Angebot März'&&await page.locator('#explorerPath .explorer-crumb').count()===3);
  ok('Attachment rows are short: no long storage path',!(await rows.nth(1).locator('.explorer-meta').textContent()).includes('Mail-Anhang/'));
  await page.locator('#explorerPath .explorer-crumb').nth(1).click();
  ok('A tap on "E-Mails" in the path goes straight there',(await page.locator('#explorerPath').textContent())==='📁 Alle Dateien › ✉️ E-Mails');
  await tree.locator('[data-toggle="mail:erika erika@example.invalid"]').click();
  await node('loose:erika erika@example.invalid').click();
  ok('Attachments without a known mail stand together, with what to do',(await page.locator('#explorerPath').textContent()).endsWith('📎 Anhänge, Mail nicht zugeordnet')&&(await page.locator('.explorer-loose-hint').textContent()).includes('noch einmal ein'));
  // Sitzung 2 (Punkt 3): the small ↑ is gone; the path is the way back, and ⌂ is the choice of view.
  const home=async()=>{await page.locator('#pb-explorer-view>summary').click();await page.locator('#pb-explorer-view [data-view-path=""]').click();};
  ok('The old ↑ is no longer shown',await page.locator('#explorerUp').isHidden());
  await page.locator('#explorerPath .explorer-crumb').last().click();
  ok('The path goes one level up',(await page.locator('#explorerPath').textContent())==='📁 Alle Dateien › ✉️ E-Mails › 👤 Erika erika@example.invalid');
  await home();
  await tree.locator('.explorer-collapse').click();
  ok('⊟ closes the whole tree: only the main folders stay',await node('mail:').count()===0&&await kind('mail').count()===1);
  await tree.locator('[data-toggle="kind:mail"]').click();
  ok('▸ opens one folder',await node('mail:').count()===1&&(await tree.locator('[data-toggle="kind:mail"]').getAttribute('aria-expanded'))==='true');
  await tree.locator('[data-toggle="kind:mail"]').click();
  ok('▾ closes it again',await node('mail:').count()===0&&(await tree.locator('[data-toggle="kind:mail"]').getAttribute('aria-expanded'))==='false');
  const toggleTree=async()=>{await page.locator('#panel-explorer .pb-arrange>summary').click();await page.locator('#panel-explorer .pb-arrange [data-arrange=tree]').click();};
  await toggleTree();
  ok('The tree can be hidden for more room, and comes back',await tree.isHidden()&&(await toggleTree(),await tree.isVisible()));
  await page.evaluate(()=>PBArrange.reset('explorer'));
  await home();
  await page.fill('#explorerFilter','preisliste');
  ok('A search looks through everything below',JSON.stringify(await rows.locator('strong').allTextContents())===JSON.stringify(['📎 Preisliste.pdf'])&&await dirs.count()===0);
  await page.fill('#explorerFilter','');
  // Phone: one level at a time, folders as rows, the path to tap; no tree.
  await page.setViewportSize({width:390,height:844});
  ok('On the phone the tree is gone and the folders are rows in the list',await tree.isHidden()&&await dirs.count()===3);
  await dirs.filter({hasText:'E-Mails'}).click();
  ok('Tapping a folder row goes one level down',(await page.locator('#explorerPath').textContent())==='📁 Alle Dateien › ✉️ E-Mails'&&await dirs.count()===4);
  ok('No sideways scrolling on the phone',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:1280,height:900});
  // Adding files: afterwards the app says where they went, one tap leads there.
  await page.locator('[data-tab="intake"]').click();
  await page.setInputFiles('#fileInput',[{name:'Kaufvertrag.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n%%EOF')},{name:'Einkauf.txt',mimeType:'text/plain',buffer:Buffer.from('Milch, Brot')}]);
  await page.waitForFunction(()=>!signing&&document.getElementById('pbImportDone')&&!document.getElementById('pbImportDone').hidden);
  const done=page.locator('#pbImportDone');
  ok('After adding, the note names each kind',(await done.textContent()).includes('So ist es eingeordnet')&&(await done.locator('[data-kind="doc"]').textContent()).includes('📄 Dokumente: 1')&&(await done.locator('[data-kind="note"]').textContent()).includes('📝 Notizen: 1'));
  await done.locator('[data-show="note"]').click();
  ok('"Im Explorer zeigen" opens the explorer on that kind with the new file',await page.locator('#panel-explorer').evaluate(p=>p.classList.contains('on'))&&JSON.stringify(await rows.locator('strong').allTextContents())===JSON.stringify(['📝 Einkauf.txt']));
  await page.locator('[data-tab="intake"]').click();
  await page.setInputFiles('#fileInput',[{name:'Einkauf.txt',mimeType:'text/plain',buffer:Buffer.from('Milch, Brot')}]);
  await page.waitForFunction(()=>!signing&&/schon vorher da/.test(document.getElementById('pbImportDone').textContent));
  ok('A file added twice: the note says it was already there and still shows where',(await done.locator('[data-kind="note"]').textContent()).includes('1 schon vorher da'));
  await done.locator('.pb-import-close').click();
  ok('The note can be closed',await done.isHidden());
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.locator('[data-tab="explorer"]').click();
  await page.waitForFunction(()=>document.querySelector('#explorerTree [data-kind="mail"]')?.textContent==='✉️ Emails (6)');
  await home();
  ok('The tree follows the app language',(await node('').textContent())==='📁 All files'&&(await dirs.first().locator('.explorer-meta').textContent()).includes('files'));
  await page.waitForFunction(()=>document.querySelector('#explorerTree [data-pb-icon=person] > svg[data-icon-key=person]'));
  ok('Folder, email and sender decorations use the shared SVG line set',await tree.locator('[data-pb-icon=folder]>svg[data-icon-key=folder]').count()>0&&await tree.locator('[data-pb-icon=mail]>svg[data-icon-key=mail]').count()>0&&await tree.locator('[data-pb-icon=person]>svg[data-icon-key=person]').count()>0);
  ok('App emoji fallbacks in the tree and breadcrumb are hidden from rendering and accessibility',await page.locator('#explorerTree [data-pb-icon],#explorerPath [data-pb-icon]').evaluateAll(slots=>slots.every(slot=>{const fallback=slot.querySelector('.pb-icon-fallback'),svg=slot.querySelector('svg');return fallback?.hidden&&getComputedStyle(fallback).display==='none'&&svg?.getAttribute('aria-hidden')==='true';})));
  ok('The visible tree no longer mixes colored app glyphs with line icons',!/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(await tree.innerText()));
  ok('Content-search and check-status controls have line icons without duplicate captions',await page.locator('.explorer-content [data-pb-icon=search]>svg').count()===1&&(await page.locator('#pb-explorer-sort>summary').innerText()).trim()==='D ↓'&&await page.locator('#explorerOrder').isHidden()&&await page.locator('.explorer-toolbar .pb-check-all-button>svg[data-icon-key=shield]').count()===1);
  await page.evaluate(async()=>{
    const add=async(name,path,extra={})=>{const toks=tokens(name);const r={hash:await sha256(new TextEncoder().encode(path).buffer),name,path,type:'',ext:name.split('.').pop(),date:Date.now(),size:1000,snippet:'',via:'icon-test',vector:buildVector(toks),tf:termFreq(toks),summary:'',category:'',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);return r;};
    const unusual=await add('👤 Keep this name.weird','📁 Personal/👤 Keep this name.weird',{pruefung:{funde:[{k:'READER_INSTRUCTION'}],ungeprueft:false,zeit:Date.now()}});
    const mail=await add('✉️ Keep this subject','Mail/Person/✉️ Keep this subject',{mail:{from:'person@example.invalid',subject:'✉️ Keep this subject'},mailBody:'Only a synthetic message.',mailStar:true});
    window.iconTestHashes={file:unusual.hash,mail:mail.hash};rebuildIndex();refreshAll();PBWorkspace.restoreExplorer({path:'dir:doc:📁 Personal'});
  });
  await page.waitForFunction(()=>document.querySelector('#explorerFiles .explorer-row strong .workspace-icon>svg'));
  const unusual=page.locator('#explorerFiles .explorer-row').filter({hasText:'Keep this name.weird'}),ownFolder=node('dir:doc:📁 Personal');
  ok('An unknown file gets a neutral document SVG while its own leading emoji stays unchanged',(await unusual.locator('strong').innerText()).trim()==='👤 Keep this name.weird'&&await unusual.locator('strong [data-pb-icon=file]>svg').count()===1);
  ok('Only the generated folder decoration is replaced; a user folder keeps its own leading emoji',(await ownFolder.innerText()).trim()==='📁 Personal (1)');
  ok('Tree warnings use an actual line SVG and retain the finding count in the accessible description',await ownFolder.evaluate(b=>Boolean(b.querySelector(':scope>.native-folder-warning[data-icon-key=warning]'))&&getComputedStyle(b,'::after').content==='none'&&b.title.includes('1 with a finding')));
  await page.locator('[data-tab="mail"]').click();
  const mailRow=page.locator('[data-mail-id]').filter({hasText:'Keep this subject'});
  await mailRow.locator('.mail-avatar>svg[data-icon-key=mail]').waitFor();
  ok('A generated star uses SVG while the original email subject retains its own emoji',(await mailRow.locator('.mail-subject').innerText()).trim()==='✉️ Keep this subject'&&await mailRow.locator('.mail-subject>svg[data-icon-key=star]').count()===1);
  for(const[width,height]of [[320,740],[800,1280],[1280,800],[2560,1440]]){
    await page.setViewportSize({width,height});
    ok(`${width}px: email line icon shares the subject row and does not consume its own line`,await mailRow.evaluate(button=>{const icon=button.querySelector('.mail-avatar'),subject=button.querySelector('.mail-subject'),a=icon.getBoundingClientRect(),b=subject.getBoundingClientRect();return a.width>0&&a.height>0&&Math.abs(a.top+a.height/2-b.top-b.height/2)<3&&a.right<=b.left+1&&getComputedStyle(icon).backgroundColor==='rgba(0, 0, 0, 0)';}));
    ok(`${width}px: mail icons do not introduce horizontal page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.setViewportSize({width:1280,height:900});
  await page.locator('[data-tab="explorer"]').click();
  const beforeIconState=await page.evaluate(()=>({catalog:JSON.stringify(CATALOG),path:PBWorkspace.explorerState?.()?.path||'',icons:document.querySelectorAll('#explorerTree svg').length}));
  for(const lang of ['ru','pl','de','en'])await page.evaluate(lang=>{document.documentElement.lang=lang;},lang);
  await page.waitForFunction(()=>document.querySelector('#explorerTree [data-pb-icon=person]>svg[data-icon-key=person]'));
  ok('Locale changes preserve catalog content and keep one SVG per explicit icon slot',await page.evaluate(before=>JSON.stringify(CATALOG)===before.catalog&&[...document.querySelectorAll('[data-pb-icon]')].every(slot=>slot.querySelectorAll(':scope>svg').length===1),beforeIconState));
  for(const [view,key]of [['explorer','folder']]){
    await page.locator(`[data-tab=${view}]`).click();
    const selector=view==='explorer'?'#panel-explorer>h2':'#panel-intake>.pb-help-heading>h2,#panel-intake>h2',heading=page.locator(selector);
    const originalHeading=await heading.textContent();
    for(const lang of ['de','en'])await page.evaluate(lang=>{document.documentElement.lang=lang;PBWorkspace.refresh();},lang);
    await page.waitForFunction(({selector,key})=>{const heading=document.querySelector(selector);return heading?.querySelectorAll(':scope>svg').length===1&&heading.querySelector(':scope>svg')?.dataset.iconKey===key;},{selector,key});
    ok(`${view}: exactly one heading icon survives help wrapping, translation and redraw without changing its title`,await heading.evaluate((heading,original)=>heading.textContent===original&&heading.querySelectorAll(':scope>svg').length===1&&(!heading.parentElement.classList.contains('pb-help-heading')||heading.parentElement.querySelectorAll(':scope>.pb-help-toggle>svg').length===1),originalHeading));
  }
  await page.evaluate(()=>{const sample=PBSchutz.mailPanel({from:'person@example.invalid',subject:'Synthetic mail',text:'A synthetic message for local protection display.',attachments:[]});sample.id='icon-protection-sample';document.body.append(sample);});
  const protection=page.locator('#icon-protection-sample>summary');
  await protection.locator(':scope>svg[data-icon-key=shield]').waitFor();
  ok('The real mail-protection summary uses one line shield while preserving its status text',await protection.evaluate(summary=>summary.querySelectorAll(':scope>svg').length===1&&/^🛡/u.test(summary.textContent)&&!/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(summary.innerText)&&summary.innerText.includes('Protection')));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} explorer kind checks passed (seeded catalog, one real import).`);
}finally{await browser?.close();server.close();}
