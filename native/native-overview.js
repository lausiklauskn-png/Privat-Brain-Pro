/* Restore the existing overview and category views. All numbers come from the
   same explorer model; reading this page never opens or scans original files. */
(() => {
  'use strict';
  const workspace=window.PBWorkspace,dashboard=document.getElementById('panel-dash'),order=document.getElementById('panel-order');
  if(!workspace?.overview||!dashboard||!order)return;
  const oldWelcome=dashboard.querySelector('.note');
  if(oldWelcome?.querySelector('[data-i18n="dashH"]')&&oldWelcome.querySelector('[data-i18n="dashP"]'))oldWelcome.remove();
  const categoryIntro=order.querySelector(':scope>p.hint');
  if(categoryIntro?.nextElementSibling?.id==='groups')categoryIntro.remove();
  const words={
    de:{folders:'Dateien nach Ordnern',files:'Dateien',folder:'Ordner',count:'Anzahl',bytes:'Größe',size:'Bekannte Dateigröße',copies:'Lokale Originalkopien',waiting:'Noch nicht ermittelt',unavailable:'Nicht verfügbar',help:'Größen stammen aus dem Dateiindex, einschließlich eingetragener Dateien ohne verfügbares Original. Lokale Originalkopien werden getrennt gezählt. Unterordner sind in ihren übergeordneten Ordnern enthalten. Das ist keine Anzeige des freien oder insgesamt belegten Gerätespeichers.',details:'Was wird gezählt?',empty:'Noch keine Dateien im Explorer.',all:'Alle Ordner anzeigen',more:'Weitere Kategorieansichten',category:'Kategorien',categoryScope:'Datei- und Themenansichten',open:'Ordner öffnen',unknown:'ohne Größenangabe'},
    en:{folders:'Files by folder',files:'Files',folder:'Folder',count:'Files',bytes:'Size',size:'Known file size',copies:'Local original copies',waiting:'Not determined yet',unavailable:'Unavailable',help:'Sizes come from the file index, including records without an available original. Local original copies are counted separately. Parent folders include their subfolders. This does not show free or total used device storage.',details:'What is counted?',empty:'No files in Explorer yet.',all:'Show all folders',more:'Additional category views',category:'Categories',categoryScope:'File and topic views',open:'Open folder',unknown:'without size information'},
    ru:{folders:'Файлы по папкам',files:'Файлы',folder:'Папка',count:'Файлы',bytes:'Размер',size:'Известный размер файлов',copies:'Локальные копии оригиналов',waiting:'Ещё не определено',unavailable:'Недоступно',help:'Размеры взяты из индекса, включая записи без доступного оригинала. Локальные копии считаются отдельно. Родительские папки включают вложенные. Это не свободное или всё занятое место на устройстве.',details:'Что учитывается?',empty:'В проводнике пока нет файлов.',all:'Показать все папки',more:'Дополнительные категории',category:'Категории',categoryScope:'Категории файлов и тем',open:'Открыть папку',unknown:'без размера'},
    pl:{folders:'Pliki według folderów',files:'Pliki',folder:'Folder',count:'Pliki',bytes:'Rozmiar',size:'Znany rozmiar plików',copies:'Lokalne kopie oryginałów',waiting:'Jeszcze nie ustalono',unavailable:'Niedostępne',help:'Rozmiary pochodzą z indeksu, także z wpisów bez dostępnego oryginału. Lokalne kopie są liczone osobno. Folder nadrzędny obejmuje podfoldery. To nie jest wolne ani całe zajęte miejsce na urządzeniu.',details:'Co jest liczone?',empty:'Brak plików w Eksploratorze.',all:'Pokaż wszystkie foldery',more:'Dodatkowe kategorie',category:'Kategorie',categoryScope:'Widoki plików i tematów',open:'Otwórz folder',unknown:'bez informacji o rozmiarze'}
  };
  const copy=()=>words[String(document.documentElement.lang||'de').slice(0,2)]||words.de;
  const make=(tag,cls,text)=>{const element=document.createElement(tag);if(cls)element.className=cls;if(text!=null)element.textContent=text;return element;};
  function setText(element,value){if(element.textContent!==value)element.textContent=value;}
  function bytes(value){
    let n=Number(value)||0,unit=0;const units=['B','KiB','MiB','GiB','TiB'];
    while(n>=1024&&unit<units.length-1){n/=1024;unit++;}
    return new Intl.NumberFormat(document.documentElement.lang||'de',{maximumFractionDigits:unit?1:0}).format(n)+' '+units[unit];
  }
  function folderIcon(){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('pb-overview-folder-icon');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M3 7V4h6l2 3h10v13H3Z');svg.append(path);return svg;
  }
  function open(path){
    if(window.PBNavigation?.folder)return window.PBNavigation.folder(path,true);
    workspace.restoreExplorer({path,filter:'',sort:'date'});workspace.navigate('explorer');
  }
  const section=make('section','pb-overview'),title=make('h2'),summary=make('div','pb-overview-summary'),known=make('p'),local=make('p');
  known.id='pb-overview-known';local.id='pb-overview-local';summary.append(known,local);
  const info=make('details','pb-overview-help'),infoTitle=make('summary'),infoBody=make('p');infoTitle.append(window.PBIcons?.create('info')||document.createTextNode('i'));info.append(infoTitle,infoBody);
  const heading=make('div','pb-overview-folder-head'),folderHeading=make('strong'),countHeading=make('span'),sizeHeading=make('span');heading.append(folderHeading,countHeading,sizeHeading);
  const list=make('div','pb-overview-folders'),more=make('button','ghost pb-overview-more');more.type='button';
  section.append(title,summary,info,heading,list,more);dashboard.querySelector('.tiles').after(section);
  const topicSection=make('section','pb-overview-topics'),topicTitle=make('h3'),topicList=make('div','groups');topicSection.append(topicTitle,topicList);
  document.getElementById('groups').after(topicSection);
  let expanded=false,folderSignature='',categorySignature='',pending=false;
  more.addEventListener('click',()=>{expanded=true;folderSignature='';render();});
  function row(entry,category=false){
    const button=make('button',category?'grp pb-overview-category':'pb-overview-folder');button.type='button';button.dataset.overviewPath=entry.path;
    if(category)button.dataset.overviewCategory=entry.path;
    const label=make('span','pb-overview-folder-label');label.append(folderIcon(),make('span','',entry.label));
    const count=make('span','pb-overview-count',String(entry.count)),size=make('span','pb-overview-size',bytes(entry.knownBytes)+(entry.unknownSizes?' + ?':''));
    if(!category)button.style.setProperty('--folder-depth',String(Math.min(entry.depth||0,6)));
    button.append(label,count,size);button.title=copy().open+': '+entry.label;
    button.addEventListener('click',event=>{event.stopPropagation();open(entry.path);});return button;
  }
  function render(){
    const onDash=dashboard.classList.contains('on'),onOrder=order.classList.contains('on');
    if(!onDash&&!onOrder)return;
    const data=workspace.overview(),w=copy(),language=document.documentElement.lang||'de';
    const categoryCount=document.getElementById('kpiCats');
    if(categoryCount){setText(categoryCount,String(data.categories.length+data.topics.length));const scope=categoryCount.parentElement.querySelector('.u');if(scope)setText(scope,w.categoryScope);}
    if(onDash){
      setText(title,w.folders);infoTitle.setAttribute('aria-label',w.details);infoTitle.title=w.details;setText(infoBody,w.help);
      setText(folderHeading,w.folder);setText(countHeading,w.count);setText(sizeHeading,w.bytes);setText(more,w.all);
      setText(known,w.files+': '+data.total.count+' · '+w.size+': '+bytes(data.total.knownBytes)+(data.total.unknownSizes?' · '+data.total.unknownSizes+' '+w.unknown:''));
      setText(local,w.copies+': '+(data.originalsError?w.unavailable:!data.originalsReady?w.waiting:data.total.localCount+' · '+bytes(data.total.localBytes)));
      const signature=language+'|'+expanded+'|'+JSON.stringify(data.folders);
      if(signature!==folderSignature){
        folderSignature=signature;list.replaceChildren();
        const shown=expanded?data.folders:data.folders.slice(0,60);
        if(!shown.length)list.append(make('p','hint',w.empty));else for(const entry of shown)list.append(row(entry));
        more.hidden=expanded||shown.length===data.folders.length;
      }
    }
    if(onOrder){
      const signature=language+'|'+JSON.stringify([data.categories,data.topics]),groups=document.getElementById('groups');
      // The legacy refresh still renders these groups. Restore the native
      // folder links even when an unchanged catalog was simply refreshed.
      const owned=groups.children.length===data.categories.length&&[...groups.children].every(child=>child.matches('button[data-overview-category]'));
      if(signature!==categorySignature||!owned){
        categorySignature=signature;groups.replaceChildren(...data.categories.map(entry=>row(entry,true)));
        document.getElementById('orderEmpty').style.display=data.categories.length?'none':'block';
        setText(topicTitle,w.more);topicSection.hidden=!data.topics.length;topicList.replaceChildren(...data.topics.map(entry=>row(entry,true)));
      }
    }
  }
  function schedule(){if(!pending){pending=true;queueMicrotask(()=>{pending=false;render();});}}
  window.addEventListener('pb-workspace-refresh',schedule);
  for(const panel of [dashboard,order])new MutationObserver(schedule).observe(panel,{attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.PBOverview=Object.freeze({refresh:schedule});schedule();
})();
