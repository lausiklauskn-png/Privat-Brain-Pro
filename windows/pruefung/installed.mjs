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
const modelPins=JSON.parse(await readFile(new URL('../../tools/native/semantic-model.json',import.meta.url),'utf8'));
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
  report.modelRequests=[];
  report.modelConsole=[];
  page.on('console',message=>{const value=message.text();if(/embedding|MODUL 03|wasm|onnx|model.*load/i.test(value)&&report.modelConsole.length<30)report.modelConsole.push(value.slice(0,1500));});
  page.on('response',response=>{const url=response.url();if(url.startsWith('https://tauri.localhost/models/')||url.startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))report.modelRequests.push({url:url.split('?')[0],status:response.status()});});
  await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db&&window.Capacitor,null,{timeout:90000});
  const info=await call('ProDevice','getInfo');ok('installed app reports Windows and the actual native version',info.platform==='windows'&&info.versionName===expectedVersion);
  ok('raw calls without the private app capability are denied',await page.evaluate(async()=>{try{await __TAURI_INTERNALS__.invoke('pb_call',{plugin:'ProFiles',method:'listOriginals',options:{}});return false;}catch(error){return String(error).includes('NOT_ALLOWED');}}));
  if(phase==='first'){
    await page.evaluate(()=>{window.accountProbe=null;Capacitor.Plugins.ProMail.addAccount().then(v=>window.accountProbe=v,e=>window.accountProbe={error:e.code});});
    const account=await dialog();ok('native account dialog uses all eight shared provider templates',await account.locator('#provider option').count()===8);
    await account.locator('#provider').selectOption('gmail');ok('Gmail uses browser authorization without a password field',!await account.locator('#password-label').isVisible());
    await account.locator('#provider').selectOption('microsoft');ok('unconfigured Microsoft integration shows a plan and accepts no password',await account.locator('#submit').isDisabled()&&!await account.locator('#password-label').isVisible()&&(await account.locator('#help').textContent()).includes('Microsoft Entra'));
    await account.locator('#cancel').click();await page.waitForFunction(()=>window.accountProbe,null,{timeout:10000});ok('account dialog cancellation connects no account',await page.evaluate(()=>accountProbe.error==='CANCELLED')&&(await call('ProMail','accounts')).items.length===0);
    const bytes=Buffer.from('Windows-Probe: Fahrzeug Radstand 2820 Millimeter');
    await page.setInputFiles('#fileInput',{name:'windows-proof.txt',mimeType:'text/plain',buffer:bytes});
    await page.waitForFunction(()=>!signing&&CATALOG.some(r=>r.name==='windows-proof.txt'),{},{timeout:90000});
    const hash=createHash('sha256').update(bytes).digest('hex');
    const original=await call('ProFiles','originalInfo',{hash});ok('real imported original is persisted and fingerprinted',original.hash===hash&&original.size===bytes.length);
    const read=await call('ProFiles','readOriginal',{hash,offset:0});ok('original reads back through the native bridge',Buffer.from(read.data,'base64').equals(bytes));
    const exported=await call('ProFiles','share',{hash});ok('native save selection commits a verified export without changing the original',exported.saved&&Buffer.from(await readFile(resolve(process.env.PB_WINDOWS_TEST_SAVE_FOLDER,'windows-proof.txt'))).equals(bytes));
    const shares=Array.from({length:5},(_,i)=>`JT3v5-${i+1}-CI_fixture_only_not_a_real_share`);
    const saved=await call('ProFiles','saveRecoveryKeys',{shares,name:'CI-RECOVERY-KEYS.txt',heading:'Test fixture only'});
    const recovery=await readFile(resolve(process.env.PB_WINDOWS_TEST_SAVE_FOLDER,'CI-RECOVERY-KEYS.txt'),'utf8');
    ok('recovery export commits exactly the requested five parts before confirming success',saved.saved&&recovery===['Test fixture only','',...shares,''].join('\n'));
    await page.evaluate(()=>{window.vaultResult=null;Capacitor.Plugins.ProVault.choose().then(v=>window.vaultResult=v,e=>window.vaultResult={error:e.code});});
    const password=await dialog();await password.locator('#password').fill(PASSWORD);await password.locator('#repeat').fill(PASSWORD);await password.locator('#notice').check();await password.locator('#remember').check();await password.locator('#submit').click();
    await page.waitForFunction(()=>window.vaultResult,{},{timeout:90000});
    ok('own password dialog creates a real password-encrypted folder',await page.evaluate(()=>vaultResult.created&&vaultResult.state.unlocked));
    await call('ProVault','migrate');await call('ProVault','backupMail');
    const ticket=(await call('ProVault','catalogBegin')).ticket;
    await call('ProVault','catalogAppend',{ticket,offset:0,data:Buffer.from('Windows native catalog proof').toString('base64')});await call('ProVault','catalogFinish',{ticket});
    const backup=await call('ProVault','catalogInfo');ok('catalog is committed and read back before success',backup.exists&&backup.size>0);
    await page.evaluate(()=>{window.keyProbe=null;Capacitor.Plugins.ProProtect.setKey({service:'virustotal'}).then(v=>window.keyProbe=v,e=>window.keyProbe={error:e.code});});
    const key=await dialog();await key.locator('#password').fill('CI-fixture-only-never-a-real-key');await key.locator('#submit').click();
    await page.waitForFunction(()=>window.keyProbe,null,{timeout:10000});ok('native provider key dialog confirms the committed encrypted key',await page.evaluate(()=>keyProbe.saved&&keyProbe.state.keys.virustotal));
    await page.evaluate(()=>{window.keyProbe=null;Capacitor.Plugins.ProProtect.setKey({service:'virustotal'}).then(v=>window.keyProbe=v,e=>window.keyProbe={error:e.code});});
    const remove=await dialog();await remove.locator('#remove').click();await page.waitForFunction(()=>window.keyProbe,null,{timeout:10000});ok('native provider key can be explicitly removed',await page.evaluate(()=>keyProbe.removed&&!keyProbe.state.keys.virustotal));
    const preview=await call('ProFiles','openPdf',{name:'preview.pdf',data:pdf().toString('base64')});
    const png=await call('ProFiles','pdfPage',{id:preview.id,page:0,width:600});ok('installed app renders a real PDF in its isolated worker',preview.pages===1&&png.width>0&&Buffer.from(png.data,'base64').subarray(1,4).toString()==='PNG');
    // Leave the worker open: the process-lifetime test must also terminate it.
    await call('ProNetwork','setOffline',{offline:true});ok('native offline switch confirms persisted state',(await call('ProNetwork','getState')).offline===true);
    await call('ProNetwork','setOffline',{offline:false});
    await page.evaluate(()=>{const f=document.createElement('iframe');f.id='tool-origin-probe';f.src='https://pbtool.localhost/kimboard/index.html#pb-tool=unlicensed-probe';document.body.append(f);});
    let tool;for(let i=0;i<40;i++){tool=page.frames().find(f=>f.url().startsWith('https://pbtool.localhost/kimboard/'));if(tool)break;await pause(250);}assert.ok(tool,'Tool origin loads');
    ok('tool origin cannot access app storage or native account/vault functions',await tool.evaluate(()=>{try{void parent.Capacitor.Plugins.ProVault;return false;}catch{return true;}}));
    await page.locator('#tool-origin-probe').evaluate(f=>f.remove());
    // Test-only studio identity is generated inside the disposable CI profile.
    // It is never bundled into the installer or used as Klaus' publisher key.
    await page.evaluate(async()=>{await PBLicense.createKey('CI-studio-fixture-only-2026');PBTools.open('pinnwand');});
    const licensed=page.frameLocator('.pb-tool-frame iframe');await licensed.locator('body').waitFor({state:'visible',timeout:15000});
    ok('licensed tool is authorized on its own origin',await licensed.locator('html').evaluate(()=>PBToolAuthorized));
    ok('isolated tool cannot invoke native functions without the private capability',await licensed.locator('html').evaluate(async()=>{
      if(!window.__TAURI_INTERNALS__?.invoke)return true;
      try{await __TAURI_INTERNALS__.invoke('pb_call',{plugin:'ProVault',method:'state',options:{}});return false;}catch(error){return String(error).includes('NOT_ALLOWED');}
    }));
    await licensed.locator('html').evaluate(()=>{parent.postMessage({kind:'pb-tool-file',nonce:'wrong',name:'forged-tool.txt',type:'text/plain',bytes:new ArrayBuffer(4)},'https://tauri.localhost');});
    await pause(100);ok('tool file with the wrong handoff nonce is ignored',await page.locator('.pb-tool-file').count()===0);
    await licensed.locator('html').evaluate(()=>{const a=document.createElement('a');a.download='windows-tool-proof.txt';a.href=URL.createObjectURL(new Blob(['Actual isolated tool handoff'],{type:'text/plain'}));a.click();});
    await page.locator('.pb-tool-file button').first().click();
    await page.waitForFunction(()=>!signing&&CATALOG.some(r=>r.name==='windows-tool-proof.txt'),null,{timeout:90000});
    ok('actual tool download enters the same checked native import',!(await call('ProFiles','originalInfo',{hash:createHash('sha256').update('Actual isolated tool handoff').digest('hex')})).missing);
    await page.evaluate(()=>PBTools.open('pinnwand'));await page.locator('.pb-tool-frame iframe').waitFor();
    await page.evaluate(async()=>{for(const key of ['pb_studio_v1','pb_studio_probe','pb_studio_visible'])localStorage.removeItem(key);await PBLicense.refresh();});
    ok('revoking the tool permission closes its active isolated frame',await page.locator('.pb-tool-frame').count()===0);
    await page.evaluate(()=>{window.speechProbe=null;Capacitor.Plugins.ProSpeech.listen({language:'de-DE'}).then(v=>window.speechProbe=v,e=>window.speechProbe={error:e.code});});
    for(let i=0;i<60;i++){
      if(await page.evaluate(()=>Boolean(window.speechProbe)))break;
      const speech=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes('/windows/dialog/index.html'));
      if(speech){
        try{await speech.locator('#cancel').click({timeout:1500});}
        catch(error){await page.waitForFunction(()=>window.speechProbe,null,{timeout:3000}).catch(()=>{throw error;});}
        break;
      }await pause(100);
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
    ok('native local files remain readable through normal IPC after the app internet switch turns off',Buffer.from((await call('ProFiles','readOriginal',{hash,offset:0})).data,'base64').equals(bytes));
    report.modelEndpoints=await page.evaluate(async()=>{
      const base='https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
      const urls=[base,base+'/dist/ort-wasm-simd.wasm','https://tauri.localhost/models/Xenova/multilingual-e5-small/config.json'];const results=[];
      for(const url of urls){const response=await fetch(url),bytes=await response.arrayBuffer();const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');results.push({url,status:response.status(),type:response.headers.get('content-type'),size:bytes.byteLength,sha256:sha});}return results;
    });
    console.log('MODEL endpoints '+JSON.stringify(report.modelEndpoints));
    ok('offline native endpoints stream the exact pinned library, WASM and model configuration',report.modelEndpoints.every(r=>r.status===200)&&report.modelEndpoints[0].sha256===modelPins.library.files['transformers.min.js']&&report.modelEndpoints[1].sha256===modelPins.library.files['ort-wasm-simd.wasm']&&report.modelEndpoints[2].sha256===modelPins.model.files['config.json']);
    const meaning=await page.evaluate(async()=>{
      await SbkimEmbedding.init();const q=await SbkimEmbedding.embedQuery('Rechnung vom Zahnarzt'),near=await SbkimEmbedding.embedPassage('Zahnarztrechnung über 120 Euro für eine Füllung'),far=await SbkimEmbedding.embedPassage('Wetterbericht: morgen Regen in Hamburg');
      const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);return{dim:q.length,near:dot(q,near),far:dot(q,far),source:SbkimEmbedding.getModelSource(),root:SbkimEmbedding.getModelRoot(),offline:PBNetwork.offline,fallback:SbkimEmbedding.getModelFallback()};
    });
    ok('installed WebView2 understands meaning from the local e5 model while offline',meaning.dim===384&&meaning.near>meaning.far+0.02&&meaning.source==='local'&&meaning.root==='https://tauri.localhost/models/'&&meaning.offline&&!meaning.fallback);
    report.model=meaning;await page.evaluate(()=>PBNetwork.setOffline(false));
    await call('ProSemantic','markLoading');
    const renderer=await browser.contexts()[0].newCDPSession(page);void renderer.send('Page.crash').catch(()=>{});
    await pause(2000);await browser.close();browser=null;page=null;await connect();
    for(let i=0;i<80;i++){page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='https://tauri.localhost/index.html');if(page)break;await pause(250);}assert.ok(page,'App recovers its main page after a renderer crash');
    await page.waitForFunction(()=>window.Capacitor&&window.PBSemantic,null,{timeout:90000});
    const guarded=await call('ProSemantic','getState');ok('real renderer crash recovers the app and prevents automatic model restart',guarded.installed&&guarded.crashes>0);
    await call('ProSemantic','clearCrash');
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
}catch(error){report.failure=error.message;console.error(error.message);if(report.modelRequests)console.error('MODEL diagnostics '+JSON.stringify({requests:report.modelRequests,console:report.modelConsole}));process.exitCode=1;try{await page?.screenshot({path:out+'.png'});}catch{}}
finally{await mkdir(resolve(out,'..'),{recursive:true});await writeFile(out,JSON.stringify(report,null,2));await browser?.close().catch(()=>{});}
