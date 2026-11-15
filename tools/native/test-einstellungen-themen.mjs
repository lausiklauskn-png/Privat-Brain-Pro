// Einstellungen nach Themen und kompakte Reihen (Klaus 15.11.2026, Punkte D, A, C). Echte Pro-Web-Fassung aus www/.
// Die Themen sind am Gerät immer an; in Playwright (navigator.webdriver) nur mit localStorage pb_einstellungen_themen = "an".
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
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
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{localStorage.setItem('pb_einstellungen_themen','an');}catch{}});
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&window.PBEinstellungen&&typeof db!=='undefined'&&db);
  await page.evaluate(()=>PBWorkspace.navigate('settings'));
  await page.waitForSelector('#pbThemen button',{state:'visible'});
  const themen=await page.$$eval('#pbThemen button',b=>b.map(x=>x.dataset.thema));
  ok('Zahnrad zeigt zuerst nur Themen-Knöpfe (Tresor, Sprache, Siegel …)',['tresor','sprache','siegel','werkzeuge','app'].every(k=>themen.includes(k))&&await page.evaluate(()=>[...document.querySelectorAll('#panel-settings>*')].filter(e=>e.dataset.pbThema&&e.getClientRects().length).length===0));
  ok('Knopf heißt „Siegel & Chefcode“',(await page.locator('#pbThemen [data-thema="siegel"]').innerText()).trim()==='Siegel & Chefcode');
  await page.click('#pbThemen [data-thema="sprache"]');
  ok('Ein Tipp zeigt nur dieses Thema, oben „‹ Alle Themen“',await page.locator('#pb-input-language-settings').isVisible()&&!await page.locator('#pb-license').isVisible()&&await page.locator('#pbThemaKopf button').isVisible()&&!await page.locator('#pbThemen').isVisible());
  const reihe=await page.evaluate(()=>{const s=document.getElementById('pb-input-language-setting'),m=document.getElementById('pb-microphone-setting'),b=document.getElementById('pb-microphone-search');const r=e=>e.getBoundingClientRect();return {eine:Math.abs(r(s).top-r(m).top)<6&&Math.abs(r(m).top-r(b).top)<6,hoch:Math.abs(r(m).height-r(b).height)<=1,text:b.textContent,titel:b.title};});
  ok('Sprache, Mikrofon und „Mikrofone suchen“ in einer Reihe',reihe.eine);
  ok('„Mikrofone suchen“ so hoch wie die Mikrofon-Auswahl',reihe.hoch);
  ok('Knopf sagt, was er tut (Bluetooth, Kabel)',reihe.text==='Mikrofone suchen'&&/Bluetooth/.test(reihe.titel)&&/Kabel/.test(reihe.titel));
  ok('Kein Satz „Diktat folgt …“ mehr',!/Diktat folgt/.test(await page.locator('#pb-input-language-settings').innerText()));
  await page.click('#pbThemaKopf button');
  ok('„‹ Alle Themen“ führt zurück zu den Knöpfen',await page.locator('#pbThemen').isVisible()&&!await page.locator('#pb-input-language-settings').isVisible());
  await page.evaluate(()=>document.getElementById('pb-license').scrollIntoView());
  ok('Ein Sprung zu einem Kasten öffnet dessen Thema von selbst',await page.locator('#pb-license').isVisible()&&await page.evaluate(()=>PBEinstellungen.thema==='werkzeuge'));
  await page.click('#pbThemaKopf button');
  await page.evaluate(()=>{const p=document.createElement('p');p.textContent='Ordner nicht erreichbar: Probe';document.getElementById('tresorNote').append(p);});
  await page.waitForFunction(()=>document.querySelector('#pbThemen [data-thema="tresor"]')?.dataset.rot==='1');
  ok('Thema mit Fehler trägt einen roten Punkt',await page.locator('#pbThemen [data-thema="tresor"] .pb-thema-rot').count()===1);
  await page.click('#pbThemen [data-thema="tresor"]');
  const tresor=await page.evaluate(()=>{const n=document.getElementById('tresorNote'),h=n.querySelector('h3').getBoundingClientRect(),st=document.getElementById('tresorState').getBoundingClientRect();return Math.abs(h.top-st.top)<14;});
  ok('Tresor — Verschlüsselung: Titel und Zustand in einer Reihe',tresor);
  await page.evaluate(()=>PBWorkspace.navigate('search'));await page.evaluate(()=>PBWorkspace.navigate('settings'));
  ok('Wer die Einstellungen neu öffnet, landet wieder bei den Themen',await page.locator('#pbThemen').isVisible()&&await page.evaluate(()=>PBEinstellungen.thema===null));
  ok('Keine Seitenfehler',errors.length===0);
}finally{await browser?.close();server.close();}
console.log(`Einstellungen nach Themen: ${count} grün`);
