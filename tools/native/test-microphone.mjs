// Windows: one chosen microphone for dictation (Klaus 2026-10-27).
// The native device list and recognizer are simulated; the page, settings,
// storage and the dictation button are real. No physical microphone claim.
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
  const android=await open('android');
  await android.page.waitForTimeout(400);
  ok('Android keeps its own speech dialog: no microphone setting appears',await android.page.evaluate(()=>!document.getElementById('pb-microphone-setting')&&!window.PBMicrophone));
  ok('No unhandled app errors (Android)',android.errors.length===0);
  console.log(`${count} microphone-choice checks passed (simulated Windows device list and recognizer; no physical microphone claim).`);
}finally{await browser?.close();server.close();}
