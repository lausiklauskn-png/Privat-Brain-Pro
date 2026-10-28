// Pro-Umbau 4 (Leitfaden § 3): Einordnen und „Alle prüfen“ melden sich beim gemeinsamen Hintergrund-Dienst an
// (pro-hintergrund.js → Android ProHintergrundDienst) und wieder ab. Die Android-Brücke ist gestellt und zählt
// beginnen/stand/ende; Modul 03 ist gestellt (ProSemantic: Modell installiert). Seite, Wache und Prüfstelle sind echt.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const stub03=`window.SbkimEmbedding={inits:0,async init(){this.inits++;},isReady(){return this.inits>0;},async embedPassage(){await new Promise(r=>setTimeout(r,200));return new Float32Array(384);},async embedQuery(){return new Float32Array(384);}};`;
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const url=`http://127.0.0.1:${server.address().port}/`;
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.route('**/*',r=>{const u=r.request().url();
    if(u.includes('/modules/03_embedding.js'))return r.fulfill({contentType:'text/javascript',body:stub03});
    return u.startsWith(url)?r.continue():r.abort();});
  await page.addInitScript(()=>{
    const TOTAL=118*1048576,log=window.__hg=[];let hoerer=null;
    window.__ids={};window.__abbruch=art=>{const id=__ids[art];if(hoerer&&id)hoerer({id,grund:'mitteilung'});return !!id;};
    window.Capacitor={getPlatform:()=>'android',isNativePlatform:()=>true,Plugins:{
      ProSemantic:{async getState(){return{installed:true,running:false,present:TOTAL,total:TOTAL,files:7,crashes:0,lastGone:''};},
        async install(){return{};},async cancel(){return{};},async remove(){return{};},async markLoading(){return{};},async markLoaded(){return{};},async clearCrash(){return{};},addListener(){return{remove(){}};}},
      ProHintergrund:{aufraeumen:async()=>{log.push(['aufraeumen']);},erlauben:async()=>({mitteilung:true}),
        beginnen:async o=>{const art=o.id.split('-')[0];__ids[art]=o.id;log.push(['beginnen',art,o.titel]);return {geschuetzt:true};},
        stand:async o=>{log.push(['stand',o.id.split('-')[0],o.text]);},ende:async o=>{log.push(['ende',o.id.split('-')[0]]);},
        addListener:(n,fn)=>{hoerer=fn;return {remove(){}};}}
    }};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&window.SbkimEmbedding&&window.PBSemantic&&window.ProHintergrund&&window.PBCheck);
  const n=(art,was)=>page.evaluate(([a,w])=>__hg.filter(e=>e[0]===w&&e[1]===a).length,[art,was]);

  ok('Beim Laden räumt die Seite alte Aufgaben ab',await page.evaluate(()=>__hg[0]?.[0]==='aufraeumen'));
  await page.evaluate(()=>SbkimEmbedding.embedQuery('Rechnung'));
  ok('Die Suchfrage allein meldet keine Aufgabe an',await n('einordnen','beginnen')===0);
  await page.evaluate(()=>Promise.all([1,2,3].map(i=>SbkimEmbedding.embedPassage('Abschnitt '+i))));
  ok('Einordnen meldet sich mit „Einordnen läuft“ an (einmal für den ganzen Schwung)',await n('einordnen','beginnen')===1&&await page.evaluate(()=>__hg.some(e=>e[0]==='beginnen'&&e[1]==='einordnen'&&e[2]==='Einordnen läuft')));
  ok('… und läuft noch, solange gerechnet wurde',await n('einordnen','ende')===0);
  await page.waitForFunction(()=>__hg.some(e=>e[0]==='ende'&&e[1]==='einordnen'),null,{timeout:8000});
  ok('3 s nach der letzten Rechnung meldet es sich ab',await n('einordnen','ende')===1);
  await page.evaluate(()=>SbkimEmbedding.embedPassage('neu'));
  await page.waitForFunction(()=>__hg.filter(e=>e[0]==='beginnen'&&e[1]==='einordnen').length===2,null,{timeout:5000});
  ok('„Abbrechen“ in der Mitteilung nimmt den Schutz weg',await page.evaluate(()=>__abbruch('einordnen'))&&await page.waitForFunction(()=>__hg.filter(e=>e[0]==='ende'&&e[1]==='einordnen').length===2,null,{timeout:5000}).then(()=>true));
  await page.evaluate(()=>SbkimEmbedding.embedPassage('noch eins'));await new Promise(r=>setTimeout(r,400));
  ok('… und meldet sich danach nicht sofort wieder an (60 s Ruhe)',await n('einordnen','beginnen')===2);

  // „Alle prüfen“ im Ordner Mail-Anhänge: zwei Einträge ohne Datei (werden als nicht geprüft genannt)
  await page.evaluate(async()=>{const b=document.createElement('button');document.body.append(b);
    await PBCheck.checkVaultAll([{id:'a',name:'a.pdf',sha256:'a'.repeat(64)},{id:'b',name:'b.pdf',sha256:'b'.repeat(64)}],b);});
  ok('„Alle prüfen“ meldet sich mit „Prüfen läuft“ an und wieder ab',await n('pruefen','beginnen')===1&&await n('pruefen','ende')===1&&await page.evaluate(()=>__hg.some(e=>e[0]==='beginnen'&&e[1]==='pruefen'&&e[2]==='Prüfen läuft')));
  ok('Keine Seitenfehler',errors.length===0);
  console.log(count+' Proben der Hintergrundaufgabe in Private Brain Pro bestanden.');
}finally{await browser?.close();server.close();}
