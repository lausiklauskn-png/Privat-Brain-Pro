// Search by voice in the native app: without Web Speech, 🎤 asks Android's speech dialog (simulated).
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
  const page=await browser.newPage({viewport:{width:360,height:780}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{
    // The Android WebView has no Web Speech API.
    delete window.SpeechRecognition;delete window.webkitSpeechRecognition;
    window.speechCalls=[];window.speechAnswer={cancelled:false,text:'Rechnung Zahnarzt'};
    window.Capacitor={Plugins:{ProSpeech:{async listen(args){window.speechCalls.push(args);await new Promise(r=>setTimeout(r,80));
      if(window.speechAnswer==='missing'){const e=new Error('No speech recognizer');e.code='SPEECH_UNAVAILABLE';throw e;}return window.speechAnswer;}}}};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&document.getElementById('mic'));
  const mic=page.locator('#mic');
  await mic.click();
  ok('While listening the 🎤 shows 🔴',await mic.textContent()==='🔴');
  await page.waitForFunction(()=>document.getElementById('mic').textContent==='🎤');
  ok('The recognized words land in the search field',await page.locator('#q').inputValue()==='Rechnung Zahnarzt');
  ok('Android is asked in the app language with a short prompt',await page.evaluate(()=>speechCalls.length===1&&speechCalls[0].language==='de-DE'&&speechCalls[0].prompt==='Sprechen Sie jetzt'));
  ok('The old "Dein Browser kann keine Sprach-Eingabe" message does not appear',!(await page.locator('#toast').textContent()).includes('Dein Browser'));
  await page.evaluate(()=>{document.documentElement.lang='pl';speechAnswer={cancelled:true,text:''};});await page.locator('#q').fill('bleibt');
  await mic.click();await page.waitForFunction(()=>speechCalls.length===2&&document.getElementById('mic').textContent==='🎤');
  ok('Cancelling keeps the typed search and asks in Polish',await page.locator('#q').inputValue()==='bleibt'&&await page.evaluate(()=>speechCalls[1].language==='pl-PL'));
  await page.evaluate(()=>{document.documentElement.lang='de';speechAnswer='missing';});
  await mic.click();await page.waitForFunction(()=>speechCalls.length===3&&document.getElementById('mic').textContent==='🎤');
  ok('Without a speech recognizer on the device the app says so plainly',(await page.locator('#toast').textContent()).includes('keine Spracherkennung eingerichtet'));
  ok('No runtime errors',errors.length===0||console.log(errors));
  console.log(`${count} speech input checks passed (Android speech dialog simulated; real recognizer tested on the device).`);
}finally{await browser?.close();server.close();}
