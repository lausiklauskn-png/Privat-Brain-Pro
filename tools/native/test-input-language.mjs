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
async function fixture(ui='de',preference=null){
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'en-US'}),page=await context.newPage(),errors=[];
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
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let{context,page,errors}=await fixture('pl');
  ok('First use takes the chosen interface language once, instead of the English browser locale',await page.evaluate(()=>PBInputLanguage.current()==='pl'&&PBInputLanguage.locale()==='pl-PL'&&navigator.language==='en-US'));
  ok('The initial independent preference is saved',await page.evaluate(()=>localStorage.getItem('pb_input_language_v1')==='pl'));
  const quick=page.locator('#pb-search-language');
  await quick.selectOption('tr');
  ok('The quick selector changes actual recognition and input language',await page.evaluate(()=>PBInputLanguage.locale()==='tr-TR'&&document.getElementById('q').lang==='tr'&&document.getElementById('q').spellcheck));
  ok('The settings selector stays in sync with the quick selector',await page.locator('#pb-input-language-setting').inputValue()==='tr');
  await page.locator('#q').fill('');await page.locator('#mic').click();
  await page.waitForFunction(()=>fixtureSpeechCalls.length===1&&document.getElementById('q').value.includes('Türkçe arama'));
  ok('The search microphone actually requests the selected Turkish locale',await page.evaluate(()=>fixtureSpeechCalls[0].language==='tr-TR'));
  await menuControl(page,'[data-lang="en"]');
  await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.querySelector('#pb-input-language-quick label')?.textContent==='I speak');
  ok('Changing interface language does not replace the spoken/input preference',await page.evaluate(()=>PBInputLanguage.current()==='tr'&&document.getElementById('q').lang==='tr'&&localStorage.getItem('pb_input_language_v1')==='tr'));
  await page.reload();await page.waitForFunction(()=>window.PBInputLanguage&&PBInputLanguage.current()==='tr');
  ok('The independent preference survives restarting in a different interface language',await page.evaluate(()=>document.documentElement.lang==='en'&&PBInputLanguage.locale()==='tr-TR'));
  await navigateTo(page,'settings');
  await page.locator('#pb-input-language-setting').selectOption('fr');
  ok('The settings control changes the search selector and exact native locale',await quick.inputValue()==='fr'&&await page.evaluate(()=>PBInputLanguage.locale()==='fr-FR'));
  const choices=await quick.locator('option').evaluateAll(options=>options.map(o=>o.value));
  ok('All eleven offered input languages are available without changing the interface',JSON.stringify(choices)===JSON.stringify(['de','en','ru','pl','tr','ar','uk','es','fr','it','pt']));
  ok('An unsupported preference is rejected without replacing the current choice',await page.evaluate(()=>PBInputLanguage.choose('invalid')===false&&PBInputLanguage.current()==='fr'&&localStorage.getItem('pb_input_language_v1')==='fr'));
  for(const[ui,title]of[['de','Welche Sprache sprichst du?'],['en','Which language do you speak?'],['ru','На каком языке вы говорите?'],['pl','W jakim języku mówisz?']]){
    await menuControl(page,'[data-lang="'+ui+'"]');
    await page.waitForFunction(title=>document.querySelector('#pb-input-language-settings h3')?.textContent===title,title);
    ok(ui+': the language controls explain multilingual search while retaining the independent choice',await page.locator('#pb-input-language-settings h3').textContent()===title&&await page.locator('#pb-input-language-setting').inputValue()==='fr');
  }
  await navigateTo(page,'search');
  for(const width of[320,412,768,1024,1280,1920,2560]){
    await page.setViewportSize({width,height:width<1100?Math.round(width*1.5):900});
    ok(width+'px: the quick language selector stays inside the search window',await quick.evaluate(select=>{const r=select.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1&&select.closest('.pb-input-language-quick').scrollWidth<=select.closest('.pb-input-language-quick').clientWidth+1;}));
  }
  await page.setViewportSize({width:1280,height:900});
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
  await quick.selectOption('ar');
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
  ok('Preference, query and language changes produce no unhandled app errors',errors.length===0);
  await context.close();
  ({context,page,errors}=await fixture('ru','invalid'));
  ok('An invalid saved preference falls back to the chosen interface language once',await page.evaluate(()=>PBInputLanguage.current()==='ru'&&PBInputLanguage.locale()==='ru-RU'&&localStorage.getItem('pb_input_language_v1')==='ru'));
  await context.close();
  console.log(`${count} input-language checks passed (native speech and embedding adapter simulated; no model-quality or device-recognizer claim).`);
}finally{await browser?.close();}
