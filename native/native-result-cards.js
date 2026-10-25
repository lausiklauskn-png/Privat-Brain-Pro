/* Compact result metadata. Original renderers, records and action handlers stay intact. */
(() => {
  'use strict';
  const labels={de:['Pfad','Herkunft'],en:['Path','Source'],ru:['Путь','Источник'],pl:['Ścieżka','Źródło']};
  const text=i=>(labels[String(document.documentElement.lang||'de').slice(0,2)]||labels.de)[i];
  const cards=()=>document.querySelectorAll('#results > .card[data-hash]');
  const states=new WeakMap(),observed=new Set();
  const measure=document.createElement('canvas').getContext('2d');
  let popup=null,active=null,pinned=false,hideTimer=0,pending=false;
  const write=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  const attr=(node,key,value)=>{if(node.getAttribute(key)!==value)node.setAttribute(key,value);};
  function shorten(value,width,font){
    if(!measure)return value;
    measure.font=font;
    if(measure.measureText(value).width<=width)return value;
    const points=Array.from(value),ellipsis='…';let low=0,high=points.length;
    while(low<high){
      const n=Math.ceil((low+high)/2),head=Math.ceil(n*.45),tail=n-head;
      const candidate=points.slice(0,head).join('')+ellipsis+(tail?points.slice(-tail).join(''):'');
      if(measure.measureText(candidate).width<=width)low=n;else high=n-1;
    }
    const head=Math.ceil(low*.45),tail=low-head;
    return points.slice(0,head).join('')+ellipsis+(tail?points.slice(-tail).join(''):'');
  }
  function fit(button){
    const state=states.get(button);if(!state)return;
    const style=getComputedStyle(button),width=Math.max(12,state.caption.getBoundingClientRect().width);
    write(state.caption,shorten(state.short,width,style.font));
  }
  const resize=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
    for(const entry of entries)fit(entry.target);
    if(active)position();
  }):null;
  function close(){
    clearTimeout(hideTimer);hideTimer=0;
    if(active){attr(active,'aria-expanded','false');active.removeAttribute('aria-describedby');}
    active=null;pinned=false;if(popup&&!popup.hidden)popup.hidden=true;
  }
  function position(){
    if(!active?.isConnected||!popup||popup.hidden){close();return;}
    const anchor=active.getBoundingClientRect(),box=popup.getBoundingClientRect(),gap=8;
    const left=Math.max(gap,Math.min(anchor.left,innerWidth-box.width-gap));
    const below=anchor.bottom+5,above=anchor.top-box.height-5;
    const top=Math.max(gap,Math.min(below+box.height<=innerHeight-gap?below:above,innerHeight-box.height-gap));
    const x=Math.round(left)+'px',y=Math.round(top)+'px';
    if(popup.style.left!==x)popup.style.left=x;if(popup.style.top!==y)popup.style.top=y;
  }
  function ensurePopup(){
    if(popup)return;
    popup=document.createElement('div');popup.id='pb-result-path-popover';popup.className='pb-result-path-popover';
    popup.setAttribute('role','tooltip');popup.hidden=true;
    for(const cls of ['pb-result-path-full','pb-result-source-state','pb-result-source-detail']){
      const line=document.createElement('p');line.className=cls;popup.append(line);
    }
    popup.addEventListener('pointerenter',()=>{clearTimeout(hideTimer);hideTimer=0;});
    popup.addEventListener('pointerleave',()=>{if(!pinned)deferClose();});
    document.body.append(popup);
  }
  function show(button){
    clearTimeout(hideTimer);hideTimer=0;
    const state=states.get(button);if(!state)return;
    if(active&&active!==button)close();ensurePopup();active=button;
    write(popup.children[0],state.path);write(popup.children[1],state.availability.label||'');write(popup.children[2],state.availability.detail||'');
    if(popup.hidden)popup.hidden=false;
    attr(button,'aria-expanded','true');attr(button,'aria-describedby',popup.id);position();
  }
  function deferClose(){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!pinned)close();},120);}
  function pathControl(card,meta,pathNode){
    let button=meta.querySelector(':scope > .pb-result-path');
    if(button)return button;
    button=document.createElement('button');button.type='button';button.className='pb-result-path';
    attr(button,'aria-controls','pb-result-path-popover');attr(button,'aria-expanded','false');
    const caption=document.createElement('span');caption.className='pb-result-path-short';
    const status=document.createElement('span');status.className='pb-result-path-state';button.append(caption,status);meta.append(button);
    button.addEventListener('pointerenter',()=>show(button));
    button.addEventListener('pointerleave',()=>{if(!pinned)deferClose();});
    button.addEventListener('focus',()=>show(button));
    button.addEventListener('blur',()=>{if(!pinned)close();});
    button.addEventListener('click',event=>{event.stopPropagation();if(active===button&&pinned){close();return;}show(button);pinned=true;});
    states.set(button,{caption,status,path:'',short:'',availability:{}});resize?.observe(button);observed.add(button);
    return button;
  }
  function enhance(card){
    const header=card.querySelector(':scope > .h');
    const content=header&&[...header.children].find(node=>node.querySelector(':scope > .fname'));
    if(!content)return;
    const rec=typeof CATALOG!=='undefined'?CATALOG.find(item=>item.hash===card.dataset.hash):null;
    if(!rec)return;
    if(!card.classList.contains('pb-result-compact'))card.classList.add('pb-result-compact');
    if(!content.classList.contains('pb-result-heading'))content.classList.add('pb-result-heading');
    let meta=content.querySelector(':scope > .pb-result-meta');
    if(!meta){meta=document.createElement('div');meta.className='pb-result-meta';content.append(meta);}
    let category=card.querySelector('.cat');
    if(!category&&rec.category){category=document.createElement('span');category.className='cat';write(category,String(rec.category));}
    if(category&&category.parentElement!==meta){const old=category.parentElement;meta.prepend(category);if(old?.parentElement===content&&!old.textContent.trim()&&!old.children.length)old.remove();}
    const tags=card.querySelector(':scope > .tags');if(tags)meta.append(tags);
    for(const add of meta.querySelectorAll('[data-tagadd]')){
      if(add.getAttribute('role')!=='button'){attr(add,'role','button');attr(add,'tabindex','0');add.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();add.click();}});}
    }
    const pathNode=content.querySelector(':scope > .path');
    if(pathNode&&!pathNode.classList.contains('pb-result-path-source'))pathNode.classList.add('pb-result-path-source');
    const path=typeof rec.path==='string'&&rec.path?rec.path:pathNode?.textContent.trim()||String(rec.name||'');
    const button=pathControl(card,meta,pathNode),state=states.get(button);
    const availability=window.PBRecordStatus?.availability?.(rec)||{key:'unknown',label:'',detail:''};
    const check=card.querySelector(':scope > .cardbtns > .pb-check-badge');
    const alreadyMissing=availability.key==='missing'&&check?.dataset.check==='missing';
    const status=!alreadyMissing&&['missing','unavailable','unknown'].includes(availability.key)?availability.label:'';
    state.path=path;state.short=/[/\\]/.test(path)?path:text(0);state.availability=availability;
    write(state.status,status);if(state.status.hidden!==!status)state.status.hidden=!status;
    attr(button,'aria-label',text(0)+': '+path+(availability.label?'. '+availability.label:''));
    attr(button,'data-original',availability.key||'unknown');
    fit(button);if(active===button)show(button);
  }
  function refresh(){
    pending=false;for(const button of observed)if(!button.isConnected){resize?.unobserve(button);observed.delete(button);}
    for(const card of cards())enhance(card);
    if(active&&!active.isConnected)close();
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(refresh);}
  const results=document.getElementById('results');
  if(!results)return;
  new MutationObserver(schedule).observe(results,{subtree:true,childList:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('pb-originals-change',schedule);
  window.addEventListener('resize',()=>{for(const button of document.querySelectorAll('#results .pb-result-path'))fit(button);if(active)position();});
  document.addEventListener('pointerdown',event=>{if(active&&!active.contains(event.target)&&!popup?.contains(event.target))close();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();event.stopPropagation();close();}},true);
  document.addEventListener('scroll',()=>{if(active)position();},true);
  window.PBResultCards=Object.freeze({refresh});refresh();
})();
