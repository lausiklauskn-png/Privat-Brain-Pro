/* App-owned dictation: Android/Windows supplies a native speech dialog. Only
   recognized text returns to the page, and a microphone never starts by itself. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProSpeech;
  if (typeof plugin?.listen !== 'function') return;
  const LANG = { de: 'de-DE', en: 'en-US', ru: 'ru-RU', pl: 'pl-PL' };
  const WORDS = {
    de: ['Sprechen Sie jetzt', 'Auf diesem Gerät ist keine Spracherkennung eingerichtet. Tippen geht immer.', 'Spracheingabe hat nicht geklappt.', 'Diktieren', 'Zuhören …'],
    en: ['Speak now', 'No speech recognition is set up on this device. Typing always works.', 'Voice input did not work.', 'Dictate', 'Listening …'],
    ru: ['Говорите', 'На этом устройстве не настроено распознавание речи. Ввод текста работает всегда.', 'Голосовой ввод не удался.', 'Диктовать', 'Слушаю …'],
    pl: ['Mów teraz', 'Na tym urządzeniu nie skonfigurowano rozpoznawania mowy. Pisanie zawsze działa.', 'Wprowadzanie głosowe nie powiodło się.', 'Dyktuj', 'Słucham …']
  };
  const lang = () => Object.hasOwn(LANG, document.documentElement.lang) ? document.documentElement.lang : 'de';
  const say = i => WORDS[lang()][i];
  const note = message => (typeof window.toast === 'function' ? window.toast(message) : alert(message));
  const candidates = 'input,textarea,[contenteditable="true"],[contenteditable="plaintext-only"],[contenteditable=""]';
  const controls = new Map(), remembered = new WeakMap();
  let busy = false;

  function eligible(field) {
    if (!field.isConnected || field.matches(':disabled,[readonly]') || field.closest('[data-no-dictate],[data-secret],[data-pb-private]')) return false;
    if (['trShares', 'aiKey'].includes(field.id) || /(?:^|\s)(?:current-password|new-password|one-time-code)(?:\s|$)/.test(field.autocomplete || '')) return false;
    if (field instanceof HTMLInputElement) return ['text', 'search', 'email', 'url', 'tel'].includes(field.type);
    if (field instanceof HTMLTextAreaElement) return true;
    if (!field.isContentEditable) return false;
    return !field.parentElement?.closest('[contenteditable="true"],[contenteditable="plaintext-only"],[contenteditable=""]');
  }
  function fieldName(field) {
    const own = field.getAttribute('aria-label');
    if (own) return own.trim();
    const labelled = (field.getAttribute('aria-labelledby') || '').split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim();
    if (labelled) return labelled;
    const label = [...(field.labels || [])].map(node => node.textContent).join(' ').trim();
    return label || field.getAttribute('placeholder') || '';
  }
  function paint(mic, field) {
    const active = mic.dataset.speaking === 'true', name = fieldName(field);
    const label = (active ? say(4) : say(3)) + (name ? ': ' + name : '');
    if (mic.title !== label) mic.title = label;
    if (mic.getAttribute('aria-label') !== label) mic.setAttribute('aria-label', label);
    if (!mic.querySelector(':scope > svg.pb-speech-icon')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('pb-speech-icon'); svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.setAttribute('width', '18'); svg.setAttribute('height', '18');
      svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3m-4 0h8');
      svg.append(path); mic.replaceChildren(svg);
    }
  }
  function snapshot(field) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      let start = field.value.length, end = start;
      try { if (field.selectionStart != null) { start = field.selectionStart; end = field.selectionEnd ?? start; } } catch { /* email/URL controls may not expose a text selection */ }
      const saved = { value: field.value, start, end }; remembered.set(field, saved); return saved;
    }
    const selection = getSelection();
    if (selection?.rangeCount && field.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      const saved = { value: field.textContent, range: selection.getRangeAt(0).cloneRange() }; remembered.set(field, saved); return saved;
    }
    return remembered.get(field) || { value: field.textContent, range: null };
  }
  function insert(field, text, saved) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      let { start, end } = saved;
      // A user can keep typing while a recognizer is open. Never replace those
      // newer edits with the earlier value or a now-outdated selected range.
      if (field.value !== saved.value) {
        const fresh = document.activeElement === field ? snapshot(field) : { start: field.value.length, end: field.value.length };
        start = fresh.start; end = fresh.end;
      }
      const before = field.value.slice(0, start), after = field.value.slice(end);
      const left = before && !/\s$/.test(before) ? ' ' : '';
      const right = after && /^[\p{L}\p{N}]/u.test(after) && /[\p{L}\p{N}]$/u.test(text) ? ' ' : '';
      let inserted = left + text + right;
      if (field.maxLength >= 0) inserted = inserted.slice(0, Math.max(0, field.maxLength - before.length - after.length));
      if (!inserted) return;
      field.value = before + inserted + after;
      field.focus();
      try { field.setSelectionRange(start + inserted.length, start + inserted.length); } catch { /* not supported by email/URL inputs */ }
    } else {
      let range = saved.range;
      if (field.textContent !== saved.value || !range || !field.contains(range.commonAncestorContainer)) {
        range = document.createRange(); range.selectNodeContents(field); range.collapse(false);
      }
      const node = document.createTextNode(text); range.deleteContents(); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
      field.focus(); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    }
    field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }
  async function dictate(mic, field) {
    if (busy || !eligible(field)) return;
    const saved = snapshot(field);
    busy = true; mic.dataset.speaking = 'true'; mic.setAttribute('aria-busy', 'true'); paint(mic, field);
    try {
      const language = window.PBInputLanguage?.locale?.(field) || LANG[lang()];
      const result = await plugin.listen({ language, prompt: say(0) });
      const text = typeof result?.text === 'string' ? result.text.trim().slice(0, 2000) : '';
      if (!result?.cancelled && text && eligible(field)) insert(field, text, saved);
    } catch (error) {
      note(say(String(error?.code || error?.message || '').includes('UNAVAILABLE') ? 1 : 2));
    } finally { busy = false; delete mic.dataset.speaking; mic.removeAttribute('aria-busy'); paint(mic, field); }
  }
  function add(field) {
    const focused = document.activeElement === field, saved = focused ? snapshot(field) : null;
    const path = node => { const out = []; for (let at = node; at && at !== field; at = at.parentNode) out.unshift([...at.parentNode.childNodes].indexOf(at)); return out; };
    const richSelection = saved?.range && field.contains(saved.range.commonAncestorContainer) ? {
      start: path(saved.range.startContainer), startOffset: saved.range.startOffset,
      end: path(saved.range.endContainer), endOffset: saved.range.endOffset
    } : null;
    const mic = document.createElement('button'); mic.type = 'button'; mic.className = 'ghost compact-tool pb-dictate';
    const wrap = document.createElement('span'); wrap.className = 'pb-dictate-wrap';
    field.before(wrap); wrap.append(field, mic); field.dataset.pbDictate = '1';
    // Reparenting an already focused field can blur it and move live DOM
    // ranges. Restore the same focus/selection without emitting input events.
    if (focused) {
      field.focus({ preventScroll: true });
      if (richSelection) {
        const node = steps => steps.reduce((at, index) => at.childNodes[index], field), range = document.createRange();
        range.setStart(node(richSelection.start), richSelection.startOffset); range.setEnd(node(richSelection.end), richSelection.endOffset);
        const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
        remembered.set(field, { value: field.textContent, range: range.cloneRange() });
      } else { try { field.setSelectionRange(saved.start, saved.end); } catch { /* email/URL inputs still retain focus */ } }
    }
    mic.addEventListener('pointerdown', () => snapshot(field));
    mic.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); void dictate(mic, field); });
    controls.set(field, { mic, wrap }); paint(mic, field); window.PBInputLanguage?.applyField?.(field);
  }
  function equip() {
    for (const [field, { mic, wrap }] of controls) {
      if (!eligible(field)) {
        if (wrap.isConnected && field.parentElement === wrap) { wrap.before(field); wrap.remove(); }
        else { mic.remove(); if (wrap.isConnected && !wrap.childNodes.length) wrap.remove(); }
        delete field.dataset.pbDictate; controls.delete(field);
      } else paint(mic, field);
    }
    for (const field of document.querySelectorAll(candidates)) {
      if (!eligible(field) || field.id === 'q' || controls.has(field)) continue;
      add(field);
    }
    const search = document.getElementById('q'), mic = document.getElementById('mic');
    if (search && mic) { mic.classList.add('compact-tool', 'pb-search-dictate'); paint(mic, search); window.PBInputLanguage?.applyField?.(search); }
  }
  let pending = false;
  const refresh = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; equip(); }); } };
  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang', 'disabled', 'readonly', 'type', 'contenteditable', 'data-no-dictate'] });
  window.addEventListener('pb-input-language-change', refresh);
  document.addEventListener('selectionchange', () => {
    const field = document.activeElement;
    if (field?.matches(candidates) && eligible(field)) snapshot(field);
  });
  // Capture overrides the inherited browser Web Speech handler, which is
  // advertised but refused by Android WebView on the user's device.
  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.('#mic')) { const field = document.getElementById('q'); if (field) snapshot(field); }
  }, true);
  document.addEventListener('click', event => {
    const mic = event.target.closest?.('#mic'); if (!mic) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const field = document.getElementById('q'); if (field) void dictate(mic, field);
  }, true);
  equip();
})();
