import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep))return res.writeHead(403).end();
  try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);count++;console.log('✓ '+name);};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],url=`http://127.0.0.1:${server.address().port}/`;
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{
    const first={id:'11111111-1111-4111-8111-111111111111',email:'fixture@telekom.invalid',provider:'telekom'};
    const google={id:'22222222-2222-4222-8222-222222222222',email:'fixture@googlemail.com',provider:'gmail'};
    window.firstAccount=first.id;window.googleAccount=google.id;window.calls=[];window.failures={};
    const record={id:'queued-fixture',status:'queued',subject:'Unsent Google draft',to:'fixture@googlemail.com',created:1};
    const answer=(name,args,value)=>{window.calls.push({name,args});const failure=window.failures[name];if(failure==='cancel')throw{code:'CANCELLED',message:'private provider response'};if(failure==='null')return null;if(failure==='array')return{items:null};if(failure==='scalar')return{items:[null]};if(failure==='defer')return new Promise(resolve=>window.finishFolders=()=>resolve(value));if(failure)throw{code:failure,message:'private provider response'};return value;};
    window.Capacitor={Plugins:{ProMail:{
      accounts:async args=>answer('accounts',args,{items:[first,google]}),
      addAccount:async args=>answer('addAccount',args,google),
      folders:async args=>answer('folders',args,{items:[{path:'INBOX',name:'INBOX',specialUse:''},{path:args.account===first.id?'Erledigt':'GoogleOnly',name:args.account===first.id?'Erledigt':'GoogleOnly',specialUse:''}]}),
      messages:async args=>answer('messages',args,{items:[{uid:args.account===first.id?7:9,subject:args.account===first.id?'Telekom-only subject':'Google subject',from:'fixture@example.invalid',flags:[],size:100}],validity:args.account===first.id?'123':'456',next:null,total:args.account===first.id?125:2}),
      message:async args=>answer('message',args,{subject:'Telekom-only reader',from:'fixture@example.invalid',to:first.email,text:'Old account body',attachments:[]}),
      action:async args=>answer('action',args,{ok:true}),
      saved:async args=>answer('saved',args,{items:args.account===google.id?[record]:[]}),
      savedDraft:async args=>answer('savedDraft',args,{subject:record.subject,to:record.to,text:'Preserved draft',submission:'same-draft'}),
      send:async args=>answer('send',args,{status:'sent'})
    }}};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBMailDevice&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.click('[data-tab=mail]');const mail=page.locator('#mailWorkspace'),live=mail.locator('.live-mail'),select=mail.locator('.mail-account-bar select').first();
  const settled=()=>page.waitForFunction(()=>document.querySelector('.live-mail')?.getAttribute('aria-busy')!=='true');
  const choose=async id=>{await select.selectOption(id);await settled();};
  await mail.locator('[data-live-text=connect]').click();await mail.locator('[data-live-uid="7"]').waitFor();
  await mail.locator('[data-live-uid="7"]').click();await live.locator('.mail-reader h3').waitFor();
  ok('Initial provider reader and total are present',await live.locator('[data-mail-folder=inbox] small').textContent()==='125');
  await page.evaluate(()=>window.failures.folders='cancel');await choose(await page.evaluate(()=>googleAccount));
  ok('Cancelled folder request shows a readable error without null-items crash',(await live.locator('.mail-notice').textContent()).includes('CANCELLED')&&!(await live.textContent()).includes("reading 'items'"));
  ok('Failed account switch removes previous reader, message IDs and custom folders',await live.locator('[data-live-uid],.mail-reader h3,[data-live-folder=Erledigt]').count()===0);
  ok('Failed switch retains standard mailbox navigation with unknown server total',await live.locator('[data-mail-folder]').count()===8&&await live.locator('[data-mail-folder=inbox] small').textContent()==='–');
  ok('Catalog action cannot act on old account messages',await mail.locator('[data-live-text=catalog]').isDisabled());
  await live.locator('[data-mail-folder=outbox]').click();await settled();
  ok('Unsent draft remains available while Google folder loading fails',await live.locator('[data-native-saved=queued-fixture]').isVisible()&&await live.locator('[data-mail-folder=outbox] small').textContent()==='1');
  await live.locator('[data-native-saved=queued-fixture]').click();await settled();
  ok('Saved queued status is not promoted to sent',(await live.locator('.mail-reader').textContent()).includes('Noch nicht übermittelt'));
  await page.evaluate(()=>delete window.failures.folders);await choose(await page.evaluate(()=>firstAccount));
  ok('Other provider still loads with its own messages and no Google outbox',await live.locator('[data-live-uid="7"]').isVisible()&&await live.locator('[data-mail-folder=outbox] small').textContent()==='0');
  await page.evaluate(()=>{window.failures.folders='defer';});await select.selectOption(await page.evaluate(()=>googleAccount));
  await page.waitForFunction(()=>Boolean(window.finishFolders));
  ok('Previous totals and actions disappear before slow Google response',await live.locator('[data-live-uid],.mail-reader h3,[data-live-folder=Erledigt]').count()===0&&await live.locator('[data-mail-folder=inbox] small').textContent()==='–');
  await page.evaluate(()=>{delete window.failures.folders;window.failures.messages='null';finishFolders();});await settled();
  ok('Null native message result becomes explicit invalid-response error',(await live.locator('.mail-notice').textContent()).includes('BRIDGE_RESPONSE_INVALID'));
  ok('Null message result cannot leave old UID or falsely successful empty list',await live.locator('[data-live-uid]').count()===0&&!(await live.locator('.mail-list').textContent()).includes('Keine Nachrichten'));
  await page.evaluate(()=>delete window.failures.messages);await mail.locator('[data-live-text=refresh]').click();await settled();
  ok('Refresh recovers Google messages and its own count',await live.locator('[data-live-uid="9"]').isVisible()&&await live.locator('[data-mail-folder=inbox] small').textContent()==='2');
  ok('Verified Googlemail spelling remains in account selector',(await select.locator('option:checked').textContent())==='fixture@googlemail.com');
  await page.evaluate(()=>window.failures.folders='cancel');await mail.locator('[data-live-text=refresh]').click();await settled();
  ok('Failed refresh clears previous messages and catalog actions',await live.locator('[data-live-uid],.mail-reader h3').count()===0&&await mail.locator('[data-live-text=catalog]').isDisabled());
  const adapter=await page.evaluate(async()=>{
    const outcomes=[];
    for(const method of ['accounts','saved','folders','messages'])for(const shape of ['cancel','null','array','scalar']){
      window.failures={};window.failures[method]=shape;
      try{if(method==='accounts')await PBMailDevice.accounts();else if(method==='saved')await PBMailDevice.saved(googleAccount);else await PBMailDevice.request('/'+googleAccount+'/'+method);outcomes.push(false);}catch(error){outcomes.push(!error.message.includes('private provider response')&&!error.message.includes("reading 'items'")&&error.message.length>20);}
    }
    window.failures={addAccount:'cancel'};return{outcomes,cancel:await PBMailDevice.addAccount()};
  });
  ok('Every list method rejects cancellation/null/malformed items without private provider text',adapter.outcomes.length===16&&adapter.outcomes.every(Boolean));
  ok('Explicit user cancellation of Add account still returns null',adapter.cancel===null);
  for(const language of ['de','en','ru','pl']){
    const messages=await page.evaluate(async language=>{
      document.documentElement.lang=language;const messages=[];
      for(const code of ['GMAIL_CONSENT_REQUIRED','GMAIL_SCOPE_MISSING','GMAIL_TOKEN_REJECTED','GMAIL_ACCOUNT_MISMATCH','GMAIL_IMAP_AUTH_FAILED','GMAIL_SMTP_AUTH_FAILED','NETWORK_FAILED']){
        window.failures={messages:code};try{await PBMailDevice.request('/'+googleAccount+'/messages');}catch(error){messages.push({code,message:error.message});}
      }return messages;
    },language);
    ok(`${language}: live Google failures identify the stage with a localized explanation`,messages.length===7&&messages.every(r=>r.message.endsWith('('+r.code+')')&&!r.message.includes('private provider response')&&r.message.length>r.code.length+25)&&new Set(messages.map(r=>r.message)).size===7);
  }
  ok('Loading and recovering never sends, removes an account or overwrites a draft',await page.evaluate(()=>!window.calls.some(c=>['send','removeAccount','saveDraft'].includes(c.name))));
  ok('No runtime errors in account failure and recovery paths',errors.length===0);
  console.log(`${count} native account failure/recovery checks passed (simulated native transport; no real Google login).`);
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
