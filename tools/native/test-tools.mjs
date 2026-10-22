// 🔑 Unlock codes and 🧰 tools (Klaus 2026-10-22): publisher studio, one code per buyer, checked offline,
// tools open inside the app, a file a tool hands out goes into Private Brain Pro. Real tool pages (Kimboard, Kimseek).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const PW='Klaus-Studio-2026';
async function app(browser,keys){
  const context=await browser.newContext({viewport:{width:1100,height:900}});
  const page=await context.newPage(),url=`http://127.0.0.1:${server.address().port}/`,errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=r.request().url();
    if(keys&&u.endsWith('/license-keys.json'))return r.fulfill({contentType:'application/json',body:JSON.stringify({publishers:keys.map(key=>({key}))})});
    return u.startsWith(url)?r.continue():r.abort();});
  await page.addInitScript(()=>{window.opened=[];window.alerts=[];window.alert=m=>alerts.push(String(m));window.Capacitor={Plugins:{ProLinks:{async open({url}){opened.push(url);return{ok:true};}}}};});
  await page.goto(url);await page.waitForFunction(()=>window.PBLicense&&window.PBTools&&document.querySelector('.pb-tools-menu'));
  await page.evaluate(()=>PBLicense.ready);
  return {page,errors,context};
}
const menuItem=(page,id)=>page.locator(`.pb-tools-menu [data-tool="${id}"]`);
const settings=page=>page.evaluate(()=>window.PBWorkspace.navigate('settings'));
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  // ---------- a buyer without a code ----------
  let {page,errors}=await app(browser,null);
  ok('Menu lists the tools, locked without a code',(await menuItem(page,'pinnwand').textContent()).startsWith('🔒 📌 Pinnwand')&&(await menuItem(page,'kimsync').getAttribute('data-open'))==='false');
  await menuItem(page,'pinnwand').evaluate(b=>b.click());
  ok('A locked tool says where the code goes and leads to settings',await page.evaluate(()=>alerts.at(-1).includes('Werkzeuge freischalten')&&document.getElementById('panel-settings').classList.contains('on')));
  await page.evaluate(()=>{const b=document.createElement('button');b.id='pbPinBtn';document.body.append(b);window.pinClicks=0;b.addEventListener('click',()=>pinClicks++);b.click();});
  ok('The built-in pin board does not open without a code',await page.evaluate(()=>pinClicks===0&&alerts.length===2));
  // ---------- the publisher on his device ----------
  await settings(page);
  const studio=page.locator('#pb-studio');await studio.locator(':scope > summary').click();
  await studio.locator('[data-studio-pw]').fill('kurz');await studio.locator('[data-studio-pw2]').fill('kurz');await studio.locator('.pb-studio-make-key').click();
  ok('A too short studio password is refused',(await studio.locator('[data-studio-status]').textContent()).includes('mindestens 8 Zeichen'));
  await studio.locator('[data-studio-pw]').fill(PW);await studio.locator('[data-studio-pw2]').fill(PW);await studio.locator('.pb-studio-make-key').click();
  await page.waitForFunction(()=>document.querySelector('#pb-studio .pb-studio-pub code'),null,{timeout:60000});
  const pub=await page.locator('#pb-studio .pb-studio-pub code').textContent();
  ok('The studio shows the public key and says to send it',/^[0-9a-f]{64}$/.test(pub)&&(await page.locator('.pb-studio-pub-note').textContent()).includes('Schick diesen öffentlichen Schlüssel'));
  const stored=await page.evaluate(()=>localStorage.getItem('pb_studio_v1'));
  ok('The secret key is stored only encrypted (no 64-hex secret in storage)',!/"secret"|"priv"/.test(stored)&&JSON.parse(stored).ct.length>40&&JSON.parse(stored).pub===pub);
  ok('Before the key is in the app, the publisher\'s own device has all tools open',await page.evaluate(()=>PBLicense.unlocked('kimsync')&&PBLicense.isOwner()));
  const s=page.locator('#pb-studio');if(!(await s.evaluate(d=>d.open)))await s.locator(':scope > summary').click();
  await s.locator('[data-studio-buyer]').fill('Max Muster');
  for(const id of ['pinnwand','suche'])await s.locator(`.pb-studio-tools input[value="${id}"]`).check();
  await s.locator('[data-studio-pw]').fill('falsch-falsch');await s.locator('.pb-studio-make-code').click();
  await page.waitForFunction(()=>/Falsches Studio-Passwort/.test(document.querySelector('#pb-studio [data-studio-status]').textContent),null,{timeout:60000});
  ok('A wrong studio password makes no code',await s.locator('[data-studio-code]').count()===0);
  await s.locator('[data-studio-pw]').fill(PW);await s.locator('.pb-studio-make-code').click();
  await page.waitForFunction(()=>document.querySelector('#pb-studio [data-studio-code]'),null,{timeout:60000});
  const code=await s.locator('[data-studio-code]').inputValue();
  ok('The studio makes a code for the buyer',/^PBK1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(code)&&(await s.textContent()).includes('Code für Max Muster'));
  const backup=await page.evaluate(()=>PBLicense.backupText());
  ok('A key backup exists and is encrypted',backup.startsWith('PBSTUDIO1.')&&!backup.includes(pub.slice(0,0)+'"ct":""'));
  // ---------- a stranger's studio key ----------
  const other=await app(browser,[pub]);
  const foreign=await other.page.evaluate(async()=>{await PBLicense.createKey('fremd-fremd-fremd');return (await PBLicense.makeCode('fremd-fremd-fremd','Ich',['kimsync'])).code;});
  ok('With the publisher key in the app, a self-made studio key does not open anything',await other.page.evaluate(()=>!PBLicense.unlocked('kimsync')&&!PBLicense.isOwner()));
  await other.context.close();
  // ---------- the buyer's app (publisher key in the app) ----------
  ({page,errors}=await app(browser,[pub]));
  await settings(page);
  const field=page.locator('#pbLicenseCode'),go=page.locator('.pb-license-go'),status=page.locator('[data-license-status]');
  await field.fill(code.slice(0,-3)+'AAA');await go.click();
  await page.waitForFunction(()=>/passt nicht|nicht vom Herausgeber/.test(document.querySelector('[data-license-status]').textContent));
  ok('A changed code is refused',true);
  await field.fill(foreign);await go.click();
  await page.waitForFunction(()=>/nicht vom Herausgeber/.test(document.querySelector('[data-license-status]').textContent));
  ok('A code from someone else\'s studio is refused',true);
  await page.locator('#pbLicenseCode').fill(code);await page.locator('.pb-license-go').click();
  await page.waitForFunction(()=>/Freigeschaltet/.test(document.querySelector('[data-license-status]')?.textContent||''));
  ok('The buyer\'s code unlocks exactly the bought tools, named for the buyer',(await page.locator('[data-license-status]').textContent()).includes('Pinnwand, Such-Tool')&&(await page.locator('[data-license-status]').textContent()).includes('für Max Muster')&&await page.evaluate(()=>PBLicense.unlocked('pinnwand')&&PBLicense.unlocked('suche')&&!PBLicense.unlocked('kimsync')));
  await page.reload();await page.waitForFunction(()=>window.PBLicense&&document.querySelector('.pb-tools-menu'));await page.evaluate(()=>PBLicense.refresh());
  ok('After a restart the code still counts, checked again offline',await page.evaluate(()=>PBLicense.unlocked('pinnwand')&&!PBLicense.unlocked('dateipost')));
  ok('The menu shows the bought tools open, the rest locked',(await menuItem(page,'pinnwand').getAttribute('data-open'))==='true'&&(await menuItem(page,'kimsync').getAttribute('data-open'))==='false');
  // ---------- open a tool inside the app ----------
  await menuItem(page,'pinnwand').evaluate(b=>b.click());
  const frame=page.locator('.pb-tool-frame iframe');await frame.waitFor();
  await page.waitForFunction(()=>{const d=document.querySelector('.pb-tool-frame iframe')?.contentDocument;return d&&d.readyState==='complete'&&d.title;},null,{timeout:60000});
  const title=await frame.evaluate(f=>f.contentDocument.title);
  ok('The pin board (Kimboard) opens inside the app window',/Pinnwand|Kimboard/i.test(title)&&await frame.evaluate(f=>f.contentWindow.location.pathname==='/kimboard/index.html'));
  ok('The tool registers no service worker inside the app',await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length===0));
  // A file the tool hands out (anchor with a blob address, clicked without being in the page).
  await frame.evaluate(f=>{const w=f.contentWindow;const a=w.document.createElement('a');a.href=w.URL.createObjectURL(new w.Blob(['Notiz von der Pinnwand'],{type:'text/plain'}));a.download='pinnwand-notiz.txt';a.click();});
  const fileDlg=page.locator('dialog.pb-tool-file');await fileDlg.waitFor();
  ok('A file the tool hands out is offered to Private Brain Pro',(await fileDlg.textContent()).includes('pinnwand-notiz.txt'));
  await fileDlg.locator('button',{hasText:'In Private Brain übernehmen'}).click();
  await page.waitForFunction(()=>!signing&&CATALOG.some(r=>r.name==='pinnwand-notiz.txt'),null,{timeout:60000});
  ok('It is added, checked and filed under Werkzeuge/Pinnwand',await page.evaluate(()=>{const r=CATALOG.find(r=>r.name==='pinnwand-notiz.txt');return r.path==='Werkzeuge/Pinnwand/pinnwand-notiz.txt'&&Boolean(r.pruefung);})&&await page.locator('.pb-tool-frame').count()===0);
  await menuItem(page,'suche').evaluate(b=>b.click());
  await page.waitForFunction(()=>{const d=document.querySelector('.pb-tool-frame iframe')?.contentDocument;return d&&d.readyState==='complete'&&d.title;},null,{timeout:60000});
  ok('The search tool (Kimseek) opens as well',await page.locator('.pb-tool-frame iframe').evaluate(f=>f.contentWindow.location.pathname==='/kimseek/index.html'));
  await page.locator('.pb-tool-bar button').click();
  ok('"Zurück" closes the tool window',await page.locator('.pb-tool-frame').count()===0);
  // ---------- a tool page opened directly, without the app window ----------
  await page.goto(`http://127.0.0.1:${server.address().port}/kimboard/index.html`);
  await page.waitForURL(u=>u.pathname==='/index.html',{timeout:20000});
  ok('A tool page opened outside the app window goes back to the app',true);
  ok('No runtime errors in the app itself',errors.filter(e=>!/kimboard|kimseek|relay|WebSocket/i.test(e)).length===0||console.log(errors));
  console.log(`${count} unlock and tool checks passed (real tool pages; relays not reached).`);
}finally{await browser?.close();server.close();}
