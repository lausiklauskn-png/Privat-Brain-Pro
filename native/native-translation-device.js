/* Local mail translation. Native code downloads only explicitly requested,
   pinned public model files. Mail text stays in an isolated local worker. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProTranslation;
  if (!plugin || typeof plugin.status !== 'function' || typeof Worker !== 'function') return;
  const supported = Object.freeze(['de','en','ru','pl']);
  const MAX_TEXT = 40000, BASE = location.origin + '/pb-translation/';
  const models = Object.freeze({
    'de-en':{key:'de-en',source:'de',target:'en',id:'Xenova/opus-mt-de-en',prefix:''},
    'en-de':{key:'en-de',source:'en',target:'de',id:'Xenova/opus-mt-en-de',prefix:''},
    'ru-en':{key:'ru-en',source:'ru',target:'en',id:'Xenova/opus-mt-ru-en',prefix:''},
    'en-ru':{key:'en-ru',source:'en',target:'ru',id:'Xenova/opus-mt-en-ru',prefix:''},
    'pl-en':{key:'pl-en',source:'pl',target:'en',id:'Xenova/opus-mt-pl-en',prefix:''},
    'en-pl':{key:'en-pl',source:'en',target:'pl',id:'Xenova/opus-mt-en-mul',prefix:'>>pol<< '}
  });
  const error = code => Object.assign(new Error(code),{code});
  function pair(args) {
    const source = args?.source, target = args?.target;
    if (!supported.includes(source) || !supported.includes(target)) throw error('TRANSLATION_UNSUPPORTED');
    return {source,target};
  }
  function route({source,target}) {
    if (source === target) return [];
    return source === 'en' || target === 'en' ? [models[source+'-'+target]] : [models[source+'-en'],models['en-'+target]];
  }
  function textOf(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT) throw error('TRANSLATION_BAD_TEXT');
    return value;
  }
  // Deliberately conservative. Ambiguous, short, mixed or unsupported text asks
  // the user for a source language instead of downloading a guessed model.
  async function identify({text} = {}) {
    if (typeof text !== 'string') return {language:'und'};
    const sample = text.slice(0,12000).normalize('NFC').toLowerCase();
    const letters = sample.match(/\p{L}/gu) || [], tokens = sample.match(/\p{L}+/gu) || [];
    if (letters.length < 24 || tokens.length < 5) return {language:'und'};
    if (/[іїєґў]/u.test(sample)) return {language:'und'};
    const cyrillic = (sample.match(/\p{Script=Cyrillic}/gu) || []).length;
    const latin = (sample.match(/\p{Script=Latin}/gu) || []).length;
    if (cyrillic > letters.length * .3 && latin > letters.length * .3) return {language:'und'};
    const lexicon = {
      de:'der die das und ist sind nicht mit für eine einen einer zum zur bitte ihre ihren unserer wir wird werden haben auf rechnung freundlichen grüßen',
      en:'the and this that is are not with for your our please will have has from you we meeting invoice regards tomorrow',
      ru:'и в на не что это как мы вы для при по письмо пожалуйста будет нужно встреча счёт счет спасибо здравствуйте',
      pl:'i w na nie że jest dla oraz proszę państwa naszej naszej będzie można spotkanie faktura dziękuję wiadomość pozdrawiam'
    };
    const unique = new Set(tokens), scores = {};
    for (const code of supported) scores[code] = lexicon[code].split(' ').reduce((sum,word)=>sum+(unique.has(word)?1:0),0);
    if (/[äöüß]/u.test(sample)) scores.de += 2;
    if (/[ąćęłńśźż]/u.test(sample)) scores.pl += 2;
    if (cyrillic < letters.length * .5) scores.ru = 0;
    if (!['пожалуйста','здравствуйте','спасибо','встреча','счёт','счет','нужно'].some(word=>unique.has(word))) scores.ru = 0;
    const ranked = supported.map(code=>({code,score:scores[code]})).sort((a,b)=>b.score-a.score);
    const first = ranked[0], second = ranked[1];
    if (first.score < 3 || first.score-second.score < 2 || first.score < second.score*1.5) return {language:'und'};
    return {language:first.code};
  }
  async function status(args) {
    if (!args || args.source == null && args.target == null) return plugin.status({});
    const selected = pair(args), expected = route(selected);
    if (!expected.length) return {available:true,ready:true,blocked:false,languages:[...supported],route:[],...selected};
    const state = await plugin.status(selected);
    if (state?.ready && (!Array.isArray(state.route) || state.route.length !== expected.length || state.route.some((leg,index)=>leg.key!==expected[index].key || leg.id!==expected[index].id))) throw error('TRANSLATION_ROUTE_MISMATCH');
    return {...state,...selected,available:state?.available !== false,ready:Boolean(state?.ready && !state?.blocked),route:expected.map(leg=>({...leg})),languages:[...supported]};
  }
  async function download(args) {
    const selected = pair(args);
    if (selected.source === selected.target) return status(selected);
    await plugin.download(selected); return status(selected);
  }
  let sequence = 0, active = null;
  function stopWorker() {
    if (!active) return;
    const job = active; active = null; clearTimeout(job.timer); job.worker.terminate(); job.reject(error('TRANSLATION_CANCELLED'));
  }
  function runLeg(text,leg,id,generation) {
    return new Promise((resolve,reject)=>{
      const worker = new Worker(new URL('translation-worker.js',document.baseURI),{type:'module'});
      const done = (failure,value) => {
        clearTimeout(job.timer);worker.terminate();if(active===job)active=null;
        if(failure)reject(failure);else resolve(value);
      };
      const job = {worker,reject,timer:setTimeout(()=>done(error('TRANSLATION_TIMEOUT')),300000)};
      active = job;
      worker.onmessage = event => {
        const value = event.data;
        if (!value || value.id !== id || generation !== sequence) return;
        if (value.type === 'result') {
          if (typeof value.text !== 'string' || !value.text.trim() || value.text.length > MAX_TEXT*4) done(error('TRANSLATION_BAD_RESULT'));
          else done(null,value.text);
        } else if (value.type === 'error') done(error(value.code === 'TRANSLATION_OUTPUT_LIMIT' ? value.code : 'TRANSLATION_FAILED'));
      };
      worker.onerror = event => {event.preventDefault?.();done(error('TRANSLATION_WORKER_FAILED'));};
      worker.onmessageerror = () => done(error('TRANSLATION_BAD_RESULT'));
      worker.postMessage({type:'translate',id,source:leg.source,target:leg.target,text,base:BASE});
    });
  }
  async function translate(args) {
    const selected = pair(args); let text = textOf(args?.text);
    const generation = ++sequence; stopWorker();
    if (selected.source === selected.target) return {text,...selected};
    const state = await status(selected);
    if (generation !== sequence) throw error('TRANSLATION_CANCELLED');
    if (state.blocked) throw error('TRANSLATION_BLOCKED');
    if (!state.ready) throw error('TRANSLATION_MODELS_MISSING');
    for (const [index,leg] of route(selected).entries()) {
      if (generation !== sequence) throw error('TRANSLATION_CANCELLED');
      const id = 'translation-'+Date.now()+'-'+generation+'-'+index;
      await plugin.markLoading({id});
      let failed = true;
      try {
        if (generation !== sequence) throw error('TRANSLATION_CANCELLED');
        text = await runLeg(text,leg,id,generation); failed = false;
      } catch (cause) {
        if (cause?.code === 'TRANSLATION_CANCELLED') failed = false;
        throw cause;
      } finally { await plugin.markFinished({id,failed}); }
    }
    if (generation !== sequence) throw error('TRANSLATION_CANCELLED');
    return {text,...selected};
  }
  async function cancel() {
    sequence++; stopWorker(); await plugin.cancel?.();
  }
  async function clearCrash() { await plugin.clearCrash(); return status(); }
  window.PBTranslationDevice = Object.freeze({identify,status,download,translate,cancel,clearCrash});
})();
