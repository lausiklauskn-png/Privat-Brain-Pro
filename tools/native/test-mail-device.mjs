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
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.route('**/*',r=>{
    if(r.request().url().startsWith(url))return r.continue();
    remote.push(r.request().url());return r.abort();
  });
  await page.addInitScript(()=>{
    window.mailCalls=[];window.mailAccounts=[];window.accountMode='cancel';window.sendMode='uncertain';window.localDraft=null;
    const fixture={id:'11111111-1111-4111-8111-111111111111',email:'sender@example.invalid',provider:'telekom'};
    const log=(method,args)=>window.mailCalls.push({method,args});
    window.Capacitor={Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.4-debug',nativeMail:true};}},
      ProMail:{
        async accounts(args){log('accounts',args);if(window.accountMode==='vaultError')throw{code:'VAULT_UNAVAILABLE'};return{items:window.mailAccounts};},
        async addAccount(args){log('addAccount',args);if(window.accountMode==='cancel')throw{code:'CANCELLED'};window.mailAccounts=[fixture];return fixture;},
        async folders(args){log('folders',args);return{items:[{path:'INBOX',name:'INBOX',specialUse:''},{path:'Sent',name:'Sent',specialUse:'\\Sent'}]};},
        async messages(args){log('messages',args);return{validity:'123',items:[{uid:7,subject:'Native <img src=x onerror=alert(1)>',from:'friend@example.invalid',flags:[],size:1000}],next:null};},
        async message(args){log('message',args);return{subject:'Native message',from:'friend@example.invalid',to:fixture.email,messageId:'<fixture@example.invalid>',replyTo:'friend@example.invalid',text:'Direct native inbox text',raw:'From: friend@example.invalid\r\nTo: sender@example.invalid\r\nSubject: Native message\r\n\r\nDirect native inbox text',attachments:[{name:'test.txt',type:'text/plain',data:btoa('Local attachment test')}]};},
        async action(args){log('action',args);return{ok:true};},
        async openAttachment(args){log('openAttachment',args);return{ok:true};},
        async openOriginal(args){log('openOriginal',args);return{ok:true};},
        async saveDraft(args){log('saveDraft',args);window.localDraft=structuredClone(args.draft);return{ok:true};},
        async saved(args){log('saved',args);return{items:window.localDraft?[{id:'draft-fixture',status:'draft',subject:window.localDraft.subject,to:window.localDraft.to,created:Date.now()}]:[]};},
        async savedDraft(args){log('savedDraft',args);return structuredClone(window.localDraft);},
        async send(args){log('send',args);return{status:window.sendMode,noticeCode:window.sendMode==='uncertain'?'SEND_UNCERTAIN':''};},
        async removeAccount(args){log('removeAccount',args);window.mailAccounts=[];return{ok:true};}
      }
    }};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.locator('[data-tab="mail"]').click();
  const mail=page.locator('#mailWorkspace');
  const button=key=>mail.locator(`[data-live-text="${key}"]`);
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
  ok('Only language and theme cross the native credential-entry boundary',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='addAccount').every(c=>Object.keys(c.args).sort().join(',')==='dark,language')));
  ok('Mail subject is displayed as text, never inserted as HTML',await mail.locator('.live-mail img').count()===0);
  await mail.locator('[data-live-uid="7"]').click();
  await mail.locator('.mail-reader .mail-text').waitFor({state:'visible'});
  ok('Message text arrives through the native bridge',await mail.locator('.mail-reader .mail-text').textContent()==='Direct native inbox text');
  ok('Read action is bound to account, UID and UIDVALIDITY',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='action'&&c.args.uid===7&&c.args.validity==='123'&&c.args.folder==='INBOX'&&c.args.account==='11111111-1111-4111-8111-111111111111')));
  await mail.getByRole('button',{name:'↓ test.txt',exact:true}).click();
  ok('Attachment uses scoped native open operation',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openAttachment'&&c.args.index===0&&c.args.uid===7&&c.args.validity==='123')));
  await button('download').first().click();
  ok('Original EML uses native share/export, not unsupported blob download',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='openOriginal'&&c.args.uid===7)));
  await button('compose').first().click();
  await page.fill('#pb-live-to','receiver@example.invalid');await page.fill('#pb-live-subject','Native draft');await page.fill('#pb-live-text','Native draft body');
  await button('draft').click();
  ok('Draft save sends the current draft only to the native private store',await page.evaluate(()=>window.mailCalls.some(c=>c.method==='saveDraft'&&c.args.draft.text==='Native draft body'&&c.args.draft.submission)));
  await button('saved').click();
  await button('restore').waitFor({state:'visible'});
  await button('restore').click();
  ok('Saved local draft restores text and original submission ID',await page.locator('#pb-live-text').inputValue()==='Native draft body'&&await page.evaluate(()=>window.localDraft.submission===window.mailCalls.find(c=>c.method==='saveDraft').args.draft.submission));
  await button('send').click();
  await page.waitForFunction(()=>document.querySelector('.live-mail .mail-reader')?.textContent.includes('Versand unklar'));
  ok('Unknown send result is visible and clears the automatic send action',await page.locator('#pb-live-text').count()===0);
  await button('refresh').click();
  ok('Refreshing does not automatically resend',await page.evaluate(()=>window.mailCalls.filter(c=>c.method==='send').length===1));
  await button('saved').click();
  for(const lang of ['en','ru','pl','de']){
    await page.locator(`[data-lang="${lang}"]`).click();
    ok(`${lang}: local draft status follows language selector`,await mail.locator('[data-native-status]').textContent()==={de:'Entwurf',en:'Draft',ru:'Черновик',pl:'Szkic'}[lang]);
  }
  for(const width of [320,768,1280]){
    await page.setViewportSize({width,height:900});
    ok(`${width}px: native mail history has no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await button('removeAccount').click();
  ok('Removing final native account clears old message UI and returns to local mailbox',await mail.locator('.live-mail').isHidden()&&await mail.locator('.live-mail .mail-reader').textContent()==='');
  ok('No private HTTP mail service is contacted',remote.filter(u=>u.includes('/api/mail')).length===0);
  ok('No runtime errors in native mailbox flow',errors.length===0);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log(`${count} native mail UI checks passed (simulated native transport; no real provider login).`);
