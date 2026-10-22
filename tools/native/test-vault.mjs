// Simulation (browser, plugins stubbed): storage location, encrypted folder, attachment
// folder, clearing, catalog backup and restore. The Android side is tested separately
// (NativeVaultTest); this proves the page never handles the password or the file bytes
// beyond explicit viewing.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),origin='https://localhost/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
// One simulated folder shared by "device A" and "device B" pages.
const folder={exists:false,catalog:[],attachments:[],calls:[]};
const textBytes=Buffer.from('Anwaltsschreiben im Anhang-Ordner');
function fresh(){return{configured:false,unlocked:false,pending:new Map()};}
async function device(name,{answers=[]}={}){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const dialogs=[];page.on('dialog',d=>{dialogs.push(d.message());const a=answers.shift();a===false?d.dismiss():d.accept();});
  const local=fresh();
  await page.route('**/*',async route=>{const url=route.request().url();if(!url.startsWith(origin))return route.abort();const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}});
  await page.exposeFunction('vaultFixture',async(method,args={})=>{
    folder.calls.push({device:name,method,args});
    const state=()=>({configured:local.configured,unlocked:local.unlocked,remembered:local.unlocked,location:'sdcard',folder:'Private Brain',attachments:folder.attachments.length,attachmentBytes:folder.attachments.reduce((s,a)=>s+a.size,0),reachable:true,catalogBackup:folder.catalog.length>0});
    if(method==='state')return state();
    if(method==='volumes')return{items:[{id:'primary',label:'Interner Speicher',primary:true,removable:false},{id:'1234-ABCD',label:'SanDisk',primary:false,removable:true}],targeted:true};
    if(method==='choose'){
      if(args.password!==undefined)throw new Error('password crossed the bridge');
      local.configured=true;local.unlocked=true;
      if(folder.exists)return{opened:true,state:state(),restored:{accounts:1,records:2}};
      folder.exists=true;return{created:true,state:state()};
    }
    if(method==='unlock'){local.unlocked=true;return{unlocked:true,state:state()};}
    if(method==='lock'){local.unlocked=false;return state();}
    if(method==='migrate')return{originals:3,skipped:0};
    if(method==='backupMail')return{ok:true};
    if(!local.unlocked)throw new Error('VAULT_LOCKED');
    if(method==='attachments')return{items:folder.attachments.map(({bytes,...a})=>a)};
    if(method==='readAttachment'){const a=folder.attachments.find(a=>a.id===args.id);if(!a)throw new Error('ATTACHMENT_DELETED');return{data:a.bytes.subarray(args.offset,args.offset+262144).toString('base64')};}
    if(method==='openAttachment')return{ok:true};
    if(method==='clearAttachments'){const removed=folder.attachments.length;folder.attachments=[];return{removed,bytes:0};}
    if(method==='catalogBegin'){const ticket='t'+(local.pending.size+1)+Date.now();local.pending.set(ticket,[]);return{ticket};}
    if(method==='catalogAppend'){const parts=local.pending.get(args.ticket);assert.equal(args.offset,parts.reduce((s,p)=>s+p.length,0));parts.push(Buffer.from(args.data,'base64'));return{ok:true};}
    if(method==='catalogFinish'){folder.catalog.push(Buffer.concat(local.pending.get(args.ticket)));local.pending.delete(args.ticket);return{ok:true};}
    if(method==='catalogAbort'){local.pending.delete(args.ticket);return{ok:true};}
    if(method==='catalogInfo'){const last=folder.catalog.at(-1);return last?{exists:true,size:last.length,version:folder.catalog.length}:{exists:false};}
    if(method==='catalogRead')return{data:folder.catalog[args.version-1].subarray(args.offset,args.offset+262144).toString('base64')};
    throw new Error('Unknown vault method '+method);
  });
  await page.exposeFunction('mailFixture',async(method,args={})=>{
    folder.calls.push({device:name,method,args});
    const account={id:'11111111-1111-4111-8111-111111111111',email:'klaus@example.invalid',provider:'telekom'};
    if(method==='accounts')return{items:[account]};
    if(method==='folders')return{items:[{path:'INBOX',name:'INBOX',specialUse:''}]};
    if(method==='messages')return{validity:'5',total:1,items:[{uid:9,subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',flags:[],size:40*1024*1024}],next:null};
    if(method==='message'){
      if(!local.unlocked)throw new Error('VAULT_LOCKED');
      const stored=folder.attachments.find(a=>a.id==='att-1');
      return{subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',to:account.email,messageId:'<a@example.invalid>',replyTo:'',html:'',text:'Siehe Anhang.',raw:'From: kanzlei@example.invalid\r\nSubject: Schreiben vom Anwalt\r\n\r\nSiehe Anhang.',vault:true,
        attachments:[stored?{name:'schreiben.txt',type:'text/plain',size:stored.size,sha256:'x',ref:'att-1',stored:true,inline:false,contentId:''}:{name:'schreiben.txt',type:'text/plain',size:textBytes.length,ref:'att-1',stored:false,deleted:true,inline:false,contentId:''},{name:'video.mp4',type:'video/mp4',tooLarge:true,inline:false,contentId:''}]};
    }
    if(method==='action')return{ok:true};
    if(method==='forgetMessage'){folder.attachments.push({id:'att-1',name:'schreiben.txt',type:'text/plain',size:textBytes.length,subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',date:String(Date.UTC(2026,9,20)),stored:Date.now(),bytes:textBytes});return{ok:true};}
    if(method==='saved')return{items:[]};
    throw new Error('Unknown mail method '+method);
  });
  await page.addInitScript(()=>{
    delete window.showDirectoryPicker;
    const vault=['state','volumes','choose','unlock','lock','migrate','backupMail','attachments','readAttachment','openAttachment','clearAttachments','catalogBegin','catalogAppend','catalogFinish','catalogAbort','catalogInfo','catalogRead'];
    const mail=['accounts','folders','messages','message','action','forgetMessage','saved'];
    const wrap=(fixture,list)=>Object.fromEntries(list.map(m=>[m,async args=>{try{return await window[fixture](m,args);}catch(error){throw{code:String(error?.message||error).match(/[A-Z][A-Z_]{3,}/)?.[0]||'UNKNOWN'};}}]));
    window.Capacitor={Plugins:{ProVault:wrap('vaultFixture',vault),ProMail:wrap('mailFixture',mail),ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.17-debug',nativeMail:true};}}}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBVault&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  return {page,errors,dialogs,local,context};
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  // ---------- device A: first setup ----------
  const A=await device('A',{answers:[true]});
  const {page}=A;
  await page.click('[data-tab=settings]');
  ok('Settings start with the storage card and name the old attachment limit',await page.locator('#panel-settings>#vaultPlace').isVisible()&&await page.locator('#vaultStatus').textContent().then(t=>t.includes('5 MB')));
  ok('Intake page shows where copies go, with a way to the settings',await page.locator('#vaultLine').textContent().then(t=>t.includes('Speicherort')));
  ok('The page itself has no password field for the folder',await page.locator('#vaultPlace input').count()===0);
  await page.click('#vault-choose');
  await page.locator('.native-vault-where').waitFor();
  ok('Tablet and SD card are offered as separate choices',await page.locator('.native-vault-where button').allTextContents().then(t=>t.some(s=>s.includes('Tablet'))&&t.some(s=>s.includes('SD-Karte – SanDisk'))));
  await page.locator('.native-vault-where button',{hasText:'SD-Karte'}).click();
  await page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('Originale 3'));
  const choose=folder.calls.find(c=>c.method==='choose');
  ok('Android receives only volume, language and theme; never a password',choose.args.volume==='1234-ABCD'&&Object.keys(choose.args).sort().join()==='dark,language,volume');
  ok('Existing originals, accounts and drafts are taken over after asking',A.dialogs.some(d=>d.includes('zusätzlich verschlüsselt'))&&folder.calls.some(c=>c.method==='migrate'));
  await page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('Katalog gesichert'));
  ok('A first catalog backup is written immediately',folder.catalog.length===1);
  ok('Status names SD card, encryption and unlocked state',await page.locator('#vaultStatus').textContent().then(t=>t.includes('SD-Karte')&&t.includes('verschlüsselt · entsperrt')));
  // Import a document: the change must reach the folder without a click.
  await page.click('[data-tab=intake]');
  await page.setInputFiles('#fileInput',{name:'vertrag.txt',mimeType:'text/plain',buffer:Buffer.from('Mietvertrag Wohnung Kündigungsfrist drei Monate')});
  await page.waitForFunction(()=>CATALOG.length===1);
  // A model vector (only present when the meaning model ran) must stay out of the folder.
  await page.evaluate(async()=>{CATALOG[0].evec=Array.from({length:384},(_,i)=>i/384);await idbPut('catalog',CATALOG[0]);});
  const before=folder.catalog.length;
  for(let i=0;i<40&&folder.catalog.length===before;i++)await page.waitForTimeout(250);
  const saved=JSON.parse(folder.catalog.at(-1).toString('utf8'));
  ok('Catalog changes are backed up bundled, without a click',folder.catalog.length===before+1&&saved.catalog.some(r=>r.name==='vertrag.txt'&&Array.isArray(r.vector)));
  ok('Meaning vectors from the model are left out of the backup',saved.catalog.length===1&&saved.catalog.every(r=>!('evec' in r))&&await page.evaluate(()=>CATALOG[0].evec.length===384));
  // ---------- mail with a stored, then cleared attachment ----------
  folder.attachments.push({id:'att-1',name:'schreiben.txt',type:'text/plain',size:textBytes.length,subject:'Schreiben vom Anwalt',from:'kanzlei@example.invalid',date:String(Date.UTC(2026,9,20)),stored:Date.now(),bytes:textBytes});
  await page.click('[data-tab=mail]');
  await page.locator('#mailWorkspace [data-live-text=connect]').click();
  await page.locator('#mailWorkspace [data-live-uid="9"]').click();
  await page.locator('.native-vault-attachment').first().waitFor();
  ok('A 40 MB mail opens with its attachment as a reference in the folder',await page.locator('.native-vault-attachment').first().textContent().then(t=>t.includes('schreiben.txt')&&t.includes('im Anhang-Ordner')));
  ok('Over-1-GB attachments are named, not silently dropped',await page.locator('.native-vault-attachment').nth(1).textContent().then(t=>t.includes('über 1 GB')));
  await page.waitForFunction(()=>document.querySelector('.mail-report')?.textContent.includes('nicht im Browser geprüft'));
  ok('An attachment too large for the folder is still named as not checked',await page.locator('.mail-report').textContent().then(t=>t.includes('nicht im Browser geprüft')));
  await page.waitForFunction(()=>document.querySelector('.mail-report .pb-check-line'));
  ok('🛡 The attachment kept in the folder is checked for hidden content (Klaus 2026-10-22)',await page.locator('.mail-report .pb-check-line').first().textContent().then(t=>t.includes('schreiben.txt')&&t.includes('✓ Geprüft · kein Fund')));
  await page.locator('.native-vault-attachment button',{hasText:'Ansehen'}).click();
  await page.locator('.native-file-text').waitFor();
  ok('Viewing reads the decrypted bytes into the in-app viewer only',await page.locator('.native-file-text').textContent()===textBytes.toString());
  A.dialogs.length=0;
  await page.goBack();
  // Explorer folder and clearing.
  await page.click('[data-tab=explorer]');
  await page.locator('#explorerTree [data-kind="mail"]').click();
  await page.locator('.native-vault-head').waitFor();
  ok('One place for attachments: the folder ones sit under "E-Mails", sorted by sender and mail (Klaus 2026-10-22)',await page.locator('#explorerTree .native-vault-folder').count()===0&&await page.locator('#explorerFiles .explorer-dir').filter({hasText:'kanzlei@example.invalid'}).count()===1);
  await page.locator('#explorerFiles .explorer-dir').filter({hasText:'kanzlei@example.invalid'}).click();
  await page.locator('#explorerFiles .explorer-dir').filter({hasText:'Schreiben vom Anwalt'}).click();
  await page.locator('.native-vault-row').first().waitFor();
  ok('Explorer lists the attachment under its mail with sender and date',(await page.locator('#explorerPath').textContent()).includes('Schreiben vom Anwalt')&&await page.locator('.native-vault-row').first().textContent().then(t=>t.includes('Schreiben vom Anwalt')&&t.includes('kanzlei@example.invalid')&&t.includes('2026')));
  A.dialogs.length=0;
  const answers=[false,true,true];
  page.removeAllListeners('dialog');page.on('dialog',d=>{A.dialogs.push(d.message());answers.shift()?d.accept():d.dismiss();});
  await page.locator('.native-vault-row button',{hasText:'Öffnen mit'}).click();
  await page.waitForTimeout(300);
  ok('"Open with" warns first and does nothing when declined',A.dialogs.at(-1).includes('verlässt damit den geschützten Ordner')&&!folder.calls.some(c=>c.method==='openAttachment'));
  await page.locator('.native-vault-row button',{hasText:'Öffnen mit'}).click();
  for(let i=0;i<20&&!folder.calls.some(c=>c.method==='openAttachment');i++)await page.waitForTimeout(100);
  ok('After agreeing, Android hands out the decrypted copy',folder.calls.some(c=>c.method==='openAttachment'&&c.args.id==='att-1'));
  await page.locator('#explorerTree [data-kind="mail"]').click();
  await page.locator('.native-vault-clear').click();
  await page.waitForFunction(()=>!document.querySelector('.native-vault-head'));
  ok('"Ganzen Ordner leeren" asks with count and size, then empties the folder',A.dialogs.at(-1).includes('Alle 1 Mail-Anhänge')&&folder.attachments.length===0);
  await page.click('[data-tab=mail]');
  await page.locator('#mailWorkspace [data-live-uid="9"]').click();
  await page.locator('.native-vault-attachment',{hasText:'Anhang gelöscht'}).waitFor();
  ok('The mail shows "Anhang gelöscht" afterwards',true);
  await page.locator('.native-vault-attachment button',{hasText:'Erneut'}).click();
  await page.locator('.native-vault-attachment',{hasText:'im Anhang-Ordner'}).waitFor();
  ok('"Erneut laden" fetches the attachment into the folder again',folder.calls.some(c=>c.method==='forgetMessage'&&c.args.uid===9));
  // Locking on this device.
  await page.click('[data-tab=settings]');
  await page.click('#vault-lock');
  await page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('gesperrt'));
  ok('Locking keeps the folder configured but closed',!A.local.unlocked&&await page.locator('#vault-unlock').isVisible());
  await page.click('[data-tab=mail]');
  await page.locator('#mailWorkspace [data-live-uid="9"]').click();
  await page.locator('.mail-reader .mail-text').waitFor();
  ok('Opening a mail while locked asks Android for the password once and continues',folder.calls.filter(c=>c.device==='A'&&c.method==='unlock').length===1);
  ok('No page errors on device A',A.errors.length===0);
  // ---------- device B: new tablet, same SD card ----------
  const B=await device('B');
  await B.page.click('[data-tab=settings]');
  await B.page.click('#vault-openExisting');
  await B.page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('Wiederhergestellt'));
  ok('Opening the old folder restores accounts, drafts and the catalog',await B.page.locator('#vaultStatus').textContent().then(t=>t.includes('Konten 1')&&t.includes('Katalogeinträge 1')));
  ok('Restored catalog is searchable on the new device',await B.page.evaluate(()=>CATALOG.some(r=>r.name==='vertrag.txt'&&r.vector.length===256)));
  ok('Restore note names Google re-authorization and originals on demand',await B.page.locator('#vaultStatus').textContent().then(t=>t.includes('Google')));
  await B.page.click('#vault-openExisting');
  await B.page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('Katalogeinträge 0'));
  ok('Opening the folder again adds nothing twice and replaces nothing',await B.page.evaluate(()=>CATALOG.length===1&&HASHSET.size===1));
  const bChoose=folder.calls.find(c=>c.device==='B'&&c.method==='choose');
  ok('Opening uses the generic picker without volume',bChoose.args.volume==='');
  await B.page.evaluate(()=>{document.documentElement.lang='en';});
  ok('Card follows the language switch',await B.page.locator('#vaultPlace h3').textContent()==='🔐 Storage location and encryption');
  ok('No page errors on device B',B.errors.length===0);
  console.log(`${count} vault simulation checks passed (browser, Android plugins stubbed).`);
}finally{await browser?.close();}
