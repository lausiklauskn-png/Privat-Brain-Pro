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
    const m=(uid,from,subject,ageDays,extra={})=>({uid,messageId:extra.messageId??`<m${uid}@example.invalid>`,from,subject,date:now-ageDays*day,size:2000,seen:false,flagged:Boolean(extra.flagged),list:Boolean(extra.list),bulk:false,text:extra.text??`Text ${subject}`,html:extra.html||''});
    const d=n=>{const x=new Date(now+n*day);return x.getDate()+'.'+(x.getMonth()+1)+'.'+x.getFullYear();};
    window.dateIn=d;window.m=m;
    // Account A: inbox spans two pages; one Aldi newsletter is also in account B (same Message-ID).
    const inboxA=[];
    for(let i=0;i<120;i++)inboxA.push(m(1000-i,'Kollege <kollege@example.invalid>','Notiz '+i,10+i*2));
    inboxA.splice(0,0,
      m(2001,'ALDI SÜD <news@aldi.invalid>','Angebote neu',1,{list:true,messageId:'<aldi43@aldi.invalid>',text:'Gültig bis '+d(5)}),
      m(2000,'ALDI SÜD <news@aldi.invalid>','Angebote alt',8,{list:true,messageId:'<aldi42@aldi.invalid>',text:'Angebote vom '+d(-10)+' bis '+d(-3)}),
      m(1994,'Rabattshop <deals@rabatt.invalid>','Mit Stern',4,{list:true,flagged:true,text:'nur bis '+d(-3)}),
      m(1999,'Stadtwerke <rechnung@stadtwerke.invalid>','Ihre Rechnung Oktober',3,{text:'Rechnungsbetrag 54,20 EUR'}),
      m(1998,'Shop <info@shop.invalid>','Bestellung',5,{messageId:'',text:'Version eins'}),
      m(1997,'Shop <info@shop.invalid>','Bestellung',5.2,{messageId:'',text:'Version zwei, anders'}),
      m(1996,'Verein <verein@example.invalid>','Nur HTML',6,{text:'',html:'<p>Treffen <b>Samstag</b></p><script>window.pwned=1</script><img src="https://tracker.invalid/p.png">'}),
      m(1995,'Altbekannt <alt@example.invalid>','Schon katalogisiert',7,{messageId:''}));
    const archiveA=[m(50,'Y-Food <hello@yfood.invalid>','Neue Sorte',20,{list:true})];
    const inboxB=[m(3001,'Aldi Süd <news@aldi.invalid>','Angebote neu',1,{list:true,messageId:'<aldi43@aldi.invalid>',text:'Gültig bis '+d(5)}),m(3000,'Mutter <mama@example.invalid>','Sonntag',2)];
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
        async action(args){log('action',args);
          if(args.action==='move'){if(window.noMove)throw{code:'MOVE_UNSUPPORTED'};const from=window.server[args.account][args.folder],i=from.findIndex(x=>x.uid===args.uid);if(i<0)throw{code:'MESSAGE_MISSING'};
            const [x]=from.splice(i,1),to=(window.server[args.account][args.target]??=[]);to.push({...x,uid:Math.max(0,...to.map(y=>y.uid))+5000});}
          return{ok:true};},
        async locate(args){log('locate',args);const x=(window.server[args.account][args.folder]||[]).find(y=>y.messageId===args.messageId);return{validity:'7',uid:x?x.uid:null};},
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
  ok('Inside a bundle the newest mail is on top',JSON.stringify(await subjects())===JSON.stringify(['Angebote neu','Angebote alt']));
  await panel.locator('[data-mail-all=order]').click();
  ok('↕ turns the order around',JSON.stringify(await subjects())===JSON.stringify(['Angebote alt','Angebote neu']));
  await panel.locator('[data-mail-all=order]').click();
  await panel.locator('[data-mail-all-id]').first().click();
  ok('Reader shows text, both accounts and the newsletter mark',(await panel.textContent()).includes('Gültig bis '+await page.evaluate(()=>dateIn(5)))&&(await panel.textContent()).includes('zweit@example.invalid')&&(await panel.textContent()).includes('📰'));
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
  // Clean-up by validity
  await page.locator('[data-tab="mail"]').click();
  // The earlier star protects that Aldi mail; take it away again for the clean-up checks.
  await page.evaluate(async()=>{const r=CATALOG.find(x=>x.mailMessageId==='<aldi42@aldi.invalid>');r.mailStar=false;r.mailFlagged=false;window.server['11111111-1111-4111-8111-111111111111'].INBOX.find(y=>y.uid===2000).flagged=false;await idbPut('catalog',r);});
  await panel.locator('[data-mail-all=clean]').click();
  const section=async key=>{const all=await panel.locator('.mail-all-list > *').evaluateAll(n=>n.map(x=>({clean:x.dataset.mailClean||'',ids:[...x.querySelectorAll('[data-mail-all-id]')].map(b=>b.dataset.mailAllId)})));let on=false,ids=[];for(const x of all){if(x.clean)on=x.clean===key;else if(on)ids.push(...x.ids);}return ids;};
  const hashOf=id=>page.evaluate(id=>CATALOG.find(r=>r.mailMessageId===id)?.hash,id);
  ok('Expired offer is listed as expired, the running one as running',JSON.stringify(await section('expiredH'))===JSON.stringify([await hashOf('<aldi42@aldi.invalid>')])&&(await section('runningH')).includes(await hashOf('<aldi43@aldi.invalid>')));
  ok('No clear date and starred mails wait in "Zum Prüfen"',(await section('checkH')).includes(await hashOf('<m50@example.invalid>'))&&(await section('checkH')).includes(await hashOf('<m1994@example.invalid>')));
  ok('Nothing was moved before Klaus decides',!(await page.evaluate(()=>window.mailCalls.some(c=>c.method==='action'))));
  ok('One question per sender with expired offers',await panel.locator('[data-mail-ask]').count()===1&&await panel.locator('[data-mail-ask="news@aldi.invalid"]').count()===1);
  await panel.getByRole('button',{name:'Ja, künftig selbst'}).click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='action'&&c.args.action==='move'));
  await page.waitForFunction(()=>CATALOG.find(r=>r.mailMessageId==='<aldi42@aldi.invalid>')?.mailTrashed);
  const moved=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='action').map(c=>c.args));
  ok('"Ja" moves exactly the expired mail into the provider trash',moved.length===1&&moved[0].uid===2000&&moved[0].folder==='INBOX'&&moved[0].target==='Papierkorb'&&moved[0].action==='move');
  ok('Running offer and starred mail stay where they are',await page.evaluate(()=>window.server['11111111-1111-4111-8111-111111111111'].INBOX.some(x=>x.uid===2001)&&window.server['11111111-1111-4111-8111-111111111111'].INBOX.some(x=>x.uid===1994)));
  ok('Trashed mail leaves the lists and an undo appears',await panel.locator('[data-mail-undo]').isVisible()&&!(await section('expiredH')).length&&await panel.locator('[data-mail-run]').count()===1);
  await capture(page,'6-aufraeumen');
  await panel.locator('[data-mail-undo]').getByRole('button',{name:'Rückgängig'}).click();
  // Wait for the new place on the server, not only for "not in trash": the follow-up fetch starts a moment later.
  await page.waitForFunction(()=>{const r=CATALOG.find(x=>x.mailMessageId==='<aldi42@aldi.invalid>');return r&&!r.mailTrashed&&r.mailRemotes?.length===1&&!PBMailIndex.running();});
  const back=await page.evaluate(()=>({calls:window.mailCalls.filter(c=>c.method==='locate').map(c=>c.args),inbox:window.server['11111111-1111-4111-8111-111111111111'].INBOX.some(x=>x.messageId==='<aldi42@aldi.invalid>'),places:CATALOG.find(r=>r.mailMessageId==='<aldi42@aldi.invalid>').mailRemotes.length}));
  ok('Rückgängig finds the mail in the trash by its ID and moves it back',back.calls.length===1&&back.calls[0].folder==='Papierkorb'&&back.calls[0].messageId==='<aldi42@aldi.invalid>'&&back.inbox);
  ok('After undo the mail is filed at its place again, without a copy',back.places===1&&await page.evaluate(()=>CATALOG.filter(r=>r.mailMessageId==='<aldi42@aldi.invalid>').length)===1);
  ok('A mail taken back is not moved again automatically',await page.evaluate(()=>!CATALOG.find(r=>r.mailMessageId==='<aldi42@aldi.invalid>').mailTrashed&&window.mailCalls.filter(c=>c.method==='action'&&c.args.uid!==undefined&&c.args.folder==='INBOX').length===1));
  // Approved sender: new expired offers go to the trash by themselves after fetching.
  await page.evaluate(()=>{window.server['11111111-1111-4111-8111-111111111111'].INBOX.push(m(2002,'ALDI SÜD <news@aldi.invalid>','Angebote vorletzte Woche',12,{list:true,messageId:'<aldi41@aldi.invalid>',text:'gültig bis '+dateIn(-6)}));});
  await page.evaluate(()=>PBMailIndex.sync());
  const auto=await page.evaluate(()=>({trashed:CATALOG.filter(r=>r.mailTrashed).map(r=>r.mailMessageId).sort(),reason:CATALOG.find(r=>r.mailMessageId==='<aldi41@aldi.invalid>')?.mailTrashed?.reason}));
  ok('Approved sender: expired offers are cleaned up after fetching, marked automatic',JSON.stringify(auto.trashed)===JSON.stringify(['<aldi41@aldi.invalid>'])&&auto.reason==='auto');
  ok('New mails of the sender inherit the approval',await page.evaluate(()=>CATALOG.find(r=>r.mailMessageId==='<aldi41@aldi.invalid>').mailSenderRule)==='auto');
  // Klaus takes a mail back himself in the provider's webmail: the next fetch shows it again.
  await page.evaluate(()=>{const a=window.server['11111111-1111-4111-8111-111111111111'],i=a.Papierkorb.findIndex(x=>x.messageId==='<aldi41@aldi.invalid>');const [x]=a.Papierkorb.splice(i,1);a.INBOX.push({...x,uid:2100});});
  await page.evaluate(()=>PBMailIndex.sync());
  ok('A mail restored at the provider is visible again and not moved again',await page.evaluate(()=>{const r=CATALOG.find(x=>x.mailMessageId==='<aldi41@aldi.invalid>');return !r.mailTrashed&&r.mailKeep===1&&r.mailRemotes.some(l=>l.uid===2100)&&window.server['11111111-1111-4111-8111-111111111111'].INBOX.some(x=>x.uid===2100);}));
  ok('Starred newsletter is never moved',await page.evaluate(()=>!window.mailCalls.some(c=>c.method==='action'&&c.args.uid===1994)));
  // Marks per sender
  await page.evaluate(()=>{PBMailIndex.show(true);});
  const yfood=await hashOf('<m50@example.invalid>');
  await panel.locator(`[data-mail-all-id="${yfood}"]`).first().click();
  await panel.locator('[data-mail-mark=important]').click();
  await panel.getByRole('button',{name:'← Zurück',exact:true}).click();
  await panel.locator('[data-mail-all=clean]').click();
  ok('"Ist wichtig" takes the sender out of clean-up',await page.evaluate(()=>CATALOG.find(r=>r.mailMessageId==='<m50@example.invalid>').mailSenderMark)==='important'&&(await section('runningH')).length>0&&![...await section('checkH'),...await section('expiredH'),...await section('runningH')].includes(yfood));
  const bill=await page.evaluate(()=>CATALOG.find(x=>x.name==='Ihre Rechnung Oktober').hash);
  await panel.locator('[data-mail-all=clean]').click();
  ok('A sender without newsletter mark is not in clean-up',!(await section('checkH')).includes(bill));
  await panel.locator('[data-mail-all=list]').click();
  await panel.locator(`[data-mail-all-id="${bill}"]`).click();
  await panel.locator('[data-mail-mark=ad]').click();
  await panel.getByRole('button',{name:'← Zurück',exact:true}).click();
  await panel.locator('[data-mail-all=clean]').click();
  ok('"Ist Werbung" brings the sender into clean-up, without a date only "Zum Prüfen"',(await section('checkH')).includes(bill)&&!(await section('expiredH')).includes(bill));
  await page.evaluate(()=>{window.noMove=true;});
  await page.evaluate(async()=>{await PBMailIndex.trash([CATALOG.find(r=>r.mailMessageId==='<m1994@example.invalid>')]);});
  ok('Provider without safe move: nothing happens and the reason is shown',await page.evaluate(()=>!CATALOG.find(r=>r.mailMessageId==='<m1994@example.invalid>').mailTrashed)&&(await panel.locator('[role=status]').textContent()).includes('MOVE_UNSUPPORTED'));
  await page.evaluate(()=>{window.noMove=false;});
  ok('Mails without ID are never moved',await page.evaluate(async()=>{const r=CATALOG.find(x=>x.mailIndex&&!x.mailMessageId);await PBMailIndex.trash([r]);return !r.mailTrashed;}));
  // Offline: nothing breaks, the reason is shown
  await page.locator('[data-tab="mail"]').click();
  await page.evaluate(()=>{window.offline=true;});
  await panel.locator('[data-mail-all=refresh]').click();
  await page.waitForFunction(()=>!PBMailIndex.running());
  ok('App internet off: fetching waits and says why',(await panel.locator('[role=status]').textContent()).includes('App-Internet ist aus'));
  await page.evaluate(()=>{window.offline=false;});
  // Open at the provider uses the right account, folder and UID
  await panel.locator('[data-mail-all=senders]').click();
  await panel.locator('[data-mail-sender="mama@example.invalid"]').click();
  await panel.locator('[data-mail-all-id]').first().click();
  await panel.getByRole('button',{name:'Beim Anbieter öffnen'}).click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='message'));
  const opened=await page.evaluate(()=>window.mailCalls.find(c=>c.method==='message').args);
  ok('"Beim Anbieter öffnen" opens exactly this mail in its account',opened.account==='22222222-2222-4222-8222-222222222222'&&opened.folder==='INBOX'&&opened.uid===3000&&await panel.isHidden());
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  // A background redraw keeps the reading position
  await mail.locator('.live-mail [data-mail-all=open]').click();
  await panel.locator('[data-mail-all=list]').click();
  await page.setViewportSize({width:390,height:600});
  const kept=await page.evaluate(async()=>{const p=document.getElementById('pb-mail-all');p.scrollTop=400;const before=p.scrollTop;await PBMailIndex.sync();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return [before,p.scrollTop];});
  ok('Background update keeps the scroll position ('+kept.join(' → ')+')',kept[0]>100&&Math.abs(kept[0]-kept[1])<2);
  await page.setViewportSize({width:1280,height:900});
  await panel.getByRole('button',{name:'Zurück zum Postfach'}).click();
  // One header row: Zurück, account choice, ⟳ (no text), ⋯
  await mail.locator('.live-mail [data-mail-all=open]').click();
  await panel.locator('[data-mail-all=list]').click();
  const head=await page.evaluate(()=>{const h=document.querySelector('#pb-mail-all .mail-all-head'),kids=[...h.children].filter(x=>!x.hidden);const mids=kids.map(x=>{const r=x.getBoundingClientRect();return r.top+r.height/2;});return {rows:Math.max(...mids)-Math.min(...mids)<6?1:2,back:h.querySelector('.mail-back').textContent,refresh:h.querySelector('[data-mail-all=refresh]')?.textContent.trim(),label:h.querySelector('[data-mail-all=refresh]')?.getAttribute('aria-label'),options:[...h.querySelector('[data-mail-all=account]').options].map(o=>o.textContent)};});
  ok('Header is one row: "← Zurück", account choice, refresh symbol without text',head.rows===1&&head.back==='← Zurück'&&head.refresh===''&&head.label==='Jetzt aktualisieren'&&JSON.stringify(head.options)===JSON.stringify(['Alle Konten','klaus@example.invalid','zweit@example.invalid']));
  await panel.locator('[data-mail-all=account]').selectOption('22222222-2222-4222-8222-222222222222');
  const only=await page.evaluate(()=>[...document.querySelectorAll('#pb-mail-all [data-mail-all-id]')].map(b=>CATALOG.find(r=>r.hash===b.dataset.mailAllId)).every(r=>r.mailRemotes.some(l=>l.account==='22222222-2222-4222-8222-222222222222'))&&document.querySelectorAll('#pb-mail-all [data-mail-all-id]').length>0);
  ok('Choosing one account shows only its mails, the header names it',only&&await panel.locator('[data-mail-all=account] option:checked').textContent()==='zweit@example.invalid');
  await panel.locator('[data-mail-all=account]').selectOption('all');
  // Slim buttons, larger touch area, grow under the finger
  const touch=await page.evaluate(()=>{const b=document.querySelector('#pb-mail-all [data-mail-all=refresh]'),after=getComputedStyle(b,'::after');return {h:b.getBoundingClientRect().height,top:parseFloat(after.top),bottom:parseFloat(after.bottom)};});
  ok('Touch area reaches beyond the slim button ('+touch.h+' px visible, +7 px above and below)',touch.h<=32&&touch.top<=-7&&touch.bottom<=-7);
  await panel.locator('[data-mail-all=refresh]').hover();await page.mouse.down();await page.waitForTimeout(250);
  const grow=await page.evaluate(()=>getComputedStyle(document.querySelector('#pb-mail-all [data-mail-all=refresh]')).transform);
  await page.mouse.up();
  ok('Button grows while pressed ('+grow+')',/matrix\((1\.1[0-9]*|1\.12)/.test(grow));
  await page.waitForFunction(()=>!PBMailIndex.running());
  await panel.getByRole('button',{name:'Zurück zum Postfach'}).click();
  // Languages and phone width
  await mail.locator('.live-mail [data-mail-all=open]').click();
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('#pb-mail-all h2')?.textContent==='All accounts');
  ok('Switches to English without reload',(await panel.textContent()).includes('Senders')&&(await panel.textContent()).includes('Clean up'));
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.setViewportSize({width:360,height:740});
  ok('Fits a phone screen without sideways scrolling',await page.evaluate(()=>{const p=document.querySelector('#pb-mail-all');return p.scrollWidth<=p.clientWidth+1&&document.documentElement.scrollWidth<=window.innerWidth+1;}));
  // Measured in one step: a background fetch may redraw the panel between finding and measuring.
  const small=await page.evaluate(()=>[...document.querySelectorAll('#pb-mail-all .mail-all-switch .mail-button')].map(b=>Math.round(b.getBoundingClientRect().height)));
  ok('Phone: "← Zurück" stays on one line',await page.evaluate(()=>{const b=document.querySelector('#pb-mail-all .mail-all-head .mail-back');return b.getBoundingClientRect().height<=32;}));
  ok('Phone: view buttons stay in one row and are not cut off',await page.evaluate(()=>{const row=document.querySelector('#pb-mail-all .mail-all-switch'),b=[...row.children];return new Set(b.map(x=>Math.round(x.getBoundingClientRect().top))).size===1&&row.clientHeight>=b[0].getBoundingClientRect().height;}));
  ok('Buttons are flat, 26–32 px ('+small.join(', ')+' px)',small.length===4&&small.every(h=>h>=26&&h<=32));
  await panel.getByRole('button',{name:'Zurück zum Postfach'}).click();
  ok('"Zurück zum Postfach" returns to the normal mailbox',await panel.isHidden()&&await mail.locator('.live-mail').isVisible());
  ok('No runtime errors',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} all-accounts checks passed (simulated native transport; no real provider login).`);
