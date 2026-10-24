// 🛡 Every added file is checked (Klaus 2026-10-22: "ich sehe überhaupt nicht, ob sie geprüft wurde").
// Real checker core (modules/pruefer-anhang.js) with the bundled pdf.js; Klaus' test templates 0D and H5.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
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
  const fx=n=>readFileSync(new URL('./fixtures/'+n,import.meta.url));
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&window.PBCheck&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="intake"]').click();
  await page.setInputFiles('#fileInput',[
    {name:'Vorlage-0D-PDF-versteckter-Text.pdf',mimeType:'application/pdf',buffer:fx('Vorlage-0D-PDF-versteckter-Text.pdf')},
    {name:'Vorlage-H5-Bild-als-PDF-getarnt.pdf',mimeType:'application/pdf',buffer:fx('Vorlage-H5-Bild-als-PDF-getarnt.pdf')},
    {name:'Einkauf.txt',mimeType:'text/plain',buffer:Buffer.from('Milch, Brot und Butter fuer das Wochenende.')}]);
  await page.waitForFunction(()=>!signing&&document.querySelector('#pbImportDone .pb-check-summary'),null,{timeout:120000});
  const sum=page.locator('#pbImportDone .pb-check-summary');
  ok('After adding, the note says how the files were checked',(await sum.textContent()).includes('⚠ 2 mit Fund')&&(await sum.textContent()).includes('✓ 1 ohne Fund'));
  const rec=n=>page.evaluate(n=>CATALOG.find(r=>r.name===n)?.pruefung,n);
  const d0=await rec('Vorlage-0D-PDF-versteckter-Text.pdf'),h5=await rec('Vorlage-H5-Bild-als-PDF-getarnt.pdf'),txt=await rec('Einkauf.txt');
  ok('0D: the hidden instruction to an AI is found, with its page (bundled PDF reader)',d0.funde.some(f=>f.k==='PDF-KI-ANWEISUNG'&&/ignore previous instructions/.test(f.satz)&&/Seite 2/.test(f.satz)));
  ok('0D: the PDF text was read, not "pdf.js nicht erreichbar"',d0.hinweise.some(h=>/Seitentext gelesen: 2 von 2/.test(h))&&!d0.hinweise.some(h=>/pdf\.js ist nicht erreichbar/.test(h)));
  ok('0D: real local OCR compares both rendered pages with their text layer',d0.ocr?.passes>=2&&d0.hinweise.some(h=>/Textebene gegen das Seitenbild gelesen: 2/.test(h))&&!d0.hinweise.some(h=>/NICHT gegengelesen/.test(h)));
  ok('0D: the invisible text layer is detected by actual raster comparison',d0.funde.some(f=>f.k==='PDF-VERSTECKTER-TEXT'));
  ok('H5: the disguise (an image named .pdf) is found',h5.funde.some(f=>f.k==='ANHANG-TARNUNG'));
  ok('H5: the image is actually read despite its false PDF extension',h5.ocr?.passes>0&&h5.ocr.state==='read'&&h5.ungeprueft===false&&h5.hinweise.some(h=>/Text im Bild gelesen/.test(h)));
  ok('H5: image text reaches the searchable catalog',await page.evaluate(()=>/Urlaubsfoto|Angaben erfunden/.test(CATALOG.find(r=>r.name==='Vorlage-H5-Bild-als-PDF-getarnt.pdf')?.snippet||'')));
  ok('A plain text file: checked, nothing found',txt.funde.length===0&&!txt.ungeprueft);
  ok('The catalog text of a PDF is its real text, not raw PDF bytes',await page.evaluate(()=>{const r=CATALOG.find(r=>r.name==='Vorlage-0D-PDF-versteckter-Text.pdf');return /Nebenkostenabrechnung|Hausverwaltung|Musterstadt/.test(r.snippet)&&!/\/Subtype|endobj|FEFF/.test(r.snippet);}));
  ok('The result is kept at the catalog entry',await page.evaluate(async()=>{const r=CATALOG.find(r=>r.name==='Einkauf.txt');const s=await idbGet('catalog',r.hash);return Boolean(s?.pruefung?.zeit);}));
  const entrance=page.locator('#pbImportDone .pb-check-entrance');
  ok('Right below the drop area each file is named, findings first',JSON.stringify(await entrance.locator('.pb-check-entrance-list').first().locator('li').evaluateAll(l=>l.map(x=>x.dataset.check)))===JSON.stringify(['found','found'])&&(await entrance.textContent()).includes('Vorlage-0D-PDF-versteckter-Text.pdf — Anweisung an eine KI im Text'));
  ok('Inconspicuous files are listed folded',(await entrance.locator('.pb-check-entrance-clean summary').textContent())==='✓ 1 unauffällig');
  ok('Each file can be thrown away right there (asks first)',await entrance.locator('li .delBtn').count()===3);
  await sum.locator('[data-check-show]').click();
  const dlg=page.locator('dialog.pb-check-report');
  ok('"Funde ansehen" opens the report with finding and what to do',await dlg.isVisible()&&(await dlg.textContent()).includes('⚠ Gefunden')&&(await dlg.textContent()).includes('beim Absender nachfragen')&&(await dlg.textContent()).includes('keine Virenprüfung'));
  await dlg.locator('button',{hasText:'Schließen'}).click();
  await navigateTo(page,'order');
  await page.waitForFunction(()=>document.querySelectorAll('.pb-check-badge').length>=3);
  const badges=await page.locator('.pb-check-badge').evaluateAll(bs=>bs.map(b=>({c:b.dataset.check,t:b.textContent,h:b.dataset.hash})));
  const byName=async n=>{const h=await page.evaluate(n=>CATALOG.find(r=>r.name===n).hash,n);return badges.find(b=>b.h===h);};
  ok('Catalog: 0D carries "⚠ Fund: Anweisung an eine KI im Text"',(await byName('Vorlage-0D-PDF-versteckter-Text.pdf'))?.t==='⚠ Fund: Anweisung an eine KI im Text');
  ok('Catalog: H5 carries "⚠ Fund: Die Endung passt nicht zum Inhalt"',(await byName('Vorlage-H5-Bild-als-PDF-getarnt.pdf'))?.t==='⚠ Fund: Die Endung passt nicht zum Inhalt');
  ok('Catalog: the text file carries "✓ Geprüft · kein Fund"',(await byName('Einkauf.txt'))?.t==='✓ Geprüft · kein Fund');
  await page.locator('[data-tab="explorer"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('#explorerFiles .pb-check-badge').length===3);
  ok('Explorer rows carry the same marks',(await page.locator('#explorerFiles .pb-check-badge[data-check="found"]').count())===2);
  // An older entry without a result: "jetzt prüfen" checks it on tap.
  await page.evaluate(async()=>{const r=CATALOG.find(r=>r.name==='Einkauf.txt');delete r.pruefung;await idbPut('catalog',r);PBWorkspace.refresh();});
  const openBadge=page.locator('#explorerFiles .pb-check-badge[data-check="open"]');
  await openBadge.waitFor();
  ok('Without a result the mark says "Noch nicht geprüft · jetzt prüfen"',(await openBadge.textContent())==='○ Noch nicht geprüft · jetzt prüfen');
  await openBadge.click();
  await dlg.waitFor();
  ok('"jetzt prüfen" checks the file and shows the report',(await dlg.textContent()).includes('Nichts gefunden, was täuschen soll'));
  await dlg.locator('button',{hasText:'Schließen'}).click();
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>[...document.querySelectorAll('#explorerFiles .pb-check-badge')].some(b=>b.textContent==='✓ Checked · nothing found'));
  ok('The marks follow the app language',true);
  // 🛡 Alle prüfen: entries without a result, all at once.
  await page.evaluate(async()=>{document.documentElement.lang='de';for(const r of CATALOG){delete r.pruefung;await idbPut('catalog',r);}PBWorkspace.refresh();});
  const all=page.locator('.explorer-toolbar .pb-check-all-button');
  await page.waitForFunction(()=>document.querySelector('.explorer-toolbar .pb-check-all-button')?.textContent.includes('(3 offen)'));
  ok('"Alle prüfen" says how many are open',(await all.textContent())==='🛡 Alle prüfen (3 offen)');
  await all.click();
  const allDlg=page.locator('dialog.pb-check-all');await allDlg.waitFor({timeout:120000});
  ok('"Alle prüfen" shows the status of ALL files and lists the findings (Klaus 2026-10-22: no more "0 geprüft" next to known findings)',(await allDlg.locator('.pb-check-stand').textContent()).includes('⚠ 2 mit Fund')&&(await allDlg.locator('.pb-check-stand').textContent()).includes('✓ 1 ohne Fund')&&(await allDlg.textContent()).includes('Prüfstand aller 3 Dateien')&&await allDlg.locator('.pb-check-found li').count()===2);
  await allDlg.locator('button',{hasText:'Schließen'}).click();
  await page.waitForFunction(()=>document.querySelector('.explorer-toolbar .pb-check-all-button')?.textContent==='🛡 Alle geprüft');
  ok('Afterwards nothing is open any more, and the button still shows the status',!(await all.isDisabled()));
  // A file whose original is not on the device: never "jetzt prüfen".
  await page.evaluate(async()=>{const r=CATALOG.find(x=>!x.mail);delete r.pruefung;SESSION_FILES.delete(r.hash);await idbPut('catalog',r);PBWorkspace.refresh();});
  await page.waitForFunction(()=>[...document.querySelectorAll('#explorerFiles .pb-check-badge')].some(b=>b.dataset.check==='missing'));
  ok('Without the original the mark says "Original fehlt · nicht prüfbar"',(await page.locator('#explorerFiles .pb-check-badge[data-check="missing"]').first().textContent())==='⊘ Original fehlt · nicht prüfbar');
  ok('Such files are not counted as "offen"; the button names them',(await all.textContent())==='🛡 Prüfstand · ⊘ 1 ohne Original');
  await all.click();
  const standDlg=page.locator('dialog.pb-check-all');await standDlg.waitFor();
  ok('The status names the file without original and how to get it back',(await standDlg.locator('.pb-check-stand').textContent()).includes('⊘ 1 nicht prüfbar')&&(await standDlg.textContent()).includes('noch einmal ein'));
  await standDlg.locator('button',{hasText:'Schließen'}).click();
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} file check checks passed (real checker core, bundled pdf.js, no network).`);
}finally{await browser?.close();server.close();}
