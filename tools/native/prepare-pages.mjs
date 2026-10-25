// Browser/PWA delivery of the already prepared Pro interface. Native builds do
// not run this step. The original manifest identity and user stores stay intact.
import {readFile,writeFile,cp,readdir,lstat,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,resolve,sep} from 'node:path';

const ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const BROWSER_RUNTIME=`/* Browser capabilities, installation and scoped updates; no native identity. */
(() => {
  'use strict';
  const words={
    de:'Browser-Version. Direkte Geräte-Mail und native Gerätefunktionen benötigen die Android- oder Windows-App. Für Dateien gelten die Möglichkeiten und Freigaben dieses Browsers.',
    en:'Browser version. Direct device mail and native device features require the Android or Windows app. File access uses this browser’s capabilities and permissions.',
    ru:'Браузерная версия. Прямая почта и системные функции требуют приложения Android или Windows. Доступ к файлам зависит от возможностей и разрешений браузера.',
    pl:'Wersja przeglądarkowa. Bezpośrednia poczta i funkcje systemowe wymagają aplikacji Android lub Windows. Dostęp do plików zależy od możliwości i uprawnień przeglądarki.'
  };
  function start(){
    const settings=document.getElementById('panel-settings');
    for(const node of document.querySelectorAll('.wrap>footer,body>.fp-badge-wrap'))settings?.append(node);
    document.getElementById('pbVersion')?.remove();
    const status=settings?.querySelector(':scope>.native-status')||document.createElement('p');status.className='native-status pb-pages-status';status.setAttribute('role','status');
    if(!status.isConnected){const install=document.getElementById('install-box');if(install)install.after(status);else settings?.append(status);}
    const render=()=>{status.textContent=words[document.documentElement.lang]||words.de;};render();
    new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    const placeInstall=()=>{const button=document.getElementById('installieren'),tools=document.querySelector('header.top .tools');if(button&&tools&&button.parentElement!==tools)tools.prepend(button);};
    placeInstall();new MutationObserver(placeInstall).observe(document.body,{childList:true,subtree:true});
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
`;

