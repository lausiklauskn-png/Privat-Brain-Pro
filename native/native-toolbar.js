/* Compact native chrome. Keep the existing controls, translations and event handlers. */
(() => {
  'use strict';
  const make=(tag,cls)=>{const node=document.createElement(tag);node.className=cls;return node;};
  const strings={
    de:['Weitere Ansichten','App-Menü','Schließen'],en:['More views','App menu','Close'],
    ru:['Другие разделы','Меню приложения','Закрыть'],pl:['Więcej widoków','Menu aplikacji','Zamknij']
  };
  const offlineWords={de:['App vom Internet trennen','Internetzugriff wieder erlauben','Netzwerkeinstellung konnte nicht geändert werden.'],en:['Disconnect app from internet','Allow internet access again','Unable to change the network setting.'],ru:['Отключить приложение от интернета','Снова разрешить интернет','Не удалось изменить настройку сети.'],pl:['Odłącz aplikację od internetu','Ponownie zezwól na internet','Nie można zmienić ustawienia sieci.']};
  const offText=i=>(offlineWords[document.documentElement.lang]||offlineWords.de)[i];
  document.querySelector('header .badge-off')?.remove();
  // Lets the WebView show :active (the button grows under the finger) on touch.
  document.addEventListener('touchstart',()=>{},{passive:true});
  const text=i=>(strings[document.documentElement.lang]||strings.de)[i];
  const captions={de:['Suchen','Dateien','Explorer','Mail','Übersicht','Katalog','Doppelte','Einstellungen'],en:['Search','Files','Explorer','Mail','Overview','Catalog','Duplicates','Settings'],ru:['Поиск','Файлы','Проводник','Почта','Обзор','Каталог','Дубликаты','Настройки'],pl:['Szukaj','Pliki','Eksplorator','Poczta','Pulpit','Katalog','Duplikaty','Ustawienia']};
  const pages=['search','intake','explorer','mail','dash','order','dupes','settings'];
  const ICON_ONLY=new Set(['search','settings']);
  const paths={
    search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    intake:'M12 3v12m-4-4 4 4 4-4 M4 14v7h16v-7',
    explorer:'M3 7V4h6l2 3h10v13H3Z',mail:'M3 5h18v14H3Z m0 0 9 7 9-7',
    dash:'M4 20V10m8 10V4m8 16v-7',order:'M4 4h16v16H4Z M8 4v16m3-11h6m-6 5h6',
    dupes:'m5 19 8-8m-3-1 4 4m-5 1 4 4m-9 2 1-5 4 4-5 1 M15 4l5 5m-5 0 5-5',
    settings:'m9 3-.5 2-2 1-2-.5-2 3 1.5 1.5v3L2.5 15l2 3 2-.5 2 1L9 21h4l.5-2.5 2-1 2 .5 2-3-1.5-1.5v-3L19.5 9l-2-3-2 .5-2-1L13 3Z M14.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
    back:'M20 12H4m6-6-6 6 6 6',next:'M4 12h16m-6-6 6 6-6 6',
    refresh:'M20 11a8 8 0 0 0-14.9-3.9M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9M20 20v-4h-4',compose:'M14 5 19 10 M4 20l5-1L21 7l-5-5L4 14Z',
    more:'M4 12h.1m7.9 0h.1m7.9 0h.1',menu:'M4 6h16M4 12h16M4 18h16',reply:'m9 5-7 7 7 7V14c6 0 10 1 13 5-1-8-5-11-13-11Z',
    forward:'m15 5 7 7-7 7V14c-6 0-10 1-13 5 1-8 5-11 13-11Z',
    trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    all:'M5 5h14v14H5Z m3 7 3 3 5-6',view:'M4 3h16v18H4Z m4-13h8m-8 4h8m-8 4h6',
    images:'M3 3h18v18H3Z m1 14 5-6 4 4 3-3 5 5 M8 7h.1',
    up:'M12 21V3m-6 6 6-6 6 6',home:'m3 10 9-7 9 7 M5 9v12h14V9m-10 12v-8h6v8',
    close:'m5 5 14 14M5 19 19 5',share:'M12 16V3m-5 5 5-5 5 5 M4 12v9h16v-9',
    external:'M14 3h7v7m0-7L10 14 M10 3H3v18h18v-7',moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',
    archive:'M3 3h18v5H3Z m2 5v13h14V8m-10 4h6',star:'m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z',
    read:'M3 6h18v14H3Z m0-14 9 7 9-7',save:'M3 3h15l3 3v15H3Z M7 3v6h10V3M7 21v-8h10v8'
  };
  function icon(key){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('compact-icon');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[key]||paths.more);svg.append(path);return svg;
  }
  function decorate(node,key){
    if(!node)return;
    const label=(node.dataset.i18nTitle?node.title:(node.querySelector(':scope>.compact-label')||node).textContent).trim().replace(/\s+/g,' ');
    if(!label)return;
    if(!node.querySelector(':scope>.compact-icon')){
      const content=make('span','compact-label');content.append(...node.childNodes);
      node.append(icon(key),content);node.classList.add('compact-tool');
    }
    node.setAttribute('aria-label',label);node.title=label;
    // Klaus 2026-10-21: magnifier and gear are self-explanatory; their words go, the name stays as tooltip.
    if(node.dataset.tab&&ICON_ONLY.has(node.dataset.tab)){node.querySelector(':scope>.compact-caption')?.remove();node.classList.add('compact-icon-only');}
    else if(node.dataset.tab){
      const value=(captions[document.documentElement.lang]||captions.de)[pages.indexOf(node.dataset.tab)];
      let caption=node.querySelector(':scope>.compact-caption');if(!caption){caption=make('span','compact-caption');caption.setAttribute('aria-hidden','true');node.append(caption);}
      if(caption.textContent!==value)caption.textContent=value;
    }
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
  const row=make('div','native-toolbar-row'),more=make('details','native-more'),moreTitle=make('summary','ghost');
  main.before(row);row.append(main,more);more.append(moreTitle,secondary);
  const tools=document.querySelector('header .tools');
  const options=make('details','native-options'),optionsTitle=make('summary','ghost'),optionsPanel=make('div','native-options-panel');
  for(const node of [...tools.children])if(!node.classList.contains('native-navigation'))optionsPanel.append(node);
  options.append(optionsTitle,optionsPanel);tools.append(options);
  const offlineButton=make('button','ghost native-offline-switch');offlineButton.type='button';
  offlineButton.setAttribute('role','switch');
  const offlineError=make('p','native-network-error');offlineError.setAttribute('role','status');offlineError.hidden=true;
  optionsPanel.append(offlineButton,offlineError);
  function networkLabel(){const label=offText(window.PBNetwork?.offline?1:0);if(offlineButton.textContent!==label)offlineButton.textContent=label;offlineButton.setAttribute('aria-checked',String(Boolean(window.PBNetwork?.offline)));offlineButton.title=offlineButton.textContent;}
  addEventListener('pb:network',networkLabel);
  offlineButton.onclick=async()=>{offlineButton.disabled=true;offlineError.hidden=true;
    try{await window.PBNetwork.setOffline(!window.PBNetwork.offline);}
    catch{offlineError.textContent=offText(2);offlineError.hidden=false;options.open=true;}
    finally{offlineButton.disabled=false;networkLabel();}
  };networkLabel();
  const phone=matchMedia('(max-width:650px)');
  function resize(){more.open=true;options.open=false;}
  phone.addEventListener('change',resize);resize();
  optionsPanel.addEventListener('click',event=>{if(event.target.closest('button'))options.open=false;});
  document.addEventListener('click',event=>{
    if(options.open&&!options.contains(event.target))options.open=false;
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const opened=options.open?options:null;
    if(opened){event.preventDefault();opened.open=false;opened.querySelector('summary').focus();}
  });
  const keys={refresh:'refresh',compose:'compose',import:'intake',reply:'reply',forward:'forward',back:'back',tools:'more',messageTools:'more',
    trash:'trash',delete:'trash',permanent:'trash',selectAll:'all',all:'all',read:'read',star:'star',archive:'archive',save:'save',draft:'save',connect:'mail',account:'mail',saved:'save',disconnect:'close',removeAccount:'trash',local:'mail',remote:'mail',catalog:'order',catalogOne:'order',download:'share',send:'external',cancel:'close'};
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
    if(moreTitle.textContent!==text(0))moreTitle.textContent=text(0);
    if(optionsTitle.textContent!==text(1))optionsTitle.textContent=text(1);
    // Avoid rewriting the label/SVG when no translation has changed.
    decorate(moreTitle,'more');decorate(optionsTitle,'menu');networkLabel();
    document.querySelectorAll('.native-toolbar-row .tab').forEach(button=>decorate(button,button.dataset.tab));
    const navigation=document.querySelectorAll('.native-navigation button');decorate(navigation[0],'back');decorate(navigation[1],'next');
    decorate(document.querySelector('#themeToggle'),'moon');decorate(document.querySelector('#hardReload'),'refresh');
    decorate(document.querySelector('#explorerUp'),'up');decorate(document.querySelector('#explorerHome'),'home');
    document.querySelectorAll('#mailWorkspace .mail-head button,#mailWorkspace .mail-reader-actions button,#mailWorkspace .mail-list-actions button,#mailWorkspace .mail-back,#mailWorkspace .mail-account-tools>summary,#mailWorkspace .mail-message-tools>summary').forEach(button=>{
      // Filenames and folder names stay readable; only fixed toolbar actions become icons.
      const key=button.dataset.liveText||button.dataset.mailText||button.dataset.sharedText||button.dataset.nativeSelection||button.dataset.nativeTool;
      if(key||button.tagName==='SUMMARY')decorate(button,keys[key]||key||'more');
    });
    const pin=document.getElementById('pbPinBtn');
    if(pin){if(pin.parentNode!==optionsPanel)optionsPanel.append(pin);decorate(pin,'view');}
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
  new MutationObserver(()=>{optionsTitle.replaceChildren(document.createTextNode(text(1)));moreTitle.replaceChildren(document.createTextNode(text(0)));enhance();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  enhance();
})();
