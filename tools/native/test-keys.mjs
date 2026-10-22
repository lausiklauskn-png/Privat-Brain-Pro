// Links to get the AI keys next to the key field (Klaus 2026-10-22); ProLinks simulated.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:900}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))return r.fulfill({status:404,body:''});return u.startsWith(url)?r.continue():r.abort();});
  await page.addInitScript(()=>{window.opened=[];window.Capacitor={Plugins:{ProLinks:{async open({url}){window.opened.push(url);return{ok:true};}}}};});
  await page.goto(url);await page.waitForFunction(()=>document.getElementById('pb-ai-key-links'));
  await page.evaluate(()=>window.PBWorkspace?.navigate?.('settings')||document.querySelector('[data-tab="settings"]')?.click());
  const row=page.locator('#pb-ai-key-links'),mistral=row.locator('[data-key-page="mistral"]'),google=row.locator('[data-key-page="google"]');
  ok('Next to the key field: both key pages while no provider is chosen',await mistral.isVisible()&&await google.isVisible());
  await mistral.click();
  ok('Mistral opens its key page in the browser',await page.evaluate(()=>opened.at(-1)==='https://console.mistral.ai/api-keys'));
  await page.selectOption('#aiProvider','google');
  ok('With Google chosen only the Google page is offered, with a short way there',await google.isVisible()&&!(await mistral.isVisible())&&(await row.textContent()).includes('Cloud Vision API'));
  await google.click();
  ok('Google opens its key page',await page.evaluate(()=>opened.at(-1)==='https://console.cloud.google.com/apis/credentials'));
  ok('Nothing is filled in for the person',await page.locator('#aiKey').inputValue()==='');
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('#pb-ai-key-links [data-key-page="google"]').textContent.includes('Get Google key'));
  ok('The links follow the app language',true);
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} key link checks passed (ProLinks simulated).`);
}finally{await browser?.close();server.close();}
