// Deliberate faults only in disposable copies of the built UI. Each must fail the intended behavior assertion.
import {cp,readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const cases=[
 ['early-ack','native-share.js','const receipts=await window.signBatch(entries,{durable:true});','await window.signBatch(entries,{durable:true}); const receipts=await Promise.all(entries.map(async(e,index)=>({index,sha256:await sha256(await e.file.arrayBuffer())})));','Declined folder permission does not acknowledge a file'],
 ['memory-is-not-storage','native-originals.js','const file=await readOriginal({hash},true);','const file=await readOriginal({hash},false);','A corrupt native copy is rejected even with the good File still in session memory'],
 ['request-is-not-commit','index.html','action(t.objectStore(store));',"action(t.objectStore(store)).addEventListener('success',()=>res());",'Request success followed by transaction abort leaves the source pending'],
 ['mail-write-swallowed','index.html','    await idbPut("catalog", rec);\n    CATALOG.push(rec); HASHSET.add(hash);','    try { await idbPut("catalog", rec); } catch {}\n    CATALOG.push(rec); HASHSET.add(hash);','Mail transaction failure cannot be swallowed into a false success']
];
function run(root){return spawnSync(process.execPath,['tools/native/test-share.mjs'],{env:{...process.env,PB_SHARE_TEST_ROOT:root},encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});}
const baseline=run(resolve('www'));if(baseline.status!==0)throw Error('Baseline failed:\n'+baseline.stdout+baseline.stderr);console.log('PASS unchanged baseline');
for(const [name,file,old,replacement,marker] of cases){
 const scratch=await mkdtemp(join(tmpdir(),'pb-share-counter-'));
 try{
  await cp(resolve('www'),scratch,{recursive:true});
  const path=join(scratch,file),source=await readFile(path,'utf8');
  if(source.split(old).length!==2)throw Error('Ambiguous mutation: '+name);
  await writeFile(path,source.replace(old,replacement));
  const result=run(scratch),output=result.stdout+result.stderr;
  if(result.status===0||!output.includes('AssertionError')||!output.includes(marker))throw Error('Fault not caught for the intended reason: '+name+'\n'+output);
  console.log('CAUGHT '+name+': '+marker);
 }finally{await rm(scratch,{recursive:true,force:true});}
}
console.log(`${cases.length} behavioral faults caught; production files unchanged.`);
