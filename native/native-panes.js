/* Native working panes: resize existing nodes without rebuilding their contents. */
(() => {
  'use strict';
  const KEY = 'pb_panes_v1', DEFAULTS = Object.freeze({explorer:230,folders:180,list:300});
  const words = {
    de:{explorer:'Ordnerbereich verbreitern oder verkleinern',folders:'Mailordner verbreitern oder verkleinern',list:'Mailliste verbreitern oder verkleinern',hint:'Ziehen oder Pfeiltasten; Doppelklick setzt die Breite zurück',unsaved:'Diese Breite konnte nicht dauerhaft gespeichert werden'},
    en:{explorer:'Resize the folder pane',folders:'Resize mail folders',list:'Resize the message list',hint:'Drag or use arrow keys; double-click resets the width',unsaved:'This width could not be saved permanently'},
    ru:{explorer:'Изменить ширину папок',folders:'Изменить ширину почтовых папок',list:'Изменить ширину списка писем',hint:'Перетащите или используйте стрелки; двойной щелчок сбрасывает ширину',unsaved:'Не удалось сохранить ширину'},
    pl:{explorer:'Zmień szerokość folderów',folders:'Zmień szerokość folderów poczty',list:'Zmień szerokość listy wiadomości',hint:'Przeciągnij lub użyj strzałek; podwójne kliknięcie przywraca szerokość',unsaved:'Nie udało się zapisać szerokości'}
  };
  const t = key => (words[document.documentElement.lang] || words.de)[key];
  const clamp = (value,min,max) => Math.min(Math.max(value,min),max);
  function read() {
    let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
    return Object.fromEntries(Object.entries(DEFAULTS).map(([key,value])=>[key,Number.isFinite(saved?.[key])&&saved[key]>=0?saved[key]:value]));
  }
  let preferred=read(), pending=false, drag=null, nextId=0;
  const groups=new Map();
  function save() {
    let saved=true;try{localStorage.setItem(KEY,JSON.stringify(preferred));}catch{saved=false;}
    for(const group of groups.values())for(const grip of group.grips)grip.dataset.saved=String(saved);
    return saved;
  }
  function schedule() {if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;refresh();});}}
  function wide(group) {
    return !matchMedia('(orientation:portrait)').matches && innerWidth>(group.kind==='explorer'?650:900)
      && group.layout.getBoundingClientRect().width>0
      && (group.kind!=='explorer'||!group.layout.closest('.explorer-tree-hidden'))
      && group.panes.every(pane=>getComputedStyle(pane).display!=='none');
  }
  function sizes(group) {
    const width=group.layout.clientWidth;
    if(group.kind==='explorer'){
      const max=Math.max(160,Math.min(900,width-12-280));
      return {explorer:{min:160,max,value:clamp(preferred.explorer,160,max)}};
    }
    const folderMax=Math.max(130,width-220-280),folders=clamp(preferred.folders,130,folderMax);
    const listMax=Math.max(220,width-folders-280),list=clamp(preferred.list,220,listMax);
    return {folders:{min:130,max:folderMax,value:folders},list:{min:220,max:listMax,value:list}};
  }
  function finishDrag(cancel=false) {
    const current=drag;if(!current)return;drag=null;
    if(cancel)preferred=current.previous;else save();
    current.shield.remove();document.body.classList.remove('pb-panes-dragging');
    try{current.grip.releasePointerCapture(current.pointer);}catch{}
    refresh();
  }
  function apply(group) {
    const active=wide(group);
    if(!active&&drag?.group===group){finishDrag(true);return;}
    if(group.layout.classList.contains('pb-panes-active')!==active)group.layout.classList.toggle('pb-panes-active',active);
    for(const grip of group.grips)if(grip.hidden===active)grip.hidden=!active;
    if(!active)return;
    const bounds=sizes(group);group.bounds=bounds;
    for(const [key,bound] of Object.entries(bounds)){
      const value=Math.round(bound.value),property='--pb-pane-'+key;
      if(group.layout.style.getPropertyValue(property)!==value+'px')group.layout.style.setProperty(property,value+'px');
    }
    const box=group.layout.getBoundingClientRect(),rtl=getComputedStyle(group.layout).direction==='rtl';
    group.grips.forEach((grip,index)=>{
      const key=grip.dataset.key,bound=bounds[key],pane=group.panes[index].getBoundingClientRect();
      const edge=rtl?pane.left-box.left:pane.right-box.left;
      grip.style.left=(edge+(group.kind==='explorer'?(rtl?-6:6):0))+'px';
      grip.setAttribute('aria-valuemin',String(Math.round(bound.min)));
      grip.setAttribute('aria-valuemax',String(Math.floor(bound.max)));
      grip.setAttribute('aria-valuenow',String(Math.round(bound.value)));
      grip.setAttribute('aria-valuetext',Math.round(bound.value)+' px');
      grip.setAttribute('aria-label',t(key));
      grip.title=t(key)+' · '+t('hint')+(grip.dataset.saved==='false'?' · '+t('unsaved'):'');
    });
  }
  function create(layout,kind,panes) {
    const group={layout,kind,panes,grips:[],bounds:null};
    layout.dataset.pbPanes=kind;
    for(let index=0;index<panes.length-1;index++){
      const key=kind==='explorer'?'explorer':index===0?'folders':'list';
      const grip=document.createElement('div');grip.className='pb-pane-splitter';
      grip.dataset.pane=kind==='explorer'?'explorer':index===0?'mail-folders':'mail-list';grip.dataset.key=key;
      grip.tabIndex=0;grip.setAttribute('role','separator');grip.setAttribute('aria-orientation','vertical');
      for(const pane of [panes[index],panes[index+1]])if(!pane.id)pane.id='pb-working-pane-'+(++nextId);
      grip.setAttribute('aria-controls',panes[index].id+' '+panes[index+1].id);
      grip.addEventListener('pointerdown',event=>{
        if(grip.hidden||event.button!==0||event.isPrimary===false)return;
        event.preventDefault();finishDrag(true);apply(group);
        const shield=document.createElement('div');shield.className='pb-pane-drag-shield';shield.setAttribute('aria-hidden','true');
        document.body.append(shield);document.body.classList.add('pb-panes-dragging');
        drag={group,grip,key,pointer:event.pointerId,start:event.clientX,width:group.bounds[key].value,previous:{...preferred},shield,
          direction:getComputedStyle(layout).direction==='rtl'?-1:1};
        grip.focus({preventScroll:true});try{grip.setPointerCapture(event.pointerId);}catch{}
      });
      grip.addEventListener('pointermove',event=>{
        if(drag?.grip!==grip||drag.pointer!==event.pointerId)return;
        const bound=sizes(group)[key];preferred[key]=clamp(drag.width+(event.clientX-drag.start)*drag.direction,bound.min,bound.max);
        for(const item of groups.values())apply(item);
      });
      grip.addEventListener('pointerup',event=>{if(drag?.grip===grip&&drag.pointer===event.pointerId)finishDrag();});
      for(const name of ['pointercancel','lostpointercapture'])grip.addEventListener(name,()=>{if(drag?.grip===grip)finishDrag(true);});
      grip.addEventListener('keydown',event=>{
        if(event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();event.stopPropagation();if(drag||grip.hidden)return;
        const bound=sizes(group)[key],direction=getComputedStyle(layout).direction==='rtl'?-1:1;
        preferred[key]=event.key==='Home'?bound.min:event.key==='End'?bound.max:
          clamp(bound.value+(event.key==='ArrowRight'?1:-1)*(event.shiftKey?40:10)*direction,bound.min,bound.max);
        save();refresh();
      });
      grip.addEventListener('dblclick',event=>{event.preventDefault();finishDrag(true);preferred[key]=DEFAULTS[key];save();refresh();});
      group.grips.push(grip);layout.append(grip);
    }
    group.observer=new ResizeObserver(schedule);group.observer.observe(layout);
    groups.set(layout,group);return group;
  }
  function refresh() {
    for(const [layout,group] of groups)if(!layout.isConnected){if(drag?.group===group)finishDrag(true);group.observer.disconnect();groups.delete(layout);}
    for(const layout of document.querySelectorAll('#panel-explorer .explorer-layout,#mailWorkspace .mail-layout')){
      let group=groups.get(layout);
      if(!group){const kind=layout.classList.contains('explorer-layout')?'explorer':'mail';
        const selectors=kind==='explorer'?['#explorerTree','#explorerFiles']:['.mail-folders','.mail-list','.mail-reader'];
        const panes=selectors.map(selector=>layout.querySelector(':scope>'+selector));if(panes.some(pane=>!pane))continue;
        group=create(layout,kind,panes);
      }
      apply(group);
    }
  }
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-view','lang']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  addEventListener('resize',schedule);
  addEventListener('blur',()=>finishDrag(true));
  addEventListener('keydown',event=>{if(drag&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finishDrag(true);} },true);
  addEventListener('storage',event=>{if(event.key===KEY&&!drag){preferred=read();refresh();}});
  window.PBPanes=Object.freeze({refresh:schedule,snapshot:()=>({...preferred})});refresh();
})();
