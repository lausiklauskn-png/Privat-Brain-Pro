/* Explicit help disclosures for ordinary explanations. Progress, errors,
   storage decisions and privacy controls keep their original visible nodes. */
(() => {
  'use strict';
  if (window.PBHelp) return;
  const root = document.documentElement, entries = new Map();
  const words = {
    de:{show:'Hilfe anzeigen',hide:'Hilfe ausblenden',for:'Hilfe zu'},
    en:{show:'Show help',hide:'Hide help',for:'Help for'},
    ru:{show:'Показать справку',hide:'Скрыть справку',for:'Справка:'},
    pl:{show:'Pokaż pomoc',hide:'Ukryj pomoc',for:'Pomoc:'}
  };
  const copy = () => words[String(root.lang || 'de').slice(0,2)] || words.de;
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
    const w = copy(), name = entry.heading.textContent.trim().replace(/^(?:📥|📎|🔬|🧠|🛡|✋|🗂|📁|📄)[\uFE0F\uFE0E]?\s*/u,'');
    entry.button.title = entry.content.hidden ? w.show : w.hide;
    entry.button.setAttribute('aria-label',`${w.for} ${name}`);
    entry.content.setAttribute('aria-label',`${w.for} ${name}`);
  }
  function open(entry, show) {
    entry.content.hidden = !show;entry.button.setAttribute('aria-expanded',String(show));label(entry);
  }
  function register(key, host, heading, values, keepPosition = false, actions = null) {
    if (!host || !heading) return;
    const nodes = values.filter(node => node && host.contains(node));
    if (!nodes.length) return;
    const previous = entries.get(key);
    if (previous?.host === host) {
      for (const node of nodes) if (node !== previous.content && !previous.content.contains(node)) previous.content.append(node);
      label(previous);return;
    }
    const button = document.createElement('button');button.type='button';button.className='pb-help-toggle';button.dataset.pbHelpToggle=key;button.append(symbol());
    let content;
    if (keepPosition && nodes.length === 1) content = nodes[0];
    else {content=document.createElement('div');heading.after(content);content.append(...nodes);}
    content.classList.add('pb-help-content');content.dataset.pbHelpContent=key;
    if (!content.id) content.id='pb-help-content-'+key;
    content.setAttribute('role','region');
    if (actions) {heading.hidden=true;actions.append(button);}
    else {const row=document.createElement('div');row.className='pb-help-heading';heading.before(row);row.append(heading,button);}
    button.setAttribute('aria-controls',content.id);
    const entry={key,host,heading,button,content};entries.set(key,entry);open(entry,false);
    button.addEventListener('click',()=>open(entry,content.hidden));
    const escape=event=>{if(event.key==='Escape'&&!content.hidden){event.preventDefault();event.stopPropagation();open(entry,false);button.focus();}};
    button.addEventListener('keydown',escape);content.addEventListener('keydown',escape);
  }
  function card(key, host, selectors, keepPosition=false, actions=null) {
    if (!host) return;
    register(key,host,one(host,'h2,h3'),selectors.map(selector=>one(host,selector)),keepPosition,actions);
  }
  function refresh() {
    for (const [key,entry] of entries) if (!entry.host.isConnected) entries.delete(key);
    const intake=document.getElementById('panel-intake');
    // The active Add tab already names this view. Retain the original heading
    // for translation and the panel's accessible name, without another title row.
    const intakeTitle=one(intake,':scope > h2[data-ws="add"]');
    if (intakeTitle) {
      intakeTitle.hidden=true;
      if (!intakeTitle.id) intakeTitle.id='pb-intake-heading';
      intake.setAttribute('aria-labelledby',intakeTitle.id);
    }
    card('import-library',one(intake,'.library-setup'),['[data-ws="libraryHelp"]'],true);
    const drop=document.getElementById('drop'),principles=one(intake,'.native-import-reassurance');
    // General import reassurance shares the existing closed import disclosure.
    // The original translated nodes stay intact; progress and storage state do not move.
    if (drop && principles && !drop.contains(principles)) drop.append(principles);
    card('import-drop',drop,['[data-i18n="dropP"]','#fsHint','[data-i18n="dropDnd"]','.native-import-reassurance'],false,one(drop,':scope>.btnrow'));
    card('theme',document.getElementById('pb-theme-settings'),['.pb-theme-help','.pb-theme-description']);
    card('input-language',document.getElementById('pb-input-language-settings'),['[data-input-language-copy="help"]'],true);
    card('image-model',document.getElementById('capEnable')?.closest('.note'),['[data-i18n="capP"]','[data-i18n="capServerP"]']);
    card('attachments',document.getElementById('attToggle')?.closest('.note'),['[data-i18n="attP"]'],true);
    const diagnostics=document.getElementById('diagLog')?.closest('.note');
    card('diagnostics',diagnostics,[':scope > p'],true);
    for(const entry of entries.values())label(entry);
    root.classList.add('pb-help-ready');
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
