// „Alle Konten“ als drittes Konto im Postfach (Klaus 22.11.2026): dieselbe Ordnerspalte, Liste und Leseansicht wie ein
// einzelnes Konto, Liste aus dem Index (alle Ordner, auch Gesendet/Entwürfe/Spam/Papierkorb, mit Anhang-Angaben),
// Aktionen je Konto, 15 Mails je Seite, Vorausladen der gezeigten Mails samt Anhängen.
// Simulated native transport only; no real provider login and no network.
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
  try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(data);}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser,count=0;
// PB_CAPTURE_DESIGN=1 stores pictures for the preview page; never part of CI.
async function capture(page,name,width,height){if(process.env.PB_CAPTURE_DESIGN!=='1')return;const size=page.viewportSize();await page.setViewportSize({width,height});await page.waitForTimeout(250);await page.screenshot({path:`docs/design/alle-konten-1.0.58/${name}.png`});await page.setViewportSize(size);await page.waitForTimeout(150);}
const ok=(name,value,details)=>{assert.ok(value,details?name+'; '+JSON.stringify(details):name);console.log('✓ '+name);count++;};
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
function fixture(prefetch){
  return ({prefetch,A,B})=>{
    if(!prefetch)window.pbMailPrefetch=false;
    const day=864e5,now=Date.now();
    window.mailCalls=[];
    const log=(method,args)=>window.mailCalls.push({method,args:structuredClone(args)});
    window.mailAccounts=[{id:A,email:'klaus@example.invalid',provider:'telekom',authType:'password'},{id:B,email:'zweit@example.invalid',provider:'gmail',authType:'oauth'}];
    const m=(uid,from,subject,ageDays,extra={})=>({uid,messageId:extra.messageId??`<m${uid}@example.invalid>`,from,subject,date:now-ageDays*day,size:2000,seen:Boolean(extra.seen),flagged:false,list:false,bulk:false,text:'Text '+subject,html:'',files:extra.files||[]});
    const inboxA=Array.from({length:20},(_,i)=>m(100+i,'Kollege <kollege@example.invalid>','Notiz A'+i,2+i*2));
    inboxA.push(m(90,'Stadtwerke <rechnung@stadtwerke.invalid>','Rechnung November',0.5,{files:[{name:'Rechnung.pdf',type:'application/pdf',size:120000},{name:'Bedingungen.pdf',type:'application/pdf',size:80000}]}));
    const inboxB=[m(300,'Mutter <mama@example.invalid>','Sonntag',1),m(301,'Shop <info@shop.invalid>','Angebot',1.5,{messageId:'<werbung@shop.invalid>'})];
    window.server={
      [A]:{INBOX:inboxA,Spam:[m(10,'x@spam.invalid','Gewinn',1)],Papierkorb:[m(11,'alt@example.invalid','Weg damit',3)],Gesendet:[m(12,'klaus@example.invalid','Antwort an Anna',1)],'Entwürfe':[m(13,'klaus@example.invalid','Halber Brief',2)],Vereine:[m(14,'verein@example.invalid','Treffen',4)]},
      [B]:{INBOX:inboxB,'[Gmail]/Alle Nachrichten':[...inboxB],'[Gmail]/Spam':[],'[Gmail]/Gesendet':[m(310,'zweit@example.invalid','Gesendet B',1)],'[Gmail]/Papierkorb':[]}
    };
    const folder=(path,specialUse='',collection=false)=>({path,name:path.replace(/^\[Gmail\]\//,''),specialUse,collection});
    const folders={[A]:[folder('INBOX'),folder('Spam'),folder('Papierkorb'),folder('Gesendet'),folder('Entwürfe'),folder('Vereine')],
      [B]:[folder('INBOX'),folder('[Gmail]/Alle Nachrichten','',true),folder('[Gmail]/Spam','\\Junk'),folder('[Gmail]/Gesendet','\\Sent'),folder('[Gmail]/Papierkorb','\\Trash')]};
    const box=(acc,path)=>(window.server[acc][path]??=[]);
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'1.0.58-debug',nativeMail:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);return{items:window.mailAccounts};},
        async folders(args){log('folders',args);return{items:folders[args.account].map(f=>({...f,total:box(args.account,f.path).length}))};},
        async messages(args){log('messages',args);const list=[...box(args.account,args.folder)].sort((a,b)=>b.uid-a.uid);return{validity:'7',total:list.length,items:list.slice(0,50).map(x=>({uid:x.uid,subject:x.subject,from:x.from,date:new Date(x.date).toString(),flags:x.seen?['\\Seen']:[],size:x.size})),next:null};},
        async message(args){log('message',args);if(args.validity!=='7')throw{code:'FOLDER_CHANGED'};const x=box(args.account,args.folder).find(y=>y.uid===args.uid);if(!x)throw{code:'MESSAGE_MISSING'};
          return{subject:x.subject,from:x.from,to:'klaus@example.invalid',messageId:x.messageId,text:x.text,html:'',raw:'Subject: '+x.subject+'\r\n\r\n'+x.text,attachments:x.files.map(f=>({name:f.name,type:f.type,size:f.size,data:''}))};},
        async index(args){log('index',args);const list=box(args.account,args.folder).filter(x=>x.date>=args.since).sort((a,b)=>b.uid-a.uid);
          return{validity:'7',items:list.slice(0,100).map(({text,html,files,...head})=>head),next:null};},
        async indexText(args){log('indexText',args);return{items:args.uids.map(uid=>{const x=box(args.account,args.folder).find(y=>y.uid===uid);return{uid,text:x.text,html:'',attachments:x.files.length>0,files:x.files};})};},
        async action(args){log('action',args);return{ok:true};},
        async actions(args){log('actions',args);
          if(args.action==='move'){const from=box(args.account,args.folder),to=box(args.account,args.target);
            for(const uid of args.uids){const i=from.findIndex(x=>x.uid===uid);if(i<0)continue;const [x]=from.splice(i,1);to.push({...x,uid:Math.max(0,...to.map(y=>y.uid),x.uid)+1000});}}
          return{ok:true,done:args.uids.length,missing:0};},
        async locate(args){log('locate',args);return{validity:'7',uid:null};},
        async saved(args){log('saved',args);return{items:args.account===A?[{id:'d1',status:'draft',subject:'Lokaler Entwurf',to:'anna@example.invalid'}]:[]};},
        async savedDraft(args){log('savedDraft',args);return{to:'anna@example.invalid',subject:'Lokaler Entwurf',text:'x'};},
        async send(args){log('send',args);return{status:'sent',accepted:[args.draft.to],rejected:[]};},
        async saveDraft(args){log('saveDraft',args);return{ok:true};},
        async familienakteTresor(){return{vorhanden:false,offen:false};}
      }
    }};
  };
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const page=await context.newPage();
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await context.route('**/*',r=>{if(r.request().url().startsWith(url))return r.continue();if(r.request().url().startsWith('https://cdn.jsdelivr.net/'))return r.fulfill({status:404,body:''});remote.push(r.request().url());return r.abort();});
  await page.addInitScript(fixture(false),{prefetch:false,A,B});
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBMailIndex&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  const mail=page.locator('#mailWorkspace'),live=mail.locator('.live-mail'),pick=mail.locator('.mail-account-bar select[aria-label=Mailkonto]');
  const idle=()=>page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy')&&!PBMailIndex.running());
  await live.locator('[data-live-uid]').first().waitFor();await idle();
  const options=await pick.evaluate(s=>[...s.options].map(o=>[o.value,o.textContent]));
  ok('The account choice has "Alle Konten" first, then every account',JSON.stringify(options)===JSON.stringify([['*','Alle Konten'],[A,'klaus@example.invalid'],[B,'zweit@example.invalid']]),options);
  ok('Without an earlier choice a single account opens as before',await pick.inputValue()===A);
  // The entry in the folder bar of a single account switches the whole mailbox – no own page any more.
  await live.locator('.mail-folders [data-mail-all=open]').click();
  await page.waitForFunction(()=>localStorage.getItem('pb_mail_index_last'));await idle();
  ok('"Alle Konten" in the folder bar switches the mailbox itself: same layout with folders, list and reader, no separate page',await pick.inputValue()==='*'&&await mail.locator('#pb-mail-all').isHidden()&&await live.isVisible()&&await page.evaluate(()=>{const l=document.querySelector('.live-mail .mail-layout');return ['.mail-folders','.mail-list','.mail-reader'].every(s=>l.querySelector(':scope>'+s));}));
  const indexed=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='index').map(c=>c.args.account.slice(0,1)+':'+c.args.folder));
  ok('The first visit fetches every folder of every account (also sent, drafts, spam, trash), no Gmail collection',['1:INBOX','1:Spam','1:Papierkorb','1:Gesendet','1:Entwürfe','1:Vereine','2:INBOX','2:[Gmail]/Spam','2:[Gmail]/Gesendet','2:[Gmail]/Papierkorb'].every(x=>indexed.includes(x))&&!indexed.some(x=>x.includes('Alle Nachrichten')),indexed);
  const folderRow=id=>live.locator(`.mail-folders [data-mail-folder="${id}"]`);
  const num=async id=>(await folderRow(id).locator('small').textContent()).trim();
  ok('The folders are the standard ones of a single account, in the same order',JSON.stringify(await live.locator('.mail-folders [data-mail-folder]').evaluateAll(n=>n.map(b=>b.dataset.mailFolder).filter(id=>!id.startsWith('provider:')&&!id.startsWith('tool:'))))===JSON.stringify(['inbox','draft','outbox','sent','archive','spam','trash','exported']));
  ok('Folder numbers add up all accounts (inbox 21 + 2, sent 1 + 1, spam 1 + 0)',await num('inbox')==='23'&&await num('sent')==='2'&&await num('spam')==='1',[await num('inbox'),await num('sent'),await num('spam')]);
  ok('Drafts count the server drafts of all accounts plus the local draft',await num('draft')==='2');
  // Klaus 27.11.2026 (Bild): „Alle Konten“ zeigte Posteingang 0 bei voller Liste – Serverzahlen kannte der Index erst für ein Konto.
  const savedFolders=await page.evaluate(()=>localStorage.getItem('pb_mail_index_folders'));
  await page.evaluate(B=>{const all=JSON.parse(localStorage.getItem('pb_mail_index_folders'));delete all[B];for(const f of Object.values(all)[0].list)if(f.role==='inbox')f.total=0;
    localStorage.setItem('pb_mail_index_folders',JSON.stringify(all));dispatchEvent(new CustomEvent('pb:mail-index-progress'));},B);
  ok('Without server numbers (yet) a folder counts at least the mails already loaded (21 + 2), and the number follows the running fetch',await num('inbox')==='23'&&await num('sent')==='2',[await num('inbox'),await num('sent')]);
  await page.evaluate(v=>{localStorage.setItem('pb_mail_index_folders',v);},savedFolders);await new Promise(r=>setTimeout(r,1100));
  await page.evaluate(()=>dispatchEvent(new CustomEvent('pb:mail-index-progress')));
  const rows=live.locator('.mail-list [data-live-uid]');
  ok('The inbox list shows 15 mails first, newest on top, from both accounts',await rows.count()===15&&(await rows.first().locator('.mail-subject').textContent())==='Rechnung November'&&(await rows.nth(1).locator('.mail-subject').textContent())==='Sonntag');
  await capture(page,'app-breit',1366,860);await capture(page,'app-handy',390,844);
  const tag=await rows.nth(1).locator('.mail-account-tag').textContent();
  ok('Each mail names its account with a coloured dot',tag.includes('zweit@example.invalid')&&await rows.nth(1).locator('.mail-account-dot').evaluate(d=>getComputedStyle(d).backgroundColor!=='rgba(0, 0, 0, 0)'));
  ok('The index remembered the attachments: "2 Anhänge" with their names in the tooltip',(await rows.first().locator('.mail-files').textContent()).includes('2 Anhänge')&&(await rows.first().locator('.mail-files').getAttribute('title'))==='Rechnung.pdf, Bedingungen.pdf');
  await live.locator('.mail-list>[data-live-text=more]').click();await idle();
  ok('"Weitere laden" shows the next mails from the index without asking a server',await rows.count()===23&&await live.locator('.mail-list>[data-live-text=more]').count()===0);
  await folderRow('spam').click();await idle();
  ok('Spam shows the spam of all accounts from the index',JSON.stringify(await rows.locator('.mail-subject').allTextContents())==='["Gewinn"]');
  await folderRow('sent').click();await idle();
  ok('Gesendet shows the sent mails of both accounts',(await rows.locator('.mail-subject').allTextContents()).sort().join('|')==='Antwort an Anna|Gesendet B');
  await live.locator('.mail-folders [data-live-more]').click();
  ok('Own folders of a provider stand under "Weitere Ordner" with the account in front',await live.locator('.mail-folders [data-mail-folder^="provider:"]').count()===1&&(await live.locator('.mail-folders [data-mail-folder^="provider:"]').textContent()).includes('klaus@example.invalid · Vereine'));
  // Actions: one call per account, each with its own spam folder.
  await folderRow('inbox').click();await idle();
  const tick=async subject=>live.locator('.mail-list .mail-item',{has:page.locator('.mail-subject',{hasText:subject})}).locator('input[type=checkbox]').check();
  await tick('Angebot');await tick('Notiz A0');
  await page.evaluate(()=>{window.mailCalls=[];});
  await live.locator('.mail-list [data-native-selection=spam]').click();await idle();
  const moved=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='actions').map(c=>({a:c.args.account.slice(0,1),f:c.args.folder,t:c.args.target,u:c.args.uids})));
  ok('"Als Spam" for two accounts: one call per account, each into its own spam folder',moved.length===2&&moved.some(x=>x.a==='1'&&x.t==='Spam'&&x.u.join()==='100')&&moved.some(x=>x.a==='2'&&x.t==='[Gmail]/Spam'&&x.u.join()==='301'),moved);
  ok('The moved mails leave the inbox list at once',!(await rows.locator('.mail-subject').allTextContents()).some(s=>s==='Angebot'||s==='Notiz A0'));
  await idle();await folderRow('spam').click();await idle();
  ok('After the quick refresh of the touched accounts they stand in spam',(await rows.locator('.mail-subject').allTextContents()).sort().join('|')==='Angebot|Gewinn|Notiz A0');
  // Opening and answering go through the account of the mail.
  await page.evaluate(()=>{window.mailCalls=[];});
  await live.locator('.mail-list .mail-item',{has:page.locator('.mail-subject',{hasText:'Angebot'})}).locator('button').click();
  await live.locator('.mail-reader h3').waitFor();await idle();
  const opened=await page.evaluate(()=>window.mailCalls.find(c=>c.method==='message')?.args);
  ok('A mail opens whole from its own account and folder',opened?.account===B&&opened.folder==='[Gmail]/Spam',opened);
  ok('In spam the reader offers "Kein Spam" back into the inbox of that account',await live.locator('.mail-reader [data-live-text=notSpam]').count()===1);
  await live.locator('.mail-reader [data-live-text=reply]').click();
  ok('"Antworten" writes from the account of the mail',await live.locator('.mail-reader select[data-mail-from]').inputValue()===B);
  // Arrangement and tools.
  await folderRow('inbox').click();await idle();
  ok('The tools of the former page stand in the folder bar',await live.locator('.mail-folders [data-mail-tool=senders]').count()===1&&await live.locator('.mail-folders [data-mail-tool=clean]').count()===1);
  await live.locator('.mail-folders [data-mail-tool=senders]').click();await idle();
  ok('"Nach Absender" shows the sender bundles inside the list pane, without "Zurück" or an own account choice',await live.locator('.mail-list #pb-mail-all [data-mail-sender]').count()>=2&&await live.locator('.mail-list #pb-mail-all .mail-all-head .mail-back').count()===0&&await live.locator('.mail-list #pb-mail-all select').count()===0);
  await live.locator('.mail-list #pb-mail-all [data-mail-sender="mama@example.invalid"]').click();
  await page.evaluate(()=>{window.mailCalls=[];});
  await live.locator('.mail-list #pb-mail-all [data-mail-all-id]').first().click();
  await live.locator('.mail-reader h3').waitFor();await idle();
  ok('A mail from a bundle opens in the reader on the right; "Alle Konten" stays',await pick.inputValue()==='*'&&(await live.locator('.mail-reader h3').textContent())==='Sonntag'&&await page.evaluate(()=>window.mailCalls.some(c=>c.method==='message'&&c.args.uid===300)));
  await folderRow('inbox').click();await idle();
  ok('Back in a folder the bundle view leaves the list pane',await live.locator('.mail-list #pb-mail-all').count()===0&&await rows.count()===15);
  // The choice is remembered; a single account works as before.
  await page.reload();await page.waitForFunction(()=>window.PBMailIndex&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  await page.waitForFunction(()=>document.querySelector('.mail-account-bar select')?.value==='*'&&document.querySelectorAll('.live-mail .mail-list [data-live-uid]').length>0);
  ok('After a restart the mailbox opens with "Alle Konten" again',await pick.inputValue()==='*');
  await idle();
  await pick.selectOption(A);await idle();
  ok('Choosing one account shows only its own mails again, with the "Alle Konten" entry in its folder bar',await rows.locator('.mail-account-tag').count()===0&&await live.locator('.mail-folders [data-mail-all=open]').count()===1);
  // Prefetch: the mails of the shown page are fetched with their attachments in the background, nothing marked as read.
  const page2=await context.newPage();
  page2.on('pageerror',e=>errors.push(e.message));
  await page2.addInitScript(fixture(true),{prefetch:true,A,B});
  await page2.goto(url);await page2.waitForFunction(()=>window.PBMailDevice&&typeof db!=='undefined'&&db);
  await page2.locator('[data-tab="mail"]').click();
  // Same browser storage as above: the last choice was one account; the prefetch works there just the same.
  await page2.waitForFunction(()=>document.querySelectorAll('.live-mail .mail-list [data-live-uid]').length>0);
  await page2.waitForFunction(()=>window.mailCalls.filter(c=>c.method==='message').length>=15,null,{timeout:20000});
  const pre=await page2.evaluate(()=>({fetched:window.mailCalls.filter(c=>c.method==='message').length,read:window.mailCalls.filter(c=>c.method==='action'&&c.args.action==='read').length}));
  ok('Prefetch: the 15 mails of the page are fetched in the background, none is marked as read',pre.fetched===15&&pre.read===0,pre);
  await page2.evaluate(()=>{window.mailCalls=[];});
  await page2.locator('.live-mail .mail-list [data-live-uid]').first().click();
  await page2.locator('.live-mail .mail-reader h3').waitFor();
  ok('Opening a prefetched mail needs no second download',await page2.evaluate(()=>!window.mailCalls.some(c=>c.method==='message')&&window.mailCalls.some(c=>c.method==='action'&&c.args.action==='read')));
  await page2.close();
  if(remote.length)console.log('REMOTE',remote);
  ok('No network requests and no page errors',!remote.length&&!errors.length,{remote,errors});
  console.log(count+' "Alle Konten" mailbox checks passed (simulated native transport; no real provider login).');
}finally{await browser?.close();server.close();}
