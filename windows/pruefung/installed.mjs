// Runs against the NSIS-installed WebView2 app. This is an initial acceptance
// subset; mail protocol/model/OS adapters receive additional cases as completed.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const phase=process.argv[2]||'first',out=resolve(process.argv[3]||'windows-report.json');
const report={phase,source:process.env.PB_SOURCE_COMMIT||'',checks:[],errors:[]};
const expectedVersion=JSON.parse(await readFile(new URL('../src-tauri/tauri.conf.json',import.meta.url),'utf8')).version;
const ok=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const PASSWORD='CI-Tresor-ä-Probe-2026';
let browser,page;
async function connect(){
  for(let i=0;i<80;i++){
    try{browser=await chromium.connectOverCDP('http://127.0.0.1:9223');return;}catch{await pause(500);}
  }throw Error('Installed app did not open the local test endpoint');
}
async function call(plugin,method,args={}){return page.evaluate(async({plugin,method,args})=>Capacitor.Plugins[plugin][method](args),{plugin,method,args});}
async function dialog(){
  for(let i=0;i<80;i++){
    const target=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes('/windows/dialog/index.html'));
    if(target){await target.locator('#submit').waitFor({state:'visible'});return target;}await pause(250);
  }throw Error('Native password dialog did not open');
}
function pdf(){
  const stream='0 0 1 rg\n20 20 100 100 re f\n',objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`];
  let body='%PDF-1.4\n',offsets=[0];
  for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(body));body+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
  const xref=Buffer.byteLength(body);body+=`xref\n0 5\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(body);
}
try{
  await connect();
  for(let i=0;i<80;i++){page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='https://tauri.localhost/'||p.url()==='https://tauri.localhost/index.html');if(page)break;await pause(250);}
  if(!page)console.error('Observed app pages',browser.contexts().flatMap(c=>c.pages()).map(p=>p.url()));
  assert.ok(page,'Installed main page exists');
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db&&window.Capacitor,null,{timeout:90000});
  const info=await call('ProDevice','getInfo');ok('installed app reports Windows and the actual native version',info.platform==='windows'&&info.versionName===expectedVersion);
  ok('raw calls without the private app capability are denied',await page.evaluate(async()=>{try{await __TAURI_INTERNALS__.invoke('pb_call',{plugin:'ProFiles',method:'listOriginals',options:{}});return false;}catch(error){return String(error).includes('NOT_ALLOWED');}}));
  if(phase==='first'){
    const bytes=Buffer.from('Windows-Probe: Fahrzeug Radstand 2820 Millimeter');
    await page.setInputFiles('#fileInput',{name:'windows-proof.txt',mimeType:'text/plain',buffer:bytes});
    await page.waitForFunction(()=>!signing&&CATALOG.some(r=>r.name==='windows-proof.txt'),{},{timeout:90000});
    const hash=createHash('sha256').update(bytes).digest('hex');
    const original=await call('ProFiles','originalInfo',{hash});ok('real imported original is persisted and fingerprinted',original.hash===hash&&original.size===bytes.length);
    const read=await call('ProFiles','readOriginal',{hash,offset:0});ok('original reads back through the native bridge',Buffer.from(read.data,'base64').equals(bytes));
    await page.evaluate(()=>{window.vaultResult=null;Capacitor.Plugins.ProVault.choose().then(v=>window.vaultResult=v,e=>window.vaultResult={error:e.code});});
    const password=await dialog();await password.locator('#password').fill(PASSWORD);await password.locator('#repeat').fill(PASSWORD);await password.locator('#notice').check();await password.locator('#remember').check();await password.locator('#submit').click();
    await page.waitForFunction(()=>window.vaultResult,{},{timeout:90000});
    ok('own password dialog creates a real password-encrypted folder',await page.evaluate(()=>vaultResult.created&&vaultResult.state.unlocked));
    await call('ProVault','migrate');await call('ProVault','backupMail');
    const ticket=(await call('ProVault','catalogBegin')).ticket;
    await call('ProVault','catalogAppend',{ticket,offset:0,data:Buffer.from('Windows native catalog proof').toString('base64')});await call('ProVault','catalogFinish',{ticket});
    const backup=await call('ProVault','catalogInfo');ok('catalog is committed and read back before success',backup.exists&&backup.size>0);
    const preview=await call('ProFiles','openPdf',{name:'preview.pdf',data:pdf().toString('base64')});
    const png=await call('ProFiles','pdfPage',{id:preview.id,page:0,width:600});ok('installed app renders a real PDF in its isolated worker',preview.pages===1&&png.width>0&&Buffer.from(png.data,'base64').subarray(1,4).toString()==='PNG');
    // Leave the worker open: the process-lifetime test must also terminate it.
    await call('ProNetwork','setOffline',{offline:true});ok('native offline switch confirms persisted state',(await call('ProNetwork','getState')).offline===true);
    await call('ProNetwork','setOffline',{offline:false});
    await page.evaluate(()=>{const f=document.createElement('iframe');f.id='tool-origin-probe';f.src='https://pbtool.localhost/kimboard/index.html#pb-tool=unlicensed-probe';document.body.append(f);});
    let tool;for(let i=0;i<40;i++){tool=page.frames().find(f=>f.url().startsWith('https://pbtool.localhost/kimboard/'));if(tool)break;await pause(250);}assert.ok(tool,'Tool origin loads');
    ok('tool origin cannot access app storage or native account/vault functions',await tool.evaluate(()=>{try{void parent.Capacitor.Plugins.ProVault;return false;}catch{return true;}}));
    await page.locator('#tool-origin-probe').evaluate(f=>f.remove());
    await page.evaluate(()=>{window.speechProbe=null;Capacitor.Plugins.ProSpeech.listen({language:'de-DE'}).then(v=>window.speechProbe=v,e=>window.speechProbe={error:e.code});});
    for(let i=0;i<60;i++){
      if(await page.evaluate(()=>Boolean(window.speechProbe)))break;
      const speech=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes('/windows/dialog/index.html'));
      if(speech){await speech.locator('#cancel').waitFor();await speech.locator('#cancel').click();break;}await pause(100);
    }
    await page.waitForFunction(()=>window.speechProbe,null,{timeout:10000});
    ok('Windows speech adapter returns cancellation or explicit missing system recognition',await page.evaluate(()=>speechProbe.cancelled===true||speechProbe.error==='SPEECH_UNAVAILABLE'));
    report.speech='API/cancellation only; no spoken-audio or microphone acceptance on the CI runner';
    const scan=await call('ProFiles','scan',{hash});
    ok('Defender adapter reports a bounded named result without claiming a clean file',scan.provider==='Microsoft Defender'&&['completed','attention','unavailable'].includes(scan.status));
    await page.evaluate(()=>{window.modelDownload=null;window.modelProgress=0;Capacitor.Plugins.ProSemantic.addListener('progress',p=>window.modelProgress=p.done);Capacitor.Plugins.ProSemantic.install().then(v=>window.modelDownload=v,e=>window.modelDownload={error:e.code});});
    await page.waitForFunction(()=>window.modelProgress>0||window.modelDownload,null,{timeout:180000});
    if(!await page.evaluate(()=>Boolean(window.modelDownload))){await call('ProSemantic','cancel');await page.waitForFunction(()=>window.modelDownload,null,{timeout:30000});}
    const partial=await call('ProSemantic','getState');ok('cancelled model download leaves a truthful resumable state',!partial.running&&(partial.installed||partial.present>0));
    const model=await call('ProSemantic','install');ok('complete real model download matches the pinned fingerprints',model.installed===true);
    await page.evaluate(()=>PBNetwork.setOffline(true));
    const meaning=await page.evaluate(async()=>{
      await SbkimEmbedding.init();const q=await SbkimEmbedding.embedQuery('Rechnung vom Zahnarzt'),near=await SbkimEmbedding.embedPassage('Zahnarztrechnung über 120 Euro für eine Füllung'),far=await SbkimEmbedding.embedPassage('Wetterbericht: morgen Regen in Hamburg');
      const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);return{dim:q.length,near:dot(q,near),far:dot(q,far),source:SbkimEmbedding.getModelSource(),root:SbkimEmbedding.getModelRoot(),offline:PBNetwork.offline,fallback:SbkimEmbedding.getModelFallback()};
    });
    ok('installed WebView2 understands meaning from the local e5 model while offline',meaning.dim===384&&meaning.near>meaning.far+0.02&&meaning.source==='local'&&meaning.root==='https://tauri.localhost/models/'&&meaning.offline&&!meaning.fallback);
    report.model=meaning;await page.evaluate(()=>PBNetwork.setOffline(false));
  }else{
    const hash=createHash('sha256').update('Windows-Probe: Fahrzeug Radstand 2820 Millimeter').digest('hex');
    ok('catalog persists across process restart and reinstallation',await page.evaluate(()=>CATALOG.some(r=>r.name==='windows-proof.txt')));
    ok('native original persists across process restart and reinstallation',(await call('ProFiles','originalInfo',{hash})).hash===hash);
    const state=await call('ProVault','state');ok('Windows DPAPI restores remembered folder key on this user account',state.configured&&state.unlocked&&state.remembered);
    const backup=await call('ProVault','catalogInfo');ok('portable catalog remains readable after restart',backup.exists);
    await call('ProVault','lock');
    await page.evaluate(()=>{window.vaultResult=null;Capacitor.Plugins.ProVault.unlock().then(v=>window.vaultResult=v,e=>window.vaultResult={error:e.code});});
    const password=await dialog();await password.locator('#password').fill(PASSWORD);await password.locator('#remember').check();await password.locator('#submit').click();
    await page.waitForFunction(()=>window.vaultResult,{},{timeout:90000});ok('separate native dialog unlocks the same folder',await page.evaluate(()=>vaultResult.unlocked&&vaultResult.state.unlocked));
  }
  ok('no uncaught app runtime error during native acceptance',report.errors.length===0);
}catch(error){report.failure=error.message;console.error(error.message);process.exitCode=1;try{await page?.screenshot({path:out+'.png'});}catch{}}
finally{await mkdir(resolve(out,'..'),{recursive:true});await writeFile(out,JSON.stringify(report,null,2));await browser?.close().catch(()=>{});}
