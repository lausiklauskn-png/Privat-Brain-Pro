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
  await page.locator('#explorerUp').click();
  ok('↑ goes one level up',(await page.locator('#explorerPath').textContent())==='📁 Alle Dateien › ✉️ E-Mails › 👤 Erika erika@example.invalid');
  await page.locator('#explorerHome').click();
  await tree.locator('.explorer-collapse').click();
  ok('⊟ closes the whole tree: only the main folders stay',await node('mail:').count()===0&&await kind('mail').count()===1);
  await tree.locator('[data-toggle="kind:mail"]').click();
  ok('▸ opens one folder',await node('mail:').count()===1&&(await tree.locator('[data-toggle="kind:mail"]').getAttribute('aria-expanded'))==='true');
  await tree.locator('[data-toggle="kind:mail"]').click();
  ok('▾ closes it again',await node('mail:').count()===0&&(await tree.locator('[data-toggle="kind:mail"]').getAttribute('aria-expanded'))==='false');
  await page.locator('#explorerTreeToggle').click();
  ok('The tree can be hidden for more room, and comes back',await tree.isHidden()&&(await page.locator('#explorerTreeToggle').click(),await tree.isVisible()));
  await page.locator('#explorerHome').click();
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
  await page.locator('#explorerHome').click();
  ok('The tree follows the app language',(await node('').textContent())==='📁 All files'&&(await dirs.first().locator('.explorer-meta').textContent()).includes('files'));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} explorer kind checks passed (seeded catalog, one real import).`);
}finally{await browser?.close();server.close();}
