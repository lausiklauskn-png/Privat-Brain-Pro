import {cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),windows=join(root,'windows');
execFileSync(process.execPath,[join(root,'tools/native/prepare-web.mjs')],{cwd:root,stdio:'inherit'});
const dist=join(windows,'dist');await rm(dist,{recursive:true,force:true});await cp(join(root,'www'),dist,{recursive:true});
const origin='var ALLOWED_ORIGINS = ["https://lausiklauskn-png.github.io", "https://localhost"];';
for(const path of ['assets/schutz-init.js','kimboard/assets/schutz-init.js','kimseek/assets/schutz-init.js']){
  const file=join(dist,path),text=await readFile(file,'utf8');
  if(!text.includes(origin))throw Error('Review native origin: '+path);
  await writeFile(file,text.replace(origin,'var ALLOWED_ORIGINS = ["https://lausiklauskn-png.github.io", "https://localhost", "https://tauri.localhost", "https://pbtool.localhost"];'));
}
await mkdir(join(dist,'windows'),{recursive:true});
await writeFile(join(dist,'windows/start.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'"><title>Private Brain Pro</title>');
await cp(join(windows,'dialog'),join(dist,'windows/dialog'),{recursive:true});
await cp(join(windows,'bridge/tool-client.js'),join(dist,'windows/tool-client.js'));
for(const name of ['kimboard','kimseek']){
  const path=join(dist,name,'index.html');let text=await readFile(path,'utf8');
  text=text.replace('<script src="../tool-gate.js"></script>','<script src="../tool-gate.js"></script><script src="../windows/tool-client.js"></script>');
  await writeFile(path,text);
}
await cp(join(root,'icon-512.png'),join(dist,'windows/icon.png'));
let html=await readFile(join(dist,'index.html'),'utf8');
// The same app CSP plus Tauri's private IPC transport; no remotely loaded app.
html=html.replace("connect-src 'self' https:","connect-src 'self' ipc: http://ipc.localhost https://ipc.localhost https:");
html=html.replace("frame-src 'self'","frame-src 'self' https://pbtool.localhost");
await writeFile(join(dist,'index.html'),html);
console.log('Windows frontend prepared from the shared native bundle.');
