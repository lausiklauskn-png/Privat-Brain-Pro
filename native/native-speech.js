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
  // Capture phase: the page's own handler would only say "Dein Browser kann keine Sprach-Eingabe".
  document.addEventListener('click', event => {
    const mic = event.target.closest?.('#mic');
    if (!mic) return;
    event.preventDefault(); event.stopImmediatePropagation(); listen(mic);
  }, true);
})();
