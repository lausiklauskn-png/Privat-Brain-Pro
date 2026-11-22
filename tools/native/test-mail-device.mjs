import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
async function clickControl(page,selector) {
  const control=page.locator(selector);
  if(!await control.isVisible())await control.locator('xpath=ancestor::details[1]').locator(':scope>summary').click();
  await control.click();
}
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
const ok=(name,value,details)=>{assert.ok(value,details===undefined?name:name+'; '+JSON.stringify(details));console.log('✓ '+name);count++;};
try{
  // Keep srcdoc resource interception in this test transport's target. DOM origin/sandbox
  // restrictions remain enforced; Android tests also check the default WebView boundary.
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-site-isolation-trials']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  const dialogs=[];page.on('dialog',d=>{dialogs.push(d.message());d.accept();});
  /* Modul 03's library address is answered by the app itself (MainActivity/BundledLibrary), never by the internet. */
  await page.context().route('**/*',r=>{
    if(r.request().url().startsWith(url))return r.continue();
    if(r.request().url().startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))return r.fulfill({status:404,body:''});
    if(r.request().url()==='https://images.example.invalid/banner.png') { remote.push(r.request().url()); return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBv8AAAAASUVORK5CYII=','base64')}); }
    remote.push(r.request().url());return r.abort();
  });
  await page.addInitScript(()=>{window.pbMailPrefetch=false;
    window.mailCalls=[];window.mailAccounts=[];window.accountMode='cancel';window.sendMode='uncertain';window.localDraft=null;window.messageMode='plain';window.sendReceipts=[];window.failFolder='';window.failMessage=false;window.historyAccount='';
    const fixture={id:'11111111-1111-4111-8111-111111111111',email:'sender@example.invalid',provider:'telekom'};
    const log=(method,args)=>window.mailCalls.push({method,args});
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.4-debug',nativeMail:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);if(window.accountMode==='vaultError')throw{code:'VAULT_UNAVAILABLE'};return{items:window.mailAccounts};},
        async addAccount(args){log('addAccount',args);if(window.accountMode==='cancel')throw{code:'CANCELLED'};window.mailAccounts=[fixture];return fixture;},
        async folders(args){log('folders',args);const T=window.folderTotals||(window.folderTotals={INBOX:125,Spam:2,Trash:4});return{items:[{path:'INBOX',name:'INBOX',specialUse:'',total:T.INBOX},{path:'Spam',name:'Spam',specialUse:'',total:T.Spam},{path:'Trash',name:'Trash',specialUse:'',total:T.Trash},{path:'Sent',name:'Sent',specialUse:''},{path:'Erledigt',name:'Erledigt',specialUse:''},{path:'Drafts',name:'Drafts',specialUse:''},{path:'Archiv',name:'Archiv',specialUse:''},{path:'@not-virtual',name:'@not-virtual',specialUse:''},{path:'@outbox',name:'@outbox',specialUse:''}]};},
        async messages(args){log('messages',args);if(args.folder===window.failFolder)throw{code:'CONNECTION_FAILED'};if(args.folder==='Trash'||args.folder==='Spam')return{validity:'124',total:window.folderTotals?.[args.folder]??0,items:[{uid:9,subject:'Alte Mail im '+args.folder,from:'old@example.invalid',date:Date.now(),flags:['\\Seen']}],next:null};return{validity:'123',total:args.folder==='INBOX'?125:args.folder==='@outbox'?3:0,items:args.folder==='INBOX'?window.inboxItems||[{uid:7,subject:'Native <img src=x onerror=alert(1)>',from:'friend@example.invalid',flags:[],size:1000}]:[],next:null};},
        async message(args){log('message',args);if(window.failMessage)throw{code:'MESSAGE_TOO_LARGE'};return{subject:window.subjectByUid?.[args.uid]||'Native message',from:'friend@example.invalid',to:fixture.email,messageId:'<fixture@example.invalid>',replyTo:'friend@example.invalid',html:window.messageMode==='html'?`<html><head><style>body{background:#fff}td{padding:16px}.offer{color:#136b72}</style><link rel="stylesheet" href="https://blocked.example.invalid/style.css"><meta http-equiv="refresh" content="0;url=https://blocked.example.invalid/redirect"></head><body onload="parent.mailExecuted=true"><table width="600" bgcolor="#fff5dc"><tr><td><img alt="Shop logo" src="cid:logo@example.invalid"><h1 class="offer">Herbstangebote</h1><p>31 % Rabatt auf ausgewählte Artikel</p><img alt="Werbung" src="https://images.example.invalid/banner.png"><a href="https://shop.example.invalid/offer">Zum Angebot</a><a href="javascript:parent.mailExecuted=true">Unsafe</a><img src="https://localhost/secrets" onerror="parent.mailExecuted=true"><script>parent.mailExecuted=true</script><form action="https://blocked.example.invalid/post"><input name="secret"></form><iframe src="https://blocked.example.invalid/frame"></iframe><svg onload="parent.mailExecuted=true"></svg></td></tr></table></body></html>`:'',text:'Direct native inbox text',raw:'From: friend@example.invalid\r\nTo: sender@example.invalid\r\nSubject: Native message\r\n\r\nDirect native inbox text',attachments:[...(window.messageMode==='html'?[{name:'logo.png',type:'image/png',contentId:'logo@example.invalid',inline:true,data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBv8AAAAASUVORK5CYII='}]:[]),{name:'test.txt',type:'text/plain',data:btoa('Local attachment test')}]};},
        async action(args){log('action',args);return{ok:true};},
        async actions(args){log('actions',args);const T=window.folderTotals;if(T&&args.action==='move'&&args.target in T){T[args.target]+=args.uids.length;if(args.folder in T)T[args.folder]-=args.uids.length;}return{ok:true,done:args.uids.length,missing:0};},
        async openAttachment(args){log('openAttachment',args);return{ok:true};},
        async openOriginal(args){log('openOriginal',args);return{ok:true};},
        async saveDraft(args){log('saveDraft',args);window.localDraft=structuredClone(args.draft);window.historyAccount=args.account;return{ok:true};},
        async saved(args){log('saved',args);return{items:args.account!==window.historyAccount?[]:window.sendReceipts.length?window.sendReceipts:window.localDraft?[{id:'draft-fixture',status:'draft',subject:window.localDraft.subject,to:window.localDraft.to,created:Date.now()}]:[]};},
        async savedDraft(args){log('savedDraft',args);return structuredClone(window.localDraft);},
        async send(args){log('send',args);window.historyAccount=args.account;window.sendReceipts=[{id:'outbox-fixture',status:window.sendMode,subject:args.draft.subject,to:args.draft.to,created:Date.now()}];return{status:window.sendMode,noticeCode:window.sendMode==='uncertain'?'SEND_UNCERTAIN':''};},
        async renewPassword(args){log('renewPassword',args);if(window.renewMode==='cancel')throw{code:'CANCELLED'};return window.mailAccounts.find(a=>a.id===args.account);},
        async removeAccount(args){log('removeAccount',args);window.mailAccounts=[];return{ok:true};}
      }
    }};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  const mail=page.locator('#mailWorkspace');
  const button=key=>mail.locator(`[data-live-text="${key}"]`);
  const baselineStyle=await mail.locator('.mail-app:not(.live-mail) [data-mail-text=compose]').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundImage,color:s.color,font:s.fontFamily,border:s.borderRadius};});
  const baseline=await mail.locator('.mail-app:not(.live-mail) .mail-folders [data-mail-folder]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.mailFolder,label:[...n.childNodes].filter(part=>part.nodeType===Node.TEXT_NODE).map(part=>part.textContent).join('').trim(),icon:n.querySelector('.native-folder-icon')?.dataset.iconKey})));
  if(process.env.PB_CAPTURE_DESIGN==='1')await page.screenshot({path:'docs/design/mail-preview6/vorher-konto.png'});
  // Generalprüfung 16.11.2026: ohne gespeichertes Konto bleibt beim Öffnen des Reiters alles wie bisher.
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='accounts'));await page.waitForTimeout(300);
  ok('Without a saved account the Mail tab only asks for the saved accounts: no account dialog, the local mailbox and "Mailkonto verbinden" stay',await mail.locator('.live-mail').isHidden()&&await button('connect').isVisible()&&await page.evaluate(()=>window.mailCalls.every(c=>c.method==='accounts')));
  await button('connect').click();
  await page.waitForFunction(()=>window.mailCalls.some(c=>c.method==='addAccount'));
  ok('Cancelled native account entry keeps local mailbox available',await mail.locator('.live-mail').isHidden());
  ok('No browser password or private service dialog',await mail.locator('dialog[open],input[type=password]').count()===0);
  await page.evaluate(()=>window.accountMode='vaultError');
  await button('connect').click();
  await page.waitForFunction(()=>document.querySelector('#mailWorkspace [role=alert]')?.textContent.includes('Kontenablage'));
  ok('Vault error is visible before a connection is open',true);
  await page.evaluate(()=>window.accountMode='ok');
  await button('connect').click();
  await mail.locator('[data-live-uid="7"]').waitFor({state:'visible'});
  ok('Native account and folder listing opens existing mailbox UI',await mail.locator('.live-mail').isVisible());
  ok('Connected mailbox retains heading and primary compose/import controls',await mail.locator('.live-mail .mail-head h2').textContent()==='Postfach'&&await mail.locator('.live-mail [data-live-text=compose]').getAttribute('class').then(s=>s.includes('mail-primary'))&&await mail.locator('.live-mail [data-shared-text=import]').isVisible());
  ok('Compose uses exactly the same glass/Petrol styles before and after activation',JSON.stringify(baselineStyle)===JSON.stringify(await mail.locator('.live-mail [data-live-text=compose]').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundImage,color:s.color,font:s.fontFamily,border:s.borderRadius};})));
  const connected=await mail.locator('.live-mail .mail-folders [data-mail-folder]').evaluateAll(nodes=>nodes.slice(0,8).map(n=>({id:n.dataset.mailFolder,label:[...n.childNodes].filter(part=>part.nodeType===Node.TEXT_NODE).map(part=>part.textContent).join('').trim(),icon:n.querySelector('.native-folder-icon')?.dataset.iconKey})));
  ok('Same eight folder labels, symbols and order before and after account activation',JSON.stringify(baseline)===JSON.stringify(connected));
  ok('Inbox count comes from provider total, not the 50-message page',await mail.locator('.live-mail [data-mail-folder=inbox] small').textContent()==='125');
  ok('Inbox/Trash/Sent are presented in German',await mail.locator('.live-mail [data-mail-folder=inbox]').textContent().then(s=>s.includes('Posteingang'))&&await mail.locator('.live-mail [data-mail-folder=trash]').textContent().then(s=>s.includes('Papierkorb'))&&await mail.locator('.live-mail [data-mail-folder=sent]').textContent().then(s=>s.includes('Gesendet')));
  ok('The provider\'s own folders wait under "Weitere Ordner", closed by default',await mail.locator('.live-mail [data-live-folder=Erledigt]').count()===0&&(await mail.locator('.live-mail [data-live-more]').textContent()).startsWith('▸ Weitere Ordner'));
  await mail.locator('.live-mail [data-live-more]').click();
  ok('Custom provider folder remains unchanged',await mail.locator('.live-mail [data-live-folder=Erledigt]').textContent().then(s=>s.includes('Erledigt')));
  await mail.locator('.live-mail [data-mail-folder=sent]').click();
  ok('Translated Sent fetches original provider path',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.folder==='Sent')&&await mail.locator('.live-mail .mail-notice').textContent().then(s=>s.includes('Gesendet')));
  await mail.locator('.live-mail [data-live-folder="@not-virtual"]').click();
  ok('Provider names beginning with @ remain real folders',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.folder==='@not-virtual'));
  await mail.locator('.live-mail [data-mail-folder="provider:@outbox"]').click();
  ok('Custom @outbox cannot collide with native outbox label or counters',await mail.locator('.live-mail .mail-notice').textContent().then(s=>s.endsWith('@outbox'))&&await mail.locator('.live-mail [data-mail-folder="provider:@outbox"] small').textContent()==='3'&&await mail.locator('.live-mail [data-mail-folder=outbox] small').textContent()==='0');
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();
  await mail.locator('.live-mail [data-native-selection=all]').click();
  ok('Without a Pro vault the mail list shows no "An Familienakte" button',await mail.locator('.live-mail [data-native-selection=familienakte]').isHidden());
  ok('Standard selection toolbar selects provider messages',await mail.locator('.live-mail .mail-count').textContent()==='1 ausgewählt');
  await mail.locator('.live-mail [data-native-selection=trash]').click();
  ok('Trash uses original account/folder/UIDVALIDITY/UID and provider target',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='actions'&&c.args.action==='move'&&c.args.target==='Trash'&&c.args.folder==='INBOX'&&c.args.validity==='123'&&JSON.stringify(c.args.uids)==='[7]')));
  ok('Chosen mails go in one call over one connection, not one login per mail',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='actions').length===1&&!window.mailCalls.some(c=>c.method==='action'&&c.args.uid===7&&c.args.target==='Trash')));
  await page.waitForFunction(()=>document.querySelector('.live-mail [data-mail-folder=trash] small')?.textContent==='5');
  ok('Trash and spam show the number from the server, and the trash count rises after deleting (Klaus 2026-10-22)',await mail.locator('.live-mail [data-mail-folder=spam] small').textContent()==='2'&&await mail.locator('.live-mail [data-mail-folder=trash] small').textContent()==='5');
  ok('Outside spam and trash the selection can be marked as spam',await mail.locator('.live-mail [data-native-selection=spam]').count()===1);
  await mail.locator('.live-mail [data-mail-folder=trash]').click();
  ok('The trash opens the provider folder, so mails deleted elsewhere appear too',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.folder==='Trash'));
  ok('In the trash nothing is deleted before a mail is chosen',await mail.locator('.live-mail [data-native-selection=trash]').isDisabled()&&(await mail.locator('.live-mail [data-native-selection=trash]').textContent())==='Endgültig löschen');
  await mail.locator('.live-mail [data-native-selection=all]').click();
  await mail.locator('.live-mail [data-native-selection=restore]').click();
  ok('"Wiederherstellen" puts chosen mails from the trash back into the inbox',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='actions'&&c.args.action==='move'&&c.args.folder==='Trash'&&c.args.target==='INBOX')));
  await mail.locator('.live-mail [data-mail-folder=spam]').click();
  const notSpam=mail.locator('.live-mail [data-native-selection=notspam]');
  ok('In spam the selection offers a named "Kein Spam" action with its own icon',await notSpam.getAttribute('aria-label')==='Kein Spam'&&await notSpam.locator('.compact-caption').isVisible()&&await notSpam.locator('.compact-caption').textContent()==='Kein Spam'&&await notSpam.locator('.compact-icon').getAttribute('data-icon-key')==='read');
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();
  ok('No provider folders created or renamed to match UI labels',await page.evaluate(()=>!window.mailCalls.some(c=>['createFolder','renameFolder'].includes(c.method))));
  ok('Ambiguous aliases remain custom; explicit server roles win',await page.evaluate(()=>{const a=PBMailFolders.resolve([{path:'a',name:'Sent',specialUse:''},{path:'b',name:'Sent Items',specialUse:''}]);const e=PBMailFolders.resolve([{path:'a',name:'Sent',specialUse:''},{path:'b',name:'Other',specialUse:'\\Sent'}]);return !a.roles.has('sent')&&a.custom.length===2&&e.roles.get('sent').path==='b';}));
  await page.evaluate(()=>window.failFolder='Sent');
  await mail.locator('.live-mail [data-mail-folder=sent]').click();
  ok('Failed folder change removes stale message/UID actions',await mail.locator('.live-mail [data-live-uid]').count()===0&&await mail.locator('.live-mail [data-live-text=reply]').count()===0);
  await page.evaluate(()=>window.failFolder='');
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();
  ok('Only language and theme cross the native credential-entry boundary',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='addAccount').every(c=>Object.keys(c.args).sort().join(',')==='dark,language')));
  ok('Mail subject is displayed as text, never inserted as HTML',await mail.locator('.live-mail img').count()===0);
  await mail.locator('[data-live-uid="7"]').click();
  await mail.locator('.mail-reader .mail-text').waitFor({state:'visible'});
  ok('Message text arrives through the native bridge',await mail.locator('.mail-reader .mail-text').textContent()==='Direct native inbox text');
  ok('Read action is bound to account, UID and UIDVALIDITY',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='action'&&c.args.uid===7&&c.args.validity==='123'&&c.args.folder==='INBOX'&&c.args.account==='11111111-1111-4111-8111-111111111111')));
  await mail.getByRole('button',{name:'↓ test.txt',exact:true}).click();
  ok('Attachment uses scoped native open operation',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openAttachment'&&c.args.index===0&&c.args.uid===7&&c.args.validity==='123')));
  // Punkt 4 (Klaus 16.11.2026): die Mail steht sofort da, die Anhänge werden danach einzeln geprüft.
  const settled=()=>page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  const checked=()=>page.waitForFunction(()=>!document.querySelector('.live-mail .mail-reader').hasAttribute('data-mail-checking'));
  await checked();
  const reportPlain=await mail.locator('.live-mail .mail-reader .mail-report').textContent();
  const riskPlain=await mail.locator('.live-mail .mail-reader .mail-report').getAttribute('data-risky');
  // The attachment check (text recognition or the rule checker) is held back by the test, like a slow scan on the tablet.
  ok('The test can hold the attachment check',await page.evaluate(()=>{window.checkStarts=[];window.checkGates=[];window.holdChecks=true;
    const held=(name,go)=>{checkStarts.push(name);return holdChecks?new Promise(r=>checkGates.push(r)).then(go):go();};
    if(window.PBOCR){const real=window.PBOCR;window.PBOCR={...real,analyze:(name,bytes,o)=>held(name,()=>real.analyze(name,bytes,o))};return true;}
    if(window.PrueferAnhang){const real=window.PrueferAnhang.pruefe;try{window.PrueferAnhang.pruefe=(name,bytes)=>held(name,()=>real(name,bytes));}catch{return false;}return window.PrueferAnhang.pruefe!==real;}
    return false;}));
  const opensBefore=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='openAttachment').length);
  await mail.locator('[data-live-uid="7"]').click();
  await page.waitForFunction(()=>window.checkGates.length===1);await settled();
  const during=await page.evaluate(()=>{const app=document.querySelector('.live-mail'),r=app.querySelector('.mail-reader'),b=[...r.querySelectorAll('button')].find(x=>x.textContent==='↓ test.txt');b.click();
    const off=key=>{const x=r.querySelector('[data-live-text='+key+']');return Boolean(x&&x.disabled);};
    return {text:r.querySelector('.mail-text')?.textContent,subject:r.querySelector('h3')?.textContent,busy:app.hasAttribute('aria-busy'),inert:app.inert,checking:r.dataset.mailChecking,
      wait:[...r.querySelectorAll('[data-mail-attachment-wait]')].map(x=>x.textContent),attachmentOff:b.disabled,forward:off('forward'),download:off('download'),bookledger:off('bookledger'),familienakte:off('familienakte'),reply:off('reply'),
      report:r.querySelector('.mail-report').textContent,opens:window.mailCalls.filter(c=>c.method==='openAttachment').length};});
  ok('Head and text of the mail stand there and can be used while the attachment is still being checked',during.text==='Direct native inbox text'&&during.subject==='Native message'&&!during.busy&&!during.inert&&during.checking==='true'&&!during.reply,during);
  ok('Each attachment says that it is being checked',JSON.stringify(during.wait)===JSON.stringify(['test.txt · wird geprüft …']),during);
  ok('Until its result is there the attachment cannot be opened, and the mail cannot be forwarded or shared with it',during.attachmentOff&&during.forward&&during.download&&during.bookledger&&during.familienakte&&during.opens===opensBefore&&!during.report.includes('test.txt'),during);
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('.live-mail .mail-reader [data-mail-attachment-wait]')?.textContent==='test.txt · being checked …');
  ok('The waiting line follows the language',true);
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.evaluate(()=>{window.checkGates.shift()();});await checked();
  const after=await page.evaluate(()=>{const r=document.querySelector('.live-mail .mail-reader'),b=[...r.querySelectorAll('button')].find(x=>x.textContent==='↓ test.txt');
    return {wait:r.querySelectorAll('[data-mail-attachment-wait]').length,off:[b,...['forward','download','bookledger','familienakte'].map(k=>r.querySelector('[data-live-text='+k+']'))].map(x=>x.disabled||Boolean(x.closest('[inert]'))),report:r.querySelector('.mail-report').textContent,risky:r.querySelector('.mail-report').dataset.risky};});
  ok('With the result the waiting line goes, attachment and sharing are free, and report and risk mark are the same as without waiting',after.wait===0&&after.off.every(x=>!x)&&after.report===reportPlain&&after.report.includes('test.txt')&&after.risky===riskPlain&&['true','false'].includes(after.risky),{after,reportPlain,riskPlain});
  // A late result must not land in another mail.
  await mail.locator('[data-live-uid="7"]').click();
  await page.waitForFunction(()=>window.checkGates.length===1);await settled();
  await mail.locator('.live-mail [data-mail-folder=trash]').click();await settled();
  await mail.locator('[data-live-uid="9"]').click();
  await page.waitForFunction(()=>window.checkGates.length===2);await settled();
  await page.evaluate(()=>{window.checkGates.shift()();});
  await page.waitForTimeout(300);
  const late=await page.evaluate(()=>{const r=document.querySelector('.live-mail .mail-reader'),b=[...r.querySelectorAll('button')].find(x=>x.textContent==='↓ test.txt');return {checking:r.dataset.mailChecking,wait:r.querySelectorAll('[data-mail-attachment-wait]').length,off:b.disabled,report:r.querySelector('.mail-report').textContent};});
  ok('The late result of the mail before is not written into the mail that is open now',late.checking==='true'&&late.wait===1&&late.off&&!late.report.includes('test.txt'),late);
  await page.evaluate(()=>{window.holdChecks=false;window.checkGates.shift()();});await checked();
  ok('The open mail then gets its own result, once',await page.evaluate(()=>{const r=document.querySelector('.live-mail .mail-reader');return r.querySelector('.mail-report').textContent.split('test.txt').length===2&&!r.querySelector('[data-mail-attachment-wait]');})&&(await mail.locator('.live-mail .mail-reader .mail-report').textContent())===reportPlain);
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();await settled();
  await mail.locator('[data-live-uid="7"]').click();
  await mail.locator('.mail-reader .mail-text').waitFor({state:'visible'});await checked();
  await mail.locator('.mail-message-tools>summary').click();
  await button('download').first().click();
  ok('Original EML uses native share/export, not unsupported blob download',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openOriginal'&&c.args.uid===7)));
  await page.evaluate(()=>{window.mailCalls=window.mailCalls.filter(c=>c.method!=='openOriginal');});
  await mail.locator('.mail-message-tools>summary').click();
  ok('"An BookLedgerPro teilen" stands in the message actions with the native label',await button('bookledger').first().textContent()==='An BookLedgerPro teilen'&&await button('bookledger').first().locator('.compact-icon').count()===1);
  await button('bookledger').first().click();
  ok('"An BookLedgerPro teilen" opens the same scoped native share chooser for the original .eml (BookLedgerPro is listed there)',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openOriginal'&&c.args.uid===7&&c.args.validity==='123')));
  ok('Shared .eml is named after the subject, not "mail-<id>-mail.eml"',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='openOriginal').every(c=>c.args.name==='Native message.eml')));
  await page.evaluate(()=>{window.mailCalls=window.mailCalls.filter(c=>c.method!=='openOriginal');});
  await mail.locator('.mail-message-tools>summary').click();
  ok('"An Familienakte teilen" stands next to BookLedgerPro with the native label and a line icon',await button('familienakte').first().textContent()==='An Familienakte teilen'&&await button('familienakte').first().locator('.compact-icon').count()===1);
  await button('familienakte').first().click();
  ok('Without the shared Pro vault "An Familienakte teilen" uses the system chooser with the original .eml',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openOriginal'&&c.args.uid===7&&c.args.validity==='123'&&c.args.name==='Native message.eml')));
  // Generalprüfung 16.11.2026: Stern und Gelesen/ungelesen lassen die Mail offen; nur die Zeile und die Knöpfe ändern sich.
  await page.evaluate(()=>{const i=document.querySelector('.live-mail .mail-list input[type=search]');i.value='Native';i.dispatchEvent(new Event('input',{bubbles:true}));});
  await mail.locator('.live-mail .mail-list input[type=checkbox]').first().check();
  const flagBefore=await page.evaluate(()=>({messages:window.mailCalls.filter(c=>c.method==='messages').length,folders:window.mailCalls.filter(c=>c.method==='folders').length,actions:window.mailCalls.filter(c=>c.method==='action').length}));
  const flagState=()=>page.evaluate(()=>{const app=document.querySelector('.live-mail'),r=app.querySelector('.mail-reader'),row=app.querySelector('[data-live-uid="7"]'),name=k=>r.querySelector('[data-live-text='+k+']')?.getAttribute('aria-label');
    return {view:app.dataset.view,subject:r.querySelector('h3')?.textContent,text:r.querySelector('.mail-text')?.textContent,row:row?.querySelector('.mail-subject')?.textContent,unread:row?.closest('.mail-item').classList.contains('unread'),current:row?.getAttribute('aria-current'),
      star:name('star'),read:name('read'),filter:app.querySelector('.mail-list input[type=search]').value,count:app.querySelector('.mail-count').textContent,
      messages:window.mailCalls.filter(c=>c.method==='messages').length,folders:window.mailCalls.filter(c=>c.method==='folders').length,last:window.mailCalls.filter(c=>c.method==='action').at(-1)?.args,actions:window.mailCalls.filter(c=>c.method==='action').length};});
  const flag0=await flagState();
  ok('The two buttons of the opened mail say what the tap does',flag0.star==='Stern setzen'&&flag0.read==='Als ungelesen markieren',flag0);
  await clickControl(page,'.live-mail .mail-reader [data-live-text=star]');await settled();
  const flag1=await flagState();
  ok('Setting the star keeps the mail open: same subject and text, same view, the list is not fetched again',flag1.view==='reader'&&flag1.subject==='Native message'&&flag1.text==='Direct native inbox text'&&flag1.messages===flagBefore.messages&&flag1.folders===flagBefore.folders,flag1);
  ok('The star goes to the provider bound to account, folder, UIDVALIDITY and UID, once',flag1.actions===flagBefore.actions+1&&flag1.last.action==='star'&&flag1.last.uid===7&&flag1.last.validity==='123'&&flag1.last.folder==='INBOX',flag1);
  ok('Only the row of this mail changes: it shows the star and stays the current one; filter word and ticks stay',flag1.row.startsWith('★ ')&&flag1.current==='true'&&flag1.filter==='Native'&&flag1.count==='1 ausgewählt'&&flag1.star==='Stern entfernen',flag1);
  await clickControl(page,'.live-mail .mail-reader [data-live-text=read]');await settled();
  const flag2=await flagState();
  ok('"Als ungelesen markieren" keeps the mail open too; the row turns bold and the button offers the way back',flag2.view==='reader'&&flag2.subject==='Native message'&&flag2.last.action==='unread'&&flag2.unread===true&&flag2.read==='Als gelesen markieren'&&flag2.messages===flagBefore.messages,flag2);
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('.live-mail .mail-reader [data-live-text=star]')?.getAttribute('aria-label')==='Remove star'&&document.querySelector('.live-mail .mail-reader [data-live-text=read]')?.getAttribute('aria-label')==='Mark as read');
  ok('Both buttons follow the language and keep their state',true);
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.waitForFunction(()=>document.querySelector('.live-mail .mail-reader [data-live-text=star]')?.getAttribute('aria-label')==='Stern entfernen');
  await clickControl(page,'.live-mail .mail-reader [data-live-text=star]');await settled();await clickControl(page,'.live-mail .mail-reader [data-live-text=read]');await settled();
  const flag3=await flagState();
  ok('Both can be taken back the same way',flag3.view==='reader'&&!flag3.row.startsWith('★')&&flag3.unread===false&&flag3.star==='Stern setzen'&&flag3.read==='Als ungelesen markieren',flag3);
  await page.evaluate(()=>{const i=document.querySelector('.live-mail .mail-list input[type=search]');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));});
  // Papierkorb: ein Tipp, sichtbar neben Antworten/Weiterleiten; er verschiebt in den Papierkorb des Anbieters.
  const trashNow=mail.locator('.live-mail .mail-reader .mail-reader-actions > [data-live-text=trash]');
  ok('"In Papierkorb" stands directly next to reply and forward, as a line icon with its name, not inside the menu',await trashNow.isVisible()&&await trashNow.getAttribute('aria-label')==='In Papierkorb'&&await trashNow.locator('.compact-icon[data-icon-key=trash]').count()===1&&await mail.locator('.live-mail .mail-message-menu [data-live-text=trash]').count()===0&&await mail.locator('.live-mail .mail-reader-actions > button').evaluateAll(n=>n.map(b=>b.dataset.liveText).filter(k=>k!=='back').slice(0,3).join())==='reply,forward,trash');
  ok('The other message actions are still all in the menu',await mail.locator('.live-mail .mail-message-menu').evaluate(m=>['read','star','spam','archive','download','bookledger','familienakte'].every(k=>m.querySelector('[data-live-text='+k+']'))&&Boolean(m.querySelector('select'))));
  ok('The move list of the opened mail shows the same names as the list above, not the provider\'s raw names',await mail.locator('.live-mail .mail-message-menu select option').evaluateAll(o=>o.map(x=>x.textContent))  .then(n=>n.includes('Papierkorb')&&n.includes('Gesendet')&&!n.includes('Trash')&&!n.includes('Sent')));
  await trashNow.click();await settled();
  ok('One tap moves the opened mail into the provider\'s trash (not a permanent delete) and returns to the list',await page.evaluate(()=>{const c=window.mailCalls.filter(c=>c.method==='action').at(-1).args;return c.action==='move'&&c.target==='Trash'&&c.uid===7;})&&await mail.locator('.live-mail .mail-reader h3').count()===0);
  await mail.locator('[data-live-uid="7"]').click();await mail.locator('.mail-reader .mail-text').waitFor({state:'visible'});await checked();
  await page.evaluate(()=>window.failMessage=true);
  await mail.locator('[data-live-uid="7"]').click();
  ok('Failed message opening removes previous subject and actions',await mail.locator('.live-mail [data-live-text=reply]').count()===0&&await mail.locator('.live-mail .mail-reader h3').count()===0);
  await page.evaluate(()=>window.failMessage=false);
  await page.evaluate(()=>{window.messageMode='html';window.mailExecuted=false;});
  await mail.locator('[data-live-uid="7"]').click();
  const frame=mail.locator('.mail-html');
  await frame.waitFor({state:'visible'});
  const body=page.frameLocator('.mail-html');
  await body.getByText('Herbstangebote').waitFor();
  ok('Newsletter preserves original table, colors and offer instead of tracking-URL text',await body.locator('table').getAttribute('bgcolor')==='#fff5dc'&&await body.locator('h1').evaluate(e=>getComputedStyle(e).color)==='rgb(19, 107, 114)');
  ok('Embedded CID image resolves from MIME and loads',await body.getByAltText('Shop logo').evaluate(e=>e.complete&&e.naturalWidth===1&&e.src.startsWith('data:image/png;base64,')));
  await body.getByAltText('Werbung').evaluate(e=>e.decode());
  ok('HTTPS newsletter image loads without changing the raw message',remote.includes('https://images.example.invalid/banner.png')&&await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='send').length===0));
  ok('Email scripts, events, forms, foreign frames and app-origin images are removed',await body.locator('script,form,iframe,svg,link,meta[http-equiv="refresh"],[onload],[onerror],img[src^="https://localhost"]').count()===0&&await page.evaluate(()=>window.mailExecuted===false));
  ok('Original web links retained, unsafe schemes removed',await body.getByText('Zum Angebot').getAttribute('href')==='https://shop.example.invalid/offer'&&await body.getByText('Unsafe',{exact:true}).getAttribute('href')===null);
  ok('Email is in an opaque origin without script or native-bridge permission',await frame.getAttribute('sandbox')===''&&await page.evaluate(()=>{try{document.querySelector('.mail-html').contentWindow.document;return false;}catch(e){return e.name==='SecurityError';}}));
  ok('No active email resource requests escaped the viewer',!remote.some(u=>u.includes('blocked.example.invalid')));
  ok('Inline images do not duplicate the attachment list; attachment index stays MIME-bound',await mail.getByRole('button',{name:'↓ logo.png',exact:true}).count()===0);
  await mail.getByRole('button',{name:'↓ test.txt',exact:true}).click();
  ok('Download index includes preceding inline MIME parts',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='openAttachment').at(-1).args.index===1));
  const imageRequests=remote.filter(u=>u==='https://images.example.invalid/banner.png').length;
  await mail.getByRole('button',{name:'Externe Bilder ausblenden',exact:true}).click();
  await frame.waitFor({state:'visible'});
  await body.getByText('Herbstangebote').waitFor();
  ok('Disabled external images make no new network request',remote.filter(u=>u==='https://images.example.invalid/banner.png').length===imageRequests);
  ok('External images can be disabled while CID images remain',await body.getByAltText('Werbung').getAttribute('src')===null&&await body.getByAltText('Shop logo').getAttribute('src').then(s=>s.startsWith('data:')));
  await mail.getByRole('button',{name:'Textansicht',exact:true}).click();
  ok('Text fallback is available without replacing the HTML original',await mail.locator('.mail-original .mail-text').isVisible());
  await mail.getByRole('button',{name:'Originalansicht',exact:true}).click();
  await mail.getByRole('button',{name:'Externe Bilder laden',exact:true}).click();
  for(const width of [320,768,1280,1920]) {
    await page.setViewportSize({width,height:width===320?640:900});
    await page.evaluate(()=>document.fonts.ready);
    ok(`${width}px: mailbox fills available width and page height without scrolling the whole app`,await page.evaluate(()=>{const r=document.querySelector('#mailWorkspace').getBoundingClientRect();return r.width>=innerWidth-40&&r.bottom<=innerHeight&&r.top>0&&Math.abs(document.querySelector(".wrap").getBoundingClientRect().top)<2&&document.body.scrollTop===0&&document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth;}));
    ok(`${width}px: original message remains reachable`,await frame.isVisible());
    if(width>=1280)ok(`${width}px: folder, message list and reader occupy separate full-height panes`,await page.evaluate(()=>{const ns=['.mail-folders','.mail-list','.mail-reader'].map(s=>document.querySelector('.live-mail '+s).getBoundingClientRect());return ns.every(r=>r.height>300)&&Math.abs(ns[0].top-ns[2].top)<2;}));
    await mail.locator('.live-mail .mail-reader').evaluate(e=>e.scrollTop=0);
    if(process.env.PB_CAPTURE_DESIGN==='1') { await page.waitForTimeout(600); await page.screenshot({path:`docs/design/mail-preview6/nachher-postfach-${width}.png`}); }
  }
  await clickControl(page,'#themeToggle');
  if(process.env.PB_CAPTURE_DESIGN==='1') { await page.waitForTimeout(600); await page.screenshot({path:'docs/design/mail-preview6/nachher-postfach-dunkel-1920.png'}); }
  await page.evaluate(()=>PBMailDevice.addAccount());
  ok('Native account dialog receives the existing dark theme',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='addAccount').at(-1).args.dark===true));
  ok('Dark app keeps newsletter colors in its isolated original view',await body.locator('h1').evaluate(e=>getComputedStyle(e).color)==='rgb(19, 107, 114)');
  await clickControl(page,'#themeToggle');
  await page.setViewportSize({width:1280,height:900});
  await button('compose').first().click();
  await page.fill('#pb-live-to','receiver@example.invalid');await page.fill('#pb-live-subject','Native draft');await page.fill('#pb-live-text','Native draft body');
  await button('draft').click();
  ok('Draft save sends the current draft only to the native private store',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='saveDraft'&&c.args.draft.text==='Native draft body'&&c.args.draft.submission)));
  await mail.locator('.live-mail [data-mail-folder=draft]').click();
  ok('Draft folder includes encrypted device drafts',await mail.locator('[data-native-saved="draft-fixture"]').isVisible());
  await mail.locator('[data-native-saved="draft-fixture"]').click();
  await button('restore').waitFor({state:'visible'});
  await button('restore').click();
  ok('Saved local draft restores text and original submission ID',await page.locator('#pb-live-text').inputValue()==='Native draft body'&&await page.evaluate(()=>window.localDraft.submission===window.mailCalls.find(c=>c.method==='saveDraft').args.draft.submission));
  await button('send').click();
  await page.waitForFunction(()=>document.querySelector('.live-mail .mail-reader')?.textContent.includes('Versand unklar'));
  ok('Unknown send result is visible and clears the automatic send action',await page.locator('#pb-live-text').count()===0);
  ok('The unclear result keeps its own wording and has the way back to the list above it',await mail.locator('.live-mail .mail-reader > [data-live-text=back]').count()===1&&(await mail.locator('.live-mail .mail-reader').textContent()).includes('Kein automatischer Neuversand')&&await mail.locator('.live-mail > .mail-notice').textContent()==='Versand unklar – nicht erneut senden');
  await button('refresh').click();
  ok('Refreshing does not automatically resend',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='send').length===1));
  await mail.locator('.live-mail [data-mail-folder=outbox]').click();
  ok('Outbox shows uncertain attempts without retry',await mail.locator('[data-native-saved="outbox-fixture"]').isVisible()&&await mail.locator('[data-live-text=restore]').count()===0);
  for(const lang of ['en','ru','pl','de']){
    await clickControl(page,`[data-lang="${lang}"]`);
    ok(`${lang}: connected folders keep the translated local labels and explicit line icons`,await page.evaluate(()=>{
      const icons={inbox:'inbox',draft:'compose',outbox:'send',sent:'read',archive:'archive',spam:'warning',trash:'trash',exported:'external'};
      return [...document.querySelectorAll('.live-mail .mail-folders [data-mail-folder]')].slice(0,8).every(b=>[...b.childNodes].filter(part=>part.nodeType===Node.TEXT_NODE).map(part=>part.textContent).join('').trim()===PBMailUI.text(b.dataset.mailFolder)&&b.querySelector('.native-folder-icon')?.dataset.iconKey===icons[b.dataset.mailFolder]);
    }));
    ok(`${lang}: outbox status follows language selector`,await mail.locator('[data-native-status]').textContent()==={de:'Versand unklar – nicht erneut senden',en:'Send result unclear – do not resend',ru:'Отправка не подтверждена — не отправляйте повторно',pl:'Wynik nieznany — nie wysyłaj ponownie'}[lang]);
  }
  for(const width of [320,768,1280]){
    await page.setViewportSize({width,height:900});
    ok(`${width}px: native mail history has no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  // Generalprüfung 16.11.2026: nach dem Senden am Handy keine Sackgasse.
  await page.setViewportSize({width:390,height:800});
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();await mail.locator('[data-live-uid="7"]').waitFor();
  await page.evaluate(()=>{window.sendMode='sent';});
  const sendsBefore=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='send').length);
  await button('compose').first().click();
  await page.fill('#pb-live-to','receiver@example.invalid');await page.fill('#pb-live-subject','Gruss');await page.fill('#pb-live-text','Hallo');
  await button('send').click();
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy')&&!document.querySelector('#pb-live-text'));
  const sentState=await page.evaluate(()=>{const app=document.querySelector('.live-mail'),n=app.querySelector(':scope>.mail-notice'),row=app.querySelector('[data-live-uid="7"]'),box=row.getBoundingClientRect(),nb=n.getBoundingClientRect();
    return {view:app.dataset.view,notice:n.textContent,noticeSeen:nb.height>0&&nb.top>=0&&nb.bottom<=innerHeight,rowSeen:box.height>0&&box.top<innerHeight&&getComputedStyle(app.querySelector('.mail-list')).display!=='none',
      reader:app.querySelector('.mail-reader').textContent,back:Boolean(app.querySelector('.mail-reader>[data-live-text=back]')),strong:Number(getComputedStyle(n).fontWeight)>=600&&parseFloat(getComputedStyle(n).fontSize)>=13,sends:window.mailCalls.filter(c=>c.method==='send').length};});
  ok('After sending on the phone a clear sentence says "Gesendet." with the recipient – no "SMTP" wording',sentState.notice==='Gesendet. An: receiver@example.invalid.'&&sentState.noticeSeen&&sentState.strong&&!/SMTP/.test(sentState.notice+sentState.reader),sentState);
  ok('After sending the message list stands there again (no dead end), and the confirmation has the way back above it',sentState.view==='list'&&sentState.rowSeen&&sentState.back,sentState);
  ok('The message was handed to the provider exactly once',sentState.sends===sendsBefore+1,sentState);
  await button('refresh').click();await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  await mail.locator('[data-live-uid="7"]').click();await mail.locator('.live-mail .mail-reader h3').waitFor({state:'visible'});
  await mail.locator('.live-mail .mail-reader [data-live-text=back]').first().click();
  ok('Going back, refreshing and opening a mail never send again',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='send').length)===sendsBefore+1);
  await page.evaluate(()=>{window.sendMode='uncertain';});
  // Menü „Weitere Aktionen“ am Handy: ganz im Bild, alle Einträge lesbar.
  await page.setViewportSize({width:360,height:740});
  await mail.locator('.mail-account-tools>summary').first().click();
  const menuBox=await page.evaluate(()=>{const bar=document.querySelector('#mailWorkspace .live-mail>.mail-head .mail-account-bar'),m=bar.querySelector('.mail-account-menu'),s=bar.querySelector('.mail-account-tools>summary'),r=m.getBoundingClientRect(),sel=bar.querySelector('select').getBoundingClientRect();
    return {left:Math.round(r.left),right:Math.round(r.right),width:innerWidth,items:[...m.querySelectorAll('button')].filter(b=>!b.hidden).map(b=>{const x=b.getBoundingClientRect();return {name:b.getAttribute('aria-label')||b.textContent,left:Math.round(x.left),right:Math.round(x.right),cut:b.scrollWidth>b.clientWidth+1};}),
      name:s.getAttribute('aria-label'),caption:getComputedStyle(s.querySelector('.compact-caption')).display,select:Math.round(sel.width),scroll:document.documentElement.scrollWidth};});
  ok('On a 360 px phone the menu "Weitere Aktionen" lies completely inside the screen',menuBox.left>=0&&menuBox.right<=menuBox.width&&menuBox.scroll<=menuBox.width,menuBox);
  ok('All its entries are still there and readable from their first letter',menuBox.items.length>=6&&menuBox.items.every(i=>i.left>=0&&i.right<=menuBox.width&&!i.cut)&&['Konto hinzufügen','Entwürfe und Versandstatus','Postfach schließen','Kontoverbindung entfernen','Lokale Mails','Diese Seite katalogisieren'].every(n=>menuBox.items.some(i=>i.name===n)),menuBox);
  ok('There the button shows only the three dots and keeps its name; the account choice gets the room',menuBox.name==='Weitere Aktionen'&&menuBox.caption==='none'&&menuBox.select>=120,menuBox);
  await mail.locator('.mail-account-tools>summary').first().click();
  await page.setViewportSize({width:1280,height:900});
  await mail.locator('.mail-account-tools>summary').first().click();
  ok('On a wide screen the menu stays where it was, at its button',await page.evaluate(()=>{const bar=document.querySelector('#mailWorkspace .live-mail>.mail-head .mail-account-bar'),m=bar.querySelector('.mail-account-menu').getBoundingClientRect(),s=bar.querySelector('.mail-account-tools').getBoundingClientRect();return Math.abs(m.right-s.right)<=1&&Math.round(m.width)===320;}));
  await mail.locator('.mail-account-tools>summary').first().click();
  // Klaus 16.11.2026: markierte Mails aus der Liste an die Familienakte. Der Pro-Tresor ist hier gestellt; die echte Übergabe
  // mit Begleitdatei prüft test-pro-verbund.
  await page.evaluate(()=>{
    window.famCalls=[];window.famOpens=0;window.famOpen=true;window.famVault=true;window.famPlan={};window.famGate=null;
    window.inboxItems=[21,22,23].map(uid=>({uid,subject:'Rechnung '+uid,from:'friend@example.invalid',flags:[],size:1000,date:Date.now()}));
    window.subjectByUid={21:'Rechnung 21',22:'Rechnung 22',23:'Rechnung 23'};
    window.PBProVerbund={
      familienakteTresor:async()=>({vorhanden:window.famVault,offen:window.famOpen}),
      familienakteOeffnen:async()=>{window.famOpens++;return window.famOpen;},
      mailAnFamilienakte:async(args,meta)=>{
        const plan=window.famPlan[args.uid]||{ergebnis:'uebergeben',begleit:'ja'},call={args,name:meta.name,still:meta.still,subject:meta.mail?.subject,checksBefore:window.checkStarts.length};
        if(plan.ergebnis!=='schon'&&meta.pruefen)call.geprueft=await meta.pruefen();
        call.checksAfter=window.checkStarts.length;window.famCalls.push(call);
        if(window.famGate&&args.uid===window.famGate.uid)await new Promise(r=>{window.famGate.go=r;});
        return plan;}};
  });
  const fam=mail.locator('.live-mail [data-native-selection=familienakte]'),famSettled=()=>page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  const messagesFetched=()=>page.evaluate(()=>window.mailCalls.filter(c=>c.method==='message').map(c=>c.args.uid));
  // Generalprüfung 16.11.2026: das Ergebnis steht einmal in der Hinweiszeile über der Liste, nicht zusätzlich als Fenster.
  const famNote=()=>mail.locator('.live-mail > .mail-notice').textContent();
  const ticked=()=>mail.locator('.live-mail .mail-list .mail-item:has(input[type=checkbox]:checked) [data-live-uid]').evaluateAll(n=>n.map(b=>Number(b.dataset.liveUid)));
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();await mail.locator('[data-live-uid="21"]').waitFor();
  await page.waitForFunction(()=>{const b=document.querySelector('.live-mail [data-native-selection=familienakte]');return b&&!b.hidden&&b.querySelector('.compact-icon');});
  ok('With a Pro vault the selection bar offers "An Familienakte": a line icon, the name in title and aria-label, flat like its neighbours',await fam.getAttribute('aria-label')==='An Familienakte'&&await fam.getAttribute('title')==='An Familienakte'&&await fam.locator('.compact-icon[data-icon-key=share]').count()===1&&await fam.locator('.compact-caption').count()===0&&await page.evaluate(()=>{const h=s=>Math.round(document.querySelector('.live-mail [data-native-selection='+s+']').getBoundingClientRect().height);return h('familienakte')===h('trash')&&!/\p{Extended_Pictographic}/u.test(document.querySelector('.live-mail [data-native-selection=familienakte]').textContent);}));
  ok('Nothing is handed over before a mail is marked',await fam.isDisabled());
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('.live-mail [data-native-selection=familienakte]')?.getAttribute('aria-label')==='To Familienakte');
  ok('The list button follows the language',true);
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.waitForFunction(()=>document.querySelector('.live-mail [data-native-selection=familienakte]')?.getAttribute('aria-label')==='An Familienakte');
  await page.evaluate(()=>{window.famPlan={22:{ergebnis:'schon'},23:{ergebnis:'fehler',grund:'zuGross'}};window.famGate={uid:22};window.mailCalls=window.mailCalls.filter(c=>!['message','action','openOriginal'].includes(c.method));});
  await mail.locator('.live-mail [data-native-selection=all]').click();
  let dialogCount=dialogs.length;await fam.click();
  await page.waitForFunction(()=>window.famGate?.go);
  const progress=await page.evaluate(()=>({text:document.querySelector('#pb-activity .pb-activity-text')?.textContent,pct:document.querySelector('#pb-activity .pb-activity-pct')?.textContent,hidden:document.querySelector('#pb-activity')?.hidden}));
  ok('While the mails go one after the other the activity line counts them, with per cent',progress.hidden===false&&progress.text==='Mail 2 von 3 an die Familienakte …'&&progress.pct==='33 %',progress);
  await page.evaluate(()=>{const go=window.famGate.go;window.famGate=null;go();});await famSettled();
  let famCalls=await page.evaluate(()=>window.famCalls);
  ok('Each marked mail is fetched from the provider by account, folder, UIDVALIDITY and UID and handed over quietly under its subject',JSON.stringify(await messagesFetched())==='[21,22,23]'&&famCalls.length===3&&famCalls.every((c,i)=>c.still===true&&c.args.uid===21+i&&c.args.folder==='INBOX'&&c.args.validity==='123'&&c.args.account==='11111111-1111-4111-8111-111111111111'&&c.name==='Rechnung '+(21+i)+'.eml'&&c.subject==='Rechnung '+(21+i)),famCalls);
  ok('The attachments of a mail are checked before it is handed over, as in the opened mail',famCalls[0].geprueft===true&&famCalls[0].checksAfter>famCalls[0].checksBefore&&famCalls[2].geprueft===true&&famCalls[2].checksAfter>famCalls[2].checksBefore,famCalls);
  ok('A mail that was already handed over is skipped without a new check',famCalls[1].checksAfter===famCalls[1].checksBefore&&famCalls[1].geprueft===undefined);
  ok('The locked-vault question is asked once for all marked mails, not per mail',await page.evaluate(()=>window.famOpens)===1);
  ok('At the end one sentence gives the numbers: handed over, already handed over, findings of the attachment check, not handed over with the reason',await famNote()==='An die Familienakte übergeben: 1 von 3. Schon früher übergeben, nicht noch einmal geschickt: 1. Bei 1 davon steht etwas im Prüfbericht der Anhänge – Mail öffnen und ansehen. Nicht übergeben: 1 (1 größer als 20 MiB).',await famNote());
  ok('The sentence comes once: in the notice line above the list, clearly visible, and not again as a window to tap away',dialogs.length===dialogCount&&await page.evaluate(()=>{const n=document.querySelector('.live-mail > .mail-notice'),r=n.getBoundingClientRect(),s=getComputedStyle(n);return n.getAttribute('role')==='status'&&n.dataset.mailResult==='offen'&&r.height>0&&r.top>=0&&r.bottom<=innerHeight&&Number(s.fontWeight)>=600&&parseFloat(s.fontSize)>=13;}),dialogs.slice(dialogCount));
  ok('The mail that was not handed over stays ticked – only this one; the ones that went or were known are unticked',JSON.stringify(await ticked())==='[23]'&&await mail.locator('.live-mail .mail-count').textContent()==='1 ausgewählt',await ticked());
  const listCalls=()=>page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').length);
  let listBefore=await listCalls();await page.evaluate(()=>PBLiveMail.autoRefresh());await famSettled();
  ok('While a mail is ticked the automatic refresh every minute leaves the list alone: tick and sentence stay',await listCalls()===listBefore&&JSON.stringify(await ticked())==='[23]'&&(await famNote()).startsWith('An die Familienakte übergeben: 1 von 3.'));
  await page.evaluate(()=>{window.famPlan={};window.famCalls=[];});await fam.click();await famSettled();
  ok('A second tap then hands over exactly the mail that was left; after that nothing is ticked',await page.evaluate(()=>window.famCalls.length===1&&window.famCalls[0].args.uid===23)&&await famNote()==='An die Familienakte übergeben: 1 von 1. Bei 1 davon steht etwas im Prüfbericht der Anhänge – Mail öffnen und ansehen.'&&(await ticked()).length===0&&await page.evaluate(()=>document.querySelector('.live-mail > .mail-notice').dataset.mailResult==='fertig'),await famNote());
  listBefore=await listCalls();await page.evaluate(()=>PBLiveMail.autoRefresh());await famSettled();
  ok('Without ticks the automatic refresh fetches the list as before',await listCalls()===listBefore+1);
  ok('Handing over from the list neither opens nor marks a mail as read, shares nothing outside',await page.evaluate(()=>!window.mailCalls.some(c=>c.method==='action'||c.method==='openOriginal'))&&await mail.locator('.live-mail .mail-count').textContent()==='0 ausgewählt'&&await page.evaluate(()=>document.querySelector('#pb-activity').hidden));
  await page.evaluate(()=>{window.famPlan={21:{ergebnis:'uebergeben',begleit:'nein'}};});
  await mail.locator('.live-mail .mail-item:has([data-live-uid="21"]) input[type=checkbox]').check();await fam.click();await famSettled();
  ok('If only the pre-sorting failed the sentence says "Mail übergeben, Vorsortierung nicht"',await famNote()==='An die Familienakte übergeben: 1 von 1. Mail übergeben, Vorsortierung nicht: 1. Bei 1 davon steht etwas im Prüfbericht der Anhänge – Mail öffnen und ansehen.',await famNote());
  await page.evaluate(()=>{window.famPlan={};window.failMessage=true;window.famCalls=[];});
  await mail.locator('.live-mail .mail-item:has([data-live-uid="22"]) input[type=checkbox]').check();await fam.click();await famSettled();
  ok('A mail that cannot be loaded from the provider is not handed over, is named and stays ticked',await famNote()==='An die Familienakte übergeben: 0 von 1. Nicht übergeben: 1 (1 beim Anbieter nicht ladbar).'&&await page.evaluate(()=>window.famCalls.length===0)&&JSON.stringify(await ticked())==='[22]',await famNote());
  await page.evaluate(()=>{window.failMessage=false;window.famOpen=false;window.mailCalls=window.mailCalls.filter(c=>c.method!=='message');});
  await mail.locator('.live-mail [data-native-selection=all]').click();await fam.click();await famSettled();
  ok('Vault stays locked: nothing is fetched or handed over, the selection stays',await famNote()==='Nichts übergeben: Der Pro-Tresor ist nicht offen.'&&(await messagesFetched()).length===0&&await page.evaluate(()=>window.famCalls.length===0)&&await mail.locator('.live-mail .mail-count').textContent()==='3 ausgewählt',await famNote());
  await page.evaluate(()=>{window.famOpen=true;window.famOpens=0;window.inboxItems=Array.from({length:21},(_,i)=>({uid:100+i,subject:'Viele '+i,from:'friend@example.invalid',flags:[],size:1000}));});
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();await mail.locator('[data-live-uid="100"]').waitFor();
  // Klaus 22.11.2026: die Liste zeigt erst 15 Mails, „Weitere laden“ die nächsten; „Alle auswählen“ gilt für die gezeigten.
  ok('A long list shows 15 mails first and "Weitere laden" below',await mail.locator('.live-mail [data-live-uid]').count()===15&&await mail.locator('.live-mail .mail-list>[data-live-text=more]').isVisible());
  await mail.locator('.live-mail .mail-list>[data-live-text=more]').click();await mail.locator('[data-live-uid="120"]').waitFor();
  ok('"Weitere laden" shows the rest without asking the server again',await mail.locator('.live-mail [data-live-uid]').count()===21&&await mail.locator('.live-mail .mail-list>[data-live-text=more]').count()===0);
  await mail.locator('.live-mail [data-native-selection=all]').click();await fam.click();await famSettled();
  ok('More than 20 marked mails: nothing starts, the limit is named',/^Höchstens 20 Mails auf einmal an die Familienakte – markiert sind 21\./.test(await famNote())&&(await messagesFetched()).length===0&&await page.evaluate(()=>window.famOpens===0&&window.famCalls.length===0),await famNote());
  await page.evaluate(()=>{window.famVault=false;window.inboxItems=null;});
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();await mail.locator('[data-live-uid="7"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.live-mail [data-native-selection=familienakte]')?.hidden===true);
  ok('Without a Pro vault the button is not shown in the list',await fam.isHidden());
  await page.evaluate(()=>{delete window.PBProVerbund;});
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();
  await mail.locator('.live-mail [data-native-selection=all]').click();
  await page.evaluate(()=>{window.mailAccounts.push({id:'22222222-2222-4222-8222-222222222222',email:'second@example.invalid',provider:'hetzner'});const select=document.querySelector('.mail-account-bar select');select.add(new Option('second@example.invalid','22222222-2222-4222-8222-222222222222'));});
  await mail.locator('.mail-account-bar select').selectOption('22222222-2222-4222-8222-222222222222');
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  ok('Account switch fetches the new account and clears previous selection',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.account==='22222222-2222-4222-8222-222222222222')&&await mail.locator('.live-mail .mail-count').textContent()==='0 ausgewählt');
  ok('Outbox count does not leak between accounts',await mail.locator('.live-mail [data-mail-folder=outbox] small').textContent()==='0');
  // Passwort erneuern (Klaus 19.11.2026): im Menü, nur für Passwort-Konten, ruft das Gerät mit genau dieser Kennung;
  // das Passwort selbst geht nie durch die Seite (der native Dialog fragt es ab), Abbrechen ändert nichts.
  await mail.locator('.mail-account-tools>summary').click();
  ok('"Passwort erneuern" stands in the account menu for a password account',await button('renewPassword').isVisible()&&(await button('renewPassword').innerText()).trim()==='Passwort erneuern');
  await page.evaluate(()=>{window.renewMode='cancel';});await button('renewPassword').click();
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  const renewCalls=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='renewPassword'));
  ok('Renewing asks the device for exactly this account, with only account, language and theme',renewCalls.length===1&&renewCalls[0].args.account==='22222222-2222-4222-8222-222222222222'&&Object.keys(renewCalls[0].args).sort().join(',')==='account,dark,language');
  ok('Cancelling the renewal changes nothing and shows no error',!/fehlgeschlagen|failed/i.test(await mail.locator('.live-mail .mail-notice').first().textContent()));
  // Ein Google-Konto kommt dazu; die Konten werden nach dem erfolgreichen Erneuern neu gelesen.
  await page.evaluate(()=>{window.mailAccounts.push({id:'33333333-3333-4333-8333-333333333333',email:'g@gmail.example',provider:'gmail',authType:'oauth2'});const select=document.querySelector('.mail-account-bar select');select.add(new Option('g@gmail.example','33333333-3333-4333-8333-333333333333'));});
  const foldersBefore=await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='folders').length);
  await page.evaluate(()=>{window.renewMode='';});await mail.locator('.mail-account-tools>summary').click();await button('renewPassword').click();
  await page.waitForFunction(n=>window.mailCalls.filter(c=>c.method==='folders').length>n,foldersBefore);
  ok('After a successful renewal the folders are loaded again and the notice says so',await page.evaluate(()=>document.querySelector('.live-mail .mail-notice').textContent).then(t=>/Neues Passwort gespeichert/.test(t)));
  await mail.locator('.mail-account-bar select').selectOption('33333333-3333-4333-8333-333333333333');
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  ok('A Google account has no "Passwort erneuern" (Google renews through its own sign-in)',await page.evaluate(()=>document.querySelector('[data-live-text="renewPassword"]').hidden));
  await mail.locator('.mail-account-bar select').selectOption('22222222-2222-4222-8222-222222222222');
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  await page.evaluate(()=>{window.mailAccounts=window.mailAccounts.filter(a=>a.provider!=='gmail');});
  await mail.locator('.mail-account-tools>summary').click();
  await button('removeAccount').click();
  ok('Removing final native account clears old message UI and returns to local mailbox',await mail.locator('.live-mail').isHidden()&&await mail.locator('.live-mail .mail-reader').textContent()==='');
  ok('No private HTTP mail service is contacted',remote.filter(u=>u.includes('/api/mail')).length===0);
  ok('No runtime errors in native mailbox flow',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} native mail UI checks passed (simulated native transport; no real provider login).`);
