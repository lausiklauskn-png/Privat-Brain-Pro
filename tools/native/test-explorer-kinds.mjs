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
    const add=async(name,path,extra={})=>{const toks=tokens(name);const r={hash:await sha256(new TextEncoder().encode(path).buffer),name,path,type:'',ext:name.split('.').pop(),date:Date.now(),size:1000,snippet:'',via:'test',vector:buildVector(toks),tf:termFreq(toks),summary:'',category:'',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);};
    await add('Bremsscheiben','Mail/klaus@example.invalid/Bremsscheiben',{mail:{from:'klaus@example.invalid',subject:'Bremsscheiben'},mailBody:'Link'});
    await add('Ohne Absender','Mail/?/Ohne Absender',{mail:{from:'',subject:'Ohne Absender'},mailBody:'x'});
    await add('Angebot.pdf','Mail-Anhang/Max Mustermann  max@example.invalid/Angebot.pdf');
    await add('Mietvertrag.pdf','Unterlagen/Mietvertrag.pdf');
    await add('Urlaub.jpg','Urlaub.jpg',{type:'image/jpeg'});
    rebuildIndex();refreshAll();
  });
  await page.locator('[data-tab="explorer"]').click();
  const tree=page.locator('#explorerTree');
  const kind=k=>tree.locator(`[data-kind="${k}"]`);
  ok('The tree starts with the kinds and their counts',(await kind('mail').textContent())==='✉️ E-Mails (2)'&&(await kind('doc').textContent())==='📄 Dokumente (1)'&&(await kind('photo').textContent())==='🖼️ Fotos und Bilder (1)'&&(await kind('attach').textContent())==='📎 Anhänge aus E-Mails (1)'&&await kind('note').count()===0);
  ok('"Mail" reads as saved emails, not as attachments',(await tree.locator('[data-path="Mail"]').textContent())==='✉️ Gespeicherte E-Mails (2)');
  ok('A mail without sender reads "Absender unbekannt" instead of "?"',(await tree.locator('[data-path="Mail/?"]').textContent())==='👤 Absender unbekannt (1)');
  ok('The attachment folder names the sender',(await tree.locator('[data-path="Mail-Anhang"]').textContent())==='📎 Anhänge aus E-Mails (1)'&&(await tree.locator('[data-path="Mail-Anhang/Max Mustermann  max@example.invalid"]').textContent())==='👤 Max Mustermann max@example.invalid (1)');
  ok('Sub folders are indented under their parent',await tree.locator('[data-path="Mail/?"]').evaluate(b=>getComputedStyle(b).getPropertyValue('--depth').trim()==='1'));
  await kind('attach').click();
  const rows=page.locator('#explorerFiles .explorer-row');
  ok('"Anhänge aus E-Mails" shows the attachment and whose mail it came from',await rows.count()===1&&(await rows.first().textContent()).includes('📎 Angebot.pdf')&&(await rows.first().textContent()).includes('aus der E-Mail von Max Mustermann'));
  ok('The path line says where you are',(await page.locator('#explorerPath').textContent())==='📎 Anhänge aus E-Mails');
  await kind('mail').click();
  ok('"E-Mails" shows only the saved emails',JSON.stringify((await rows.locator('strong').allTextContents()).sort())===JSON.stringify(['✉️ Bremsscheiben','✉️ Ohne Absender']));
  await tree.locator('[data-path="Mail/?"]').click();
  ok('Inside a folder the path is readable too',(await page.locator('#explorerPath').textContent())==='✉️ Gespeicherte E-Mails › 👤 Absender unbekannt');
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
  await page.waitForFunction(()=>document.querySelector('#explorerTree [data-kind="mail"]')?.textContent==='✉️ Emails (2)');
  ok('The tree follows the app language',(await tree.locator('[data-path="Mail/?"]').textContent())==='👤 Unknown sender (1)');
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} explorer kind checks passed (seeded catalog, one real import).`);
}finally{await browser?.close();server.close();}
