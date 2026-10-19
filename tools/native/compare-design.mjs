import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';
const reference=resolve(process.env.PB_DESIGN_REFERENCE||'../Privat-Brain');
const bundle=resolve('www');
const output=resolve('docs/design');await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const servers=[];
async function serve(root) {
 const server=createServer(async(req,res)=>{const p=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);return `http://127.0.0.1:${server.address().port}/`;
}
const urls=[await serve(reference),await serve(bundle)];
const browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
let compared=0;
try {
 for(const width of [360,1280]) for(const dark of [false,true]) {
  const pages=[];
  for(const [i,url] of urls.entries()) {
   const page=await browser.newPage({viewport:{width,height:900}});pages.push(page);
   await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
   await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace && typeof db!=='undefined' && db);if(dark)await page.click('#themeToggle');
  }
  for(const tab of ['search','mail']) {
   const styles=[];
   for(const [i,page] of pages.entries()) {
    await page.click(`.main-pages [data-tab="${tab}"]`);
    styles.push(await page.evaluate(()=>['.logo img','header h1','.main-pages .tab','#q','#themeToggle'].map(selector=>{
     const element=document.querySelector(selector);if(!element)return null;const style=getComputedStyle(element);return Object.fromEntries(['fontFamily','fontSize','color','backgroundColor','borderRadius','padding','gap'].map(key=>[key,style[key]]));
    })));
    await page.screenshot({path:`${output}/${i?'android-web':'pwa'}-${tab}-${width}-${dark?'dark':'light'}.png`,fullPage:true});
   }
   assert.deepEqual(styles[0],styles[1],`${tab} style changed at ${width}`);compared++;
  }
  for(const page of pages)await page.close();
 }
 await writeFile(`${output}/README.md`,`# Visueller Ausgangspunkt und Vergleich\n\nPWA-Quelle: Privat-Brain 0ac93cd845a93cb67b37b0f4c60726eaed9ed492.\nAufnahmen bei 360 und 1280 Pixeln, Suche/Postfach, Hell/Dunkel.\n\n${compared} Vergleiche: Schrift, Farben, Rundungen und Innenabstände ausgewählter\nBestands-Steuerelemente stimmen zwischen PWA und gepacktem Android-Webteil überein.\nDer native Build blendet nur die PWA-Installationsknöpfe aus und berücksichtigt\nSystemränder. Das ersetzt keinen visuellen Test auf einem Android-Tablet/DeX.\n\nDie Bilder enthalten keine persönlichen Daten. Aufnahmen und Vergleiche wurden\nmit blockierten externen Anfragen erstellt, keine echten Mailkonten.\n`);
 console.log(`${compared} design comparisons passed; 16 screenshots saved.`);
} finally {await browser.close();for(const server of servers)await new Promise(r=>server.close(r));}
