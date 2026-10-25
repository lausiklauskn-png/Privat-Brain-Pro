// Spoken/input language is independent of interface/device language. The real
// multilingual-query adapter must keep the user's text, not add a fake language prefix.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';

const root=resolve('www'),origin='https://localhost/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
async function menuControl(page,selector){
  const target=page.locator(selector);await target.waitFor({state:'attached'});
  if(!await target.isVisible()){
    const menu=page.locator('.native-options');if(await menu.getAttribute('open')===null)await menu.locator(':scope > summary').click();
  }
  await target.click();
}
async function fixture(ui='de',preference=null,options={}){
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'en-US',...options}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const url=route.request().url();if(!url.startsWith(origin))return route.fulfill({status:404,body:''});
    const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(({ui,preference})=>{
    if(!localStorage.getItem('fixture-input-language-seeded')){
      localStorage.setItem('pb_lang',ui);if(preference!==null)localStorage.setItem('pb_input_language_v1',preference);
      localStorage.setItem('fixture-input-language-seeded','true');
    }
    window.fixtureSpeechCalls=[];window.fixtureSpeechAnswer={text:'Türkçe arama',cancelled:false};window.fixtureEmbeddedQueries=[];
    window.__CB_EMBED_STUB__={
      async embedQuery(text){fixtureEmbeddedQueries.push(text);return Float32Array.from({length:384},(_,i)=>i===0?1:0);},
      async embedPassage(){return Float32Array.from({length:384},(_,i)=>i===0?1:0);},
      async embedPassageBatch(texts){return texts.map(()=>Float32Array.from({length:384},(_,i)=>i===0?1:0));}
    };
    window.Capacitor={isNativePlatform:()=>true,Plugins:{
      ProDevice:{async getInfo(){return{platform:'android',versionName:'fixture'};}},
      ProSpeech:{async listen(args){fixtureSpeechCalls.push(args);return fixtureSpeechAnswer;}}
    }};
  },{ui,preference});
  await page.goto(origin);
  await page.waitForFunction(()=>window.PBInputLanguage&&window.PBWorkspace&&typeof db!=='undefined'&&db);
  await page.locator('#pb-search-language').waitFor();
  return{context,page,errors};
}
async function chooseQuick(page,code){
  const menu=page.locator('#pb-input-language-quick');if(!await menu.evaluate(element=>element.open))await page.locator('#pb-search-language').click();
  await page.locator(`#pb-search-language-menu [data-input-language="${code}"]`).click();
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{context,page,errors}=await fixture('pl');
  ok('First use takes the chosen interface language once, instead of the English browser locale',await page.evaluate(()=>PBInputLanguage.current()==='pl'&&PBInputLanguage.locale()==='pl-PL'&&navigator.language==='en-US'));
  ok('The initial independent preference is saved',await page.evaluate(()=>localStorage.getItem('pb_input_language_v1')==='pl'));
  const quick=page.locator('#pb-search-language');
  ok('Only the current code appears inside the search row before the meaning switch',await quick.innerText()==='PL'&&await page.evaluate(()=>{const menu=document.getElementById('pb-input-language-quick');return menu.parentElement.classList.contains('searchbox')&&menu.nextElementSibling?.id==='mode'&&!menu.querySelector('label,select');}));
  ok('The compact code still names the actual selected language accessibly',(await quick.getAttribute('aria-label')).includes('Polski')&&(await quick.getAttribute('title')).includes('Polski'));
  await chooseQuick(page,'tr');
  ok('The quick selector changes actual recognition and input language',await page.evaluate(()=>PBInputLanguage.locale()==='tr-TR'&&document.getElementById('q').lang==='tr'&&document.getElementById('q').spellcheck));
  ok('The settings selector stays in sync with the quick selector',await page.locator('#pb-input-language-setting').inputValue()==='tr');
  ok('Choosing a language closes the menu and updates its visible code',await quick.innerText()==='TR'&&!await page.locator('#pb-input-language-quick').evaluate(element=>element.open));
  await quick.click();
  await page.waitForFunction(()=>document.getElementById('pb-input-language-quick').open&&document.getElementById('pb-search-language').getAttribute('aria-expanded')==='true');
  ok('The menu identifies the selected language',await page.locator('#pb-search-language-menu [data-input-language="tr"]').getAttribute('aria-pressed')==='true'&&await quick.getAttribute('aria-expanded')==='true');
  await page.keyboard.press('Escape');
  ok('Escape closes the language menu and returns focus to its code',!await page.locator('#pb-input-language-quick').evaluate(element=>element.open)&&await quick.evaluate(element=>element===document.activeElement));
  await page.locator('#q').fill('');await page.locator('#mic').click();
  await page.waitForFunction(()=>fixtureSpeechCalls.length===1&&document.getElementById('q').value.includes('Türkçe arama'));
  ok('The search microphone actually requests the selected Turkish locale',await page.evaluate(()=>fixtureSpeechCalls[0].language==='tr-TR'));
  await menuControl(page,'[data-lang="en"]');
  await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.getElementById('pb-search-language')?.getAttribute('aria-label')==='Search and dictation language: Türkçe');
  ok('Changing interface language does not replace the spoken/input preference',await page.evaluate(()=>PBInputLanguage.current()==='tr'&&document.getElementById('q').lang==='tr'&&localStorage.getItem('pb_input_language_v1')==='tr'));
  await page.reload();await page.waitForFunction(()=>window.PBInputLanguage&&PBInputLanguage.current()==='tr');
  ok('The independent preference survives restarting in a different interface language',await page.evaluate(()=>document.documentElement.lang==='en'&&PBInputLanguage.locale()==='tr-TR'));
  await navigateTo(page,'settings');
  await page.locator('#pb-input-language-setting').selectOption('fr');
  ok('The settings control changes the search code and exact native locale',await quick.innerText()==='FR'&&await page.evaluate(()=>PBInputLanguage.locale()==='fr-FR'));
  const choices=await page.locator('#pb-search-language-menu [data-input-language]').evaluateAll(options=>options.map(option=>option.dataset.inputLanguage));
  ok('All eleven offered input languages are available without changing the interface',JSON.stringify(choices)===JSON.stringify(['de','en','ru','pl','tr','ar','uk','es','fr','it','pt']));
  ok('The menu and Settings share the complete existing language list',JSON.stringify(choices)===JSON.stringify(await page.locator('#pb-input-language-setting option').evaluateAll(options=>options.map(option=>option.value))));
  ok('An unsupported preference is rejected without replacing the current choice',await page.evaluate(()=>PBInputLanguage.choose('invalid')===false&&PBInputLanguage.current()==='fr'&&localStorage.getItem('pb_input_language_v1')==='fr'));
  for(const[ui,title]of[['de','Welche Sprache sprichst du?'],['en','Which language do you speak?'],['ru','На каком языке вы говорите?'],['pl','W jakim języku mówisz?']]){
    await menuControl(page,'[data-lang="'+ui+'"]');
    await page.waitForFunction(title=>document.querySelector('#pb-input-language-settings h3')?.textContent===title,title);
    ok(ui+': the language controls explain multilingual search while retaining the independent choice',await page.locator('#pb-input-language-settings h3').textContent()===title&&await page.locator('#pb-input-language-setting').inputValue()==='fr');
  }
  await navigateTo(page,'search');
  for(const width of[320,412,768,1024,1280,1920,2560]){
    let fits=true;
    for(const size of[20,24]){
      await page.setViewportSize({width,height:width<1100?Math.round(width*1.5):900});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);
      await quick.click();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      fits&&=await quick.evaluate(button=>{const rect=button.getBoundingClientRect(),popup=document.getElementById('pb-search-language-menu'),bounds=popup.getBoundingClientRect(),box=button.closest('.searchbox'),target=matchMedia('(any-pointer:fine)').matches?32:44;return rect.height>=target&&rect.height<=target+2&&rect.width>=target&&rect.left>=0&&rect.right<=innerWidth+1&&bounds.left>=0&&bounds.right<=innerWidth+1&&bounds.top>=0&&bounds.bottom<=innerHeight+1&&popup.scrollWidth<=popup.clientWidth+1&&box.scrollWidth<=box.clientWidth+1&&(innerWidth>650||box.getBoundingClientRect().height<=100);});
      await quick.click();
    }
    ok(width+'px: the code and complete language menu fit at 20/24 px without a separate explanation row',fits);
  }
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='20px');
  const rawQuery='командировка в Турцию';
  await page.evaluate(async()=>{
    const content='Reiseunterlagen und Besprechung in Istanbul',t=tokens(content),hash='8'.repeat(64);
    const rec={hash,name:'Reise.txt',path:'Reise.txt',type:'text/plain',ext:'txt',date:Date.now(),size:content.length,snippet:content,vector:buildVector(t),tf:termFreq(t),nameTokens:tokens('Reise.txt'),category:'Text',dupes:[],tags:[],evec:Array.from({length:384},(_,i)=>i===0?1:0)};
    await idbPut('catalog',rec);CATALOG.push(rec);HASHSET.add(hash);rebuildIndex();refreshAll();
  });
  await page.locator('#q').fill(rawQuery);
  await page.waitForFunction(query=>fixtureEmbeddedQueries.includes(query),rawQuery);
  ok('A multilingual query reaches the embedding adapter unchanged despite a different input preference',await page.evaluate(query=>fixtureEmbeddedQueries.includes(query)&&!fixtureEmbeddedQueries.some(text=>text.includes('fr-FR'))&&PBInputLanguage.current()==='fr',rawQuery));
  ok('The chosen input language does not filter out a document in another language',await page.locator('#results .card[data-hash="'+'8'.repeat(64)+'"]').count()===1);
  await page.evaluate(()=>{
    const field=document.createElement('textarea');field.id='language-fixture';field.value='Preserved text';document.getElementById('panel-search').append(field);PBInputLanguage.applyField(field);
    const secret=document.createElement('input');secret.type='password';secret.id='language-secret';document.getElementById('panel-search').append(secret);PBInputLanguage.applyField(secret);
  });
  ok('New text fields receive the selected input language without rewriting their contents',await page.locator('#language-fixture').getAttribute('lang')==='fr'&&await page.locator('#language-fixture').inputValue()==='Preserved text');
  await chooseQuick(page,'ar');
  ok('Changing to Arabic updates registered fields and permits natural text direction',await page.locator('#language-fixture').getAttribute('lang')==='ar'&&await page.locator('#language-fixture').getAttribute('dir')==='auto'&&await page.evaluate(()=>PBInputLanguage.locale()==='ar-SA'));
  ok('Language changes preserve the current query and secret fields stay untouched',await page.locator('#q').inputValue()===rawQuery&&await page.locator('#language-secret').getAttribute('lang')===null);
  ok('Secret ancestors and autocomplete token lists cannot opt a child field into language processing',await page.evaluate(()=>{
    const host=document.createElement('div');host.dataset.pbPrivate='';
    const privateField=document.createElement('input');privateField.type='text';host.append(privateField);document.getElementById('panel-search').append(host);PBInputLanguage.applyField(privateField);
    const code=document.createElement('input');code.type='text';code.setAttribute('autocomplete','section-recovery one-time-code');document.getElementById('panel-search').append(code);PBInputLanguage.applyField(code);
    PBInputLanguage.choose('de');return !privateField.hasAttribute('lang')&&!code.hasAttribute('lang');
  }));
  await page.locator('#language-fixture').evaluate(field=>field.dataset.pbInputLanguage='uk');
  ok('An explicit field language can request its own native locale',await page.locator('#language-fixture').evaluate(field=>PBInputLanguage.locale(field))==='uk-UA');
  await quick.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('End');await page.keyboard.press('Enter');
  ok('Keyboard navigation can select a language through the same preference API',await quick.innerText()==='PT'&&await page.evaluate(()=>PBInputLanguage.current()==='pt'&&PBInputLanguage.locale()==='pt-PT'));
  await quick.click();await page.locator('#q').click();
  ok('Clicking the query closes the language menu without changing its text',!await page.locator('#pb-input-language-quick').evaluate(element=>element.open)&&await page.locator('#q').inputValue()===rawQuery);
  ok('Preference, query and language changes produce no unhandled app errors',errors.length===0);
  await context.close();
  ({context,page,errors}=await fixture('ru','invalid'));
  ok('An invalid saved preference falls back to the chosen interface language once',await page.evaluate(()=>PBInputLanguage.current()==='ru'&&PBInputLanguage.locale()==='ru-RU'&&localStorage.getItem('pb_input_language_v1')==='ru'));
  await context.close();
  ({context,page,errors}=await fixture('de','en',{viewport:{width:1280,height:800},hasTouch:true}));
  ok('A wide touch-only device retains a 44 px language code target',await page.locator('#pb-search-language').evaluate(button=>!matchMedia('(any-pointer:fine)').matches&&button.getBoundingClientRect().height>=44&&button.getBoundingClientRect().width>=44));
  await chooseQuick(page,'ru');
  ok('Touch menu selection uses the same saved locale and field language',await page.evaluate(()=>PBInputLanguage.current()==='ru'&&PBInputLanguage.locale()==='ru-RU'&&document.getElementById('q').lang==='ru'&&localStorage.getItem('pb_input_language_v1')==='ru')&&errors.length===0);
  await context.close();
  console.log(`${count} input-language checks passed (native speech and embedding adapter simulated; no model-quality or device-recognizer claim).`);
}finally{await browser?.close();}
