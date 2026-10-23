// Film aufnehmen: node schnitt.mjs --standbilder=2,9,15   oder   node schnitt.mjs --film [--von=0 --bis=105]
// Serves this folder over http (images and teile.json), renders frame by frame, then ffmpeg with music + sounds.
import {createServer} from 'node:http';
import {readFile,mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve,extname,join,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from '/home/user/Privat-Brain-Pro/node_modules/playwright-core/index.mjs';
const here=resolve(new URL('.',import.meta.url).pathname);
const arg=n=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?a.split('=')[1]:null;};
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(q,s)=>{const p=resolve(here,'.'+decodeURIComponent(new URL(q.url,'http://l').pathname));if(!p.startsWith(here+sep))return s.writeHead(403).end();try{const d=await readFile(p);s.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream'}).end(d);}catch{s.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM,args:['--no-sandbox','--disable-gpu-vsync']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});page.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url());});
await page.goto(`http://127.0.0.1:${server.address().port}/film.html`);
await page.evaluate(()=>window.bereit);
const FPS=30,dauer=await page.evaluate(()=>window.DAUER);
if(arg('standbilder')){
  await mkdir(join(here,'stand'),{recursive:true});
  for(const t of arg('standbilder').split(',').map(Number)){await page.evaluate(t=>window.render(t),t);await page.screenshot({path:join(here,'stand',`t${String(t).replace('.','_')}.jpg`),type:'jpeg',quality:80});}
  console.log('Standbilder fertig',errs.slice(0,5));
}else{
  const roh=join(here,'_roh');
  const von=+(arg('von')||0),bis=+(arg('bis')||dauer);
  if(!arg('weiter')){await rm(roh,{recursive:true,force:true});}
  await mkdir(roh,{recursive:true});
  const t0=Date.now();
  // render every frame from 0 (piece schedules and sound marks depend only on t)
  for(let i=Math.round(von*FPS);i<Math.round(bis*FPS);i++){
    await page.evaluate(t=>window.render(t),i/FPS);
    await page.screenshot({path:join(roh,`b${String(i).padStart(5,'0')}.jpg`),type:'jpeg',quality:90});
    if(i%150===0)console.log('Bild',i,((Date.now()-t0)/1000).toFixed(0)+'s');
  }
  const toene=await page.evaluate(()=>window.TOENE);
  await writeFile(join(here,arg('von')?`toene-${arg('von')}.json`:'toene.json'),JSON.stringify(toene));
  console.log('Bilder fertig',errs.slice(0,5));
}
await browser.close();server.close();
