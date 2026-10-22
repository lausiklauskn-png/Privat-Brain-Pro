/* Links to get the AI keys (Klaus 2026-10-22: "Nutzer wissen oft nicht, wie schnell sie zu den entsprechenden Stellen
   kommen"). Next to the key field in the settings: one tap opens the provider's key page in the browser.
   Nothing is filled in automatically; the key is still typed or pasted by the person. */
(() => {
  'use strict';
  const links = window.Capacitor?.Plugins?.ProLinks;
  if (typeof links?.open !== 'function') return;
  const PAGES = {
    mistral: 'https://console.mistral.ai/api-keys',
    google: 'https://console.cloud.google.com/apis/credentials'
  };
  const W = {
    de: { mistral: 'Mistral-Schlüssel holen', google: 'Google-Schlüssel holen',
      hintMistral: 'Bei Mistral anmelden, „API Keys“ → „Create new key“, den Schlüssel kopieren und oben einfügen.',
      hintGoogle: 'Bei Google Cloud anmelden, die „Cloud Vision API“ einschalten, dann „Anmeldedaten erstellen“ → „API-Schlüssel“, kopieren und oben einfügen.' },
    en: { mistral: 'Get Mistral key', google: 'Get Google key',
      hintMistral: 'Sign in at Mistral, "API Keys" → "Create new key", copy the key and paste it above.',
      hintGoogle: 'Sign in at Google Cloud, turn on the "Cloud Vision API", then "Create credentials" → "API key", copy and paste it above.' },
    ru: { mistral: 'Получить ключ Mistral', google: 'Получить ключ Google',
      hintMistral: 'Войдите в Mistral, «API Keys» → «Create new key», скопируйте ключ и вставьте его выше.',
      hintGoogle: 'Войдите в Google Cloud, включите «Cloud Vision API», затем «Создать учётные данные» → «Ключ API», скопируйте и вставьте выше.' },
    pl: { mistral: 'Pobierz klucz Mistral', google: 'Pobierz klucz Google',
      hintMistral: 'Zaloguj się w Mistral, „API Keys” → „Create new key”, skopiuj klucz i wklej go powyżej.',
      hintGoogle: 'Zaloguj się w Google Cloud, włącz „Cloud Vision API”, potem „Utwórz dane logowania” → „Klucz API”, skopiuj i wklej powyżej.' }
  };
  const t = k => (W[document.documentElement.lang] || W.de)[k];

  function render() {
    const field = document.getElementById('aiKey')?.closest('label');
    if (!field) return;
    let row = document.getElementById('pb-ai-key-links');
    if (!row) {
      row = document.createElement('div');
      row.id = 'pb-ai-key-links'; row.className = 'pb-ai-key-links';
      for (const provider of Object.keys(PAGES)) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ghost'; b.dataset.keyPage = provider;
        b.addEventListener('click', event => { if (event.isTrusted) void links.open({ url: PAGES[provider] }); });
        row.append(b);
      }
      const hint = document.createElement('p'); hint.className = 'pb-ai-key-hint'; row.append(hint);
      field.after(row);
    }
    const chosen = document.getElementById('aiProvider')?.value || '';
    for (const b of row.querySelectorAll('[data-key-page]')) {
      b.textContent = '↗ ' + t(b.dataset.keyPage);
      // Show the page for the chosen provider; with none chosen, both (the Mistral key also serves "KI beim Schreiben").
      b.hidden = Boolean(chosen) && b.dataset.keyPage !== chosen;
    }
    row.querySelector('.pb-ai-key-hint').textContent = chosen === 'google' ? t('hintGoogle') : t('hintMistral');
  }
  const start = () => { render(); document.getElementById('aiProvider')?.addEventListener('change', render); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
