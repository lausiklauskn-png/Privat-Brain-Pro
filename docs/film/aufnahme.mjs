// Real app pictures for the Private Brain Pro film: the bundled www with example data (all invented).
// node aufnahme.mjs <www-dir> <out-dir>
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep,join} from 'node:path';
import {chromium} from '/home/user/Privat-Brain-Pro/node_modules/playwright-core/index.mjs';
const [root,out]=process.argv.slice(2).map(p=>resolve(p));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{const p=resolve(root,'.'+new URL(req.url,'http://l').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+sep))return res.writeHead(403).end();try{const d=await readFile(p);res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream'}).end(d);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM,args:['--no-sandbox']});
const W=+process.env.W||1440,H=+process.env.H||900;
const page=await browser.newPage({viewport:{width:W,height:H},deviceScaleFactor:1.5});
page.on('dialog',d=>d.dismiss());
await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
await page.addInitScript(()=>{
  const acc={id:'11111111-1111-4111-8111-111111111111',email:'jens@example.invalid',provider:'telekom'};
  const now=Date.now(),h=3600e3;
  const inbox=[
    ['Ihre Rechnung Oktober','Stadtwerke Musterstadt',1],['Termin bestätigt: Zahnarzt Dr. Weiß','Praxis Dr. Weiß',3],['Fotos vom Wochenende 📷','Anna',5],
    ['Ihr Paket ist unterwegs','Paketdienst',8],['Angebot Ferienwohnung Ostsee','Ferienhof Sonnenblick',20],['Protokoll Elternabend','Grundschule am Park',26],
    ['Versicherungsschein 2027','Hausrat Plus',30],['Einladung Grillfest','Familie Berger',50],['Newsletter Oktober','Gartencenter Grün',60]];
  window.Capacitor={isNativePlatform:()=>true,Plugins:{
    ProDevice:{async getInfo(){return{platform:'android',versionName:'1.0.0-preview.28',nativeMail:true};}},
    ProNetwork:{async getState(){return{offline:false};},async setOffline({offline}){return{offline};}},
    ProMail:{
      async accounts(){return{items:[acc]};},
      async folders(){return{items:[{path:'INBOX',name:'INBOX',specialUse:'\\Inbox',total:128,unread:3},{path:'Sent',name:'Sent',specialUse:'\\Sent',total:42},{path:'Drafts',name:'Drafts',specialUse:'\\Drafts',total:1},{path:'Spam',name:'Spam',specialUse:'\\Junk',total:2},{path:'Trash',name:'Papierkorb',specialUse:'\\Trash',total:6},{path:'Urlaub',name:'Urlaub',specialUse:'',total:14}]};},
      async messages(){return{validity:'1',total:128,next:null,items:inbox.map(([s,f,a],i)=>({uid:100-i,subject:s,from:f+' <post@example.invalid>',date:now-a*h,flags:i<3?[]:['\\Seen'],size:20000}))};},
      async message(){return{subject:'Termin bestätigt: Zahnarzt Dr. Weiß',from:'Praxis Dr. Weiß <post@example.invalid>',to:acc.email,messageId:'<t@example.invalid>',text:'Guten Tag,\n\nwir bestätigen Ihren Termin am Dienstag, 4. November, um 9:30 Uhr.\nBitte bringen Sie Ihre Versichertenkarte mit.\n\nFreundliche Grüße\nIhre Praxis Dr. Weiß',attachments:[]};},
      async action(){return{ok:true};},async actions(a){return{ok:true,done:a.uids.length,missing:0};},
      async saved(){return{items:[]};},async savedDraft(){return null;}
    }}};
});
await page.goto(url);
await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db);
await page.evaluate(async()=>{
  const day=864e5;let n=0;
  const add=async(name,path,extra={})=>{const toks=tokens(name+' '+(extra.snippet||'')+' '+(extra.mailBody||''));const r={hash:await sha256(new TextEncoder().encode(path).buffer),name,path,type:'',ext:name.split('.').pop(),date:Date.now()-(n++)*day*3,size:180000+n*9000,snippet:'',via:'demo',vector:buildVector(toks),tf:termFreq(toks),summary:'',category:'',dirId:null,nameTokens:tokens(name),dupes:[],tags:[],...extra};CATALOG.push(r);HASHSET.add(r.hash);await idbPut('catalog',r);return r;};
  const m=await add('Termin bestätigt: Zahnarzt Dr. Weiß','Mail/Praxis Dr. Weiß/Termin bestätigt',{mail:{from:'Praxis Dr. Weiß <post@example.invalid>',subject:'Termin bestätigt: Zahnarzt Dr. Weiß'},mailBody:'Termin Dienstag 9:30 Zahnarzt Kontrolle Versichertenkarte',snippet:'Wir bestätigen Ihren Termin am Dienstag um 9:30 Uhr.'});
  await add('Rechnung-Zahnarzt-2026-09.pdf','Mail-Anhang/Praxis Dr. Weiß/Rechnung-Zahnarzt-2026-09.pdf',{fromMail:m.hash,type:'application/pdf',snippet:'Rechnung Zahnreinigung und Kontrolle, Betrag 89,40 Euro',pruefung:{stand:'sauber'}});
  const o=await add('Angebot Ferienwohnung Ostsee','Mail/Ferienhof Sonnenblick/Angebot Ferienwohnung',{mail:{from:'Ferienhof Sonnenblick <info@example.invalid>',subject:'Angebot Ferienwohnung Ostsee'},mailBody:'Ferienwohnung Ostsee Meerblick Juli Urlaub',snippet:'Gerne bieten wir Ihnen die Wohnung mit Meerblick an.'});
  await add('Preisliste-Sommer.pdf','Mail-Anhang/Ferienhof Sonnenblick/Preisliste-Sommer.pdf',{fromMail:o.hash,type:'application/pdf',snippet:'Preise Sommer Ferienwohnung Ostsee'});
  await add('Strand-Binz.jpg','Fotos/Urlaub 2026/Strand-Binz.jpg',{type:'image/jpeg',snippet:'Strand Meer Urlaub Ostsee Sonne'});
  await add('Sonnenuntergang.jpg','Fotos/Urlaub 2026/Sonnenuntergang.jpg',{type:'image/jpeg',snippet:'Sonnenuntergang Meer Urlaub'});
  await add('Mietvertrag.pdf','Unterlagen/Wohnung/Mietvertrag.pdf',{type:'application/pdf',snippet:'Mietvertrag Wohnung Kaution Nebenkosten'});
  await add('Hausrat-Versicherungsschein.pdf','Unterlagen/Versicherung/Hausrat-Versicherungsschein.pdf',{type:'application/pdf',snippet:'Versicherungsschein Hausrat 2027'});
  await add('Einkaufsliste.txt','Notizen/Einkaufsliste.txt',{snippet:'Milch Brot Äpfel Kaffee'});
  await add('Rezept-Apfelkuchen.txt','Notizen/Rezept-Apfelkuchen.txt',{snippet:'Apfelkuchen Rezept Zimt Butter'});
  rebuildIndex();refreshAll();
});

