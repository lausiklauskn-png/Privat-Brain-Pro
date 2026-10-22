// Real Chromium navigation and copy/read/reload checks. The OS folder picker is
// substituted with browser-owned directory handles; native tablet permissions
// still require a device check. No user files or external services are used.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=new URL('..',import.meta.url).pathname;
const server=createServer(async(req,res)=>{
  try{const raw=decodeURIComponent(req.url.split('?')[0]);const path=raw==='/'?'index.html':raw;const data=await readFile(join(root,path));res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(path)]||'application/octet-stream');res.end(data);}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
let checks=0;
function ok(name,condition){assert.ok(condition,name);console.log('✓ '+name);checks++;}
try{
  const context=await browser.newContext();
  await context.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db);
  ok('Suche ist Startseite; Einwurf und Explorer sind getrennte Seiten',await page.locator('#panel-search').isVisible() && !await page.locator('#drop').isVisible() && !await page.locator('#panel-explorer').isVisible());
  ok('Drei Datei-Hauptseiten und ergänztes Postfach',await page.locator('.main-pages .tab').count()===4);
  ok('Kopf zeigt das originale 3D-Icon; Leerzustand behält sein flaches Symbol',await page.locator('.logo img').evaluate(img=>img.complete && img.naturalWidth===512 && img.getAttribute('src')==='icon-512.png') && await page.locator('#searchEmpty .brain-emoji circle').count()===4);
  const manifest=await (await page.request.get(url+'app-manifest.json')).json();
  ok('Desktop- und Touch-Icons verwenden das originale 3D-Bild',manifest.icons.every(i=>i.src==='icon-'+i.sizes.split('x')[0]+'.png?v=3d') && await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')==='icon-192.png?v=3d');
  ok('Suche steht einmal in der Hauptnavigation, ohne zusätzlichen Kopfknopf',await page.locator('.main-pages [data-tab="search"]').count()===1 && await page.locator('#globalSearch').count()===0);
  const light=await page.locator('.main-pages .tab').first().evaluate(n=>getComputedStyle(n).backgroundColor);
  await page.click('#themeToggle');
  await page.fill('#q','Suchfrage bleibt erhalten');
  await page.click('[data-tab="intake"]');
  ok('Importseite hat nur Zurück zur Suche und keinen Suchfeld-Duplikat',await page.locator('.main-pages [data-tab="search"]').innerText()==='← Zur Suche' && !await page.locator('#q').isVisible() && await page.locator('#drop').isVisible());
  await page.click('.main-pages [data-tab="search"]');
  ok('Zurück führt auf die Suchstartseite und erhält die Suchfrage',await page.locator('#q').isVisible() && await page.locator('#q').inputValue()==='Suchfrage bleibt erhalten' && new URL(page.url()).hash==='');
  await page.goBack();
  ok('Browser-Zurück stellt die Importseite wieder her',await page.locator('#panel-intake').isVisible());
  await page.goForward();
  ok('Browser-Vorwärts stellt die Suchstartseite wieder her',await page.locator('#panel-search').isVisible());
  await page.fill('#q','');
  await page.waitForFunction(color=>getComputedStyle(document.querySelector('.main-pages .tab')).backgroundColor!==color,light);
  ok('Neue Navigation übernimmt den Dunkelmodus',await page.locator('.main-pages .tab').first().evaluate(n=>getComputedStyle(n).backgroundColor)!==light);
  await page.click('#themeToggle');
  for(const width of [320,768,1280]){
    await page.setViewportSize({width,height:900});
    for(const tab of ['search','intake','explorer']){
      await page.click(`[data-tab="${tab}"]`);
      ok(`${width}px: ${tab} ohne Querlaufen`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.click('.main-pages [data-tab="search"]');
      ok(`${width}px: Suche von ${tab} erreichbar`,await page.locator('#q').isVisible());
    }
  }
  await page.setViewportSize({width:768,height:1024});
  await page.screenshot({path:'/tmp/private-brain-flat-symbol-search.png',fullPage:true});
  await page.click('[data-tab="intake"]');
  await page.evaluate(async()=>{const dir=await navigator.storage.getDirectory();window.testFolder=await dir.getDirectoryHandle('Lokale-Ablage',{create:true});window.showDirectoryPicker=async()=>window.testFolder;});
  await page.click('#chooseLibrary');
  await page.waitForFunction(()=>document.querySelector('#libraryStatus').textContent.includes('Lokale-Ablage'));
  const upload=async content=>{
    await page.setInputFiles('#fileInput',{name:'bericht.txt',mimeType:'text/plain',buffer:Buffer.from(content)});
    await page.waitForFunction(()=>!signing);
  };
  await upload('Schwarzes Fahrzeug: Radstand 2820 mm.');
  ok('Kopie enthält die echten Dateibytes im gewählten Ordner',await page.evaluate(async()=>await(await(await testFolder.getFileHandle('bericht.txt')).getFile()).text())==='Schwarzes Fahrzeug: Radstand 2820 mm.');
  await upload('Anderer Bericht mit gleichem Namen.');
  ok('Namenskollision überschreibt keine Datei',await page.evaluate(async()=>await(await(await testFolder.getFileHandle('bericht.txt')).getFile()).text())==='Schwarzes Fahrzeug: Radstand 2820 mm.' && await page.evaluate(async()=>await(await(await testFolder.getFileHandle('bericht (1).txt')).getFile()).text())==='Anderer Bericht mit gleichem Namen.');
  await upload('Schwarzes Fahrzeug: Radstand 2820 mm.');
  ok('Erneuter Import legt keine weitere identische Kopie an',await page.evaluate(async()=>{const names=[];for await(const n of testFolder.keys())names.push(n);return names.length===2;}));
  await page.setInputFiles('#mailInput',{name:'angebot.eml',mimeType:'message/rfc822',buffer:Buffer.from('From: kunde@example.test\r\nTo: empfang@example.test\r\nSubject: Fahrzeug-Angebot\r\nDate: Sun, 18 Oct 2026 10:00:00 +0200\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nAngebot zum Fahrzeug mit Radstand 2820 mm.')});
  await page.waitForFunction(()=>!signing && CATALOG.some(r=>r.mail));
  ok('E-Mail hat einen Verweis auf ihre lokal gespeicherte Quelldatei',await page.evaluate(()=>CATALOG.find(r=>r.mail).localSource.path.endsWith('/angebot.eml')));
  await page.click('.main-pages [data-tab="search"]');await page.fill('#q','Radstand');
  await page.waitForFunction(()=>document.querySelectorAll('#results .card').length>=2);
  ok('Gemeinsame Suche findet E-Mail und Dokumente',await page.locator('#results').innerText().then(t=>t.includes('Fahrzeug-Angebot') && t.includes('bericht.txt')));
  await page.reload();await page.waitForFunction(()=>window.PBWorkspace && document.querySelector('#libraryStatus').textContent.includes('Lokale-Ablage'));
  await page.click('[data-tab="explorer"]');
  ok('Explorer stellt die lokalen Verweise nach Neustart wieder her',await page.locator('.explorer-row').count()===3);
  await page.evaluate(()=>{window.showBlob=async(file)=>{window.openedLocalFile=await file.text();};});
  await page.locator('.explorer-row').filter({has:page.locator('strong',{hasText:/^\S+ bericht\.txt$/})}).getByRole('button',{name:'Öffnen',exact:true}).click();
  await page.waitForFunction(()=>window.openedLocalFile);
  ok('Explorer liest nach Neustart aus dem Ordner statt aus Sitzungsspeicher',await page.evaluate(()=>SESSION_FILES.size===0 && openedLocalFile==='Schwarzes Fahrzeug: Radstand 2820 mm.'));
  await page.fill('#explorerFilter','angebot');
  ok('Explorer filtert die Dateiliste',await page.locator('.explorer-row').count()===1);
  await page.click('#explorerHome');
  await page.locator('#explorerTree button').filter({hasText:'Lokale-Ablage'}).first().click();
  ok('Ordnernavigation und übergeordneter Ordner funktionieren',await page.locator('#explorerUp').isEnabled());
  await page.click('#explorerUp');
  ok('Eine Ebene höher steht die Art des Ordners (Ordnerbaum wie im Explorer)',(await page.locator('#explorerPath').textContent()).endsWith('📝 Notizen'));
  await page.click('#explorerUp');
  ok('Zurück zur Wurzel',await page.locator('#explorerUp').isDisabled());
  for(const lang of ['en','ru','pl','de']){
    await page.evaluate(lang=>document.documentElement.lang=lang,lang);
    await page.waitForTimeout(30);
    ok(`${lang}: Hauptnavigation übersetzt`,await page.locator('.main-pages [data-tab="intake"]').innerText()!== (lang==='de'?'📥 Add files':'📥 Dateien hinzufügen'));
  }
  // Denied folder permissions must stop import, rather than create a transient
  // catalog entry while telling the user the file was saved on disk.
  ok('Verweigerte Schreibfreigabe stoppt den Import',await page.evaluate(async()=>{
    const proto=FileSystemHandle.prototype, query=proto.queryPermission, request=proto.requestPermission;
    proto.queryPermission=async()=> 'denied';proto.requestPermission=async()=> 'denied';
    const before=CATALOG.length;
    try{await signBatch([{file:new File(['Nicht speichern'],'verweigert.txt'),path:'verweigert.txt',dirId:null}]);return CATALOG.length===before && !signing && document.querySelector('#toast').textContent.includes('Zugriff');}
    finally{if(query)proto.queryPermission=query;else delete proto.queryPermission;if(request)proto.requestPermission=request;else delete proto.requestPermission;}
  }));
  await page.click('[data-tab="intake"]');
  await page.evaluate(async()=>{const root=await navigator.storage.getDirectory();window.showDirectoryPicker=async()=>root.getDirectoryHandle('Zweite-Ablage',{create:true});});
  await page.click('#chooseLibrary');await page.waitForFunction(()=>document.querySelector('#libraryStatus').textContent.includes('Zweite-Ablage'));
  await page.click('[data-tab="explorer"]');
  await page.evaluate(()=>{window.openedLocalFile=null;});
  await page.locator('.explorer-row').filter({has:page.locator('strong',{hasText:/^\S+ bericht\.txt$/})}).getByRole('button',{name:'Öffnen',exact:true}).click();
  await page.waitForFunction(()=>window.openedLocalFile);
  ok('Wechsel der Ablage erhält Zugriff auf frühere Kopien',await page.evaluate(()=>openedLocalFile==='Schwarzes Fahrzeug: Radstand 2820 mm.'));
  await page.evaluate(async()=>{const root=await navigator.storage.getDirectory();const old=await root.getDirectoryHandle('Lokale-Ablage');await old.removeEntry('bericht.txt');window.openedLocalFile=null;});
  await page.locator('.explorer-row').filter({has:page.locator('strong',{hasText:/^\S+ bericht\.txt$/})}).getByRole('button',{name:'Öffnen',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('nicht erreichbar'));
  ok('Fehlende Datei wird gemeldet; kein Ersatz aus Katalog oder Sitzung',await page.evaluate(()=>!openedLocalFile && document.querySelector('#toast').textContent.includes('nicht erreichbar')));
  ok('Schreibfehler erzeugt keinen Katalogeintrag und keine leere Kopie',await page.evaluate(async()=>{
    const proto=FileSystemFileHandle.prototype, write=proto.createWritable, before=CATALOG.length;
    proto.createWritable=async()=>{throw new DOMException('Test quota','QuotaExceededError');};
    try{
      await signBatch([{file:new File(['Nicht speichern'],'quota.txt'),path:'quota.txt',dirId:null}]);
      const root=await navigator.storage.getDirectory(), folder=await root.getDirectoryHandle('Zweite-Ablage');
      let absent=false;try{await folder.getFileHandle('quota.txt');}catch(e){absent=e.name==='NotFoundError';}
      return CATALOG.length===before && absent && document.querySelector('#toast').textContent.includes('fehlgeschlagen');
    }finally{proto.createWritable=write;}
  }));
  ok('Dateien aus verbundenem Quellordner werden bei aktiver Ablage kopiert',await page.evaluate(async()=>{
    await signBatch([{file:new File(['Datei aus Quellordner'],'quelle.txt'),path:'Quelle/quelle.txt',dirId:'test-source'}]);
    const r=CATALOG.find(r=>r.name==='quelle.txt');return r && r.dirId!=='test-source' && r.path==='Zweite-Ablage/Quelle/quelle.txt';
  }));
  await page.setViewportSize({width:768,height:1024});await page.screenshot({path:'/tmp/private-brain-explorer-tablet.png',fullPage:true});
  ok('Keine unbehandelten Skriptfehler',errors.length===0);
  const fallback=await browser.newContext();await fallback.addInitScript(()=>{window.showDirectoryPicker=undefined;});
  await fallback.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  const tablet=await fallback.newPage();await tablet.goto(url);await tablet.click('[data-tab="intake"]');
  ok('Browser ohne Ordner-API zeigt Grenze und erhält Dateiimport',await tablet.locator('#chooseLibrary').isDisabled() && (await tablet.locator('#libraryStatus').innerText()).includes('unterstützt keine') && await tablet.locator('#pickFiles').isVisible());
  await tablet.setInputFiles('#fileInput',{name:'tablet.txt',mimeType:'text/plain',buffer:Buffer.from('Tablet-Datei ohne Ordnerzugriff')});
  await tablet.waitForFunction(()=>!signing && CATALOG.length===1);
  await tablet.click('[data-tab="explorer"]');
  ok('Dateiimport bleibt ohne Ordner-API nutzbar und als Sitzung markiert',(await tablet.locator('.explorer-row').innerText()).includes('Nur diese Sitzung'));
  await tablet.click('[data-tab="intake"]');
  await tablet.evaluate(async()=>{const root=await navigator.storage.getDirectory();window.showDirectoryPicker=async()=>root.getDirectoryHandle('Dauerhaft',{create:true});PBWorkspace.refresh();});
  await tablet.click('#chooseLibrary');await tablet.waitForFunction(()=>document.querySelector('#libraryStatus').textContent.includes('Dauerhaft'));
  await tablet.setInputFiles('#fileInput',{name:'tablet.txt',mimeType:'text/plain',buffer:Buffer.from('Tablet-Datei ohne Ordnerzugriff')});
  await tablet.waitForFunction(()=>!signing);
  ok('Erneuter Import wandelt Sitzungsdatei in lokalen Verweis um',await tablet.evaluate(()=>CATALOG.length===1 && CATALOG[0].dirId && !SESSION_FILES.has(CATALOG[0].hash)));
  await fallback.close();await context.close();
  console.log(`\n${checks} Prüfungen bestanden`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
