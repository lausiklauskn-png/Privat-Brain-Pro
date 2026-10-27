// One chosen microphone for dictation (Klaus 2026-10-27): Windows, Android and the
// browser/PWA. Device lists, recognizers and getUserMedia are simulated; the page,
// settings, storage and the dictation buttons are real. No physical microphone claim.
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
const DEVICES=[
  {id:'TokenEnums\\MMAudioIn\\{0.0.1.00000000}.{aaa}',name:'Mikrofon (Realtek(R) Audio)',default:true},
  {id:'TokenEnums\\MMAudioIn\\{0.0.1.00000000}.{bbb}',name:'Headset (Jabra Bluetooth)',default:false},
  {id:'TokenEnums\\MMAudioIn\\{0.0.1.00000000}.{ccc}',name:'Mikrofon (USB Audio Device)',default:false}
];
function stub(platform){
  return [({platform,devices})=>{
    window.micDevices=devices;window.micCalls=[];window.micAnswer={text:'Hallo Welt'};
    window.Capacitor={getPlatform:()=>platform,isNativePlatform:()=>true,Plugins:{ProSpeech:{
      async inputs(){return{items:window.micDevices.map(d=>({...d}))};},
      async listen(args){window.micCalls.push(args);
        if(args.input&&!window.micDevices.some(d=>d.id===args.input||d.name===args.inputName)){const e=new Error('MICROPHONE_MISSING');e.code='MICROPHONE_MISSING';throw e;}
        return window.micAnswer;}
    }}};
    window.toasts=[];window.toast=m=>window.toasts.push(m);
  },{platform,devices:DEVICES}];
}
try{
  browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  const url=`http://127.0.0.1:${server.address().port}/`;
  const open=async platform=>{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
    await page.addInitScript(...stub(platform));
    await page.goto(url);await page.waitForFunction(()=>window.PBWorkspace&&document.getElementById('pb-input-language-settings'));
    return {page,errors};
  };
  const {page,errors}=await open('windows');
  await page.evaluate(()=>{window.toast=m=>window.toasts.push(m);PBInputLanguage.choose('de');});
  await navigateTo(page,'settings');
  await page.waitForFunction(()=>document.querySelectorAll('#pb-microphone-setting option').length===4);
  const options=()=>page.evaluate(()=>[...document.querySelectorAll('#pb-microphone-setting option')].map(o=>[o.value,o.textContent]));
  const status=()=>page.locator('.pb-microphone-status').textContent();
  let list=await options();
  ok('Windows lists every reported microphone after a "Windows default" entry',list[0][0]===''&&list.length===4&&list.slice(1).every((o,i)=>o[0]===DEVICES[i].id));
  ok('The connection named in the device name is shown as a hint (Bluetooth, USB cable, built-in)',/Bluetooth$/.test(list[2][1])&&/USB-Kabel$/.test(list[3][1])&&/eingebaut oder Klinke$/.test(list[1][1]));
  ok('The setting sits in the dictation-language section in the settings',await page.evaluate(()=>document.getElementById('pb-input-language-settings').contains(document.getElementById('pb-microphone-setting'))));
  ok('Without a choice the app follows the Windows default and says so',(await status()).includes('Windows-Standardmikrofon'));
  const dictate=async()=>{await page.evaluate(()=>{const q=document.getElementById('q');q.value='';});await page.evaluate(()=>document.getElementById('mic').click());await page.waitForFunction(()=>!document.querySelector('[data-speaking="true"]'));};
  await dictate();
  ok('Default dictation passes no device, exactly as before',await page.evaluate(()=>{const c=micCalls.at(-1);return c&&!('input' in c)&&!('inputName' in c)&&c.language==='de-DE';}));
  await page.selectOption('#pb-microphone-setting',DEVICES[1].id);
  ok('Choosing the Bluetooth headset is stored and named in the status',await page.evaluate(id=>JSON.parse(localStorage.getItem('pb_microphone_v1')).id===id,DEVICES[1].id)&&(await status()).includes('nur auf: Headset (Jabra Bluetooth)'));
  await dictate();
  ok('Dictation then listens only to the chosen device (id and name passed)',await page.evaluate(d=>{const c=micCalls.at(-1);return c.input===d.id&&c.inputName===d.name;},DEVICES[1])&&await page.locator('#q').inputValue()==='Hallo Welt');
  // Replugged: the same device returns with a new id.
  await page.evaluate(()=>{micDevices=micDevices.map(d=>d.name.includes('Jabra')?{...d,id:'TokenEnums\\MMAudioIn\\{new}'}:d);});
  await page.click('#pb-microphone-search');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pb_microphone_v1')).id.includes('{new}'));
  ok('A replugged device with a new id keeps the choice under its new id',await page.evaluate(()=>document.getElementById('pb-microphone-setting').value.includes('{new}')));
  // Unplugged: never fall back silently.
  await page.evaluate(()=>{micDevices=micDevices.filter(d=>!d.name.includes('Jabra'));});
  await page.click('#pb-microphone-search');await page.waitForFunction(()=>document.querySelector('.pb-microphone-status').textContent.startsWith('Nicht verbunden'));
  list=await options();
  ok('An unplugged chosen microphone stays selected and is marked "nicht verbunden"',list.at(-1)[0]==='missing'&&list.at(-1)[1].includes('nicht verbunden')&&await page.evaluate(()=>document.getElementById('pb-microphone-setting').value==='missing'));
  await dictate();
  ok('Dictation reports the missing microphone by name and inserts nothing',await page.evaluate(()=>toasts.at(-1)?.includes('nicht verbunden: Headset (Jabra Bluetooth)'))&&await page.locator('#q').inputValue()==='');
  await page.selectOption('#pb-microphone-setting','');
  await dictate();
  ok('Back to "Windows default" removes the stored choice and passes no device',await page.evaluate(()=>localStorage.getItem('pb_microphone_v1')===null&&!('input' in micCalls.at(-1))));
  await page.evaluate(()=>{document.documentElement.lang='en';});
  await page.waitForFunction(()=>document.querySelector('[data-microphone-copy="label"]').textContent==='Microphone for dictation');
  ok('Labels follow the interface language (English)',(await status()).includes('Windows default microphone')&&(await options())[0][1].startsWith('Windows default'));
  ok('No emoji in the microphone setting',await page.evaluate(()=>!/\p{Extended_Pictographic}/u.test(document.getElementById('pb-microphone-row').textContent)));
  ok('No unhandled app errors (Windows)',errors.length===0);
  await page.close();
  // Android: the type of connection comes from Android itself; the app only routes.
  const ANDROID=[{id:'builtin',name:'',kind:'builtin'},{id:'bluetooth:abc123',name:'Galaxy Buds',kind:'bluetooth'},{id:'usb:def456',name:'USB-C Headset',kind:'usb'}];
  const android=await browser.newPage({viewport:{width:1280,height:900}}),androidErrors=[];
  android.on('pageerror',e=>androidErrors.push(e.message));
  await android.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
  await android.addInitScript(stub('android')[0],{platform:'android',devices:ANDROID});
  await android.goto(url);await android.waitForFunction(()=>window.PBWorkspace&&document.getElementById('pb-input-language-settings'));
  await android.evaluate(()=>{window.toast=m=>window.toasts.push(m);PBInputLanguage.choose('de');});
  await navigateTo(android,'settings');
  await android.waitForFunction(()=>document.querySelectorAll('#pb-microphone-setting option').length===4);
  const aOptions=await android.evaluate(()=>[...document.querySelectorAll('#pb-microphone-setting option')].map(o=>[o.value,o.textContent]));
  ok('Android lists the device microphone, Bluetooth and USB with the connection Android reports',aOptions[0][1].startsWith('Android-Standard')&&aOptions[1][1]==='Mikrofon im Gerät'&&aOptions[2][1]==='Galaxy Buds · Bluetooth'&&aOptions[3][1]==='USB-C Headset · USB-Kabel');
  ok('Without a choice Android decides, as before',(await android.locator('.pb-microphone-status').textContent()).includes('Wahl von Android'));
  const aDictate=async()=>{await android.evaluate(()=>{document.getElementById('q').value='';document.getElementById('mic').click();});await android.waitForFunction(()=>!document.querySelector('[data-speaking="true"]'));};
  await aDictate();
  ok('Android default dictation passes no device',await android.evaluate(()=>!('input' in micCalls.at(-1))));
  await android.selectOption('#pb-microphone-setting','bluetooth:abc123');await aDictate();
  ok('Android passes the chosen Bluetooth microphone to the routing and says so honestly',await android.evaluate(()=>micCalls.at(-1).input==='bluetooth:abc123'&&micCalls.at(-1).inputName==='Galaxy Buds')&&(await android.locator('.pb-microphone-status').textContent()).includes('geleitet: Galaxy Buds'));
  await android.selectOption('#pb-microphone-setting','builtin');await aDictate();
  ok('Choosing the device microphone passes its fixed id',await android.evaluate(()=>micCalls.at(-1).input==='builtin'));
  ok('No unhandled app errors (Android)',androidErrors.length===0);
  await android.close();

  // Browser/PWA: Chrome 135+ gets the chosen microphone as an audio track.
  const webStub=({version,devices})=>{
    delete window.Capacitor;
    Object.defineProperty(Navigator.prototype,'userAgentData',{configurable:true,get:()=>({brands:[{brand:'Chromium',version:String(version)}]})});
    window.webDevices=devices;window.granted=false;window.srCalls=[];window.gumCalls=[];window.stopped=[];window.toasts=[];
    const md={
      async enumerateDevices(){return [{deviceId:'default',kind:'audioinput',label:window.granted?'Standard':'',groupId:'g1'},...window.webDevices.map(d=>({deviceId:d.id,kind:'audioinput',label:window.granted?d.name:'',groupId:d.group}))];},
      async getUserMedia(c){window.gumCalls.push(JSON.parse(JSON.stringify(c)));
        if(c.audio===true){window.granted=true;const t={label:'any',stop(){}};return{getTracks:()=>[t],getAudioTracks:()=>[t]};}
        const d=window.webDevices.find(x=>x.id===c.audio.deviceId.exact);if(!d){const e=new Error('gone');e.name='OverconstrainedError';throw e;}
        const t={kind:'audio',label:d.name,stop(){window.stopped.push(d.name);}};return{getTracks:()=>[t],getAudioTracks:()=>[t]};},
      addEventListener(){}
    };
    Object.defineProperty(Navigator.prototype,'mediaDevices',{configurable:true,get:()=>md});
    class FakeRecognition extends EventTarget{
      dispatchEvent(e){const r=super.dispatchEvent(e);const h=this['on'+e.type];if(typeof h==='function')h.call(this,e);return r;}
      start(track){window.srCalls.push(track===undefined?null:track.label);setTimeout(()=>{if(typeof this.onresult==='function')this.onresult({results:[[{transcript:'Hallo Web'}]]});this.dispatchEvent(new Event('end'));},20);}
      stop(){} abort(){}
    }
    window.SpeechRecognition=FakeRecognition;window.webkitSpeechRecognition=FakeRecognition;
  };
  const WEB=[{id:'dev-builtin',name:'Mikrofon (Realtek(R) Audio)',group:'g1'},{id:'dev-bt',name:'Headset (Jabra Bluetooth)',group:'g2'}];
  const openWeb=async version=>{
    const p=await browser.newPage({viewport:{width:1280,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
    await p.addInitScript(webStub,{version,devices:WEB});
    await p.goto(url);await p.waitForFunction(()=>window.PBWorkspace&&document.getElementById('pb-input-language-settings'));
    await p.evaluate(()=>{window.toast=m=>window.toasts.push(m);PBInputLanguage.choose('de');});
    await navigateTo(p,'settings');return{p,errs};
  };
  const web=await openWeb(140),w=web.p;
  await w.waitForFunction(()=>document.querySelectorAll('#pb-microphone-setting option').length===3);
  ok('PWA lists microphones without asking first and explains how names appear',(await w.locator('.pb-microphone-status').textContent()).includes('Neu suchen')&&await w.evaluate(()=>gumCalls.length===0));
  await w.click('#pb-microphone-search');
  await w.waitForFunction(()=>[...document.querySelectorAll('#pb-microphone-setting option')].some(o=>o.textContent.startsWith('Headset (Jabra Bluetooth)')));
  ok('"Neu suchen" asks for microphone access once and then shows the real names',await w.evaluate(()=>gumCalls.length===1&&gumCalls[0].audio===true));
  const wDictate=async()=>{await w.evaluate(()=>{document.getElementById('q').value='';document.getElementById('mic').click();});await w.waitForTimeout(200);};
  await wDictate();
  ok('PWA default dictation starts the browser recognizer without a device, as before',await w.evaluate(()=>srCalls.at(-1)===null));
  await w.selectOption('#pb-microphone-setting','dev-bt');await wDictate();
  ok('PWA hands the chosen Bluetooth microphone to the recognizer as an audio track',await w.evaluate(()=>srCalls.at(-1)==='Headset (Jabra Bluetooth)'&&gumCalls.at(-1).audio.deviceId.exact==='dev-bt')&&await w.locator('#q').inputValue()==='Hallo Web');
  ok('The microphone track is released when listening ends',await w.evaluate(()=>stopped.includes('Headset (Jabra Bluetooth)')));
  await w.evaluate(()=>{webDevices=webDevices.filter(d=>d.id!=='dev-bt');});await w.click('#pb-microphone-search');
  await w.waitForFunction(()=>document.querySelector('.pb-microphone-status').textContent.startsWith('Nicht verbunden'));
  const before=await w.evaluate(()=>srCalls.length);await wDictate();
  ok('PWA: an unplugged chosen microphone is reported and nothing listens on another one',await w.evaluate(n=>srCalls.length===n&&/nicht verbunden: Headset \(Jabra Bluetooth\)/i.test(toasts.at(-1)||''),before));
  ok('No unhandled app errors (PWA)',web.errs.length===0);
  await w.close();
  const old=await openWeb(120),o=old.p;
  await o.evaluate(()=>localStorage.setItem('pb_microphone_v1',JSON.stringify({id:'dev-bt',name:'Headset (Jabra Bluetooth)'})));
  await o.reload();await o.waitForFunction(()=>window.PBWorkspace&&document.querySelector('.pb-microphone-status'));
  await o.evaluate(()=>{window.toast=m=>window.toasts.push(m);PBInputLanguage.choose('de');});
  await navigateTo(o,'settings');
  await o.waitForFunction(()=>document.querySelector('.pb-microphone-status').textContent.includes('Chrome oder Edge'));
  ok('Older browsers say plainly that they use the browser microphone, with no choice offered',await o.evaluate(()=>document.getElementById('pb-microphone-setting').parentElement.hidden));
  await o.evaluate(()=>{document.getElementById('q').value='';document.getElementById('mic').click();});await o.waitForTimeout(200);
  ok('Older browsers keep the recognizer untouched (no device, no extra access request)',await o.evaluate(()=>srCalls.at(-1)===null&&gumCalls.length===0));
  ok('No unhandled app errors (older browser)',old.errs.length===0);
  console.log(`${count} microphone-choice checks passed (simulated device lists and recognizers for Windows, Android and the browser; no physical microphone claim).`);
}finally{await browser?.close();server.close();}
