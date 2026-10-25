/* Shared local search/explorer thumbnails. Original/catalog/check data remain untouched. */
(() => {
  'use strict';
  if(window.PBResultPreviews)return;
  const views=[
    {root:document.getElementById('results'),selector:':scope>.card[data-hash]',panel:'panel-search',explorer:false},
    {root:document.getElementById('explorerFiles'),selector:':scope>.explorer-row[data-hash]:not(.native-vault-row)',panel:'panel-explorer',explorer:true}
  ].filter(view=>view.root);if(!views.length)return;
  const imageLimit=2*1024*1024,pdfLimit=16*1024*1024,cacheLimit=6*1024*1024,maxCached=16;
  const cards=new Map(),pending=new Set(),cache=new Map();
  let bytes=0,running=false,scheduled=false,disposed=false,suspended=false,epoch=0;
  const words={
    de:['Vorschau öffnen','Vorschau wird geladen','Keine lokale Vorschau verfügbar','Original fehlt','Vorschau nicht verfügbar','Gespeicherte Vorschau','Miniaturvorschau','Original derzeit nicht lesbar','Verfügbarkeit wird ermittelt','Lokale Kopie','In dieser Sitzung verfügbar','Quelle verknüpft'],
    en:['Open preview','Loading preview','No local preview available','Original missing','Preview unavailable','Saved preview','Thumbnail preview','Original currently unreadable','Checking availability','Local copy','Available in this session','Source linked'],
    ru:['Открыть предпросмотр','Загрузка предпросмотра','Нет локального предпросмотра','Нет оригинала','Предпросмотр недоступен','Сохранённый предпросмотр','Миниатюра','Оригинал сейчас недоступен','Проверяется доступность','Локальная копия','Доступно в этом сеансе','Источник связан'],
    pl:['Otwórz podgląd','Ładowanie podglądu','Brak lokalnego podglądu','Brak oryginału','Podgląd niedostępny','Zapisany podgląd','Miniatura','Oryginał obecnie niedostępny','Sprawdzanie dostępności','Kopia lokalna','Dostępne w tej sesji','Źródło powiązane']
  };
  const t=i=>(words[String(document.documentElement.lang||'de').slice(0,2)]||words.de)[i];
  const attr=(node,key,value)=>{if(node.getAttribute(key)!==value)node.setAttribute(key,value);};
  const dataImage=value=>typeof value==='string'&&value.length<=3*1024*1024&&/^data:image\/(?:png|jpe?g|gif|webp|bmp|avif);base64,[A-Za-z0-9+/\r\n]+={0,2}$/.test(value);
  function kind(rec){
    if(rec.mail||rec.mailIndex||rec.mailBody!=null||rec.origin)return '';
    const name=String(rec.name||rec.path||'');
    if(rec.type==='application/pdf'||/\.pdf$/i.test(name))return 'pdf';
    return /^image\/(?:png|jpeg|gif|webp|bmp|avif)$/.test(rec.type||'')||/\.(?:png|jpe?g|gif|webp|bmp|avif)$/i.test(name)?'image':'';
  }
  function rawSnippet(rec,text){
    if(!kind(rec)||!text)return false;
    if(/^\s*(?:%PDF-|<<\s*\/(?:Title|Type|Producer|Creator|Subtype)|\d+\s+\d+\s+obj\b|\/(?:Subtype|BitsPerComponent|ColorSpace|Filter|Resources|Length)\b)/i.test(text))return true;
    if(/<FEFF[0-9a-f\s]{16,}>|\/(?:Title|Author|Producer|Creator)\b[\s\S]{0,50}<[0-9a-f]{24,}>/i.test(text))return true;
    const controls=(text.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/g)||[]).length;
    return controls>Math.max(3,text.length*.025)||(/\b(?:JFIF|ICC_PROFILE|acsp)\b/.test(text)&&controls>0);
  }
  function symbol(type){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    for(const [name,value]of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(name,value);
    const path=document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('d',type==='pdf'?'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M8 13h8 M8 17h6':'M4 4h16v16H4z M4 16l5-5 4 4 3-3 4 4 M9 8h.01');svg.append(path);return svg;
  }
  function release(state){
    if(state.entry){state.entry.refs--;state.entry=null;}
    if(state.image){state.image.removeAttribute('src');state.image=null;}
  }
  function evict(entry){URL.revokeObjectURL(entry.url);bytes-=entry.size;cache.delete(entry.key);}
  function remember(key,blob){
    if(!blob||!blob.size||blob.size>cacheLimit)return null;
    for(const entry of [...cache.values()]){if(cache.size<maxCached&&bytes+blob.size<=cacheLimit)break;if(!entry.refs)evict(entry);}
    if(cache.size>=maxCached||bytes+blob.size>cacheLimit)return null;
    const entry={key,url:URL.createObjectURL(blob),size:blob.size,refs:0};cache.set(key,entry);bytes+=blob.size;return entry;
  }
  function originalState(rec){
    const shared=window.PBRecordStatus?.availability?.(rec);if(shared?.key)return shared;
    const native=window.PBOriginals?.statusFor?.(rec.hash);
    // Match the common adapter's precedence while it is still starting.
    const key=native==='local'?'local':typeof SESSION_FILES!=='undefined'&&SESSION_FILES.has(rec.hash)?'session':native==='unavailable'?'unavailable':rec.localSource?.dirId||rec.dirId?'source':native||'unknown';
    return{key,label:t(({missing:3,unavailable:7,unknown:8,local:9,session:10,source:11})[key]??8),detail:''};
  }
  const availability=rec=>originalState(rec).key;
  function stateLabel(state,status,original=originalState(state.record)){
    const prefix=status==='ready'?t(0)+' · '+t(state.source?5:6)+' · '+original.label:status==='loading'?t(1):status==='missing'?t(3):status==='unavailable'?t(4):t(2);
    return prefix+': '+String(state.record.name||state.record.path||'');
  }
  function describe(state,status){
    const original=originalState(state.record),label=stateLabel(state,status,original);
    attr(state.slot,'aria-label',label);attr(state.slot,'title',label+(original.detail?'\n'+original.detail:''));attr(state.slot,'data-original',original.key);
    attr(state.slot,'aria-busy',String(status==='loading'));
    const marker=state.slot.querySelector(':scope>.pb-result-preview-source'),needed=status==='ready'&&!['local','session'].includes(original.key);
    if(needed&&!marker){
      const span=document.createElement('span');span.className='pb-result-preview-source';span.setAttribute('aria-hidden','true');
      const svg=symbol('pdf');svg.querySelector('path').setAttribute('d','M4 4l16 16 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0');span.append(svg);state.slot.append(span);
    }else if(!needed&&marker)marker.remove();
  }
  function paint(state,status,entry=null,source=''){
    if(!state.slot.isConnected)return;
    if(state.status===status&&state.entry===entry&&state.source===source){describe(state,status);return;}
    release(state);state.status=status;state.source=source;state.slot.dataset.state=status;
    if(status==='ready'&&(entry||source)){
      if(entry){entry.refs++;state.entry=entry;cache.delete(entry.key);cache.set(entry.key,entry);}
      const image=document.createElement('img');image.className='pb-result-preview-image';image.alt='';image.decoding='async';
      image.onerror=()=>{if(state.image!==image)return;const failed=state.entry;state.rejectedSource=source;paint(state,'unavailable');if(failed&&!failed.refs&&cache.get(failed.key)===failed)evict(failed);};
      image.src=entry?.url||source;state.image=image;
      state.slot.replaceChildren(image);
    }else{
      const name=document.createElement('span');name.className='pb-result-preview-kind';name.textContent=state.kind==='pdf'?'PDF':'';
      state.slot.replaceChildren(symbol(state.kind),name);
      if(status==='loading'){const dots=document.createElement('span');dots.className='pb-activity-dots';dots.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)dots.append(document.createElement('i'));state.slot.append(dots);}
    }
    describe(state,status);
  }
  function active(state){
    return !disposed&&!suspended&&!document.hidden&&state.card.isConnected&&state.visible&&
      document.getElementById(state.view.panel)?.classList.contains('on')&&
      !document.querySelector('.native-file-viewer:not([hidden])');
  }
  async function dimensions(file){
    // Bound decoded pixels before allocating a thumbnail. Unknown formats stay
    // available through Open, without decoding arbitrarily large images here.
    const b=new Uint8Array(await file.slice(0,65536).arrayBuffer()),view=new DataView(b.buffer);
    if(b.length>=24&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return[view.getUint32(16),view.getUint32(20)];
    if(b.length>=10&&String.fromCharCode(...b.slice(0,3))==='GIF')return[view.getUint16(6,true),view.getUint16(8,true)];
    if(b.length>=26&&b[0]===66&&b[1]===77)return[Math.abs(view.getInt32(18,true)),Math.abs(view.getInt32(22,true))];
    if(b[0]===255&&b[1]===216){
      let n=2;while(n+4<=b.length){if(b[n++]!==255)continue;let marker=b[n++];while(marker===255&&n<b.length)marker=b[n++];if(marker===217||marker===218)break;if(marker===0||marker===1||marker>=208&&marker<=215)continue;const length=view.getUint16(n);if(length<2||n+length>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&length>=7)return[view.getUint16(n+5),view.getUint16(n+3)];n+=length;}
    }
    return null;
  }
  async function imageBlob(state){
    const rec=state.record,files=window.Capacitor?.Plugins?.ProFiles;
    let file=typeof SESSION_FILES!=='undefined'?SESSION_FILES.get(rec.hash):null;
    if(!file){
      if(availability(rec)!=='local'||typeof files?.originalInfo!=='function')return null;
      const info=await files.originalInfo({hash:rec.hash});
      if(info.missing||info.hash!==rec.hash||!Number.isSafeInteger(info.size)||info.size<1||info.size>imageLimit)return null;
      if(!active(state))return null;
      file=await window.PBOriginals?.resolve?.(rec);
    }
    if(!file||file.size>imageLimit||typeof createImageBitmap!=='function')return null;
    const size=await dimensions(file);if(!size||size.some(n=>!Number.isSafeInteger(n)||n<1)||size[0]*size[1]>12_000_000)return null;
    if(!active(state))return null;
    const scale=Math.min(1,320/size[0],320/size[1]);
    const width=Math.max(1,Math.round(size[0]*scale)),height=Math.max(1,Math.round(size[1]*scale));
    const bitmap=await createImageBitmap(file,{resizeWidth:width,resizeHeight:height,resizeQuality:'low'});
    try{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.75));}finally{bitmap.close();}
  }
  async function pdfBlob(state){
    const api=window.Capacitor?.Plugins?.ProFiles;if(typeof api?.openPdf!=='function'||typeof api?.pdfPage!=='function'||typeof api?.closePdf!=='function')return null;
    const rec=state.record,stored=availability(rec)==='local';
    // A native hash opens the checked original in Android; no PDF byte copy
    // crosses the bridge. Non-native/session-only PDFs use the existing viewer.
    if(!stored||typeof api.originalInfo!=='function')return null;
    const info=await api.originalInfo({hash:rec.hash});
    if(info.missing||info.hash!==rec.hash||!Number.isSafeInteger(info.size)||info.size<1||info.size>pdfLimit||!active(state))return null;
    let id;
    try{
      const opened=await api.openPdf({hash:rec.hash});id=opened.id;
      if(!active(state))return null;
      const page=await api.pdfPage({id,page:0,width:320});
      if(typeof page.data!=='string'||page.data.length>4*1024*1024||!Number.isInteger(page.width)||page.width<1||page.width>2048||!Number.isInteger(page.height)||page.height<1||page.height>2048)throw new Error('Invalid local preview');
      const data=Uint8Array.from(atob(page.data),c=>c.charCodeAt(0));return new Blob([data],{type:'image/png'});
    }finally{if(id)await api.closePdf({id}).catch(()=>{});}
  }
  async function pump(){
    if(running||disposed)return;running=true;
    try{while(pending.size&&!disposed){
      const state=pending.values().next().value;pending.delete(state);if(!active(state))continue;
      const existing=[state.record.thumb,state.record.preview].find(dataImage)||'';
      if(dataImage(existing)&&state.rejectedSource!==existing){paint(state,'ready',null,existing);continue;}
      const key=state.kind+':'+state.record.hash,hit=cache.get(key);
      if(hit){paint(state,'ready',hit);continue;}
      const known=availability(state.record);
      if(known==='unknown'){paint(state,'idle');continue;}
      if(known!=='local'&&known!=='session'){paint(state,known==='missing'?'missing':'unavailable');continue;}
      const generation=epoch;paint(state,'loading');
      try{
        const blob=await(state.kind==='pdf'?pdfBlob(state):imageBlob(state));
        if(disposed||generation!==epoch)continue;
        const entry=blob?remember(key,blob):null;
        if(active(state))paint(state,entry?'ready':'unavailable',entry);
      }catch(error){if(error?.code==='ORIGINAL_UNAVAILABLE')window.PBOriginals?.unavailable?.(state.record.hash);if(active(state)&&generation===epoch)paint(state,'unavailable');}
    }}finally{running=false;}
  }
  function enqueue(state){if(active(state)){pending.add(state);void pump();}}
  const visibility=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const entry of entries){const state=cards.get(entry.target);if(!state)continue;state.visible=entry.isIntersecting;if(state.visible)enqueue(state);else{pending.delete(state);paint(state,'idle');}}},{rootMargin:'80px 0px',threshold:0}):null;
  function refresh(){
    scheduled=false;if(disposed)return;
    const catalog=typeof CATALOG!=='undefined'?new Map(CATALOG.map(rec=>[rec.hash,rec])):new Map();
    for(const [card,state]of cards){if(!card.isConnected||!state.view.root.contains(card)||catalog.get(state.record.hash)!==state.record){visibility?.unobserve(card);pending.delete(state);release(state);state.slot.remove();state.head.classList.remove('pb-explorer-preview-info');cards.delete(card);}}
    for(const view of views)for(const card of view.root.querySelectorAll(view.selector)){
      const rec=catalog.get(card.dataset.hash);if(!rec)continue;
      const type=kind(rec),snip=card.querySelector(':scope>.snip');
      if(snip){const raw=rawSnippet(rec,snip.textContent);if(snip.classList.contains('pb-result-raw-snippet')!==raw)snip.classList.toggle('pb-result-raw-snippet',raw);}
      if(!type||cards.has(card))continue;
      const head=card.querySelector(view.explorer?':scope>div':':scope>.h');if(!head)continue;
      const slot=document.createElement('button');slot.type='button';slot.className='pb-result-preview';
      const old=head.querySelector(':scope>.thumbimg');old?.remove();
      const state={card,head,view,record:rec,slot,kind:type,visible:!visibility,status:'',entry:null,image:null,source:''};cards.set(card,state);head.prepend(slot);if(view.explorer)head.classList.add('pb-explorer-preview-info');
      slot.onclick=event=>{event.preventDefault();event.stopPropagation();if(typeof window.openFile==='function')void window.openFile(rec.hash);};
      paint(state,'idle');if(visibility)visibility.observe(card);else enqueue(state);
    }
    for(const state of cards.values()){
      const known=availability(state.record);
      if(state.availability!==known){state.availability=known;if(state.status==='missing'||state.status==='unavailable')paint(state,'idle');}
      describe(state,state.status);
      if(active(state)&&state.status==='idle')enqueue(state);
    }
    watchViewer();
  }
  function schedule(){if(!scheduled&&!disposed){scheduled=true;queueMicrotask(refresh);}}
  const changes=new MutationObserver(schedule),panelChanges=new MutationObserver(schedule);
  for(const view of views){changes.observe(view.root,{childList:true,subtree:true});const panel=document.getElementById(view.panel);if(panel)panelChanges.observe(panel,{attributes:true,attributeFilter:['class','hidden']});}
  const language=new MutationObserver(schedule);language.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  let viewer=null;const viewerChanges=new MutationObserver(schedule);
  function watchViewer(){const next=document.querySelector('.native-file-viewer');if(next===viewer)return;viewerChanges.disconnect();viewer=next;if(viewer)viewerChanges.observe(viewer,{attributes:true,attributeFilter:['hidden','class']});}
  const bodyChanges=new MutationObserver(()=>{watchViewer();schedule();});bodyChanges.observe(document.body,{childList:true});
  function suspend(){suspended=true;epoch++;pending.clear();for(const state of cards.values())paint(state,'idle');for(const entry of [...cache.values()])evict(entry);}
  function resume(){suspended=false;schedule();}
  function dispose(){if(disposed)return;suspend();disposed=true;visibility?.disconnect();changes.disconnect();panelChanges.disconnect();language.disconnect();viewerChanges.disconnect();bodyChanges.disconnect();window.removeEventListener('pb-originals-change',schedule);window.removeEventListener('pagehide',suspend);window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',documentVisibility);}
  function documentVisibility(){if(document.hidden)suspend();else resume();}
  window.addEventListener('pb-originals-change',schedule);window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',documentVisibility);
  window.PBResultPreviews=Object.freeze({refresh:schedule,dispose});schedule();
})();
