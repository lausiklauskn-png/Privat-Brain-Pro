/* The multilingual embedding model does not take a UI-language argument.
   This independent preference controls actual speech-recognition and input
   language. It never translates, rewrites or filters a semantic query. */
(() => {
  'use strict';
  if (window.PBInputLanguage) return;
  const KEY = 'pb_input_language_v1';
  const languages = Object.freeze([
    {code:'de', locale:'de-DE', name:'Deutsch'},
    {code:'en', locale:'en-US', name:'English'},
    {code:'ru', locale:'ru-RU', name:'Русский'},
    {code:'pl', locale:'pl-PL', name:'Polski'},
    {code:'tr', locale:'tr-TR', name:'Türkçe'},
    {code:'ar', locale:'ar-SA', name:'العربية'},
    {code:'uk', locale:'uk-UA', name:'Українська'},
    {code:'es', locale:'es-ES', name:'Español'},
    {code:'fr', locale:'fr-FR', name:'Français'},
    {code:'it', locale:'it-IT', name:'Italiano'},
    {code:'pt', locale:'pt-PT', name:'Português'}
  ].map(Object.freeze));
  const words = {
    de: {title:'Welche Sprache sprichst du?', label:'Such- und Diktatsprache', quick:'Ich spreche',
      help:'Die Bedeutungssuche ist mehrsprachig. Diese Wahl steuert Diktat und Eingabesprache. Treffer bleiben sprachübergreifend; die Sprache der Oberfläche wird getrennt gewählt.',
      saved:'Gewählt: {name}. Bleibt unabhängig von der Sprache der Oberfläche.',
      unsaved:'Die Auswahl gilt in dieser Sitzung; sie konnte nicht dauerhaft gespeichert werden.'},
    en: {title:'Which language do you speak?', label:'Search and dictation language', quick:'I speak',
      help:'Meaning search is multilingual. This choice controls dictation and input language. Results remain cross-language; the interface language is selected separately.',
      saved:'Selected: {name}. Independent of the interface language.',
      unsaved:'The choice applies to this session; it could not be saved permanently.'},
    ru: {title:'На каком языке вы говорите?', label:'Язык поиска и диктовки', quick:'Я говорю',
      help:'Поиск по смыслу многоязычный. Выбор задаёт язык диктовки и ввода. Результаты могут быть на разных языках; язык интерфейса выбирается отдельно.',
      saved:'Выбрано: {name}. Не зависит от языка интерфейса.',
      unsaved:'Выбор действует в этом сеансе; сохранить настройку не удалось.'},
    pl: {title:'W jakim języku mówisz?', label:'Język wyszukiwania i dyktowania', quick:'Mówię po',
      help:'Wyszukiwanie znaczeniowe jest wielojęzyczne. Ten wybór określa język dyktowania i wprowadzania tekstu. Wyniki nadal obejmują różne języki; język interfejsu wybiera się osobno.',
      saved:'Wybrano: {name}. Niezależnie od języka interfejsu.',
      unsaved:'Wybór obowiązuje w tej sesji; nie udało się go zapisać na stałe.'}
  };
  const copy = () => words[String(document.documentElement.lang || 'de').slice(0,2)] || words.de;
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const valid = code => languages.some(item => item.code === code);
  let current = read(KEY), unsaved = false;
  if (!valid(current)) {
    const ui = read('pb_lang') || String(document.documentElement.lang || 'de').slice(0,2);
    current = valid(ui) ? ui : 'de';
    save();
  }
  const fields = new Set();
  function save() {
    try { localStorage.setItem(KEY,current); unsaved = false; }
    catch { unsaved = true; }
  }
  function fieldCode(field) {
    const override = field?.getAttribute?.('data-pb-input-language');
    return valid(override) ? override : current;
  }
  function locale(field) { return languages.find(item => item.code === fieldCode(field)).locale; }
  function applyField(field) {
    if (!field || field.readOnly || field.disabled || field.matches?.('#trShares,#aiKey') || field.closest?.('[data-no-dictate],[data-secret],[data-pb-private]')) return;
    const tag = field.tagName?.toLowerCase();
    if (tag === 'input' && !['text','search','email','url','tel'].includes(field.type)) return;
    if (tag !== 'input' && tag !== 'textarea' && !field.isContentEditable) return;
    if (/(?:^|\s)(?:current-password|new-password|one-time-code)(?:\s|$)/.test(field.getAttribute?.('autocomplete') || '')) return;
    fields.add(field);
    const code = fieldCode(field);
    if (field.lang !== code) field.lang = code;
    if (!field.hasAttribute('dir')) field.dir = 'auto';
    if (!field.hasAttribute('spellcheck') && (tag === 'textarea' || field.isContentEditable || ['text','search'].includes(field.type))) field.spellcheck = true;
  }
  function picker(id) {
    const select = document.createElement('select');
    select.id = id; select.className = 'pb-input-language-select';
    for (const item of languages) {
      const option = document.createElement('option');
      option.value = item.code; option.textContent = item.name; option.lang = item.code;
      select.append(option);
    }
    select.addEventListener('change', () => choose(select.value));
    return select;
  }
  function mount() {
    const searchbox = document.querySelector('#panel-search .searchbox');
    if (searchbox && !document.getElementById('pb-input-language-quick')) {
      const quick = document.createElement('div'); quick.id = 'pb-input-language-quick';
      quick.className = 'pb-input-language-quick';
      const label = document.createElement('label'); label.htmlFor = 'pb-search-language'; label.dataset.inputLanguageCopy = 'quick';
      quick.append(label, picker('pb-search-language')); searchbox.after(quick);
    }
    const panel = document.getElementById('panel-settings');
    if (panel && !document.getElementById('pb-input-language-settings')) {
      const box = document.createElement('section'); box.id = 'pb-input-language-settings'; box.className = 'note pb-input-language-settings';
      const title = document.createElement('h3'); title.dataset.inputLanguageCopy = 'title';
      const help = document.createElement('p'); help.className = 'hint'; help.dataset.inputLanguageCopy = 'help';
      const label = document.createElement('label'); label.htmlFor = 'pb-input-language-setting'; label.dataset.inputLanguageCopy = 'label';
      const status = document.createElement('p'); status.className = 'hint pb-input-language-status'; status.setAttribute('role','status');
      box.append(title,help,label,picker('pb-input-language-setting'),status); panel.prepend(box);
    }
  }
  function refresh() {
    mount(); const text = copy();
    for (const node of document.querySelectorAll('[data-input-language-copy]')) {
      const value = text[node.dataset.inputLanguageCopy]; if (node.textContent !== value) node.textContent = value;
    }
    for (const select of document.querySelectorAll('.pb-input-language-select')) {
      select.setAttribute('aria-label',text.label); select.title = text.help;
      if (select.value !== current) select.value = current;
    }
    const status = document.querySelector('.pb-input-language-status');
    if (status) {
      const value = unsaved ? text.unsaved : text.saved.replace('{name}',languages.find(item => item.code === current).name);
      if (status.textContent !== value) status.textContent = value;
    }
    for (const field of fields) { if (!field.isConnected) fields.delete(field); else applyField(field); }
    applyField(document.getElementById('q'));
  }
  function choose(code) {
    if (!valid(code)) return false;
    current = code; save(); refresh();
    window.dispatchEvent(new CustomEvent('pb-input-language-change',{detail:{code:current,locale:locale()}}));
    return true;
  }
  window.PBInputLanguage = Object.freeze({current:()=>current, locale, choose, refresh, applyField, languages});
  let pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; refresh(); }); }
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  refresh();
})();
