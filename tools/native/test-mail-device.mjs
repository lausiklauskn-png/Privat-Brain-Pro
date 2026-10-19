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
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  // Keep srcdoc resource interception in this test transport's target. DOM origin/sandbox
  // restrictions remain enforced; Android tests also check the default WebView boundary.
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-site-isolation-trials']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.context().route('**/*',r=>{
    if(r.request().url().startsWith(url))return r.continue();
    if(r.request().url()==='https://images.example.invalid/banner.png') { remote.push(r.request().url()); return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBv8AAAAASUVORK5CYII=','base64')}); }
    remote.push(r.request().url());return r.abort();
  });
  await page.addInitScript(()=>{
    window.mailCalls=[];window.mailAccounts=[];window.accountMode='cancel';window.sendMode='uncertain';window.localDraft=null;window.messageMode='plain';window.sendReceipts=[];window.failFolder='';window.historyAccount='';
    const fixture={id:'11111111-1111-4111-8111-111111111111',email:'sender@example.invalid',provider:'telekom'};
    const log=(method,args)=>window.mailCalls.push({method,args});
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.4-debug',nativeMail:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);if(window.accountMode==='vaultError')throw{code:'VAULT_UNAVAILABLE'};return{items:window.mailAccounts};},
        async addAccount(args){log('addAccount',args);if(window.accountMode==='cancel')throw{code:'CANCELLED'};window.mailAccounts=[fixture];return fixture;},
        async folders(args){log('folders',args);return{items:[{path:'INBOX',name:'INBOX',specialUse:''},{path:'Spam',name:'Spam',specialUse:''},{path:'Trash',name:'Trash',specialUse:''},{path:'Sent',name:'Sent',specialUse:''},{path:'Erledigt',name:'Erledigt',specialUse:''},{path:'Drafts',name:'Drafts',specialUse:''},{path:'Archiv',name:'Archiv',specialUse:''},{path:'@not-virtual',name:'@not-virtual',specialUse:''},{path:'@outbox',name:'@outbox',specialUse:''}]};},
        async messages(args){log('messages',args);if(args.folder===window.failFolder)throw{code:'CONNECTION_FAILED'};return{validity:'123',total:args.folder==='INBOX'?125:args.folder==='@outbox'?3:0,items:args.folder==='INBOX'?[{uid:7,subject:'Native <img src=x onerror=alert(1)>',from:'friend@example.invalid',flags:[],size:1000}]:[],next:null};},
        async message(args){log('message',args);return{subject:'Native message',from:'friend@example.invalid',to:fixture.email,messageId:'<fixture@example.invalid>',replyTo:'friend@example.invalid',html:window.messageMode==='html'?`<html><head><style>body{background:#fff}td{padding:16px}.offer{color:#136b72}</style><link rel="stylesheet" href="https://blocked.example.invalid/style.css"><meta http-equiv="refresh" content="0;url=https://blocked.example.invalid/redirect"></head><body onload="parent.mailExecuted=true"><table width="600" bgcolor="#fff5dc"><tr><td><img alt="Shop logo" src="cid:logo@example.invalid"><h1 class="offer">Herbstangebote</h1><p>31 % Rabatt auf ausgewählte Artikel</p><img alt="Werbung" src="https://images.example.invalid/banner.png"><a href="https://shop.example.invalid/offer">Zum Angebot</a><a href="javascript:parent.mailExecuted=true">Unsafe</a><img src="https://localhost/secrets" onerror="parent.mailExecuted=true"><script>parent.mailExecuted=true</script><form action="https://blocked.example.invalid/post"><input name="secret"></form><iframe src="https://blocked.example.invalid/frame"></iframe><svg onload="parent.mailExecuted=true"></svg></td></tr></table></body></html>`:'',text:'Direct native inbox text',raw:'From: friend@example.invalid\r\nTo: sender@example.invalid\r\nSubject: Native message\r\n\r\nDirect native inbox text',attachments:[...(window.messageMode==='html'?[{name:'logo.png',type:'image/png',contentId:'logo@example.invalid',inline:true,data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBv8AAAAASUVORK5CYII='}]:[]),{name:'test.txt',type:'text/plain',data:btoa('Local attachment test')}]};},
        async action(args){log('action',args);return{ok:true};},
        async openAttachment(args){log('openAttachment',args);return{ok:true};},
        async openOriginal(args){log('openOriginal',args);return{ok:true};},
        async saveDraft(args){log('saveDraft',args);window.localDraft=structuredClone(args.draft);window.historyAccount=args.account;return{ok:true};},
        async saved(args){log('saved',args);return{items:args.account!==window.historyAccount?[]:window.sendReceipts.length?window.sendReceipts:window.localDraft?[{id:'draft-fixture',status:'draft',subject:window.localDraft.subject,to:window.localDraft.to,created:Date.now()}]:[]};},
        async savedDraft(args){log('savedDraft',args);return structuredClone(window.localDraft);},
        async send(args){log('send',args);window.historyAccount=args.account;window.sendReceipts=[{id:'outbox-fixture',status:window.sendMode,subject:args.draft.subject,to:args.draft.to,created:Date.now()}];return{status:window.sendMode,noticeCode:window.sendMode==='uncertain'?'SEND_UNCERTAIN':''};},
        async removeAccount(args){log('removeAccount',args);window.mailAccounts=[];return{ok:true};}
      }
    }};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  const mail=page.locator('#mailWorkspace');
  const button=key=>mail.locator(`[data-live-text="${key}"]`);
  const baselineStyle=await mail.locator('.mail-app:not(.live-mail) [data-mail-text=compose]').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundImage,color:s.color,font:s.fontFamily,border:s.borderRadius};});
  const baseline=await mail.locator('.mail-app:not(.live-mail) .mail-folders [data-mail-folder]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.mailFolder,label:n.firstChild.textContent})));
  if(process.env.PB_CAPTURE_DESIGN==='1')await page.screenshot({path:'docs/design/mail-preview6/vorher-konto.png'});
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
  const connected=await mail.locator('.live-mail .mail-folders [data-mail-folder]').evaluateAll(nodes=>nodes.slice(0,8).map(n=>({id:n.dataset.mailFolder,label:n.firstChild.textContent})));
  ok('Same eight folder labels, symbols and order before and after account activation',JSON.stringify(baseline)===JSON.stringify(connected));
  ok('Inbox count comes from provider total, not the 50-message page',await mail.locator('.live-mail [data-mail-folder=inbox] small').textContent()==='125');
  ok('Inbox/Trash/Sent are presented in German',await mail.locator('.live-mail [data-mail-folder=inbox]').textContent().then(s=>s.includes('Posteingang'))&&await mail.locator('.live-mail [data-mail-folder=trash]').textContent().then(s=>s.includes('Papierkorb'))&&await mail.locator('.live-mail [data-mail-folder=sent]').textContent().then(s=>s.includes('Gesendet')));
  ok('Custom provider folder remains unchanged',await mail.locator('.live-mail [data-live-folder=Erledigt]').textContent().then(s=>s.includes('Erledigt')));
  await mail.locator('.live-mail [data-mail-folder=sent]').click();
  ok('Translated Sent fetches original provider path',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.folder==='Sent')&&await mail.locator('.live-mail .mail-notice').textContent().then(s=>s.includes('Gesendet')));
  await mail.locator('.live-mail [data-live-folder="@not-virtual"]').click();
  ok('Provider names beginning with @ remain real folders',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.folder==='@not-virtual'));
  await mail.locator('.live-mail [data-mail-folder="provider:@outbox"]').click();
  ok('Custom @outbox cannot collide with native outbox label or counters',await mail.locator('.live-mail .mail-notice').textContent().then(s=>s.endsWith('@outbox'))&&await mail.locator('.live-mail [data-mail-folder="provider:@outbox"] small').textContent()==='3'&&await mail.locator('.live-mail [data-mail-folder=outbox] small').textContent()==='0');
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();
  await mail.locator('.live-mail [data-native-selection=all]').click();
  ok('Standard selection toolbar selects provider messages',await mail.locator('.live-mail .mail-count').textContent()==='1 ausgewählt');
  await mail.locator('.live-mail [data-native-selection=trash]').click();
  ok('Trash uses original account/folder/UIDVALIDITY/UID and provider target',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='action'&&c.args.action==='move'&&c.args.target==='Trash'&&c.args.folder==='INBOX'&&c.args.validity==='123'&&c.args.uid===7)));
  await mail.locator('.live-mail [data-mail-folder=trash]').click();
  ok('Unconfirmed Trash alias never grants permanent deletion',await mail.locator('.live-mail [data-native-selection=trash]').isDisabled());
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
  await mail.locator('.mail-message-tools>summary').click();
  await button('download').first().click();
  ok('Original EML uses native share/export, not unsupported blob download',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openOriginal'&&c.args.uid===7)));
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
    await page.setViewportSize({width,height:1000});
    await page.evaluate(()=>document.fonts.ready);
    ok(`${width}px: mailbox fills available width and page height without scrolling the whole app`,await page.evaluate(()=>{const r=document.querySelector('#mailWorkspace').getBoundingClientRect();return r.width>=innerWidth-40&&r.bottom<=innerHeight&&r.top>0&&Math.abs(document.querySelector(".wrap").getBoundingClientRect().top)<2&&document.body.scrollTop===0&&document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth;}));
    ok(`${width}px: original message remains reachable`,await frame.isVisible());
    if(width>=1280)ok(`${width}px: folder, message list and reader occupy separate full-height panes`,await page.evaluate(()=>{const ns=['.mail-folders','.mail-list','.mail-reader'].map(s=>document.querySelector('.live-mail '+s).getBoundingClientRect());return ns.every(r=>r.height>300)&&Math.abs(ns[0].top-ns[2].top)<2;}));
    await mail.locator('.live-mail .mail-reader').evaluate(e=>e.scrollTop=0);
    if(process.env.PB_CAPTURE_DESIGN==='1') { await page.waitForTimeout(600); await page.screenshot({path:`docs/design/mail-preview6/nachher-postfach-${width}.png`}); }
  }
  await page.locator('#themeToggle').click();
  if(process.env.PB_CAPTURE_DESIGN==='1') { await page.waitForTimeout(600); await page.screenshot({path:'docs/design/mail-preview6/nachher-postfach-dunkel-1920.png'}); }
  await page.evaluate(()=>PBMailDevice.addAccount());
  ok('Native account dialog receives the existing dark theme',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='addAccount').at(-1).args.dark===true));
  ok('Dark app keeps newsletter colors in its isolated original view',await body.locator('h1').evaluate(e=>getComputedStyle(e).color)==='rgb(19, 107, 114)');
  await page.locator('#themeToggle').click();
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
  await button('refresh').click();
  ok('Refreshing does not automatically resend',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='send').length===1));
  await mail.locator('.live-mail [data-mail-folder=outbox]').click();
  ok('Outbox shows uncertain attempts without retry',await mail.locator('[data-native-saved="outbox-fixture"]').isVisible()&&await mail.locator('[data-live-text=restore]').count()===0);
  for(const lang of ['en','ru','pl','de']){
    await page.locator(`[data-lang="${lang}"]`).click();
    ok(`${lang}: connected folders match the local mailbox labels`,await page.evaluate(()=>[...document.querySelectorAll('.live-mail .mail-folders [data-mail-folder]')].slice(0,8).every(b=>b.firstChild.textContent===PBMailUI.icons[b.dataset.mailFolder]+' '+PBMailUI.text(b.dataset.mailFolder))));
    ok(`${lang}: outbox status follows language selector`,await mail.locator('[data-native-status]').textContent()==={de:'Versand unklar – nicht erneut senden',en:'Send result unclear – do not resend',ru:'Отправка не подтверждена — не отправляйте повторно',pl:'Wynik nieznany — nie wysyłaj ponownie'}[lang]);
  }
  for(const width of [320,768,1280]){
    await page.setViewportSize({width,height:900});
    ok(`${width}px: native mail history has no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await mail.locator('.live-mail [data-mail-folder=inbox]').click();
  await mail.locator('.live-mail [data-native-selection=all]').click();
  await page.evaluate(()=>{window.mailAccounts.push({id:'22222222-2222-4222-8222-222222222222',email:'second@example.invalid',provider:'hetzner'});const select=document.querySelector('.mail-account-bar select');select.add(new Option('second@example.invalid','22222222-2222-4222-8222-222222222222'));});
  await mail.locator('.mail-account-bar select').selectOption('22222222-2222-4222-8222-222222222222');
  await page.waitForFunction(()=>!document.querySelector('.live-mail').hasAttribute('aria-busy'));
  ok('Account switch fetches the new account and clears previous selection',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='messages').at(-1).args.account==='22222222-2222-4222-8222-222222222222')&&await mail.locator('.live-mail .mail-count').textContent()==='0 ausgewählt');
  ok('Outbox count does not leak between accounts',await mail.locator('.live-mail [data-mail-folder=outbox] small').textContent()==='0');
  await mail.locator('.mail-account-tools>summary').click();
  await button('removeAccount').click();
  ok('Removing final native account clears old message UI and returns to local mailbox',await mail.locator('.live-mail').isHidden()&&await mail.locator('.live-mail .mail-reader').textContent()==='');
  ok('No private HTTP mail service is contacted',remote.filter(u=>u.includes('/api/mail')).length===0);
  ok('No runtime errors in native mailbox flow',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} native mail UI checks passed (simulated native transport; no real provider login).`);
