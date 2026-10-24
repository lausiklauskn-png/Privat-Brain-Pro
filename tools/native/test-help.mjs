// Actual native app UI; only folder transport and embeddings are simulated.
// Ordinary explanations collapse, while actions and important state stay usable.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve(process.env.PB_HELP_TEST_ROOT||'www'),origin='https://localhost/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
const toggle=(page,key)=>page.locator(`[data-pb-help-toggle="${key}"]`);
const region=(page,key)=>page.locator(`[data-pb-help-content="${key}"]`);
async function menuControl(page,selector){
  const target=page.locator(selector);await target.waitFor({state:'attached'});
  if(!await target.isVisible()){
    const menu=page.locator('.native-options');if(!await menu.evaluate(node=>node.open))await menu.locator(':scope>summary').click();
  }
  await target.click();
}
async function layoutReady(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function fixture(touch=false){
  const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:touch}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
    const address=route.request().url();if(!address.startsWith(origin))return route.fulfill({status:404,body:''});
    const path=resolve(root,'.'+new URL(address).pathname.replace(/\/$/,'/index.html'));
    if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(()=>{
    localStorage.setItem('pb_lang','de');localStorage.setItem('pb_fs_ok','1');
    window.fixtureFolderCalls=[];window.fixtureFolderFails=false;window.fixturePreferenceWritesFail=false;
    const originalSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(window.fixturePreferenceWritesFail&&['pb_pro_theme_v1','pb_pro_light_theme_v1','pb_input_language_v1'].includes(key))throw new DOMException('Synthetic preference storage failure','QuotaExceededError');
      return originalSet.call(this,key,value);
    };
    window.__CB_EMBED_STUB__={
      async embedQuery(){return Float32Array.from({length:384},(_,i)=>i===0?1:0);},
      async embedPassage(){return Float32Array.from({length:384},(_,i)=>i===0?1:0);},
      async embedPassageBatch(texts){return texts.map(()=>Float32Array.from({length:384},(_,i)=>i===0?1:0));}
    };
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'fixture'};}},
      ProVault:{async state(){return{configured:false,unlocked:false,attachments:0,attachmentBytes:0};}},
      ProFolders:{
        async state(){return{enabled:false,name:''};},
        async chooseLibrary(){fixtureFolderCalls.push('library');if(fixtureFolderFails)throw new Error('Synthetic revoked permission');return{cancelled:true};},
        async chooseSource(){fixtureFolderCalls.push('source');return{cancelled:true};},
        async finishSource(){return{ok:true};},async pause(){return{enabled:false,name:''};}
      }
    }};
  });
  await page.goto(origin);
  await page.waitForFunction(()=>window.PBHelp&&window.PBTheme&&window.PBInputLanguage&&window.PBFolders&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  await toggle(page,'theme').waitFor({state:'attached'});await layoutReady(page);
  return{context,page,errors};
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{context,page,errors}=await fixture();
  await navigateTo(page,'intake');
  for(const key of ['import-library','import-drop']){
    ok(`${key}: routine import explanation starts collapsed`,await toggle(page,key).getAttribute('aria-expanded')==='false'&&await region(page,key).evaluate(node=>node.hidden));
    ok(`${key}: the accessible information button controls the actual preserved text`,await toggle(page,key).evaluate(button=>{const target=document.getElementById(button.getAttribute('aria-controls'));return Boolean(button.type==='button'&&button.getAttribute('aria-label')?.trim()&&button.querySelector('svg[aria-hidden=true]')&&target?.textContent.trim());}));
  }
  ok('The Add tab names the view without a repeated visible title or third information row',await page.locator('#panel-intake').evaluate(panel=>{
    const heading=panel.querySelector(':scope>h2[data-ws=add]');
    return Boolean(heading?.hidden&&heading.getBoundingClientRect().height===0&&panel.getAttribute('aria-labelledby')===heading.id&&
      !panel.querySelector(':scope>.pb-help-heading')&&panel.querySelectorAll('[data-pb-help-toggle]').length===2);
  }));
  ok('General reassurance shares the closed import help rather than another explanation box',await page.locator('.native-import-reassurance').evaluate(node=>node.closest('[data-pb-help-content]')?.dataset.pbHelpContent==='import-drop'&&node.closest('[data-pb-help-content]').hidden));
  ok('The redundant drop title is hidden and its existing information button follows the import actions',await page.locator('#drop').evaluate(drop=>{
    const heading=drop.querySelector(':scope>h2'),actions=drop.querySelector(':scope>.btnrow'),help=drop.querySelector('[data-pb-help-toggle=import-drop]');
    return Boolean(heading?.hidden&&heading.getBoundingClientRect().height===0&&!drop.querySelector(':scope>.pb-help-heading')&&
      actions?.lastElementChild===help&&['pickDir','pickFiles','pickMail'].every(id=>document.getElementById(id).parentElement===actions));
  }));
  ok('Folder, file and mail import actions remain directly visible',await page.locator('#pickDir').isVisible()&&await page.locator('#pickFiles').isVisible()&&await page.locator('#pickMail').isVisible()&&await page.locator('#chooseLibrary').isVisible());
  ok('Storage and encryption status stay visible outside ordinary help',await page.locator('#libraryStatus').isVisible()&&await page.locator('#vaultLine').isVisible()&&await page.locator('#vaultLine').evaluate(node=>!node.closest('[data-pb-help-content]')&&Boolean(node.querySelector('button'))));
  await page.evaluate(()=>{window.helpOriginalNodes={files:document.getElementById('pickFiles'),library:document.getElementById('chooseLibrary'),help:document.querySelector('[data-ws=libraryHelp]'),hint:document.getElementById('fsHint'),title:document.querySelector('#panel-intake>h2[data-ws=add]'),principles:document.querySelector('.native-import-reassurance')};PBHelp.refresh();PBHelp.refresh();});
  ok('Refreshing help keeps original buttons, translated text nodes and IDs',await page.evaluate(()=>helpOriginalNodes.files===document.getElementById('pickFiles')&&helpOriginalNodes.library===document.getElementById('chooseLibrary')&&helpOriginalNodes.help===document.querySelector('[data-ws=libraryHelp]')&&helpOriginalNodes.hint===document.getElementById('fsHint')&&helpOriginalNodes.title===document.querySelector('#panel-intake>h2[data-ws=add]')&&helpOriginalNodes.principles===document.querySelector('.native-import-reassurance')));
  const fileChooser=page.waitForEvent('filechooser');await page.locator('#pickFiles').click();const chooser=await fileChooser;
  ok('The original file button still invokes its real file chooser listener',chooser.isMultiple());await chooser.setFiles([]);
  await page.locator('#chooseLibrary').click();await page.waitForFunction(()=>fixtureFolderCalls.includes('library')&&!document.getElementById('chooseLibrary').disabled);
  ok('The unchanged library button still invokes native folder selection',await page.evaluate(()=>fixtureFolderCalls.filter(value=>value==='library').length===1));
  await toggle(page,'import-drop').click();
  ok('Clicking information opens the explanation without navigating or moving focus',await region(page,'import-drop').isVisible()&&await toggle(page,'import-drop').getAttribute('aria-expanded')==='true'&&await toggle(page,'import-drop').evaluate(button=>document.activeElement===button)&&await page.locator('#panel-intake').isVisible());
  await page.keyboard.press('Escape');
  ok('Escape closes help and returns to the same information button',await region(page,'import-drop').evaluate(node=>node.hidden)&&await toggle(page,'import-drop').evaluate(button=>document.activeElement===button));
  await page.keyboard.press('Space');await region(page,'import-drop').waitFor({state:'visible'});
  await page.keyboard.press('Enter');
  ok('Information is operable with Space and Enter rather than hover alone',await region(page,'import-drop').evaluate(node=>node.hidden)&&await toggle(page,'import-drop').getAttribute('aria-expanded')==='false');
  await page.evaluate(()=>{const progress=document.getElementById('prog');progress.style.display='block';document.getElementById('progCur').textContent='Synthetic active import';document.getElementById('progCount').textContent='1 / 3';PBHelp.refresh();});
  ok('Active import progress and its cancellation action never enter collapsed help',await page.locator('#prog').isVisible()&&await page.locator('#cancelSign').isVisible()&&await page.locator('#prog').evaluate(node=>!node.closest('[data-pb-help-content]')));
  await page.evaluate(()=>{document.getElementById('prog').style.display='none';fixtureFolderFails=true;});
  await page.locator('#chooseLibrary').click();await page.waitForFunction(()=>!document.getElementById('chooseLibrary').disabled&&document.getElementById('libraryStatus').textContent.includes('Freigabe prüfen'));
  ok('A real folder failure remains visible beside the actions while help is closed',await page.locator('#libraryStatus').isVisible()&&await page.locator('#libraryStatus').evaluate(node=>!node.closest('[data-pb-help-content]'))&&await region(page,'import-library').evaluate(node=>node.hidden));
  await navigateTo(page,'settings');
  for(const key of ['theme','input-language','image-model','attachments','diagnostics'])ok(`${key}: optional settings explanation starts collapsed`,await toggle(page,key).getAttribute('aria-expanded')==='false'&&await region(page,key).evaluate(node=>node.hidden));
  ok('Theme choice and language preference stay directly available',await page.locator('[data-pb-theme-choice=klarblau]').isVisible()&&await page.locator('#pb-input-language-setting').isVisible());
  await page.locator('[data-pb-theme-choice=graphit]').click();await page.locator('#pb-input-language-setting').selectOption('ru');
  ok('Theme and input-language handlers still update actual saved preferences',await page.evaluate(()=>PBTheme.current()==='graphit'&&PBInputLanguage.current()==='ru'&&localStorage.getItem('pb_pro_theme_v1')==='graphit'&&localStorage.getItem('pb_input_language_v1')==='ru'));
  ok('Normal saved-status text occupies no extra row but retains its live status role',await page.locator('.pb-theme-status,.pb-input-language-status').evaluateAll(nodes=>nodes.length===2&&nodes.every(node=>node.getAttribute('role')==='status'&&node.textContent.trim()&&node.getBoundingClientRect().height<=2&&node.getBoundingClientRect().width<=2)));
  await page.evaluate(()=>{fixturePreferenceWritesFail=true;});
  await page.locator('[data-pb-theme-choice=petrol]').click();await page.locator('#pb-input-language-setting').selectOption('pl');
  ok('Preference write failures become visible immediately without opening help',await page.locator('.pb-theme-status,.pb-input-language-status').evaluateAll(nodes=>nodes.length===2&&nodes.every(node=>{const rect=node.getBoundingClientRect();return rect.height>8&&rect.width>8&&/nicht.*gespeichert/.test(node.textContent);}))&&await region(page,'theme').evaluate(node=>node.hidden)&&await region(page,'input-language').evaluate(node=>node.hidden));
  await page.evaluate(()=>{fixturePreferenceWritesFail=false;});
  await page.locator('[data-pb-theme-choice=klarblau]').click();await page.locator('#pb-input-language-setting').selectOption('de');
  await toggle(page,'theme').click();
  const translatedImportHelp=[];
  for(const code of ['en','ru','pl','de']){
    await menuControl(page,`[data-lang="${code}"]`);
    await page.waitForFunction(code=>{const button=document.querySelector('[data-pb-help-toggle=theme]'),heading=document.getElementById('pb-theme-heading'),expected={de:'Erscheinungsbild',en:'Appearance',ru:'Оформление',pl:'Wygląd'}[code];return document.documentElement.lang===code&&heading?.textContent===expected&&button?.getAttribute('aria-label')?.includes(expected);},code);
    ok(`${code}: translated heading, help label and preserved open state stay synchronized`,await toggle(page,'theme').getAttribute('aria-expanded')==='true'&&await region(page,'theme').isVisible()&&await toggle(page,'theme').getAttribute('aria-label').then(label=>label.includes(code==='de'?'Erscheinungsbild':code==='en'?'Appearance':code==='ru'?'Оформление':'Wygląd')));
    translatedImportHelp.push(await page.locator('[data-ws=libraryHelp]').textContent());
    await navigateTo(page,'intake');
    for(const width of [320,1280]){
      await page.setViewportSize({width,height:900});await layoutReady(page);
      ok(`${code} ${width}px: import starts with compact closed help and its functional controls fit`,await page.locator('#panel-intake').evaluate(panel=>{
        const controls=[...panel.querySelectorAll('#pickDir,#pickFiles,#pickMail,#chooseLibrary,[data-pb-help-toggle]')];
        const drop=document.getElementById('drop'),actions=drop.querySelector(':scope>.btnrow'),help=drop.querySelector('[data-pb-help-toggle=import-drop]');
        return panel.scrollWidth<=panel.clientWidth+1&&panel.querySelector(':scope>h2[data-ws=add]').hidden&&drop.querySelector(':scope>h2').hidden&&
          !drop.querySelector(':scope>.pb-help-heading')&&actions.lastElementChild===help&&
          [...panel.querySelectorAll('[data-pb-help-content]')].every(node=>node.hidden)&&
          controls.length===6&&controls.every(node=>{const rect=node.getBoundingClientRect();return rect.width>0&&rect.left>=0&&rect.right<=innerWidth;})&&
          !document.getElementById('libraryStatus').closest('[data-pb-help-content]')&&!document.getElementById('vaultLine').closest('[data-pb-help-content]');
      }));
      for(const key of ['import-library','import-drop']){
        await toggle(page,key).click();await region(page,key).waitFor({state:'visible'});await layoutReady(page);
        ok(`${code} ${width}px ${key}: the original explanation opens within the viewport`,await region(page,key).evaluate(node=>{
          const rect=node.getBoundingClientRect();return !node.hidden&&rect.width>0&&rect.height>0&&rect.left>=0&&rect.right<=innerWidth&&node.scrollWidth<=node.clientWidth+1;
        })&&await toggle(page,key).getAttribute('aria-label').then(label=>label.startsWith({de:'Hilfe zu',en:'Help for',ru:'Справка:',pl:'Pomoc:'}[code])));
        await toggle(page,key).click();
        ok(`${code} ${width}px ${key}: closing help releases its height again`,await region(page,key).evaluate(node=>node.hidden&&node.getBoundingClientRect().height===0));
      }
    }
    await page.setViewportSize({width:1280,height:900});await navigateTo(page,'settings');
  }
  ok('Collapsed import explanations still receive all four real translations without replacing their nodes',new Set(translatedImportHelp).size===4&&await page.evaluate(()=>helpOriginalNodes.help===document.querySelector('[data-ws=libraryHelp]')&&helpOriginalNodes.hint===document.getElementById('fsHint')));
  await toggle(page,'theme').click();
  for(const theme of ['klarblau','graphit','petrol','nachtblau']){
    await page.locator(`[data-pb-theme-choice=${theme}]`).click();
    for(const [width,height]of [[320,740],[768,1024],[1280,800],[1920,1080]]){
      await page.setViewportSize({width,height});await layoutReady(page);
      const fit=await page.locator('#panel-settings').evaluate(panel=>({width:panel.clientWidth,scroll:panel.scrollWidth,controls:[...panel.querySelectorAll('[data-pb-help-toggle]')].map(node=>{const r=node.getBoundingClientRect();return{key:node.dataset.pbHelpToggle,width:r.width,height:r.height,left:r.left,right:r.right};}).filter(rect=>rect.width>0&&rect.height>0),overflow:[...panel.querySelectorAll('*')].filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth);}).slice(0,12).map(node=>({tag:node.tagName,id:node.id,class:node.className}))}));
      // The existing native diagnostic box is intentionally hidden until seven
      // version taps; only controls in the available settings layout have targets.
      const fits=fit.scroll<=fit.width+1&&fit.controls.length>=4&&fit.controls.every(rect=>rect.width>=28&&rect.height>=28&&rect.left>=0&&rect.right<=width);
      if(!fits)console.error('Help layout diagnostic: '+JSON.stringify(fit));
      ok(`${theme} ${width}px: information controls and settings fit the viewport`,fits);
    }
  }
  ok('No unhandled app errors occur during help, translations, preferences and resize',errors.length===0);
  await context.close();
  ({context,page,errors}=await fixture(true));await page.setViewportSize({width:412,height:915});await navigateTo(page,'intake');
  await toggle(page,'import-drop').tap();await region(page,'import-drop').waitFor({state:'visible'});
  ok('Touch opens help without requiring hover and provides a 44px target',await toggle(page,'import-drop').evaluate(button=>{const rect=button.getBoundingClientRect();return rect.width>=44&&rect.height>=44&&button.getAttribute('aria-expanded')==='true';}));
  await toggle(page,'import-drop').tap();
  ok('Touch closes the same explanation and leaves import controls accessible',await region(page,'import-drop').evaluate(node=>node.hidden)&&await page.locator('#pickFiles').isVisible()&&errors.length===0);
  await context.close();
  console.log(`${count} progressive-help checks passed (real app UI; simulated folder transport, no native hardware claim).`);
}finally{await browser?.close();}
