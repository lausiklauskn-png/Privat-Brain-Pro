// Tresor-Hilfe (Klaus 15.11.2026): Gegenprobe des Ordnerbaums, Satz mit „Beheben ›“, Reparatur in einem Zug,
// geführte Schritte, Knopf „Tresor-Hilfe“ mit „Wo liegt was?“ und Landkarte. Brücke gestellt; Java nur am Quelltext geprüft.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  let data;try{data=await readFile(path);}catch{return res.writeHead(404).end();}
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const plug=readFileSync('android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProVaultPlugin.java','utf8');
const diag=plug.slice(plug.indexOf('private JSONObject diagnoseAblage'),plug.indexOf('@PluginMethod public void volumes'));
ok('Java: Gegenprobe nur lesend (keine Schreib-, Lösch- oder Freigabe-Aufrufe)',diag.length>200&&!/createDocument|deleteDocument|takePersistable|releasePersistable|openOutputStream|edit\(\)/.test(diag));
ok('Java: drei Fälle in fester Reihenfolge – Karte, Erlaubnis, Ordner',diag.indexOf('"karte"')<diag.indexOf('"erlaubnis"')&&diag.indexOf('"erlaubnis"')<diag.indexOf('"ordner"'));
ok('Java: Reparatur nur, wenn die Gegenprobe den Ordner wirklich vermisst',/reparatur = call\.getBoolean\("reparatur", false\) && vault\.configured\(\) && "ordner"\.equals\(diagnoseAblage\(\)\.optString\("fall"\)\)/.test(plug));
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    try{localStorage.setItem('pb_einstellungen_themen','an');}catch{}
    window.fall='ordner';window.einrichtenArgs=null;window.tresorPfad='Family_Projekt_de';
    window.Capacitor={Plugins:{ProVault:{
      async state(){return window.fall==='ok'?{configured:true,unlocked:true,reachable:true,pfad:'Family_Projekt_de/Private Brain',location:'sdcard',folder:'SD'}:{configured:true,unlocked:true,reachable:false,problem:'VAULT_FOLDER_UNAVAILABLE',pfad:'Privat Brain Pro Hauptablageordner/Private Brain',location:'sdcard'};},
      async diagnose(){return window.fall==='ok'?{fall:'ok',pfad:'Family_Projekt_de/Private Brain',volume:'3039-3234'}:{fall:window.fall,pfad:'Privat Brain Pro Hauptablageordner/Private Brain',volume:'3039-3234'};},
      async volumes(){return{items:[]};},async attachments(){return{items:[]};},async choose(){return{cancelled:true};},
      async tresorZustand(){return{uebergaben:true,gewaehlt:true,offen:window.fall==='ok',erreichbar:window.fall==='ok',pfad:window.tresorPfad,ordner:'Family_Projekt_de'};},
      async tresorEinrichten(a){window.einrichtenArgs=a;window.fall='ok';return{hauptordner:'Family_Projekt_de',offen:true};},
      async tresorEinziehen(){return{abgebrochen:true};},async tresorSperren(){return{};},async tresorUebergabe(){return{items:[]};}
    }}};
  });
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url);
  await page.waitForFunction(()=>window.PBTresorHilfe&&window.PBTresorHilfe.befund);
  const band=page.locator('#pbTresorBand');
  ok('Ordner fehlt: oben steht, was los ist, mit Ordnername – nicht „SD-Karte eingesteckt?“',await band.isVisible()&&/Privat Brain Pro Hauptablageordner\/Private Brain.*nicht mehr da/.test(await band.innerText())&&!/eingesteckt/.test(await band.innerText()));
  ok('Am Satz steht „Beheben ›“, der Fehlercode nur hinter „?“',await band.locator('button',{hasText:'Beheben ›'}).isVisible()&&!(await band.innerText()).includes('VAULT_FOLDER_UNAVAILABLE'));
  await band.locator('button',{hasText:'Beheben ›'}).click();
  const dlg=page.locator('dialog[data-tresor-hilfe]');
  ok('Beheben: sichtbar nur „Nichts geschieht ohne deinen Tipp. Kein Ersatzordner.“, der Rest hinter „?“',(await dlg.locator('.pb-tresor-tipp').innerText())==='Nichts geschieht ohne deinen Tipp. Kein Ersatzordner.'&&!(await dlg.locator('.pb-tresor-mehr').evaluate(d=>d.open))&&!/überschrieben/.test(await dlg.innerText()));
  await dlg.locator('button',{hasText:'Weiter zur Ordnerwahl'}).click();
  await page.waitForFunction(()=>window.einrichtenArgs);
  ok('Reparatur in einem Zug: „Tresor einrichten“ mit reparatur und der SD-Karte als Startort',await page.evaluate(()=>einrichtenArgs.reparatur===true&&einrichtenArgs.volume==='3039-3234'));
  await page.waitForFunction(()=>PBTresorHilfe.befund.ok);
  ok('Danach Gegenprobe grün, der Satz oben verschwindet',!await band.isVisible());
  // Zwei Bäume
  await page.evaluate(async()=>{window.tresorPfad='Anderer_Ordner';await PBTresorHilfe.gegenprobe();});
  ok('Gegenprobe meldet zwei getrennte Bäume',/zwei verschiedenen Ordnern/.test(await band.innerText()));
  await page.evaluate(async()=>{window.tresorPfad='Family_Projekt_de';await PBTresorHilfe.gegenprobe();});
  // Knopf Tresor-Hilfe
  await page.evaluate(()=>PBWorkspace.navigate('settings'));await page.click('#pbThemen [data-thema="tresor"]');
  await page.waitForSelector('#pbTresorHilfeKnopf',{state:'visible'});
  ok('Im Thema Tresor & Ablage steht „Tresor-Hilfe“, „Wo liegt was?“ ist darin statt daneben',!await page.locator('#woLiegtWasKnopf').isVisible());
  await page.click('#pbTresorHilfeKnopf');
  const h=page.locator('dialog[data-tresor-hilfe]');
  ok('Tresor-Hilfe zeigt drei Zeilen: Ablage, gemeinsamer Tresor, ein Baum – alle grün',await h.locator('.pb-tresor-zeile').count()===3&&await h.locator('.pb-tresor-zeile.rot').count()===0);
  ok('… und „Wo liegt was?“ sowie die Landkarte der Pro-Apps',await h.locator('button',{hasText:'Wo liegt was?'}).count()===1&&await h.locator('button',{hasText:'Landkarte der Pro-Apps'}).count()===1);
  await h.locator('button',{hasText:'Schließen'}).click();
  // Geführte Schritte
  await page.evaluate(()=>{window.fall='erlaubnis';});await page.evaluate(()=>PBTresorHilfe.gegenprobe());
  ok('Erlaubnis zurückgenommen: eigener Satz',/Zugriff auf den Ablageordner zurückgenommen/.test(await band.innerText()));
  await page.evaluate(()=>PBTresorHilfe.fuehren([{thema:'tresor',ziel:'#vault-choose',text:'Probe'}]));
  await page.waitForSelector('.pb-tresor-blase');
  ok('Geführt: Thema offen, der Knopf leuchtet, daneben Blase mit „Schritt 1 von 1“',await page.locator('#vault-choose.pb-tresor-leucht').count()===1&&/Schritt 1 von 1/.test(await page.locator('.pb-tresor-blase').innerText()));
  await page.click('.pb-tresor-blase button');
  ok('„Hilfe beenden“ nimmt Leuchten und Blase weg',await page.locator('.pb-tresor-leucht').count()===0&&await page.locator('.pb-tresor-blase').count()===0);
  ok('Keine Seitenfehler',errors.length===0);
}finally{await browser?.close();server.close();}
console.log(`Tresor-Hilfe: ${count} grün`);
