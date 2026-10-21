/* Categories by suggestion (Klaus 2026-10-21: "Vorschlag, ein Tipp").
   Fixed word lists recognise invoices, pay slips, health papers, contracts and insurance.
   From two matching files the explorer suggests the category; one tap creates it. A category is
   only a view: files stay where they are, new matching files appear by themselves, and
   "Gehört nicht hierher" takes one file out for good. */
(() => {
  'use strict';
  if (!window.PBWorkspace || typeof CATALOG === 'undefined') return;
  const languages = ['de', 'en', 'ru', 'pl'];
  const lang = () => Math.max(0, languages.indexOf(document.documentElement.lang.slice(0, 2)));
  const labels = {
    looks: ['sehen aus wie', 'look like', 'похожи на', 'wyglądają jak'],
    files: ['Dateien', 'files', 'файлов', 'plików'],
    example: ['z. B.', 'e.g.', 'напр.', 'np.'],
    create: ['Anlegen', 'Create', 'Создать', 'Utwórz'],
    no: ['Nein danke', 'No thanks', 'Нет, спасибо', 'Nie, dziękuję'],
    question: ['Kategorie anlegen? Nur eine Ansicht, die Dateien bleiben, wo sie sind.', 'Create category? Only a view, files stay where they are.', 'Создать категорию? Только вид, файлы остаются на месте.', 'Utworzyć kategorię? Tylko widok, pliki zostają na miejscu.'],
    viewHelp: ['Neue passende Dateien kommen von selbst hinein. Die Dateien bleiben, wo sie sind.', 'New matching files appear by themselves. Files stay where they are.', 'Новые подходящие файлы появляются сами. Файлы остаются на месте.', 'Nowe pasujące pliki pojawiają się same. Pliki zostają na miejscu.'],
    dissolve: ['Kategorie auflösen', 'Remove category', 'Удалить категорию', 'Usuń kategorię'],
    notHere: ['Gehört nicht hierher', 'Does not belong', 'Не сюда', 'Nie należy tu'],
    again: ['Abgelehnte Vorschläge wieder zeigen', 'Show declined suggestions again', 'Снова показать отклонённые', 'Pokaż ponownie odrzucone'],
    removed: ['Herausgenommen. Die Datei bleibt erhalten.', 'Taken out. The file is kept.', 'Убрано. Файл сохранён.', 'Usunięto z widoku. Plik pozostaje.']
  };
  const t = key => labels[key][lang()];
  // strong: a word that names the paper itself; words: typical contents. Folded (no umlauts, ß → ss).
  const DEFS = [
    { key: 'invoice', icon: '🧾', name: ['Rechnungen', 'Invoices', 'Счета', 'Faktury'],
      strong: ['rechnung', 'invoice', 'faktura', 'quittung', 'beleg'],
      words: ['rechnungsnummer', 'rechnungsbetrag', 'rechnungsdatum', 'zahlbar bis', 'zahlungsziel', 'zu zahlen', 'mwst', 'umsatzsteuer', 'ust-id', 'netto', 'gesamtbetrag', 'faellig', 'fallig', 'iban', 'kundennummer'] },
    { key: 'salary', icon: '💶', name: ['Gehalt', 'Salary', 'Зарплата', 'Wynagrodzenie'],
      strong: ['gehaltsabrechnung', 'lohnabrechnung', 'entgeltabrechnung', 'bezugeabrechnung', 'payslip', 'pay slip'],
      words: ['bruttolohn', 'bruttogehalt', 'nettolohn', 'nettogehalt', 'lohnsteuer', 'sozialversicherung', 'auszahlungsbetrag', 'steuerklasse', 'rentenversicherung', 'arbeitgeber'] },
    { key: 'health', icon: '🩺', name: ['Gesundheit', 'Health', 'Здоровье', 'Zdrowie'],
      strong: ['arztbrief', 'befund', 'krankenakte', 'rezept', 'arbeitsunfahigkeit', 'arbeitsunfaehigkeit', 'krankmeldung', 'impfpass', 'laborwerte'],
      words: ['diagnose', 'therapie', 'physiotherapie', 'praxis', 'klinik', 'patient', 'behandlung', 'medikament', 'krankenkasse', 'facharzt', 'dr. med'] },
    { key: 'contract', icon: '📑', name: ['Verträge', 'Contracts', 'Договоры', 'Umowy'],
      strong: ['vertrag', 'contract', 'vereinbarung', 'kundigung', 'kuendigung'],
      words: ['vertragsnummer', 'laufzeit', 'kundigungsfrist', 'kuendigungsfrist', 'vertragspartner', 'unterschrift', 'agb', 'mindestlaufzeit'] },
    { key: 'insurance', icon: '🛡', name: ['Versicherung', 'Insurance', 'Страхование', 'Ubezpieczenie'],
      strong: ['versicherung', 'police', 'versicherungsschein', 'insurance'],
      words: ['versicherungsnummer', 'beitrag', 'versicherungsnehmer', 'schadensmeldung', 'selbstbeteiligung', 'deckung', 'haftpflicht'] }
  ];
  const MIN_SCORE = 3, MIN_FILES = 2, KEY = 'pb_topics';
  const fold = s => String(s || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
  function state() { try { const v = JSON.parse(localStorage.getItem(KEY)); return { accepted: Array.isArray(v?.accepted) ? v.accepted : [], declined: Array.isArray(v?.declined) ? v.declined : [] }; } catch { return { accepted: [], declined: [] }; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* Preference only. */ } }
  const cache = new Map();
  /** Score per category: a strong word in the name counts 2, each distinct signal in the text 1. */
  function scores(r) {
    const id = r.hash + '|' + (r.name || '').length + '|' + (r.snippet || '').length + '|' + (r.summary || '').length;
    const hit = cache.get(r.hash);
    if (hit?.id === id) return hit.value;
    const name = fold(r.name), text = fold([r.snippet, r.summary, r.mailBody, r.ocrText, r.caption].filter(Boolean).join(' ').slice(0, 20000));
    const value = {};
    for (const d of DEFS) {
      let score = 0;
      if (d.strong.some(w => name.includes(w))) score += 2;
      for (const w of d.strong) if (text.includes(w)) score += 1;
      for (const w of d.words) if (text.includes(w) || name.includes(w)) score += 1;
      value[d.key] = score;
    }
    cache.set(r.hash, { id, value }); return value;
  }
  // The same files the explorer lists: no mails from "Alle Konten", no drafts.
  const records = () => CATALOG.filter(r => !(r.mailIndex && !r.mailLegacy) && r.mailKind !== 'draft');
  const fits = (r, key) => !(r.topicNo || []).includes(key) && scores(r)[key] >= MIN_SCORE;
  const quote = w => [['„', '“'], ['“', '”'], ['«', '»'], ['„', '”']][lang()].join(w);
  const nameOf = d => d.icon + ' ' + d.name[lang()];
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function button(text, fn, cls = 'ghost') { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; }
  const refresh = () => window.PBWorkspace.refresh();

  window.PBExplorerTopics = {
    views() {
      const s = state(), list = records();
      return DEFS.filter(d => s.accepted.includes(d.key)).map(d => ({ key: d.key, label: nameOf(d), count: list.filter(r => fits(r, d.key)).length, match: r => fits(r, d.key) }));
    },
    notice(files) {
      const s = state(), list = records();
      for (const d of DEFS) {
        if (s.accepted.includes(d.key) || s.declined.includes(d.key)) continue;
        const found = list.filter(r => fits(r, d.key));
        if (found.length < MIN_FILES) continue;
        const box = el('div', 'topic-suggest'); box.dataset.topicSuggest = d.key;
        const sample = found.slice(0, 2).map(r => r.name).join(', ');
        box.append(el('p', '', d.icon + ' ' + found.length + ' ' + t('files') + ' ' + t('looks') + ' ' + quote(d.name[lang()]) + ' (' + t('example') + ' ' + sample + '). ' + t('question')));
        box.append(button(t('create'), () => { const v = state(); v.accepted = [...new Set([...v.accepted, d.key])]; v.declined = v.declined.filter(k => k !== d.key); save(v); refresh(); }, 'primary'),
          button(t('no'), () => { const v = state(); v.declined = [...new Set([...v.declined, d.key])]; save(v); refresh(); }));
        files.append(box);
      }
      if (s.declined.length) { const b = button(t('again'), () => { const v = state(); v.declined = []; save(v); refresh(); }); b.dataset.topicAgain = '1'; b.classList.add('topic-again'); files.append(b); }
    },
    head(files, key) {
      const box = el('div', 'topic-head');
      box.append(el('p', 'hint', t('viewHelp')), button(t('dissolve'), () => {
        // Dissolving counts as "Nein danke", so the suggestion does not come straight back.
        const v = state(); v.accepted = v.accepted.filter(k => k !== key); v.declined = [...new Set([...v.declined, key])]; save(v);
        window.PBWorkspace.restoreExplorer({ ...window.PBWorkspace.explorerState(), path: '' });
      }));
      files.append(box);
    },
    rowTool(r, key) {
      const b = button(t('notHere'), async () => {
        r.topicNo = [...new Set([...(r.topicNo || []), key])];
        await idbPut('catalog', r); refresh(); if (typeof toast === 'function') toast(t('removed'));
      });
      b.dataset.topicNot = key; return b;
    },
    scores, DEFS
  };
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  refresh();
})();
