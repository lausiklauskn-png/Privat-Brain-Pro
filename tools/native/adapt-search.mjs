// Pro uses one meaning-search switch; the shared PWA keeps its original UI.
export function adaptSearch(source) {
  let html = source;
  function replace(before, after, label) {
    if (html.split(before).length !== 2) throw new Error('Review native search adaptation: ' + label);
    html = html.replace(before, after);
  }
  replace('    <div class="search-welcome"><h2 data-ws="find">Was möchtest du finden?</h2><p data-ws="findHelp">Durchsuche E-Mails, Dokumente und Bilder gemeinsam nach ihrer Bedeutung.</p></div>\n', '', 'redundant search introduction');
  replace('        <button data-m="name" data-i18n="modeName">Namenssuche</button>\n', '', 'filename mode control');
  replace('<button class="on" data-m="mean" data-i18n="modeMean">Bedeutungssuche</button>',
    '<button type="button" class="on" data-m="mean" aria-pressed="true" aria-label="Bedeutungssuche" data-i18n-aria="modeMean"><span data-i18n="modeMeaningShort">Bedeutung</span><svg class="pb-search-mode-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button>', 'meaning switch');
  replace('function setToggle(){ $$("#mode button").forEach(b=>b.classList.toggle("on", b.dataset.m===MODE)); }',
    'function setToggle(){ const b=$("#mode [data-m=mean]"); if(!b)return; const enabled=MODE==="mean"; b.classList.toggle("on",enabled); b.setAttribute("aria-pressed",String(enabled)); }', 'saved switch state');
  replace('$$("#mode button").forEach(b=>b.addEventListener("click",()=>{ MODE=b.dataset.m; setToggle(); renderResults($("#q").value); }));',
    '$("#mode [data-m=mean]").addEventListener("click",()=>{ MODE=MODE==="mean"?"name":"mean"; setToggle(); renderResults($("#q").value); });', 'switch click');
  for (const [full, short] of [['Bedeutungssuche','Bedeutung'], ['Meaning search','Meaning'], ['Поиск по смыслу','Смысл'], ['Szukaj po znaczeniu','Znaczenie']]) {
    replace('modeMean:' + JSON.stringify(full), 'modeMeaningShort:' + JSON.stringify(short) + ', modeMean:' + JSON.stringify(full), 'translated short label ' + short);
  }
  const titles = '    document.querySelectorAll("[data-i18n-title]").forEach(function(el){ var v=t(el.getAttribute("data-i18n-title")); if(v!=null) el.setAttribute("title", v.replace(/<[^>]+>/g,"")); });';
  replace(titles, titles + '\n    document.querySelectorAll("[data-i18n-aria]").forEach(function(el){ var v=t(el.getAttribute("data-i18n-aria")); if(v!=null) el.setAttribute("aria-label",v.replace(/<[^>]+>/g,"")); });', 'accessible translated label');
  replace('"Namenssuche: findet nur, was im Dateinamen steht."', '"Suche: findet, was im Dateinamen steht."', 'filename help');
  replace('(MODE==="name" ? "Namenssuche" : "Bedeutungssuche")', '(MODE==="name" ? "Suche" : "Bedeutungssuche")', 'result status');
  replace(' Probier den Umschalter auf <b>Bedeutungssuche</b> — dieselbe Frage, mehr Sinn.', ' Aktiviere <b>Bedeutung</b>, um auch nach Inhalt und Sinn zu suchen.', 'switch help');
  return html;
}
