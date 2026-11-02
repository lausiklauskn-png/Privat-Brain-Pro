// Deliberate defects in disposable generated copies; each must trip its behavioral assertion.
import {cp,readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const cases=[
 ['request-before-commit','native-pro-verbund.js','store.put(result);',"store.put(result).addEventListener('success',()=>resolve(result));",'Receipt transaction abort leaves an imported original unacknowledged'],
 ['mark-before-import','native-pro-verbund.js',"const accepted=await signBatch([{file,path:m.name,dirId:null}],{durable:true});","await api.tresorUebergabe({aktion:'quittieren',vaultId:z.kennung,entryId:item.entryId,sha256:m.sha256});const accepted=await signBatch([{file,path:m.name,dirId:null}],{durable:true});",'Canonical input uses the normal catalog and only then acknowledges'],
 ['memory-instead-of-disk','native-originals.js','const file=await readOriginal({hash},true);','const file=await readOriginal({hash},false);','A corrupt stored original never gets a receiver mark'],
 ['delivery-is-not-acceptance','native-pro-verbund.js',"stand:old.stand==='im-eingang'?'im-eingang':'weitergegeben'","stand:'im-eingang'",'Transport delivery is still awaiting the real target mark'],
 ['backup-missing-receipts','native-vault.js',"catalog, saved, proUebergaben });","catalog, saved, proUebergaben: [] });",'Encrypted catalog snapshot also contains the stable transfer receipts'],
 ['receipt-restoration-overwrites','native-pro-verbund.js',"if(db!==database||old&&(JSON.stringify(old.vertrag)!==JSON.stringify(r.vertrag)||old.vaultId!==r.vaultId))throw Error(t(23));\n   if(!old)store.add(r);","if(db!==database)throw Error(t(23));store.put(r);",'Conflicting restoration never overwrites existing receipt metadata']
];
function run(root){return spawnSync(process.execPath,['tools/native/test-pro-verbund.mjs'],{env:{...process.env,PB_PRO_TEST_ROOT:root},encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});}
const baseline=run(resolve('www'));if(baseline.status!==0)throw Error('Baseline failed:\n'+baseline.stdout+baseline.stderr);console.log('PASS unchanged baseline');
for(const [name,file,old,replacement,marker] of cases){
 const scratch=await mkdtemp(join(tmpdir(),'pb-pro-counter-'));
 try{
  await cp(resolve('www'),scratch,{recursive:true});const path=join(scratch,file),source=await readFile(path,'utf8');
  if(source.split(old).length!==2)throw Error('Ambiguous mutation: '+name);await writeFile(path,source.replace(old,replacement));
  const result=run(scratch),output=result.stdout+result.stderr;
  if(result.status===0||!output.includes('AssertionError')||!output.includes(marker))throw Error('Fault not caught for intended reason: '+name+'\n'+output);
  console.log('CAUGHT '+name+': '+marker);
 }finally{await rm(scratch,{recursive:true,force:true});}
}
console.log(`${cases.length} behavioral faults caught; production files unchanged.`);
