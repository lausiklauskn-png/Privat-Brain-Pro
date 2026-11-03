// Gemeinsamer Tresor-Plan (Klaus 2026-11-03: „Ja zum Plan“): Ersatzschlüssel nicht neben den Tresor, Ordnerwahl einheitlich,
// Hilfe „Wo liegt was?“. Browser-Teil gegen das gebaute www/ mit gestellten Android-Plugins; JVM-Teil OrdnerWahlTest
// (braucht javac/java und junit-4.13.2.jar + hamcrest-core-1.3.jar in TRESOR_JARS, Vorgabe /opt/gradle-8.14.3/lib).
// Nicht geprüft hier: die Android-Seite (Speichern-unter-Dialog, SAF-Kennungen, Passwort-Fenster) – nur am Quelltext.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {readFileSync,existsSync,mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve,sep,extname,join} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const repo=resolve(new URL('../..',import.meta.url).pathname),root=resolve(process.env.PB_PRO_TEST_ROOT||join(repo,'www'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep))throw Error();res.setHeader('content-type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
 // ---------- JVM: OrdnerWahl (Einordnung der Ordner, Ersatzschlüssel im/neben dem Tresor) ----------
 const jars=process.env.TRESOR_JARS||'/opt/gradle-8.14.3/lib',cp=[join(jars,'junit-4.13.2.jar'),join(jars,'hamcrest-core-1.3.jar')].join(':');
 if(existsSync(join(jars,'junit-4.13.2.jar'))){
  const J=join(repo,'android/app/src/main/java/de/familyprojekt/'),cls=mkdtempSync(join(tmpdir(),'ordnerwahl-'));
  try{
   const tresor=readdirSync(join(J,'tresor')).filter(n=>n.endsWith('.java')&&n!=='SafAblage.java').map(n=>join(J,'tresor',n));
   execFileSync('javac',['-encoding','UTF-8','-d',cls,'-cp',cp,...tresor,...['OrdnerWahl','VaultCrypto'].map(n=>join(J,'privatebrain/pro',n+'.java')),join(repo,'android/app/src/test/java/de/familyprojekt/privatebrain/pro/OrdnerWahlTest.java')],{stdio:'pipe'});
   const out=execFileSync('java',['-Dfile.encoding=UTF-8','-Dsun.jnu.encoding=UTF-8','-cp',cls+':'+cp,'org.junit.runner.JUnitCore','de.familyprojekt.privatebrain.pro.OrdnerWahlTest'],{encoding:'utf8',env:{...process.env,LANG:'C.UTF-8',LC_ALL:'C.UTF-8'}});
   ok('JVM: OrdnerWahlTest grün ('+(out.match(/OK \((\d+) tests?\)/)?.[1]||'?')+' Fälle: Karte vom 3.11., Speicherort, Tresor verbinden, Ersatzschlüssel im/neben dem Tresor)',/OK \(5 tests\)/.test(out));
  }finally{rmSync(cls,{recursive:true,force:true});}
 }else console.log('– JVM-Teil übersprungen: junit-4.13.2.jar nicht unter '+jars+' (TRESOR_JARS setzen)');

 // ---------- Quelltext der Android-Seite (nicht übersetzbar ohne SDK, daher nur die Reihenfolge der Schritte) ----------
 const P=join(repo,'android/app/src/main/java/de/familyprojekt/privatebrain/pro/');
 const files=readFileSync(P+'ProFilesPlugin.java','utf8'),vaultPlug=readFileSync(P+'ProVaultPlugin.java','utf8');
 const saved=files.slice(files.indexOf('private void recoverySaved'),files.indexOf('private void clearRecovery'));
 ok('Java: Ersatzschlüssel wird erst nach der Prüfung „im/neben dem Tresor“ geschrieben',saved.indexOf('nebenTresor(destination)')>0&&saved.indexOf('nebenTresor(destination)')<saved.indexOf('openOutputStream')&&/put\("nebenTresor", true\)/.test(saved));
 const chosen=vaultPlug.slice(vaultPlug.indexOf('private void folderChosen'),vaultPlug.indexOf('private String ordnerName'));
 ok('Java: Speicherort prüft die Wahl vor dem Suchen/Anlegen',chosen.indexOf('OrdnerWahl.speicherortFehler')>0&&chosen.indexOf('OrdnerWahl.speicherortFehler')<chosen.indexOf('vault.find(tree)'));
 const tresorWahl=vaultPlug.slice(vaultPlug.indexOf('private void tresorGewaehlt'),vaultPlug.indexOf('private void tresorWeiter'));
 ok('Java: Tresor verbinden lehnt Verwaltung/Fach vor dem Merken des Ordners ab',tresorWahl.indexOf('OrdnerWahl.tresorFehler')>0&&tresorWahl.indexOf('OrdnerWahl.tresorFehler')<tresorWahl.indexOf('baumSetzen'));
 ok('Java: neuer gemeinsamer Tresor nur mit eigenem Haken „hier neu anlegen“',/if \(anlegen && !confirmNeu\.isChecked\(\)\)/.test(vaultPlug));

 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:900,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.exports=[];window.saveModes=[];window.chooseError='';window.einziehenError='';window.einziehenCalls=0;
  const answer=()=>{const mode=window.saveModes.shift()||'saved';if(mode==='beside')return{cancelled:true,saved:false,nebenTresor:true};return mode==='saved'?{saved:true}:{cancelled:true,saved:false};};
  const reject=code=>{const e=new Error(code);e.code=code;return Promise.reject(e);};
  window.Capacitor={Plugins:{
   ProFiles:{async saveRecoveryKeys(data){window.exports.push(data);return answer();}},
   ProVault:{
    async state(){return{configured:false};},
    async volumes(){return{items:[{id:'primary',label:'Intern',primary:true,removable:false},{id:'1A2B-3C4D',label:'SD',primary:false,removable:true}]};},
    async choose(){return window.chooseError?reject(window.chooseError):{cancelled:true};},
    async attachments(){return{items:[]};},
    async tresorZustand(){return{uebergaben:true,gewaehlt:false,offen:false,erreichbar:true};},
    async tresorEinziehen(a){window.einziehenCalls++;window.einziehenArgs=a;return window.einziehenError?reject(window.einziehenError):{abgebrochen:true};},
    async tresorSperren(){return{};},
    async tresorUebergabe(){return{items:[]};}
   }}};
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.waitForFunction(()=>window.PBTresor&&window.PBRecoveryExport&&window.PBWorkspace&&window.PBOrdnerHinweis);
 await navigateTo(page,'settings');

 // ---------- 1. Ersatzschlüssel: Warnung bei Ort im/neben dem Tresor ----------
 await page.evaluate(()=>{const b=document.getElementById('tresorSetup');if(b){b.hidden=false;let e=b;while(e&&e!==document.body){if(e.hidden)e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}}});
 await page.click('#tresorSetup');
 const pw='synthetic-tresor-plan-2026';
 await page.evaluate(()=>{window.saveModes=['beside','saved'];});
 await page.fill('#tzPw',pw);await page.fill('#tzPw2',pw);await page.click('#tzMk');
 await page.waitForSelector('#recoveryBesideVault[open]');
 const warn=await page.locator('#recoveryBesideVault').innerText();
 ok('Warnung erscheint: „Nicht neben den Tresor legen“, wer die Karte hat, hätte alles, ausdrucken/anderes Gerät',/Nicht neben den Tresor legen/.test(warn)&&/Wer die Karte hat, hätte damit alles/.test(warn)&&/Ausdrucken oder auf einem anderen Gerät\/Stick/.test(warn));
 ok('Warnung nennt ehrlich, wo das erkennbar ist (Tablet-Speicher, SD-Karte)',/nur auf dem Tablet-Speicher und der SD-Karte/.test(warn));
 ok('Bis zur Wahl ist nichts als gesichert freigegeben',await page.locator('#tzSaved').isDisabled()&&await page.locator('#tzFinish').isDisabled());
 await page.click('#recoveryBesideVault [data-wahl=otherPlace]');
 await page.waitForFunction(()=>!document.querySelector('#tzSaved').disabled);
 ok('„Anderen Ort wählen …“ öffnet das Speichern erneut mit denselben fünf Schlüsseln',await page.evaluate(()=>exports.length===2&&JSON.stringify(exports[0].shares)===JSON.stringify(exports[1].shares)&&exports[1].shares.length===5));
 ok('Nach dem Speichern an anderem Ort geht der bisherige Ablauf weiter (Bestätigung nötig)',await page.locator('#tzFinish').isDisabled()&&/gespeichert/.test(await page.locator('#tzErr').innerText()));
 await page.evaluate(()=>{window.saveModes=['beside'];});
 await page.click('#tzDl');await page.waitForSelector('#recoveryBesideVault[open]');
 await page.click('#recoveryBesideVault [data-wahl=cancel]');
 await page.waitForFunction(()=>/im oder neben dem Tresor/.test(document.querySelector('#tzErr').textContent));
 ok('„Abbrechen“: nichts gesichert, Einrichtung bleibt gesperrt, klare Meldung',await page.locator('#tzSaved').isDisabled()&&await page.locator('#tzFinish').isDisabled()&&await page.evaluate(()=>exports.length===3));
 await page.click('#tresorModalBg button[data-tclose]');

 // ---------- 2. Hilfe „Wo liegt was?“ im Kasten Tresor & Ablage ----------
 ok('Knopf „Wo liegt was?“ steht im Kasten Tresor & Ablage',await page.locator('#vaultPlace #woLiegtWasKnopf').innerText()==='Wo liegt was?');
 await page.click('#woLiegtWasKnopf');await page.waitForSelector('#woLiegtWas[open]');
 const hilfe=await page.locator('#woLiegtWas').innerText();
 ok('Hilfe: Tresor = Ordner mit „tresorordner.json“, nie „Tresorordner“ oder App-Ordner wählen',/in dem die Datei „tresorordner.json“ liegt/.test(hilfe)&&/Nie den Unterordner „Tresorordner“ wählen/.test(hilfe));
 ok('Hilfe: Eingang-Briefkästen, Nummern-Dateinamen, keine offenen Dateien, ein Passwort',/Briefkästen/.test(hilfe)&&/nur nach Nummern/.test(hilfe)&&/Offene Dateien \(PDF, \.json, \.txt\)/.test(hilfe)&&/Ein Passwort gilt für alle Pro-Apps/.test(hilfe));
 ok('Hilfe app-eigen: Fach „Private Brain“, Eingang „Eingang-Private-Brain“, Menüweg zum Verbinden',/Fach „Private Brain“ · Eingang: „Eingang-Private-Brain“/.test(hilfe)&&/Pro-Tresor verbinden/.test(hilfe));
 ok('Hilfe: „Ablageordner wählen“ legt UNVERSCHLÜSSELTE Kopien an, kein Tresor, ausschaltbar',/„Ablageordner wählen“.*UNVERSCHLÜSSELTE Kopien.*kein Tresor.*Kopieren ausschalten/s.test(hilfe));
 ok('Hilfe verweist auf „Original teilen / sichern“',/„Original teilen \/ sichern“/.test(hilfe));
 await page.click('#woLiegtWas button');
 await page.evaluate(()=>{document.documentElement.lang='en';});
 await page.waitForFunction(()=>document.querySelector('#woLiegtWasKnopf')?.textContent==='What is where?');
 await page.click('#woLiegtWasKnopf');await page.waitForSelector('#woLiegtWas[open]');
 ok('Hilfe auf Englisch',/contains the file “tresorordner.json”/.test(await page.locator('#woLiegtWas').innerText()));
 await page.click('#woLiegtWas button');await page.evaluate(()=>{document.documentElement.lang='de';});

 // ---------- 3. Speicherort: falscher Ordner im Tresor → klare Meldung, gleicher Hinweissatz im Dialog ----------
 await page.click('#vault-choose');await page.waitForSelector('.native-vault-where');
 ok('Speicherort-Dialog nennt denselben Hinweissatz (Ordner mit „tresorordner.json“, dort „Private Brain“)',/Wähle den Ordner, in dem „tresorordner.json“ liegt – Private Brain nutzt darin seinen Ordner „Private Brain“/.test(await page.locator('.native-vault-where').innerText()));
 await page.evaluate(()=>{window.chooseError='VAULT_FOLDER_IM_TRESOR';});
 await page.locator('.native-vault-where button',{hasText:'SD-Karte'}).click();
 await page.waitForFunction(()=>/tresorordner\.json/.test(document.querySelector('#vaultStatus')?.textContent||''));
 ok('Verwaltung/fremdes Fach als Speicherort: Meldung statt Code, „Nichts wurde verändert“',/anderen App im gemeinsamen Tresor.*Nichts wurde verändert/.test(await page.locator('#vaultStatus').innerText()));

 // ---------- 4. Pro-Tresor verbinden: falscher Ordner → klare Meldung ----------
 await page.waitForSelector('#pro-verbund button');
 ok('Zusammenarbeit mit Pro-Apps nennt den Hinweissatz',/Wähle den Ordner, in dem „tresorordner.json“ liegt\./.test(await page.locator('#pro-verbund').innerText()));
 await page.evaluate(()=>{window.einziehenError='TRESOR_ORDNER_VERWALTUNG';});
 await page.locator('#pro-verbund button',{hasText:'Pro-Tresor verbinden'}).click();
 await page.waitForFunction(()=>/Verwaltungsordner/.test(document.querySelector('#pro-verbund')?.textContent||''));
 ok('„Tresorordner“ gewählt: „Verwaltungsordner … Wähle den Ordner, in dem tresorordner.json liegt“',/Verwaltungsordner „Tresorordner“.*Wähle den Ordner, in dem „tresorordner.json“ liegt/s.test(await page.locator('#pro-verbund').innerText())&&await page.evaluate(()=>einziehenArgs?.nurVerbinden===true));
 await page.evaluate(()=>{window.einziehenError='TRESOR_ORDNER_IST_FACH';});
 await page.locator('#pro-verbund button',{hasText:'Pro-Tresor verbinden'}).click();
 await page.waitForFunction(()=>/App-Ordner im Tresor/.test(document.querySelector('#pro-verbund')?.textContent||''));
 ok('„Private Brain“ gewählt: „App-Ordner im Tresor … Ebene darüber“',/App-Ordner im Tresor.*Ebene darüber/s.test(await page.locator('#pro-verbund').innerText()));
 ok('Keine unbehandelten Fehler in der Seite',errors.length===0);
 console.log(`${count} Tresor-Plan-Proben bestanden (Browser mit gestellten Android-Plugins, JVM OrdnerWahl; Android-Dialoge nicht am Gerät).`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
