// Newsletter unsubscribe from "🧹 Aufräumen" (Klaus 2026-10-21): the hidden field is read, one-click
// works directly, a mail goes out only after confirming, a page opens in the browser, spam is never
// answered, and with consent senders marked "Ist Werbung" are unsubscribed by themselves.
// Simulated native transport only; no real provider and no network.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  let data;try{data=await readFile(path);}catch{return res.writeHead(404).end();}
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0,answer=true;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],dialogs=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>{dialogs.push(d.message());answer===false?d.dismiss():d.accept();});
  await page.context().route('**/*',r=>{if(r.request().url().startsWith(url))return r.continue();remote.push(r.request().url());return r.abort();});
  await page.addInitScript(()=>{
    const day=864e5,now=Date.now();
    window.mailCalls=[];window.unsubStatus=200;
    const A={id:'11111111-1111-4111-8111-111111111111',email:'klaus@example.invalid',provider:'telekom'};
    const m=(uid,from,subject,age,extra={})=>({uid,messageId:`<u${uid}@example.invalid>`,from,subject,date:now-age*day,size:2000,seen:false,flagged:false,list:true,bulk:false,
      unsubscribe:extra.unsubscribe||'',oneClick:Boolean(extra.oneClick),text:extra.text??'Angebote der Woche',html:extra.html||''});
    window.server={INBOX:[
      m(10,'ALDI SÜD <news@aldi.invalid>','Angebote',1,{unsubscribe:'<https://news.aldi.invalid/u?id=1>, <mailto:u@aldi.invalid>',oneClick:true}),
      m(11,'ALDI SÜD <news@aldi.invalid>','Angebote 2',3,{unsubscribe:'<https://news.aldi.invalid/u?id=2>',oneClick:true}),
      m(20,'Y-Food <hello@yfood.invalid>','Neue Sorte',2,{unsubscribe:'<mailto:leave@yfood.invalid?subject=Abmelden%20bitte>'}),
      m(30,'Modeshop <info@mode.invalid>','Herbst',2,{html:'<p>Neu im Shop</p><p>Keine Mails mehr? <a href="https://mode.invalid/newsletter/x9">Newsletter abbestellen</a></p>',text:''}),
      m(40,'PayPal <service@paypa1-konto.invalid>','Konto prüfen',1,{unsubscribe:'<https://paypa1-konto.invalid/u>',oneClick:true}),
      m(50,'Kaffeeröster <hallo@kaffee.invalid>','Neue Bohnen',2,{unsubscribe:'<https://kaffee.invalid/u?k=5>',oneClick:true}),
      m(60,'Verein <verein@example.invalid>','Treffen',2,{list:false})
    ]};
    const log=(method,args)=>window.mailCalls.push({method,args:structuredClone(args)});
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.20-debug',nativeMail:true};}},
      ProLinks:{async open(args){log('openLink',args);return{ok:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);return{items:[A]};},
        async folders(args){log('folders',args);return{items:[{path:'INBOX',name:'INBOX',specialUse:'',collection:false},{path:'Papierkorb',name:'Papierkorb',specialUse:'\\Trash',collection:false}]};},
        async messages(){return{validity:'7',total:0,items:[],next:null};},
        async index(args){log('index',args);const list=(window.server[args.folder]||[]).filter(x=>x.date>=args.since).sort((a,b)=>b.uid-a.uid);
          return{validity:'7',items:list.map(({text,html,...head})=>head),next:null};},
        async indexText(args){log('indexText',args);return{items:args.uids.map(uid=>{const x=window.server[args.folder].find(y=>y.uid===uid);return{uid,text:x.text,html:x.html,attachments:false};})};},
        async unsubscribe(args){log('unsubscribe',args);return{ok:window.unsubStatus<400,status:window.unsubStatus};},
        async send(args){log('send',args);return{ok:true,status:'sent'};},
        async saved(){return{items:[]};},
        async action(args){log('action',args);return{ok:true};},
        async locate(){return{validity:'7',uid:null};}
      }
    }};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBMailIndex&&window.PBUnsub&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  const mail=page.locator('#mailWorkspace'), panel=mail.locator('#pb-mail-all');
  await mail.locator('[data-live-text=connect]').click();
  await page.waitForFunction(()=>document.querySelector('.live-mail [data-mail-all=open]'));
  await mail.locator('[data-mail-all=open]').click();
  await panel.getByRole('button',{name:'📥 Alle Konten abrufen und einordnen'}).click();
  await page.waitForFunction(()=>!PBMailIndex.running()&&localStorage.getItem('pb_mail_index_last'));
  const calls=()=>page.evaluate(()=>window.mailCalls);
  ok('Fetching never unsubscribes, sends or opens anything by itself',!(await calls()).some(c=>['unsubscribe','send','openLink'].includes(c.method)));
  const info=await page.evaluate(()=>Object.fromEntries(CATALOG.filter(r=>r.mailIndex).map(r=>[r.name,r.mailUnsub||null])));
  ok('The hidden field is kept: https + mailto + one-click consent',info['Angebote'].https==='https://news.aldi.invalid/u?id=1'&&info['Angebote'].mailto==='mailto:u@aldi.invalid'&&info['Angebote'].oneClick===true);
  ok('A mailto-only field is kept without one-click',info['Neue Sorte'].mailto.startsWith('mailto:leave@yfood.invalid')&&!info['Neue Sorte'].oneClick);
  ok('Without hidden field the visible "abbestellen" link is found',info['Herbst'].page==='https://mode.invalid/newsletter/x9'&&!info['Herbst'].https);
  ok('A normal mail gets no unsubscribe way',info['Treffen']===null);
  await panel.locator('[data-mail-all=clean]').click();
  const row=a=>panel.locator(`[data-mail-unsub="${a}"]`);
  ok('"📭 Newsletter abmelden" lists the senders with their way',(await panel.textContent()).includes('📭 Newsletter abmelden')&&(await row('news@aldi.invalid').textContent()).includes('⚡ direkt')&&(await row('leave@yfood.invalid').count()===0)&&(await row('hello@yfood.invalid').textContent()).includes('✉ per Mail')&&(await row('info@mode.invalid').textContent()).includes('🌐 Webseite'));
  ok('Suspected fraud (PayPal look-alike) gets no unsubscribe button',(await row('service@paypa1-konto.invalid').textContent()).includes('Verdacht')&&await row('service@paypa1-konto.invalid').locator('button').count()===0);
  // ⚡ one-click
  await row('news@aldi.invalid').getByRole('button',{name:'Abmelden'}).click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='unsubscribe'));
  let c=(await calls()).filter(x=>x.method==='unsubscribe');
  ok('⚡ sends exactly one one-click request to the newest mail\'s address',c.length===1&&c[0].args.url==='https://news.aldi.invalid/u?id=1');
  await page.waitForFunction(()=>document.querySelector('[data-mail-unsub="news@aldi.invalid"]')?.textContent.includes('abgemeldet am'));
  ok('… and the sender shows "abgemeldet am …" on all its mails',await page.evaluate(()=>CATALOG.filter(r=>r.mail?.from?.includes('news@aldi')).every(r=>r.mailUnsubbed?.way==='oneclick')));
  ok('After the first success the app asks once about doing it by itself',await panel.locator('[data-mail-unsub-ask]').count()===1);
  // ✉ mail: cancel first, then confirm
  answer=false;
  dialogs.length=0;
  await row('hello@yfood.invalid').getByRole('button',{name:'Abmelden'}).click();
  await page.waitForTimeout(200);
  ok('✉ asks first and names the address',dialogs.some(d=>d.includes('leave@yfood.invalid')));
  ok('Cancelling sends nothing',!(await calls()).some(x=>x.method==='send'));
  answer=true;
  await row('hello@yfood.invalid').getByRole('button',{name:'Abmelden'}).click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='send'));
  const sent=(await calls()).find(x=>x.method==='send');
  ok('Confirmed: one unsubscribe mail with the requested subject from the right account',sent.args.account==='11111111-1111-4111-8111-111111111111'&&sent.args.draft.to==='leave@yfood.invalid'&&sent.args.draft.subject==='Abmelden bitte'&&/^[0-9a-f-]{36}$/.test(sent.args.draft.submission));
  // 🌐 page
  await row('info@mode.invalid').getByRole('button',{name:'Abmelden'}).click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='openLink'));
  ok('🌐 opens the unsubscribe page in the browser',(await calls()).find(x=>x.method==='openLink').args.url==='https://mode.invalid/newsletter/x9');
  await page.waitForFunction(()=>document.querySelector('[data-mail-unsub="info@mode.invalid"]')?.textContent.includes('Seite geöffnet'));
  await row('info@mode.invalid').getByRole('button',{name:'✓ Erledigt'}).click();
  // Saving runs through IndexedDB before the row is drawn again: wait for the drawn result, not a fixed time.
  await page.waitForFunction(()=>document.querySelector('[data-mail-unsub="info@mode.invalid"]')?.textContent.includes('abgemeldet am'),null,{timeout:5000}).catch(()=>{});
  ok('"✓ Erledigt" marks it unsubscribed',(await row('info@mode.invalid').textContent()).includes('abgemeldet am')&&await page.evaluate(()=>CATALOG.filter(r=>r.mail?.from?.includes('info@mode')).every(r=>r.mailUnsubbed&&!r.mailUnsubbed.pending)));
  // automatic for senders marked "Ist Werbung"
  await panel.locator('[data-mail-unsub-ask]').getByRole('button',{name:'Ja, selbst abmelden'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-mail-unsub-auto=on]'),null,{timeout:5000}).catch(()=>{});
  ok('Consent is remembered and can be turned off',await page.evaluate(()=>localStorage.getItem('pb_mail_unsub_auto')==='true')&&await panel.locator('[data-mail-unsub-auto=on]').count()===1);
  const before=(await calls()).filter(x=>x.method==='unsubscribe').length;
  await page.evaluate(()=>PBMailIndex.sync(true));
  ok('Unmarked senders are not unsubscribed by themselves',(await calls()).filter(x=>x.method==='unsubscribe').length===before);
  await page.evaluate(async()=>{for(const r of CATALOG.filter(x=>/kaffee|paypa1/.test(x.mail?.from||''))){r.mailSenderMark='ad';await idbPut('catalog',r);}});
  await page.evaluate(()=>PBMailIndex.sync(true));
  const autoCalls=(await calls()).filter(x=>x.method==='unsubscribe').slice(before);
  ok('Marked "Ist Werbung": unsubscribed by itself after the next fetch',autoCalls.length===1&&autoCalls[0].args.url==='https://kaffee.invalid/u?k=5');
  ok('… but never a suspected fraud sender, even when marked',!autoCalls.some(x=>x.args.url.includes('paypa1')));
  // a sender that ignores it
  await page.evaluate(async()=>{const r=CATALOG.find(x=>x.name==='Angebote');for(const x of CATALOG.filter(y=>y.mail?.from?.includes('news@aldi'))){x.mailUnsubbed={at:Date.now()-20*864e5,way:'oneclick'};await idbPut('catalog',x);}});
  await page.evaluate(()=>PBMailIndex.sync(true));
  await panel.locator('[data-mail-all=clean]').click();
  await page.waitForFunction(()=>document.querySelector('[data-mail-unsub="news@aldi.invalid"]')?.textContent.includes('kommt weiter'),null,{timeout:5000}).catch(()=>{});
  ok('Mails still arriving 14 days after unsubscribing are named, with "Nochmals abmelden"',(await row('news@aldi.invalid').textContent()).includes('kommt weiter')&&await row('news@aldi.invalid').getByRole('button',{name:'Nochmals abmelden'}).count()===1);
  // refused by sender
  await page.evaluate(()=>{window.unsubStatus=500;});
  await row('news@aldi.invalid').getByRole('button',{name:'Nochmals abmelden'}).click();
  await page.waitForFunction(()=>window.mailCalls.filter(c=>c.method==='unsubscribe').length>=3);
  await page.waitForTimeout(150);
  ok('A refused one-click is not counted as done',(await row('news@aldi.invalid').textContent()).includes('kommt weiter'));
  // reader button
  await page.evaluate(()=>{window.unsubStatus=200;});
  ok('No request ever left the app except the simulated bridge',remote.length===0);
  ok('No runtime errors',errors.length===0||console.log(errors));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} unsubscribe checks passed (simulated native transport; no real provider).`);
