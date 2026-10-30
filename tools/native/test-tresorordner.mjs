// Simulation (Browser, Plugins gestellt): Tresorordner Schritt D2 — Abschnitt im Kasten „Tresor & Ablage“,
// Einzug, Inhaltsverzeichnis aus dem Katalog (nur Kurzfassung), Rechnungsmail ins Fach „Eingang-BookLedgerPro“ ohne
// dass die .eml durch die Seite geht. Die Java-Seite prüft TresorEinzugTest (JVM).
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),origin='https://localhost/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
// One simulated folder shared by "device A" and "device B" pages.
const folder={exists:false,catalog:[],attachments:[],calls:[]};
const tresor={zustand:{gewaehlt:false,ordner:'',gemerkt:false,offen:false,eingezogen:false},fehler:null,zeilen:null,mails:[]};
const textBytes=Buffer.from('Anwaltsschreiben im Anhang-Ordner');
function fresh(){return{configured:false,unlocked:false,pending:new Map()};}
async function device(name,{answers=[],ohneTresor=false,altTresor=false}={}){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const dialogs=[];page.on('dialog',d=>{dialogs.push(d.message());const a=answers.shift();a===false?d.dismiss():d.accept();});
  const local=fresh();
  await page.route('**/*',async route=>{const url=route.request().url();if(!url.startsWith(origin))return route.abort();const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}});
  await page.exposeFunction('vaultFixture',async(method,args={})=>{
    folder.calls.push({device:name,method,args});
    const state=()=>({configured:local.configured,unlocked:local.unlocked,remembered:local.unlocked,location:'sdcard',folder:'Private Brain',attachments:folder.attachments.length,attachmentBytes:folder.attachments.reduce((s,a)=>s+a.size,0),reachable:true,catalogBackup:folder.catalog.length>0});
    if(method==='state')return state();
    if(method==='volumes')return{items:[{id:'primary',label:'Interner Speicher',primary:true,removable:false},{id:'1234-ABCD',label:'SanDisk',primary:false,removable:true}],targeted:true};
    if(method==='choose'){
      if(args.password!==undefined)throw new Error('password crossed the bridge');
      local.configured=true;local.unlocked=true;
      if(folder.exists)return{opened:true,state:state(),restored:{accounts:1,records:2}};
      folder.exists=true;return{created:true,state:state()};
    }
    if(method==='unlock'){local.unlocked=true;return{unlocked:true,state:state()};}
    if(method==='lock'){local.unlocked=false;return state();}
    if(method==='migrate')return{originals:3,skipped:0};
    if(method==='backupMail')return{ok:true};
    if(!local.unlocked)throw new Error('VAULT_LOCKED');
    if(method==='attachments')return{items:folder.attachments.map(({bytes,...a})=>a)};
    if(method==='readAttachment'){const a=folder.attachments.find(a=>a.id===args.id);if(!a)throw new Error('ATTACHMENT_DELETED');return{data:a.bytes.subarray(args.offset,args.offset+262144).toString('base64')};}
    if(method==='openAttachment')return{ok:true};
    if(method==='clearAttachments'){const removed=folder.attachments.length;folder.attachments=[];return{removed,bytes:0};}
    if(method==='catalogBegin'){const ticket='t'+(local.pending.size+1)+Date.now();local.pending.set(ticket,[]);return{ticket};}
    if(method==='catalogAppend'){const parts=local.pending.get(args.ticket);assert.equal(args.offset,parts.reduce((s,p)=>s+p.length,0));parts.push(Buffer.from(args.data,'base64'));return{ok:true};}
    if(method==='catalogFinish'){folder.catalog.push(Buffer.concat(local.pending.get(args.ticket)));local.pending.delete(args.ticket);return{ok:true};}
    if(method==='catalogAbort'){local.pending.delete(args.ticket);return{ok:true};}
    if(method==='catalogInfo'){const last=folder.catalog.at(-1);return last?{exists:true,size:last.length,version:folder.catalog.length}:{exists:false};}
    if(method==='catalogRead')return{data:folder.catalog[args.version-1].subarray(args.offset,args.offset+262144).toString('base64')};
    // Wie Java: ein gemerkter Schlüssel öffnet beim Zustand von selbst – außer nach „Sperren“ von Hand (vonHandGesperrt).
    if(method==='ordnerOeffnen'){folder.geoeffnet=(folder.geoeffnet||[]).concat(args.welcher);return{};}
    if(method==='tresorZustand'){if(tresor.zustand.gemerkt&&!tresor.zustand.offen&&tresor.zustand.vorhanden&&!tresor.vonHand)tresor.zustand={...tresor.zustand,offen:true,eingezogen:true};return {...tresor.zustand};}
    if(method==='tresorEinziehen'){tresor.vonHand=false;tresor.einzuege=(tresor.einzuege||0)+1;if(JSON.stringify(args).toLowerCase().includes('passw'))throw new Error('password crossed the bridge');if(!local.unlocked)throw new Error('VAULT_LOCKED');if(tresor.fehler){const f=tresor.fehler;tresor.fehler=null;throw new Error(f);}
      tresor.zustand={gewaehlt:true,ordner:'Tresor-Probe',gemerkt:true,offen:true,eingezogen:true,erreichbar:true,vorhanden:true,pruefung:'PASST',eintraege:0};return {...tresor.zustand,eingezogenJetzt:true,angelegt:true};}
    if(method==='tresorVerzeichnis'){const neu=JSON.stringify(args.zeilen)!==JSON.stringify(tresor.zeilen);tresor.zeilen=args.zeilen;tresor.zustand.eintraege=args.zeilen.length;return {geschrieben:neu,eintraege:args.zeilen.length};}
    if(method==='tresorSperren'){tresor.gesperrtMit=args;tresor.vonHand=true;tresor.zustand={...tresor.zustand,offen:false,eingezogen:false,gemerkt:args.vergessen?false:tresor.zustand.gemerkt};return {...tresor.zustand};}
    throw new Error('Unknown vault method '+method);
  });
  await page.exposeFunction('mailFixture',async(method,args={})=>{
    folder.calls.push({device:name,method,args});
    const account={id:'11111111-1111-4111-8111-111111111111',email:'klaus@example.invalid',provider:'telekom'};
    if(method==='accounts')return{items:[account]};
    if(method==='folders')return{items:[{path:'INBOX',name:'INBOX',specialUse:''}]};
    if(method==='messages')return{validity:'5',total:1,items:[{uid:9,subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',flags:[],size:40*1024*1024}],next:null};
    if(method==='message'){
      if(!local.unlocked)throw new Error('VAULT_LOCKED');
      const stored=folder.attachments.find(a=>a.id==='att-1');
      return{subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',to:account.email,messageId:'<a@example.invalid>',replyTo:'',html:'',text:'Siehe Anhang.',raw:'From: kanzlei@example.invalid\r\nSubject: Schreiben vom Anwalt\r\n\r\nSiehe Anhang.',vault:true,
        attachments:[stored?{name:'schreiben.txt',type:'text/plain',size:stored.size,sha256:'x',ref:'att-1',stored:true,inline:false,contentId:''}:{name:'schreiben.txt',type:'text/plain',size:textBytes.length,ref:'att-1',stored:false,deleted:true,inline:false,contentId:''},{name:'video.mp4',type:'video/mp4',tooLarge:true,inline:false,contentId:''}]};
    }
    if(method==='action')return{ok:true};
    if(method==='forgetMessage'){folder.attachments.push({id:'att-1',name:'schreiben.txt',type:'text/plain',size:textBytes.length,subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',date:String(Date.UTC(2026,9,20)),stored:Date.now(),bytes:textBytes});return{ok:true};}
    if(method==='saved')return{items:[]};
    if(method==='openOriginal')return{ok:true};
    if(method==='tresorMailAblegen'){tresor.mails.push(args);return{id:'m1',name:args.name,verschluesselung:'fpt1'};}
    throw new Error('Unknown mail method '+method);
  });
  if(ohneTresor)await page.addInitScript(()=>{window.__ohneTresor=true;});
  // Der alte Browser-Datei-Tresor ist nur sichtbar, wenn er einmal eingerichtet wurde (Leitfaden § 2).
  if(altTresor)await page.addInitScript(()=>{try{localStorage.setItem('pb_tresor_verify','x');}catch{}});
  await page.addInitScript(()=>{
    delete window.showDirectoryPicker;
    const vault=['state','volumes','choose','unlock','lock','migrate','backupMail','attachments','readAttachment','openAttachment','clearAttachments','catalogBegin','catalogAppend','catalogFinish','catalogAbort','catalogInfo','catalogRead','ordnerOeffnen',...(window.__ohneTresor?[]:['tresorZustand','tresorEinziehen','tresorVerzeichnis','tresorSperren'])];
    const mail=['accounts','folders','messages','message','action','forgetMessage','saved','openOriginal','tresorMailAblegen'];
    const wrap=(fixture,list)=>Object.fromEntries(list.map(m=>[m,async args=>{try{return await window[fixture](m,args);}catch(error){throw{code:String(error?.message||error).match(/[A-Z][A-Z_]{3,}/)?.[0]||'UNKNOWN'};}}]));
    window.Capacitor={Plugins:{ProVault:wrap('vaultFixture',vault),ProMail:wrap('mailFixture',mail),ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.17-debug',nativeMail:true};}}}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBVault&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  return {page,errors,dialogs,local,context};
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const A=await device('A',{answers:[false],altTresor:true});
  const {page}=A;
  await navigateTo(page,'settings');
  await page.waitForTimeout(400);
  ok('Ohne eingerichteten Speicherort kein Tresorordner-Abschnitt',await page.locator('#tresorordner').isHidden());
  await page.click('#vault-choose');
  await page.locator('.native-vault-where button',{hasText:'SD-Karte'}).click();
  await page.waitForFunction(()=>document.querySelector('#tresorordner')?.dataset.zustand==='neu'&&!document.querySelector('#tresorordner').hidden);
  ok('Knopf „In den Tresorordner einziehen“ steht im Kasten Speicherort',await page.locator('#vaultPlace #tresorordner button',{hasText:'In den Tresorordner einziehen'}).count()===1);
  ok('Erklärung nennt die Probe an einer Kopie und dass „Private Brain“ bleibt',await page.locator('#tresorordnerZeile').textContent().then(t=>t.includes('Kopie davon')&&t.includes('„Private Brain“ bleibt, wie es ist')));
  ok('Kein Passwortfeld in der Seite',await page.locator('#vaultPlace input').count()===0);
  tresor.fehler='TRESOR_ORDNER_IST_FACH';
  await page.click('#tresorordner [data-tresor=move]');
  await page.waitForFunction(()=>/Ebene darüber/.test(document.querySelector('#tresorordnerHinweis')?.textContent||''));
  ok('Fach selbst gewählt: klare Meldung, kein Verzeichnis geschrieben',tresor.zeilen===null&&await page.getAttribute('#tresorordner','data-zustand')==='neu');
  const langerText='Rechnung Nr. 2026-117 '+'Zeile mit Text '.repeat(400);
  await page.evaluate(t=>{
    CATALOG.push({hash:'a'.repeat(64),name:'vertrag',ext:'pdf',type:'application/pdf',date:Date.UTC(2026,9,1),size:4096,snippet:'Mietvertrag Wohnung',path:'Dokumente/vertrag.pdf'});
    CATALOG.push({hash:'b'.repeat(64),name:'Rechnung 2026-117',ext:'eml',type:'message/rfc822',date:Date.UTC(2026,9,20),size:t.length,snippet:t.slice(0,300),mailBody:t,path:'Mail/Lieferant/Rechnung 2026-117'});
    CATALOG.push({hash:'kaputt/../x',name:'böse',size:1});
  },langerText);
  await page.click('#tresorordner [data-tresor=move]');
  await page.waitForFunction(()=>document.querySelector('#tresorordner')?.dataset.zustand==='verbunden');
  const einzug=folder.calls.filter(c=>c.method==='tresorEinziehen').at(-1).args;
  ok('Einzug: nur Sprache/Darstellung über die Brücke',Object.keys(einzug).sort().join()==='dark,language');
  const z=tresor.zeilen||[];
  ok('Inhaltsverzeichnis aus dem Katalog, ungültige Kennung weggelassen',z.length===2&&z.some(r=>r.name==='vertrag.pdf'&&r.verweis==='Dokumente/vertrag.pdf'&&r.sha256==='a'.repeat(64)));
  const m=z.find(r=>r.art==='message/rfc822');
  ok('Mail-Zeile: nur Kurzfassung, nie der ganze Mailtext',m&&m.auszug.length<=1000&&!JSON.stringify(z).includes(langerText.slice(0,1500))&&m.name==='Rechnung 2026-117.eml');
  ok('Zeilen tragen nur die Felder des Formats',z.every(r=>Object.keys(r).sort().join()==='art,auszug,datum,groesse,id,name,sha256,verweis'));
  ok('Verbunden: Ordner und Zahl der Einträge',await page.locator('#tresorordnerZeile').textContent().then(t=>t.includes('verbunden mit: Tresor-Probe')&&t.includes(': 2')));
  ok('Ein Kasten „Tresor & Ablage“ mit „Ablage von Private Brain“ und „Tresor (alle Pro-Apps)“ (Leitfaden § 2)',await page.evaluate(()=>{const c=document.getElementById('vaultPlace');return c.querySelector('h3')?.textContent==='Tresor & Ablage'&&c.querySelector('.pro-ablage-kopf')?.textContent==='Ablage von Private Brain'&&c.querySelector('#tresorordner h4')?.textContent==='Tresor (alle Pro-Apps)';}));
  ok('Beide mit Zustand ● Entsperrt und ganzem Pfad',await page.evaluate(()=>{const a=document.querySelector('#vaultOrt'),t=document.querySelector('#tresorordnerOrt');return a?.querySelector('.pro-zustand')?.textContent==='Entsperrt'&&t?.querySelector('.pro-zustand')?.textContent==='Entsperrt'&&/\//.test(a.querySelector('.pro-pfad')?.textContent||'')&&!!t.querySelector('.pro-pfad')?.textContent;}));
  await page.click('#vaultOrt [data-pro-knopf="in-dateien"]');await page.click('#tresorordnerOrt [data-pro-knopf="in-dateien"]');
  for(let i=0;i<20&&(folder.geoeffnet||[]).length<2;i++)await page.waitForTimeout(100);
  ok('„In Dateien öffnen“ fragt Android nach dem richtigen Ordner (Ablage, dann Tresor)',JSON.stringify(folder.geoeffnet)==='["ablage","tresor"]');
  await page.click('#tresorordner [data-tresor=write]');
  await page.waitForFunction(()=>/aktuell/.test(document.querySelector('#tresorordnerHinweis')?.textContent||''));
  ok('„jetzt schreiben“ ohne Änderung meldet aktuell',true);
  // ---------- Rechnungsmail ins Eingangsfach ----------
  await page.click('[data-tab=mail]');
  await page.locator('#mailWorkspace [data-live-text=connect]').click();
  await page.locator('#mailWorkspace [data-live-uid="9"]').click();
  const share={click:async()=>{
    const tools=page.locator('#mailWorkspace .mail-message-tools').first();await tools.waitFor();
    if(await tools.getAttribute('open')===null)await tools.locator('summary').click();
    await page.locator('#mailWorkspace [data-live-text=bookledger]').first().click();
  }};
  await share.click();
  await page.locator('#tresorordnerFrage').waitFor();
  ok('Mit verbundenem Ordner fragt „An BookLedgerPro teilen“: Tresorordner oder Teilen',await page.locator('#tresorordnerFrage button').allTextContents().then(t=>t.includes('In den Tresorordner legen')&&t.includes('Teilen …')));
  await page.click('#tresorordnerFrage [data-wahl=tresor]');
  await page.waitForFunction(()=>true);for(let i=0;i<40&&!tresor.mails.length;i++)await page.waitForTimeout(100);
  const abgelegt=tresor.mails[0]||{};
  ok('Die Mail geht als Verweis (Konto, Ordner, UID) an Android, nicht als Inhalt',abgelegt.uid===9&&abgelegt.folder==='INBOX'&&abgelegt.validity==='5'&&!('raw' in abgelegt)&&!('data' in abgelegt)&&abgelegt.name==='Schreiben vom Anwalt.eml');
  for(let i=0;i<20&&!A.dialogs.some(d=>d.includes('Eingang-BookLedgerPro'));i++)await page.waitForTimeout(100);
  ok('Rückmeldung nennt das Fach',A.dialogs.some(d=>d.includes('Eingang-BookLedgerPro/Mails')));
  const vorher=folder.calls.filter(c=>c.method==='openOriginal').length;
  await share.click();await page.click('#tresorordnerFrage [data-wahl=teilen]');
  for(let i=0;i<20&&folder.calls.filter(c=>c.method==='openOriginal').length===vorher;i++)await page.waitForTimeout(100);
  ok('„Teilen …“ geht den bisherigen Weg (Android-Teilen)',folder.calls.filter(c=>c.method==='openOriginal').length===vorher+1&&tresor.mails.length===1);
  // ---------- gesperrt: Teilen wie bisher, ohne Frage ----------
  await navigateTo(page,'settings');
  await page.click('#tresorordner [data-tresor=lock]');
  await page.waitForFunction(()=>document.querySelector('#tresorordner')?.dataset.zustand==='gesperrt');
  ok('Gesperrt: Zeile und „entsperren“',await page.locator('#tresorordner [data-tresor=unlock]').count()===1);
  ok('Gesperrt: der Tresor zeigt ● Gesperrt',await page.evaluate(()=>document.querySelector('#tresorordnerOrt .pro-zustand')?.textContent==='Gesperrt'));
  ok('Sperren behält „Passwort merken“ (vergisst den Schlüssel nicht)',tresor.gesperrtMit&&tresor.gesperrtMit.vergessen!==true&&tresor.zustand.gemerkt===true);
  await page.evaluate(()=>PBTresorordner.zeigen());
  ok('Gesperrt bleibt gesperrt: der nächste Zustand öffnet nicht mit dem gemerkten Schlüssel',await page.evaluate(()=>document.querySelector('#tresorordner')?.dataset.zustand)==='gesperrt');
  ok('Gesperrt-Zeile sagt, wo es weitergeht',await page.locator('#tresorordnerZeile').textContent().then(t=>t.startsWith('Gesperrt.')&&t.includes('„Tresorordner entsperren“')));
  ok('Alter Browser-Tresor (eingerichtet) steht direkt unter „Tresor & Ablage“',await page.evaluate(()=>document.getElementById('vaultPlace')?.nextElementSibling?.id==='tresorNote'));
  ok('Gesperrter Tresor-Inhalt: Entsperren-Knopf direkt dabei, kein „oben“',await page.evaluate(()=>{const l=document.getElementById('vaultList');return !!l?.querySelector('#vaultListUnlock')&&!/oben/.test(l.textContent);}));
  await page.click('#vaultListUnlock');
  ok('Der Knopf öffnet sofort das Tresor-Fenster',await page.waitForFunction(()=>getComputedStyle(document.getElementById('tresorModalBg')).display!=='none').then(()=>true,()=>false));
  await page.keyboard.press('Escape');await page.evaluate(()=>{const b=document.getElementById('tresorModalBg');b.classList.remove('on','open','show');b.style.display='';});
  await page.click('[data-tab=mail]');
  await page.locator('#mailWorkspace [data-live-uid="9"]').click();
  const n=folder.calls.filter(c=>c.method==='openOriginal').length;
  // Tablet-Probe 2026-10-28: gesperrt nahm das Teilen still den Android-Weg. Jetzt: fragen „entsperren oder normal teilen?“.
  await share.click();
  await page.waitForSelector('#tresorordnerFrage[data-gesperrt="1"]');
  ok('Gesperrter Ordner: Teilen fragt „entsperren oder normal teilen?“',await page.locator('#tresorordnerFrage [data-wahl=entsperren]').count()===1&&await page.locator('#tresorordnerFrage [data-wahl=teilen]').count()===1&&folder.calls.filter(c=>c.method==='openOriginal').length===n);
  await page.click('#tresorordnerFrage [data-wahl=teilen]');
  for(let i=0;i<20&&folder.calls.filter(c=>c.method==='openOriginal').length===n;i++)await page.waitForTimeout(100);
  ok('„Normal teilen …“ geht den Android-Weg, nichts im Ordner',folder.calls.filter(c=>c.method==='openOriginal').length===n+1&&tresor.mails.length===1);
  const einz=tresor.einzuege||0;
  await share.click();await page.click('#tresorordnerFrage [data-wahl=entsperren]');
  for(let i=0;i<30&&tresor.mails.length===1;i++)await page.waitForTimeout(100);
  ok('„Entsperren und hineinlegen“: erst entsperren, dann liegt die Mail im Eingangsfach',tresor.einzuege===einz+1&&tresor.mails.length===2&&folder.calls.filter(c=>c.method==='openOriginal').length===n+1);
  await navigateTo(page,'settings');await page.click('#tresorordner [data-tresor=lock]');
  await page.waitForFunction(()=>document.querySelector('#tresorordner')?.dataset.zustand==='gesperrt');
  tresor.zustand={...tresor.zustand,gewaehlt:false};
  await page.click('[data-tab=mail]');await page.locator('#mailWorkspace [data-live-uid="9"]').click();
  const m2=folder.calls.filter(c=>c.method==='openOriginal').length;
  await share.click();
  for(let i=0;i<20&&folder.calls.filter(c=>c.method==='openOriginal').length===m2;i++)await page.waitForTimeout(100);
  ok('Ohne gewählten Tresorordner: direkt teilen wie bisher, keine Frage',folder.calls.filter(c=>c.method==='openOriginal').length===m2+1&&await page.locator('#tresorordnerFrage').count()===0);
  tresor.zustand={...tresor.zustand,gewaehlt:true};
  const zaehle=()=>folder.calls.filter(c=>c.method==='tresorVerzeichnis').length;
  let vor=zaehle();
  tresor.zustand={...tresor.zustand,offen:true,eingezogen:true,pruefung:'FREMDER_TRESOR'};
  await page.evaluate(()=>PBTresorordner.aktualisieren(true));
  ok('Hintergrund: kein Verzeichnis, wenn der Ordner nicht zu diesem Tresor passt',zaehle()===vor);
  tresor.zustand={...tresor.zustand,pruefung:'PASST'};
  await page.evaluate(()=>PBTresorordner.aktualisieren(true));
  ok('Hintergrund: passender, offener Ordner bekommt das Verzeichnis',zaehle()===vor+1);
  {
  // Ausgenommen: #libraryStatus (in der App setzt native-folders.js die Zeile) und capP (in der App der App-Text von
  // pb-bildbeschreibung.js über ProCaption) – beide Brücken sind in dieser Probe nicht gestellt.
  const pg=page;
  // Leitfaden § 4 (Klaus 2026-10-28): keine Web-Reste in der App – sichtbarer Text in jeder Ansicht ohne diese Wörter.
  const webWords=/\b(Browser\w*|installier\w*|Installier\w*|localStorage|Browserdaten|dauerhafte[rn]? Speicher|Speicher dauerhaft)\b/;
  const shownWeb=()=>pg.evaluate(src=>{const re=new RegExp(src),found=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=walk.nextNode())){const v=n.nodeValue;if(!re.test(v))continue;const e=n.parentElement;
      if(!e||e.closest('[id^="sbkim-"],[class^="sbkim-"],[hidden],script,style,#diagLog,#libraryStatus,[data-i18n="capP"]'))continue;const own=e.getBoundingClientRect(),cs=getComputedStyle(e);
      if(own.width<=1||own.height<=1||/inset\(50%\)/.test(cs.clipPath)||cs.visibility==='hidden'||parseFloat(cs.opacity)===0||!e.getClientRects().length)continue;found.push((v.match(re)||[''])[0]+' «'+v.trim().slice(0,50)+'»');}
    return found;},webWords.source);
  const webViews={};
  for(const tab of ['search','intake','explorer','overview','order','dupes','settings']){
    await pg.evaluate(t=>{window.PBWorkspace.navigate(t);document.querySelectorAll('#panel-'+t+' details').forEach(d=>d.open=true);document.querySelectorAll('#panel-'+t+' [data-pb-help-toggle][aria-expanded="false"],#panel-'+t+' [data-pro-info][aria-expanded="false"]').forEach(b=>b.click());},tab);await pg.waitForTimeout(250);
    webViews[tab]=await shownWeb();
  }
  const webLeft=Object.entries(webViews).filter(([,v])=>v.length).map(([k,v])=>k+': '+v.join(' | '));
  ok('Keine Web-Reste in der App (Browser, installieren, localStorage, dauerhafter Speicher) – Leitfaden § 4'+(webLeft.length?' — still: '+webLeft.join(' ; '):''),webLeft.length===0);
  }
  ok('Keine Seitenfehler',A.errors.length===0);
  await A.context.close();
  const B=await device('B',{ohneTresor:true});
  ok('Ohne Tresorordner-Brücke (ältere Hülle, Windows) bleibt alles wie bisher',await B.page.evaluate(()=>typeof window.PBTresorordner==='undefined'));
  ok('Alter Browser-Tresor nie eingerichtet: in der Pro-App ausgeblendet (Leitfaden § 2)',await B.page.evaluate(()=>document.getElementById('tresorNote')?.hidden===true&&document.getElementById('vaultNote')?.hidden===true));
  await B.context.close();
  const java=readFileSync(new URL('../../android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProTresorordner.java',import.meta.url),'utf8');
  const plug=readFileSync(new URL('../../android/app/src/main/java/de/familyprojekt/privatebrain/pro/ProVaultPlugin.java',import.meta.url),'utf8');
  // Pro-Umbau 12: dazu fachLesen („Überall suchen“) mit derselben Sperr-Regel → 3 Stellen.
  ok('Java: von Hand gesperrt öffnet weder Zustand noch Hintergrund noch Mail-Ablage noch Fach-Lesen mit dem gemerkten Schlüssel',
    /if \(!vonHandGesperrt\) gemerktEntsperren\(\);/.test(java)&&(java.match(/offen == null && \(vonHandGesperrt \|\| !gemerktEntsperren\(\)\)\)/g)||[]).length===3
    &&/JSONObject fachLesen\(String slug\) throws Exception \{\s*if \(offen == null && \(vonHandGesperrt \|\| !gemerktEntsperren\(\)\)\) throw new IOException\("TRESOR_GESPERRT"\);\s*Fach\.nachSlug\(slug\);/.test(java)
    &&/public void tresorFach\(PluginCall call\) \{ tresorWork\(call, \(\) -> tresor\(\)\.fachLesen\(call\.getString\("fach"\)\)\); \}/.test(plug)
    &&/sperren\(boolean vergessen\) \{\s*schliessen\(\);\s*vonHandGesperrt = true;/.test(java)&&/tresorWeiter\(PluginCall call\) throws Exception \{\s*tresor\(\)\.entsperrenGewuenscht\(\);/.test(plug));
  ok('Java: ein später Tresor-Aufruf nach dem Schließen der App stürzt nicht ab (RejectedExecutionException wird abgelehnt, nicht geworfen)',
    /private void tresorWork\(PluginCall call, Work task\) \{[\s\S]{0,900}?catch \(java\.util\.concurrent\.RejectedExecutionException closed\) \{ call\.reject\("NATIVE_ACTIVITY_CLOSED"/.test(plug));
  console.log(count+' Tresorordner-Proben bestanden (Browser, Android-Plugins gestellt).');
}finally{await browser?.close();}