// Every screen is taken twice: the full picture and a "skeleton" with all small parts hidden (cards, bars and
// panels stay). The film cuts the parts out of these two pictures and lets them fly into place.
const fs=await import('node:fs');
const parts={};
const shot=async name=>{
  await page.mouse.move(2,H-2);await page.waitForTimeout(900);
  const pre=(process.env.PRE||'');
  await page.screenshot({path:join(out,pre+name+'.png')});
  const info=await page.evaluate(()=>{
    const vw=innerWidth,vh=innerHeight,leafTags=new Set(['BUTTON','INPUT','SELECT','TEXTAREA','IMG','SVG','CANVAS','H1','H2','H3','H4','P','LABEL','A','STRONG','B','SMALL','CODE','LI','SUMMARY','TD','TH']);
    const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>6&&r.height>6&&r.bottom>0&&r.right>0&&r.top<vh&&r.left<vw&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05;};
    const R=e=>{const r=e.getBoundingClientRect();return{x:Math.max(0,r.left),y:Math.max(0,r.top),w:Math.min(vw,r.right)-Math.max(0,r.left),h:Math.min(vh,r.bottom)-Math.max(0,r.top)};};
    const all=[...document.querySelectorAll('body *')].filter(vis);
    const ownText=e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    const leaves=[],chosen=new Set();
    for(const e of all){
      if(e.closest('dialog:not([open])'))continue;
      let a=e.parentElement,inside=false;while(a){if(chosen.has(a)){inside=true;break;}a=a.parentElement;}
      if(inside)continue;
      const isLeaf=leafTags.has(e.tagName.toUpperCase())||(ownText(e)&&e.getBoundingClientRect().height<80)||e.classList.contains('chip')||e.classList.contains('pill');
      if(isLeaf){const r=R(e);if(r.w*r.h>80&&r.w<vw*0.98){chosen.add(e);leaves.push({...r,tag:e.tagName.toLowerCase(),text:(e.innerText||e.value||e.placeholder||'').trim().slice(0,40)});}}
    }
    const containers=[];
    for(const e of all){
      if(chosen.has(e))continue;
      let a=e.parentElement,inside=false;while(a){if(chosen.has(a)){inside=true;break;}a=a.parentElement;}
      if(inside)continue;
      const s=getComputedStyle(e),bg=s.backgroundColor,hasBg=bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent'||s.backgroundImage!=='none';
      const hasBorder=parseFloat(s.borderTopWidth)+parseFloat(s.borderLeftWidth)>0||s.boxShadow!=='none';
      const r=R(e);
      if((hasBg||hasBorder)&&r.w>30&&r.h>16)containers.push({...r,area:r.w*r.h});
    }
    containers.sort((a,b)=>b.area-a.area);
    return{vw,vh,leaves:leaves.slice(0,160),containers:containers.slice(0,70)};
  });
  // skeleton: hide every leaf
  await page.evaluate(()=>{const st=document.createElement('style');st.id='skel';st.textContent='button,input,select,textarea,img,svg,canvas,h1,h2,h3,h4,p,label,a,strong,b,small,code,li,summary,td,th,.chip,.pill{visibility:hidden!important}';document.head.append(st);
    for(const e of document.querySelectorAll('body *'))if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))e.style.color='transparent';});
  await page.screenshot({path:join(out,pre+name+'-skelett.png')});
  await page.evaluate(()=>{document.getElementById('skel')?.remove();for(const e of document.querySelectorAll('body *'))if(e.style.color==='transparent')e.style.color='';});
  parts[pre+name]=info;fs.writeFileSync(join(out,(pre||'')+'teile.json'),JSON.stringify(parts));
  console.log('✓',name,info.leaves.length,'Teile',info.containers.length,'Flächen');
};
// 1 search
await page.locator('[data-tab="search"]').click();
await page.fill('#q','Rechnung vom Zahnarzt');await page.press('#q','Enter');
await shot('suche');
// 2 explorer tree
await page.locator('[data-tab="explorer"]').click();
await shot('explorer');
// 3 mail
await page.locator('[data-tab="mail"]').click();
await page.locator('#mailWorkspace [data-live-text="connect"]').click().catch(()=>{});
await page.waitForTimeout(1200);
await shot('postfach');
await page.locator('#mailWorkspace [data-live-uid="99"]').click().catch(()=>{});
await shot('mail-offen');
// 4 intake
await page.locator('[data-tab="intake"]').click();
await shot('einlesen');
// 5 settings
await page.locator('[data-tab="settings"]').click();
await shot('einstellungen');
await browser.close();server.close();
