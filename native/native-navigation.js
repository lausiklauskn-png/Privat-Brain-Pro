/* Native-only navigation. Keep file bytes in memory, never replace the app with a blob URL.
   Browser History is the single back/forward stack; Android delegates to this same path. */
(() => {
  'use strict';
  const workspace=window.PBWorkspace;
  if(!workspace)return;
  const words={
    de:['← Zurück','Vorwärts →','Mit anderer App öffnen','Für diese Datei gibt es keine interne Vorschau.','Die Datei ist in dieser Sitzung nicht mehr verfügbar. Öffne sie erneut aus dem Explorer.','Datei konnte nicht geöffnet werden.','Datei wird geladen …','Für das externe Öffnen sind höchstens 16 MiB möglich.'],
    en:['← Back','Forward →','Open with another app','No internal preview is available for this file.','This file is no longer available in this session. Open it again from Explorer.','Unable to open the file.','Loading file …','External opening supports files up to 16 MiB.'],
    ru:['← Назад','Вперёд →','Открыть в другом приложении','Для этого файла нет встроенного просмотра.','Файл больше недоступен в этом сеансе. Откройте его снова в проводнике.','Не удалось открыть файл.','Загрузка файла …','Внешнее открытие поддерживает файлы до 16 МиБ.'],
    pl:['← Wstecz','Dalej →','Otwórz w innej aplikacji','Ten plik nie ma podglądu w aplikacji.','Plik nie jest już dostępny w tej sesji. Otwórz go ponownie w Eksploratorze.','Nie można otworzyć pliku.','Wczytywanie pliku …','Otwieranie zewnętrzne obsługuje pliki do 16 MiB.']
  };
  const extras={de:['Teilen …','Öffnen mit …'],en:['Share …','Open with …'],ru:['Поделиться …','Открыть с помощью …'],pl:['Udostępnij …','Otwórz za pomocą …']};
  const waiting={de:['Teilen wird vorbereitet …','Öffnen wird vorbereitet …'],en:['Preparing to share …','Preparing to open …'],ru:['Подготовка к отправке …','Подготовка к открытию …'],pl:['Przygotowywanie udostępniania …','Przygotowywanie otwarcia …']};
  const x=i=>(extras[document.documentElement.lang]||extras.de)[i];
  const t=i=>(words[document.documentElement.lang]||words.de)[i];
  const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
  // The delivered shell already contains the final controls. Bind them in place.
  const nav=document.querySelector('header .tools>.native-navigation')||make('nav','native-navigation');
  const previous=nav.children[0]||make('button','ghost'),next=nav.children[1]||make('button','ghost');
  previous.type=next.type='button';if(!nav.isConnected){nav.append(previous,next);document.querySelector('header .tools').prepend(nav);}
  const say=(button,value)=>{const label=button.querySelector(':scope>.compact-label');if(label){if(label.textContent!==value)label.textContent=value;}else button.textContent=value;};
  const viewer=make('section','native-file-viewer');viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');
  const head=make('div','native-file-head'),close=make('button','ghost'),title=make('strong','native-file-title'),external=make('button','ghost');
  const share=make('button','ghost');share.type='button';
  share.dataset.nativeAction='share';external.dataset.nativeAction='open';
  close.type=external.type='button';title.id='native-file-title';viewer.setAttribute('aria-labelledby',title.id);
  const body=make('div','native-file-body');head.append(close,title,external,share);viewer.append(head,body);document.body.append(viewer);
  const files=new Map(), snapshots=new Map();
  let sequence=0, current=0, maximum=0, active=null, applying=false, pending=false, generation=0, objectURL='', focusBefore=null,pdfCleanup=null,handoffJob=null;
  const page=()=>document.querySelector('.main-pages .tab.on,.native-toolbar-quick .tab.on,.workspace-tools .tab.on')?.dataset.tab||'search';
  let route={page:page(),explorer:workspace.explorerState(),viewer:null,lightbox:null};
  const originalLightbox=window.openLightbox,originalClose=window.closeLightbox;
  const urlFor=r=>location.pathname+location.search+(r.page==='search'?'':'#'+r.page);
  function save(){
    if(!route.viewer)route.explorer=workspace.explorerState();
    snapshots.set(current,{route:structuredClone(route),scroll:[...document.querySelectorAll('.wrap>.panel,.mail-list,.mail-reader,#explorerFiles,#explorerTree')].map(e=>[e.id||e.className,e.scrollTop])});
    // popstate restores this snapshot by index. Rewriting the same browser entry
    // on every save is redundant and exhausts WebKit's History API rate limit.
  }
  function buttons(){
    say(previous,t(0));close.textContent=t(0);say(next,t(1));external.textContent=x(1);share.textContent=x(0);
    previous.disabled=pending||current===0;next.disabled=pending||current>=maximum;
    nav.setAttribute('aria-label',t(0)+' / '+t(1));
  }
  async function render(){
    const version=++generation;if(pdfCleanup){pdfCleanup();pdfCleanup=null;}menu.hidden=true;applying=true;
    workspace.navigate(route.page,{record:false});workspace.restoreExplorer(route.explorer);
    if(!route.lightbox)originalClose();
    else if(!document.querySelector('#lightboxBg.on'))await originalLightbox(route.lightbox);
    if(version!==generation){applying=false;return;}
    applying=false;
    if(objectURL){URL.revokeObjectURL(objectURL);objectURL='';}
    body.replaceChildren();active=route.viewer?files.get(route.viewer):null;viewer.hidden=!route.viewer;
    document.querySelector('.wrap').inert=Boolean(route.viewer);
    if(!route.viewer){focusBefore?.focus?.({preventScroll:true});buttons();return;}
    title.textContent=active?.name||'';external.hidden=share.hidden=!active;handoffControls();close.focus({preventScroll:true});
    if(!active){body.append(make('p','',t(4)));buttons();return;}
    const file=active.file,ext=active.name.split('.').pop().toLowerCase();
    if(/^image\/(png|jpeg|gif|webp|avif|bmp)$/.test(file.type)||/^(png|jpe?g|gif|webp|avif|bmp)$/.test(ext)){
      const img=make('img','native-file-image');img.alt=active.name;objectURL=URL.createObjectURL(file);img.src=objectURL;
      img.onerror=()=>{if(version===generation)body.replaceChildren(make('p','',t(5)));};body.append(img);
    }else if(file.type==='application/pdf'||ext==='pdf'){
      pdfCleanup=window.PBPDF.mount(file,body);
    }else if(file.size<=2*1024*1024&&(file.type.startsWith('text/')||/^(txt|md|csv|json|log|xml|html?|eml)$/.test(ext))){
      body.append(make('p','',t(6)));
      try{const text=await file.text();if(version===generation)body.replaceChildren(make('pre','native-file-text',text));}
      catch{if(version===generation)body.replaceChildren(make('p','',t(5)));}
    }else body.append(make('p','',t(3)));
    buttons();
  }
  function commit(nextRoute){
    if(pending)return;save();
    // A new action after Back discards only forward entries, like a browser.
    for(const key of snapshots.keys())if(key>current)snapshots.delete(key);
    current++;maximum=current;route=nextRoute;
    history.pushState({pbPage:route.page,pbNative:{index:current,route}},'',urlFor(route));
    void render();
  }
  function dismiss(){
    const dialog=[...document.querySelectorAll('dialog[open]')].pop();
    if(dialog){const event=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(event))dialog.close();return true;}
    if(document.querySelector('#modalBg.on')){window.closeModal();return true;}
    return false;
  }
  function back(){
    if(pending)return true;if(!menu.hidden){menu.hidden=true;close.focus();return true;}if(dismiss())return true;
    if(current<=0)return false;
    pending=true;buttons();history.back();return true;
  }
  function forward(){if(pending||current>=maximum)return;pending=true;buttons();history.forward();}
  function open(file,r={}){
    if(pending)return;
    focusBefore=document.activeElement;
    const key=String(++sequence);files.set(key,{file,name:r.name||file.name||'file'});
    // Retain at least twenty recent files. Evicted entries still have a working Back button.
    while(files.size>20)files.delete(files.keys().next().value);
    commit({...route,viewer:key});
  }
  previous.onclick=close.onclick=back;next.onclick=forward;
  function handoffControls(){
    external.disabled=share.disabled=Boolean(handoffJob)||!active;
    for(const item of menu.children)item.disabled=Boolean(handoffJob)||!active;
  }
  async function handoff(method){
    const entry=active;if(!entry||handoffJob)return;menu.hidden=true;
    if(!(entry.file.pbVaultId&&window.PBVault)&&!entry.file.pbOriginalHash&&entry.file.size>16*1024*1024){body.append(make('p','',t(7)));return;}
    const version=generation,job={};handoffJob=job;handoffControls();
    const activity=window.PBActivity?.start({label:()=> (waiting[document.documentElement.lang]||waiting.de)[method==='share'?0:1],target:method==='share'?share:external});
    const currentEntry=()=>active===entry&&generation===version&&!viewer.hidden&&viewer.isConnected;
    try{
      if(activity)await activity.ready;
      if(!currentEntry())return;
      // Files from the encrypted folder leave it only after the folder's own warning.
      if(entry.file.pbVaultId&&window.PBVault)await PBVault.handOut(entry.file.pbVaultId,method==='share');
      else{
        const args=await PBPDF.arguments(entry.file);
        if(!currentEntry())return;
        await window.Capacitor.Plugins.ProFiles[method](args);
      }
    }catch{if(active===entry&&generation===version)body.append(make('p','',t(5)));}
    finally{activity?.finish();if(handoffJob===job)handoffJob=null;handoffControls();}
  }
  external.onclick=()=>handoff('open');share.onclick=()=>handoff('share');
  const menu=make('div','native-file-menu');menu.hidden=true;menu.setAttribute('role','menu');
  for(const [index,method] of [[1,'open'],[0,'share']]){
    const item=make('button','ghost',x(index));item.type='button';item.dataset.label=index;item.setAttribute('role','menuitem');
    item.onclick=()=>handoff(method);menu.append(item);
  }
  viewer.append(menu);
  viewer.addEventListener('contextmenu',event=>{if(!active)return;event.preventDefault();menu.hidden=false;menu.style.left=Math.max(0,Math.min(event.clientX,innerWidth-220))+'px';menu.style.top=Math.max(0,Math.min(event.clientY,innerHeight-120))+'px';menu.querySelector('button').focus();});
  viewer.addEventListener('click',event=>{if(!menu.contains(event.target))menu.hidden=true;});
  window.showBlob=open;
  window.openLightbox=async hash=>{
    if(pending)return;
    await originalLightbox(hash);
    if(!applying&&document.querySelector('#lightboxBg.on'))commit({...route,lightbox:hash,viewer:null});
  };
  window.closeLightbox=()=>{if(!applying&&route.lightbox)return back();originalClose();};
  window.addEventListener('popstate',event=>{
    pending=false;
    const state=event.state?.pbNative;
    if(!state){route={page:page(),explorer:workspace.explorerState(),viewer:null,lightbox:null};current=0;maximum=0;}
    else{current=state.index;route=structuredClone(snapshots.get(current)?.route||state.route);}
    void render().then(()=>{
      for(const [key,top] of snapshots.get(current)?.scroll||[]){const node=[...document.querySelectorAll('.wrap>.panel,.mail-list,.mail-reader,#explorerFiles,#explorerTree')].find(e=>(e.id||e.className)===key);if(node)node.scrollTop=top;}
    });
  });
  window.addEventListener('keydown',event=>{
    const editable=event.target.closest?.('input,textarea,select,[contenteditable=true]');
    if((event.altKey&&event.key==='ArrowLeft')||event.key==='BrowserBack'||(event.key==='Backspace'&&!editable)){
      event.preventDefault();back();
    }else if(event.altKey&&event.key==='ArrowRight'){event.preventDefault();forward();}
    else if(event.key==='Escape'&&(route.viewer||route.lightbox||document.querySelector('dialog[open],#modalBg.on'))){event.preventDefault();back();}
    else if(event.key==='Tab'&&route.viewer){
      const controls=[...viewer.querySelectorAll('button:not([disabled]),select:not([disabled])')].filter(e=>e.offsetParent!==null),first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  },true);
  window.addEventListener('mousedown',e=>{if(e.button===3){e.preventDefault();back();}else if(e.button===4){e.preventDefault();forward();}},true);
  for(const type of ['mouseup','auxclick'])window.addEventListener(type,e=>{if(e.button===3||e.button===4)e.preventDefault();},true);
  new MutationObserver(()=>{buttons();for(const item of menu.children)item.textContent=x(Number(item.dataset.label));}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.PBNavigation={back,forward,open,navigate(target){
    if(route.page===target&&!route.viewer&&!route.lightbox)return;
    commit({...route,page:target,viewer:null,lightbox:null,explorer:workspace.explorerState()});
  },folder(path,clear){
    const explorer={...workspace.explorerState(),path};if(clear)explorer.filter='';
    commit({...route,page:'explorer',explorer,viewer:null,lightbox:null});
  }};
  history.replaceState({...history.state,pbNative:{index:0,route}},'',location.href);buttons();
})();
