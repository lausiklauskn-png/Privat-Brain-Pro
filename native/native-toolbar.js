/* Compact native chrome. Keep the existing controls, translations and event handlers. */
(() => {
  'use strict';
  const make=(tag,cls)=>{const node=document.createElement(tag);node.className=cls;return node;};
  const setClass=(node,name,value=true)=>{if(node.classList.contains(name)!==value)node.classList.toggle(name,value);};
  const strings={
    de:['Ansichten','App-Menü','Schließen'],en:['Views','App menu','Close'],
    ru:['Разделы','Меню приложения','Закрыть'],pl:['Widoki','Menu aplikacji','Zamknij']
  };
  const offlineWords={de:['App vom Internet trennen','Internetzugriff wieder erlauben','Netzwerkeinstellung konnte nicht geändert werden.'],en:['Disconnect app from internet','Allow internet access again','Unable to change the network setting.'],ru:['Отключить приложение от интернета','Снова разрешить интернет','Не удалось изменить настройку сети.'],pl:['Odłącz aplikację od internetu','Ponownie zezwól na internet','Nie można zmienić ustawienia sieci.']};
  const offText=i=>(offlineWords[document.documentElement.lang]||offlineWords.de)[i];
  document.querySelector('header .badge-off')?.remove();
  // Lets the WebView show :active (the button grows under the finger) on touch.
  document.addEventListener('touchstart',()=>{},{passive:true});
  const text=i=>(strings[document.documentElement.lang]||strings.de)[i];
  const captions={de:['Finden','Hinzufügen','Dateien','Mail','Übersicht','Kategorien','Doppelte','Einstellungen'],en:['Find','Add','Files','Mail','Overview','Categories','Duplicates','Settings'],ru:['Поиск','Добавить','Файлы','Почта','Обзор','Категории','Дубликаты','Настройки'],pl:['Szukaj','Dodaj','Pliki','Poczta','Pulpit','Kategorie','Duplikaty','Ustawienia']};
  const writingWords={de:'Schreibhilfe',en:'Writing help',ru:'Помощь с текстом',pl:'Pomoc w pisaniu'};
  const pages=['search','intake','explorer','mail','dash','order','dupes','settings'];
  const ICON_ONLY=new Set(['search','settings']);
  const paths={
    search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    intake:'M12 3v12m-4-4 4 4 4-4 M4 14v7h16v-7',
    explorer:'M3 7V4h6l2 3h10v13H3Z',mail:'M3 5h18v14H3Z m0 0 9 7 9-7',
    dash:'M4 20V10m8 10V4m8 16v-7',order:'M4 4h16v16H4Z M8 4v16m3-11h6m-6 5h6',
    dupes:'m5 19 8-8m-3-1 4 4m-5 1 4 4m-9 2 1-5 4 4-5 1 M15 4l5 5m-5 0 5-5',
    settings:'m9 3-.5 2-2 1-2-.5-2 3 1.5 1.5v3L2.5 15l2 3 2-.5 2 1L9 21h4l.5-2.5 2-1 2 .5 2-3-1.5-1.5v-3L19.5 9l-2-3-2 .5-2-1L13 3Z M14.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
    palette:'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.6-3.2l-.3-.4a1.5 1.5 0 0 1 1.2-2.4H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z M7 9h.1M10 6h.1M15 7h.1M17 11h.1',
    back:'M20 12H4m6-6-6 6 6 6',next:'M4 12h16m-6-6 6 6-6 6',
    refresh:'M20 11a8 8 0 0 0-14.9-3.9M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9M20 20v-4h-4',compose:'M14 5 19 10 M4 20l5-1L21 7l-5-5L4 14Z',
    more:'M4 12h.1m7.9 0h.1m7.9 0h.1',menu:'M4 6h16M4 12h16M4 18h16',reply:'m9 5-7 7 7 7V14c6 0 10 1 13 5-1-8-5-11-13-11Z',
    forward:'m15 5 7 7-7 7V14c-6 0-10 1-13 5 1-8 5-11 13-11Z',
    trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    all:'M5 5h14v14H5Z m3 7 3 3 5-6',view:'M4 3h16v18H4Z m4-13h8m-8 4h8m-8 4h6',
    images:'M3 3h18v18H3Z m1 14 5-6 4 4 3-3 5 5 M8 7h.1',
    up:'M12 21V3m-6 6 6-6 6 6',home:'m3 10 9-7 9 7 M5 9v12h14V9m-10 12v-8h6v8',
    close:'m5 5 14 14M5 19 19 5',share:'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M8.6 10.5l6.8-4 M8.6 13.5l6.8 4',
    external:'M14 3h7v7m0-7L10 14 M10 3H3v18h18v-7',moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',
    archive:'M3 3h18v5H3Z m2 5v13h14V8m-10 4h6',star:'m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z',
    read:'M3 6h18v14H3Z m0-14 9 7 9-7',save:'M3 3h15l3 3v15H3Z M7 3v6h10V3M7 21v-8h10v8',
    check:'M20 12v8H4V4h11 M8 11l4 4L21 5',
    send:'M3 5h16v11H3Z M3 5l8 6 8-6 M13 20h9m-3-3 3 3-3 3',
    attach:'m8 12 7-7a4 4 0 0 1 6 6L11 21a6 6 0 0 1-8-8L13 3m-7 12 9-9a1.5 1.5 0 0 1 2 2l-9 9',
    download:'M12 3v12m-4-4 4 4 4-4 M4 18v3h16v-3',
    inbox:'M4 4h16v16H4Z M4 14h5l1 3h4l1-3h5',
    warning:'M12 3 2 21h20Z M12 9v5m0 3h.1',
    accounts:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M13 4a4 4 0 0 1 0 8m5 3a4 4 0 0 1 4 4v2 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    writing:'M4 5h16M4 10h12M4 15h8 M16 15l5 5m-5 0 5-5',
    undo:'M4 4v6h6 M4 10a8 8 0 1 1 1 9',
    folder:'M3 7V4h6l2 3h10v13H3Z',
    file:'M14 3H5v18h14V8Z M14 3v5h5',
    note:'M14 3H5v18h14V8Z M14 3v5h5 M8 12h8m-8 4h6',
    person:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    shield:'M12 3 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z M8 12l3 3 5-6',
    sort:'M7 3v18m-3-3 3 3 3-3 M17 21V3m-3 3 3-3 3 3',
    panel:'M3 4h18v16H3Z M9 4v16',collapse:'M4 4h16v16H4Z M8 12h8',
    chevronRight:'m9 5 7 7-7 7',chevronDown:'m5 9 7 7 7-7',
    partial:'M12 3a9 9 0 1 0 0 18V3Z M12 3a9 9 0 0 1 0 18',
    unavailable:'M4 20 20 4 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    pending:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
    lock:'M5 10h14v11H5Z M8 10V7a4 4 0 0 1 8 0v3',
    unlock:'M5 10h14v11H5Z M8 10V7a4 4 0 0 1 8 0',
    link:'m9 15 6-6 M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
    clean:'m15 3 6 6-9 9-6-6Z M6 12l-4 8h12l-2-2 M5 20l2-5m3 5 1-3',
    device:'M3 4h18v13H3Z M8 21h8m-4-4v4',
    table:'M3 3h18v18H3Z M3 9h18M9 3v18m-6-6h18',
    chart:'M4 3v17h17 M7 15l4-5 4 2 5-7',
    presentation:'M3 3h18v13H3Z M12 16v6m-5 0 5-6 5 6',
    code:'m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16',
    package:'m3 7 9-5 9 5v10l-9 5-9-5Z M3 7l9 5 9-5m-9 5v10M7 4l10 6',
    chat:'M3 4h18v13H9l-6 4Z M7 8h10m-10 4h7',
    hand:'M7 13V7a2 2 0 0 1 4 0v5 M11 12V4a2 2 0 0 1 4 0v8 M15 12V6a2 2 0 0 1 4 0v7 M7 10 5 9a2 2 0 0 0-3 2l4 8c1 2 3 3 6 3 5 0 9-3 9-8v-3a2 2 0 0 0-4 0',
    info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 11v6m0-10h.1',
    shuffle:'M3 5h3l12 14h3m-4-4 4 4-4 4 M3 19h3l4-5m4-4 4-5h3m-4-4 4 4-4 4',
    lab:'M8 3h8m-7 0v6L3 20v1h18v-1L15 9V3 M6 15h12',
    brain:'M12 4v16 M8 4a4 4 0 0 0-6 4 4 4 0 0 0 0 7 4 4 0 0 0 6 5m8-16a4 4 0 0 1 6 4 4 4 0 0 1 0 7 4 4 0 0 1-6 5 M5 9l3 2m-3 5 3-2m11-5-3 2m3 5-3-2',
    key:'M14 7a5 5 0 1 1-3 4l-8 8v3h4v-3h3v-3l4-4 M17 7h.1',
    network:'M8 3h8v6H8Z M2 16h6v6H2Zm14 0h6v6h-6Z M12 9v4H5v3m7-3h7v3'
  };
  function icon(key){
    if(!Object.hasOwn(paths,key))return null;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('compact-icon');svg.dataset.iconKey=key;svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[key]);svg.append(path);return svg;
  }
  // App-owned callers share this offline source. An unknown action keeps its name;
  // it must never acquire an unrelated three-dot symbol.
  window.PBIcons=Object.freeze({create:icon,has:key=>Object.hasOwn(paths,key)});
  const cleanLabel=value=>value.trim().replace(/^(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\uFE0E\u200D]|[↗←→↑↓↕✓☑☐])+\s*/u,'').trim();
  function sourceLabel(node){return(node.dataset.i18nTitle?node.title:(node.querySelector(':scope>.compact-label')||node).textContent).trim().replace(/\s+/g,' ');}
  function setControlText(node,label){
    const content=node.querySelector(':scope>.compact-label')||node;
    if(content.textContent!==label)content.textContent=label;
  }
  function decorate(node,key,suppliedLabel){
    if(!node)return;
    const raw=sourceLabel(node),known=Object.hasOwn(paths,key),page=pages.indexOf(node.dataset.tab);
    const label=suppliedLabel||(page>=0?(captions[document.documentElement.lang]||captions.de)[page]:node.dataset.mailAi==='open'?(writingWords[document.documentElement.lang]||writingWords.de):cleanLabel(raw)||raw);
    if(!label)return;
    if(!node.querySelector(':scope>.compact-label')){
      const content=make('span','compact-label');content.append(...node.childNodes);
      node.append(content);
    }
    let glyph=node.querySelector(':scope>.compact-icon');
    if(known&&glyph?.dataset.iconKey!==key){const next=icon(key);if(glyph)glyph.replaceWith(next);else node.prepend(next);}
    else if(!known)glyph?.remove();
    setClass(node,'compact-tool');setClass(node,'compact-text-only',!known);
    node.setAttribute('aria-label',label);node.title=label;
    // Klaus 2026-10-21: magnifier and gear are self-explanatory; their words go, the name stays as tooltip.
    if(node.dataset.tab&&ICON_ONLY.has(node.dataset.tab)&&!node.closest('.native-menu-views')){node.querySelector(':scope>.compact-caption')?.remove();setClass(node,'compact-icon-only');}
    else if(node.dataset.tab||node.hasAttribute('data-mail-caption')||node.dataset.iconCaption==='true'||!known||node.tagName==='SUMMARY'&&key==='more'||node.dataset.mailAi==='open'||['spam','notspam','restore'].includes(node.dataset.nativeSelection)||node.dataset.liveText==='notSpam'){
      setClass(node,'compact-icon-only',false);
      let caption=node.querySelector(':scope>.compact-caption');if(!caption){caption=make('span','compact-caption');caption.setAttribute('aria-hidden','true');node.append(caption);}
      if(caption.textContent!==label)caption.textContent=label;
      if(!node.dataset.tab)setClass(node,'compact-tool-has-caption');
    }
  }
  const folderIcons={inbox:'inbox',draft:'compose',outbox:'send',sent:'read',archive:'archive',spam:'warning',trash:'trash',exported:'external'};
  function folderIcon(button){
    if(button.dataset.mailAll)return'accounts';
    const key=button.dataset.mailFolder||'';
    return folderIcons[key]||'folder';
  }
  function decorateInline(node,key,cls,stripLabel=true){
    if(!node)return;
    const previous=node.querySelector(':scope>.'+cls);
    if(previous?.dataset.iconKey===key)return;
    const glyph=icon(key);if(!glyph)return;glyph.classList.add(cls);
    // Preserve textContent exactly: the check/status modules use it to decide
    // whether to repaint. Only the known app-owned decoration becomes hidden;
    // names following that first decoration are never parsed or stripped.
    if(stripLabel&&!node.querySelector(':scope>.pb-icon-fallback')){
      const first=[...node.childNodes].find(part=>part.nodeType===Node.TEXT_NODE&&part.nodeValue.trim());
      const value=first?.nodeValue||'',prefix=prefixes.find(candidate=>value.trimStart().startsWith(candidate));
      if(prefix){const length=value.length-value.trimStart().length+prefix.length,fallback=make('span','pb-icon-fallback');fallback.hidden=true;fallback.setAttribute('aria-hidden','true');fallback.textContent=value.slice(0,length);first.before(fallback);first.nodeValue=value.slice(length);}
    }
    if(previous)previous.replaceWith(glyph);else node.prepend(glyph);
  }
  function decorateSlot(slot){
    const key=slot.dataset.pbIcon,previous=slot.querySelector(':scope>.compact-icon');
    if(previous?.dataset.iconKey===key)return;
    const glyph=icon(key);if(!glyph)return;
    if(slot.parentElement?.classList.contains('mail-folder'))glyph.classList.add('native-folder-icon');
    if(!slot.querySelector(':scope>.pb-icon-fallback')){const fallback=make('span','pb-icon-fallback');fallback.hidden=true;fallback.setAttribute('aria-hidden','true');fallback.append(...slot.childNodes);slot.append(fallback);}
    if(previous)previous.replaceWith(glyph);else slot.append(glyph);
    setClass(slot,'pb-content-icon');
  }
  const prefixKeys=new Map([['📁','folder'],['📂','folder'],['✉','mail'],['✉️','mail'],['📧','mail'],['📄','file'],['📜','file'],['🧾','file'],['🖼','images'],['🖼️','images'],['📝','note'],['📎','attach'],['👤','person'],['👥','accounts'],['🛡','shield'],['🛡️','shield'],['📥','inbox'],['📤','send'],['📋','view'],['📰','mail'],['🧹','clean'],['🤖','writing'],['📭','mail'],['🔎','search'],['🔍','search'],['🔒','lock'],['🔓','unlock'],['🗄','archive'],['🗄️','archive'],['🗑','trash'],['🗑️','trash'],['⚠','warning'],['⚠️','warning'],['✓','check'],['⊘','unavailable'],['◐','partial'],['○','pending'],['↗','external'],['↕','sort'],['↑','up'],['↓','download'],['✏','compose'],['✏️','compose'],['✎','compose'],['🔗','link'],['🌐','external'],['⚡','send']]);
  for(const [prefix,key] of [['📊','table'],['📈','chart'],['📽️','presentation'],['📽','presentation'],['💻','code'],['📦','package'],['💬','chat'],['✋','hand'],['🗂️','folder'],['🗂','folder'],['💡','info']])prefixKeys.set(prefix,key);
  prefixKeys.set('★','star');
  for(const[prefix,key]of [['🔀','shuffle'],['🔬','lab'],['🧠','search'],['🔑','key'],['🖧','network'],['⬇','download'],['⬇️','download'],['⚙','settings'],['⚙️','settings'],['❓','info'],['🔐','lock'],['🔏','network']])prefixKeys.set(prefix,key);
  const prefixes=[...prefixKeys.keys()].sort((a,b)=>b.length-a.length);
  function decorateKnownPrefix(node,preferred){
    if(!node||node.querySelector(':scope>.compact-icon'))return;
    const first=[...node.childNodes].find(part=>part.nodeType===Node.TEXT_NODE&&part.nodeValue.trim());
    if(!first)return;
    // Longest first handles optional variation selectors without hiding a
    // second emoji that belongs to a user-supplied filename or folder name.
    const found=prefixes.find(prefix=>first.nodeValue.trimStart().startsWith(prefix));
    if(found)decorateInline(node,preferred||prefixKeys.get(found),'native-content-icon');
  }
  function decorateHeading(node,key){
    if(!node)return;
    // A heading has one dedicated glyph. Generic translated-label decoration
    // must not add another one before or after a helper wraps the heading.
    node.querySelectorAll(':scope>.native-content-icon').forEach(glyph=>glyph.remove());
    [...node.querySelectorAll(':scope>.native-heading-icon')].slice(1).forEach(glyph=>glyph.remove());
    decorateInline(node,key,'native-heading-icon');
  }
  // WebView does not reliably display the browser's title popup. Render our own,
  // shared by pointer hover and keyboard focus, outside clipped/scrolling panes.
  const tip=make('div','native-tooltip');tip.id='native-control-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
  let tipTarget=null;
  function hideTip(){if(tipTarget){const ids=(tipTarget.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==tip.id);if(ids.length)tipTarget.setAttribute('aria-describedby',ids.join(' '));else tipTarget.removeAttribute('aria-describedby');}tipTarget=null;tip.hidden=true;}
  function showTip(node){
    if(!node||node.disabled)return hideTip();
    hideTip();tipTarget=node;tip.textContent=node.getAttribute('aria-label')||node.title;tip.hidden=false;
    node.setAttribute('aria-describedby',[(node.getAttribute('aria-describedby')||''),tip.id].filter(Boolean).join(' '));
    const r=node.getBoundingClientRect(),t=tip.getBoundingClientRect();
    tip.style.left=Math.max(6,Math.min(innerWidth-t.width-6,r.left+(r.width-t.width)/2))+'px';
    tip.style.top=Math.max(6,r.bottom+t.height+8<innerHeight?r.bottom+6:r.top-t.height-6)+'px';
  }
  document.addEventListener('pointerover',e=>{if(e.pointerType!=='touch')showTip(e.target.closest('.compact-tool'));});
  document.addEventListener('pointermove',e=>{const node=e.target.closest('.compact-tool');if(e.pointerType!=='touch'&&node&&(node!==tipTarget||tip.textContent!==node.getAttribute('aria-label')))showTip(node);});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget||!tipTarget?.contains(e.relatedTarget))hideTip();});
  document.addEventListener('focusin',e=>showTip(e.target.closest('.compact-tool')));
  document.addEventListener('focusout',hideTip);
  document.addEventListener('pointerdown',hideTip);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});
  addEventListener('resize',hideTip);document.addEventListener('scroll',hideTip,true);
  const main=document.querySelector('.main-pages'), secondary=document.querySelector('.workspace-tools');
  if(!main||!secondary)return;
  // Keep the original buttons and their existing navigation handlers.
  for(const page of ['dash','order','dupes']){const button=secondary.querySelector('[data-tab="'+page+'"]');if(button)main.append(button);}
  let primaryPage='';
  const row=document.querySelector('.native-toolbar-row')||make('div','native-toolbar-row');
  const quick=row.querySelector(':scope>.native-toolbar-quick')||make('div','native-toolbar-quick');
  if(!row.isConnected){main.before(row);row.append(main,quick);}
  const settings=secondary.querySelector('[data-tab="settings"]');if(settings)quick.append(settings);
  const tools=document.querySelector('header .tools');
  const options=tools.querySelector(':scope>.native-options')||make('details','native-options');
  const optionsTitle=options.querySelector(':scope>summary')||make('summary','ghost');
  const optionsPanel=options.querySelector(':scope>.native-options-panel')||make('div','native-options-panel');
  for(const node of [...tools.children])if(!node.matches('.native-navigation,.native-net-lamp,.native-options'))optionsPanel.append(node);
  const views=optionsPanel.querySelector('.native-menu-views')||make('section','native-menu-views');
  const viewsTitle=views.querySelector(':scope>.native-menu-heading')||make('p','native-menu-heading');
  views.hidden=true;
  if(!views.isConnected){views.append(viewsTitle,secondary);optionsPanel.prepend(views);}
  if(!options.isConnected){options.append(optionsTitle,optionsPanel);tools.append(options);}
  const offlineButton=optionsPanel.querySelector('.native-offline-switch')||make('button','ghost native-offline-switch');offlineButton.type='button';
  offlineButton.setAttribute('role','switch');
  const offlineError=optionsPanel.querySelector('.native-network-error')||make('p','native-network-error');offlineError.setAttribute('role','status');offlineError.hidden=true;
  // Leitfaden § 1.8 (Klaus 2026-10-29, Pro-Umbau 12): Schriftgröße „A··A“, gemeinsamer Baustein. Im ☰-Menü statt in der Kopfleiste:
  // am Handy (360 px) bliebe zwischen Titel und ← → ☰ kein Platz für das Siegel (gemessen 6 px).
  if(window.ProBedienung?.schriftKnopf&&!optionsPanel.querySelector('.pro-schrift')){const schrift=window.ProBedienung.schriftKnopf();schrift.classList.add('native-menu-schrift');optionsPanel.append(schrift);}
  if(!offlineButton.isConnected)optionsPanel.append(offlineButton);
  if(!offlineError.isConnected)optionsPanel.append(offlineError);
  // Klaus 2026-10-21: a small lamp up in the bar, green = internet allowed, red = app cut off.
  // Tap toggles; the tooltip says what a tap will do. The menu entry stays.
  const lamp=tools.querySelector(':scope>.native-net-lamp')||make('button','native-net-lamp compact-tool');lamp.type='button';lamp.setAttribute('role','switch');
  if(!lamp.isConnected){const dot=make('span','native-net-dot');dot.setAttribute('aria-hidden','true');lamp.append(dot);
    const nav=tools.querySelector('.native-navigation');if(nav)nav.before(lamp);else options.before(lamp);}
  function networkLabel(){
    const off=Boolean(window.PBNetwork?.offline),label=offText(off?1:0);
    if(offlineButton.textContent!==label)offlineButton.textContent=label;
    offlineButton.setAttribute('aria-checked',String(off));offlineButton.title=label;
    if(lamp.getAttribute('aria-label')!==label){lamp.setAttribute('aria-label',label);lamp.title=label;}
    lamp.setAttribute('aria-checked',String(off));lamp.dataset.state=off?'off':'on';
  }
  addEventListener('pb:network',networkLabel);
  async function toggleNetwork(button){button.disabled=true;offlineError.hidden=true;
    try{await window.PBNetwork.setOffline(!window.PBNetwork.offline);}
    catch{offlineError.textContent=offText(2);offlineError.hidden=false;options.open=true;}
    finally{button.disabled=false;networkLabel();}
  }
  lamp.onclick=()=>toggleNetwork(lamp);
  offlineButton.onclick=()=>toggleNetwork(offlineButton);networkLabel();
  addEventListener('resize',()=>{options.open=false;primaryPage='';enhance();});
  optionsPanel.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.closest('.pro-schrift'))return;
    const page=button.matches('.tab[data-tab]')?button.dataset.tab:null;
    options.open=false;
    if(!page)return;
    // The selected menu item is now hidden. Move keyboard focus into the view
    // after the existing navigation handlers have completed, without changing
    // their history or unsaved-draft decisions.
    requestAnimationFrame(()=>{
      const panel=document.getElementById('panel-'+page);
      const visible=node=>{
        if(!node||node.closest('[hidden],[inert]'))return false;
        const style=getComputedStyle(node),rect=node.getBoundingClientRect();
        return node.getClientRects().length&&rect.width>1&&rect.height>1&&style.display!=='none'&&style.visibility==='visible'&&Number(style.opacity)!==0;
      };
      if(!panel?.classList.contains('on')||!visible(panel)){optionsTitle.focus();return;}
      const target=[...panel.querySelectorAll('input:not([type="hidden"]),textarea,select,button,a[href],summary,[tabindex]')].find(node=>!node.matches(':disabled')&&node.tabIndex>=0&&visible(node))
        ||[...panel.querySelectorAll('h1,h2,h3')].find(visible)||panel;
      if(!target.hasAttribute('tabindex')&&!target.matches('input,textarea,select,button,a[href],summary')){
        target.tabIndex=-1;target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});
      }
      target.focus();
    });
  });
  document.addEventListener('click',event=>{
    if(options.open&&!options.contains(event.target))options.open=false;
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const opened=options.open?options:null;
    if(opened){event.preventDefault();opened.open=false;opened.querySelector('summary').focus();}
  });
  const keys={refresh:'refresh',compose:'compose',bookledger:'share',import:'intake',reply:'reply',forward:'forward',back:'back',tools:'more',messageTools:'more',
    trash:'trash',delete:'trash',permanent:'trash',selectAll:'all',all:'all',read:'read',star:'star',archive:'archive',save:'save',draft:'save',connect:'mail',account:'mail',saved:'save',disconnect:'close',removeAccount:'trash',local:'mail',remote:'mail',catalog:'order',catalogOne:'order',download:'download',send:'send',cancel:'close',check:'check',attach:'attach',attachments:'attach',folder:'folder',newFolder:'folder',restore:'undo',undo:'undo',edit:'compose',queue:'send',export:'external',copy:'share',notSpam:'read',notspam:'read',spam:'warning'};
  for(const [id,page] of [['kpiFiles','explorer'],['kpiCats','order'],['kpiDupes','dupes']]){
    const tile=document.getElementById(id)?.closest('.tile');if(!tile)continue;
    const button=make('button',tile.className+' native-dashboard-link');button.type='button';button.append(...tile.childNodes);tile.replaceWith(button);
    button.onclick=()=>{if(page==='explorer')window.PBWorkspace.restoreExplorer({path:'',filter:'',sort:'name'});window.PBWorkspace.navigate(page);document.querySelector('#panel-'+page+' button,#panel-'+page+' input')?.focus();};
  }
  const pillars=document.querySelector('#panel-intake .pillars');
  if(pillars){const hint=make('p','native-import-reassurance');for(const node of [...pillars.children]){if(hint.childNodes.length)hint.append(document.createTextNode(' · '));hint.append(...node.childNodes);}document.getElementById('drop').after(hint);pillars.remove();}
  let queued=false;
  function enhance(){
    queued=false;
    if(viewsTitle.textContent!==text(0))viewsTitle.textContent=text(0);
    setControlText(optionsTitle,text(1));
    // Avoid rewriting the label/SVG when no translation has changed.
    decorate(optionsTitle,'menu');networkLabel();
    document.querySelectorAll('.native-toolbar-row .tab,.native-menu-views .tab').forEach(button=>decorate(button,button.dataset.tab));
    const activePrimary=main.querySelector('.tab.on');
    if(!activePrimary)primaryPage='';
    if(activePrimary&&activePrimary.dataset.tab!==primaryPage){
      primaryPage=activePrimary.dataset.tab;
      const control=activePrimary.getBoundingClientRect(),viewport=main.getBoundingClientRect();
      if(control.left<viewport.left||control.right>viewport.right)activePrimary.scrollIntoView({block:'nearest',inline:'nearest'});
    }
    const navigation=document.querySelectorAll('.native-navigation button');decorate(navigation[0],'back');decorate(navigation[1],'next');
    // The file viewer is outside .wrap. Keep its existing handoff buttons and
    // translated labels; only Share becomes a familiar icon without a caption.
    for(const button of document.querySelectorAll('.native-file-head>[data-native-action=share]')){
      decorate(button,'share');setClass(button,'native-file-share');setClass(button,'compact-icon-only');
      setClass(button,'compact-tool-has-caption',false);button.querySelector(':scope>.compact-caption')?.remove();
    }
    for(const button of document.querySelectorAll('.native-file-head>[data-native-action=open]'))decorateInline(button,'external','native-content-icon',false);
    for(const title of document.querySelectorAll('.native-file-head>.native-file-title'))if(title.title!==title.textContent)title.title=title.textContent;
    decorate(document.querySelector('#themeToggle'),'moon');decorate(document.querySelector('#hardReload'),'refresh');
    decorate(document.querySelector('#explorerUp'),'up');decorate(document.querySelector('#explorerHome'),'home');
    document.querySelectorAll('#mailWorkspace .mail-head button,#mailWorkspace .mail-compose-actions button,#mailWorkspace .mail-reader-actions button,#mailWorkspace .mail-list-actions button,#mailWorkspace .mail-back,#mailWorkspace .mail-account-tools>summary,#mailWorkspace .mail-message-tools>summary,#mailWorkspace [data-mail-ai="open"]').forEach(button=>{
      // Filenames and folder names stay readable; only fixed toolbar actions become icons.
      const key=button.dataset.liveText||button.dataset.mailText||button.dataset.sharedText||button.dataset.nativeSelection||button.dataset.nativeTool||(button.dataset.mailAi==='open'?'writing':'');
      if(key||button.tagName==='SUMMARY')decorate(button,keys[key]||key||'more');
    });
    const reorgHeading=document.querySelector('#reorgNote h3');if(reorgHeading)decorateInline(reorgHeading,'shuffle','native-heading-icon');
    document.querySelectorAll('[data-pb-icon]').forEach(decorateSlot);
    document.querySelectorAll('#mailWorkspace .mail-folder').forEach(button=>{
      const label=button.querySelector(':scope>.native-mail-all-label');
      if(label)decorateInline(label,folderIcon(button),'native-folder-icon');
      else if(!button.querySelector(':scope>[data-pb-icon]'))decorateInline(button,folderIcon(button),'native-folder-icon',Boolean(button.dataset.mailAll)||Object.hasOwn(folderIcons,button.dataset.mailFolder));
    });
    // The icon and the subject share one line. Initials remain in a hidden
    // fallback solely to preserve renderer equality checks and PWA behavior.
    document.querySelectorAll('#mailWorkspace .mail-avatar').forEach(slot=>{
      const key=slot.parentElement?.hasAttribute('data-mail-sender')?'person':'mail';
      if(slot.dataset.pbIcon!==key){slot.dataset.pbIcon=key;slot.setAttribute('aria-hidden','true');}
      decorateSlot(slot);
    });
    document.querySelectorAll('[data-pb-generated-prefix]').forEach(node=>decorateKnownPrefix(node,node.dataset.pbGeneratedPrefix));
    decorateInline(document.getElementById('explorerOrder'),'sort','native-content-icon');
    for(const node of document.querySelectorAll('#explorerTreeToggle,.explorer-collapse,.explorer-twisty,.explorer-dir-open')){
      const key=node.id==='explorerTreeToggle'?'panel':node.classList.contains('explorer-collapse')?'collapse':node.classList.contains('explorer-twisty')?(node.getAttribute('aria-expanded')==='true'?'chevronDown':'chevronRight'):'chevronRight';
      decorate(node,key,node.getAttribute('aria-label')||node.title);
    }
    for(const node of document.querySelectorAll('#explorerTree button.explorer-folder')){
      const previous=node.querySelector(':scope>.native-folder-warning');
      if(node.hasAttribute('data-found')){if(!previous){const glyph=icon('warning');glyph.classList.add('native-folder-warning');node.append(glyph);}}
      else previous?.remove();
    }
    const fixedControls={pickFiles:'file',pickMail:'mail',pickDir:'folder',chooseLibrary:'folder',pauseLibrary:document.getElementById('pauseLibrary')?.getAttribute('aria-pressed')==='false'?'check':'close'};
    for(const [id,key] of Object.entries(fixedControls))decorateInline(document.getElementById(id),key,'native-content-icon');
    decorateHeading(document.querySelector('#panel-explorer>h2'),'folder');
    decorateHeading(document.querySelector('#panel-intake>h2,#panel-intake>.pb-help-heading>h2'),'intake');
    document.querySelectorAll('#results .fname,#results .origin,#results .relhead,#results .cardbtns button,#results .empty .big,#groups .ic,#searchInfo>b,.native-import-reassurance>.ic').forEach(node=>decorateKnownPrefix(node));
    document.querySelectorAll('[data-i18n],[data-ws],#panel-settings h3,#pb-semantic>[data-s=title],.pb-studio-probe h3,#panel-order>h3,#pb-mail-all>.mail-head>.mail-primary').forEach(node=>decorateKnownPrefix(node));
    document.querySelectorAll('#panel-dupes .fname,#panel-order .fname,.pb-check-all-button,.pb-check-badge,.pb-record-availability,.pb-check-find,.pb-check-summary,.pb-check-entrance-list li[data-check]>span,.pb-check-entrance .delBtn,.pb-schutz-mail>summary,.native-original-reconnect button,.native-vault-row>div>strong,.native-vault-attachment>span,.native-vault-head>span,.native-vault-clear,.native-vault-where button,#vault-lock,#vault-unlock,#schutz-key-abuse,#schutz-key-vt,#schutz-get-abuse,#schutz-get-vt,#pb-ai-key-links [data-key-page],#mycelPlace [data-mycel-open],#mycelPlace [data-mycel-seal],#pb-license .pb-license-tools>li>b,#diagCopy,#diagClear,#btnPersist,#btnExport,#btnFullExport,#btnClear,#btnImport,#vaultLine>span,#mailWorkspace [data-mail-all=list],#mailWorkspace [data-mail-all=senders],#mailWorkspace [data-mail-all=clean],#mailWorkspace [data-mail-all=order],#mailWorkspace [data-mail-mark],#mailWorkspace [data-mail-clean],#mailWorkspace .mail-undo>span').forEach(node=>decorateKnownPrefix(node));
    // This is a fixed app heading, not a user title. Preserve both original
    // decorative glyphs for translation while painting one neutral line icon.
    const mycelTitle=document.querySelector('#mycelPlace h3');
    if(mycelTitle){
      decorateKnownPrefix(mycelTitle,'network');
      const textNode=[...mycelTitle.childNodes].find(part=>part.nodeType===Node.TEXT_NODE&&part.nodeValue.includes('🌐'));
      if(textNode){const at=textNode.nodeValue.indexOf('🌐'),glyph=textNode.splitText(at);glyph.splitText('🌐'.length);const fallback=make('span','pb-icon-fallback');fallback.hidden=true;fallback.setAttribute('aria-hidden','true');glyph.before(fallback);fallback.append(glyph);}
    }
    // Siegel (Modul 17) and Mycel (Modul 23-UI) float and snap to the header themselves (native-mycel.js).
    // One shared account/action row instead of a separate account row above the mailbox.
    const account=document.querySelector('.mail-account-bar'),head=document.querySelector('.live-mail>.mail-head');
    if(account&&head&&account.parentNode!==head)head.insertBefore(account,head.firstChild);
    for(const reader of document.querySelectorAll('#mailWorkspace .mail-reader')){
      const actions=reader.querySelector(':scope>.mail-reader-actions'),view=reader.querySelector('.mail-original>.mail-reader-actions');
      if(actions&&view&&view.children.length)actions.append(...view.children);
      const back=reader.querySelector(':scope>.mail-back');
      if(actions&&back&&reader.querySelector('.mail-original')){actions.prepend(back);reader.prepend(actions);}
    }
  }
  const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(enhance);}});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  new MutationObserver(()=>{optionsTitle.replaceChildren(document.createTextNode(text(1)));enhance();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  enhance();
  // A font-size change can resize tabs without firing window.resize. Reveal
  // the active destination only on real size changes, never on manual scroll.
  if(typeof ResizeObserver==='function'){
    let sizeFrame=0;
    const primarySize=new ResizeObserver(()=>{if(!sizeFrame)sizeFrame=requestAnimationFrame(()=>{sizeFrame=0;primaryPage='';enhance();});});
    primarySize.observe(main);for(const button of main.querySelectorAll('.tab'))primarySize.observe(button);
  }
})();
