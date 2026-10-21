// Simulation (browser, Android plugins stubbed): the user manual inside the app.
// Proves: ways in, every jump link has a target, jump and return (link, second tap,
// Android Back), provider links open only on a real tap, chapter on protection.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),origin='https://localhost/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:800}}),errors=[],opened=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=route.request().url();if(!url.startsWith(origin))return route.abort();const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}});
  await page.exposeFunction('opened',url=>opened.push(url));
  await page.addInitScript(()=>{
    const state={configured:true,unlocked:true,offline:false,auto:true,malware:{},links:{},keys:{},files:[]};
    window.Capacitor={Plugins:{
      ProLinks:{async open(args){await window.opened(args.url);return{ok:true};}},
      ProProtect:new Proxy({},{get:(_,m)=>m==='then'?undefined:async()=>m==='state'?state:{checked:true,skipped:'NOT_DUE'}}),
      ProVault:new Proxy({},{get:(_,m)=>m==='then'?undefined:async()=>m==='state'?{configured:true,unlocked:true,location:'sdcard',folder:'Private Brain',attachments:0,attachmentBytes:0,reachable:true}:m==='attachments'?{items:[]}:m==='catalogInfo'?{exists:false}:{ok:true}}),
      ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.19-debug',nativeMail:true};}}}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBHandbuch&&window.PBWorkspace);
  await page.click('[data-tab=settings]');
  ok('Settings start with a plain link to the manual',await page.locator('#panel-settings>#handbuchLink a').textContent()==='📖 Benutzerhandbuch');
  ok('Storage card links to its chapter',await page.locator('#vaultPlace #handbuchSpeicherort').isVisible());
  await page.waitForFunction(()=>document.querySelector('#schutz-anleitung'));
  ok('Protection card: plain links for account and key, and a guide',await page.evaluate(()=>['schutz-get-abuse','schutz-get-vt','schutz-get-vt-key'].every(id=>document.getElementById(id)?.tagName==='A')&&document.querySelectorAll('#schutzPlace button[id^=schutz-get]').length===0));
  // Every jump link in the content must land somewhere.
  const dead=await page.evaluate(()=>{PBHandbuch.open('');const ids=new Set([...document.querySelectorAll('#pbHandbuch [id]')].map(e=>e.id));return [...document.querySelectorAll('#pbHandbuch a.hb-sprung')].filter(a=>!ids.has(a.dataset.target)).map(a=>'„'+a.textContent+'“→'+(a.dataset.target||'?'));});
  ok('No dead jump link in the whole manual ('+dead.join(', ')+')',dead.length===0);
  const ids=await page.evaluate(()=>[...document.querySelectorAll('#pbHandbuch [id]')].map(e=>e.id));
  ok('Every target name is used only once ('+ids.filter((x,i)=>ids.indexOf(x)!==i).join(', ')+')',new Set(ids).size===ids.length);
  const chapters=await page.locator('#pbHandbuch .hb-kapitel>h3').allTextContents();
  ok('Virenschutz is its own chapter, with steps for both keys',chapters.includes('Virenschutz, Spam und Betrug')&&chapters.some(c=>c.includes('abuse.ch'))&&chapters.some(c=>c.includes('VirusTotal')));
  const hrefs=await page.locator('#pbHandbuch a.hb-extern').evaluateAll(l=>l.map(a=>a.dataset.url));
  ok('Provider links: account and key pages, https only',['https://auth.abuse.ch/','https://www.virustotal.com/gui/join-us','https://www.virustotal.com/gui/my-apikey'].every(u=>hrefs.includes(u))&&hrefs.every(u=>u.startsWith('https://')));
  await page.locator('#pbHandbuch .hb-kopf .hb-leiste-link').last().click();
  // ---------- open at the protection chapter from its card ----------
  await page.click('#schutz-anleitung');
  await page.waitForFunction(()=>document.querySelector('#pbHandbuch').open);
  const top=()=>page.evaluate(()=>{const box=document.querySelector('#pbHandbuch .hb-inhalt').getBoundingClientRect();return [...document.querySelectorAll('#pbHandbuch .hb-inhalt [id]')].find(e=>{const r=e.getBoundingClientRect();return r.bottom>box.top+4;})?.id;});
  ok('The guide link opens the manual at the protection chapter',await top()==='hb-virenschutz');
  // ---------- jump to a term and come back three ways ----------
  const word=page.locator('#hb-virenschutz a.hb-sprung',{hasText:'Zugangsschlüssel'}).first();
  await word.click();
  ok('Tapping a word jumps to its explanation',await page.evaluate(()=>{const r=document.querySelector('#hb-zugangsschluessel').getBoundingClientRect(),box=document.querySelector('#pbHandbuch .hb-inhalt').getBoundingClientRect();return r.top>=box.top-2&&r.top<box.top+80;}));
  ok('A visible "↩ zurück" appears',await page.locator('#pbHandbuch .hb-zurueck').isVisible());
  await page.locator('#pbHandbuch .hb-zurueck').click();
  ok('"↩ zurück" returns to the word',await word.evaluate(a=>{const r=a.getBoundingClientRect();return r.top>0&&r.bottom<innerHeight&&document.activeElement===a;}));
  await word.click();
  await page.locator('#hb-zugangsschluessel').click();
  ok('A second tap on the explained word returns as well',await word.evaluate(a=>document.activeElement===a));
  // Nested: term → another term inside it → Android Back twice → original place, manual still open.
  await word.click();
  await page.locator('#hb-zugangsschluessel + dd a.hb-sprung',{hasText:'Speicherort'}).click();
  ok('A word inside an explanation jumps on',await page.evaluate(()=>{const r=document.querySelector('#hb-speicherort-begriff').getBoundingClientRect(),box=document.querySelector('#pbHandbuch .hb-inhalt').getBoundingClientRect();return r.top>=box.top-2&&r.top<box.top+80;}));
  const back=()=>page.evaluate(()=>{const d=document.querySelector('#pbHandbuch');const e=new Event('cancel',{cancelable:true});if(d.dispatchEvent(e))d.close();});
  await back();await back();
  ok('Android Back steps back through both jumps before closing',await page.evaluate(()=>document.querySelector('#pbHandbuch').open)&&await word.evaluate(a=>document.activeElement===a));
  await back();
  ok('Then Android Back closes the manual',await page.evaluate(()=>!document.querySelector('#pbHandbuch').open));
  // ---------- provider links ----------
  await page.click('#schutz-anleitung');
  await page.evaluate(()=>document.querySelector('#pbHandbuch a.hb-extern').click());
  ok('A scripted click does not open the browser',opened.length===0);
  await page.locator('#pbHandbuch a.hb-extern',{hasText:'auth.abuse.ch'}).first().click();
  for(let i=0;i<20&&!opened.length;i++)await page.waitForTimeout(50);
  ok('A real tap opens abuse.ch in the browser',opened[0]==='https://auth.abuse.ch/');
  ok('The manual stays open after a provider link',await page.evaluate(()=>document.querySelector('#pbHandbuch').open));
  await page.locator('#pbHandbuch .hb-kopf .hb-leiste-link').last().click();
  await page.click('#schutz-get-vt-key');
  for(let i=0;i<20&&opened.length<2;i++)await page.waitForTimeout(50);
  ok('Card link "Schlüssel erstellen" opens the VirusTotal key page',opened[1]==='https://www.virustotal.com/gui/my-apikey');
  // ---------- languages and width ----------
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.click('#handbuchLink a');
  ok('Other languages: labels translated, German-only note shown',await page.locator('#pbHandbuch .hb-hinweis').textContent().then(t=>t.includes('German only'))&&await page.locator('#handbuchLink a').textContent()==='📖 User manual');
  ok('No sideways scrolling at 390 px',await page.evaluate(()=>{const b=document.querySelector('#pbHandbuch .hb-inhalt');return b.scrollWidth<=b.clientWidth+1;}));
  ok('No page errors',errors.length===0);
  console.log(`${count} manual checks passed (browser, Android plugins stubbed).`);
}finally{await browser?.close();}
