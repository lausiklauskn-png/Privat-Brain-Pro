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
  ok('Menu lists the tools, locked without a code',(await menuItem(page,'pinnwand').textContent()).replace(/\s/g,'').startsWith('🔒Pinnwand')&&(await menuItem(page,'kimsync').getAttribute('data-open'))==='false');
  // Klaus 2026-10-22: each program shows its own icon, and it really loads (no emoji fallback).
  await page.waitForFunction(()=>[...document.querySelectorAll('.pb-tools-menu img.pb-tool-icon')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:20000});
  ok('Every menu entry shows the program\'s own icon',await page.evaluate(()=>{const items=[...document.querySelectorAll('.pb-tools-menu .pb-tools-item')];return items.length===9&&items.every(b=>{const i=b.querySelector('img.pb-tool-icon');return i&&i.naturalWidth>0&&new URL(i.src).pathname==='/tool-icons/'+b.dataset.tool+(b.dataset.tool==='dateipost'?'.svg':'.png');});}));
  await menuItem(page,'pinnwand').evaluate(b=>b.click());
  ok('A locked tool says where the code goes and leads to settings',await page.evaluate(()=>alerts.at(-1).includes('Werkzeuge freischalten')&&document.getElementById('panel-settings').classList.contains('on')));
  await page.evaluate(()=>{const b=document.createElement('button');b.id='pbPinBtn';document.body.append(b);window.pinClicks=0;b.addEventListener('click',()=>pinClicks++);b.click();});
  ok('The built-in pin board does not open without a code',await page.evaluate(()=>pinClicks===0&&alerts.length===2));
  // ---------- the publisher on his device ----------
  await settings(page);
  // The visible box is plain: tools, code field, button; no studio, no long explanations (Klaus 2026-10-22).
  ok('The unlock box shows only the tools, the code field and the button',await page.evaluate(()=>{const b=document.getElementById('pb-license');return b&&!b.querySelector('#pb-studio')&&!/Ehrlich|Mit einem Freischalt-Code/.test(b.textContent)&&b.querySelectorAll('.pb-license-tools li').length===8&&Boolean(b.querySelector('#pbLicenseCode'))&&Boolean(b.querySelector('.pb-license-go'));}));
  ok('Each tool in the box stands on its own line with icon, full name and state',await page.evaluate(()=>[...document.querySelectorAll('.pb-license-tools li')].every(li=>{const n=li.querySelector('.pb-license-name'),s=li.querySelector('b'),i=li.querySelector('.pb-tool-icon');const r=li.getBoundingClientRect();return n&&s&&i&&n.scrollWidth<=n.clientWidth+1&&s.getBoundingClientRect().right<=r.right+1&&s.getBoundingClientRect().top<r.bottom;})));
  await page.setViewportSize({width:360,height:740});
  ok('On a phone (360 px) no tool name is cut off',await page.evaluate(()=>[...document.querySelectorAll('.pb-license-tools li')].every(li=>{const n=li.querySelector('.pb-license-name'),s=li.querySelector('b');return n.scrollWidth<=n.clientWidth+1&&s.getBoundingClientRect().right<=li.getBoundingClientRect().right+1;})));
  await page.setViewportSize({width:1280,height:900});
  // Like the other studios: a long press (1.5 s) on the ©; a short press or a swipe opens nothing (Klaus 2026-10-22).
  const mark=page.locator('#pbCopyright');await mark.scrollIntoViewIfNeeded();
  const box=await mark.boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
  for(let i=0;i<6;i++)await mark.click();
  ok('Taps on © (also six in a row) do not show the studio',await page.locator('#pb-studio').count()===0);
  await page.mouse.move(cx,cy);await page.mouse.down();await page.waitForTimeout(700);await page.mouse.up();await page.waitForTimeout(1200);
  ok('A short press (0.7 s) on © does not show the studio',await page.locator('#pb-studio').count()===0);
  await page.mouse.move(cx,cy);await page.mouse.down();await page.waitForTimeout(300);await page.mouse.move(cx,cy+40,{steps:4});await page.waitForTimeout(1600);await page.mouse.up();
  ok('Pressing and swiping away over © does not show the studio',await page.locator('#pb-studio').count()===0);
  await page.mouse.move(cx,cy);await page.mouse.down();await page.waitForTimeout(1700);await page.mouse.up();
  await page.locator('#pb-studio').waitFor({timeout:5000});
  ok('A long press (1.5 s) on the © at the bottom shows the publisher studio',await page.evaluate(()=>localStorage.getItem('pb_studio_visible')==='1'));
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
  ok('The buyer field asks for the pseudonym given at purchase',(await s.locator('[data-studio-buyer]').getAttribute('placeholder'))==='Pseudonym des Käufers (wie beim Kauf angegeben)');
  ok('The studio makes a code for the buyer',/^PBK1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(code)&&(await s.textContent()).includes('Code für Max Muster'));
  const backup=await page.evaluate(()=>PBLicense.backupText());
  ok('A key backup exists and is encrypted',backup.startsWith('PBSTUDIO1.')&&!backup.includes(pub.slice(0,0)+'"ct":""'));
  // ---------- 🧠 password check now and then, 🧩 spare keys 3 of 5 (.27) ----------
  const nextProbe=await page.evaluate(()=>JSON.parse(localStorage.getItem('pb_studio_probe')).next-Date.now());
  ok('A new studio key plans the first password check in about 4 weeks',nextProbe>27*864e5&&nextProbe<29*864e5);
  ok('A wrong password at the check says so and asks again next time',await page.evaluate(async()=>!(await PBLicense.probe('falsch-falsch'))&&PBLicense.probeDue()));
  await page.evaluate(()=>PBLicense.refresh());
  const probeDlg=page.locator('dialog.pb-studio-probe');await probeDlg.waitFor({timeout:10000});
  ok('When due, the app asks for the studio password by itself',(await probeDlg.textContent()).includes('Kennst du dein Studio-Passwort noch?'));
  await probeDlg.locator('input[type=password]').fill(PW);await probeDlg.locator('.pb-studio-probe-check').click();
  await page.waitForFunction(()=>/Richtig/.test(document.querySelector('dialog.pb-studio-probe [role=status]')?.textContent||''),null,{timeout:60000});
  ok('The right password: a tick, the field is emptied, the next check in 4 weeks',await probeDlg.locator('input[type=password]').inputValue()===''&&await page.evaluate(()=>!PBLicense.probeDue()));
  await probeDlg.locator('button',{hasText:'Schließen'}).click();
  if(!(await s.evaluate(d=>d.open)))await s.locator(':scope > summary').click();
  ok('The studio shows the date of the next check and a button to check now',(await page.locator('.pb-studio-probe-next').textContent()).startsWith('Nächste Passwort-Probe: ')&&await page.locator('.pb-studio-probe-now').count()===1);
  await page.locator('#pb-studio [data-studio-pw]').fill('falsch-falsch');await page.locator('.pb-studio-make-shares').click();
  await page.waitForFunction(()=>/Falsches Studio-Passwort/.test(document.querySelector('#pb-studio [data-studio-status]').textContent),null,{timeout:60000});
  ok('Spare keys need the right studio password',await page.locator('.pb-studio-share').count()===0);
  await page.locator('#pb-studio [data-studio-pw]').fill(PW);await page.locator('.pb-studio-make-shares').click();
  await page.waitForFunction(()=>document.querySelectorAll('#pb-studio .pb-studio-share').length===5,null,{timeout:60000});
  const parts=await page.locator('#pb-studio .pb-studio-share textarea').evaluateAll(a=>a.map(x=>x.value));
  ok('Five spare keys, each with copy, and the advice to keep them apart',parts.every(p=>/^JT3v5-/.test(p))&&new Set(parts).size===5&&(await page.locator('.pb-studio-shares').textContent()).includes('Nie alle an einen Ort')&&!parts.some(p=>p.includes(pub)));
  ok('Two parts alone give nothing back',await page.evaluate(async p=>{try{await PBLicense.restoreFromShares(p,'neu-neu-neu-1');return false;}catch{return true;}},parts.slice(0,2)));
  const PW2='Neues-Passwort-27';
  // "Passwort vergessen": three parts and a new password, in the studio on the same device.
  const forgot=page.locator('.pb-studio-forgot');await forgot.locator(':scope > summary').click();
  for(const [i,part] of [parts[4],parts[1],parts[2]].entries())await forgot.locator(`[data-share-part="${i+1}"]`).fill(part);
  const npw=forgot.locator('input[type=password]');await npw.nth(0).fill(PW2);await npw.nth(1).fill(PW2);
  await forgot.locator('.pb-studio-from-shares').click();
  await page.waitForFunction(()=>/zurückgeholt, neues Passwort/.test(document.querySelector('#pb-studio [data-studio-status]')?.textContent||''),null,{timeout:60000});
  ok('Any three spare keys bring the same studio key back under a new password',await page.evaluate(()=>JSON.parse(localStorage.getItem('pb_studio_v1')).pub)===pub);
  ok('Afterwards the new password makes codes and the old one does not',await page.evaluate(async([a,b])=>{try{await PBLicense.makeCode(a,'X',['suche']);return false;}catch{}return Boolean((await PBLicense.makeCode(b,'Y',['suche'])).code);},[PW,PW2]));
  // ---------- a stranger's studio key ----------
  const other=await app(browser,[pub]);
  const foreign=await other.page.evaluate(async()=>{await PBLicense.createKey('fremd-fremd-fremd');return (await PBLicense.makeCode('fremd-fremd-fremd','Ich',['kimsync'])).code;});
  ok('With the publisher key in the app, a self-made studio key does not open anything',await other.page.evaluate(()=>!PBLicense.unlocked('kimsync')&&!PBLicense.isOwner()));
  ok('Spare keys of another studio key cannot replace this one',await other.page.evaluate(async p=>{try{await PBLicense.restoreFromShares(p,'neu-neu-neu-1');return false;}catch(e){return /other key/.test(e.message);}},parts.slice(1,4)));
  await other.context.close();
  // ---------- the buyer's app (publisher key in the app) ----------
  ({page,errors}=await app(browser,[pub]));
  await settings(page);
  const field=page.locator('#pbLicenseCode'),go=page.locator('.pb-license-go'),status=page.locator('[data-license-status]');
  ok('A buyer\'s app shows no studio and no owner note',await page.locator('#pb-studio').count()===0&&await page.locator('.pb-license-owner').count()===0);
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
