// Samsung DeX-oriented web UI checks using the Android bridge contract.
// Desktop Chromium is not Samsung's Android WebView or an actual DeX session.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),origin='https://localhost/';
// Optional evidence only. Normal CI neither creates nor emits screenshots.
const output=process.env.PB_ADAPTIVE_CAPTURE_DIR || (process.env.PB_CAPTURE_DESIGN==='1' ? resolve('docs/design/adaptive') : null);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
const sizes=[[320,740],[360,800],[412,915],[480,960],[768,1024],[800,1280],[1024,1366],[960,540],[1280,720],[1920,1080],[2560,1440]];
const checks=[],layouts=[],listLayouts=[],errors=[],external=[];
const check=(name,value,detail)=>{checks.push({name,pass:Boolean(value),...(detail?{detail}:{})});if(!value)console.log('FAIL '+name+' '+JSON.stringify(detail||''));};
let browser;
async function tabTo(page,selector,limit=16){
  for(let i=0;i<limit;i++){
    await page.keyboard.press('Tab');
    if(await page.locator(selector).evaluate(e=>e===document.activeElement))return true;
  }
  return false;
}
try{
 if(output)await mkdir(output,{recursive:true});
 browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/*',async route=>{
   const url=route.request().url();
   if(url.startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))return route.fulfill({status:404,body:''});
   if(!url.startsWith(origin)){external.push(url);return route.fulfill({status:404,body:''});}
   const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();
   try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
 });
 await page.addInitScript(()=>{
   window.dexCalls=[];window.dexSavedDraft=null;const originals=new Map(),pending=new Map(),account={id:'11111111-1111-4111-8111-111111111111',email:'dex@example.invalid',provider:'telekom'};
   const log=(method,args)=>window.dexCalls.push({method,args});
   window.Capacitor={isNativePlatform:()=>true,Plugins:{
    ProDevice:{async getInfo(){return{platform:'android',versionName:'adaptive-fixture',nativeMail:true};}},
    ProSpeech:{async listen(args){log('listen',args);return{cancelled:true};}},
    ProFiles:{
      async listOriginals(){return{items:[...originals.keys()]};},
      async beginImport(args){const ticket=args.hash;pending.set(ticket,{args,parts:[]});return{ticket};},
      async appendImport(args){pending.get(args.ticket).parts.push(args.data);return{ok:true};},
      async finishImport(args){const p=pending.get(args.ticket);originals.set(args.ticket,p);pending.delete(args.ticket);return{ok:true};},
      async abortImport(args){pending.delete(args.ticket);return{ok:true};},
      async originalInfo(args){return originals.get(args.hash)?.args||{missing:true};},
      async readOriginal(args){log('readOriginal',args);return{data:originals.get(args.hash).parts[Math.floor(args.offset/262144)]};},
      async open(args){log('open',args);return{ok:true};}
    },
    ProMail:{
      async accounts(){return{items:[account]};},
      async addAccount(){return account;},
      async folders(args){log('folders',args);return{items:[{path:'INBOX',name:'INBOX',total:2},{path:'Drafts',name:'Drafts',specialUse:'\\Drafts',total:0},{path:'Sent',name:'Sent',specialUse:'\\Sent',total:0},{path:'Trash',name:'Trash',specialUse:'\\Trash',total:0}]};},
      async messages(args){log('messages',args);return{validity:'1',total:2,items:[{uid:1,subject:'DeX Beispielnachricht',from:'sender@example.invalid',date:Date.now(),flags:[],size:256},{uid:2,subject:'Zweite Nachricht',from:'second@example.invalid',date:Date.now(),flags:[],size:256}],next:null};},
      async message(args){log('message',args);return{subject:'DeX Beispielnachricht',from:'sender@example.invalid',to:account.email,text:'Gespeicherte synthetische Nachricht.',html:'',raw:'Subject: DeX\r\n\r\nsynthetic',attachments:[]};},
      async saveDraft(args){log('saveDraft',args);window.dexSavedDraft=structuredClone(args.draft);return{ok:true};},
      async saved(){return{items:window.dexSavedDraft?[{id:'dex-draft',status:'draft',subject:window.dexSavedDraft.subject,to:window.dexSavedDraft.to,created:Date.now()}]:[]};},
      async savedDraft(){return structuredClone(window.dexSavedDraft);},
      async send(args){log('send',args);throw{code:'INVALID_INPUT'};}
    }
   }};
 });
 await page.goto(origin);await page.waitForFunction(()=>window.PBWorkspace&&window.PBTheme&&window.PBMailDevice&&typeof db!=='undefined'&&db);
 await navigateTo(page,'intake');
 await page.setInputFiles('#fileInput',[{name:'DeXnote-1.txt',mimeType:'text/plain',buffer:Buffer.from('DeX window resize and keyboard fixture.')},{name:'DeXnote-2.txt',mimeType:'text/plain',buffer:Buffer.from('Second document for the DeX folder tree.')}]);
 await page.waitForFunction(()=>CATALOG.length===2&&!signing);
 await page.evaluate(()=>{for(const r of CATALOG)r.path='DeX/Projects/'+r.name;PBWorkspace.refresh();});
 await navigateTo(page,'explorer');
 const noteKind=page.locator('#explorerTree button[data-path="kind:note"]');
 await noteKind.focus();await page.keyboard.press('ArrowRight');
 check('Explorer ArrowRight opens a collapsed kind',await page.locator('#explorerTree button[data-path="dir:note:DeX"]').isVisible());
 await page.locator('#explorerTree button[data-path="dir:note:DeX"]').focus();await page.keyboard.press('ArrowRight');
 const project=page.locator('#explorerTree button[data-path="dir:note:DeX/Projects"]');
 await project.focus();await page.keyboard.press('Enter');
 await page.locator('#explorerFilter').fill('DeXnote');await page.keyboard.press('Backspace');
 const explorerState=await page.evaluate(()=>PBWorkspace.explorerState());
 check('Explorer Enter selects folder and Backspace edits filter',explorerState.path==='dir:note:DeX/Projects'&&explorerState.filter==='DeXnot',explorerState);
 await page.locator('#explorerTree button[data-path="dir:note:DeX"]').focus();await page.keyboard.press('ArrowLeft');
 check('Explorer ArrowLeft collapses an ancestor while retaining the selected folder and filter',!await project.isVisible()&&await page.evaluate(()=>PBWorkspace.explorerState().path==='dir:note:DeX/Projects'&&PBWorkspace.explorerState().filter==='DeXnot'));
 await page.keyboard.press('ArrowRight');await project.waitFor({state:'visible'});
 check('Explorer ArrowRight reopens the selected folder ancestor',await project.isVisible());
 await navigateTo(page,'search');if(await page.locator('#mode [data-m="mean"]').getAttribute('aria-pressed')==='true')await page.locator('#mode [data-m="mean"]').click();await page.locator('#q').fill('DeXnote');await page.keyboard.press('Backspace');
 check('Search Backspace changes query without navigating',(await page.locator('#q').inputValue())==='DeXnot'&&await page.locator('#panel-search').isVisible());
 for(const [width,height]of sizes){
   await page.setViewportSize({width,height});await page.waitForTimeout(35);
   check(`${width}x${height}: query survives resize`,await page.locator('#q').inputValue()==='DeXnot');
   check(`${width}x${height}: search has no horizontal page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('.panel.on').scrollWidth<=document.querySelector('.panel.on').clientWidth+1));
   await navigateTo(page,'explorer');
   const current=await page.evaluate(()=>PBWorkspace.explorerState());
   check(`${width}x${height}: folder/filter survive resize`,current.path===explorerState.path&&current.filter===explorerState.filter);
   check(`${width}x${height}: explorer has no horizontal page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('.panel.on').scrollWidth<=document.querySelector('.panel.on').clientWidth+1));
   if(height>width)check(`${width}x${height}: portrait hides the tree while retaining a visible working path`,await page.locator('#explorerTree').isHidden()&&await page.locator('#explorerTreeToggle').isHidden()&&await page.locator('#explorerPath').isVisible()&&(await page.locator('#explorerPath').textContent()).includes('Projects'));
   await navigateTo(page,'search');
 }
 // Keyboard-operated menu and pinned gear, using genuine key events.
 await page.setViewportSize({width:1280,height:720});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const menu=page.locator('.native-options>summary');await menu.focus();await page.keyboard.press('Enter');
 await page.keyboard.press('Escape');
 const reached=await tabTo(page,'.native-toolbar-quick [data-tab=settings]');
 check('Tab reaches the direct Settings gear outside the scrolling strip',reached);
 if(reached){await page.keyboard.press('Enter');await page.locator('#panel-settings').waitFor({state:'visible'});check('Enter activates Settings and keeps the visible gear focused',await page.evaluate(()=>document.activeElement.matches('.native-toolbar-quick [data-tab=settings]')&&document.activeElement.getClientRects().length>0&&history.state?.pbPage==='settings'));}
 await navigateTo(page,'mail');await page.locator('#mailWorkspace [data-live-text=connect]').click();
 await page.locator('.live-mail [data-live-uid="1"]').waitFor();
 for(const [width,height]of sizes){
   await page.setViewportSize({width,height});
   const sample=await page.evaluate(()=>{const app=document.querySelector('.live-mail'),layout=app.querySelector('.mail-layout'),folders=app.querySelector('.mail-folders'),visible=e=>e.getClientRects().length&&getComputedStyle(e).display!=='none';return{size:[innerWidth,innerHeight],view:app.dataset.view,display:getComputedStyle(layout).display,columns:getComputedStyle(layout).gridTemplateColumns,folderDisplay:getComputedStyle(folders).display,panes:['mail-folders','mail-list','mail-reader'].filter(k=>visible(app.querySelector('.'+k))),pageOverflow:document.documentElement.scrollWidth>innerWidth+1};});
   listLayouts.push(sample);check(`${width}x${height}: mail list has no horizontal page overflow`,!sample.pageOverflow,sample);
   if(height>width)check(`${width}x${height}: portrait mail list has one working list and a folder strip`,sample.display==='flex'&&sample.folderDisplay==='flex'&&!sample.panes.includes('mail-reader')&&sample.panes.includes('mail-list'),sample);
 }
 await page.setViewportSize({width:1280,height:720});
 await page.locator('.live-mail [data-live-text=compose]').click();
 await page.locator('#pb-live-to').fill('recipient@example.invalid');await page.locator('#pb-live-subject').fill('DeX resize draft');await page.locator('#pb-live-text').fill('Entwurf bleibt beim Drehen und Vergrößern erhalten.');
 await page.waitForFunction(()=>document.getElementById('pb-live-text')?.closest('.pb-dictate-wrap')?.querySelector('.pb-dictate'));
 check('Composer text fields have explicit input language and spelling enabled',await page.locator('#pb-live-subject,#pb-live-text').evaluateAll(fields=>fields.length===2&&fields.every(field=>field.lang==='de'&&field.spellcheck===true)));
 check('Composer text and explorer filter receive their own named microphone controls; To and Subject none (Klaus 2026-10-28)',await page.evaluate(()=>['pb-live-to','pb-live-subject'].every(id=>!document.getElementById(id)?.closest('.pb-dictate-wrap'))&&['pb-live-text','explorerFilter'].every(id=>{const field=document.getElementById(id),mic=field?.closest('.pb-dictate-wrap')?.querySelector('.pb-dictate');return mic?.getAttribute('aria-label')?.startsWith('Diktieren')&&mic.querySelector('svg.pb-speech-icon');})));
 await page.locator('.live-mail .mail-copy-fields>summary').focus();await page.keyboard.press('Enter');
 await page.locator('#pb-live-cc').fill('copy@example.invalid');await page.locator('#pb-live-bcc').fill('blind@example.invalid');
 await page.locator('#pb-live-to').focus();
 check('Composer Tab reaches the named Cc/Bcc disclosure',await tabTo(page,'.live-mail .mail-copy-fields>summary'));
 check('Expanded Cc field is reachable by keyboard',await tabTo(page,'#pb-live-cc'));
 const expected=await page.evaluate(()=>['to','cc','bcc','subject','text'].map(k=>document.getElementById('pb-live-'+k).value));
 for(const theme of ['klarblau','graphit','petrol','nachtblau']){
   await page.evaluate(theme=>PBTheme.choose(theme),theme);await page.waitForTimeout(160);
   for(const [width,height]of sizes){
     await page.setViewportSize({width,height});await page.waitForTimeout(45);
     const sample=await page.evaluate(()=>{
       const app=document.querySelector('.live-mail'),layout=app.querySelector('.mail-layout'),reader=app.querySelector('.mail-reader'),send=app.querySelector('[data-live-text=send]');
       const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
       const panes=['mail-folders','mail-list','mail-reader'].filter(k=>visible(app.querySelector('.'+k)));
       const r=send.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),back=reader.querySelector('.mail-back');
       const buttonVisible=visible(send)&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
       return{size:[innerWidth,innerHeight],theme:document.documentElement.dataset.pbTheme,orientation:matchMedia('(orientation:portrait)').matches?'portrait':'landscape',display:getComputedStyle(layout).display,columns:getComputedStyle(layout).gridTemplateColumns,panes,backVisible:back&&visible(back),readerWidth:Math.round(reader.getBoundingClientRect().width),documentWidth:document.documentElement.scrollWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,activeOverflow:document.querySelector('.panel.on').scrollWidth>document.querySelector('.panel.on').clientWidth+1,sendVisible:buttonVisible,sendHit:buttonVisible&&(send===hit||send.contains(hit)),send:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},values:['to','cc','bcc','subject','text'].map(k=>document.getElementById('pb-live-'+k).value)};
     });
     layouts.push(sample);
     const label=`${theme} ${width}x${height}`;
     check(label+': typed draft and Cc/Bcc survive resizing',JSON.stringify(sample.values)===JSON.stringify(expected));
     check(label+': no horizontal page overflow',!sample.pageOverflow&&!sample.activeOverflow,sample);
     check(label+': primary Send remains visible and receives mouse hits',sample.sendVisible&&sample.sendHit,sample.send);
     if(height>width)check(label+': portrait has a single editor pane with a visible Back control',sample.panes.length===1&&sample.panes[0]==='mail-reader'&&sample.backVisible,sample);
     else check(label+': a wide DeX window restores side-by-side mail panes',sample.display==='grid'&&sample.panes.length===3,sample);
     if(output&&theme==='klarblau'&&[412,1024,1920].includes(width))await page.screenshot({path:`${output}/composer-${width}x${height}.png`});
   }
 }
 // Return from a phone window to wide DeX; a changed viewport must not submit anything.
 await page.setViewportSize({width:412,height:915});await page.setViewportSize({width:1920,height:1080});
 await page.locator('#pb-live-text').focus();await page.keyboard.press('End');await page.keyboard.press('Backspace');
 check('Composer Backspace edits text instead of leaving the page',(await page.locator('#pb-live-text').inputValue())===expected[4].slice(0,-1));
 await page.locator('.live-mail [data-live-text=draft]').focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>Boolean(window.dexSavedDraft));
 check('Keyboard Enter saves exactly one native draft with Cc/Bcc intact',await page.evaluate(()=>dexCalls.filter(x=>x.method==='saveDraft').length===1&&dexSavedDraft.cc==='copy@example.invalid'&&dexSavedDraft.bcc==='blind@example.invalid'));
 await navigateTo(page,'explorer');await page.locator('#explorerFiles .explorer-row>button').first().click();await page.locator('.native-file-viewer').waitFor();
 await page.keyboard.press('Escape');await page.locator('.native-file-viewer').waitFor({state:'hidden'});
 check('Escape closes the original viewer and restores the folder and filter',await page.evaluate(()=>PBWorkspace.explorerState().path==='dir:note:DeX/Projects'&&PBWorkspace.explorerState().filter==='DeXnot'));
 check('No SMTP submit occurred during keyboard, pointer and resize checks',await page.evaluate(()=>!dexCalls.some(x=>x.method==='send')));
 check('Microphones never start without a user request',await page.evaluate(()=>!dexCalls.some(x=>x.method==='listen')));
 check('No real provider or other external network requests were made',external.length===0,external);
 check('No unhandled runtime errors',errors.length===0,errors);
 const result={scope:'Desktop Chromium with synthetic Android Capacitor bridge; not a Samsung DeX/device run',source:'native www',checks,layouts,listLayouts,errors,external,summary:{total:checks.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length}};
 if(output)await writeFile(output+'/result.json',JSON.stringify(result,null,2));
 console.log('SUMMARY '+JSON.stringify(result.summary));
 assert.equal(result.summary.failed,0,'DeX-oriented browser checks');
}finally{await browser?.close();}
