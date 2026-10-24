// Genuine pointer/touch/keyboard interactions against the shipped native UI.
// The Android bridge is synthetic; this is not a Samsung DeX hardware claim.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';

const root=resolve('www'),origin='https://localhost/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
const selector={explorer:'[data-pane="explorer"]',folders:'[data-pane="mail-folders"]',list:'[data-pane="mail-list"]'};
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);count++;console.log('✓ '+name);};
const near=(left,right,tolerance=3)=>Math.abs(left-right)<=tolerance;
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function width(page,selector){return page.locator(selector).evaluate(node=>node.getBoundingClientRect().width);}
async function noOverflow(page){return page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('.panel.on').scrollWidth<=document.querySelector('.panel.on').clientWidth+1);}
async function sideBySide(page,selector){return page.locator(selector).evaluate(layout=>{const boxes=['.mail-folders','.mail-list','.mail-reader'].map(selector=>layout.querySelector(':scope>'+selector).getBoundingClientRect());return boxes.every(box=>box.width>0)&&boxes.every(box=>Math.abs(box.top-boxes[0].top)<2)&&boxes[0].right<=boxes[1].left+2&&boxes[1].right<=boxes[2].left+2;});}
async function drag(page,selector,delta){
  const control=page.locator(selector);await control.scrollIntoViewIfNeeded();
  const box=await control.boundingBox();assert.ok(box&&box.width>0&&box.height>0,'Reachable resize handle');
  await page.mouse.move(box.x+box.width/2,box.y+Math.min(70,box.height/2));
  await page.mouse.down();await page.mouse.move(box.x+box.width/2+delta,box.y+Math.min(70,box.height/2),{steps:8});await page.mouse.up();await settle(page);
}
async function touchDrag(page,selector,delta){
  const control=page.locator(selector);await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();
  assert.ok(box&&box.width>0&&box.height>0,'Reachable touch resize handle');
  const x=box.x+box.width/2,y=box.y+Math.min(80,box.height/2),cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+delta*i/6,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await settle(page);
}
async function installFixture(context){
  const errors=[],external=[];
  context.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());});
  await context.route('**/*',async route=>{
    const address=route.request().url();
    if(address.startsWith('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'))return route.fulfill({status:404,body:''});
    if(!address.startsWith(origin)){external.push(address);return route.abort();}
    const path=resolve(root,'.'+new URL(address).pathname.replace(/\/$/,'/index.html'));
    if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await context.addInitScript(()=>{
    const account={id:'11111111-1111-4111-8111-111111111111',email:'panes@example.invalid',provider:'telekom'};
    window.paneCalls=[];window.paneSavedDraft=null;
    const record=(method,args)=>paneCalls.push({method,args});
    window.Capacitor={isNativePlatform:()=>true,Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'pane-fixture',nativeMail:true};}},
      ProSpeech:{async listen(args){record('listen',args);return{cancelled:true};}},
      ProMail:{
        async accounts(){return{items:[account]};},async addAccount(){return account;},
        async folders(args){record('folders',args);return{items:[{path:'INBOX',name:'INBOX',total:2},{path:'Drafts',name:'Drafts',specialUse:'\\Drafts',total:0},{path:'Trash',name:'Trash',specialUse:'\\Trash',total:0}]};},
        async messages(args){record('messages',args);return{validity:'1',total:2,items:[{uid:1,subject:'Pane example mail',from:'sender@example.invalid',date:Date.now(),flags:[],size:400},{uid:2,subject:'Second message',from:'other@example.invalid',date:Date.now(),flags:[],size:180}],next:null};},
        async message(args){record('message',args);return{subject:'Pane example mail',from:'sender@example.invalid',to:account.email,text:'Synthetic stored text for resize tests.',html:'',raw:'Subject: pane\r\n\r\nSynthetic text',attachments:[]};},
        async saveDraft(args){record('saveDraft',args);window.paneSavedDraft=structuredClone(args.draft);return{ok:true};},
        async saved(){return{items:paneSavedDraft?[{id:'pane-draft',status:'draft',subject:paneSavedDraft.subject,to:paneSavedDraft.to,created:Date.now()}]:[]};},
        async savedDraft(){return structuredClone(paneSavedDraft);},
        async send(args){record('send',args);throw{code:'INVALID_INPUT'};}
      }
    }};
  });
  return{errors,external};
}
async function ready(page){
  await page.goto(origin);await page.waitForFunction(()=>window.PBWorkspace&&window.PBTheme&&window.PBMailDevice&&typeof db!=='undefined'&&db);
}
async function seed(page){
  await page.evaluate(async()=>{
    if(!CATALOG.some(record=>record.name==='pane-alpha.txt')){
      for(const name of ['pane-alpha.txt','pane-beta.txt']){
        const words=tokens(name+' saved pane test document'),record={hash:await sha256(new TextEncoder().encode(name).buffer),name,path:'Pane/Projects/'+name,type:'text/plain',ext:'txt',date:Date.now(),size:300,snippet:'saved pane test document',summary:'',vector:buildVector(words),tf:termFreq(words),category:'Notiz',dirId:null,nameTokens:tokens(name),dupes:[],tags:[]};
        CATALOG.push(record);HASHSET.add(record.hash);await idbPut('catalog',record);
      }
      rebuildIndex();
    }
    refreshAll();PBWorkspace.restoreExplorer({path:'dir:note:Pane/Projects',filter:'pane-alpha',sort:'name',reverse:false,content:false});
  });
}
async function accessibleSeparators(page,selector,count){
  return page.locator(selector).evaluateAll((nodes,count)=>nodes.length===count&&nodes.every(node=>node.getAttribute('role')==='separator'&&node.getAttribute('aria-orientation')==='vertical'&&node.tabIndex===0&&Boolean(node.getAttribute('aria-label'))&&node.hasAttribute('aria-valuenow')&&Number.isFinite(Number(node.getAttribute('aria-valuenow')))&&Number(node.getAttribute('aria-valuemin'))<Number(node.getAttribute('aria-valuemax'))&&Boolean(node.getAttribute('aria-controls'))&&node.getAttribute('aria-controls').split(/\s+/).every(id=>document.getElementById(id))),count);
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1920,height:1080},hasTouch:true}),{errors,external}=await installFixture(context),page=await context.newPage();
  await ready(page);await seed(page);await navigateTo(page,'search');if(await page.locator('#mode [data-m=mean]').getAttribute('aria-pressed')==='true')await page.locator('#mode [data-m=mean]').click();await page.locator('#q').fill('pane query survives');
  await navigateTo(page,'explorer');await page.locator(selector.explorer).waitFor({state:'visible'});await settle(page);
  const explorer=page.locator(selector.explorer),initialTree=await width(page,'#explorerTree'),initialFiles=await width(page,'#explorerFiles'),state=await page.evaluate(()=>PBWorkspace.explorerState());
  ok('Explorer has an accessible keyboard-operated separator',await accessibleSeparators(page,selector.explorer,1));
  ok('Idle inactive panes do not continuously rewrite pane classes or hidden handles',await page.evaluate(async()=>{let mutations=0;const observer=new MutationObserver(records=>{mutations+=records.filter(record=>record.target.matches('[data-pb-panes],.pb-pane-splitter')).length;});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class']});for(let i=0;i<6;i++)await new Promise(resolve=>requestAnimationFrame(resolve));observer.disconnect();return mutations===0;}));
  await page.evaluate(()=>{window.paneRefs={tree:document.getElementById('explorerTree'),files:document.getElementById('explorerFiles'),filter:document.getElementById('explorerFilter')};});
  await drag(page,selector.explorer,110);
  ok('A real mouse drag widens the tree and frees less space for the file list',await width(page,'#explorerTree')>initialTree+80&&await width(page,'#explorerFiles')<initialFiles-80);
  ok('Explorer resizing preserves the selected folder, filter and sort',JSON.stringify(await page.evaluate(()=>PBWorkspace.explorerState()))===JSON.stringify(state));
  ok('Explorer resizing keeps the same live DOM nodes and query',await page.evaluate(()=>paneRefs.tree===document.getElementById('explorerTree')&&paneRefs.files===document.getElementById('explorerFiles')&&paneRefs.filter===document.getElementById('explorerFilter')&&document.getElementById('q').value==='pane query survives'));
  const beforeTouch=await width(page,'#explorerTree');await touchDrag(page,selector.explorer,65);
  ok('A genuine touch drag can resize a wide DeX-style Explorer pane',await width(page,'#explorerTree')>beforeTouch+40);
  const cancelStart=await width(page,'#explorerTree'),cancelBox=await explorer.boundingBox();
  await page.mouse.move(cancelBox.x+cancelBox.width/2,cancelBox.y+Math.min(60,cancelBox.height/2));await page.mouse.down();await page.mouse.move(cancelBox.x+cancelBox.width/2+60,cancelBox.y+Math.min(60,cancelBox.height/2),{steps:5});await settle(page);
  ok('A live drag visibly resizes before release',await width(page,'#explorerTree')>cancelStart+35);
  await page.keyboard.press('Escape');await page.mouse.up();await settle(page);ok('Escape cancels an unfinished drag and restores the starting width',near(await width(page,'#explorerTree'),cancelStart));
  await explorer.focus();const beforeKey=await width(page,'#explorerTree');await page.keyboard.press('ArrowRight');await settle(page);
  ok('ArrowRight widens the focused Explorer pane',await width(page,'#explorerTree')>beforeKey);
  await page.keyboard.press('ArrowLeft');await settle(page);ok('ArrowLeft reverses the keyboard adjustment',near(await width(page,'#explorerTree'),beforeKey));
  await page.keyboard.press('Shift+ArrowRight');await settle(page);ok('Shift plus an arrow makes the larger keyboard adjustment',near(await width(page,'#explorerTree'),beforeKey+40));
  await page.keyboard.press('Home');await settle(page);const minimum=await width(page,'#explorerTree');
  await page.keyboard.press('End');await settle(page);const maximum=await width(page,'#explorerTree');
  ok('Home and End reach useful bounded widths',minimum>=120&&maximum>minimum+80&&await width(page,'#explorerFiles')>=230&&await noOverflow(page));
  await explorer.dblclick();await settle(page);ok('Double-click resets the Explorer split to its initial size',near(await width(page,'#explorerTree'),initialTree));
  await drag(page,selector.explorer,125);const persisted=await width(page,'#explorerTree');
  await navigateTo(page,'search');await navigateTo(page,'explorer');ok('Changing views retains the chosen Explorer width',near(await width(page,'#explorerTree'),persisted));
  for(const theme of ['graphit','petrol','nachtblau','klarblau']){await page.evaluate(theme=>PBTheme.choose(theme),theme);await settle(page);ok(theme+': the separator remains usable and retains the split',await explorer.isVisible()&&near(await width(page,'#explorerTree'),persisted));}
  await page.reload();await page.waitForFunction(()=>window.PBWorkspace&&typeof db!=='undefined'&&db);await navigateTo(page,'explorer');await explorer.waitFor({state:'visible'});await settle(page);
  ok('The chosen Explorer width is restored after a real page reload',near(await width(page,'#explorerTree'),persisted));
  await seed(page);
  await page.locator('#explorerTreeToggle').click();await settle(page);ok('Hiding the tree also hides its otherwise interactive separator',await explorer.isHidden()&&await page.locator('#explorerTree').isHidden()&&await noOverflow(page));
  await page.locator('#explorerTreeToggle').click();await settle(page);ok('Showing the tree restores its width and separator',await explorer.isVisible()&&near(await width(page,'#explorerTree'),persisted));
  for(const size of [{width:1280,height:720},{width:960,height:540},{width:720,height:540}]){await page.setViewportSize(size);await settle(page);ok(`${size.width}x${size.height}: saved wide split is clamped without page overflow`,await explorer.isVisible()&&await width(page,'#explorerTree')>=120&&await width(page,'#explorerFiles')>=230&&await noOverflow(page));}
  for(const size of [{width:1024,height:1366},{width:768,height:1024},{width:360,height:800}]){await page.setViewportSize(size);await settle(page);ok(`${size.width}x${size.height}: portrait uses a full-width file pane with no active separator`,await explorer.isHidden()&&await page.locator('#explorerTree').isHidden()&&await width(page,'#explorerFiles')>size.width*.8&&await noOverflow(page));}
  await page.setViewportSize({width:1920,height:1080});await settle(page);ok('Returning from portrait restores the persisted wide split',near(await width(page,'#explorerTree'),persisted));

  await navigateTo(page,'mail');const local='.mail-app:not(.live-mail)',localFolders=local+' '+selector.folders,localList=local+' '+selector.list;
  await page.locator(localFolders).waitFor({state:'visible'});ok('The local mailbox exposes two accessible separators',await accessibleSeparators(page,localFolders+','+localList,2));
  const localFolderStart=await width(page,local+' .mail-folders');await drag(page,localFolders,65);ok('The local mailbox folder width can be changed with the mouse',await width(page,local+' .mail-folders')>localFolderStart+45&&await noOverflow(page));
  const localListStart=await width(page,local+' .mail-list');await drag(page,localList,75);ok('The local mailbox message-list width is independently resizable',await width(page,local+' .mail-list')>localListStart+50&&await width(page,local+' .mail-reader')>=250);
  await page.locator(local+' [data-mail-text=compose]').click();await page.locator('#pb-mail-to').fill('local@example.invalid');await page.locator('#pb-mail-subject').fill('Local preserved draft');await page.locator('#pb-mail-body').fill('Local text remains intact while dragging.');
  const localValues=await page.locator('#pb-mail-to,#pb-mail-subject,#pb-mail-body').evaluateAll(nodes=>nodes.map(node=>node.value));await drag(page,localList,-40);
  ok('Resizing the local composer keeps all entered fields',JSON.stringify(await page.locator('#pb-mail-to,#pb-mail-subject,#pb-mail-body').evaluateAll(nodes=>nodes.map(node=>node.value)))===JSON.stringify(localValues));
  await page.locator(local+' [data-mail-text=save]').click();await page.waitForFunction(()=>CATALOG.some(record=>record.name==='Local preserved draft'&&record.mailKind==='draft'));
  await page.locator('#mailWorkspace [data-live-text=connect]').click();await page.locator('.live-mail [data-live-uid="1"]').waitFor();
  const live='.live-mail',folders=live+' '+selector.folders,list=live+' '+selector.list;await page.locator(folders).waitFor({state:'visible'});
  ok('The native mailbox exposes two accessible separators',await accessibleSeparators(page,folders+','+list,2));
  const liveFolderStart=await width(page,live+' .mail-folders');await drag(page,folders,55);ok('Native mailbox folders resize with genuine pointer input',await width(page,live+' .mail-folders')>liveFolderStart+35);
  const liveListStart=await width(page,live+' .mail-list');await drag(page,list,85);ok('Native mailbox list and reader adjust without overflowing',await width(page,live+' .mail-list')>liveListStart+55&&await width(page,live+' .mail-reader')>=250&&await noOverflow(page));
  await page.locator(live+' .mail-list input[type=search]').fill('Pane example');await page.locator(live+' [data-live-text=compose]').click();
  for(const[key,value]of Object.entries({to:'receiver@example.invalid',subject:'Native preserved draft',text:'Native text survives container resizing.'}))await page.locator('#pb-live-'+key).fill(value);
  await page.locator(live+' .mail-copy-fields>summary').click();await page.locator('#pb-live-cc').fill('copy@example.invalid');await page.locator('#pb-live-bcc').fill('blind@example.invalid');
  const expected=await page.evaluate(()=>['to','cc','bcc','subject','text'].map(key=>document.getElementById('pb-live-'+key).value));await page.evaluate(()=>{window.paneDraftNodes=['to','cc','bcc','subject','text'].map(key=>document.getElementById('pb-live-'+key));});
  await touchDrag(page,list,-55);await page.locator(folders).focus();await page.keyboard.press('ArrowRight');await settle(page);
  ok('Touch and keyboard resizing keep native draft values and live field nodes',await page.evaluate(expected=>['to','cc','bcc','subject','text'].every((key,index)=>document.getElementById('pb-live-'+key)===paneDraftNodes[index]&&paneDraftNodes[index].value===expected[index]),expected));
  ok('Mail filtering survives splitter interactions',await page.locator(live+' .mail-list input[type=search]').inputValue()==='Pane example');
  const mailFolderPersisted=await width(page,live+' .mail-folders'),mailListPersisted=await width(page,live+' .mail-list');
  for(const size of [{width:1280,height:720},{width:960,height:540},{width:901,height:540}]){
    await page.setViewportSize(size);await settle(page);
    ok(`${size.width}x${size.height}: all wide mail panes share one row with clamped saved widths`,await page.locator(folders).isVisible()&&await page.locator(list).isVisible()&&await sideBySide(page,live+' .mail-layout')&&await width(page,live+' .mail-folders')>=120&&await width(page,live+' .mail-list')>=180&&await width(page,live+' .mail-reader')>=250&&await noOverflow(page));
  }
  for(const size of [{width:1024,height:1366},{width:768,height:1024},{width:412,height:915},{width:800,height:540}]){
    await page.setViewportSize(size);await settle(page);
    ok(`${size.width}x${size.height}: a compact window hides mail separators and preserves the full editor`,await page.locator(folders).isHidden()&&await page.locator(list).isHidden()&&await width(page,live+' .mail-reader')>size.width*.8&&await page.locator(live+' .mail-back').isVisible()&&await noOverflow(page));
    ok(`${size.width}x${size.height}: all draft recipients, subject and text survive the compact window`,await page.evaluate(expected=>['to','cc','bcc','subject','text'].every((key,index)=>document.getElementById('pb-live-'+key).value===expected[index]),expected));
  }
  await page.setViewportSize({width:1920,height:1080});await settle(page);ok('Returning to DeX restores both mail widths and keeps the draft',near(await width(page,live+' .mail-folders'),mailFolderPersisted)&&near(await width(page,live+' .mail-list'),mailListPersisted)&&await page.evaluate(expected=>['to','cc','bcc','subject','text'].every((key,index)=>document.getElementById('pb-live-'+key).value===expected[index]),expected));
  await page.locator(live+' [data-live-text=draft]').click();await page.waitForFunction(()=>Boolean(window.paneSavedDraft));ok('The resized composer still saves the complete native draft exactly once',await page.evaluate(()=>paneCalls.filter(call=>call.method==='saveDraft').length===1&&paneSavedDraft.cc==='copy@example.invalid'&&paneSavedDraft.bcc==='blind@example.invalid'));
  await page.reload();await page.waitForFunction(()=>window.PBMailDevice&&window.PBWorkspace&&typeof db!=='undefined'&&db);await navigateTo(page,'mail');await page.locator('#mailWorkspace [data-live-text=connect]').click();await page.locator('.live-mail [data-live-uid="1"]').waitFor();await settle(page);
  ok('Native mail widths survive a real reload and reconnection',near(await width(page,live+' .mail-folders'),mailFolderPersisted)&&near(await width(page,live+' .mail-list'),mailListPersisted));
  await page.locator(list).dblclick();await page.locator(folders).dblclick();await settle(page);ok('Both native mail separators support resetting their widths',await width(page,live+' .mail-folders')<mailFolderPersisted&&await width(page,live+' .mail-list')<mailListPersisted+10&&await noOverflow(page));
  ok('Resizing never sends a mail or starts the microphone',await page.evaluate(()=>!paneCalls.some(call=>call.method==='send'||call.method==='listen')));
  ok('All interactions use local fixture assets without real provider requests',external.length===0);
  ok('Pane gestures, persistence and responsive changes raise no unhandled app error',errors.length===0);
  console.log(`${count} pane-resizing checks passed (real browser pointer/touch/keyboard; synthetic Android bridge, no physical DeX claim).`);
  await context.close();
}finally{await browser?.close();}
