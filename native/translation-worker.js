/* One translation leg per isolated module worker. No remote model fallback,
   no mail upload, no shared embedding environment, no retained model pipeline. */
'use strict';
const MODELS = Object.freeze({
  'de-en':{id:'Xenova/opus-mt-de-en',prefix:''},
  'en-de':{id:'Xenova/opus-mt-en-de',prefix:''},
  'ru-en':{id:'Xenova/opus-mt-ru-en',prefix:''},
  'en-ru':{id:'Xenova/opus-mt-en-ru',prefix:''},
  'pl-en':{id:'Xenova/opus-mt-pl-en',prefix:''},
  'en-pl':{id:'Xenova/opus-mt-en-mul',prefix:'>>pol<< '}
});
const FILES = ['config.json','tokenizer.json','tokenizer_config.json','generation_config.json','special_tokens_map.json',
  'onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx'];
const STAGE_ERRORS = {validate:'TRANSLATION_BAD_INPUT',library:'TRANSLATION_LIBRARY_FAILED',environment:'TRANSLATION_ENVIRONMENT_FAILED',
  model:'TRANSLATION_MODEL_FAILED',tokenize:'TRANSLATION_TOKENIZER_FAILED',inference:'TRANSLATION_INFERENCE_FAILED',dispose:'TRANSLATION_DISPOSE_FAILED'};
const SAFE_CODES = new Set([...Object.values(STAGE_ERRORS),'TRANSLATION_BAD_ORIGIN','TRANSLATION_NETWORK_BLOCKED',
  'TRANSLATION_ASSET_FETCH_FAILED','TRANSLATION_OUTPUT_LIMIT','TRANSLATION_INPUT_LIMIT']);