export function renderPagesWorker(build,inventory){
  return `/* Private Brain Pro PWA. Generated from a complete, hashed public bundle. */
'use strict';
const BUILD=${JSON.stringify(build)},INVENTORY=${JSON.stringify(inventory)};
const SCOPE=new URL(self.registration.scope);
// CacheStorage belongs to an origin. Include this exact registration scope;
// never delete the older PWA, V3, other apps, or another deployment path.
const PREFIX='pb-pro-pages-v1:'+encodeURIComponent(SCOPE.href)+':';
const CACHE=PREFIX+'build-'+BUILD,CLIENTS=PREFIX+'clients';
const READY=new URL('__pb_pages_ready__',SCOPE).href;
const files=new Map(INVENTORY.map(item=>[new URL(item.path,SCOPE).href,item.sha256]));
const bindings=new Map();
const own=url=>url.origin===SCOPE.origin&&url.pathname.startsWith(SCOPE.pathname);
const canonical=value=>{const url=new URL(value);url.search='';url.hash='';return url.href;};
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
async function checked(response,expected){
  if(!response.ok)throw Error('PWA_ASSET_RESPONSE');
  const actual=hex(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()));
  if(actual!==expected)throw Error('PWA_ASSET_HASH');return response;
}
async function ready(build){
  if(!/^[a-f0-9]{64}$/.test(build||''))return null;
  const name=PREFIX+'build-'+build;if(!await caches.has(name))return null;
  const cache=await caches.open(name),response=await cache.match(READY);if(!response)return null;
  try{const value=await response.json();return value.complete===true&&value.build===build&&value.scope===SCOPE.href&&Number.isSafeInteger(value.installedAt)&&value.installedAt>0&&Number.isSafeInteger(value.files)&&value.files>0?{name,cache,...value}:null;}catch{return null;}
}
async function completeCaches(){
  const values=[];for(const name of await caches.keys())if(name.startsWith(PREFIX+'build-')){const value=await ready(name.slice((PREFIX+'build-').length));if(value)values.push(value);}
  return values.sort((a,b)=>b.installedAt-a.installedAt);
}
async function bind(id,build){
  if(!id||!/^[a-f0-9]{64}$/.test(build||''))return;
  bindings.set(id,build);
  try{const cache=await caches.open(CLIENTS);await cache.put(new URL('__pb_pages_client__/'+encodeURIComponent(id),SCOPE).href,new Response(build));}catch{/* Quota must not block the freshly fetched page. */}
}
async function clientBuild(id){
  if(!id)return null;if(bindings.has(id))return bindings.get(id);
  if(!await caches.has(CLIENTS))return null;
  const response=await(await caches.open(CLIENTS)).match(new URL('__pb_pages_client__/'+encodeURIComponent(id),SCOPE).href);
  if(!response)return null;const build=await response.text();if(!/^[a-f0-9]{64}$/.test(build))return null;bindings.set(id,build);return build;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  if(!await ready(BUILD)){
    const cache=await caches.open(CACHE);let next=0;
    try{
      await Promise.all(Array.from({length:4},async()=>{while(next<INVENTORY.length){const item=INVENTORY[next++],url=new URL(item.path,SCOPE).href;const response=await checked(await fetch(new Request(url,{cache:'no-store',credentials:'same-origin'})),item.sha256);await cache.put(url,response);}}));
      // No complete marker exists until every byte of this generation passed.
      await cache.put(READY,new Response(JSON.stringify({complete:true,build:BUILD,scope:SCOPE.href,installedAt:Date.now(),files:INVENTORY.length}),{headers:{'content-type':'application/json'}}));
    }catch(error){await caches.delete(CACHE);throw error;}
  }
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(client=>own(new URL(client.url)));
  const used=await Promise.all(clients.map(client=>clientBuild(client.id)));
  // An older, still open page may predate generation metadata. Keep its code
  // rather than invalidate it or forcibly reload a possibly unsaved draft.
  if(used.every(Boolean))for(const name of await caches.keys())if(name.startsWith(PREFIX+'build-')&&name!==CACHE&&!used.some(build=>name===PREFIX+'build-'+build))await caches.delete(name);
  await self.clients.claim();
})()));
async function navigation(event){
  try{
    const response=await fetch(new Request(event.request,{cache:'no-store'}));
    if(!response.ok)throw Error('PWA_NAVIGATION_RESPONSE');
    const text=await response.clone().text(),match=/<meta name="pb-pages-build" content="([a-f0-9]{64})">/.exec(text);
    if(!match)throw Error('PWA_NAVIGATION_GENERATION');
    const build=match[1];
    if(build!==BUILD){
      const generation=await ready(build);
      if(!generation){
        // A newer HTML file alone is not an update. Its worker must first
        // certify every required asset; a mixed/partial deployment stays on
        // the previous complete version, without executing its new scripts.
        const update=self.registration.update?.();if(update)event.waitUntil(Promise.resolve(update).catch(()=>{}));
        throw Error('PWA_GENERATION_NOT_READY');
      }
      const certified=await generation.cache.match(new URL('index.html',SCOPE).href);
      if(!certified)throw Error('PWA_CERTIFIED_DOCUMENT_MISSING');
      await bind(event.resultingClientId||event.clientId,build);return certified;
    }
    await checked(response,files.get(new URL('index.html',SCOPE).href));
    await bind(event.resultingClientId||event.clientId,build);
    // The active worker knows the exact document hash of its own generation.
    return response;
  }catch{
    const complete=await completeCaches();
    for(const generation of complete){const response=await generation.cache.match(new URL('index.html',SCOPE).href);if(response){await bind(event.resultingClientId||event.clientId,generation.build);return response;}}
    return Response.error();
  }
}
async function asset(event,url){
  const explicit=url.searchParams.get('pb-build'),build=explicit||await clientBuild(event.clientId);
  const generation=await ready(build),key=canonical(url.href);
  if(generation){const hit=await generation.cache.match(key);if(hit){if(event.request.mode==='navigate')await bind(event.resultingClientId||event.clientId,build);return hit;}}
  if(build&&build!==BUILD&&!generation)return Response.error();
  const response=await fetch(new Request(event.request,{cache:'no-store'}));
  // The active worker can verify uncached bytes only for its own inventory.
  // It never inserts these requests into another generation's complete cache.
  return build===BUILD&&files.has(key)?checked(response,files.get(key)):response;
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);if(event.request.method!=='GET'||!own(url))return;
  const main=url.pathname===SCOPE.pathname||url.pathname===new URL('index.html',SCOPE).pathname;
  event.respondWith(event.request.mode==='navigate'&&main?navigation(event):asset(event,url));
});
`;
}

async function filesIn(dir,prefix=''){
  const result=[];
  for(const name of(await readdir(join(dir,prefix))).sort()){
    const rel=prefix?prefix+'/'+name:name,stat=await lstat(join(dir,rel));
    if(stat.isSymbolicLink())throw Error('Pages input must not contain symlinks: '+rel);
    if(stat.isDirectory())result.push(...await filesIn(dir,rel));else if(stat.isFile())result.push(rel);else throw Error('Unsupported Pages input: '+rel);
  }
  return result;
}

