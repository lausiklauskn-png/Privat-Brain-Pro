// Deliver the Pro shell in its final shape. Runtime adapters attach their
// existing handlers to these nodes instead of rebuilding the first frame.
// The canonical index.html and protected modules are not modified.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const scriptJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// The build reads its own trusted runtime constants: labels and stroke paths
// have one source. Only the bounded literal is evaluated, never the script.
function runtimeLiteral(source, name, opening = '{') {
  const declaration = new RegExp('\\bconst\\s+' + name + '\\s*=\\s*' + (opening === '[' ? 'Object\\.freeze\\(\\s*\\[' : '\\{')).exec(source);
  if (!declaration) throw new Error('Review prerender runtime constant: ' + name);
  const begin = declaration.index + declaration[0].length - 1, stack = [];
  let quote = '', end = -1;
  for (let index = begin; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (character === '\\') index++;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'" || character === '`') quote = character;
    else if (character === '{' || character === '[') stack.push(character);
    else if (character === '}' || character === ']') {
      const expected = character === '}' ? '{' : '[';
      if (stack.pop() !== expected) throw new Error('Unbalanced prerender runtime constant: ' + name);
      if (!stack.length) { end = index + 1; break; }
    }
  }
  if (end < 0 || quote) throw new Error('Incomplete prerender runtime constant: ' + name);
  return Function('"use strict";return (' + source.slice(begin, end) + ');')();
}

/** Apply after branding/adaptSearch, before writing the native index.html. */
export async function prerenderShell(source, root, { version } = {}) {
  let html = source;
  if (html.includes('data-pb-prerender=')) throw new Error('Pro shell has already been prerendered');
  const toolbar = await readFile(join(root, 'native/native-toolbar.js'), 'utf8');
  const input = await readFile(join(root, 'native/native-input-language.js'), 'utf8');
  const speech = await readFile(join(root, 'native/native-speech.js'), 'utf8');
  const paths = runtimeLiteral(toolbar, 'paths');
  const captions = runtimeLiteral(toolbar, 'captions').de;
  const languages = runtimeLiteral(input, 'languages', '[');
  const pages = ['search', 'intake', 'explorer', 'mail', 'dash', 'order', 'dupes', 'settings'];
  if (!Array.isArray(captions) || captions.length !== pages.length || !captions.every(label => typeof label === 'string')) throw new Error('Review prerender tab captions');
  if (!Array.isArray(languages) || languages.length < 4 || !languages.every(item => /^[a-z]{2}$/.test(item.code) && typeof item.name === 'string') || new Set(languages.map(item => item.code)).size !== languages.length || !languages.some(item => item.code === 'de')) throw new Error('Review prerender input languages');
  const icon = (key, extra = '') => {
    if (typeof paths[key] !== 'string') throw new Error('Review prerender stroke icon: ' + key);
    return `<svg class="compact-icon${extra}" data-icon-key="${escape(key)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${escape(paths[key])}"></path></svg>`;
  };
  const swap = (before, after, label) => {
    if (html.split(before).length !== 2) throw new Error('Review Pro shell anchor: ' + label);
    html = html.replace(before, () => after);
  };
  const cut = (pattern, label) => {
    const matches = [...html.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))];
    if (matches.length !== 1) throw new Error('Review Pro shell block: ' + label);
    const match = matches[0];
    html = html.slice(0, match.index) + html.slice(match.index + match[0].length);
    return match;
  };

  swap('<html lang="de">', '<html lang="de" data-pb-prerender="shell">', 'document marker');

  // Keep the original controls, translation attributes and counter IDs. Their
  // compact visual captions are already present before any adapter runs.
  function tab(button) {
    const match = /^<button class="([^"]*)" data-tab="([a-z]+)"([^>]*)>([\s\S]*?)<\/button>$/.exec(button.trim());
    if (!match) throw new Error('Review Pro shell tab markup');
    const [, classes, key, attributes, inner] = match;
    const index = pages.indexOf(key);
    if (index < 0) throw new Error('Unknown Pro shell tab: ' + key);
    const label = escape(captions[index]), only = key === 'search' || key === 'settings';
    return `<button class="${classes} compact-tool${only ? ' compact-icon-only' : ''}" data-tab="${key}"${attributes} aria-label="${label}" title="${label}">${icon(key)}<span class="compact-label">${inner}</span>${only ? '' : `<span class="compact-caption" aria-hidden="true">${label}</span>`}</button>`;
  }
  const main = cut(/  <nav class="tabs main-pages" aria-label="Hauptseiten">([\s\S]*?)<\/nav>\n/, 'main pages');
  const secondary = cut(/  <div class="workspace-tools" aria-label="Werkzeuge">([\s\S]*?)<\/div>\n/, 'secondary pages');
  if (main.index !== secondary.index) throw new Error('Review Pro shell navigation placement');
  const buttons = [...(main[1] + secondary[1]).matchAll(/<button class="tab[^"]*" data-tab="([a-z]+)"[\s\S]*?<\/button>/g)];
  if (buttons.length !== pages.length || new Set(buttons.map(match => match[1])).size !== pages.length) throw new Error('Review Pro shell navigation inventory');
  const byPage = new Map(buttons.map(match => [match[1], tab(match[0])]));
  const palette = `<button type="button" id="pb-palette-button" class="ghost compact-tool compact-icon-only" aria-haspopup="dialog" aria-expanded="false" aria-controls="pb-palette" title="Farbthema wählen" aria-label="Farbthema wählen">${icon('palette')}</button>`;
  const row = `  <div class="native-toolbar-row"><nav class="tabs main-pages" aria-label="Hauptseiten">${pages.slice(0, 7).map(key => byPage.get(key)).join('')}</nav><div class="native-toolbar-quick">${byPage.get('settings')}${palette}</div></div>\n`;
  html = html.slice(0, main.index) + row + html.slice(main.index);

  const header = cut(/    <div class="tools">\n([\s\S]*?)\n    <\/div>\n  <\/header>/, 'header tools');
  let originalTools = header[1];
  const badge = /\s*<span class="badge-off"[\s\S]*?<\/span>\n\s*<\/span>/.exec(originalTools);
  if (!badge) throw new Error('Review Pro shell legacy offline badge');
  originalTools = originalTools.replace(badge[0], '');
  for (const [id, key] of [['themeToggle', 'moon'], ['hardReload', 'refresh']]) {
    const pattern = new RegExp(`<button class="iconbtn" id="${id}"([^>]*)title="([^"]*)" aria-label="[^"]*">([^<]*)</button>`);
    const button = pattern.exec(originalTools);
    if (!button) throw new Error('Review Pro shell header control: ' + id);
    originalTools = originalTools.replace(button[0], `<button class="iconbtn compact-tool" id="${id}"${button[1]}title="${button[2]}" aria-label="${button[2]}">${icon(key)}<span class="compact-label">${button[3]}</span></button>`);
  }
  const networkWords = runtimeLiteral(toolbar, 'offlineWords').de;
  if (!Array.isArray(networkWords) || typeof networkWords[1] !== 'string') throw new Error('Review Pro shell network captions');
  // ProNetwork blocks remote work until the native state has been confirmed.
  // The initial lamp therefore reflects that real conservative state.
  const offline = escape(networkWords[1]), back = '← Zurück', forward = 'Vorwärts →', menu = 'App-Menü';
  const navigation = `<nav class="native-navigation" aria-label="${back} / ${forward}">${[[back, 'back'], [forward, 'next']].map(([label, key]) => `<button class="ghost compact-tool" type="button" disabled aria-label="${label}" title="${label}">${icon(key)}<span class="compact-label">${label}</span></button>`).join('')}</nav>`;
  const views = '<section class="native-menu-views" hidden><p class="native-menu-heading">Ansichten</p><div class="workspace-tools" aria-label="Werkzeuge"></div></section>';
  const headerTools = `    <div class="tools"><button class="native-net-lamp compact-tool" type="button" role="switch" aria-label="${offline}" title="${offline}" aria-checked="true" data-state="off"><span class="native-net-dot" aria-hidden="true"></span></button>${navigation}<details class="native-options"><summary class="ghost compact-tool" aria-label="${menu}" title="${menu}">${icon('menu')}<span class="compact-label">${menu}</span></summary><div class="native-options-panel">${views}${originalTools.trim()}<button class="ghost native-offline-switch" type="button" role="switch" aria-checked="true" title="${offline}">${offline}</button><p class="native-network-error" role="status" hidden></p></div></details></div>\n  </header>`;
  html = html.slice(0, header.index) + headerTools + html.slice(header.index);

  if (version !== undefined) {
    if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-preview\.\d+)?(?:-debug)?$/.test(version)) throw new Error('Review Pro shell build version');
    const clean = version.replace(/-debug$/, ''), legacy = /^(\d+)\.(\d+)\.\d+-preview\.(\d+)$/.exec(clean);
    const shown = 'v' + (legacy ? `${legacy[1]}.${legacy[2]}.${legacy[3]}` : clean);
    swap('<h1>Private Brain Pro</h1>', `<h1>Private Brain Pro <button type="button" class="pb-version" id="pbVersion" aria-label="Private Brain Pro ${shown}" title="Private Brain Pro ${shown}">${shown}</button></h1>`, 'build version');
  }

  // The original speech adapter recognizes and reuses this exact stroke SVG.
  const microphone = /<button id="mic" class="ghost"([^>]*)>🎤<\/button>/.exec(html);
  const stroke = /path\.setAttribute\('d', '([^']+)'\)/.exec(speech);
  if (!microphone || !stroke) throw new Error('Review Pro shell speech control');
  const microphoneSvg = `<svg class="pb-speech-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${escape(stroke[1])}"></path></svg>`;
  swap(microphone[0], `<button id="mic" class="ghost"${microphone[1]}>${microphoneSvg}</button>`, 'speech icon');
  const inputWords = runtimeLiteral(input, 'words');
  const inputLabels = Object.fromEntries(Object.entries(inputWords).map(([code, copy]) => [code, copy.label]));
  if (typeof inputLabels.de !== 'string' || !Object.values(inputLabels).every(value => typeof value === 'string')) throw new Error('Review prerender input-language captions');
  const languageLabel = escape(inputLabels.de + ': ' + languages.find(item => item.code === 'de').name);
  const languageMenu = `<details id="pb-input-language-quick" class="pb-input-language-quick"><summary id="pb-search-language" class="compact-tool" aria-controls="pb-search-language-menu" aria-expanded="false" aria-label="${languageLabel}" title="${languageLabel}">DE</summary><div id="pb-search-language-menu" class="pb-input-language-menu" role="group" aria-label="Such- und Diktatsprache">${languages.map(item => `<button type="button" data-input-language="${item.code}" lang="${item.code}" aria-pressed="${item.code === 'de'}">${escape(item.name)}</button>`).join('')}</div></details>`;
  // This parser-local bootstrap runs as soon as the finished chip exists. It
  // reads the same preferences as the later authoritative input adapter, with
  // no storage writes, native calls, locale guessing or delayed repaint.
  const restoreLanguage = `<script data-pb-startup="input-language">(()=>{const languages=${scriptJson(languages.map(({code, name}) => ({code, name})))},labels=${scriptJson(inputLabels)},read=key=>{try{return localStorage.getItem(key);}catch{return null;}},valid=code=>languages.some(item=>item.code===code);let code=read('pb_input_language_v1');if(!valid(code)){const ui=read('pb_lang')||String(document.documentElement.lang||'de').slice(0,2);code=valid(ui)?ui:'de';}const current=languages.find(item=>item.code===code),button=document.getElementById('pb-search-language'),menu=document.getElementById('pb-search-language-menu');if(!button||!menu)return;const ui=String(read('pb_lang')||document.documentElement.lang||'de').slice(0,2),label=(labels[ui]||labels.de)+': '+current.name;button.textContent=code.toUpperCase();button.setAttribute('aria-label',label);button.title=label;menu.setAttribute('aria-label',labels[ui]||labels.de);for(const choice of menu.querySelectorAll('[data-input-language]'))choice.setAttribute('aria-pressed',String(choice.dataset.inputLanguage===code));const query=document.getElementById('q');if(query){const override=query.getAttribute('data-pb-input-language');query.lang=valid(override)?override:code;}})();</script>`;
  swap('      <div class="toggle" id="mode">', `      ${languageMenu}\n      ${restoreLanguage}\n      <div class="toggle" id="mode">`, 'input language');

  // Preserve hidden original decoration text for equality checks and translators.
  const saved = '<button id="fSave" class="ghost" title="Diese Suche als Knopf speichern">💾 merken</button>';
  swap(saved, `<button id="fSave" class="ghost" title="Diese Suche als Knopf speichern">${icon('save', ' native-content-icon')}<span class="pb-icon-fallback" hidden aria-hidden="true">💾 </span>merken</button>`, 'save search icon');
  swap('<button id="fReset" class="ghost" title="Filter zurücksetzen">↺</button>', `<button id="fReset" class="ghost" title="Filter zurücksetzen" aria-label="Filter zurücksetzen">${icon('refresh', ' native-content-icon')}<span class="pb-icon-fallback" hidden aria-hidden="true">↺</span></button>`, 'reset filter icon');
  // The original inline translator replaces a data-i18n node's innerHTML.
  // Keep the stroke outside that target, and remove only this known decorative
  // prefix from the four bundled translations. Language changes then update
  // the caption without ever replacing the already-painted SVG with an emoji.
  swap('<span data-i18n="combine">🔗 Verwandtes mitfinden (Mehrschritt)</span>', `<span class="pb-combine-caption">${icon('link', ' native-content-icon')}<span data-i18n="combine">Verwandtes mitfinden (Mehrschritt)</span></span>`, 'related search icon');
  const combineTranslations = [...html.matchAll(/\bcombine:("(?:[^"\\]|\\.)*")/g)];
  if (combineTranslations.length !== 4) throw new Error('Review Pro shell related-search translations');
  for (const match of combineTranslations) {
    const label = JSON.parse(match[1]);
    if (!label.startsWith('🔗 ')) throw new Error('Review Pro shell related-search decoration');
    swap(match[0], 'combine:' + JSON.stringify(label.slice('🔗 '.length)), 'related-search translation');
  }
  // No catalogue-empty claim is painted before the real catalogue has loaded.
  // renderResults already owns style.display and reveals it for a real empty catalogue.
  swap('<div class="empty" id="searchEmpty">', '<div class="empty" id="searchEmpty" style="display:none">', 'catalogue pending state');

  // Legal links remain reachable in Settings without a second layout below the
  // window. Runtime keeps these original nodes and their existing listeners.
  const footer = cut(/  <\/section>\n\n  (<footer>[\s\S]*?<\/footer>)\n/, 'footer after settings');
  const family = cut(/<div class="fp-badge-wrap">[\s\S]*?<div class="fp-copy">[\s\S]*?<\/div>\n<\/div>\n/, 'family badge');
  html = html.slice(0, footer.index) + `  <p class="native-status" role="status"></p>\n  ${footer[1]}\n${family[0]}  </section>\n` + html.slice(footer.index);
  if (html.indexOf('id="panel-settings"') > html.indexOf('<footer>')) throw new Error('Review Pro shell settings footer');
  return html;
}