let busy = false;
function fail(code) { throw Object.assign(new Error(code),{code}); }
// Inspect the exception locally, but expose only fixed categories. Library
// exception messages can include tokenized text, so never forward or log them.
function reasonOf(cause) {
  const message = String(cause?.message || '').toLowerCase();
  if (/out of memory|memory access|allocation|bad alloc/.test(message)) return 'memory';
  if (/content security|\bcsp\b|unsafe-eval|wasm-unsafe-eval/.test(message)) return 'policy';
  if (/failed to fetch|networkerror|network error|load module|imported module/.test(message)) return 'fetch';
  if (/webassembly|\bwasm\b|compileerror|linkerror/.test(message)) return 'wasm';
  if (/no available backend|backend.*not available|unsupported.*backend/.test(message)) return 'backend';
  if (/not found|could not locate|404/.test(message)) return 'missing';
  return 'unknown';
}
function tokenCount(tokenizer,text) {
  const value = tokenizer(text,{truncation:false,padding:false}),ids = value?.input_ids;
  const count = ids?.data?.length || ids?.dims?.at(-1) || (Array.isArray(ids) ? (Array.isArray(ids[0]) ? ids[0].length : ids.length) : 0);
  if (!Number.isSafeInteger(count) || count < 1) fail('TRANSLATION_TOKENIZER_FAILED');
  return count;
}
function chunks(text,tokenizer,prefix) {
  const out = [];
  function add(value) {
    if (!value.trim()) {out.push({literal:value});return;}
    if (Array.from(value).length <= 320 && tokenCount(tokenizer,prefix+value) <= 480) {out.push({text:value});return;}
    const points = Array.from(value),cap = Math.min(320,Math.ceil(points.length/2));
    let cut = cap;
    for (let i=cap;i>Math.floor(cap/2);i--) if (/\s/u.test(points[i] || '')) {cut=i;break;}
    if (cut<1 || cut>=points.length) fail('TRANSLATION_INPUT_LIMIT');
    add(points.slice(0,cut).join(''));add(points.slice(cut).join(''));
  }
  for (const part of text.split(/(\n+)/u)) if (part) add(part);
  return out;
}
self.onmessage = async event => {
  const input = event.data,id = input?.id;
  if (busy || input?.type !== 'translate' || typeof id !== 'string') return;
  busy = true; let pipe = null,stage = 'validate',assetFailure = null;
  const progress = value => {stage=value;self.postMessage({type:'progress',id,stage});};
  try {
    progress('validate');
    const config = MODELS[input.source+'-'+input.target];
    if (!config || typeof input.text !== 'string' || !input.text.trim() || input.text.length>160000) fail('TRANSLATION_BAD_INPUT');
    const base = new URL(input.base);
    if (base.origin !== self.location.origin || base.pathname !== '/pb-translation/' || base.search || base.hash) fail('TRANSLATION_BAD_ORIGIN');
    const library = new URL('lib/transformers.min.js',base).href;
    const allowed = new Set(['lib/transformers.min.js','lib/ort-wasm-simd.wasm','lib/ort-wasm.wasm'].map(path=>new URL(path,base).href));
    for (const path of FILES) allowed.add(new URL('models/'+config.id+'/'+path,base).href);
    const originalFetch = self.fetch.bind(self);
    self.fetch = async (resource,options) => {
      const address = typeof resource === 'string' || resource instanceof URL ? String(resource) : resource?.url;
      const url = new URL(address,self.location.href);
      if (!allowed.has(url.href) || options?.method && options.method !== 'GET' || resource?.method && resource.method !== 'GET') fail('TRANSLATION_NETWORK_BLOCKED');
      const asset = url.href.slice(base.href.length);
      try {
        const response = await originalFetch(resource,options);
        if (!response.ok) assetFailure = {asset,httpStatus:response.status};
        return response;
      } catch (cause) {
        assetFailure = {asset,httpStatus:0};fail('TRANSLATION_ASSET_FETCH_FAILED');
      }
    };
    progress('library');
    const transformers = await import(library),env = transformers.env;
    progress('environment');
    env.allowLocalModels = true; env.allowRemoteModels = false; env.localModelPath = new URL('models/',base).href;
    env.useBrowserCache = false; env.useFSCache = false;
    env.backends.onnx.wasm.wasmPaths = new URL('lib/',base).href;
    env.backends.onnx.wasm.numThreads = 1; env.backends.onnx.wasm.proxy = false;
    progress('model');
    pipe = await transformers.pipeline('translation',config.id,{quantized:true});
    progress('tokenize');
    if (typeof pipe.tokenizer !== 'function') fail('TRANSLATION_TOKENIZER_FAILED');
    const pieces = chunks(input.text,pipe.tokenizer,config.prefix),result = [];
    for (const part of pieces) {
      if (part.literal != null) {result.push(part.literal);continue;}
      progress('inference');
      const output = await pipe(config.prefix+part.text,{max_new_tokens:512,do_sample:false,num_beams:1});
      const translated = Array.isArray(output) ? output[0]?.translation_text : output?.translation_text;
      if (typeof translated !== 'string' || !translated.trim()) fail('TRANSLATION_INFERENCE_FAILED');
      progress('tokenize');
      if (tokenCount(pipe.tokenizer,translated) >= 480) fail('TRANSLATION_OUTPUT_LIMIT');
      const previous = result.at(-1);
      if (previous && !/\s$/u.test(previous) && !/^\s/u.test(translated)) result.push(' ');
      result.push(translated);
    }
    const translated = result.join('');
    if (!translated.trim() || translated.length>160000) fail('TRANSLATION_OUTPUT_LIMIT');
    progress('dispose');await pipe.dispose();pipe=null;
    self.postMessage({type:'result',id,text:translated});
  } catch (cause) {
    self.postMessage({type:'error',id,code:SAFE_CODES.has(cause?.code) ? cause.code : STAGE_ERRORS[stage] || 'TRANSLATION_FAILED',
      stage,reason:reasonOf(cause),...assetFailure});
  } finally {
    try {await pipe?.dispose?.();}catch{/* The parent also terminates this worker after every leg. */}
    self.close();
  }
};
