// The native text prompt must remain editable/dictatable, and tags must never
// become visible before their IndexedDB transaction has committed.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),origin='https://localhost/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
let browser,count=0;
const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[],prompts=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{prompts.push(d.type());await d.dismiss();});
  await page.route('**/*',async route=>{
    const url=route.request().url();if(!url.startsWith(origin))return route.fulfill({status:404,body:''});
    const path=resolve(root,'.'+new URL(url).pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+'/'))return route.abort();
    try{return route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(()=>{
    window.speechCalls=[];window.speechAnswer='GesprochenesTag';
    window.Capacitor={Plugins:{ProSpeech:{async listen(args){speechCalls.push(args);return{cancelled:false,text:speechAnswer};}}}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.PBTextPrompt&&window.PBWorkspace&&window.PBInputLanguage&&typeof db!=='undefined'&&db);
  await page.evaluate(()=>{
    PBInputLanguage.choose('de');
    const button=document.createElement('button');button.id='text-prompt-fixture';button.type='button';button.textContent='Texteingabe testen';
    button.onclick=async()=>{window.fixtureAnswer=await PBTextPrompt.ask('Eingabe <b>als Text</b>','Ausgangstext');};
    document.getElementById('panel-search').prepend(button);
  });
  const dialog=page.locator('dialog.pb-text-input'),field=dialog.locator('#pb-text-input-value');
  for(const [language,apply,cancel]of[['de','Übernehmen','Abbrechen'],['en','Apply','Cancel'],['ru','Применить','Отмена'],['pl','Zastosuj','Anuluj']]){
    await page.evaluate(language=>{document.documentElement.lang=language;},language);
    await page.locator('#text-prompt-fixture').click();await field.waitFor();await page.waitForTimeout(150);
    ok(language+': one ordinary text field, no microphone (Klaus 2026-10-28: nur Suche und Notizen), localized actions',await dialog.locator('input').count()===1&&await dialog.locator('.pb-dictate').count()===0&&await dialog.getByRole('button',{name:apply,exact:true}).count()===1&&await dialog.getByRole('button',{name:cancel,exact:true}).count()===1);
    ok(language+': the title is plain text, the initial value stays focused/selected, and recording does not start itself',await dialog.locator('h2').textContent()==='Eingabe <b>als Text</b>'&&await dialog.locator('h2 b').count()===0&&await field.inputValue()==='Ausgangstext'&&await page.evaluate(()=>speechCalls.length===0&&document.activeElement.id==='pb-text-input-value'&&document.getElementById('pb-text-input-value').selectionStart===0&&document.getElementById('pb-text-input-value').selectionEnd===12));
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
    ok(language+': Escape cancels without an answer and restores keyboard focus',await page.evaluate(()=>fixtureAnswer===null&&document.activeElement.id==='text-prompt-fixture'));
  }
  await page.evaluate(()=>{document.documentElement.lang='de';});
  await page.locator('#text-prompt-fixture').click();await field.waitFor();
  await page.evaluate(async()=>{window.secondAnswer=await PBTextPrompt.ask('Zweite Eingabe');});
  ok('A second request never opens a second dialog or reuses an answer for another operation',await page.locator('dialog.pb-text-input').count()===1&&await page.evaluate(()=>secondAnswer===null));
  await field.fill('Mit Enter bestätigt');await field.press('Enter');await dialog.waitFor({state:'detached'});
  ok('Enter applies the ordinary text once',await page.evaluate(()=>fixtureAnswer==='Mit Enter bestätigt'));

  await page.evaluate(async()=>{
    const name='Tagprobe.txt',text='Tagprobe und gespeicherte Zuordnungen';const terms=tokens(name+' '+text);
    const r={hash:'a'.repeat(64),name,path:name,type:'text/plain',ext:'txt',date:Date.now(),size:text.length,snippet:text,summary:'',vector:buildVector(terms),tf:termFreq(terms),category:'Text',dirId:null,nameTokens:tokens(name),dupes:[],tags:['bestehend']};
    await idbPut('catalog',r);CATALOG.push(r);HASHSET.add(r.hash);rebuildIndex();refreshAll();
    window.abortNextTagPut=()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const request=original.apply(this,args);if(this.name==='catalog'){IDBObjectStore.prototype.put=original;request.addEventListener('success',()=>this.transaction.abort(),{once:true});}return request;};};
  });
  if(await page.locator('#mode [data-m="mean"]').getAttribute('aria-pressed')==='true')await page.locator('#mode [data-m="mean"]').click();await page.locator('#q').fill('Tagprobe');
  const card=page.locator('#results .card[data-hash="'+'a'.repeat(64)+'"]');
  await card.locator('[data-tagadd]').click();await page.locator('#pb-text-input-value').waitFor();
  await page.locator('#pb-text-input-value').fill('GesprochenesTag');
  await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.waitFor({state:'detached'});
  await page.waitForFunction(()=>CATALOG.find(r=>r.name==='Tagprobe.txt').tags.includes('GesprochenesTag'));
  ok('A dictated tag uses the real add action and is stored before it is displayed',await page.evaluate(async()=>{const r=CATALOG.find(r=>r.name==='Tagprobe.txt');return r.tags.includes('GesprochenesTag')&&(await idbGet('catalog',r.hash)).tags.includes('GesprochenesTag');})&&(await card.textContent()).includes('GesprochenesTag'));
  await page.evaluate(()=>abortNextTagPut());
  await card.locator('[data-tagadd]').click();await field.fill('Nichtgespeichert');await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('nicht gespeichert werden'));
  ok('An aborted tag transaction keeps both memory and stored tags unchanged',await page.evaluate(async()=>{const r=CATALOG.find(r=>r.name==='Tagprobe.txt');return JSON.stringify(r.tags)===JSON.stringify(['bestehend','GesprochenesTag'])&&JSON.stringify((await idbGet('catalog',r.hash)).tags)===JSON.stringify(r.tags);})&&await page.locator('#q').inputValue()==='Tagprobe');
  await page.evaluate(()=>abortNextTagPut());await card.locator('[data-tagdel][data-tag="GesprochenesTag"]').click();
  await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('nicht entfernt werden'));
  ok('Failed removal preserves the existing visible and stored assignment',await card.locator('[data-tagdel][data-tag="GesprochenesTag"]').count()===1&&await page.evaluate(async()=>{const r=CATALOG.find(r=>r.name==='Tagprobe.txt');return r.tags.includes('GesprochenesTag')&&(await idbGet('catalog',r.hash)).tags.includes('GesprochenesTag');}));
  await card.locator('[data-tagdel][data-tag="GesprochenesTag"]').click();await page.waitForFunction(()=>!CATALOG.find(r=>r.name==='Tagprobe.txt').tags.includes('GesprochenesTag'));
  ok('Retry removes the tag only after successful persistence',await page.evaluate(async()=>{const r=CATALOG.find(r=>r.name==='Tagprobe.txt');return JSON.stringify(r.tags)==='["bestehend"]'&&JSON.stringify((await idbGet('catalog',r.hash)).tags)==='["bestehend"]';}));
  await card.locator('[data-tagadd]').click();await field.fill('Abgebrochen');await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();await dialog.waitFor({state:'detached'});
  ok('Cancelling a tag changes no assignment',await page.evaluate(()=>JSON.stringify(CATALOG.find(r=>r.name==='Tagprobe.txt').tags)==='["bestehend"]'));

  async function heldTagWrite(tags){
    await page.evaluate(async tags=>{
      const rec=CATALOG.find(r=>r.name==='Tagprobe.txt');rec.tags=tags;await idbPut('catalog',rec);populateFilterSelects();renderResults(document.getElementById('q').value);
      window.fixtureTagPut=window.idbPut;window.fixtureTagCalls=[];let first=true;
      window.idbPut=async function(store,value,...rest){
        if(store!=='catalog'||value?.hash!==rec.hash)return fixtureTagPut(store,value,...rest);
        fixtureTagCalls.push([...value.tags]);const result=await fixtureTagPut(store,value,...rest);
        if(first){first=false;await new Promise(resolve=>{window.fixtureTagRelease=resolve;});}
        return result;
      };
    },tags);
  }
  const afterFrames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await heldTagWrite(['erste','zweite']);
  await card.locator('[data-tagdel][data-tag="erste"]').click();await page.waitForFunction(()=>typeof fixtureTagRelease==='function');
  await card.locator('[data-tagdel][data-tag="zweite"]').click();await afterFrames();
  ok('Two quick removals wait for the preceding committed tag state instead of writing stale snapshots',await page.evaluate(()=>fixtureTagCalls.length===1));
  await page.evaluate(()=>fixtureTagRelease());
  await page.waitForFunction(async()=>{const r=CATALOG.find(r=>r.name==='Tagprobe.txt');return r.tags.length===0&&(await idbGet('catalog',r.hash)).tags.length===0;});
  ok('Both quick removals are preserved without resurrecting either tag',await page.evaluate(()=>JSON.stringify(fixtureTagCalls)===JSON.stringify([['zweite'],[]])));
  await page.evaluate(()=>{window.idbPut=fixtureTagPut;delete window.fixtureTagRelease;});
  await heldTagWrite(['bestehend']);
  await card.locator('[data-tagadd]').click();await field.fill('neu');await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();
  await page.waitForFunction(()=>typeof fixtureTagRelease==='function');
  await card.locator('[data-tagdel][data-tag="bestehend"]').click();await afterFrames();
  ok('Adding and removing on the same entry never overwrite a still-pending tag operation',await page.evaluate(()=>fixtureTagCalls.length===1));
  await page.evaluate(()=>fixtureTagRelease());
  await page.waitForFunction(async()=>{const r=CATALOG.find(r=>r.name==='Tagprobe.txt');return JSON.stringify(r.tags)==='["neu"]'&&JSON.stringify((await idbGet('catalog',r.hash)).tags)==='["neu"]';});
  ok('The queued add/remove result contains the new tag and no removed tag',true);
  await page.evaluate(()=>{window.idbPut=fixtureTagPut;delete window.fixtureTagRelease;delete window.fixtureTagPut;});


  await navigateTo(page,'mail');const local=page.locator('.mail-app:not(.live-mail)');
  const addFolder=local.locator('[data-mail-text="newFolder"]');await addFolder.scrollIntoViewIfNeeded();await addFolder.click();await page.locator('#pb-text-input-value').waitFor();
  await page.locator('#pb-text-input-value').fill('Neue Ablage');
  await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.waitFor({state:'detached'});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pb_mail_folders')||'[]').some(folder=>folder.name==='Neue Ablage'));
  ok('A local mail folder can be named by voice while its surrounding mailbox is busy',await local.locator('[data-mail-folder^="custom_"]').textContent().then(text=>text.includes('Neue Ablage')));
  ok('Native tag and folder entry never fall back to a blocking browser prompt',prompts.length===0);
  ok('No unhandled app errors',errors.length===0||console.log(errors));
  console.log(`${count} native text-entry checks passed (real IndexedDB transactions; simulated recognition).`);
}finally{await browser?.close();}
