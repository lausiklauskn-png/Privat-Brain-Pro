// „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04). Drei Teile:
// 1. JVM: TresorEinrichtungTest (Entscheidung vor dem Passwort; braucht javac/java und junit-4.13.2.jar + hamcrest-core-1.3.jar
//    in TRESOR_JARS, Vorgabe /opt/gradle-8.14.3/lib).
// 2. Quelltext der Android-Seite (ohne SDK nicht übersetzbar): Reihenfolge „erst prüfen, dann schreiben“, Hauptordner als Wurzel.
// 3. Browser gegen das gebaute www/ mit gestellter Brücke: Knopf nur mit tresorEinrichten, Meldungen statt Codes.
// Nicht geprüft hier: Android-Dialoge, SAF-Kennungen, echte SD-Karte – das sagt erst die CI (Übersetzen) und das Gerät.
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
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep))throw Error();res.setHeader('content-type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
 // ---------- 1. JVM ----------
 const jars=process.env.TRESOR_JARS||'/opt/gradle-8.14.3/lib',cp=[join(jars,'junit-4.13.2.jar'),join(jars,'hamcrest-core-1.3.jar')].join(':');
 if(existsSync(join(jars,'junit-4.13.2.jar'))){
  const J=join(repo,'android/app/src/main/java/de/familyprojekt/'),cls=mkdtempSync(join(tmpdir(),'einrichten-'));
  try{
   const tresor=readdirSync(join(J,'tresor')).filter(n=>n.endsWith('.java')&&n!=='SafAblage.java').map(n=>join(J,'tresor',n));
   execFileSync('javac',['-encoding','UTF-8','-d',cls,'-cp',cp,...tresor,...['TresorEinzug','TresorEinrichtung'].map(n=>join(J,'privatebrain/pro',n+'.java')),join(repo,'android/app/src/test/java/de/familyprojekt/privatebrain/pro/TresorEinrichtungTest.java')],{stdio:'pipe'});
   const out=execFileSync('java',['-Dfile.encoding=UTF-8','-cp',cls+':'+cp,'org.junit.runner.JUnitCore','de.familyprojekt.privatebrain.pro.TresorEinrichtungTest'],{encoding:'utf8',env:{...process.env,LANG:'C.UTF-8',LC_ALL:'C.UTF-8'}});
   ok('JVM: TresorEinrichtungTest grün ('+(out.match(/OK \((\d+) tests?\)/)?.[1]||'?')+' Fälle: leerer Speicher, neuer Hauptordner, gefundener Tresor, eigene Ablage gleich/anders, fremder Inhalt, alte Ablage, Unterordner/mehrere, kurzes Passwort, Lies-mich)',/OK \(10 tests\)/.test(out));
  }finally{rmSync(cls,{recursive:true,force:true});}
 }else console.log('– JVM-Teil übersprungen: junit-4.13.2.jar nicht unter '+jars+' (TRESOR_JARS setzen)');

 // ---------- 2. Quelltext ----------
 const P=join(repo,'android/app/src/main/java/de/familyprojekt/privatebrain/pro/');
 const plug=readFileSync(P+'ProVaultPlugin.java','utf8'),vault=readFileSync(P+'Vault.java','utf8'),tro=readFileSync(P+'ProTresorordner.java','utf8');
 const aus=plug.slice(plug.indexOf('private JSONObject einrichtenAusfuehren'),plug.indexOf('@Override protected void handleOnDestroy'));
 const at=s=>aus.indexOf(s);
 ok('Java: erst Tresor-Passwort prüfen, dann eigene Ablage öffnen, erst danach Hauptordner/Ablage/Tresor schreiben',
  at('tresorPasswortPruefen')>0&&at('tresorPasswortPruefen')<at('vault.open(tree, w')&&at('vault.open(tree, w')<at('hauptAnlegen')&&at('hauptAnlegen')<at('vault.create(tree, wurzel')&&at('vault.create(tree, wurzel')<at('mitPasswort'));
 ok('Java: falsches Passwort der Ablage wird TRESOR_ABLAGE_PASSWORT_ANDERS, nicht „falsch“ im Fenster',/VAULT_PASSWORD_WRONG[^\n]*TRESOR_ABLAGE_PASSWORT_ANDERS/.test(aus));
 ok('Java: Tresor wird mit dem Hauptordner als Wurzel gemerkt',at('tresor().baumSetzen(tree, wurzel)')>at('vault.create(tree, wurzel'));
 ok('Java: Planen bekommt die Kennung der schon eingerichteten Ablage (nie still umziehen)',/TresorEinrichtung\.planen\(s, e, name, vault\.configured\(\) \? vault\.tresorId\(\) : null\)/.test(plug));
 ok('Java: Vault sucht/legt an/öffnet ab einem Ordner innerhalb der Freigabe',/String find\(Uri chosen, String base\)/.test(vault)&&/JSONObject create\(Uri chosen, String base,/.test(vault)&&/JSONObject open\(Uri chosen, String base,/.test(vault));
 ok('Java: ProTresorordner nutzt die gemerkte Wurzel, alte Verbindungen ohne Eintrag die Freigabe',/new SafAblage\(context\.getContentResolver\(\), b, wurzel\(b\)\)/.test(tro)&&/w == null \|\| w\.isEmpty\(\) \? DocumentsContract\.getTreeDocumentId\(baum\) : w/.test(tro));

 // ---------- 3. Browser ----------
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 async function seite(mitEinrichten){
  const page=await browser.newPage({viewport:{width:900,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(m=>{
   window.einrichtenCalls=0;window.einrichtenError='';window.verbunden=false;
   const reject=code=>{const e=new Error(code);e.code=code;return Promise.reject(e);};
   const pv={
    async state(){return{configured:false};},
    async volumes(){return{items:[]};},
    async choose(){return{cancelled:true};},
    async attachments(){return{items:[]};},
    async tresorZustand(){return window.verbunden?{uebergaben:true,gewaehlt:true,offen:true,erreichbar:true,ordner:'Family-Projekt',pfad:'Family-Projekt',kennung:'k'}:{uebergaben:true,gewaehlt:false,offen:false,erreichbar:true};},
    async tresorEinziehen(){return{abgebrochen:true};},
    async tresorSperren(){return{};},
    async tresorUebergabe(){return{items:[]};}
   };
   if(m)pv.tresorEinrichten=async a=>{window.einrichtenCalls++;window.einrichtenArgs=a;if(window.einrichtenError)return reject(window.einrichtenError);window.verbunden=true;return{eingezogenJetzt:true,angelegt:true,ablageAngelegt:true,hauptordner:'Family-Projekt',pfad:'Family-Projekt'};};
   window.Capacitor={Plugins:{ProFiles:{},ProVault:pv}};
  },mitEinrichten);
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.PBWorkspace&&window.PBOrdnerHinweis);
  await navigateTo(page,'settings');
  await page.waitForSelector('#pro-verbund button');
  return {page,errors};
 }
 {
  const {page,errors}=await seite(false);
  ok('Ohne tresorEinrichten (Windows, ältere Hülle): kein Ein-Schritt-Knopf, alter Weg bleibt',await page.locator('[data-tresor-einrichten]').count()===0&&await page.locator('#pro-verbund button',{hasText:'Pro-Tresor verbinden'}).count()===1);
  ok('Keine Seitenfehler (ohne)',errors.length===0);await page.close();
 }
 const {page,errors}=await seite(true);
 const b=page.locator('#pro-verbund [data-tresor-einrichten]');
 ok('Mit tresorEinrichten: Knopf „Tresor einrichten – nur Speicher wählen …“ steht vorn und farbig',await b.innerText()==='Tresor einrichten – nur Speicher wählen …'&&await b.getAttribute('class')==='primary'&&await page.evaluate(()=>document.querySelector('#pro-verbund .btnrow button')?.hasAttribute('data-tresor-einrichten')));
 ok('Daneben bleibt „Pro-Tresor verbinden …“ für einen vorhandenen Tresor',await page.locator('#pro-verbund button',{hasText:'Pro-Tresor verbinden'}).count()===1);
 for(const [code,muster] of [['VAULT_ANDERER_ORT',/schon an einem anderen Ort eingerichtet.*Nichts wurde verändert/],['TRESOR_ORDNER_UNTERORDNER',/Ordner im Tresor.*Speicher selbst wählen/],['TRESOR_ABLAGE_PASSWORT_ANDERS',/öffnet den Tresor, aber nicht die Ablage/],['TRESOR_NAME_BELEGT',/nicht leer.*anderen Namen/],['TRESOR_ORDNER_MEHRERE',/mehrere Tresore/]]){
  await page.evaluate(c=>{window.einrichtenError=c;},code);
  await b.click();
  await page.waitForFunction(m=>new RegExp(m,'s').test(document.querySelector('#pro-verbund')?.textContent||''),muster.source);
  ok('Abgewiesen '+code+': klare Meldung statt Code',!new RegExp(code).test(await page.locator('#pro-verbund').innerText()));
 }
 ok('Sprache und Thema gehen an das Android-Fenster',await page.evaluate(()=>window.einrichtenArgs?.language==='de'&&'dark' in window.einrichtenArgs));
 await page.evaluate(()=>{window.einrichtenError='';});
 await b.click();
 await page.waitForFunction(()=>/Tresor eingerichtet: Family-Projekt/.test(document.querySelector('#pro-verbund')?.textContent||''));
 ok('Eingerichtet: Meldung nennt den Hauptordner, Knopf verschwindet, Kasten zeigt „Verbunden“',await page.locator('[data-tresor-einrichten]').count()===0&&/Verbunden: Family-Projekt/.test(await page.locator('#pro-verbund').innerText()));
 await page.evaluate(()=>{document.documentElement.lang='en';window.verbunden=false;});
 await page.evaluate(()=>window.dispatchEvent(new Event('pb-pro-receipts')));
 await page.waitForFunction(()=>document.querySelector('#pro-verbund [data-tresor-einrichten]')?.textContent==='Set up vault – just choose storage …').catch(()=>{});
 ok('Englisch: „Set up vault – just choose storage …“',await page.locator('[data-tresor-einrichten]').innerText().catch(()=>'')==='Set up vault – just choose storage …');
 ok('Keine Seitenfehler',errors.length===0);
 console.log(`${count} Ein-Schritt-Tresor-Proben bestanden (JVM, Quelltext, Browser mit gestellter Brücke; Android-Dialoge und Gerät nicht geprüft).`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
