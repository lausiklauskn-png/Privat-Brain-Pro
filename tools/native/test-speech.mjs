// Native dictation uses a system dialog, including fields created after startup.
// The dialog is simulated here; clicks, typing, selection and app handlers are real.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
import {navigateTo} from './test-navigation-helper.mjs';
const root=resolve('www'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('✓ '+name);count++;};
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:412,height:915}}),url=`http://127.0.0.1:${server.address().port}/`,errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await page.addInitScript(()=>{
    delete window.SpeechRecognition;
    window.webkitSpeechRecognition=function(){const r={start(){setTimeout(()=>r.onerror&&r.onerror({error:'not-allowed'}),10);},stop(){},abort(){}};return r;};
    window.speechCalls=[];window.speechHold=true;window.speechAnswer={cancelled:false,text:'Rechnung Zahnarzt'};
    window.Capacitor={Plugins:{ProSpeech:{async listen(args){window.speechCalls.push(args);if(window.speechHold)await new Promise(resolve=>{window.speechRelease=()=>{window.speechHold=false;delete window.speechRelease;resolve();};});
      if(window.speechAnswer==='missing'){const e=new Error('No speech recognizer');e.code='SPEECH_UNAVAILABLE';throw e;}return window.speechAnswer;}}}};
  });
  await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&document.querySelector('#mic svg.pb-speech-icon')&&typeof db!=='undefined'&&db);
  const choose=async code=>page.evaluate(code=>{if(window.PBInputLanguage)PBInputLanguage.choose(code);else document.documentElement.lang=code;},code);
  const idle=()=>page.waitForFunction(()=>!document.querySelector('[data-speaking="true"]'));
  const answer=async text=>page.evaluate(text=>{window.speechAnswer={cancelled:false,text};},text);
  const clickMic=async field=>{const mic=page.locator(field+' + .pb-dictate');await mic.waitFor();await mic.scrollIntoViewIfNeeded();await mic.click();await idle();};
  await choose('de');
  const mic=page.locator('#mic');await mic.click();
  ok('Search uses a simple microphone SVG and exposes its listening state',await mic.getAttribute('aria-busy')==='true'&&await mic.locator('svg[aria-hidden="true"]').count()===1&&!(await mic.textContent()).trim());
  await page.evaluate(()=>speechRelease());
  await idle();
  ok('Recognized search words reach the query through its existing input handler',await page.locator('#q').inputValue()==='Rechnung Zahnarzt'&&await mic.getAttribute('aria-busy')===null);
  ok('The native recognizer receives the selected language and a short prompt',await page.evaluate(()=>speechCalls.length===1&&speechCalls[0].language==='de-DE'&&speechCalls[0].prompt==='Sprechen Sie jetzt'));
  ok('The refused browser Web Speech path is not used',!(await page.locator('#toast').textContent()).includes('Dein Browser'));
  await page.locator('#q').fill('Rechnung alt Oktober');
  await page.locator('#q').evaluate(field=>{field.focus();field.setSelectionRange(9,12);});
  await answer('neu');await mic.click();await idle();
  ok('Dictation replaces only the selected query words, preserving surrounding text',await page.locator('#q').inputValue()==='Rechnung neu Oktober');
  await choose('pl');await page.evaluate(()=>{speechAnswer={cancelled:true,text:''};});
  await page.locator('#q').fill('bleibt');await mic.click();await idle();
  ok('Cancelling leaves the typed query intact and keeps the chosen Polish locale',await page.locator('#q').inputValue()==='bleibt'&&await page.evaluate(()=>speechCalls.at(-1).language==='pl-PL'));
  await choose('de');await page.evaluate(()=>{speechAnswer='missing';});await mic.click();await idle();
  ok('A missing device recognizer produces a readable message',(await page.locator('#toast').textContent()).includes('keine Spracherkennung eingerichtet'));

  await page.evaluate(async()=>{const t='Mietvertrag ab 1. Mai';const r={hash:await sha256(new TextEncoder().encode(t).buffer),name:'Vertrag.txt',path:'Vertrag.txt',type:'text/plain',ext:'txt',date:Date.now(),size:t.length,snippet:t,via:'test',vector:buildVector(tokens(t)),tf:termFreq(tokens(t)),summary:'',category:'',dirId:null,nameTokens:tokens('Vertrag'),dupes:[],tags:[]};CATALOG.push(r);openKiModal(r.hash);});
  await page.locator('#kiQ + .pb-dictate').waitFor();
  ok('The dynamically opened AI question has its own named microphone',await page.locator('#kiQ + .pb-dictate').getAttribute('aria-label').then(text=>text.includes('Diktieren')));
  await page.locator('#kiQ').fill('Bitte sagen:');await answer('was steht im Vertrag');await clickMic('#kiQ');
  ok('Text-area dictation appends at the caret without losing existing words',await page.locator('#kiQ').inputValue()==='Bitte sagen: was steht im Vertrag');
  await page.locator('#modalBox [data-close]').click();

  // Real local composer: every text field and later-opened Cc/Bcc needs a control.
  await navigateTo(page,'mail');await page.locator('.mail-app:not(.live-mail) [data-mail-text="compose"]').click();
  await page.locator('#pb-mail-body + .pb-dictate').waitFor();
  // Klaus 2026-10-28: Mikrofon nur an Suche und Freitext — der Mail-Text ja, Absender/An/Betreff/Cc/Bcc nicht.
  ok('Local mail body has a microphone; From, To and Subject have none',await page.evaluate(()=>document.getElementById('pb-mail-body')?.nextElementSibling?.classList.contains('pb-dictate')&&['from','to','subject'].every(key=>!document.getElementById('pb-mail-'+key)?.nextElementSibling?.classList.contains('pb-dictate'))));
  await page.locator('.mail-app:not(.live-mail) .mail-copy-fields > summary').click();
  ok('Cc and Bcc get no microphone',await page.locator('#pb-mail-cc + .pb-dictate').count()===0&&await page.locator('#pb-mail-bcc + .pb-dictate').count()===0);
  await page.locator('#pb-mail-subject').fill('Gesprochener Betreff');
  await answer('Hallo zusammen');await clickMic('#pb-mail-body');
  await page.locator('.mail-app:not(.live-mail) .mail-compose-actions [data-mail-text="save"]').click();
  await page.waitForFunction(()=>CATALOG.some(r=>r.name==='Gesprochener Betreff'&&r.mailBody==='Hallo zusammen'));
  ok('Dictated subject and body use existing dirty/save handlers and persist as one draft',await page.evaluate(()=>CATALOG.filter(r=>r.name==='Gesprochener Betreff'&&r.mailBody==='Hallo zusammen').length===1));

  await navigateTo(page,'search');
  await page.evaluate(()=>{
    const box=document.createElement('section');box.id='speech-fields';
    // Einzeilige Felder bekommen ein Mikrofon nur mit data-dictate (Klaus 2026-10-28); die Mechanik wird an solchen Feldern geprüft.
    for(const type of ['text','search','email','url','tel','password','number','file','hidden']){const label=document.createElement('label');label.textContent='Fixture '+type;const input=document.createElement('input');input.type=type;input.id='speech-'+type;if(['text','email','url','tel','password','number'].includes(type))input.dataset.dictate='';label.append(input);box.append(label);}
    for(const type of ['text','email','url','tel']){const input=document.createElement('input');input.type=type;input.id='speech-plain-'+type;input.setAttribute('aria-label','Plain '+type);box.append(input);}
    for(const [id,attr] of [['readonly','readonly'],['disabled','disabled'],['no-dictate','data-no-dictate']]){const input=document.createElement('input');input.id='speech-'+id;input.dataset.dictate='';input.setAttribute(attr,'');box.append(input);}
    const code=document.createElement('textarea');code.id='trShares';box.append(code);
    const editor=document.createElement('div');editor.id='speech-editor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-label','Fixture editor');editor.innerHTML='Vor <b>alt</b> nach';box.append(editor);
    document.getElementById('panel-search').prepend(box);
    window.speechEvents={input:0,change:0};const field=box.querySelector('#speech-text');field.addEventListener('input',()=>speechEvents.input++);field.addEventListener('change',()=>speechEvents.change++);
  });
  await page.locator('#speech-text + .pb-dictate').waitFor();
  ok('Plain one-line text, address, URL and phone fields get no microphone',await page.evaluate(()=>['text','email','url','tel'].every(key=>!document.getElementById('speech-plain-'+key).nextElementSibling?.classList.contains('pb-dictate'))));
  ok('Search, free text and explicitly marked fields receive microphones',await page.evaluate(()=>['text','search','email','url','tel','editor'].every(key=>document.getElementById('speech-'+key).nextElementSibling?.classList.contains('pb-dictate'))));
  ok('Passwords, recovery codes, numbers, files, hidden and non-editable controls get no microphone',await page.evaluate(()=>['password','number','file','hidden','readonly','disabled','no-dictate'].every(key=>!document.getElementById('speech-'+key).nextElementSibling?.classList.contains('pb-dictate'))&&!document.getElementById('trShares').nextElementSibling?.classList.contains('pb-dictate')));
  await page.evaluate(()=>{
    const field=document.createElement('div');field.id='speech-focused-editor';field.contentEditable='true';field.innerHTML='Vor <b>Markiert</b> nach';document.getElementById('speech-fields').append(field);field.focus();
    const range=document.createRange();range.selectNodeContents(field.querySelector('b'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
  });
  await page.locator('#speech-focused-editor + .pb-dictate').waitFor();
  ok('Equipping an already focused rich-text field preserves its focus and selected words',await page.evaluate(()=>document.activeElement.id==='speech-focused-editor'&&getSelection().toString()==='Markiert'));
  await answer('Neuer Text');await clickMic('#speech-text');
  ok('Dictation dispatches the actual input and change events once',await page.evaluate(()=>speechEvents.input===1&&speechEvents.change===1));
  await answer('reader@example.invalid');await clickMic('#speech-email');
  ok('Email controls work even when the browser exposes no selectionRange API',await page.locator('#speech-email').inputValue()==='reader@example.invalid');
  await page.locator('#speech-editor').evaluate(field=>{field.focus();const range=document.createRange();range.selectNodeContents(field.querySelector('b'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);});
  await answer('<script>neu</script>');await clickMic('#speech-editor');
  ok('Rich-text dictation replaces the selected text as literal text without executing markup',await page.locator('#speech-editor').textContent()==='Vor <script>neu</script> nach'&&await page.locator('#speech-editor script').count()===0&&await page.locator('#speech-editor b').count()===1);
  await page.locator('#speech-text').fill('Bleibt');await answer('gesprochen');
  await page.evaluate(()=>{speechHold=true;});
  await page.locator('#speech-text + .pb-dictate').click();
  await page.locator('#speech-text').fill('Neue Eingabe');await page.evaluate(()=>speechRelease());await idle();
  ok('Typing during recognition is preserved rather than overwritten by an older snapshot',(await page.locator('#speech-text').inputValue()).includes('Neue Eingabe')&&(await page.locator('#speech-text').inputValue()).includes('gesprochen'));
  await page.evaluate(()=>{document.getElementById('speech-readonly').readOnly=false;});
  await page.locator('#speech-readonly + .pb-dictate').waitFor();
  ok('Making a field editable adds its microphone without reopening the view',true);
  await page.evaluate(()=>{document.getElementById('speech-readonly').disabled=true;});
  await page.locator('#speech-readonly + .pb-dictate').waitFor({state:'detached'});
  ok('Disabling an equipped field removes its microphone and keeps the original field',await page.locator('#speech-readonly').isDisabled());
  if(await page.evaluate(()=>Boolean(window.PBInputLanguage))){
    await page.evaluate(()=>{PBInputLanguage.choose('ru');document.documentElement.lang='en';});
    await answer('Русский текст');await clickMic('#speech-search');
    ok('Recognition follows the saved spoken language independently of the UI language',await page.evaluate(()=>speechCalls.at(-1).language==='ru-RU')&&await page.locator('#speech-search').getAttribute('lang')==='ru');
    await page.evaluate(()=>{document.getElementById('speech-url').dataset.pbInputLanguage='fr';});
    await answer('exemple');await clickMic('#speech-url');
    ok('An explicitly chosen field language is honored by its recognizer',await page.evaluate(()=>speechCalls.at(-1).language==='fr-FR'));
  }
  const before=await page.evaluate(()=>speechCalls.length);
  await page.evaluate(()=>{speechHold=true;});
  await page.locator('#speech-tel + .pb-dictate').click();
  await page.locator('#speech-url + .pb-dictate').click();
  await page.evaluate(()=>speechRelease());
  await idle();
  ok('Two controls never start overlapping recognition dialogs',await page.evaluate(()=>speechCalls.length)===before+1);
  const keptUrl=await page.locator('#speech-url').inputValue();
  await page.evaluate(()=>{speechHold=true;});
  await page.locator('#speech-tel + .pb-dictate').click();
  await page.evaluate(()=>{document.getElementById('speech-tel').remove();speechRelease();});await idle();
  ok('A late recognition result never targets a detached field or another draft',await page.locator('#speech-tel').count()===0&&await page.locator('#speech-url').inputValue()===keptUrl);
  await page.evaluate(()=>{document.getElementById('speech-fields').remove();});
  await page.waitForFunction(()=>!document.querySelector('#speech-fields'));
  ok('Search keeps exactly one existing microphone rather than acquiring a duplicate',await page.locator('#mic').count()===1&&await page.locator('#q + .pb-dictate').count()===0);
  ok('No unhandled app errors',errors.length===0||console.log(errors));
  console.log(`${count} speech input checks passed (simulated system dialog; no physical microphone claim).`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
