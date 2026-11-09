// Pro-App-Verbund (Vorschau), Klaus 2026-11-09. Echter Browser gegen das gebaute Webpaket (www/, npm run build:web).
// Geprüft: Karte byte-gleich mit dem Pin und im Paket, Kasten in den Einstellungen mit ⓘ-Satz, Tipp öffnet den
// Vollbild-Rahmen (kein neues Fenster), im Rahmen steht die Landkarte (#graph), Schließen und Zurück (wie Android) schließen ihn,
// Sprache wechselt die Beschriftung. Gegenprobe: tools/native/gegenprobe-verbund-karte.mjs.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve(process.env.PB_WWW||'www');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
  const file=resolve(root,'.'+path.replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+sep))return res.writeHead(403).end();
  try{const d=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'}).end(d);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0,fail=0;
const ok=(n,v)=>{if(v){console.log('✓ '+n);count++;}else{console.log('✗ '+n);fail++;}};
try{
  const pin=JSON.parse(await readFile('assets/pro-verbund.herkunft.json','utf8'));
  const quelle=await readFile('assets/pro-verbund.html');
  ok('Die Karte ist byte-gleich mit ihrem Pin (Quelle BookLedgerPro)',createHash('sha256').update(quelle).digest('hex')===pin.sha256&&pin.quelle==='lausiklauskn-png/BookLedgerPro');
  ok('Die Karte liegt unverändert im App-Paket',quelle.equals(await readFile(resolve(root,'assets/pro-verbund.html')).catch(()=>Buffer.alloc(0))));
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/google-chrome',args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const popups=[];page.on('popup',p=>popups.push(p));
  await page.goto(url);
  const da=await page.waitForFunction(()=>document.getElementById('pbVerbundKarte'),null,{timeout:15000}).then(()=>true,()=>false);
  ok('Der Kasten „Pro-App-Verbund (Vorschau)“ steht in den Einstellungen',da&&await page.evaluate(()=>{const k=document.getElementById('pbVerbundKarte');return k.closest('#panel-settings')&&/Pro-App-Verbund \(Vorschau\)/.test(k.querySelector('h3')?.textContent||'');}));
  if(!da)throw new Error('Kasten fehlt – weitere Schritte nicht messbar');
  ok('Der ⓘ-Satz nennt BookLedgerPro, Workflow PDF Pro und die Familienakte',await page.evaluate(()=>{const t=document.querySelector('#pbVerbundKarte [data-pro-info-inhalt]')?.textContent||'';return /BookLedgerPro/.test(t)&&/Workflow PDF Pro/.test(t)&&/Familienakte/.test(t)&&/Farben/.test(t);}));
  ok('Keine Emojis im Kasten',await page.evaluate(()=>!/\p{Extended_Pictographic}/u.test(document.getElementById('pbVerbundKarte').textContent)));
  await page.evaluate(()=>{document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='panel-settings'));});
  await page.click('#pbVerbundKarte [data-pro-knopf="verbund-karte"]');
  const offen=await page.waitForFunction(()=>document.querySelector('dialog.pb-verbund-rahmen')?.open,null,{timeout:5000}).then(()=>true,()=>false);
  ok('Der Tipp öffnet den Vollbild-Rahmen, kein neues Fenster',offen&&popups.length===0&&await page.evaluate(()=>{const r=document.querySelector('dialog.pb-verbund-rahmen').getBoundingClientRect();return r.width>=innerWidth-2&&r.height>=innerHeight-2;}));
  const frame=offen&&await page.waitForFunction(()=>{const f=document.querySelector('iframe[data-verbund-karte]');return f?.contentDocument?.getElementById('graph')?true:false;},null,{timeout:10000}).then(()=>true,()=>false);
  ok('Im Rahmen steht die Landkarte (#graph)',frame);
  if(offen){
    await page.click('[data-verbund-schliessen]');
    ok('Schließen nimmt den Rahmen weg',await page.waitForFunction(()=>!document.querySelector('.pb-verbund-rahmen'),null,{timeout:5000}).then(()=>true,()=>false));
    await page.click('#pbVerbundKarte [data-pro-knopf="verbund-karte"]');
    await page.waitForFunction(()=>document.querySelector('dialog.pb-verbund-rahmen')?.open);
    const zurueck=await page.evaluate(()=>window.PBNavigation?.back());
    ok('Zurück (wie Android-Zurück) schließt den Rahmen',zurueck===true&&await page.waitForFunction(()=>!document.querySelector('.pb-verbund-rahmen'),null,{timeout:5000}).then(()=>true,()=>false));
  }
  await page.evaluate(()=>{document.documentElement.lang='en';});
  ok('Englisch: Titel und Knopf folgen der Sprache',await page.waitForFunction(()=>/Pro app network \(preview\)/.test(document.querySelector('#pbVerbundKarte h3')?.textContent||'')&&document.querySelectorAll('#pbVerbundKarte').length===1,null,{timeout:5000}).then(()=>true,()=>false));
  ok('Keine unbehandelten Seitenfehler',errors.length===0||(console.log(errors),false));
  await ctx.close();
}finally{await browser?.close();server.close();}
console.log(`\n${count} grün · ${fail} rot`);
assert.equal(fail,0,'Verbund-Karte: rote Zeilen');
