// CI-only draft: real production .29 -> .36 data/installer acceptance.
// Run from the repository root after npm ci. It never chooses the OS folder;
// the companion PowerShell helper must select PB_WINDOWS_UPGRADE_VAULT.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';

assert.equal(process.env.GITHUB_ACTIONS,'true','Run only on an isolated GitHub Windows runner');
const phase=process.argv[2];
assert.ok(['seed','verify','verify-unlock'].includes(phase),'Phase must be seed, verify or verify-unlock');
const require=createRequire(resolve('package.json'));
const {chromium}=require('playwright-core');
const port=Number(process.env.PB_WINDOWS_UPGRADE_CDP_PORT||9224);
assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535,'Bounded loopback CDP port required');
const reportRoot=resolve(required('PB_WINDOWS_UPGRADE_REPORT_ROOT'));
const vaultParent=resolve(required('PB_WINDOWS_UPGRADE_VAULT'));
const runner=resolve(required('RUNNER_TEMP'));
const marker=required('PB_WINDOWS_UPGRADE_MARKER');
assert.match(marker,/^[A-Za-z0-9._-]{8,80}$/,'Use a fresh CI run/GUID marker');
assert.ok(within(runner,vaultParent),'The synthetic vault must be inside RUNNER_TEMP');
assert.ok(within(runner,reportRoot)||within(resolve('.'),reportRoot),'Reports must remain in the runner or checkout');
const appData=join(required('LOCALAPPDATA'),'de.familyprojekt.privatebrain.pro');
const PASSWORD='CI-only Windows Upgrade ä Ж 2026';
const NAME='windows-upgrade-proof-Ж.txt';
const FIXTURE_PATH='Upgradeprobe/'+NAME;
const STAMP=1792886400000;
const bytes=Buffer.from('Private Brain Windows installer upgrade 29 to 36. Fixture only. ä Ж\n'+marker+'\n','utf8');
const hash=sha256(bytes);
const expectedVersion=phase==='seed'?'1.0.0-preview.29':'1.0.0-preview.36';
const expectedCode=phase==='seed'?29:36;
const report={phase,expectedVersion,source:process.env.PB_SOURCE_COMMIT||'',marker,fixture:{name:NAME,hash,bytes:bytes.length},checks:[],errors:[],success:false};
let browser,page;
function required(name){const value=process.env[name];assert.ok(value,name+' is required');return value;}
function within(parent,child){const r=relative(parent,child);return r===''||(!r.startsWith('..')&&!isAbsolute(r));}
function sha256(value){return createHash('sha256').update(value).digest('hex');}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function ok(name,value){assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);}
async function call(plugin,method,args={}){return page.evaluate(async({plugin,method,args})=>Capacitor.Plugins[plugin][method](args),{plugin,method,args});}
async function connect(){
  report.stage='connect-cdp';
  for(let i=0;i<90;i++){
    try{browser=await chromium.connectOverCDP('http://127.0.0.1:'+port);break;}catch(error){report.lastConnectionError=error.message.slice(0,600);await pause(500);}
  }
  assert.ok(browser,'The production app did not expose the externally requested loopback CDP port');
  report.stage='find-main-origin';
  for(let i=0;i<180;i++){
    page=browser.contexts().flatMap(c=>c.pages()).find(p=>{try{const u=new URL(p.url());return u.origin==='https://tauri.localhost'&&['/','/index.html'].includes(u.pathname);}catch{return false;}});
    if(page)break;await pause(500);
  }
  assert.ok(page,'Exact production main origin not found');
  page.on('pageerror',e=>report.errors.push(e.message));
  report.stage='wait-main-ready';
  await page.waitForFunction(()=>document.readyState==='complete'&&window.Capacitor&&window.PBWorkspace&&window.PBNetwork&&typeof db!=='undefined'&&db&&Array.isArray(CATALOG),null,{timeout:90000});
  await page.evaluate(()=>PBNetwork.initialized);
  report.stage='native-version';
  const info=await call('ProDevice','getInfo');
  report.device={platform:info.platform,versionName:info.versionName,versionCode:info.versionCode};
  ok('The installed production app reports the exact phase version',info.platform==='windows'&&info.versionName===expectedVersion&&info.versionCode===expectedCode);
  ok('Both versions use the same main storage origin',new URL(page.url()).origin==='https://tauri.localhost');
}
async function failureDiagnostics(){
  const evidence={connected:Boolean(browser?.isConnected()),pages:[]};
  if(!browser?.isConnected())return evidence;
  const pages=browser.contexts().flatMap(context=>context.pages()).slice(0,8);
  evidence.pages=pages.map(target=>({url:target.url().split(/[?#]/)[0],closed:target.isClosed()}));
  if(page&&!page.isClosed()){
    let timer;
    try{evidence.main=await Promise.race([page.evaluate(()=>({readyState:document.readyState,bridge:Boolean(window.Capacitor),workspace:Boolean(window.PBWorkspace),network:Boolean(window.PBNetwork),networkReady:window.PBNetwork?.ready,database:typeof db!=='undefined'&&Boolean(db),catalog:typeof CATALOG!=='undefined'&&Array.isArray(CATALOG)})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Bounded startup diagnostic timed out')),2000);})]);}
    catch(error){evidence.main={error:error.message};}
    finally{clearTimeout(timer);}
  }
  return evidence;
}
async function passwordDialog(create=false){
  let dialog;
  for(let i=0;i<180;i++){
    dialog=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='https://tauri.localhost/windows/dialog/index.html');
    if(dialog)break;await pause(500);
  }
  assert.ok(dialog,'Native password dialog was not opened after the OS folder choice');
  await dialog.locator('#submit').waitFor({state:'visible',timeout:30000});
  await dialog.locator('#password').fill(PASSWORD);
  if(create){await dialog.locator('#repeat').fill(PASSWORD);await dialog.locator('#notice').check();}
  await dialog.locator('#remember').check();
  await dialog.locator('#submit').click();
}
async function waitVaultResult(){
  await page.waitForFunction(()=>window.__windowsUpgradeVaultResult?.done,null,{timeout:90000});
  const value=await page.evaluate(()=>window.__windowsUpgradeVaultResult);
  assert.ok(!value.error,'Native vault operation failed: '+String(value.error||''));return value.result;
}
async function catalogBytes(version,size){
  assert.ok(Number.isSafeInteger(version)&&version>0&&Number.isSafeInteger(size)&&size>0&&size<=131072,'Small exact catalog fixture expected');
  const result=await call('ProVault','catalogRead',{version,offset:0});
  const output=Buffer.from(result.data,'base64');assert.equal(output.length,size);return output;
}
async function cipherEvidence(version,expected){
  const filename='katalog-'+version+'.pbv';
  const candidates=[join(vaultParent,'Private Brain','Katalog',filename),join(vaultParent,'Katalog',filename)],found=[];
  for(const candidate of candidates)try{await access(candidate);found.push(candidate);}catch{}
  assert.equal(found.length,1,'Exactly one expected synthetic PBV1 catalog file must exist');
  const cipher=await readFile(found[0]);
  ok('The actual portable catalog is PBV1 ciphertext, not the plaintext fixture',cipher.subarray(0,4).equals(Buffer.from('PBV1'))&&cipher.length>expected.length&&!cipher.includes(expected));
  return{path:relative(vaultParent,found[0]),bytes:cipher.length,sha256:sha256(cipher)};
}
async function nativeOriginal(){
  const meta=await call('ProFiles','originalInfo',{hash});
  ok('The native original metadata survived the installation step',meta.hash===hash&&meta.name===NAME&&meta.size===bytes.length);
  const content=Buffer.from((await call('ProFiles','readOriginal',{hash,offset:0})).data,'base64');
  ok('Native original bytes and SHA-256 remain exact',content.equals(bytes)&&sha256(content)===hash);
  const physical=await readFile(join(appData,'originals-v1',hash,'data'));
  ok('The same versions-independent app data path contains the original',physical.equals(bytes));
  // This original is app-private plaintext. The PBV1 catalog test separately
  // proves password encryption and DPAPI remembered-key restoration.
}
async function persistentState(){
  const record=await page.evaluate(hash=>idbGet('catalog',hash),hash);
  ok('The committed IndexedDB catalog record and tag survived',record?.hash===hash&&record.name===NAME&&record.path===FIXTURE_PATH&&record.size===bytes.length&&record.snippet.includes(marker)&&record.tags.includes(marker));
  const state=await page.evaluate(()=>({lang:localStorage.getItem('pb_lang'),theme:localStorage.getItem('pb_theme'),marker:localStorage.getItem('pb_windows_upgrade_probe_v1'),documentLang:document.documentElement.lang,profile:window.PBTheme?.current?.()}));
  ok('Locale and dark appearance survive the installed version change',state.lang==='ru'&&state.theme==='dunkel'&&state.marker===marker&&state.documentLang==='ru'&&(phase==='seed'||state.profile==='nachtblau'));
  const network=await call('ProNetwork','getState');
  ok('The non-default native offline preference survives',network.offline===true&&await page.evaluate(()=>PBNetwork.ready&&PBNetwork.offline));
}
await mkdir(reportRoot,{recursive:true});
try{
  await connect();
  report.stage=phase+'-data';
  if(phase==='seed'){
    ok('The synthetic vault starts unconfigured',(await call('ProVault','state')).configured===false);
    await page.evaluate(()=>PBNetwork.setOffline(true));
    await page.evaluate(async({name,path,text,stamp,marker})=>{
      const file=new File([text],name,{type:'text/plain',lastModified:stamp});
      await signBatch([{file,path,dirId:null}]);
      const record=CATALOG.find(r=>r.name===name&&r.snippet.includes(marker));if(!record)throw Error('Actual import did not produce the fixture catalog record');
      record.tags=[...new Set([...(record.tags||[]),marker])];await idbPut('catalog',record);PBWorkspace.refresh();
    },{name:NAME,path:FIXTURE_PATH,text:bytes.toString('utf8'),stamp:STAMP,marker});
    await nativeOriginal();
    await page.evaluate(()=>{window.__windowsUpgradeVaultResult={done:false};Capacitor.Plugins.ProVault.choose().then(result=>window.__windowsUpgradeVaultResult={done:true,result},e=>window.__windowsUpgradeVaultResult={done:true,error:e.code||e.message});});
    console.log('WINDOWS_UPGRADE_FOLDER_REQUESTED');
    // Companion PowerShell must select exactly PB_WINDOWS_UPGRADE_VAULT in the
    // real Windows folder picker. The .29 production binary ignores test flags.
    await passwordDialog(true);const selected=await waitVaultResult();
    ok('The old production app creates and remembers a real password vault',selected.created===true&&selected.state?.configured&&selected.state.unlocked&&selected.state.remembered);
    const migration=await call('ProVault','migrate');
    ok('The old app migrated at least the real fixture original',migration.originals>=1&&migration.skipped===0);
    const record=await page.evaluate(hash=>idbGet('catalog',hash),hash);
    const expected=Buffer.from(JSON.stringify({app:'private-brain-pro',v:1,created:STAMP,catalog:[record],saved:null,upgradeProbe:marker}));
    assert.ok(expected.length<=131072);
    const ticket=(await call('ProVault','catalogBegin')).ticket;
    try{await call('ProVault','catalogAppend',{ticket,offset:0,data:expected.toString('base64')});await call('ProVault','catalogFinish',{ticket});}
    catch(error){await call('ProVault','catalogAbort',{ticket}).catch(()=>{});throw error;}
    const info=await call('ProVault','catalogInfo');
    ok('The old app commits and decrypts the exact encrypted catalog fixture',info.exists===true&&(await catalogBytes(info.version,info.size)).equals(expected));
    await writeFile(join(reportRoot,'catalog-plaintext-fixture.json'),expected);
    report.catalog={version:info.version,size:info.size,sha256:sha256(expected),cipher:await cipherEvidence(info.version,expected)};
    await page.evaluate(()=>{document.querySelector('[data-lang="ru"]').click();if(document.documentElement.dataset.theme!=='dunkel')document.querySelector('#themeToggle').click();});
    await page.evaluate(marker=>localStorage.setItem('pb_windows_upgrade_probe_v1',marker),marker);
    await persistentState();
  }else{
    const seed=JSON.parse(await readFile(join(reportRoot,'seed.json'),'utf8'));
    assert.ok(seed.success&&seed.device?.versionName==='1.0.0-preview.29'&&seed.marker===marker&&seed.fixture.hash===hash,'Successful exact old-version seed proof required');
    const expected=await readFile(join(reportRoot,'catalog-plaintext-fixture.json'));
    assert.equal(sha256(expected),seed.catalog.sha256);
    const state=await call('ProVault','state');
    if(phase==='verify'){
      ok('The new production app restores the old DPAPI remembered vault key',state.configured&&state.unlocked&&state.remembered);
    }else{
      ok('Explicit locking survives the new-version cold restart',state.configured&&state.unlocked===false&&state.remembered===false);
      await page.evaluate(()=>{window.__windowsUpgradeVaultResult={done:false};Capacitor.Plugins.ProVault.unlock().then(result=>window.__windowsUpgradeVaultResult={done:true,result},e=>window.__windowsUpgradeVaultResult={done:true,error:e.code||e.message});});
      await passwordDialog(false);const unlocked=await waitVaultResult();
      ok('The same original password unlocks the old vault in the new app',unlocked.unlocked===true&&unlocked.state?.unlocked&&unlocked.state.remembered);
    }
    const cipher=await cipherEvidence(seed.catalog.version,expected);
    ok('The old PBV1 catalog ciphertext was preserved byte for byte',cipher.sha256===seed.catalog.cipher.sha256&&cipher.bytes===seed.catalog.cipher.bytes);
    ok('The new native core authenticates and decrypts the old PBV1 catalog exactly',(await catalogBytes(seed.catalog.version,seed.catalog.size)).equals(expected));
    await nativeOriginal();await persistentState();
    report.catalog={version:seed.catalog.version,size:seed.catalog.size,sha256:sha256(expected),cipher};
    if(phase==='verify'){
      const locked=await call('ProVault','lock');
      ok('Explicit lock removes the remembered key without changing the vault',locked.configured&&locked.unlocked===false&&locked.remembered===false);
    }
  }
  ok('No uncaught main-app runtime error occurred',report.errors.length===0);
  report.success=true;console.log('WINDOWS_UPGRADE_'+phase.toUpperCase().replaceAll('-','_')+'_PASS');
}catch(error){
  report.failure=error.message;
  try{report.startupDiagnostics=await failureDiagnostics();}catch(diagnosticError){report.startupDiagnostics={error:diagnosticError.message};}
  console.error('WINDOWS_UPGRADE_'+phase.toUpperCase().replaceAll('-','_')+'_FAIL: '+error.message);process.exitCode=1;
}finally{
  await writeFile(join(reportRoot,phase+'.json'),JSON.stringify(report,null,2)+'\n');
  await browser?.close().catch(()=>{});
}
