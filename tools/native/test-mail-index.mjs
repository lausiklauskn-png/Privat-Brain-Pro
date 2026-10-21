// "Alle Konten": fetch all accounts, overwrite instead of duplicating, bundle by sender.
// Simulated native transport only; no real provider login and no network.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
// PB_CAPTURE_DESIGN=1 stores phone pictures for the preview page; never part of CI.
async function capture(page,name){if(process.env.PB_CAPTURE_DESIGN!=='1')return;const size=page.viewportSize();await mkdir('docs/design/alle-konten',{recursive:true});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.screenshot({path:`docs/design/alle-konten/${name}.png`});await page.setViewportSize(size);}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.context().route('**/*',r=>{if(r.request().url().startsWith(url))return r.continue();remote.push(r.request().url());return r.abort();});
  await page.addInitScript(()=>{
    const day=864e5,now=Date.now();
    window.mailCalls=[];window.offline=false;
    const A={id:'11111111-1111-4111-8111-111111111111',email:'klaus@example.invalid',provider:'telekom'};
    const B={id:'22222222-2222-4222-8222-222222222222',email:'zweit@example.invalid',provider:'gmail'};
    window.mailAccounts=[A,B];
    const m=(uid,from,subject,ageDays,extra={})=>({uid,messageId:extra.messageId??`<m${uid}@example.invalid>`,from,subject,date:now-ageDays*day,size:2000,seen:false,flagged:false,list:Boolean(extra.list),bulk:false,text:extra.text??`Text ${subject}`,html:extra.html||''});
    // Account A: inbox spans two pages; one Aldi newsletter is also in account B (same Message-ID).
    const inboxA=[];
    for(let i=0;i<120;i++)inboxA.push(m(1000-i,'Kollege <kollege@example.invalid>','Notiz '+i,10+i*2));
    inboxA.splice(0,0,
      m(2001,'ALDI SÜD <news@aldi.invalid>','Angebote KW 43',1,{list:true,messageId:'<aldi43@aldi.invalid>',text:'Gültig bis 26.10.'}),
      m(2000,'ALDI SÜD <news@aldi.invalid>','Angebote KW 42',8,{list:true,messageId:'<aldi42@aldi.invalid>'}),
      m(1999,'Stadtwerke <rechnung@stadtwerke.invalid>','Ihre Rechnung Oktober',3,{text:'Rechnungsbetrag 54,20 EUR'}),
      m(1998,'Shop <info@shop.invalid>','Bestellung',5,{messageId:'',text:'Version eins'}),
      m(1997,'Shop <info@shop.invalid>','Bestellung',5.2,{messageId:'',text:'Version zwei, anders'}),
      m(1996,'Verein <verein@example.invalid>','Nur HTML',6,{text:'',html:'<p>Treffen <b>Samstag</b></p><script>window.pwned=1</script><img src="https://tracker.invalid/p.png">'}),
      m(1995,'Altbekannt <alt@example.invalid>','Schon katalogisiert',7,{messageId:''}));
    const archiveA=[m(50,'Y-Food <hello@yfood.invalid>','Neue Sorte',20,{list:true})];
    const inboxB=[m(3001,'Aldi Süd <news@aldi.invalid>','Angebote KW 43',1,{list:true,messageId:'<aldi43@aldi.invalid>',text:'Gültig bis 26.10.'}),m(3000,'Mutter <mama@example.invalid>','Sonntag',2)];
    window.server={[A.id]:{INBOX:inboxA,Archiv:archiveA,Papierkorb:[m(9,'x@y.invalid','weg',1)],Spam:[m(8,'x@y.invalid','spam',1)],Gesendet:[m(7,'klaus@example.invalid','raus',1)],Entwürfe:[m(6,'klaus@example.invalid','entwurf',1)]},
      [B.id]:{INBOX:inboxB,'[Gmail]/Alle Nachrichten':[...inboxB],'[Gmail]/Sent Mail':[m(5,'zweit@example.invalid','raus',1)]}};
    const folders={[A.id]:[{path:'INBOX',name:'INBOX',specialUse:'',collection:false},{path:'Archiv',name:'Archiv',specialUse:'',collection:false},{path:'Papierkorb',name:'Papierkorb',specialUse:'',collection:false},{path:'Spam',name:'Spam',specialUse:'',collection:false},{path:'Gesendet',name:'Gesendet',specialUse:'',collection:false},{path:'Entwürfe',name:'Entwürfe',specialUse:'',collection:false}],
      [B.id]:[{path:'INBOX',name:'INBOX',specialUse:'',collection:false},{path:'[Gmail]/Alle Nachrichten',name:'Alle Nachrichten',specialUse:'',collection:true},{path:'[Gmail]/Sent Mail',name:'Sent Mail',specialUse:'\\Sent',collection:false}]};
    const log=(method,args)=>window.mailCalls.push({method,args:structuredClone(args)});
    const offline=()=>{if(window.offline)throw{code:'APP_OFFLINE'};};
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.20-debug',nativeMail:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);return{items:window.mailAccounts};},
        async folders(args){log('folders',args);offline();return{items:folders[args.account]};},
        async messages(args){log('messages',args);const list=window.server[args.account]?.[args.folder]||[];return{validity:'7',total:list.length,items:list.slice(0,50).map(x=>({uid:x.uid,subject:x.subject,from:x.from,date:new Date(x.date).toString(),flags:[],size:x.size})),next:null};},
        async message(args){log('message',args);const x=window.server[args.account][args.folder].find(y=>y.uid===args.uid);return{subject:x.subject,from:x.from,to:'klaus@example.invalid',messageId:x.messageId,text:x.text,html:'',raw:'Subject: '+x.subject+'\r\n\r\n'+x.text,attachments:[]};},
        async index(args){log('index',args);offline();
          const list=(window.server[args.account]?.[args.folder]||[]).filter(x=>x.date>=args.since&&(!args.before||x.uid<args.before)).sort((a,b)=>b.uid-a.uid);
          const page=list.slice(0,100);
          return{validity:'7',items:page.map(({text,html,...head})=>head),next:list.length>100?page.at(-1).uid:null};},
        async indexText(args){log('indexText',args);offline();
          if(args.uids.length>10)throw{code:'INVALID_INPUT'};
          return{items:args.uids.map(uid=>{const x=window.server[args.account][args.folder].find(y=>y.uid===uid);return{uid,text:x.text,html:x.html,attachments:false};})};},
        async action(args){log('action',args);return{ok:true};},
        async saved(args){log('saved',args);return{items:[]};},
        async send(args){log('send',args);throw{code:'INVALID_INPUT'};},
        async saveDraft(args){log('saveDraft',args);return{ok:true};},
        async removeAccount(args){log('removeAccount',args);return{ok:true};}
      }
    }};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBMailIndex&&typeof db!=='undefined'&&db);
  // An older entry from the former "Katalogisieren" button: same mail without identifier.
  await page.evaluate(async()=>{const x=window.server['11111111-1111-4111-8111-111111111111'].INBOX.find(y=>y.uid===1995);
    await PBMail.addEntry({subject:x.subject,from:x.from,to:'klaus@example.invalid',date:new Date(x.date).toUTCString(),dateMs:x.date,body:x.text},null);rebuildIndex();refreshAll();});
  const before=await page.evaluate(()=>CATALOG.length);
  await page.locator('[data-tab="mail"]').click();
  const mail=page.locator('#mailWorkspace'), panel=mail.locator('#pb-mail-all');
  await mail.locator('[data-live-text=connect]').click();
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hidden&&document.querySelector('.live-mail [data-mail-all=open]'));
  ok('"Alle Konten" is the first entry of the folder bar',await mail.locator('.live-mail .mail-folders > :first-child').getAttribute('data-mail-all')==='open'&&(await mail.locator('[data-mail-all=open]').textContent()).startsWith('👥 Alle Konten'));
  await mail.locator('[data-mail-all=open]').click();
  await capture(page,'1-erster-abruf');
  ok('First view explains reading only, 12 months and no attachments',(await panel.textContent()).includes('12 Monate')&&(await panel.textContent()).includes('Anhänge werden nicht geladen'));
  ok('Other mailbox parts are hidden while the overview is open',await mail.locator('.live-mail').isHidden()&&await mail.locator('.mail-account-bar').isHidden());
  await panel.getByRole('button',{name:'📥 Alle Konten abrufen und einordnen'}).click();
  await page.waitForFunction(()=>!PBMailIndex.running()&&localStorage.getItem('pb_mail_index_last'));
  const calls=await page.evaluate(()=>window.mailCalls);
  const indexed=calls.filter(c=>c.method==='index');
  ok('Both accounts are fetched',new Set(indexed.map(c=>c.args.account)).size===2);
  ok('Inbox and own folders are read; trash, spam, sent, drafts and Gmail collections are not',
    indexed.every(c=>['INBOX','Archiv'].includes(c.args.folder))&&indexed.some(c=>c.args.folder==='Archiv'));
  ok('Second page of a large inbox is requested below the last UID',indexed.some(c=>c.args.folder==='INBOX'&&c.args.before>0));
  ok('Fetch window is the last 12 months',Math.abs(indexed[0].args.since-(Date.now()-365*864e5))<60000);
  ok('No full message download, no server action, nothing sent',!calls.some(c=>['message','action','send','saveDraft'].includes(c.method)));
  ok('Text requests stay in small batches',calls.filter(c=>c.method==='indexText').every(c=>c.args.uids.length<=10));
  const stats=await page.evaluate(()=>{const mails=CATALOG.filter(r=>r.mailIndex);const aldi=mails.filter(r=>r.mailMessageId==='<aldi43@aldi.invalid>');
    return{total:mails.length,aldi:aldi.length,places:aldi[0]?.mailRemotes.length,html:mails.find(r=>r.name==='Nur HTML')?.mailBody,legacy:CATALOG.filter(r=>r.name==='Schon katalogisiert').length,adopted:CATALOG.find(r=>r.name==='Schon katalogisiert')?.mailRemotes?.length,pwned:window.pwned||0};});
  ok('Same mail in two accounts is one entry that knows both places',stats.aldi===1&&stats.places===2);
  ok('Older catalog entry is adopted instead of copied',stats.legacy===1&&stats.adopted===1);
  ok('HTML-only mail becomes readable text without running its script',stats.html.includes('Treffen Samstag')&&!stats.html.includes('<')&&!stats.html.includes('pwned')&&stats.pwned===0);
  ok('No remote images or other network requests',remote.length===0);
  const total=stats.total;
  ok('Catalog grew by the indexed mails only',await page.evaluate(()=>CATALOG.length)===before+total-1);
  // Sender bundles
  ok('Sender view is the default and shows one Aldi bundle with both mails',await panel.locator('[data-mail-sender="news@aldi.invalid"]').count()===1&&(await panel.locator('[data-mail-sender="news@aldi.invalid"]').textContent()).includes('2 Mails'));
  await capture(page,'2-nach-absender');
  const senders=await panel.locator('[data-mail-sender]').evaluateAll(n=>n.map(x=>x.dataset.mailSender));
  ok('Bundles are sorted by their newest mail',senders[0]==='news@aldi.invalid');
  await panel.locator('[data-mail-sender="news@aldi.invalid"]').click();
  const subjects=async()=>panel.locator('[data-mail-all-id] .mail-subject').allTextContents();
  await capture(page,'3-buendel-aldi');
  ok('Inside a bundle the newest mail is on top',JSON.stringify(await subjects())===JSON.stringify(['Angebote KW 43','Angebote KW 42']));
  await panel.locator('[data-mail-all=order]').click();
  ok('↕ turns the order around',JSON.stringify(await subjects())===JSON.stringify(['Angebote KW 42','Angebote KW 43']));
  await panel.locator('[data-mail-all=order]').click();
  await panel.locator('[data-mail-all-id]').first().click();
  ok('Reader shows text, both accounts and the newsletter mark',(await panel.textContent()).includes('Gültig bis 26.10.')&&(await panel.textContent()).includes('zweit@example.invalid')&&(await panel.textContent()).includes('📰'));
  // Search over all accounts
  await panel.getByRole('button',{name:'← Zurück',exact:true}).click();
  await panel.locator('[data-mail-all=search]').fill('gultig');
  await capture(page,'4-suche');
  ok('Word search finds across accounts and ignores umlauts',await panel.locator('[data-mail-all-id]').count()===1&&(await panel.textContent()).includes('1 Treffer'));
  await panel.locator('[data-mail-all=search]').fill('rechnungsbetrag oktober');
  ok('All search words must occur (body and subject)',await panel.locator('[data-mail-all-id]').count()===1);
  ok('Search field keeps focus while typing',await page.evaluate(()=>document.activeElement?.dataset?.mailAll==='search'));
  await panel.locator('[data-mail-all=search]').fill('');
  // Re-run overwrites; user marks survive; server changes are taken over.
  await page.evaluate(async()=>{const r=CATALOG.find(x=>x.mailMessageId==='<aldi42@aldi.invalid>');r.mailStar=true;r.tags=['behalten'];await idbPut('catalog',r);
    const s=window.server['11111111-1111-4111-8111-111111111111'].INBOX.find(y=>y.uid===2000);s.flagged=true;s.seen=true;
    localStorage.removeItem('pb_mail_index_state');});
  await page.evaluate(()=>PBMailIndex.sync());
  const again=await page.evaluate(()=>{const r=CATALOG.find(x=>x.mailMessageId==='<aldi42@aldi.invalid>');return{total:CATALOG.filter(x=>x.mailIndex).length,star:r.mailStar,tags:r.tags,flagged:r.mailFlagged,seen:r.mailSeen};});
  ok('Fetching again creates no second version',again.total===total);
  ok('Own marks stay, server flags are overwritten',again.star===true&&again.tags[0]==='behalten'&&again.flagged&&again.seen);
  ok('A complete folder only needs its newest page next time',await page.evaluate(async()=>{const n=window.mailCalls.length;await PBMailIndex.sync();return window.mailCalls.slice(n).filter(c=>c.method==='index'&&c.args.before>0).length===0;}));
  // Uncertain twins wait in "Doppelte"
  await page.locator('[data-tab="dupes"]').click();
  const dupes=page.locator('#pb-mail-dupes');
  await page.evaluate(()=>document.getElementById('pb-mail-dupes').scrollIntoView());await capture(page,'5-doppelte');
  ok('Twin without identifier and different text waits in "Doppelte"',await dupes.isVisible()&&await dupes.locator('[data-mail-dupe]').count()===1&&(await dupes.textContent()).includes('Nichts wurde überschrieben'));
  await dupes.getByRole('button',{name:'Gleich – zusammenlegen'}).click();
  await page.waitForFunction(()=>CATALOG.filter(r=>r.mailIndex&&r.name==='Bestellung').length===1,null,{timeout:5000}).catch(()=>{});
  ok('"Gleich – zusammenlegen" leaves one entry',await page.evaluate(()=>CATALOG.filter(r=>r.mailIndex&&r.name==='Bestellung').length)===1&&await dupes.isHidden());
  // Local mailbox stays as it was
  ok('Local mailbox does not list the overview entries',await page.evaluate(()=>!document.querySelector('.mail-app:not(.live-mail) [data-mail-id]')||[...document.querySelectorAll('.mail-app:not(.live-mail) [data-mail-id]')].every(b=>!CATALOG.find(r=>r.hash===b.dataset.mailId)?.mailIndex||CATALOG.find(r=>r.hash===b.dataset.mailId)?.mailLegacy)));
  // Offline: nothing breaks, the reason is shown
  await page.locator('[data-tab="mail"]').click();
  await page.evaluate(()=>{window.offline=true;});
  await panel.getByRole('button',{name:'📥 Jetzt aktualisieren'}).click();
  await page.waitForFunction(()=>!PBMailIndex.running());
  ok('App internet off: fetching waits and says why',(await panel.locator('[role=status]').textContent()).includes('App-Internet ist aus'));
  await page.evaluate(()=>{window.offline=false;});
  // Open at the provider uses the right account, folder and UID
  await panel.locator('[data-mail-sender="mama@example.invalid"]').click();
  await panel.locator('[data-mail-all-id]').first().click();
  await panel.getByRole('button',{name:'Beim Anbieter öffnen'}).click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='message'));
  const opened=await page.evaluate(()=>window.mailCalls.find(c=>c.method==='message').args);
  ok('"Beim Anbieter öffnen" opens exactly this mail in its account',opened.account==='22222222-2222-4222-8222-222222222222'&&opened.folder==='INBOX'&&opened.uid===3000&&await panel.isHidden());
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  // Languages and phone width
  await mail.locator('.live-mail [data-mail-all=open]').click();
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('#pb-mail-all h2')?.textContent==='All accounts');
  ok('Switches to English without reload',(await panel.textContent()).includes('By sender'));
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.setViewportSize({width:360,height:740});
  ok('Fits a phone screen without sideways scrolling',await page.evaluate(()=>{const p=document.querySelector('#pb-mail-all');return p.scrollWidth<=p.clientWidth+1&&document.documentElement.scrollWidth<=window.innerWidth+1;}));
  const small=await panel.locator('.mail-all-switch .mail-button').evaluateAll(n=>n.map(b=>b.getBoundingClientRect().height));
  ok('Buttons stay large enough for one-handed use',small.every(h=>h>=40));
  await panel.getByRole('button',{name:'← Zurück zum Postfach'}).click();
  ok('"Zurück zum Postfach" returns to the normal mailbox',await panel.isHidden()&&await mail.locator('.live-mail').isVisible());
  ok('No runtime errors',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} all-accounts checks passed (simulated native transport; no real provider login).`);
