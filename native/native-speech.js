/* Search by voice in the native app (Klaus 2026-10-21: "In der nativen App … ist das Mikrofon nicht
   verfügbar"). The Android WebView has no Web Speech API, so 🎤 asks Android's own speech dialog
   (ProSpeech). The app receives only the recognized text and puts it into the search field. */
(() => {
  'use strict';
  const plugin = window.Capacitor?.Plugins?.ProSpeech;
  // Klaus 2026-10-22: the WebView announces webkitSpeechRecognition but refuses it ("Mikrofon nicht verfügbar oder
  // abgelehnt"). In the app, Android's own speech dialog is used always.
  if (!plugin) return;
  const LANG = { de: 'de-DE', en: 'en-US', ru: 'ru-RU', pl: 'pl-PL' };
  const WORDS = {
    de: ['Sprechen Sie jetzt', 'Auf diesem Gerät ist keine Spracherkennung eingerichtet. Tippen geht immer.', 'Spracheingabe hat nicht geklappt.'],
    en: ['Speak now', 'No speech recognition is set up on this device. Typing always works.', 'Voice input did not work.'],
    ru: ['Говорите', 'На этом устройстве не настроено распознавание речи. Ввод текста работает всегда.', 'Голосовой ввод не удался.'],
    pl: ['Mów teraz', 'Na tym urządzeniu nie skonfigurowano rozpoznawania mowy. Pisanie zawsze działa.', 'Wprowadzanie głosowe nie powiodło się.']
  };
  const lang = () => document.documentElement.lang in LANG ? document.documentElement.lang : 'de';
  const say = i => WORDS[lang()][i];
  const note = message => (typeof window.toast === 'function' ? window.toast(message) : alert(message));
  let busy = false;
  async function listen(mic) {
    if (busy) return;
    busy = true; const was = mic.textContent; mic.textContent = '🔴'; mic.setAttribute('aria-busy', 'true');
    try {
      const result = await plugin.listen({ language: LANG[lang()], prompt: say(0) });
      const text = typeof result?.text === 'string' ? result.text.trim().slice(0, 500) : '';
      if (result?.cancelled || !text) return;
      const q = document.getElementById('q');
      if (!q) return;
      q.value = text; q.dispatchEvent(new Event('input', { bubbles: true })); q.focus();
    } catch (error) {
      note(say(String(error?.code || error?.message || '').includes('UNAVAILABLE') ? 1 : 2));
    } finally { busy = false; mic.textContent = was; mic.removeAttribute('aria-busy'); }
  }
  // Klaus 2026-10-22: "Wenn der Text eingegeben werden kann, dann bitte auch mit Mikrofon". Every larger text
  // field (question to the AI about a file, writing a mail, notes …) gets 🎤; the spoken text goes in at the cursor.
  const DICTATE = { de: 'Diktieren (Android-Spracheingabe)', en: 'Dictate (Android voice input)', ru: 'Диктовать (голосовой ввод Android)', pl: 'Dyktuj (wprowadzanie głosowe Android)' };
  async function dictate(mic, field) {
    if (busy) return;
    busy = true; mic.textContent = '🔴'; mic.setAttribute('aria-busy', 'true');
    try {
      const result = await plugin.listen({ language: LANG[lang()], prompt: say(0) });
      const text = typeof result?.text === 'string' ? result.text.trim().slice(0, 2000) : '';
      if (result?.cancelled || !text) return;
      const start = field.selectionStart ?? field.value.length, end = field.selectionEnd ?? start;
      const before = field.value.slice(0, start), after = field.value.slice(end);
      const glue = before && !/\s$/.test(before) ? ' ' : '';
      field.value = before + glue + text + after;
      const at = (before + glue + text).length; field.focus(); field.setSelectionRange?.(at, at);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
      note(say(String(error?.code || error?.message || '').includes('UNAVAILABLE') ? 1 : 2));
    } finally { busy = false; mic.textContent = '🎤'; mic.removeAttribute('aria-busy'); }
  }
  function equip() {
    // Not for codes (recovery shares): dictating them makes no sense.
    for (const field of document.querySelectorAll('textarea:not([data-pb-dictate]):not(#trShares):not([data-no-dictate])')) {
      if (field.readOnly || field.disabled) continue;
      field.dataset.pbDictate = '1';
      const mic = document.createElement('button');
      mic.type = 'button'; mic.className = 'ghost pb-dictate'; mic.textContent = '🎤';
      mic.title = mic.ariaLabel = DICTATE[lang()];
      mic.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); dictate(mic, field); });
      field.after(mic);
    }
    for (const mic of document.querySelectorAll('.pb-dictate')) mic.title = mic.ariaLabel = DICTATE[lang()];
  }
  let pending = false;
  new MutationObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; equip(); }); })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });
  equip();
  // Capture phase: the page's own handler would only say "Dein Browser kann keine Sprach-Eingabe".
  document.addEventListener('click', event => {
    const mic = event.target.closest?.('#mic');
    if (!mic) return;
    event.preventDefault(); event.stopImmediatePropagation(); listen(mic);
  }, true);
})();
