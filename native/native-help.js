/* Explicit help disclosures for ordinary explanations. Progress, errors,
   storage decisions and privacy controls keep their original visible nodes. */
(() => {
  'use strict';
  if (window.PBHelp) return;
  const root = document.documentElement, entries = new Map(), disclosures = new WeakMap();
  const words = {
    de:{show:'Hilfe anzeigen',hide:'Hilfe ausblenden',for:'Hilfe zu'},
    en:{show:'Show help',hide:'Hide help',for:'Help for'},
    ru:{show:'Показать справку',hide:'Скрыть справку',for:'Справка:'},
    pl:{show:'Pokaż pomoc',hide:'Ukryj pomoc',for:'Pomoc:'}
  };
  const copy = () => words[String(root.lang || 'de').slice(0,2)] || words.de;
  // Klaus 2026-10-26 (Sitzung 3, Punkt 7): one tap opens, a second closes; the choice stays, also after a restart.
  // Whoever never touches it sees the explanation open.
  const STORE = 'pb_help_open_v1';
  let remembered = {};
  try { const v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v && typeof v === 'object') remembered = v; } catch {}
  const wasOpen = key => typeof remembered[key] === 'boolean' ? remembered[key] : true;
  const remember = (key, value) => { remembered[key] = !!value; try { localStorage.setItem(STORE, JSON.stringify(remembered)); } catch {} };
  const one = (host, selector) => host?.querySelector(selector);
  function symbol() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    const circle = document.createElementNS(svg.namespaceURI,'circle');circle.setAttribute('cx','12');circle.setAttribute('cy','12');circle.setAttribute('r','9');
    const line = document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d','M12 10v7m0-10v.01');
    svg.append(circle,line);return svg;
  }
  function label(entry) {
    // A shared icon adapter may retain a hidden legacy glyph for the original
    // translator. Omit only known decorative prefixes from this UI label.
    const w = copy(), name = (entry.name || entry.heading?.textContent || '').replace(/\p{Extended_Pictographic}[\uFE0F\uFE0E]?\s*/gu,'').trim();
    entry.button.title = entry.content.hidden ? w.show : w.hide;
    entry.button.setAttribute('aria-label',`${w.for} ${name}`);
    entry.content.setAttribute('aria-label',`${w.for} ${name}`);
  }
  function open(entry, show) {
    entry.content.hidden = !show;entry.button.setAttribute('aria-expanded',String(show));label(entry);
  }
  function register(key, host, heading, values, keepPosition = false, actions = null, name = '') {
    if (!host || (!heading && !actions)) return;
    const nodes = values.filter(node => node && host.contains(node));
    if (!nodes.length) return;
    const previous = entries.get(key);
    if (previous?.host === host && (!previous.heading || host.contains(previous.heading)) && host.contains(previous.button) && host.contains(previous.content)) {
      for (const node of nodes) if (node !== previous.content && !previous.content.contains(node)) previous.content.append(node);
      label(previous);return;
    }
    const button = document.createElement('button');button.type='button';button.className='pb-help-toggle';button.dataset.pbHelpToggle=key;button.append(symbol());
    let content;
    if (keepPosition && nodes.length === 1) content = nodes[0];
    else {content=document.createElement('div');if(keepPosition||!heading)nodes[0].before(content);else heading.after(content);content.append(...nodes);}
    content.classList.add('pb-help-content');content.dataset.pbHelpContent=key;
    if (!content.id) content.id='pb-help-content-'+key;
    content.setAttribute('role','region');
    if (actions) {if(heading)heading.hidden=true;actions.append(button);}
    else {const row=document.createElement('div');row.className='pb-help-heading';heading.before(row);row.append(heading,button);}
    button.setAttribute('aria-controls',content.id);
    const entry={key,host,heading,button,content,name};entries.set(key,entry);open(entry,wasOpen(key));
    button.addEventListener('click',()=>{open(entry,content.hidden);remember(key,!content.hidden);});
    const escape=event=>{if(event.key==='Escape'&&!content.hidden){event.preventDefault();event.stopPropagation();open(entry,false);remember(key,false);button.focus();}};
    button.addEventListener('keydown',escape);content.addEventListener('keydown',escape);
  }
  function card(key, host, selectors, keepPosition=false, actions=null) {
    if (!host) return;
    register(key,host,one(host,'h2,h3'),selectors.map(selector=>one(host,selector)),keepPosition,actions);
  }
  function introduction(key,host,selector) {
    const original=one(host,`[data-pb-help-static="${key}"]`);
    if(original)return original;
    const node=one(host,selector);
    // These callers identify known static introductions in specific cards.
    // Never turn a live state, input, decision or action into ordinary help.
    if(!node||node.matches('[role="status"],[aria-live]')||node.querySelector('input,textarea,select,button,[role="status"],[aria-live]'))return null;
    node.dataset.pbHelpStatic=key;return node;
  }
  // An explanation without a heading of its own: its ⓘ joins the row of controls next to it.
  function bare(key,host,selector,actions,name) {
    if(!host||!actions)return;
    const node=introduction(key,host,selector);
    register(key,host,null,[node],true,actions,name);
  }
  function staticCard(key,host,selector) {
    const node=introduction(key,host,selector);
    register(key,host,one(host,'h2,h3'),[node],true);
  }
  function information(key,details,heading) {
    const summary=one(details,':scope>summary');if(!summary)return;
    let entry=disclosures.get(summary);
    const raw=summary.textContent.trim();
    if(!entry){
      entry={name:''};disclosures.set(summary,entry);
      const paint=()=>{summary.title=details.open?copy().hide:copy().show;summary.setAttribute('aria-expanded',String(details.open));};
      details.open=wasOpen(key);
      details.addEventListener('toggle',()=>{paint();remember(key,details.open);});
      summary.addEventListener('keydown',event=>{if(event.key==='Escape'&&details.open){event.preventDefault();event.stopPropagation();details.open=false;paint();summary.focus();}});
      entry.paint=paint;
    }
    if(raw)entry.name=raw==='?'?heading?.textContent.trim()||summary.getAttribute('aria-label')||raw:raw;
    else if(key==='ocr')entry.name=heading?.textContent.trim()||entry.name;
    if(!summary.classList.contains('pb-help-toggle'))summary.classList.add('pb-help-toggle');
    if(summary.dataset.pbHelpDetails!==key)summary.dataset.pbHelpDetails=key;
    if(!summary.querySelector(':scope>svg'))summary.replaceChildren(symbol());
    summary.setAttribute('aria-label',entry.name);entry.paint();
  }
  function settingsOrder(settings,first,last) {
    if(!settings)return;
    const unique=nodes=>[...new Set(nodes.filter(node=>node?.parentElement===settings))];
    const above=unique(first),below=unique(last),used=new Set([...above,...below]);
    const rest=[...settings.children].filter(node=>!used.has(node));
    const desired=[...above,...below,...rest];
    // Compare before moving: unconditional appends would wake our own observer.
    for(let index=0;index<desired.length;index++)if(settings.children[index]!==desired[index])settings.insertBefore(desired[index],settings.children[index]||null);
  }
  function refresh() {
    for (const [key,entry] of entries) if (!entry.host.isConnected) entries.delete(key);
    const intake=document.getElementById('panel-intake');
    // The active Add tab already names this view. Retain the original heading
    // for translation and the panel's accessible name, without another title row.
    const intakeTitle=one(intake,':scope > h2[data-ws="add"]');
    if (intakeTitle) {
      if(!intakeTitle.hidden)intakeTitle.hidden=true;
      if (!intakeTitle.id) intakeTitle.id='pb-intake-heading';
      if(intake.getAttribute('aria-labelledby')!==intakeTitle.id)intake.setAttribute('aria-labelledby',intakeTitle.id);
    }
    card('import-library',one(intake,'.library-setup'),['[data-ws="libraryHelp"]'],true);
    const drop=document.getElementById('drop'),principles=one(intake,'.native-import-reassurance');
    // General import reassurance shares the existing closed import disclosure.
    // The original translated nodes stay intact; progress and storage state do not move.
    if (drop && principles && !drop.contains(principles)) drop.append(principles);
    card('import-drop',drop,['[data-i18n="dropP"]','#fsHint','[data-i18n="dropDnd"]','.native-import-reassurance'],false,one(drop,':scope>.btnrow'));
    const settings=document.getElementById('panel-settings'),theme=document.getElementById('pb-theme-settings');
    // The direct palette reuses these translated labels, colors and status.
    // Keep its source intact without offering a second large theme chooser.
    if(theme&&!theme.hidden)theme.hidden=true;
    card('input-language',document.getElementById('pb-input-language-settings'),['[data-input-language-copy="help"]'],true);
    const vault=document.getElementById('vaultPlace'),protection=document.getElementById('schutzPlace'),tresor=document.getElementById('tresorNote');
    staticCard('vault',vault,':scope>p.hint');
    staticCard('protection',protection,':scope>.pb-schutz-info');
    card('tresor',tresor,['[data-i18n="tresorP"]'],true);
    const offline=document.getElementById('ocrFlag')?.closest('.note');
    staticCard('offline',offline,':scope>h3+p');
    const provider=document.getElementById('aiProvider')?.closest('.note');
    // Keep key hints first so their shared region stays inside the key row:
    // its original renderer still finds both hints there after translation.
    introduction('provider',provider,':scope>h3+p');
    card('key-instructions',provider,['#pb-ai-key-links .pb-ai-key-hint[data-for="google"]','#pb-ai-key-links .pb-ai-key-hint[data-for="mistral"]','[data-pb-help-static="provider"]'],true);
    const image=document.getElementById('capEnable')?.closest('.note'),attachments=document.getElementById('attToggle')?.closest('.note');
    card('image-model',image,['[data-i18n="capP"]','[data-i18n="capServerP"]']);
    card('attachments',attachments,['[data-i18n="attP"]'],true);
    const folders=document.getElementById('dirList')?.closest('.note'),catalog=document.getElementById('btnPersist')?.closest('.note'),merge=document.getElementById('btnFullExport')?.closest('.note'),mycel=document.getElementById('mycelPlace');
    staticCard('folders',folders,':scope>h3+p');
    staticCard('catalog',catalog,':scope>h3+p');
    staticCard('catalog-merge',merge,':scope>h3+p');
    staticCard('mycel',mycel,':scope>p.hint');
    // Sitzung 3 (Punkt 7): explanations outside the settings get the same ⓘ.
    const tabName=page=>(document.querySelector(`[data-tab="${page}"] .compact-caption`)||document.querySelector(`[data-tab="${page}"]`))?.textContent.trim()||'';
    staticCard('reorg',document.getElementById('reorgNote'),':scope>h3+p');
    const order=document.getElementById('panel-order');
    bare('categories-intro',order,':scope>p.hint',one(order,':scope>.pb-order-bar'),tabName('order'));
    const dupes=document.getElementById('panel-dupes'),dupesIntro=one(dupes,':scope>p.hint');
    bare('dupes-intro',dupes,':scope>p.hint',dupesIntro?.nextElementSibling?.matches?.('.btnrow,.pb-dup-actions')?dupesIntro.nextElementSibling:null,tabName('dupes'));
    // Sitzung 3 (Punkt 9d): the vault contents stand right under „sperren/entsperren“, no separate box further down.
    const vaultList=document.getElementById('vaultList'),vaultNote=document.getElementById('vaultNote');
    if(tresor&&vaultList&&!tresor.contains(vaultList)){vaultList.classList.add('pb-tresor-contents');(one(tresor,':scope>.btnrow')||tresor.lastElementChild).after(vaultList);}
    if(vaultNote&&!vaultNote.contains(vaultList)&&!vaultNote.hidden)vaultNote.hidden=true;
    const diagnostics=document.getElementById('diagLog')?.closest('.note');
    card('diagnostics',diagnostics,[':scope > p'],true);
    const ocr=document.getElementById('pb-ocr-settings');
    information('ocr',one(ocr,':scope>details'),one(ocr,'[data-ocr="title"]'));
    information('vault-limits',one(vault,':scope>.native-vault-limits'),one(vault,'h3'));
    information('protection-limits',one(protection,':scope>.native-vault-limits'),one(protection,'h3'));
    // V3 keeps its own order of the settings (Klaus asked for the ⓘ, not for a new order).
    if(!root.classList.contains('v3'))settingsOrder(settings,[document.getElementById('pb-input-language-settings'),vault,protection,offline,ocr,tresor,provider,image,attachments,folders,catalog,merge,mycel,document.getElementById('pb-license'),one(settings,':scope>.native-updates')],[document.getElementById('stFiles')?.closest('.note'),document.getElementById('vaultNote')]);
    for(const entry of entries.values())label(entry);
    if(!root.classList.contains('pb-help-ready'))root.classList.add('pb-help-ready');
  }
  let pending=false;
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh();});}
  function start(){
    refresh();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['lang']});
  }
  window.PBHelp=Object.freeze({refresh});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
