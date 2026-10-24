/* One native sorting menu over the existing explorer state and comparator.
   The original select/button remain the state holders for the independent PWA. */
(() => {
  'use strict';
  const workspace=window.PBWorkspace,select=document.getElementById('explorerSort'),legacyOrder=document.getElementById('explorerOrder');
  if(!workspace?.explorerState||!workspace.restoreExplorer||!select||!legacyOrder||document.getElementById('pb-explorer-sort'))return;
  const words={
    de:{sort:'Sortieren',by:'Sortieren nach',direction:'Reihenfolge',name:'Name',date:'Datum',size:'Größe',type:'Typ',nameDirections:['A → Z','Z → A'],dateDirections:['Neueste oben','Älteste oben'],sizeDirections:['Größte oben','Kleinste oben']},
    en:{sort:'Sort',by:'Sort by',direction:'Order',name:'Name',date:'Date',size:'Size',type:'Type',nameDirections:['A → Z','Z → A'],dateDirections:['Newest first','Oldest first'],sizeDirections:['Largest first','Smallest first']},
    ru:{sort:'Сортировка',by:'Сортировать по',direction:'Порядок',name:'Имя',date:'Дата',size:'Размер',type:'Тип',nameDirections:['А → Я','Я → А'],dateDirections:['Сначала новые','Сначала старые'],sizeDirections:['Сначала большие','Сначала маленькие']},
    pl:{sort:'Sortuj',by:'Sortuj według',direction:'Kolejność',name:'Nazwa',date:'Data',size:'Rozmiar',type:'Typ',nameDirections:['A → Z','Z → A'],dateDirections:['Najnowsze u góry','Najstarsze u góry'],sizeDirections:['Największe u góry','Najmniejsze u góry']}
  };
  const copy=()=>words[String(document.documentElement.lang||'de').slice(0,2)]||words.de;
  const make=(tag,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;return node;};
  const menu=make('details','pb-explorer-sort');menu.id='pb-explorer-sort';
  const summary=make('summary'),caption=make('span'),icon=window.PBIcons?.create('sort');
  if(icon)summary.append(icon);summary.append(caption);
  const popup=make('div','pb-explorer-sort-popup');popup.id='pb-explorer-sort-popup';summary.setAttribute('aria-controls',popup.id);
  const criteria=make('fieldset'),criteriaTitle=make('legend'),directions=make('fieldset'),directionTitle=make('legend');
  criteria.append(criteriaTitle);directions.append(directionTitle);popup.append(criteria,directions);menu.append(summary,popup);select.before(menu);
  const buttons=new Map();
  function apply(change){
    select.dataset.chosen='1';
    workspace.restoreExplorer({...workspace.explorerState(),...change});
    sync();menu.open=false;summary.focus({preventScroll:true});
  }
  for(const key of ['name','date','size','type']){
    const button=make('button','ghost');button.type='button';button.dataset.sortKey=key;
    button.addEventListener('click',()=>apply({sort:key,reverse:false}));criteria.append(button);buttons.set(key,button);
  }
  const directionButtons=[false,true].map(reverse=>{
    const button=make('button','ghost');button.type='button';button.dataset.sortReverse=String(reverse);
    button.addEventListener('click',()=>apply({reverse}));directions.append(button);return button;
  });
  function text(node,value){if(node.textContent!==value)node.textContent=value;}
  function attr(node,key,value){if(node.getAttribute(key)!==value)node.setAttribute(key,value);}
  function position(){
    if(!menu.open)return;
    const anchor=menu.getBoundingClientRect(),width=popup.getBoundingClientRect().width,margin=8;
    const left=Math.max(margin,Math.min(anchor.left,document.documentElement.clientWidth-margin-width));
    popup.style.left=left+'px';
    // Leave the page usable even in a short DeX window or with large type.
    const below=Math.max(0,innerHeight-anchor.bottom-margin-4),above=Math.max(0,anchor.top-margin-4);
    const upward=below<180&&above>below;
    popup.style.maxHeight=Math.max(1,upward?above:below)+'px';
    popup.style.top=upward?'auto':(anchor.bottom+4)+'px';popup.style.bottom=upward?(innerHeight-anchor.top+4)+'px':'auto';
  }
  function sync(){
    const state=workspace.explorerState(),w=copy(),key=buttons.has(state.sort)?state.sort:'date';
    const labels=key==='date'?w.dateDirections:key==='size'?w.sizeDirections:w.nameDirections;
    text(caption,w.sort);text(criteriaTitle,w.by);text(directionTitle,w.direction);
    summary.title=w.sort+': '+w[key]+' · '+labels[state.reverse?1:0];
    attr(summary,'aria-label',summary.title);attr(summary,'aria-expanded',String(menu.open));
    for(const [name,button] of buttons){
      text(button,w[name]);attr(button,'aria-pressed',String(name===key));
      if(name===key)attr(button,'aria-current','true');else button.removeAttribute('aria-current');
      // Never offer a comparator that the workspace does not actually support.
      button.disabled=![...select.options].some(option=>option.value===name);
    }
    directionButtons.forEach((button,index)=>{text(button,labels[index]);attr(button,'aria-pressed',String(Boolean(state.reverse)===Boolean(index)));});
    position();
  }
  let queued=false;
  function schedule(){if(!queued){queued=true;queueMicrotask(()=>{queued=false;sync();});}}
  const restore=workspace.restoreExplorer;
  workspace.restoreExplorer=function(...args){const result=restore.apply(this,args);schedule();return result;};
  menu.addEventListener('toggle',sync);
  document.addEventListener('pointerdown',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){event.preventDefault();menu.open=false;summary.focus({preventScroll:true});}});
  select.addEventListener('change',schedule);legacyOrder.addEventListener('click',schedule);
  window.addEventListener('pb-workspace-refresh',schedule);window.addEventListener('resize',position,{passive:true});
  document.addEventListener('scroll',event=>{if(menu.open&&!popup.contains(event.target))position();},true);
  const panel=document.getElementById('panel-explorer');
  new MutationObserver(()=>{if(!panel.classList.contains('on'))menu.open=false;schedule();}).observe(panel,{attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if(typeof ResizeObserver==='function')new ResizeObserver(position).observe(summary);
  sync();
})();
