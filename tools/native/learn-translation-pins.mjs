// One-time first-trust audit of public translation models. No weights, emails,
// accounts or secrets are downloaded. Review and commit the generated pins.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';

const output = resolve(process.argv[2] || 'translation-pin-audit/translation-models.json');
const semantic = JSON.parse(await readFile(new URL('./semantic-model.json', import.meta.url), 'utf8'));
const definitions = [
  ['de','en','Xenova/opus-mt-de-en','Helsinki-NLP/opus-mt-de-en',''],
  ['en','de','Xenova/opus-mt-en-de','Helsinki-NLP/opus-mt-en-de',''],
  ['ru','en','Xenova/opus-mt-ru-en','Helsinki-NLP/opus-mt-ru-en',''],
  ['en','ru','Xenova/opus-mt-en-ru','Helsinki-NLP/opus-mt-en-ru',''],
  ['pl','en','Xenova/opus-mt-pl-en','Helsinki-NLP/opus-mt-pl-en',''],
  // No direct Xenova EN→PL model exists. Marian's multilingual target token
  // chooses Polish in this existing OPUS export; it is not an LLM instruction.
  ['en','pl','Xenova/opus-mt-en-mul','Helsinki-NLP/opus-mt-en-mul','>>pol<< ']
];
const required = ['config.json','tokenizer.json','tokenizer_config.json',
  'onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx'];
const optional = ['generation_config.json','special_tokens_map.json'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function bytes(url, limit) {
  let last;
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const response = await fetch(url, {signal:AbortSignal.timeout(60000),headers:{'user-agent':'Private-Brain-Pro-public-model-pin-audit'}});
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      if (Number(response.headers.get('content-length')) > limit) throw new Error('Refusing oversized metadata: '+url);
      const parts=[]; let size=0;
      for await (const part of response.body) { size+=part.length;if(size>limit)throw new Error('Refusing oversized metadata: '+url);parts.push(part); }
      return Buffer.concat(parts);
    } catch(error) { last=error; if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1))); }
  }
  throw last;
}
const json = async url => JSON.parse((await bytes(url,4*1024*1024)).toString('utf8'));
const manifest = {version:1,languages:['de','en','ru','pl'],
  note:'Pinned public OPUS-MT/Marian ONNX exports. Inference stays on the device. Non-English pairs pivot through English.',
  library:{...semantic.library,sizes:{...semantic.sizes},sources:semantic.download.library},models:{}};
const rows=[];
for (const [source,target,id,base,prefix] of definitions) {
  const info = await json('https://huggingface.co/api/models/'+id);
  if(!/^[a-f0-9]{40}$/.test(info.sha))throw new Error('Missing immutable revision: '+id);
  const revision=info.sha, baseInfo=await json('https://huggingface.co/api/models/'+base);
  const license=String(baseInfo.cardData?.license||'').toLowerCase();
  if(!['apache-2.0','cc-by-4.0','mit'].includes(license))throw new Error('Review model license before use: '+base+' '+license);
  const tree=await json(`https://huggingface.co/api/models/${id}/tree/${revision}?recursive=true&expand=true`);
  if(!Array.isArray(tree))throw new Error('Unexpected model tree: '+id);
  const byPath=new Map(tree.filter(entry=>entry.type==='file').map(entry=>[entry.path,entry]));
  const files={};
  for(const name of [...required,...optional.filter(name=>byPath.has(name))]) {
    const entry=byPath.get(name);if(!entry)throw new Error('Required Transformers.js 2.17.2 file absent: '+id+'/'+name);
    const url=`https://huggingface.co/${id}/resolve/${revision}/${name}`;
    let fingerprint,size;
    if(name.endsWith('.onnx')) {
      fingerprint=entry.lfs?.oid||entry.lfs?.sha256;
      if(!/^[a-f0-9]{64}$/.test(fingerprint||''))throw new Error('Missing weight SHA-256; refusing to download weights: '+url);
      size=entry.lfs?.size||entry.size;
    } else {
      const data=await bytes(url,12*1024*1024);fingerprint=sha256(data);size=data.length;
      JSON.parse(data.toString('utf8'));
    }
    if(!Number.isSafeInteger(size)||size<=0||size>256*1024*1024)throw new Error('Unexpected file size: '+url);
    files[name]={sha256:fingerprint,size,url};
  }
  const size=Object.values(files).reduce((sum,file)=>sum+file.size,0);
  manifest.models[source+'-'+target]={source,target,id,revision,prefix,license,base,
    attribution:`Helsinki-NLP OPUS-MT (${base}); ONNX conversion by Xenova. ${license}.`,files,size};
  rows.push(`| ${source} → ${target} | ${id} | ${revision} | ${size} | ${license} |`);
  console.log(`${source} → ${target}: ${id}@${revision} · ${size} bytes · ${license}`);
}
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(manifest,null,2)+'\n');
// The same public manifest is API-readable without an artifact-storage redirect.
// It contains model metadata only, never mail, account data or credentials.
const notice=JSON.stringify(manifest),noticeHash=sha256(Buffer.from(notice)),chunks=[];
for(let start=0;start<notice.length;start+=3000)chunks.push(notice.slice(start,start+3000));
for(let index=0;index<chunks.length;index++) {
  const message=chunks[index].replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
  console.log(`::notice title=Public translation model pins ${index+1}/${chunks.length} ${noticeHash}::${message}`);
}
const summary=['# Public local-translation model pin audit','',
  'No model weights, mail, account data or secrets were downloaded. JSON/tokenizer bytes were hashed; ONNX hashes and sizes come from the pinned Hugging Face LFS metadata. Review this artifact before integrating it.','',
  '| Direction | Model | Immutable revision | Total bytes | Base-model license |',
  '|---|---|---|---:|---|',...rows,''].join('\n');
await writeFile(resolve(dirname(output),'summary.md'),summary);
if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,summary);
console.log('Public model manifest written to '+output);
