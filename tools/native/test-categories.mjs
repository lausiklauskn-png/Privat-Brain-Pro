// Categories by suggestion: suggested from two matching files, created with one tap, only a view,
// new files join by themselves, "Gehört nicht hierher" sticks. Seeded catalog; no files written.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
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
  await page.addInitScript(()=>{
    const day=864e5,now=Date.now();
    window.addDoc=async(name,age,text,extra={})=>{const toks=tokens(name+' '+text);const r={hash:await sha256(new TextEncoder().encode(name).buffer),name,path:'Unterlagen/'+name,type:'application/pdf',ext:'pdf',date:now-age*day,size:1000,snippet:text.slice(0,600),summary:'',vector:buildVector(toks),tf:termFreq(toks),category:'Dokument',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);return r;};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&window.PBExplorerTopics&&typeof db!=='undefined'&&db);
  await page.evaluate(async()=>{
    await addDoc('Rechnung-Stadtwerke-Oktober.pdf',5,'Rechnungsnummer 4711, Rechnungsbetrag 54,20 Euro, zahlbar bis 30.10.');
    await addDoc('Telefon-Oktober.pdf',8,'Ihre Rechnung: Gesamtbetrag 29,99 Euro inkl. MwSt, Kundennummer 123');
    await addDoc('Baumarkt-Beleg.pdf',12,'Beleg Nr. 88 Gesamtbetrag 12,00 Euro MwSt 19 %');
    await addDoc('Gehaltsabrechnung-September.pdf',30,'Bruttolohn 3.200 Euro, Lohnsteuer, Sozialversicherung, Auszahlungsbetrag');
    await addDoc('Lohnabrechnung-August.pdf',60,'Bruttolohn 3.150 Euro, Lohnsteuer, Steuerklasse 1');
    await addDoc('Arztbrief-Orthopaedie.pdf',200,'Diagnose: Bandscheibenvorfall, Physiotherapie empfohlen');
    await addDoc('Urlaubsfoto-Notizen.pdf',3,'Strand, Sonne, Eis essen');
    await addDoc('Newsletter',1,'Rechnung? Nein, Angebote',{mail:{from:'news@x.invalid'},mailBody:'Rechnungsbetrag Gesamtbetrag MwSt',mailIndex:1,path:'Mail/x/Newsletter'});
    rebuildIndex();refreshAll();
  });
  await page.locator('[data-tab="explorer"]').click();
  const suggest=page.locator('[data-topic-suggest]');
  ok('Invoices and pay slips are suggested; a single doctor\'s letter is not yet',JSON.stringify(await suggest.evaluateAll(n=>n.map(x=>x.dataset.topicSuggest)))===JSON.stringify(['invoice','salary']));
  ok('Suggestion names count, examples and that files stay where they are',(await suggest.first().textContent()).includes('3 Dateien sehen aus wie „Rechnungen“')&&(await suggest.first().textContent()).includes('Dateien bleiben, wo sie sind'));
  ok('Nothing is created before Klaus decides',await page.locator('#explorerTree [data-topic]').count()===0);
  const before=await page.evaluate(()=>JSON.stringify(CATALOG.map(r=>[r.hash,r.path,r.dirId])));
  await suggest.first().getByRole('button',{name:'Anlegen'}).click();
  ok('"Anlegen" adds "🧾 Rechnungen (3)" to the folder tree',(await page.locator('#explorerTree [data-topic=invoice]').textContent())==='🧾 Rechnungen (3)');
  ok('No file was moved or renamed',await page.evaluate(()=>JSON.stringify(CATALOG.map(r=>[r.hash,r.path,r.dirId])))===before);
  await page.locator('#explorerTree [data-topic=invoice]').click();
  const names=()=>page.locator('#explorerFiles .explorer-row strong').allTextContents().then(a=>a.map(x=>x.replace(/^\S+\s/,'')));
  ok('The category shows exactly the invoices, newest on top',JSON.stringify(await names())===JSON.stringify(['Rechnung-Stadtwerke-Oktober.pdf','Telefon-Oktober.pdf','Baumarkt-Beleg.pdf']));
  ok('Mails from "Alle Konten" stay out of categories',!(await names()).includes('Newsletter'));
  await page.evaluate(async()=>{await addDoc('Rechnung-Versand.pdf',0,'Rechnungsnummer 99, zahlbar bis 5.11.');PBWorkspace.refresh();});
  ok('A new matching file joins by itself',(await names())[0]==='Rechnung-Versand.pdf'&&(await page.locator('#explorerTree [data-topic=invoice]').textContent())==='🧾 Rechnungen (4)');
  await page.locator('#explorerFiles .explorer-row').filter({hasText:'Baumarkt-Beleg.pdf'}).locator('[data-topic-not=invoice]').click();
  await page.waitForFunction(()=>!document.querySelector('#explorerFiles')?.textContent.includes('Baumarkt-Beleg.pdf'));
  ok('"Gehört nicht hierher" takes the file out and keeps it in the catalog',await page.evaluate(()=>{const r=CATALOG.find(x=>x.name==='Baumarkt-Beleg.pdf');return r&&r.topicNo.includes('invoice');}));
  await page.reload();await page.waitForFunction(()=>window.PBExplorerTopics&&typeof db!=='undefined'&&db&&CATALOG.length>=8);
  await page.locator('[data-tab="explorer"]').click();await page.locator('#explorerTree [data-topic=invoice]').click();
  ok('After restart the category and the correction remain',(await page.locator('#explorerTree [data-topic=invoice]').textContent())==='🧾 Rechnungen (3)'&&!(await names()).includes('Baumarkt-Beleg.pdf'));
  await page.fill('#explorerFilter','stadtwerke');
  ok('The explorer search also works inside a category',JSON.stringify(await names())===JSON.stringify(['Rechnung-Stadtwerke-Oktober.pdf']));
  await page.fill('#explorerFilter','');
  await page.locator('#explorerHome').click();
  await page.locator('[data-topic-suggest=salary]').getByRole('button',{name:'Nein danke'}).click();
  ok('"Nein danke" removes the suggestion for good',await page.locator('[data-topic-suggest]').count()===0);
  await page.evaluate(async()=>{await addDoc('Befund-Labor.pdf',2,'Befund Laborwerte, Diagnose, Praxis Dr. med. Muster');PBWorkspace.refresh();});
  ok('A second health paper brings the health suggestion',await page.locator('[data-topic-suggest=health]').count()===1);
  await page.locator('#explorerTree [data-topic=invoice]').click();
  await page.getByRole('button',{name:'Kategorie auflösen'}).click();
  ok('"Kategorie auflösen" removes only the view, all files remain',await page.locator('#explorerTree [data-topic=invoice]').count()===0&&await page.evaluate(()=>CATALOG.some(r=>r.name==='Rechnung-Stadtwerke-Oktober.pdf')));
  ok('After dissolving, invoices are not suggested again straight away',await page.locator('[data-topic-suggest=invoice]').count()===0);
  await page.locator('[data-topic-again]').click();
  ok('"Abgelehnte Vorschläge wieder zeigen" brings them back',await page.locator('[data-topic-suggest=invoice]').count()===1&&await page.locator('[data-topic-suggest=salary]').count()===1);
  const countIn=async()=>Number((await page.locator('[data-topic-suggest=invoice]').textContent()).match(/\d+/)[0]);
  const n0=await countIn();
  await page.evaluate(async()=>{await addDoc('Rechnung-Handwerker.pdf',1,'Betrag laut Anlage, IBAN DE00 1234');PBWorkspace.refresh();});
  ok('A file recognised mainly by its name ("Rechnung-…") is counted',await countIn()===n0+1);
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('[data-topic-suggest]')?.textContent.includes('look like'));
  ok('English texts',(await page.locator('[data-topic-suggest=invoice]').textContent()).includes('look like “Invoices”')&&(await page.locator('[data-topic-suggest=invoice]').textContent()).includes('Create category'));
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.setViewportSize({width:360,height:740});
  if(process.env.PB_CAPTURE_DESIGN==='1'){await mkdir('docs/design/kategorien',{recursive:true});await page.screenshot({path:'docs/design/kategorien/vorschlag.png'});}
  ok('Fits a phone without sideways scrolling',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  ok('Flat buttons in the suggestion (≤ 32 px)',await page.evaluate(()=>[...document.querySelectorAll('[data-topic-suggest] button')].every(b=>b.getBoundingClientRect().height<=32)));
  ok('No runtime errors',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} category checks passed (seeded catalog; no files written).`);