export async function preparePages(directory=join(ROOT,'www')){
  const dir=resolve(directory);
  if(dir===ROOT||ROOT.startsWith(dir+sep))throw Error('Refusing to rewrite the repository or an ancestor');
  let html=await readFile(join(dir,'index.html'),'utf8');
  if(!html.includes('<script src="native.js"></script>')||html.includes('name="pb-pages-build"'))throw Error('Pages needs a fresh native web bundle');
  const manifestBytes=await readFile(join(ROOT,'app-manifest.json'));
  const manifest=JSON.parse(manifestBytes);
  if(manifest.start_url!=='./index.html'||manifest.scope!=='./'||Object.hasOwn(manifest,'id'))throw Error('Review the original PWA identity before changing Pages');
  // Das fest eingebaute Anleitungsvideo gehört nur in APK/Windows; die PWA streamt es von der Videoseite.
  await rm(join(dir,'filme'),{recursive:true,force:true});
  const input=await filesIn(dir);
  const fingerprints=[];
  for(const path of input){if(path.startsWith('.')||path.split('/').some(part=>['.git','node_modules'].includes(part)))throw Error('Nonpublic Pages input');fingerprints.push([path,digest(await readFile(join(dir,path)))]);}
  const build=digest(JSON.stringify({generator:digest(await readFile(fileURLToPath(import.meta.url))),manifest:digest(manifestBytes),files:fingerprints}));
  const badge=/<button\b(?=[^>]*\bid=["']pbVersion["'])[^>]*>[\s\S]*?<\/button>/g;
  const badges=[...html.matchAll(badge)];if(badges.length>1)throw Error('Multiple native version badges');html=html.replace(badge,'');
  html=html.replace('<script src="native.js"></script>','<script src="pages-runtime.js"></script>');
  // The inherited explicit reload control also needs the new scope ownership;
  // otherwise it would delete code caches of the independent older PWA.
  for(const [before,after]of[
    ["k.startsWith('private-brain-')","k.startsWith('pb-pro-pages-v1:'+encodeURIComponent(new URL('./',location.href).href)+':')"],
    ['if(r) await r.unregister();',"if(r&&r.scope===new URL('./',location.href).href) await r.unregister();"]
  ]){if(html.split(before).length!==2)throw Error('Review Pages reload scope anchor');html=html.replace(before,after);}
  const head=`<meta name="pb-pages-build" content="${build}">\n<script>document.documentElement.classList.add('pb-web');</script>\n<link rel="manifest" href="app-manifest.json">\n<style>html.pb-web #installieren{display:inline-flex!important;align-items:center;gap:4px;min-height:44px;padding:4px 8px;font-size:.8rem;white-space:nowrap}html.pb-web #install-box{display:block!important}@media(any-pointer:fine){html.pb-web #installieren{min-height:32px}}@media(display-mode:standalone){html.pb-web #installieren,html.pb-web #install-box{display:none!important}}</style>\n<script src="assets/installieren.js?v=1" data-name="${manifest.short_name}" data-in="#install-box" data-klasse="primary" data-vor="install-platz" defer></script>\n`;
  if(html.split('</head>').length!==2)throw Error('Review Pages head anchor');html=html.replace('</head>',head+'</head>');
  // Every explicit local document dependency carries its generation. Dynamic
  // requests are additionally bound to the client established by navigation.
  html=html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<(?:link|img|source|video|audio|iframe|a)\b[^>]*>/g,tag=>{
    if(tag.startsWith('<!--')||tag.startsWith('<style'))return tag;
    const end=tag.indexOf('>')+1;
    return tag.slice(0,end).replace(/\b(src|href|poster)=(["'])([^"']+)\2/g,(all,key,quote,value)=>{
      if(/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value))return all;
      const url=new URL(value,'https://pages.invalid/');url.searchParams.set('pb-build',build);return key+'='+quote+url.pathname.slice(1)+url.search+url.hash+quote;
    })+tag.slice(end);
  });
  await cp(join(ROOT,'app-manifest.json'),join(dir,'app-manifest.json'));
  await writeFile(join(dir,'pages-runtime.js'),BROWSER_RUNTIME);
  await writeFile(join(dir,'index.html'),html);
  await writeFile(join(dir,'.nojekyll'),'');
  const inventory=[];
  for(const path of await filesIn(dir)){if(['sw.js','pwa-build.json'].includes(path))continue;inventory.push({path:'./'+path,sha256:digest(await readFile(join(dir,path)))});}
  await writeFile(join(dir,'sw.js'),renderPagesWorker(build,inventory));
  await writeFile(join(dir,'pwa-build.json'),JSON.stringify({schema:1,build,manifestSha256:digest(manifestBytes),assets:inventory},null,2)+'\n');
  return{directory:dir,build,assets:inventory.length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(await preparePages(process.argv[2])));
