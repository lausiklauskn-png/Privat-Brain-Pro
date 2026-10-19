// Render only the flat catalog emblem. The original 3D PWA icons are artwork; never overwrite them.
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const root=new URL('..',import.meta.url),svg=await readFile(new URL('assets/brain-emoji.svg',root),'utf8');
const browser=await chromium.launch({executablePath:process.env.CB_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 for(const size of [512]){
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.screenshot({path:new URL('catalog-emblem.png',root).pathname,omitBackground:true});await page.close();
 }
}finally{await browser.close();}
