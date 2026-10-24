/* PDF pages are rendered locally by Android; originals never enter a website. */
(() => {
 'use strict';
 const labels={de:['Zurückblättern','Weiterblättern','Seite','von','PDF wird geladen …','PDF kann nicht angezeigt werden. Nutze „Öffnen mit …“ oder „Teilen …“.','An Breite anpassen'],en:['Previous page','Next page','Page','of','Loading PDF …','Unable to preview PDF. Use “Open with …” or “Share …”.','Fit width'],ru:['Предыдущая страница','Следующая страница','Страница','из','Загрузка PDF …','Не удалось показать PDF. Используйте открытие или отправку в другое приложение.','По ширине'],pl:['Poprzednia strona','Następna strona','Strona','z','Wczytywanie PDF …','Nie można wyświetlić PDF. Otwórz lub udostępnij w innej aplikacji.','Dopasuj szerokość']};
 const t=i=>(labels[document.documentElement.lang]||labels.de)[i];
 const recovery=()=>({de:'Original erneut auswählen',en:'Select original again',ru:'Выбрать оригинал снова',pl:'Wybierz oryginał ponownie'})[document.documentElement.lang]||'Select original again';
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 window.PBPDF={arguments:async file=>file.pbOriginalHash?{hash:file.pbOriginalHash}:{name:file.name,data:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);})},mount(file,root){
  const api=window.Capacitor?.Plugins?.ProFiles;
  const host=make('div');host.className='native-pdf';const toolbar=make('div');toolbar.className='native-pdf-toolbar';
  const prev=make('button',t(0)),next=make('button',t(1)),number=make('span'),zoom=make('select');
  prev.type=next.type='button';prev.className=next.className='ghost';zoom.setAttribute('aria-label',t(6));
  for(const [value,text] of [['1',t(6)],['1.5','150 %'],['2','200 %']]){const option=make('option',text);option.value=value;zoom.append(option);}
  const status=make('p',t(4));status.setAttribute('role','status');const image=make('img');image.className='native-pdf-page';image.hidden=true;
  const reconnect=make('button',recovery());reconnect.type='button';reconnect.hidden=true;
  reconnect.onclick=()=>{const record=typeof CATALOG!=='undefined'&&CATALOG.find(record=>record.hash===file.pbOriginalHash);if(record)window.PBOriginals?.reconnect(record,true);};
  toolbar.append(prev,number,next,zoom);host.append(toolbar,status,reconnect,image);root.append(host);
  let id=null,pages=0,page=0,closed=false,rendering=false,revision=0;
  function controls(){prev.disabled=rendering||!id||page===0;next.disabled=rendering||!id||page>=pages-1;zoom.disabled=rendering||!id;number.textContent=pages?`${t(2)} ${page+1} ${t(3)} ${pages}`:'';}
  async function render(){
   if(closed||!id)return;const version=++revision;rendering=true;image.hidden=true;controls();status.textContent=t(4);
   try{
    const result=await api.pdfPage({id,page,width:Math.round(Math.max(320,root.clientWidth-24)*Number(zoom.value)*Math.min(devicePixelRatio,2))});
    if(closed||version!==revision)return;
    image.src='data:image/png;base64,'+result.data;image.style.width=`${Number(zoom.value)*100}%`;image.alt=number.textContent;image.hidden=false;status.textContent='';
   }catch{if(!closed)status.textContent=t(5);}
   finally{rendering=false;if(!closed)controls();}
  }
  prev.onclick=()=>{if(!rendering&&page>0){page--;void render();}};next.onclick=()=>{if(!rendering&&page<pages-1){page++;void render();}};zoom.onchange=()=>void render();controls();
  (async()=>{
   try{
    if(typeof api?.openPdf!=='function')throw new Error('unavailable');
    const opened=await api.openPdf(await PBPDF.arguments(file));id=opened.id;pages=opened.pages;
    if(closed){await api.closePdf({id});return;}await render();
   }catch(error){
    const unavailable=file.pbOriginalHash&&error?.code==='ORIGINAL_UNAVAILABLE'&&window.PBOriginals;
    if(unavailable)window.PBOriginals.unavailable?.(file.pbOriginalHash);
    if(!closed){status.textContent=t(5);controls();reconnect.hidden=!unavailable;}
   }
  })();
  return ()=>{closed=true;revision++;if(id)void api.closePdf({id}).catch(()=>{});image.removeAttribute('src');};
 }};
})();
