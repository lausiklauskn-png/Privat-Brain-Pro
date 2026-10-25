// 🎬 Filme in der App (Klaus 2026-10-25). Echter Browser, gestellte Videoseite mit einem kleinen VP9-Film in drei Teilen
// (der Testbrowser spielt kein H.264). Geprüft: Knopf neben dem Zahnrad in der Navigationsleiste und nicht vom Siegel
// verdeckt, App-Weg (Teile holen, SHA-256, abspielen), beschädigter Teil, Herunterladen über ProLinks, Browser-Weg auf
// demselben Ursprung (Spieler der Videoseite im Rahmen). Dieselbe Probe steht angepasst in Privat-Brain-Pro-V3.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www');
const film=await readFile('tools/native/fixtures/film-probe.webm');
const cut=[0,Math.floor(film.length/3),Math.floor(film.length*2/3),film.length];
const parts=[0,1,2].map(i=>film.subarray(cut[i],cut[i+1]));
const sha=b=>createHash('sha256').update(b).digest('hex');
let broken=false;
const list=()=>JSON.stringify({fassung:1,videos:[
  {id:'private-brain-pro-film',titel:'Werbefilm',groesse:film.length,dauer:105,sha256:sha(film),teile:parts.map(p=>({groesse:p.length,sha256:sha(p)}))},
  {id:'private-brain-pro-handbuch',titel:'Handbuch',groesse:film.length,dauer:223,sha256:sha(film),teile:parts.map(p=>({groesse:p.length,sha256:sha(p)}))}]});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
let served=0;
const mock=path=>{
  if(path==='/fpv/videos.json')return{status:200,type:'application/json',body:list()};
  if(path==='/fpv/abspielen.html')return{status:200,type:'text/html',body:'<!doctype html><title>Spieler</title><p id=spieler>Spieler der Videoseite</p>'};
  const m=/^\/fpv\/videos\/[a-z-]+\/teil-0(\d)\.bin$/.exec(path);
  if(m&&parts[+m[1]]){served++;const b=Buffer.from(parts[+m[1]]);if(broken&&m[1]==='1')b[10]^=255;return{status:200,type:'application/octet-stream',body:b};}
  return{status:404,type:'text/plain',body:''};
};
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://x').pathname;
  if(path.startsWith('/fpv/')){const r=mock(path);return res.writeHead(r.status,{'content-type':r.type}).end(r.body);}
  const file=resolve(root,'.'+path.replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+sep))return res.writeHead(403).end();
  try{const d=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'}).end(d);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0;const ok=(n,v)=>{assert.ok(v,n);console.log('✓ '+n);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  // filme.js ist byte-gleich mit V3 und kennt das Zahnrad der Pro-Leiste nicht; native-filme.js rückt den Knopf dorthin.
  ok('filme.js is byte-identical in the source and the native bundle',(await readFile('assets/filme.js')).equals(await readFile('www/assets/filme.js')));
  // App-Weg: anderer Ursprung als die Videoseite (wie Android/Windows).
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  // Die Videoseite liegt für die App auf einem fremden https-Ursprung (wie github.io); die Probe beantwortet ihn selbst.
  const FPV='https://videos.probe.invalid';
  await ctx.addInitScript(base=>{window.PB_FILME_BASIS=base;window.__opened=[];window.Capacitor={Plugins:{ProLinks:{async open(o){window.__opened.push(o.url);return{ok:true};}}}};},FPV+'/fpv/');
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith(FPV)){const m=mock(new URL(u).pathname);return r.fulfill({status:m.status,contentType:m.type,headers:{'access-control-allow-origin':'*'},body:m.body});}return u.startsWith(url)?r.continue():r.abort();});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>window.PBFilme&&document.getElementById('pbFilme')?.dataset.wired);
  ok('The button sits next to the gear in the navigation row, has a tooltip and is not covered by the Siegel',await page.evaluate(()=>{const b=document.getElementById('pbFilme');const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return b.parentElement?.matches('.native-toolbar-quick')&&b.previousElementSibling?.matches('[data-tab="settings"]')&&!b.closest('.native-options')&&/Werbefilm/.test(b.getAttribute('aria-label'))&&b.contains(hit);}));
  ok('Nothing is loaded before the tap',served===0);
  await page.click('#pbFilme');
  await page.waitForFunction(()=>document.querySelector('.pb-filme')?.open);
  ok('The dialog offers both films with their length',await page.waitForFunction(()=>{const b=[...document.querySelectorAll('.pb-filme-wahl button')].map(x=>x.textContent);return b.length===2&&/Werbefilm · 1:45/.test(b[0])&&/Handbuchvideo · 3:43/.test(b[1]);}).then(()=>true));
  await page.click('.pb-filme-start');
  await page.waitForFunction(()=>document.querySelector('.pb-filme video[data-filme-video]')?.readyState>=1,null,{timeout:20000});
  ok('App path: all parts fetched, checked by SHA-256 and played in the window',served===3&&await page.evaluate(()=>{const v=document.querySelector('.pb-filme video');return v.src.startsWith('blob:')&&/Geprüft/.test(document.querySelector('.pb-filme-status').textContent);}));
  if(process.env.PB_SHOT)await page.screenshot({path:process.env.PB_SHOT});
  await page.click('[data-filme-laden]');
  ok('Download opens the video page with ?laden= (in the app via the browser)',await page.evaluate(()=>window.__opened.some(u=>/index\.html\?laden=private-brain-pro-film#video-private-brain-pro-film$/.test(u))));
  await page.click('.pb-filme-wahl button[data-film=private-brain-pro-handbuch]');
  // Beschädigter Teil (der zweite Film wurde noch nicht geholt): ehrlicher Satz, kein Abspielen.
  broken=true;
  await page.waitForFunction(()=>/beschädigt/.test(document.querySelector('.pb-filme-status').textContent),null,{timeout:20000});
  ok('A damaged part is not played; the message says so',!(await page.locator('.pb-filme video').count()));
  broken=false;
  await page.click('.pb-filme .primary:has-text("Schließen")');
  // Das close-Ereignis des Dialogs kommt asynchron; erst danach ist das Fenster entfernt.
  ok('Closing removes the dialog',await page.waitForFunction(()=>!document.querySelector('.pb-filme'),null,{timeout:5000}).then(()=>true,()=>false));
  ok('No unhandled page errors',errors.length===0||console.log(errors));
  await ctx.close();
  // Browserfassung: derselbe Ursprung wie die Videoseite → deren Spieler streamt im Fenster.
  const web=await browser.newContext();
  await web.addInitScript(base=>{window.PB_FILME_BASIS=base;},url+'fpv/');
  await web.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  const p2=await web.newPage();await p2.goto(url);await p2.waitForFunction(()=>document.getElementById('pbFilme')?.dataset.wired);
  const before=served;await p2.click('#pbFilme');
  await p2.waitForSelector('.pb-filme iframe');
  ok('Browser version: the video page player streams in a frame, the app does not fetch parts itself',
    await p2.locator('.pb-filme iframe').getAttribute('src').then(s=>s.endsWith('/fpv/abspielen.html?id=private-brain-pro-film'))&&served===before&&!(await p2.locator('[data-filme-browser]').isVisible()));
  await web.close();
  console.log(`${count} film checks passed.`);
}finally{await browser?.close();server.close();}
