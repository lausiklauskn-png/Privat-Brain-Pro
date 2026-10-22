// Simulation (browser, Android plugins stubbed): the protection checking point.
// Rules for spam and scams run in the page; list lookups, updates, keys and VirusTotal
// are Android's work (NativeProtectTest). This proves what the page shows and sends:
// hints instead of verdicts, never "virenfrei", keys never in the page, only fingerprints out.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
const root=resolve('www'),origin='https://localhost/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const sha=b=>createHash('sha256').update(b).digest('hex');
const LISTED=sha('known malware sample'),pdf=Buffer.from('%PDF-1.4 harmless invoice');
const account={id:'11111111-1111-4111-8111-111111111111',email:'klaus@example.invalid',provider:'telekom'};
const mails={
  1:{list:{uid:1,subject:'Ihr Konto wurde gesperrt',from:'PayPal Service <service@paypa1.com>',flags:[],size:9000},
    body:{subject:'Ihr Konto wurde gesperrt',from:'"PayPal Service" <service@paypa1.com>',to:account.email,replyTo:'collect@other.example',messageId:'<p@x>',
      raw:'Authentication-Results: mx.example.invalid; spf=fail smtp.mailfrom=paypa1.com; dkim=none; dmarc=fail\r\nFrom: "PayPal Service" <service@paypa1.com>\r\nReply-To: collect@other.example\r\nSubject: Ihr Konto wurde gesperrt\r\n\r\nText',
      text:'Ihr Konto wurde gesperrt. Bestätigen Sie Ihre Daten sofort und geben Sie Ihr Passwort ein: https://evil.example/login',
      html:'<p>Bitte hier anmelden: <a href="http://198.51.100.7/paypal">https://www.paypal.com/signin</a></p>',vault:true,
      attachments:[{name:'Rechnung.pdf.exe',type:'application/octet-stream',size:4096,sha256:LISTED,ref:'att-p',stored:true,inline:false,contentId:''}]}},
  2:{list:{uid:2,subject:'Ihre Rechnung Oktober',from:'Telekom <rechnung@telekom.de>',flags:[],size:3000},
    body:{subject:'Ihre Rechnung Oktober',from:'"Telekom" <rechnung@telekom.de>',to:account.email,replyTo:'',messageId:'<t@x>',
      raw:'Authentication-Results: mx.example.invalid; spf=pass; dkim=pass header.d=telekom.de; dmarc=pass\r\nFrom: "Telekom" <rechnung@telekom.de>\r\nSubject: Ihre Rechnung Oktober\r\n\r\nText',
      text:'Ihre Rechnung steht bereit: https://www.telekom.de/rechnung . Ihr Passwort wurde nicht geändert.',
      html:'<p><a href="https://www.telekom.de/rechnung">www.telekom.de/rechnung</a></p>',
      attachments:[{name:'rechnung.pdf',type:'application/pdf',inline:false,contentId:'',data:pdf.toString('base64')}]}},
  3:{list:{uid:3,subject:'Ihr Paket kommt heute',from:'DPD <noreply@dpd.de>',flags:[],size:2000},
    body:{subject:'Ihr Paket kommt heute',from:'"DPD" <noreply@dpd.de>',to:account.email,replyTo:'',messageId:'<d@x>',
      raw:'From: "DPD" <noreply@dpd.de>\r\nSubject: Ihr Paket kommt heute\r\n\r\nText',text:'Sendungsverfolgung: https://tracking.dpd.de/status/123',html:'',attachments:[]}}
};
async function device(name,{offline=false,unlocked=true}={}){
  const calls=[],context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage(),errors=[],dialogs=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>{dialogs.push(d.message());d.accept();});
  const protect={configured:true,unlocked,offline,auto:true,malware:{updated:Date.UTC(2026,9,20,8),count:3},links:{updated:Date.UTC(2026,9,20,8),count:1,servers:1},
    keys:{abusech:true,virustotal:false},folder:'Schutzlisten',files:[{name:'Schaddateien-MalwareBazaar-1.pbv'},{name:'Gefaehrliche-Links-URLhaus-1.pbv'},{name:'Stand-1.pbv'}]};
  await page.route('**/*',async route=>{const url=route.request().url();if(!url.startsWith(origin))return route.abort();const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}});
  await page.exposeFunction('fixture',async(plugin,method,args={})=>{
    calls.push({plugin,method,args});
    if(plugin==='ProVault'){
      if(method==='state')return{configured:true,unlocked,remembered:true,location:'sdcard',folder:'Private Brain',attachments:1,attachmentBytes:4096,reachable:true,catalogBackup:true};
      if(method==='attachments')return{items:[{id:'att-p',name:'Rechnung.pdf.exe',type:'application/octet-stream',size:4096,sha256:LISTED,subject:'Ihr Konto wurde gesperrt',from:'service@paypa1.com',date:'',stored:1}]};
      if(method==='openAttachment')return{ok:true};
      if(method==='catalogInfo')return{exists:false};
      if(['catalogBegin'].includes(method))return{ticket:'t'};
      return{ok:true};
    }
    if(plugin==='ProMail'){
      if(method==='accounts')return{items:[account]};
      if(method==='folders')return{items:[{path:'INBOX',name:'INBOX',specialUse:''}]};
      if(method==='messages')return{validity:'5',total:3,items:Object.values(mails).map(m=>m.list),next:null};
      if(method==='message')return mails[args.uid].body;
      if(method==='saved')return{items:[]};
      return{ok:true};
    }
    if(plugin==='ProLinks')return{ok:true};
    if(plugin==='ProProtect'){
      if(method==='state')return protect;
      if(method==='update')return protect.offline?{checked:true,skipped:'APP_OFFLINE'}:{checked:true};
      if(method==='setAuto'){protect.auto=args.value;return protect;}
      if(method==='setKey'){protect.keys[args.service]=true;return{saved:true,state:protect};}
      if(!protect.unlocked)throw new Error('VAULT_LOCKED');
      if(method==='checkHashes')return{available:true,count:3,items:args.items.map(h=>({sha256:h,listed:h===LISTED}))};
      if(method==='checkUrls')return{available:true,count:1,items:args.items.map(u=>({url:u,host:new URL(u).hostname,listed:u==='https://evil.example/login',serverListed:false}))};
      if(method==='virusTotal'){if(!protect.keys.virustotal)throw new Error('KEY_REQUIRED');return{known:true,analysed:true,malicious:2,suspicious:1,total:70,date:Date.UTC(2026,9,19)};}
    }
    throw new Error('Unknown '+plugin+'.'+method);
  });
  await page.addInitScript(()=>{
    delete window.showDirectoryPicker;
    const wrap=plugin=>new Proxy({},{get:(_,m)=>m==='then'?undefined:async args=>{try{return await window.fixture(plugin,m,args);}catch(error){throw{code:String(error?.message||error).match(/[A-Z][A-Z_]{3,}/)?.[0]||'UNKNOWN'};}}});
    window.Capacitor={Plugins:{ProVault:wrap('ProVault'),ProMail:wrap('ProMail'),ProProtect:wrap('ProProtect'),ProLinks:wrap('ProLinks'),ProDevice:{async getInfo(){return{platform:'android',versionName:'0.1.0-preview.18-debug',nativeMail:true};}}}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBSchutz&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  return{page,errors,dialogs,calls,protect,context};
}
async function openMail(page,uid){
  await page.click('[data-tab=mail]');
  const connect=page.locator('#mailWorkspace [data-live-text=connect]');
  if(await connect.isVisible())await connect.click();
  await page.locator(`#mailWorkspace [data-live-uid="${uid}"]`).click();
  await page.locator('.pb-schutz-mail').waitFor();
  await page.waitForFunction(()=>document.querySelector('.pb-schutz-mail')?.dataset.state!=='checking');
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const A=await device('A');const {page}=A;
  await page.click('[data-tab=settings]');
  await page.waitForFunction(()=>document.querySelector('#schutzPlace')?.textContent.includes('Einträge'));
  ok('Settings show the protection card right after the storage card',await page.locator('#vaultPlace + #schutzPlace').isVisible());
  const cardText=await page.locator('#schutzPlace').textContent();
  ok('Card names rules, both lists with date and count, VirusTotal and the helper app',['Regeln für Spam und Betrug','MalwareBazaar','URLhaus','3 Einträge','VirusTotal','Virenscanner-App'].every(s=>cardText.includes(s)));
  ok('Card says where the lists are stored, inside the storage folder',cardText.includes('„Schutzlisten“')&&cardText.includes('Schaddateien-MalwareBazaar-1.pbv'));
  ok('Card says plainly that this is not a complete virus scanner',cardText.includes('kein vollständiger Virenscanner')||cardText.includes('Kein vollständiger Virenscanner'));
  ok('The page has no field for any access key',await page.locator('#schutzPlace input:not([type=checkbox])').count()===0);
  for(let i=0;i<40&&!A.calls.some(c=>c.plugin==='ProProtect'&&c.method==='update');i++)await page.waitForTimeout(200);
  ok('Lists are updated automatically at start (Android decides what is due)',A.calls.some(c=>c.plugin==='ProProtect'&&c.method==='update'&&c.args.force===false));
  await page.click('#schutz-key-vt');
  await page.waitForFunction(()=>document.querySelector('#schutz-key-vt').textContent.includes('✓'));
  const keyCall=A.calls.find(c=>c.method==='setKey');
  ok('A key is typed only into Android: the page sends service, language and theme',Object.keys(keyCall.args).sort().join()==='dark,language,service'&&keyCall.args.service==='virustotal');
  await page.click('#schutz-get-abuse');
  ok('"Schlüssel holen" opens the provider page in the browser on a tap',A.calls.some(c=>c.plugin==='ProLinks'&&c.args.url==='https://auth.abuse.ch/'));
  // ---------- phishing mail ----------
  await openMail(page,1);
  const panel=page.locator('.pb-schutz-mail');
  const codes=await panel.locator('li[data-code]').evaluateAll(l=>l.map(e=>e.dataset.code));
  for(const code of ['auth-fail','reply-other','brand-mismatch','lookalike','link-mismatch','link-ip','pressure','attachment-double','link-listed'])
    ok('Phishing mail: '+code,codes.includes(code));
  ok('A list hit opens the panel and counts as finding',await panel.evaluate(e=>e.open&&e.dataset.state==='befund'));
  ok('The listed attachment is named as known malware',await page.locator('.native-vault-attachment .pb-schutz-file').first().textContent().then(t=>t.includes('Liste bekannter Schaddateien')));
  const vtButton=page.locator('.native-vault-attachment .pb-schutz-vt').first();
  await vtButton.click();
  await page.waitForFunction(()=>document.querySelector('.native-vault-attachment .pb-schutz-file span').textContent.includes('von 70'));
  const vt=A.calls.find(c=>c.method==='virusTotal');
  ok('VirusTotal asks first and receives only the fingerprint',A.dialogs.some(d=>d.includes('Nur der Fingerabdruck'))&&Object.keys(vt.args).join()==='sha256'&&vt.args.sha256===LISTED);
  ok('VirusTotal result is "3 von 70 Scannern melden etwas"',await page.locator('.native-vault-attachment .pb-schutz-file span').first().textContent().then(t=>t.includes('3 von 70 Scannern melden etwas')));
  A.dialogs.length=0;
  await page.locator('.native-vault-attachment .pb-schutz-helper').first().click();
  for(let i=0;i<20&&!A.calls.some(c=>c.method==='openAttachment');i++)await page.waitForTimeout(100);
  ok('Helper app: warns that the file leaves the folder, then shares it',A.dialogs.some(d=>d.includes('verlässt damit den geschützten Ordner'))&&A.calls.some(c=>c.method==='openAttachment'&&c.args.share===true&&c.args.id==='att-p'));
  // ---------- genuine mails: no false alarms ----------
  await openMail(page,2);
  ok('Genuine Telekom invoice: nothing noticed',await page.locator('.pb-schutz-mail').evaluate(e=>e.dataset.state==='unauffaellig'&&!e.querySelector('li[data-code]')));
  await page.waitForFunction(()=>[...document.querySelectorAll('.pb-schutz-file span')].some(s=>s.dataset.state==='unauffaellig'));
  const pdfHash=A.calls.filter(c=>c.method==='checkHashes').flatMap(c=>c.args.items);
  ok('A small attachment shown in the page is checked by its fingerprint',pdfHash.includes(sha(pdf))&&await page.locator('.pb-schutz-file span').first().textContent().then(t=>t.includes('unauffällig laut MalwareBazaar')));
  await openMail(page,3);
  ok('Genuine DPD mail is not taken for a look-alike of DHL',await page.locator('.pb-schutz-mail').evaluate(e=>e.dataset.state==='unauffaellig'));
  // ---------- explorer and check everything ----------
  await page.click('[data-tab=explorer]');
  // Since .28 the attachments sit in the folder tree under E-Mails; "Alle Dateien" lists every file.
  await page.locator('#explorerTree .explorer-folder[data-path=""]').click();
  await page.locator('.native-vault-row .pb-schutz-file').first().waitFor();
  await page.waitForFunction(()=>document.querySelector('.native-vault-row .pb-schutz-file span').dataset.state!=='checking');
  ok('Explorer shows the list result per mail attachment',await page.locator('.native-vault-row .pb-schutz-file span').first().textContent().then(t=>t.includes('Liste bekannter Schaddateien')));
  await page.click('[data-tab=settings]');
  await page.click('#schutz-check-all');
  await page.waitForFunction(()=>document.querySelector('#schutzStatus').textContent.includes('Geprüft'));
  ok('"Alles prüfen" checks folder attachments and names the hits',await page.locator('#schutzStatus').textContent().then(t=>t.includes('Treffer: Rechnung.pdf.exe')));
  const all=await page.evaluate(()=>document.body.innerText);
  ok('Nowhere does the app claim "virenfrei" or "virus-free"',!/virenfrei|virus-free|keine viren/i.test(all));
  await page.evaluate(()=>{document.documentElement.lang='en';});
  ok('Card follows the language switch',await page.locator('#schutzPlace h3').textContent()==='🛡 Protection against malware, spam and scams');
  ok('No page errors on device A',A.errors.length===0);
  // ---------- offline and locked ----------
  const B=await device('B',{offline:true,unlocked:false});
  await B.page.click('[data-tab=settings]');
  await B.page.waitForTimeout(3600);
  ok('Locked folder: no automatic update is started',!B.calls.some(c=>c.plugin==='ProProtect'&&c.method==='update'));
  ok('Locked folder and switched-off internet are named on the card',await B.page.locator('#schutzPlace').textContent().then(t=>t.includes('gesperrt')&&t.includes('Internet der App ist aus')));
  await openMail(B.page,1);
  ok('Locked: rules still give hints, lists say "nicht geprüft" with the reason',await B.page.locator('.pb-schutz-mail li[data-code]').count()>3&&await B.page.locator('.pb-schutz-sources').textContent().then(t=>t.includes('nicht geprüft')&&t.includes('gesperrt')));
  ok('No page errors on device B',B.errors.length===0);
  console.log(`${count} protection simulation checks passed (browser, Android plugins stubbed).`);
}finally{await browser?.close();}
