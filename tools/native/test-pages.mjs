import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {preparePages} from './prepare-pages.mjs';

const scratch=await mkdtemp(join(tmpdir(),'pb-pages-')),scope='https://example.test/pro/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const originalManifest=await readFile('app-manifest.json'),originalIndex=await readFile('index.html');
async function fixture(name,core){
  const dir=join(scratch,name);await mkdir(join(dir,'assets'),{recursive:true});
  const html='<!doctype html><html lang="de"><head><title>Private Brain Pro</title><link rel="stylesheet" href="native.css"><script>window.example=\'<a href="unchanged.html">example</a>\';</script></head><body><header class="top"><div class="brand"><h1>Private Brain Pro <button id="pbVersion" type="button"><span>v1.0.37</span></button></h1></div><div class="tools"></div></header><div class="wrap"><section id="panel-settings"></section></div><script src="core.js"></script><script src="native.js"></script></body></html>';
  const source=html.replace('</head>',"<script>async function hardReload(){var r=await navigator.serviceWorker.getRegistration();if(r) await r.unregister();var ks=await caches.keys();await Promise.all(ks.filter(function(k){return k.startsWith('private-brain-');}).map(k=>caches.delete(k)));}</script></head>");
  for(const[path,bytes]of Object.entries({'index.html':source,'native.css':'body{color:black}','core.js':core,'native.js':'window.nativeVersionWasRun=true;','assets/installieren.js':'/* unchanged installer */','icon-192.png':'icon192','icon-512.png':'icon512'}))await writeFile(join(dir,path),bytes);
  const result=await preparePages(dir),receipt=JSON.parse(await readFile(join(dir,'pwa-build.json'),'utf8'));
  const assets=new Map();for(const item of receipt.assets)assets.set(new URL(item.path,scope).href,await readFile(join(dir,item.path)));
  return{dir,...result,receipt,assets,worker:await readFile(join(dir,'sw.js'),'utf8'),html:await readFile(join(dir,'index.html'),'utf8')};
}
class MemoryCache{
  entries=new Map();
  key(value){return typeof value==='string'?value:value.url;}
  async put(key,response){this.entries.set(this.key(key),response.clone());}
  async match(key){return this.entries.get(this.key(key))?.clone();}
  async keys(){return[...this.entries.keys()].map(url=>new Request(url));}
}
class MemoryCaches{
  values=new Map();deleted=[];
  async open(name){if(!this.values.has(name))this.values.set(name,new MemoryCache());return this.values.get(name);}
  async has(name){return this.values.has(name);}
  async keys(){return[...this.values.keys()];}
  async delete(name){this.deleted.push(name);return this.values.delete(name);}
}
function worker(fixture,caches,network,clock=1000,clients=[]){
  const handlers=new Map(),requests=[];let skipped=0,claimed=0,updates=0;
  const context={URL,Request,Response,Map,Array,Number,JSON,Error,crypto:webcrypto,
    Date:class extends Date{static now(){return clock;}},caches,
    fetch:async request=>{requests.push({url:request.url,cache:request.cache});return network(request);},
    self:{registration:{scope,update:async()=>{updates++;}},addEventListener:(type,callback)=>handlers.set(type,callback),skipWaiting:async()=>{skipped++;},clients:{matchAll:async()=>clients,claim:async()=>{claimed++;}}}};
  vm.runInNewContext(fixture.worker,context,{filename:'generated-pages-worker.js'});
  return{
    requests,get skipped(){return skipped;},get claimed(){return claimed;},get updates(){return updates;},
    async event(type){let pending;handlers.get(type)({waitUntil:value=>pending=value});await pending;},
    async request(path,{clientId='',resultingClientId='',navigate=false,method='GET'}={}){
      const request=new Request(new URL(path,scope),{method});if(navigate)Object.defineProperty(request,'mode',{value:'navigate'});
      let response;handlers.get('fetch')({request,clientId,resultingClientId,respondWith:value=>response=value,waitUntil:value=>value.catch(()=>{})});return response?await response:null;
    }
  };
}
let online=true,files=new Map();
const network=async request=>{if(!online)throw Error('offline');const url=new URL(request.url);url.search='';const data=files.get(url.href);return new Response(data??'not found',{status:data===undefined?404:200});};
try{
  const a=await fixture('a','window.codeGeneration="A";'),again=await fixture('again','window.codeGeneration="A";'),b=await fixture('b','window.codeGeneration="B";');
  ok('The original PWA manifest, inferred identity, start URL and scope remain byte-identical',originalManifest.equals(await readFile(join(a.dir,'app-manifest.json')))&&!Object.hasOwn(JSON.parse(originalManifest),'id'));
  ok('Same public inputs produce the same generation; changed code produces a new generation',a.build===again.build&&a.build!==b.build);
  ok('The static native version badge and native updater bootstrap cannot flash in the browser',!a.html.includes('id="pbVersion"')&&!a.html.includes('src="native.js')&&a.html.includes('pages-runtime.js?pb-build='+a.build));
  ok('Inline app code stays exact while actual local dependencies get generation URLs',a.html.includes("window.example='<a href=\"unchanged.html\">example</a>';")&&a.html.includes('core.js?pb-build='+a.build)&&a.html.includes('app-manifest.json?pb-build='+a.build));
  ok('The explicit reload control cannot clear an older PWA or unregister a parent-scope worker',!a.html.includes("k.startsWith('private-brain-')")&&a.html.includes("r.scope===new URL('./',location.href).href")&&a.html.includes("k.startsWith('pb-pro-pages-v1:'"));
  ok('The browser notice and unchanged installation helper are packaged',await readFile(join(a.dir,'pages-runtime.js'),'utf8').then(s=>s.includes('Browser-Version')&&!s.includes('ProDevice'))&&a.html.includes('assets/installieren.js?v=1&pb-build='+a.build));
  ok('Every offline inventory hash matches its actual prepared output bytes',await Promise.all(a.receipt.assets.map(async item=>sha(await readFile(join(a.dir,item.path)))===item.sha256)).then(values=>values.every(Boolean)));
  await assert.rejects(preparePages(a.dir),/fresh native web bundle/);
  ok('A second packaging pass fails instead of silently stacking PWA adaptations',true);
  const links=join(scratch,'symlink');await mkdir(links);await writeFile(join(links,'index.html'),'<head></head><script src="native.js"></script>');await symlink(join(a.dir,'core.js'),join(links,'public-link.js'));
  await assert.rejects(preparePages(links),/symlinks/);await assert.rejects(preparePages(resolve('.')),/repository or an ancestor/);
  ok('Symlinks and accidental repository-root rewrites are refused',true);

  const caches=new MemoryCaches(),foreign=['private-brain-v91','pbv3-web-old','another-app-cache','pb-pro-pages-v1:'+encodeURIComponent('https://example.test/other/')+':build-'+'f'.repeat(64)];
  for(const name of foreign)await(await caches.open(name)).put(scope+'sentinel',new Response(name));
  files=a.assets;const wa=worker(a,caches,network,1000);await wa.event('install');await wa.event('activate');
  const prefix='pb-pro-pages-v1:'+encodeURIComponent(scope)+':',cacheA=prefix+'build-'+a.build;
  ok('Installation verifies the whole generation before readiness and activation',await caches.has(cacheA)&&wa.skipped===1&&wa.claimed===1&&wa.requests.length===a.assets.size&&wa.requests.every(r=>r.cache==='no-store'));
  ok('The worker never removes old PWA, V3, foreign app or other-scope caches',foreign.every(name=>caches.values.has(name))&&foreign.every(name=>!caches.deleted.includes(name)));
  const docA=await wa.request('index.html',{navigate:true,resultingClientId:'old'});
  ok('Main navigation fetches the current document from the network with no-store',await docA.text()===a.html&&wa.requests.at(-1).cache==='no-store');
  files=b.assets;
  const unready=await wa.request('index.html',{navigate:true,resultingClientId:'pending-b'});
  ok('The first navigation to newer HTML before B installation keeps the certified A shell and requests an update',await unready.text()===a.html&&wa.updates===1&&!await caches.has(prefix+'build-'+b.build));
  const beforeUnknownAsset=wa.requests.length,unreadyScript=await wa.request('core.js?pb-build='+b.build,{clientId:'pending-b'});
  ok('An unready foreign-generation asset is never executed as unchecked network bytes',unreadyScript.type==='error'&&wa.requests.length===beforeUnknownAsset);
  files=new Map(b.assets);files.set(scope+'core.js',Buffer.from('mixed incorrect B code'));
  const brokenB=worker(b,caches,network,1500);await assert.rejects(brokenB.event('install'),/PWA_ASSET_HASH/);
  const brokenPage=await wa.request('index.html',{navigate:true,resultingClientId:'broken-b'});
  const safeScript=await wa.request('core.js?pb-build='+a.build,{clientId:'broken-b'});
  ok('A mixed B deployment is never released as HTML or executable code before its failed atomic install',await brokenPage.text()===a.html&&await safeScript.text()==='window.codeGeneration="A";'&&!await caches.has(prefix+'build-'+b.build));
  files=b.assets;const wb=worker(b,caches,network,2000,[{id:'old',url:scope+'index.html'},{id:'new',url:scope+'index.html'},{id:'foreign',url:'https://example.test/other/'}]);await wb.event('install');
  const fresh=await wa.request('index.html',{navigate:true,resultingClientId:'new'});
  ok('The previous active worker releases B only after its complete generation has been installed',await fresh.text()===b.html);
  const scriptB=await wa.request('core.js?pb-build='+b.build,{clientId:'new'}),scriptA=await wa.request('core.js',{clientId:'old'});
  ok('New and already open documents receive their own complete asset generation',await scriptB.text()==='window.codeGeneration="B";'&&await scriptA.text()==='window.codeGeneration="A";');
  const orphan=prefix+'build-'+'e'.repeat(64);await caches.open(orphan);await wb.event('activate');
  ok('Activation keeps generations still used by live clients and removes only unused own-scope caches',await caches.has(cacheA)&&!await caches.has(orphan)&&foreign.every(name=>caches.values.has(name)));
  const restarted=worker(b,caches,network,3000);
  ok('Client generation affinity survives a service-worker restart',await restarted.request('core.js',{clientId:'old'}).then(response=>response.text()).then(text=>text==='window.codeGeneration="A";'));
  online=false;const offline=await restarted.request('index.html',{navigate:true,resultingClientId:'offline-new'});
  ok('Offline navigation uses the newest complete document and its matching assets',await offline.text()===b.html&&await restarted.request('core.js',{clientId:'offline-new'}).then(r=>r.text()).then(text=>text==='window.codeGeneration="B";'));
  ok('Other paths, origins and non-GET requests are not intercepted',await restarted.request('https://example.test/other/index.html')===null&&await restarted.request('https://elsewhere.test/pro/index.html')===null&&await restarted.request('https://example.test/pro-neighbor/index.html')===null&&await restarted.request('api',{method:'POST'})===null);
  online=true;const bad=await fixture('bad','window.codeGeneration="C";');files=new Map(bad.assets);files.set(scope+'core.js',Buffer.from('wrong bytes'));
  const failed=worker(bad,caches,network,4000);await assert.rejects(failed.event('install'),/PWA_ASSET_HASH/);
  ok('A failed or mixed deployment never publishes a partial generation and preserves both complete generations',!await caches.has(prefix+'build-'+bad.build)&&failed.skipped===0&&await caches.has(cacheA)&&await caches.has(prefix+'build-'+b.build));
  online=false;const preserved=await restarted.request('index.html',{navigate:true,resultingClientId:'after-failure'});
  ok('Offline startup remains coherent after a failed update',await preserved.text()===b.html&&await restarted.request('core.js',{clientId:'after-failure'}).then(r=>r.text()).then(text=>text==='window.codeGeneration="B";'));
  ok('Repository index and manifest were not edited by packaging or tests',originalManifest.equals(await readFile('app-manifest.json'))&&originalIndex.equals(await readFile('index.html')));
  console.log(count+' Pages packaging/offline checks passed.');
}finally{await rm(scratch,{recursive:true,force:true});}
